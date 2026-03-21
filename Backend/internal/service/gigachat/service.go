package gigachat

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	gigachatclient "hudeem-backend/internal/client/gigachat"
	"hudeem-backend/internal/model"
	"hudeem-backend/internal/prompt"
)

type ServiceImpl struct {
	client gigachatclient.Client
}

func New(client gigachatclient.Client) *ServiceImpl {
	return &ServiceImpl{client: client}
}

func (s *ServiceImpl) GenerateMealPlan(ctx context.Context, profile *model.UserProfile) (*model.MealPlan, string, error) {
	systemPrompt, userPrompt := prompt.Build(profile)

	response, err := s.client.Complete(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, "", fmt.Errorf("gigachat complete: %w", err)
	}

	response = strings.TrimSpace(response)
	if strings.HasPrefix(response, "```json") {
		response = strings.TrimPrefix(response, "```json")
		response = strings.TrimPrefix(response, "\n")
	}
	if strings.HasSuffix(response, "```") {
		response = strings.TrimSuffix(response, "```")
		response = strings.TrimSuffix(response, "\n")
	}
	response = strings.TrimSpace(response)

	var plan model.MealPlan
	if err := json.Unmarshal([]byte(response), &plan); err != nil {
		response, err = s.client.Complete(ctx, systemPrompt, userPrompt)
		if err != nil {
			return nil, "", fmt.Errorf("gigachat complete (retry): %w", err)
		}

		response = strings.TrimSpace(response)
		if strings.HasPrefix(response, "```json") {
			response = strings.TrimPrefix(response, "```json")
			response = strings.TrimPrefix(response, "\n")
		}
		if strings.HasSuffix(response, "```") {
			response = strings.TrimSuffix(response, "```")
			response = strings.TrimSuffix(response, "\n")
		}
		response = strings.TrimSpace(response)

		if err := json.Unmarshal([]byte(response), &plan); err != nil {
			return nil, "", errors.New("gigachat returned invalid JSON")
		}
	}

	return &plan, response, nil
}
