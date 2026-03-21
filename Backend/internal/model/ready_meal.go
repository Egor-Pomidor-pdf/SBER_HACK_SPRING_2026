package model

import (
	"time"

	"github.com/google/uuid"
)

// ReadyMeal — готовое блюдо из выбранного магазина
type ReadyMeal struct {
	ID               uuid.UUID             `db:"id" json:"id"`
	RationID         uuid.UUID             `db:"ration_id" json:"ration_id"`
	MealType         string                `db:"meal_type" json:"meal_type"`                     // breakfast/lunch/dinner/snack
	GigaChatName     string                `db:"giga_chat_name" json:"name"`                     // Название блюда от GigaChat
	Kcal             int                   `db:"kcal" json:"kcal"`                               // Калорийность блюда
	TotalPriceRub    int                   `db:"total_price_rub" json:"total_price_rub"`         // Общая цена всех продуктов
	StoreID          string                `db:"store_id" json:"store_id"`                       // ID магазина Купера
	StoreName        string                `db:"store_name" json:"store_name"`                   // Название магазина
	StoreAddress     string                `db:"store_address" json:"address"`                   // Адрес магазина
	DistanceM        int                   `db:"distance_m" json:"distance_m"`                   // Расстояние до магазина
	DeliveryTimeMins int                   `db:"delivery_time_mins" json:"delivery_time_mins"`   // Время доставки
	Ingredients      []ReadyMealIngredient `db:"-" json:"products"`                              // Продукты для блюда (не в БД)
	CreatedAt        time.Time             `db:"created_at" json:"created_at"`
}

// ReadyMealIngredient — ингредиент блюда
type ReadyMealIngredient struct {
	ID          uuid.UUID `db:"id" json:"id"`
	ReadyMealID uuid.UUID `db:"ready_meal_id" json:"-"`
	ProductID   string    `db:"product_id" json:"product_id"` // ID продукта в Mock Kuper
	Name        string    `db:"name" json:"name"`
	Quantity    string    `db:"quantity" json:"quantity"`
	Unit        string    `db:"unit" json:"unit"`
	SortOrder   int       `db:"sort_order" json:"-"`
	ProteinG    int       `db:"protein_g" json:"protein_g"`
	FatG        int       `db:"fat_g" json:"fat_g"`
	CarbsG      int       `db:"carbs_g" json:"carbs_g"`
	Kcal        int       `db:"kcal" json:"kcal"`
	CreatedAt   time.Time `db:"created_at" json:"-"`
}
