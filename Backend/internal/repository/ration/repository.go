package ration

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

func (r *Repo) CreateRation(ctx context.Context, ration *model.DailyRation) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO daily_rations (id, user_id, ration_date, total_kcal, status, gigachat_raw, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		ration.ID, ration.UserID, ration.RationDate, ration.TotalKcal, ration.Status, ration.GigachatRaw, ration.CreatedAt,
	)
	return err
}

func (r *Repo) CreateMeals(ctx context.Context, meals []model.RationMeal) error {
	for _, m := range meals {
		_, err := r.db.Exec(ctx,
			`INSERT INTO ration_meals (id, ration_id, meal_type, name, kcal, sort_order)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			m.ID, m.RationID, m.MealType, m.Name, m.Kcal, m.SortOrder,
		)
		if err != nil {
			return fmt.Errorf("insert meal %s: %w", m.Name, err)
		}
	}
	return nil
}

func (r *Repo) CreateIngredients(ctx context.Context, ingredients []model.RationIngredient) error {
	for _, ing := range ingredients {
		_, err := r.db.Exec(ctx,
			`INSERT INTO ration_ingredients (id, ration_id, name, quantity, unit, sort_order)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			ing.ID, ing.RationID, ing.Name, ing.Quantity, ing.Unit, ing.SortOrder,
		)
		if err != nil {
			return fmt.Errorf("insert ingredient %s: %w", ing.Name, err)
		}
	}
	return nil
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

func (r *Repo) GetRationByID(ctx context.Context, id uuid.UUID) (*model.DailyRation, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, user_id, ration_date, total_kcal, status, gigachat_raw, created_at
		 FROM daily_rations WHERE id = $1`, id)

	var d model.DailyRation
	err := row.Scan(&d.ID, &d.UserID, &d.RationDate, &d.TotalKcal, &d.Status, &d.GigachatRaw, &d.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("scan ration: %w", err)
	}
	return &d, nil
}

func (r *Repo) GetIngredientsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationIngredient, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, ration_id, name, quantity, unit, sort_order
		 FROM ration_ingredients WHERE ration_id = $1 ORDER BY sort_order`, rationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []model.RationIngredient
	for rows.Next() {
		var ing model.RationIngredient
		if err := rows.Scan(&ing.ID, &ing.RationID, &ing.Name, &ing.Quantity, &ing.Unit, &ing.SortOrder); err != nil {
			return nil, err
		}
		result = append(result, ing)
	}
	return result, rows.Err()
}

func (r *Repo) GetMealsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationMeal, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, ration_id, meal_type, name, kcal, sort_order
		 FROM ration_meals WHERE ration_id = $1 ORDER BY sort_order`, rationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []model.RationMeal
	for rows.Next() {
		var m model.RationMeal
		if err := rows.Scan(&m.ID, &m.RationID, &m.MealType, &m.Name, &m.Kcal, &m.SortOrder); err != nil {
			return nil, err
		}
		result = append(result, m)
	}
	return result, rows.Err()
}

func (r *Repo) GetStoresByRationID(ctx context.Context, rationID uuid.UUID) ([]model.KuperStore, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, ration_id, store_id, store_name, distance_m, is_selected
		 FROM kuper_stores WHERE ration_id = $1 ORDER BY distance_m`, rationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []model.KuperStore
	for rows.Next() {
		var s model.KuperStore
		if err := rows.Scan(&s.ID, &s.RationID, &s.StoreID, &s.StoreName, &s.DistanceM, &s.IsSelected); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, rows.Err()
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

func (r *Repo) UpdateRationStatus(ctx context.Context, rationID uuid.UUID, status string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE daily_rations SET status = $1 WHERE id = $2`, status, rationID)
	return err
}

func (r *Repo) GetRationsByUserID(ctx context.Context, userID uuid.UUID) ([]model.DailyRation, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, ration_date, total_kcal, status, gigachat_raw, created_at
		 FROM daily_rations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []model.DailyRation
	for rows.Next() {
		var d model.DailyRation
		if err := rows.Scan(&d.ID, &d.UserID, &d.RationDate, &d.TotalKcal, &d.Status, &d.GigachatRaw, &d.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, d)
	}
	return result, rows.Err()
}
