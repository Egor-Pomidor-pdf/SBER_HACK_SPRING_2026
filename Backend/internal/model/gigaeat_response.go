package model

import "github.com/google/uuid"

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
