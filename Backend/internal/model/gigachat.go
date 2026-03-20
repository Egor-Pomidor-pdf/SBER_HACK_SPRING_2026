package model

// MealPlan — результат парсинга ответа GigaChat
type MealPlan struct {
	Meals        []MealPlanItem        `json:"meals"`
	ShoppingList []ShoppingListItem    `json:"shopping_list"`
}

type MealPlanItem struct {
	MealType string `json:"meal_type"`
	Name     string `json:"name"`
	Kcal     int    `json:"kcal"`
}

type ShoppingListItem struct {
	Name     string `json:"name"`
	Quantity string `json:"quantity"`
	Unit     string `json:"unit"`
}
