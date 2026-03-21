package calc

import "math"

// WalkingCaloriesAndTime считает калории и время ходьбы до магазина.
//
// Формула калорий:
//   MET ходьбы (~3.5 км/ч) = 3.5
//   kcal = MET × weightKg × durationHours
//   где durationHours = distanceM / (walkingSpeedKmh * 1000)
//
// Формула времени:
//   timeMins = (distanceM / 1000) / walkingSpeedKmh * 60
//
// Параметры:
//   distanceM   — расстояние до магазина в метрах
//   weightKg    — вес пользователя в кг (из профиля)
//
// Константы:
//   walkingSpeedKmh = 4.5 (средняя скорость ходьбы)
//   MET = 3.5 (метаболический эквивалент ходьбы)

const (
	walkingSpeedKmh = 4.5
	walkingMET      = 3.5
)

func WalkingCaloriesAndTime(distanceM int, weightKg float64) (caloriesBurned int, walkingTimeMins int) {
	if distanceM <= 0 || weightKg <= 0 {
		return 0, 0
	}

	distanceKm := float64(distanceM) / 1000.0
	durationHours := distanceKm / walkingSpeedKmh
	durationMins := durationHours * 60.0
	kcal := walkingMET * weightKg * durationHours

	caloriesBurned = int(math.Round(kcal))
	walkingTimeMins = int(math.Round(durationMins))
	return
}
