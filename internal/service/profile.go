package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/loks1k192/ration-service/internal/model"
)

// ProfileService provides access to user profiles.
type ProfileService interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error)
	UpdateLocation(ctx context.Context, userID uuid.UUID, lat, lng float64) error
}
