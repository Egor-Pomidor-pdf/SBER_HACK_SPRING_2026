package model

// MealPlan — результат парсинга ответа GigaChat
type MealPlan struct {
	Meals        []MealPlanItem     `json:"meals"`
	ShoppingList []RationIngredient `json:"shopping_list"`
}

type MealPlanItem struct {
	MealType string `json:"meal_type"`
	Name     string `json:"name"`
	Kcal     int    `json:"kcal"`
	ProteinG int    `json:"protein_g"`
	FatG     int    `json:"fat_g"`
	CarbsG   int    `json:"carbs_g"`
}

