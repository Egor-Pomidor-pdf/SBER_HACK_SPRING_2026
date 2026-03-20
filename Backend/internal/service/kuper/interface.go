package kuper

import (
	"context"

	"hudeem-backend/internal/model"
)

type Service interface {
	GetNearbyStores(ctx context.Context, lat, lng float64) ([]model.KuperNearbyStore, error)
	BuildCart(ctx context.Context, storeID string, ingredients []model.RationIngredient) (*BuildCartResult, error)
}

type BuildCartResult struct {
	CartID        string
	CheckoutURL   string
	TotalPriceRub int
	FoundCount    int
	TotalCount    int
	Items         []CartItemDetail
}

type CartItemDetail struct {
	IngredientID   string
	IngredientName string
	ProductID      string
	ProductName    string
	PriceRub       int
	Found          bool
}
