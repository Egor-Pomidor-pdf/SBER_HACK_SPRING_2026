package model

import (
	"time"

	"github.com/google/uuid"
)

type UserProfile struct {
	ID                  uuid.UUID `db:"id"`
	UserID              uuid.UUID `db:"user_id"`
	DailyKcal           int       `db:"daily_kcal"`
	RemainingKcal       int       `db:"remaining_kcal"`
	RemainingProteinG   int       `db:"remaining_protein_g"`
	RemainingFatG       int       `db:"remaining_fat_g"`
	RemainingCarbsG     int       `db:"remaining_carbs_g"`
	Goal                string    `db:"goal"` // lose / maintain / gain
	DietaryRestrictions string    `db:"dietary_restrictions"`
	Lat                 float64   `db:"lat"`
	Lng                 float64   `db:"lng"`
	UpdatedAt           time.Time `db:"updated_at"`
}
