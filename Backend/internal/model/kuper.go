package model

import (
	"time"

	"github.com/google/uuid"
)

type KuperStore struct {
	ID         uuid.UUID `db:"id"         json:"id"`
	RationID   uuid.UUID `db:"ration_id"  json:"-"`
	StoreID    string    `db:"store_id"   json:"store_id"`
	StoreName  string    `db:"store_name" json:"store_name"`
	DistanceM  int       `db:"distance_m" json:"distance_m"`
	IsSelected bool      `db:"is_selected" json:"-"`
	StoreAddress  string `db:"store_address" json:"address"` // Адрес магазина
	DeliveryTimeMins int `db:"delivery_time_mins" json:"delivery_time_mins"` // Время доставки
}

type KuperCart struct {
	ID            uuid.UUID `db:"id"`
	RationID      uuid.UUID `db:"ration_id"`
	StoreID       uuid.UUID `db:"store_id"`
	TotalPriceRub int       `db:"total_price_rub"`
	FoundCount    int       `db:"found_count"`
	TotalCount    int       `db:"total_count"`
	CheckoutURL   string    `db:"checkout_url"`
	CreatedAt     time.Time `db:"created_at"`
}

type KuperCartItem struct {
	ID               uuid.UUID `db:"id"`
	CartID           uuid.UUID `db:"cart_id"`
	IngredientID     uuid.UUID `db:"ingredient_id"`
	IngredientName   string    `db:"-"                  json:"ingredient_name"`
	KuperProductID   string    `db:"kuper_product_id"`
	KuperProductName string    `db:"kuper_product_name" json:"product_name"`
	PriceRub         int       `db:"price_rub"          json:"price_rub"`
	Found            bool      `db:"found"              json:"found"`
}

// DTO для Kuper API

type KuperNearbyStore struct {
	StoreID          string `json:"store_id"`
	StoreName        string `json:"store_name"`
	DistanceM        int    `json:"distance_m"`
	Address          string `json:"address"`
	DeliveryTimeMins int    `json:"delivery_time_mins"`
}

type KuperSearchResult struct {
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name"`
	PriceRub    int    `json:"price_rub"`
	Found       bool   `json:"found"`
	Kcal        int    `json:"kcal"` // добавлено для демо
}

type KuperCartCreateResponse struct {
	CartID      string `json:"cart_id"`
	CheckoutURL string `json:"checkout_url"`
}

// Новые структуры для разделения магазинов на delivery/walk

// StoreDelivery — магазин для вкладки "Заказать доставку"
type StoreDelivery struct {
	ID               uuid.UUID `db:"id"                json:"id"`
	RationID         uuid.UUID `db:"ration_id"         json:"-"`
	StoreID          string    `db:"store_id"          json:"store_id"`
	StoreName        string    `db:"store_name"        json:"store_name"`
	StoreAddress     string    `db:"store_address"     json:"address"`
	DistanceM        int       `db:"distance_m"        json:"distance_m"`
	DeliveryTimeMins int       `db:"delivery_time_mins" json:"delivery_time_mins"`
	TotalPriceRub    int       `db:"-"                 json:"total_price_rub"`
	FoundCount       int       `db:"-"                 json:"found_count"`
	TotalCount       int       `db:"-"                 json:"total_count"`
	MatchPercent     int       `db:"-"                 json:"-"` // только для сортировки, клиенту не отдаём
}

// StoreWalk — магазин для вкладки "Дойти пешком"
type StoreWalk struct {
	ID               uuid.UUID `db:"id"             json:"id"`
	RationID         uuid.UUID `db:"ration_id"      json:"-"`
	StoreID          string    `db:"store_id"       json:"store_id"`
	StoreName        string    `db:"store_name"     json:"store_name"`
	StoreAddress     string    `db:"store_address"  json:"address"`
	DistanceM        int       `db:"distance_m"     json:"distance_m"`
	WalkingTimeMins  int       `db:"-"              json:"walking_time_mins"`
	CaloriesBurned   int       `db:"-"              json:"calories_burned"`
	TotalPriceRub    int       `db:"-"              json:"total_price_rub"`
	FoundCount       int       `db:"-"              json:"found_count"`
	TotalCount       int       `db:"-"              json:"total_count"`
	MatchPercent     int       `db:"-"              json:"-"` // только для сортировки, клиенту не отдаём
}

// ConsumedMealDTO — данные о съеденном блюде
type ConsumedMealDTO struct {
	MealType  string `json:"meal_type"` // breakfast / lunch / dinner / snack
	Name      string `json:"name"`
	KcalEaten int    `json:"kcal_eaten"`
	ProteinG  int    `json:"protein_g"`
	FatG      int    `json:"fat_g"`
	CarbsG    int    `json:"carbs_g"`
}
