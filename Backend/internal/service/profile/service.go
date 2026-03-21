package profile

import (
	"context"

	"github.com/google/uuid"
	"hudeem-backend/internal/model"
	profilerepo "hudeem-backend/internal/repository/profile"
)

type ServiceImpl struct {
	repo profilerepo.Repository
}

func New(repo profilerepo.Repository) *ServiceImpl {
	return &ServiceImpl{repo: repo}
}

func (s *ServiceImpl) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error) {
	return s.repo.GetByUserID(ctx, userID)
}
