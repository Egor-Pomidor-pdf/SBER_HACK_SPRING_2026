package kuper

import (
	"context"

	"hudeem-backend/internal/model"
)

type Service interface {
	GetNearbyStores(ctx context.Context, lat, lng float64) ([]model.KuperStore, error)
	SearchProduct(ctx context.Context, storeID, query string) (*model.KuperCartItem, error)
	CreateCart(ctx context.Context, storeID string, items []model.KuperCartItem) (cartID string, checkoutURL string, err error)
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
