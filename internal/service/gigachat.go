package service

import (
	"context"

	"github.com/loks1k192/ration-service/internal/model"
)

// GigaChatService generates meal plans via GigaChat API.
type GigaChatService interface {
	GenerateRation(ctx context.Context, profile *model.UserProfile) (*model.GigaChatRationResponse, string, error)
}
