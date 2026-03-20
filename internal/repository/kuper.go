package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/loks1k192/ration-service/internal/model"
)

type KuperRepository struct {
	db *sql.DB
}

func NewKuperRepository(db *sql.DB) *KuperRepository {
	return &KuperRepository{db: db}
}

// SelectStore marks a store as selected for a ration.
func (r *KuperRepository) SelectStore(ctx context.Context, rationID, storeID uuid.UUID) error {
	// Reset all selections for this ration
	_, err := r.db.ExecContext(ctx,
		`UPDATE kuper_stores SET is_selected = FALSE WHERE ration_id = $1`, rationID)
	if err != nil {
		return fmt.Errorf("reset store selection: %w", err)
	}

	// Mark the chosen one
	_, err = r.db.ExecContext(ctx,
		`UPDATE kuper_stores SET is_selected = TRUE WHERE id = $1 AND ration_id = $2`, storeID, rationID)
	if err != nil {
		return fmt.Errorf("select store: %w", err)
	}
	return nil
}

// GetStoreByID returns a store by its UUID.
func (r *KuperRepository) GetStoreByID(ctx context.Context, storeID uuid.UUID) (*model.KuperStore, error) {
	s := &model.KuperStore{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, ration_id, store_id, store_name, distance_m, is_selected
		 FROM kuper_stores WHERE id = $1`, storeID,
	).Scan(&s.ID, &s.RationID, &s.StoreID, &s.StoreName, &s.DistanceM, &s.IsSelected)
	if err != nil {
		return nil, fmt.Errorf("get store: %w", err)
	}
	return s, nil
}

// SaveCart persists the cart and its items in a single transaction.
func (r *KuperRepository) SaveCart(
	ctx context.Context,
	rationID, storeID uuid.UUID,
	totalPriceRub, foundCount, totalCount int,
	checkoutURL string,
	items []model.KuperCartItem,
) (*model.KuperCart, []model.KuperCartItem, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	cart := &model.KuperCart{}
	err = tx.QueryRowContext(ctx,
		`INSERT INTO kuper_carts (ration_id, store_id, total_price_rub, found_count, total_count, checkout_url)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, ration_id, store_id, total_price_rub, found_count, total_count, checkout_url, created_at`,
		rationID, storeID, totalPriceRub, foundCount, totalCount, checkoutURL,
	).Scan(&cart.ID, &cart.RationID, &cart.StoreID, &cart.TotalPriceRub, &cart.FoundCount, &cart.TotalCount, &cart.CheckoutURL, &cart.CreatedAt)
	if err != nil {
		return nil, nil, fmt.Errorf("insert kuper_carts: %w", err)
	}

	savedItems := make([]model.KuperCartItem, 0, len(items))
	for _, item := range items {
		saved := model.KuperCartItem{}
		err = tx.QueryRowContext(ctx,
			`INSERT INTO kuper_cart_items (cart_id, ingredient_id, kuper_product_id, kuper_product_name, price_rub, found)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING id, cart_id, ingredient_id, kuper_product_id, kuper_product_name, price_rub, found`,
			cart.ID, item.IngredientID, item.KuperProductID, item.KuperProductName, item.PriceRub, item.Found,
		).Scan(&saved.ID, &saved.CartID, &saved.IngredientID, &saved.KuperProductID, &saved.KuperProductName, &saved.PriceRub, &saved.Found)
		if err != nil {
			return nil, nil, fmt.Errorf("insert kuper_cart_items: %w", err)
		}
		savedItems = append(savedItems, saved)
	}

	// Update ration status to ordered
	_, err = tx.ExecContext(ctx, `UPDATE daily_rations SET status = 'ordered' WHERE id = $1`, rationID)
	if err != nil {
		return nil, nil, fmt.Errorf("update ration status: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, nil, fmt.Errorf("commit tx: %w", err)
	}

	return cart, savedItems, nil
}
