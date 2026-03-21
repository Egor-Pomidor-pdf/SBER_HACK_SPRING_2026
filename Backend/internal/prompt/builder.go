package prompt

import (
	"fmt"
	"hudeem-backend/internal/model"
)

func Build(profile *model.UserProfile) (systemPrompt, userPrompt string) {
	var goal string
	switch profile.Goal {
	case "lose":
		goal = "похудеть"
	case "gain":
		goal = "набрать вес"
	default:
		goal = "держать вес"
	}

	dietary := "нет ограничений"
	if profile.DietaryRestrictions != "" {
		dietary = profile.DietaryRestrictions
	}

	systemPrompt = `Ты — персональный нутрициолог. Составь рацион питания на день.
Цель пользователя: ` + goal + `.
Диетические ограничения: ` + dietary + `.

Правила:
1. Рацион укладывается в остаток КБЖУ пользователя.
2. Раздели на приёмы: завтрак, обед, ужин (и перекус если нужно).
3. Составь список ингредиентов для всех блюд.
4. Только обычные продукты из магазина.
5. Отвечай ТОЛЬКО валидным JSON. Никакого текста до или после JSON.

Строго используй этот формат ответа:
{
  "meals": [
    {"meal_type": "breakfast", "name": "Название блюда", "kcal": 300}
  ],
  "shopping_list": [
    {"name": "продукт", "quantity": "100", "unit": "г"}
  ]
}`

	userPrompt = `Остаток КБЖУ на сегодня:

Калории: ` + fmt.Sprint(profile.RemainingKcal) + ` ккал
Белки: ` + fmt.Sprint(profile.RemainingProteinG) + ` г
Жиры: ` + fmt.Sprint(profile.RemainingFatG) + ` г
Углеводы: ` + fmt.Sprint(profile.RemainingCarbsG) + ` г

Составь рацион на оставшуюся часть дня.`

	return systemPrompt, userPrompt
}
