package ready_meal

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Repository — интерфейс репозитория готовых блюд
type Repository interface {
	CreateReadyMeal(ctx context.Context, meal *ReadyMeal) error
	CreateReadyMealIngredients(ctx context.Context, ingredients []ReadyMealIngredient) error
	GetReadyMealsByRationID(ctx context.Context, rationID string) ([]ReadyMeal, error)
	GetReadyMealIngredientsByMealID(ctx context.Context, mealID string) ([]ReadyMealIngredient, error)
}

// ReadyMeal — тип для репозитория
type ReadyMeal struct {
	ID             uuid.UUID       `db:"id"`
	RationID       uuid.UUID       `db:"ration_id"`
	MealType       string          `db:"meal_type"`
	GigaChatName   string          `db:"giga_chat_name"`
	Kcal           int             `db:"kcal"`
	TotalPriceRub  int             `db:"total_price_rub"`
	StoreID        string          `db:"store_id"`
	StoreName      string          `db:"store_name"`
	StoreAddress   string          `db:"store_address"`
	DistanceM      int             `db:"distance_m"`
	DeliveryTimeMins int           `db:"delivery_time_mins"`
	CreatedAt      time.Time       `db:"created_at"`
}

// ReadyMealIngredient — тип для репозитория
type ReadyMealIngredient struct {
	ID           uuid.UUID `db:"id"`
	ReadyMealID  uuid.UUID `db:"ready_meal_id"`
	ProductID    string    `db:"product_id"`
	Name         string    `db:"name"`
	Quantity     string    `db:"quantity"`
	Unit         string    `db:"unit"`
	SortOrder    int       `db:"sort_order"`
	ProteinG     int       `db:"protein_g"`
	FatG         int       `db:"fat_g"`
	CarbsG       int       `db:"carbs_g"`
	Kcal         int       `db:"kcal"`
	CreatedAt    time.Time `db:"created_at"`
}
