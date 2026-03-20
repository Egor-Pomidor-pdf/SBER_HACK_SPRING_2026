package kuper

// Product — товар в каталоге магазина
type Product struct {
	ID    string
	Name  string
	Price int // рублей
}

// catalog — набор продуктов для поиска (имитация базы Купера)
var catalog = []Product{
	{ID: "p001", Name: "Куриное филе", Price: 280},
	{ID: "p002", Name: "Говядина вырезка", Price: 650},
	{ID: "p003", Name: "Свинина шея", Price: 380},
	{ID: "p004", Name: "Лосось стейк", Price: 490},
	{ID: "p005", Name: "Яйца куриные 10шт", Price: 120},
	{ID: "p006", Name: "Молоко 3.2% 1л", Price: 89},
	{ID: "p007", Name: "Масло сливочное 200г", Price: 145},
	{ID: "p008", Name: "Сметана 20% 400г", Price: 115},
	{ID: "p009", Name: "Творог 9% 200г", Price: 95},
	{ID: "p010", Name: "Сыр Российский 200г", Price: 180},
	{ID: "p011", Name: "Гречка 800г", Price: 75},
	{ID: "p012", Name: "Рис длиннозёрный 800г", Price: 85},
	{ID: "p013", Name: "Макароны спагетти 400г", Price: 55},
	{ID: "p014", Name: "Картофель 1кг", Price: 45},
	{ID: "p015", Name: "Морковь 1кг", Price: 35},
	{ID: "p016", Name: "Лук репчатый 1кг", Price: 30},
	{ID: "p017", Name: "Капуста белокочанная 1кг", Price: 40},
	{ID: "p018", Name: "Помидоры 1кг", Price: 130},
	{ID: "p019", Name: "Огурцы 1кг", Price: 110},
	{ID: "p020", Name: "Перец болгарский 1кг", Price: 160},
	{ID: "p021", Name: "Масло подсолнечное 1л", Price: 110},
	{ID: "p022", Name: "Соль 1кг", Price: 25},
	{ID: "p023", Name: "Сахар 1кг", Price: 65},
	{ID: "p024", Name: "Мука пшеничная 2кг", Price: 85},
	{ID: "p025", Name: "Хлеб белый", Price: 45},
}

// hardcodedStores — запасные магазины если 2GIS недоступен
var hardcodedStores = []nearbyStore{
	{StoreID: "store_001", StoreName: "Купер на Невском", DistanceM: 320},
	{StoreID: "store_002", StoreName: "Купер Василеостровский", DistanceM: 550},
	{StoreID: "store_003", StoreName: "Купер Московский", DistanceM: 890},
	{StoreID: "store_004", StoreName: "Купер Петроградский", DistanceM: 1200},
	{StoreID: "store_005", StoreName: "Купер Выборгский", DistanceM: 1800},
}

type nearbyStore struct {
	StoreID   string `json:"store_id"`
	StoreName string `json:"store_name"`
	DistanceM int    `json:"distance_m"`
}
