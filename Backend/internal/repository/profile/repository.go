package profile

import (
	"context"
	"fmt"

	"hudeem-backend/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

func (r *Repo) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserProfile, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, user_id, remaining_kcal, remaining_protein_g, remaining_fat_g, remaining_carbs_g,
		        daily_kcal, goal, dietary_restrictions, lat, lng, updated_at
		 FROM user_profiles WHERE user_id = $1`, userID)

	var p model.UserProfile
	err := row.Scan(
		&p.ID, &p.UserID, &p.RemainingKcal, &p.RemainingProteinG, &p.RemainingFatG, &p.RemainingCarbsG,
		&p.DailyKcal, &p.Goal, &p.DietaryRestrictions, &p.Lat, &p.Lng, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan profile: %w", err)
	}
	return &p, nil
}

func (r *Repo) Update(ctx context.Context, p *model.UserProfile) error {
	_, err := r.db.Exec(ctx,
		`UPDATE user_profiles
		 SET remaining_kcal = $1, remaining_protein_g = $2, remaining_fat_g = $3, remaining_carbs_g = $4,
		     daily_kcal = $5, goal = $6, dietary_restrictions = $7, updated_at = NOW()
		 WHERE user_id = $8`,
		p.RemainingKcal, p.RemainingProteinG, p.RemainingFatG, p.RemainingCarbsG,
		p.DailyKcal, p.Goal, p.DietaryRestrictions, p.UserID,
	)
	return err
}

func (r *Repo) UpdateLocation(ctx context.Context, userID uuid.UUID, lat, lng float64) error {
	_, err := r.db.Exec(ctx,
		`UPDATE user_profiles SET lat = $1, lng = $2, updated_at = NOW() WHERE user_id = $3`,
		lat, lng, userID,
	)
	return err
}
