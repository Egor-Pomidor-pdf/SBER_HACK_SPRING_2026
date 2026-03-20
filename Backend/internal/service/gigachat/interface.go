package gigachat

import (
	"context"

	"hudeem-backend/internal/model"
)

type Service interface {
	GenerateMealPlan(ctx context.Context, profile *model.UserProfile) (*model.MealPlan, string, error)
}
