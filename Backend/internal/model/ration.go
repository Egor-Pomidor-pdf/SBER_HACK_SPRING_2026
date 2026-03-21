package model

import (
	"time"

	"github.com/google/uuid"
)

type DailyRation struct {
	ID          uuid.UUID `db:"id"`
	UserID      uuid.UUID `db:"user_id"`
	RationDate  time.Time `db:"ration_date"`
	TotalKcal   int       `db:"total_kcal"`
	Status      string    `db:"status"` // generated / consumed
	GigachatRaw string    `db:"gigachat_raw"`
	CreatedAt   time.Time `db:"created_at"`
}

type RationMeal struct {
	ID        uuid.UUID `db:"id"         json:"id"`
	RationID  uuid.UUID `db:"ration_id"  json:"-"`
	MealType  string    `db:"meal_type"  json:"meal_type"` // breakfast / lunch / dinner / snack
	Name      string    `db:"name"       json:"name"`
	Kcal      int       `db:"kcal"       json:"kcal"`
	ProteinG  int       `db:"protein_g"  json:"protein_g"`
	FatG      int       `db:"fat_g"      json:"fat_g"`
	CarbsG    int       `db:"carbs_g"    json:"carbs_g"`
	SortOrder int       `db:"sort_order" json:"-"`
}

type RationIngredient struct {
	ID        uuid.UUID `db:"id"         json:"-"`
	RationID  uuid.UUID `db:"ration_id"  json:"-"`
	Name      string    `db:"name"       json:"name"`
	Quantity  string    `db:"quantity"   json:"quantity"`
	Unit      string    `db:"unit"       json:"unit"`
	SortOrder int       `db:"sort_order" json:"-"`
}

// RationResponse — ответ на POST /api/v1/ration
type RationResponse struct {
	RationID        uuid.UUID             `json:"ration_id"`
	ProfileIncomplete bool                `json:"profile_incomplete"`
	MissingFields    []string              `json:"missing_fields"`
	Meals            []RationMeal          `json:"meals"`
	Ingredients      []RationIngredient    `json:"ingredients"`
	StoresDelivery   []StoreDelivery       `json:"stores_delivery"`
	StoresWalk       []StoreWalk           `json:"stores_walk"`
}

// CartResponse — ответ на POST /api/v1/ration/:id/cart
type CartResponse struct {
	CartID        uuid.UUID      `json:"cart_id"`
	TotalPriceRub int            `json:"total_price_rub"`
	FoundCount    int            `json:"found_count"`
	TotalCount    int            `json:"total_count"`
	CheckoutURL   string         `json:"checkout_url"`
	Items         []KuperCartItem `json:"items"`
}
