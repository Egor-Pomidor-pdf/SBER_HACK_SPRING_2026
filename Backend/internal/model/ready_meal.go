package model

import "github.com/google/uuid"

// ReadyMeal — готовое блюдо из выбранного магазина
type ReadyMeal struct {
	ID             uuid.UUID          `db:"id" json:"id"`
	RationID       uuid.UUID          `db:"ration_id" json:"ration_id"`
	MealType       string             `db:"meal_type" json:"meal_type"`       // breakfast/lunch/dinner/snack
	GigaChatName   string             `db:"giga_chat_name" json:"name"`       // Название блюда от GigaChat
	Kcal           int                `db:"kcal" json:"kcal"`                 // Калорийность блюда
	TotalPriceRub  int                `db:"total_price_rub" json:"total_price_rub"` // Общая цена всех продуктов
	StoreID        string             `db:"store_id" json:"store_id"`         // ID магазина Купера
	StoreName      string             `db:"store_name" json:"store_name"`     // Название магазина
	StoreAddress   string             `db:"store_address" json:"address"`     // Адрес магазина
	DistanceM      int                `db:"distance_m" json:"distance_m"`     // Расстояние до магазина
	DeliveryTimeMins int              `db:"delivery_time_mins" json:"delivery_time_mins"` // Время доставки
	Ingredients    []ReadyMealIngredient `db:"-" json:"products"`                 // Продукты для блюда (не в БД)
}

// ReadyMealIngredient — ингредиент блюда
type ReadyMealIngredient struct {
	ID           uuid.UUID `db:"id" json:"id"`
	ReadyMealID  uuid.UUID `db:"ready_meal_id" json:"-"`
	ProductID    string    `db:"product_id" json:"product_id"` // ID продукта в Mock Kuper
	Name         string    `db:"name" json:"name"`
	Quantity     string    `db:"quantity" json:"quantity"`
	Unit         string    `db:"unit" json:"unit"`
	ProteinG     int       `db:"protein_g" json:"protein_g"`
	FatG         int       `db:"fat_g" json:"fat_g"`
	CarbsG       int       `db:"carbs_g" json:"carbs_g"`
	Kcal         int       `db:"kcal" json:"kcal"`
}

// GigaeatReadyResponse — ответ на /api/v1/gigaeat/ready
type GigaeatReadyResponse struct {
	RationID   uuid.UUID                `json:"ration_id"`
	RationDate string                   `json:"ration_date"`
	TotalKcal  int                       `json:"total_kcal"`
	Meals      []ReadyMeal              `json:"meals"`
	Stores     []KuperStore             `json:"stores"`
	Cart       GigaeatCartResponse      `json:"cart"`
}

// GigaeatCartResponse — корзина с фейковым checkout URL
type GigaeatCartResponse struct {
	CartID      string `json:"cart_id"`
	StoreID     string `json:"store_id"`
	CheckoutURL string `json:"checkout_url"` // Fake: https://kuper.ru/cart/mock
}

// UserMealConsumption — история потребления блюд
type UserMealConsumption struct {
	ID         uuid.UUID `db:"id" json:"id"`
	UserID     uuid.UUID `db:"user_id" json:"user_id"`
	MealType   string    `db:"meal_type" json:"meal_type"`
	MealName   string    `db:"meal_name" json:"meal_name"`
	MealKcal   int       `db:"meal_kcal" json:"meal_kcal"`
	ConsumedAt time.Time `db:"consumed_at" json:"consumed_at"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}
