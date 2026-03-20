package model

import "github.com/google/uuid"

type KuperStore struct {
	ID         uuid.UUID `db:"id"         json:"id"`
	RationID   uuid.UUID `db:"ration_id"  json:"-"`
	StoreID    string    `db:"store_id"   json:"store_id"`
	StoreName  string    `db:"store_name" json:"store_name"`
	DistanceM  int       `db:"distance_m" json:"distance_m"`
	IsSelected bool      `db:"is_selected" json:"-"`
}

type KuperCart struct {
	ID            uuid.UUID `db:"id"`
	RationID      uuid.UUID `db:"ration_id"`
	StoreID       uuid.UUID `db:"store_id"`
	TotalPriceRub int       `db:"total_price_rub"`
	FoundCount    int       `db:"found_count"`
	TotalCount    int       `db:"total_count"`
	CheckoutURL   string    `db:"checkout_url"`
}

type KuperCartItem struct {
	ID               uuid.UUID `db:"id"`
	CartID           uuid.UUID `db:"cart_id"`
	IngredientID     uuid.UUID `db:"ingredient_id"`
	IngredientName   string    `db:"-"           json:"ingredient_name"`
	KuperProductID   string    `db:"kuper_product_id"`
	KuperProductName string    `db:"kuper_product_name" json:"product_name"`
	PriceRub         int       `db:"price_rub"          json:"price_rub"`
	Found            bool      `db:"found"              json:"found"`
}
