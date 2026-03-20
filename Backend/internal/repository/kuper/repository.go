package kuper

import (
	"context"
	"fmt"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

func (r *Repo) SaveStores(ctx context.Context, stores []model.KuperStore) error {
	for _, s := range stores {
		_, err := r.db.Exec(ctx,
			`INSERT INTO kuper_stores (id, ration_id, store_id, store_name, distance_m, is_selected)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			s.ID, s.RationID, s.StoreID, s.StoreName, s.DistanceM, s.IsSelected,
		)
		if err != nil {
			return fmt.Errorf("insert store %s: %w", s.StoreName, err)
		}
	}
	return nil
}

func (r *Repo) GetStoreByID(ctx context.Context, id uuid.UUID) (*model.KuperStore, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, ration_id, store_id, store_name, distance_m, is_selected
		 FROM kuper_stores WHERE id = $1`, id)

	var s model.KuperStore
	err := row.Scan(&s.ID, &s.RationID, &s.StoreID, &s.StoreName, &s.DistanceM, &s.IsSelected)
	if err != nil {
		return nil, fmt.Errorf("scan store: %w", err)
	}
	return &s, nil
}

func (r *Repo) SelectStore(ctx context.Context, storeID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE kuper_stores SET is_selected = TRUE WHERE id = $1`, storeID)
	return err
}

func (r *Repo) SaveCart(ctx context.Context, cart *model.KuperCart, items []model.KuperCartItem) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`INSERT INTO kuper_carts (id, ration_id, store_id, total_price_rub, found_count, total_count, checkout_url)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		cart.ID, cart.RationID, cart.StoreID, cart.TotalPriceRub, cart.FoundCount, cart.TotalCount, cart.CheckoutURL,
	)
	if err != nil {
		return fmt.Errorf("insert cart: %w", err)
	}

	for _, item := range items {
		_, err = tx.Exec(ctx,
			`INSERT INTO kuper_cart_items (id, cart_id, ingredient_id, kuper_product_id, kuper_product_name, price_rub, found)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			item.ID, item.CartID, item.IngredientID, item.KuperProductID, item.KuperProductName, item.PriceRub, item.Found,
		)
		if err != nil {
			return fmt.Errorf("insert cart item: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *Repo) GetCartByRationID(ctx context.Context, rationID uuid.UUID) (*model.KuperCart, []model.KuperCartItem, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, ration_id, store_id, total_price_rub, found_count, total_count, checkout_url
		 FROM kuper_carts WHERE ration_id = $1`, rationID)

	var cart model.KuperCart
	err := row.Scan(&cart.ID, &cart.RationID, &cart.StoreID, &cart.TotalPriceRub, &cart.FoundCount, &cart.TotalCount, &cart.CheckoutURL)
	if err != nil {
		return nil, nil, fmt.Errorf("scan cart: %w", err)
	}

	rows, err := r.db.Query(ctx,
		`SELECT ci.id, ci.cart_id, ci.ingredient_id, ci.kuper_product_id, ci.kuper_product_name, ci.price_rub, ci.found, ri.name
		 FROM kuper_cart_items ci
		 JOIN ration_ingredients ri ON ri.id = ci.ingredient_id
		 WHERE ci.cart_id = $1`, cart.ID)
	if err != nil {
		return &cart, nil, err
	}
	defer rows.Close()

	var items []model.KuperCartItem
	for rows.Next() {
		var item model.KuperCartItem
		if err := rows.Scan(&item.ID, &item.CartID, &item.IngredientID, &item.KuperProductID, &item.KuperProductName, &item.PriceRub, &item.Found, &item.IngredientName); err != nil {
			return &cart, nil, err
		}
		items = append(items, item)
	}
	return &cart, items, rows.Err()
}
