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
}
