package profile

import (
	"context"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
)

type Service interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error)
	UpdateProfile(ctx context.Context, profile *model.UserProfile) error
	DeductKBZHU(ctx context.Context, userID uuid.UUID, kcal, proteinG, fatG, carbsG int) error
}
