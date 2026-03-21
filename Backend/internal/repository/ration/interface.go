package ration

import (
	"context"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
)

type Repository interface {
	CreateRation(ctx context.Context, r *model.DailyRation) error
	CreateMeals(ctx context.Context, meals []model.RationMeal) error
	CreateIngredients(ctx context.Context, ingredients []model.RationIngredient) error
	SaveStores(ctx context.Context, stores []model.KuperStore) error
	GetRationByID(ctx context.Context, id uuid.UUID) (*model.DailyRation, error)
	GetIngredientsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationIngredient, error)
	GetStoreByID(ctx context.Context, id uuid.UUID) (*model.KuperStore, error)
	GetMealsByRationID(ctx context.Context, rationID uuid.UUID) ([]model.RationMeal, error)
	GetStoresByRationID(ctx context.Context, rationID uuid.UUID) ([]model.KuperStore, error)
	SaveCart(ctx context.Context, cart *model.KuperCart, items []model.KuperCartItem) error
	UpdateRationStatus(ctx context.Context, rationID uuid.UUID, status string) error
	GetRationsByUserID(ctx context.Context, userID uuid.UUID) ([]model.DailyRation, error)
}
