package profile

import (
	"context"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
)

type Service interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error)
	Update(ctx context.Context, p *model.UserProfile) error
}
