package model

import (
	"time"

	"github.com/google/uuid"
)

// UserMealConsumption — история потребления блюд
type UserMealConsumption struct {
	ID         uuid.UUID `db:"id" json:"id"`
	UserID     uuid.UUID `db:"user_id" json:"user_id"`
	MealType   string    `db:"meal_type" json:"meal_type"`
	MealName   string    `db:"meal_name" json:"meal_name"`
	MealKcal   int       `db:"meal_kcal" json:"meal_kcal"`
	ConsumedAt time.Time `db:"consumed_at" json:"consumed_at"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}
