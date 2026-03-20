package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/loks1k192/ration-service/internal/model"
)

type ProfileRepository struct {
	db *sql.DB
}

func NewProfileRepository(db *sql.DB) *ProfileRepository {
	return &ProfileRepository{db: db}
}

func (r *ProfileRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error) {
	query := `
		SELECT id, user_id, remaining_kcal, remaining_protein_g, remaining_fat_g, remaining_carbs_g,
		       daily_kcal, goal, dietary_restrictions, lat, lng, updated_at
		FROM user_profiles
		WHERE user_id = $1`

	p := &model.UserProfile{}
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.RemainingKcal, &p.RemainingProteinG, &p.RemainingFatG, &p.RemainingCarbsG,
		&p.DailyKcal, &p.Goal, &p.DietaryRestrictions, &p.Lat, &p.Lng, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get profile by user_id: %w", err)
	}
	return p, nil
}

func (r *ProfileRepository) UpdateLocation(ctx context.Context, userID uuid.UUID, lat, lng float64) error {
	query := `UPDATE user_profiles SET lat = $1, lng = $2, updated_at = NOW() WHERE user_id = $3`
	_, err := r.db.ExecContext(ctx, query, lat, lng, userID)
	if err != nil {
		return fmt.Errorf("update location: %w", err)
	}
	return nil
}
