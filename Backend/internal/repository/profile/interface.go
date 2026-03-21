package profile

import (
	"context"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
)

type Repository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error)
	Update(ctx context.Context, p *model.UserProfile) error
	UpdateLocation(ctx context.Context, userID uuid.UUID, lat, lng float64) error
	SaveMealConsumption(ctx context.Context, consumption *model.UserMealConsumption) error
	UpdateRemainingKcal(ctx context.Context, userID uuid.UUID, deltaKcal int) error
	GetMealConsumptions(ctx context.Context, userID uuid.UUID) ([]model.UserMealConsumption, error)
	CalculateTotalConsumedKcal(ctx context.Context, userID uuid.UUID) (int, error)
	DeductKBZHU(ctx context.Context, userID uuid.UUID, kcal, proteinG, fatG, carbsG int) error
}
