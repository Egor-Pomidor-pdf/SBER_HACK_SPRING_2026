package profile

import (
	"context"
	"fmt"

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

// GetRemainingKcal получает оставшиеся калории для пользователя
func (s *ServiceImpl) GetRemainingKcal(ctx context.Context, userID uuid.UUID) (int, error) {
	profile, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return 0, err
	}

	// Получаем историю потребления
	consumptions, err := s.repo.GetMealConsumptions(ctx, userID)
	if err != nil {
		return 0, err
	}

	// Считаем общее потребление
	totalConsumed := 0
	for _, c := range consumptions {
		totalConsumed += c.MealKcal
	}

	remaining := profile.RemainingKcal - totalConsumed
	if remaining < 0 {
		remaining = 0
	}

	return remaining, nil
}

// UpdateRemainingKcalOnOrder обновляет оставшиеся КБЖУ после создания заказа
func (s *ServiceImpl) UpdateRemainingKcalOnOrder(ctx context.Context, userID uuid.UUID, kcal int) error {
	return s.repo.UpdateRemainingKcal(ctx, userID, -kcal)
}
