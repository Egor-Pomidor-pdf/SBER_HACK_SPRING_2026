package prompt

import (
	"fmt"
	"strings"
	"hudeem-backend/internal/model"
)

// Build создаёт промпт для GigaChat с учётом consumed meals
func Build(profile *model.UserProfile, consumed []model.ConsumedMealDTO) (systemPrompt, userPrompt string) {
	// Считаем что уже съедено
	eatenKcal, eatenProtein, eatenFat, eatenCarbs := 0, 0, 0, 0
	for _, m := range consumed {
		eatenKcal    += m.KcalEaten
		eatenProtein += m.ProteinG
		eatenFat     += m.FatG
		eatenCarbs   += m.CarbsG
	}

	// Остаток
	remainingKcal    := profile.DailyKcal        - eatenKcal
	remainingProtein := profile.RemainingProteinG - eatenProtein
	remainingFat     := profile.RemainingFatG    - eatenFat
	remainingCarbs   := profile.RemainingCarbsG  - eatenCarbs

	// Защита от отрицательных значений
	if remainingKcal < 0    { remainingKcal = 0 }
	if remainingProtein < 0 { remainingProtein = 0 }
	if remainingFat < 0     { remainingFat = 0 }
	if remainingCarbs < 0   { remainingCarbs = 0 }

	// Формируем информацию о цели
	var goal string
	switch profile.Goal {
	case "lose":
		goal = "похудеть"
	case "gain":
		goal = "набрать вес"
	default:
		goal = "держать вес"
	}

	// Диетические ограничения
	dietary := "нет ограничений"
	if profile.DietaryRestrictions != "" {
		dietary = profile.DietaryRestrictions
	}

	// Формируем информацию об аллергиях
	var allergiesText string
	if len(profile.Allergies) > 0 {
		allergiesText = fmt.Sprintf("ЖЁСТКО ЗАПРЕЩЁННЫЕ ингредиенты, не использовать ни в каком виде: %s", strings.Join(profile.Allergies, ", "))
	}

	// Формируем информацию о предпочтениях
	var preferencesText string
	if len(profile.Preferences) > 0 {
		preferencesText = fmt.Sprintf("Предпочтения: %s", strings.Join(profile.Preferences, ", "))
	}

	// Формируем информацию о потреблении
	var consumptionText string
	if len(consumed) > 0 {
		consumptionText = "\nУже съедено сегодня:\n"
		for _, m := range consumed {
			consumptionText += fmt.Sprintf("- %s: %s, %d ккал (%d белка, %d жира, %d углевод)",
				m.MealType, m.Name, m.KcalEaten, m.ProteinG, m.FatG, m.CarbsG)
			if m != consumed[len(consumed)-1] {
				consumptionText += "\n"
			}
		}
	} else {
		consumptionText = "\nЕщё ничего не съедено сегодня, составь рацион на весь день."
	}

	systemPrompt = fmt.Sprintf(`Ты — персональный нутрициолог AI.
Цель пользователя: %s.
Диетические ограничения: %s.
%s
%s
%s

📋 ПРАВИЛА:
1. Рацион должен укладываться в ОСТАТКИ КБЖУ:
   - Калории: %d ккал
   - Белки: %d г
   - Жиры: %d г
   - Углеводы: %d г

2. Не повторяй уже съеденные блюда из списка потребления.

3. Если пользователь уже съел завтрак и обед — предложи только ужин и, возможно, перекус.

4. Для каждого блюда укажи:
   - Название блюда
   - Калорийность
   - Белки в граммах
   - Жиры в граммах
   - Углеводы в граммах
   - Список продуктов с дозировками (format: "мясо (500 г)").

5. Продукты должны быть обычными продуктами из магазина.

6. Только валидный JSON.

📊 ФОРМАТ ОТВЕТА (строго совпадать с model.MealPlan):
{
  "meals": [
    {
      "meal_type": "lunch",
      "name": "Название блюда",
      "kcal": 300,
      "protein_g": 30,
      "fat_g": 10,
      "carbs_g": 40
    }
  ],
  "shopping_list": [
    {
      "name": "продукт",
      "quantity": "100",
      "unit": "г"
    }
  ]
}`, goal, dietary, allergiesText, preferencesText, consumptionText,
		remainingKcal, remainingProtein, remainingFat, remainingCarbs)

	userPrompt = consumptionText

	return systemPrompt, userPrompt
}
