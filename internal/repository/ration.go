package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/loks1k192/ration-service/internal/model"
)

type RationRepository struct {
	db *sql.DB
}

func NewRationRepository(db *sql.DB) *RationRepository {
	return &RationRepository{db: db}
}

// SaveRation persists a full ration (header + meals + ingredients + stores) in a single transaction.
func (r *RationRepository) SaveRation(
	ctx context.Context,
	userID uuid.UUID,
	totalKcal int,
	gigachatRaw json.RawMessage,
	meals []model.GigaChatMeal,
	ingredients []model.GigaChatIngredient,
	stores []model.KuperNearbyStore,
) (*model.DailyRation, []model.RationMeal, []model.RationIngredient, []model.KuperStore, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	// Insert daily_rations
	ration := &model.DailyRation{}
	rawStr := string(gigachatRaw)
	err = tx.QueryRowContext(ctx,
		`INSERT INTO daily_rations (user_id, total_kcal, gigachat_raw)
		 VALUES ($1, $2, $3)
		 RETURNING id, user_id, ration_date, total_kcal, status, gigachat_raw, created_at`,
		userID, totalKcal, rawStr,
	).Scan(&ration.ID, &ration.UserID, &ration.RationDate, &ration.TotalKcal, &ration.Status, &ration.GigaChatRaw, &ration.CreatedAt)
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("insert daily_rations: %w", err)
	}

	// Insert meals
	savedMeals := make([]model.RationMeal, 0, len(meals))
	for i, m := range meals {
		meal := model.RationMeal{}
		err = tx.QueryRowContext(ctx,
			`INSERT INTO ration_meals (ration_id, meal_type, name, kcal, sort_order)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id, ration_id, meal_type, name, kcal, sort_order`,
			ration.ID, m.MealType, m.Name, m.Kcal, i,
		).Scan(&meal.ID, &meal.RationID, &meal.MealType, &meal.Name, &meal.Kcal, &meal.SortOrder)
		if err != nil {
			return nil, nil, nil, nil, fmt.Errorf("insert ration_meals: %w", err)
		}
		savedMeals = append(savedMeals, meal)
	}

	// Insert ingredients
	savedIngredients := make([]model.RationIngredient, 0, len(ingredients))
	for i, ing := range ingredients {
		ingredient := model.RationIngredient{}
		err = tx.QueryRowContext(ctx,
			`INSERT INTO ration_ingredients (ration_id, name, quantity, unit, sort_order)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id, ration_id, name, quantity, unit, sort_order`,
			ration.ID, ing.Name, ing.Quantity, ing.Unit, i,
		).Scan(&ingredient.ID, &ingredient.RationID, &ingredient.Name, &ingredient.Quantity, &ingredient.Unit, &ingredient.SortOrder)
		if err != nil {
			return nil, nil, nil, nil, fmt.Errorf("insert ration_ingredients: %w", err)
		}
		savedIngredients = append(savedIngredients, ingredient)
	}

	// Insert stores
	savedStores := make([]model.KuperStore, 0, len(stores))
	for _, s := range stores {
		store := model.KuperStore{}
		err = tx.QueryRowContext(ctx,
			`INSERT INTO kuper_stores (ration_id, store_id, store_name, distance_m)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, ration_id, store_id, store_name, distance_m, is_selected`,
			ration.ID, s.StoreID, s.StoreName, s.DistanceM,
		).Scan(&store.ID, &store.RationID, &store.StoreID, &store.StoreName, &store.DistanceM, &store.IsSelected)
		if err != nil {
			return nil, nil, nil, nil, fmt.Errorf("insert kuper_stores: %w", err)
		}
		savedStores = append(savedStores, store)
	}

	if err = tx.Commit(); err != nil {
		return nil, nil, nil, nil, fmt.Errorf("commit tx: %w", err)
	}

	return ration, savedMeals, savedIngredients, savedStores, nil
}

// GetRationByID returns a ration with its meals.
func (r *RationRepository) GetRationByID(ctx context.Context, rationID uuid.UUID) (*model.DailyRation, []model.RationMeal, []model.RationIngredient, []model.KuperStore, error) {
	ration := &model.DailyRation{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, ration_date, total_kcal, status, gigachat_raw, created_at
		 FROM daily_rations WHERE id = $1`, rationID,
	).Scan(&ration.ID, &ration.UserID, &ration.RationDate, &ration.TotalKcal, &ration.Status, &ration.GigaChatRaw, &ration.CreatedAt)
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("get ration: %w", err)
	}

	meals, err := r.getMealsByRationID(ctx, rationID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	ingredients, err := r.getIngredientsByRationID(ctx, rationID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	stores, err := r.getStoresByRationID(ctx, rationID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	return ration, meals, ingredients, stores, nil
}

// GetHistory returns rations for a user, ordered by date descending.
func (r *RationRepository) GetHistory(ctx context.Context, userID uuid.UUID) ([]model.RationHistoryItem, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, ration_date, total_kcal, status, created_at
		 FROM daily_rations WHERE user_id = $1
		 ORDER BY ration_date DESC, created_at DESC
		 LIMIT 50`, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("get history: %w", err)
	}
	defer rows.Close()

	var items []model.RationHistoryItem
	for rows.Next() {
		item := model.RationHistoryItem{}
		if err := rows.Scan(&item.ID, &item.RationDate, &item.TotalKcal, &item.Status, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan history row: %w", err)
		}

		meals, err := r.getMealsByRationID(ctx, item.ID)
		if err != nil {
			return nil, err
		}
		for _, m := range meals {
			item.Meals = append(item.Meals, model.MealResponse{
				MealType: m.MealType,
				Name:     m.Name,
				Kcal:     m.Kcal,
			})
		}

		items = append(items, item)
	}
	return items, rows.Err()
}

// GetIngredientsByRationID returns ingredients for a ration.
func (r *RationRepository) GetIngredientsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationIngredient, error) {
	return r.getIngredientsByRationID(ctx, rationID)
}

func (r *RationRepository) getMealsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationMeal, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, ration_id, meal_type, name, kcal, sort_order
		 FROM ration_meals WHERE ration_id = $1 ORDER BY sort_order`, rationID,
	)
	if err != nil {
		return nil, fmt.Errorf("get meals: %w", err)
	}
	defer rows.Close()

	var meals []model.RationMeal
	for rows.Next() {
		m := model.RationMeal{}
		if err := rows.Scan(&m.ID, &m.RationID, &m.MealType, &m.Name, &m.Kcal, &m.SortOrder); err != nil {
			return nil, fmt.Errorf("scan meal: %w", err)
		}
		meals = append(meals, m)
	}
	return meals, rows.Err()
}

func (r *RationRepository) getIngredientsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationIngredient, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, ration_id, name, quantity, unit, sort_order
		 FROM ration_ingredients WHERE ration_id = $1 ORDER BY sort_order`, rationID,
	)
	if err != nil {
		return nil, fmt.Errorf("get ingredients: %w", err)
	}
	defer rows.Close()

	var ingredients []model.RationIngredient
	for rows.Next() {
		ing := model.RationIngredient{}
		if err := rows.Scan(&ing.ID, &ing.RationID, &ing.Name, &ing.Quantity, &ing.Unit, &ing.SortOrder); err != nil {
			return nil, fmt.Errorf("scan ingredient: %w", err)
		}
		ingredients = append(ingredients, ing)
	}
	return ingredients, rows.Err()
}

func (r *RationRepository) getStoresByRationID(ctx context.Context, rationID uuid.UUID) ([]model.KuperStore, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, ration_id, store_id, store_name, distance_m, is_selected
		 FROM kuper_stores WHERE ration_id = $1 ORDER BY distance_m`, rationID,
	)
	if err != nil {
		return nil, fmt.Errorf("get stores: %w", err)
	}
	defer rows.Close()

	var stores []model.KuperStore
	for rows.Next() {
		s := model.KuperStore{}
		if err := rows.Scan(&s.ID, &s.RationID, &s.StoreID, &s.StoreName, &s.DistanceM, &s.IsSelected); err != nil {
			return nil, fmt.Errorf("scan store: %w", err)
		}
		stores = append(stores, s)
	}
	return stores, rows.Err()
}

// UpdateStatusOrdered updates the ration status to "ordered".
func (r *RationRepository) UpdateStatusOrdered(ctx context.Context, rationID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `UPDATE daily_rations SET status = 'ordered' WHERE id = $1`, rationID)
	if err != nil {
		return fmt.Errorf("update status: %w", err)
	}
	return nil
}
