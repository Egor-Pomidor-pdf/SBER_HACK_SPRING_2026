package service

import (
	"context"

	"github.com/loks1k192/ration-service/internal/model"
)

// KuperService provides access to the Kuper grocery delivery API.
type KuperService interface {
	GetNearbyStores(ctx context.Context, lat, lng float64, limit int) ([]model.KuperNearbyStore, error)
	SearchProduct(ctx context.Context, query string, storeID string) (*model.KuperSearchResult, error)
	CreateCart(ctx context.Context, storeID string, productIDs []string) (*model.KuperCartCreateResponse, error)
}
