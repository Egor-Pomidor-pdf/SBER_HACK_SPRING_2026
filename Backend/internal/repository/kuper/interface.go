package kuper

import (
	"context"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
)

type Repository interface {
	SaveStores(ctx context.Context, stores []model.KuperStore) error
	GetStoreByID(ctx context.Context, id uuid.UUID) (*model.KuperStore, error)
	SelectStore(ctx context.Context, storeID uuid.UUID) error
	SaveCart(ctx context.Context, cart *model.KuperCart, items []model.KuperCartItem) error
	GetCartByRationID(ctx context.Context, rationID uuid.UUID) (*model.KuperCart, []model.KuperCartItem, error)
}
