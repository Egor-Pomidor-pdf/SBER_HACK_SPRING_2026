package kuper

import (
	"context"

	"hudeem-backend/internal/model"
)

type Client interface {
	GetNearbyStores(ctx context.Context, lat, lng float64, limit int) ([]model.KuperNearbyStore, error)
	SearchProduct(ctx context.Context, query string, storeID string) (*model.KuperSearchResult, error)
	CreateCart(ctx context.Context, storeID string, productIDs []string) (*model.KuperCartCreateResponse, error)
}
