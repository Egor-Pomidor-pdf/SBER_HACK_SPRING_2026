package kuper

// Product — товар в каталоге магазина
type Product struct {
	ID    string
	Name  string
	Price int
}

// catalog — набор продуктов для поиска (имитация базы Купера)
var catalog = []Product{
	{ID: "p001", Name: "Овсянка", Price: 75},
	{ID: "p002", Name: "Банан", Price: 65},
	{ID: "p003", Name: "Куриное филе", Price: 280},
	{ID: "p004", Name: "Гречка", Price: 75},
	{ID: "p005", Name: "Молоко 3.2% 1л", Price: 89},
	{ID: "p006", Name: "Яйца куриные 10шт", Price: 120},
	{ID: "p007", Name: "Сметана 20% 400г", Price: 115},
	{ID: "p008", Name: "Хлеб белый", Price: 45},
	{ID: "p009", Name: "Помидоры 1кг", Price: 130},
	{ID: "p010", Name: "Огурцы 1кг", Price: 110},
	{ID: "p011", Name: "Лук репчатый 1кг", Price: 30},
	{ID: "p012", Name: "Морковь 1кг", Price: 35},
	{ID: "p013", Name: "Картофель 1кг", Price: 45},
	{ID: "p014", Name: "Масло подсолнечное 1л", Price: 110},
	{ID: "p015", Name: "Сыр Российский 200г", Price: 180},
	{ID: "p016", Name: "Творог 9% 200г", Price: 95},
	{ID: "p017", Name: "Кефир 1л", Price: 89},
	{ID: "p018", Name: "Рис длиннозёрный 800г", Price: 85},
	{ID: "p019", Name: "Макароны спагетти 400г", Price: 55},
	{ID: "p020", Name: "Тунец консервированный", Price: 150},
	{ID: "p021", Name: "Яблоко 1кг", Price: 95},
	{ID: "p022", Name: "Апельсин 1кг", Price: 85},
	{ID: "p023", Name: "Свинина шея", Price: 380},
	{ID: "p024", Name: "Говядина вырезка", Price: 650},
	{ID: "p025", Name: "Петрушка", Price: 60},
}

// hardcodedStores — запасные магазины если 2GIS недоступен
var hardcodedStores = []nearbyStore{
	{StoreID: "store_001", StoreName: "Купер на Невском", DistanceM: 200},
	{StoreID: "store_002", StoreName: "Купер Василеостровский", DistanceM: 550},
	{StoreID: "store_003", StoreName: "Купер Московский", DistanceM: 890},
	{StoreID: "store_004", StoreName: "Купер Петроградский", DistanceM: 1200},
	{StoreID: "store_005", StoreName: "Купер Выборгский", DistanceM: 1500},
}

type nearbyStore struct {
	StoreID   string `json:"store_id"`
	StoreName string `json:"store_name"`
	DistanceM int    `json:"distance_m"`
}
