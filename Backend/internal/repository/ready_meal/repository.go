package ready_meal

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

func (r *Repo) CreateReadyMeal(ctx context.Context, meal *ReadyMeal) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO ready_meals (id, ration_id, meal_type, giga_chat_name, kcal, total_price_rub, store_id, store_name, store_address, distance_m, delivery_time_mins, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		meal.ID, meal.RationID, meal.MealType, meal.GigaChatName, meal.Kcal, meal.TotalPriceRub, meal.StoreID, meal.StoreName, meal.StoreAddress, meal.DistanceM, meal.DeliveryTimeMins, meal.CreatedAt,
	)
	return err
}

func (r *Repo) CreateReadyMealIngredients(ctx context.Context, ingredients []ReadyMealIngredient) error {
	for _, ing := range ingredients {
		_, err := r.db.Exec(ctx,
			`INSERT INTO ready_meal_ingredients (id, ready_meal_id, product_id, name, quantity, unit, sort_order, protein_g, fat_g, carbs_g, kcal, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			ing.ID, ing.ReadyMealID, ing.ProductID, ing.Name, ing.Quantity, ing.Unit, ing.SortOrder, ing.ProteinG, ing.FatG, ing.CarbsG, ing.Kcal, ing.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("insert ingredient %s: %w", ing.Name, err)
		}
	}
	return nil
}

func (r *Repo) GetReadyMealsByRationID(ctx context.Context, rationID string) ([]ReadyMeal, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, ration_id, meal_type, giga_chat_name, kcal, total_price_rub, store_id, store_name, store_address, distance_m, delivery_time_mins, created_at
		 FROM ready_meals WHERE ration_id = $1`, rationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ReadyMeal
	for rows.Next() {
		var meal ReadyMeal
		if err := rows.Scan(&meal.ID, &meal.RationID, &meal.MealType, &meal.GigaChatName, &meal.Kcal, &meal.TotalPriceRub, &meal.StoreID, &meal.StoreName, &meal.StoreAddress, &meal.DistanceM, &meal.DeliveryTimeMins, &meal.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, meal)
	}
	return result, rows.Err()
}

func (r *Repo) GetReadyMealIngredientsByMealID(ctx context.Context, mealID string) ([]ReadyMealIngredient, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, ready_meal_id, product_id, name, quantity, unit, sort_order, protein_g, fat_g, carbs_g, kcal, created_at
		 FROM ready_meal_ingredients WHERE ready_meal_id = $1 ORDER BY sort_order`, mealID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ReadyMealIngredient
	for rows.Next() {
		var ing ReadyMealIngredient
		if err := rows.Scan(&ing.ID, &ing.ReadyMealID, &ing.ProductID, &ing.Name, &ing.Quantity, &ing.Unit, &ing.SortOrder, &ing.ProteinG, &ing.FatG, &ing.CarbsG, &ing.Kcal, &ing.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, ing)
	}
	return result, rows.Err()
}

// ConvertToModel конвертирует ReadyMeal в model.ReadyMeal
func ConvertToModel(rMeal ReadyMeal, ingredients []ReadyMealIngredient) model.ReadyMeal {
	modelIngredients := make([]model.ReadyMealIngredient, len(ingredients))
	for i, ing := range ingredients {
		modelIngredients[i] = model.ReadyMealIngredient{
			ID:          ing.ID,
			ReadyMealID: ing.ReadyMealID,
			ProductID:   ing.ProductID,
			Name:        ing.Name,
			Quantity:    ing.Quantity,
			Unit:        ing.Unit,
			ProteinG:    ing.ProteinG,
			FatG:        ing.FatG,
			CarbsG:      ing.CarbsG,
			Kcal:        ing.Kcal,
		}
	}

	return model.ReadyMeal{
		ID:              rMeal.ID,
		RationID:        rMeal.RationID,
		MealType:        rMeal.MealType,
		GigaChatName:    rMeal.GigaChatName,
		Kcal:            rMeal.Kcal,
		TotalPriceRub:   rMeal.TotalPriceRub,
		StoreID:         rMeal.StoreID,
		StoreName:       rMeal.StoreName,
		StoreAddress:    rMeal.StoreAddress,
		DistanceM:       rMeal.DistanceM,
		DeliveryTimeMins: rMeal.DeliveryTimeMins,
		Ingredients:     modelIngredients,
	}
}
