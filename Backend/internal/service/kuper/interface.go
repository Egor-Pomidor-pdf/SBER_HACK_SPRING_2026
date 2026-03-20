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
