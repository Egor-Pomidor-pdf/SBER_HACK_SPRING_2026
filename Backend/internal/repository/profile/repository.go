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

// SaveMealConsumption сохраняет факт потребления блюда
func (r *Repo) SaveMealConsumption(ctx context.Context, consumption *model.UserMealConsumption) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO user_meal_consumptions (id, user_id, meal_type, meal_name, meal_kcal, consumed_at, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		consumption.ID, consumption.UserID, consumption.MealType, consumption.MealName, consumption.MealKcal, consumption.ConsumedAt, consumption.CreatedAt,
	)
	return err
}

// UpdateRemainingKcal обновляет оставшиеся КБЖУ
func (r *Repo) UpdateRemainingKcal(ctx context.Context, userID uuid.UUID, deltaKcal int) error {
	_, err := r.db.Exec(ctx,
		`UPDATE user_profiles SET remaining_kcal = remaining_kcal + $1, updated_at = NOW() WHERE user_id = $2`,
		deltaKcal, userID,
	)
	return err
}

// GetMealConsumptions получает историю потребления для пользователя
func (r *Repo) GetMealConsumptions(ctx context.Context, userID uuid.UUID) ([]model.UserMealConsumption, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, meal_type, meal_name, meal_kcal, consumed_at, created_at
		 FROM user_meal_consumptions WHERE user_id = $1 ORDER BY consumed_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []model.UserMealConsumption
	for rows.Next() {
		var c model.UserMealConsumption
		if err := rows.Scan(&c.ID, &c.UserID, &c.MealType, &c.MealName, &c.MealKcal, &c.ConsumedAt, &c.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

// DeductKBZHU вычитает КБЖУ из остатка пользователя (не уходит ниже 0)
func (r *Repo) DeductKBZHU(ctx context.Context, userID uuid.UUID, kcal, proteinG, fatG, carbsG int) error {
	_, err := r.db.Exec(ctx, `
		UPDATE user_profiles SET
			remaining_kcal      = GREATEST(0, remaining_kcal      - $1),
			remaining_protein_g = GREATEST(0, remaining_protein_g - $2),
			remaining_fat_g     = GREATEST(0, remaining_fat_g     - $3),
			remaining_carbs_g   = GREATEST(0, remaining_carbs_g   - $4)
		WHERE user_id = $5
	`, kcal, proteinG, fatG, carbsG, userID)
	return err
}

// CalculateTotalConsumedKcal считает общее потребление калорий
func (r *Repo) CalculateTotalConsumedKcal(ctx context.Context, userID uuid.UUID) (int, error) {
	row := r.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(meal_kcal), 0) FROM user_meal_consumptions WHERE user_id = $1`, userID)

	var total int
	if err := row.Scan(&total); err != nil {
		return 0, err
	}
	return total, nil
}
