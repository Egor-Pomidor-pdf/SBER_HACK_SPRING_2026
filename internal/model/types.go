package model

import (
	"time"

	"github.com/google/uuid"
)

// UserProfile represents a user's nutrition profile.
type UserProfile struct {
	ID                  uuid.UUID `json:"id" db:"id"`
	UserID              uuid.UUID `json:"user_id" db:"user_id"`
	RemainingKcal       int       `json:"remaining_kcal" db:"remaining_kcal"`
	RemainingProteinG   int       `json:"remaining_protein_g" db:"remaining_protein_g"`
	RemainingFatG       int       `json:"remaining_fat_g" db:"remaining_fat_g"`
	RemainingCarbsG     int       `json:"remaining_carbs_g" db:"remaining_carbs_g"`
	DailyKcal           int       `json:"daily_kcal" db:"daily_kcal"`
	Goal                string    `json:"goal" db:"goal"`
	DietaryRestrictions string    `json:"dietary_restrictions" db:"dietary_restrictions"`
	Lat                 float64   `json:"lat" db:"lat"`
	Lng                 float64   `json:"lng" db:"lng"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
}

// DailyRation represents a generated daily meal plan.
type DailyRation struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	UserID      uuid.UUID  `json:"user_id" db:"user_id"`
	RationDate  string     `json:"ration_date" db:"ration_date"`
	TotalKcal   int        `json:"total_kcal" db:"total_kcal"`
	Status      string     `json:"status" db:"status"`
	GigaChatRaw *string    `json:"gigachat_raw,omitempty" db:"gigachat_raw"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

// RationMeal represents a single meal within a ration.
type RationMeal struct {
	ID        uuid.UUID `json:"id" db:"id"`
	RationID  uuid.UUID `json:"ration_id" db:"ration_id"`
	MealType  string    `json:"meal_type" db:"meal_type"`
	Name      string    `json:"name" db:"name"`
	Kcal      int       `json:"kcal" db:"kcal"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
}

// RationIngredient represents a shopping list item.
type RationIngredient struct {
	ID        uuid.UUID `json:"id" db:"id"`
	RationID  uuid.UUID `json:"ration_id" db:"ration_id"`
	Name      string    `json:"name" db:"name"`
	Quantity  string    `json:"quantity" db:"quantity"`
	Unit      string    `json:"unit" db:"unit"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
}

// KuperStore represents a nearby store from Kuper.
type KuperStore struct {
	ID         uuid.UUID `json:"id" db:"id"`
	RationID   uuid.UUID `json:"ration_id" db:"ration_id"`
	StoreID    string    `json:"store_id" db:"store_id"`
	StoreName  string    `json:"store_name" db:"store_name"`
	DistanceM  int       `json:"distance_m" db:"distance_m"`
	IsSelected bool      `json:"is_selected" db:"is_selected"`
}

// KuperCart represents a shopping cart for a selected store.
type KuperCart struct {
	ID            uuid.UUID `json:"id" db:"id"`
	RationID      uuid.UUID `json:"ration_id" db:"ration_id"`
	StoreID       uuid.UUID `json:"store_id" db:"store_id"`
	TotalPriceRub int       `json:"total_price_rub" db:"total_price_rub"`
	FoundCount    int       `json:"found_count" db:"found_count"`
	TotalCount    int       `json:"total_count" db:"total_count"`
	CheckoutURL   string    `json:"checkout_url" db:"checkout_url"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// KuperCartItem represents a product search result for an ingredient.
type KuperCartItem struct {
	ID               uuid.UUID `json:"id" db:"id"`
	CartID           uuid.UUID `json:"cart_id" db:"cart_id"`
	IngredientID     uuid.UUID `json:"ingredient_id" db:"ingredient_id"`
	KuperProductID   *string   `json:"kuper_product_id,omitempty" db:"kuper_product_id"`
	KuperProductName *string   `json:"kuper_product_name,omitempty" db:"kuper_product_name"`
	PriceRub         int       `json:"price_rub" db:"price_rub"`
	Found            bool      `json:"found" db:"found"`
}

// --- Request / Response DTOs ---

type GenerateRationRequest struct {
	UserID string  `json:"user_id" binding:"required"`
	Lat    float64 `json:"lat" binding:"required"`
	Lng    float64 `json:"lng" binding:"required"`
}

type GenerateRationResponse struct {
	RationID    uuid.UUID              `json:"ration_id"`
	Meals       []MealResponse         `json:"meals"`
	Ingredients []IngredientResponse   `json:"ingredients"`
	Stores      []StoreResponse        `json:"stores"`
}

type MealResponse struct {
	MealType string `json:"meal_type"`
	Name     string `json:"name"`
	Kcal     int    `json:"kcal"`
}

type IngredientResponse struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Quantity string    `json:"quantity"`
	Unit     string    `json:"unit"`
}

type StoreResponse struct {
	ID        uuid.UUID `json:"id"`
	StoreID   string    `json:"store_id"`
	StoreName string    `json:"store_name"`
	DistanceM int       `json:"distance_m"`
}

type CreateCartRequest struct {
	StoreID string `json:"store_id" binding:"required"`
}

type CreateCartResponse struct {
	CartID        uuid.UUID          `json:"cart_id"`
	TotalPriceRub int               `json:"total_price_rub"`
	FoundCount    int                `json:"found_count"`
	TotalCount    int                `json:"total_count"`
	CheckoutURL   string            `json:"checkout_url"`
	Items         []CartItemResponse `json:"items"`
}

type CartItemResponse struct {
	IngredientName string  `json:"ingredient_name"`
	ProductName    *string `json:"product_name"`
	PriceRub       int     `json:"price_rub"`
	Found          bool    `json:"found"`
}

type RationHistoryItem struct {
	ID         uuid.UUID      `json:"id"`
	RationDate string         `json:"ration_date"`
	TotalKcal  int            `json:"total_kcal"`
	Status     string         `json:"status"`
	CreatedAt  time.Time      `json:"created_at"`
	Meals      []MealResponse `json:"meals"`
}

// --- GigaChat DTO ---

type GigaChatRationResponse struct {
	Meals        []GigaChatMeal       `json:"meals"`
	ShoppingList []GigaChatIngredient `json:"shopping_list"`
}

type GigaChatMeal struct {
	MealType string `json:"meal_type"`
	Name     string `json:"name"`
	Kcal     int    `json:"kcal"`
}

type GigaChatIngredient struct {
	Name     string `json:"name"`
	Quantity string `json:"quantity"`
	Unit     string `json:"unit"`
}

// --- Kuper DTOs ---

type KuperNearbyStore struct {
	StoreID   string `json:"store_id"`
	StoreName string `json:"store_name"`
	DistanceM int    `json:"distance_m"`
}

type KuperSearchResult struct {
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name"`
	PriceRub    int    `json:"price_rub"`
	Found       bool   `json:"found"`
}

type KuperCartCreateResponse struct {
	CartID      string `json:"cart_id"`
	CheckoutURL string `json:"checkout_url"`
}
