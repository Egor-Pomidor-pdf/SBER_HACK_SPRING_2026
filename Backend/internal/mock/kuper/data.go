package kuper

import (
	"database/sql"
	"log"
)

// Product — товар в каталоге магазина
type Product struct {
	ID          string
	ProductID   string
	StoreID     string
	Name        string
	Price       int
	Unit        string
	Kcal        int
	ProteinG    int
	FatG        int
	CarbsG      int
	Category    string
	Allergens   []string
}

// Mock DB — глобальная база данных для Mock Купера
var db *sql.DB
var initialized bool

// MockProductResponse — ответ при поиске
type MockProductResponse struct {
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name"`
	PriceRub    int    `json:"price_rub"`
	Found       bool   `json:"found"`
	Kcal        int    `json:"kcal"`        // Вспомогательное поле для демо
}

// InitializedMockKuperDB инициализирует SQLite базу с продуктами
func InitializedMockKuperDB(database *sql.DB) error {
	db = database

	// Создаем таблицу products если не существует
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS products (
		id TEXT PRIMARY KEY,
		product_id TEXT NOT NULL,
		store_id TEXT NOT NULL,
		name TEXT NOT NULL,
		price_rub INTEGER NOT NULL,
		unit TEXT NOT NULL,
		kcal INTEGER NOT NULL DEFAULT 0,
		protein_g INTEGER NOT NULL DEFAULT 0,
		fat_g INTEGER NOT NULL DEFAULT 0,
		carbs_g INTEGER NOT NULL DEFAULT 0,
		category TEXT,
		allergens TEXT DEFAULT '{}'
	)`)
	if err != nil {
		return err
	}

	// Добавляем продукты если таблица пустая
	err = insertProductsIfEmpty()
	if err != nil {
		return err
	}

	initialized = true
	log.Println("Mock Kuper DB initialized with products")
	return nil
}

// insertProductsIfEmpty добавляет продукты в базу если таблица пустая
func insertProductsIfEmpty() error {
	// Проверяем количество записей
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM products").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Уже есть данные
	}

	// Вставляем продукты с КБЖУ
	products := []Product{
		// Мясо и рыба
		{ID: "p001", ProductID: "prod_001", StoreID: "store_001", Name: "Куриное филе", Price: 150, Unit: "г", Kcal: 165, ProteinG: 30, FatG: 3, CarbsG: 0, Category: "мясо", Allergens: []string{}},
		{ID: "p002", ProductID: "prod_002", StoreID: "store_001", Name: "Говядина вырезка", Price: 650, Unit: "100г", Kcal: 250, ProteinG: 25, FatG: 15, CarbsG: 0, Category: "мясо", Allergens: []string{}},
		{ID: "p003", ProductID: "prod_003", StoreID: "store_001", Name: "Свинина шея", Price: 380, Unit: "100г", Kcal: 300, ProteinG: 20, FatG: 20, CarbsG: 0, Category: "мясо", Allergens: []string{}},
		{ID: "p004", ProductID: "prod_004", StoreID: "store_001", Name: "Тунец консервированный", Price: 150, Unit: "1шт", Kcal: 130, ProteinG: 28, FatG: 1, CarbsG: 0, Category: "рыба", Allergens: []string{"рыба"}},
		// Молочные продукты
		{ID: "p005", ProductID: "prod_005", StoreID: "store_001", Name: "Яйца куриные", Price: 80, Unit: "10шт", Kcal: 140, ProteinG: 12, FatG: 10, CarbsG: 1, Category: "яйца", Allergens: []string{"яйца"}},
		{ID: "p006", ProductID: "prod_006", StoreID: "store_001", Name: "Молоко 3.2%", Price: 65, Unit: "1л", Kcal: 58, ProteinG: 3, FatG: 3, CarbsG: 4, Category: "молоко", Allergens: []string{"молоко"}},
		{ID: "p007", ProductID: "prod_007", StoreID: "store_001", Name: "Творог 9%", Price: 95, Unit: "200г", Kcal: 130, ProteinG: 18, FatG: 4, CarbsG: 2, Category: "молоко", Allergens: []string{}},
		{ID: "p008", ProductID: "prod_008", StoreID: "store_001", Name: "Сметана 20%", Price: 115, Unit: "400г", Kcal: 220, ProteinG: 3, FatG: 20, CarbsG: 1, Category: "молоко", Allergens: []string{"молоко"}},
		{ID: "p009", ProductID: "prod_009", StoreID: "store_001", Name: "Сыр Российский", Price: 180, Unit: "200г", Kcal: 260, ProteinG: 20, FatG: 18, CarbsG: 0, Category: "сыр", Allergens: []string{"молоко"}},
		// Овощи
		{ID: "p010", ProductID: "prod_010", StoreID: "store_001", Name: "Морковь", Price: 25, Unit: "1кг", Kcal: 43, ProteinG: 0, FatG: 0, CarbsG: 10, Category: "овощи", Allergens: []string{}},
		{ID: "p011", ProductID: "prod_011", StoreID: "store_001", Name: "Помидоры", Price: 130, Unit: "1кг", Kcal: 23, ProteinG: 1, FatG: 0, CarbsG: 4, Category: "овощи", Allergens: []string{}},
		{ID: "p012", ProductID: "prod_012", StoreID: "store_001", Name: "Огурцы", Price: 110, Unit: "1кг", Kcal: 16, ProteinG: 1, FatG: 0, CarbsG: 3, Category: "овощи", Allergens: []string{}},
		{ID: "p013", ProductID: "prod_013", StoreID: "store_001", Name: "Картофель", Price: 45, Unit: "1кг", Kcal: 77, ProteinG: 2, FatG: 0, CarbsG: 17, Category: "овощи", Allergens: []string{"глютен"}}, // приблизительно
		{ID: "p014", ProductID: "prod_014", StoreID: "store_001", Name: "Лук репчатый", Price: 30, Unit: "1кг", Kcal: 41, ProteinG: 1, FatG: 0, CarbsG: 10, Category: "овощи", Allergens: []string{}},
		{ID: "p015", ProductID: "prod_015", StoreID: "store_001", Name: "Шпинат", Price: 60, Unit: "100г", Kcal: 23, ProteinG: 2, FatG: 0, CarbsG: 3, Category: "овощи", Allergens: []string{}},
		// Зерновые
		{ID: "p016", ProductID: "prod_016", StoreID: "store_001", Name: "Рис длиннозёрный", Price: 55, Unit: "800г", Kcal: 130, ProteinG: 2, FatG: 0, CarbsG: 28, Category: "зерновые", Allergens: []string{"глютен"}},
		{ID: "p017", ProductID: "prod_017", StoreID: "store_001", Name: "Гречка", Price: 75, Unit: "500г", Kcal: 152, ProteinG: 6, FatG: 1, CarbsG: 33, Category: "зерновые", Allergens: []string{"глютен"}},
		{ID: "p018", ProductID: "prod_018", StoreID: "store_001", Name: "Макароны спагетти", Price: 55, Unit: "400г", Kcal: 350, ProteinG: 12, FatG: 1, CarbsG: 70, Category: "зерновые", Allergens: []string{"глютен"}},
		{ID: "p019", ProductID: "prod_019", StoreID: "store_001", Name: "Овсянка", Price: 75, Unit: "500г", Kcal: 165, ProteinG: 6, FatG: 3, CarbsG: 27, Category: "зерновые", Allergens: []string{}},
		{ID: "p020", ProductID: "prod_020", StoreID: "store_001", Name: "Рис", Price: 85, Unit: "800г", Kcal: 130, ProteinG: 2, FatG: 0, CarbsG: 28, Category: "зерновые", Allergens: []string{"глютен"}},
		// Фрукты
		{ID: "p021", ProductID: "prod_021", StoreID: "store_001", Name: "Яблоко", Price: 95, Unit: "1кг", Kcal: 52, ProteinG: 0, FatG: 0, CarbsG: 14, Category: "фрукты", Allergens: []string{}},
		{ID: "p022", ProductID: "prod_022", StoreID: "store_001", Name: "Банан", Price: 65, Unit: "1кг", Kcal: 89, ProteinG: 1, FatG: 0, CarbsG: 23, Category: "фрукты", Allergens: []string{}},
		{ID: "p023", ProductID: "prod_023", StoreID: "store_001", Name: "Апельсин", Price: 85, Unit: "1кг", Kcal: 47, ProteinG: 0, FatG: 0, CarbsG: 12, Category: "фрукты", Allergens: []string{}},
		{ID: "p024", ProductID: "prod_024", StoreID: "store_001", Name: "Ягоды", Price: 150, Unit: "100г", Kcal: 40, ProteinG: 0, FatG: 0, CarbsG: 10, Category: "фрукты", Allergens: []string{}},
		{ID: "p025", ProductID: "prod_025", StoreID: "store_001", Name: "Мандарины", Price: 120, Unit: "500г", Kcal: 46, ProteinG: 0, FatG: 0, CarbsG: 12, Category: "фрукты", Allergens: []string{}},
		// Бакалея
		{ID: "p026", ProductID: "prod_026", StoreID: "store_001", Name: "Масло подсолнечное", Price: 110, Unit: "1л", Kcal: 884, ProteinG: 0, FatG: 100, CarbsG: 0, Category: "масла", Allergens: []string{}},
		{ID: "p027", ProductID: "prod_027", StoreID: "store_001", Name: "Сахар", Price: 45, Unit: "1кг", Kcal: 398, ProteinG: 0, FatG: 0, CarbsG: 100, Category: "сахар", Allergens: []string{}},
		{ID: "p028", ProductID: "prod_028", StoreID: "store_001", Name: "Соль", Price: 20, Unit: "1кг", Kcal: 0, ProteinG: 0, FatG: 0, CarbsG: 0, Category: "специи", Allergens: []string{}},
		{ID: "p029", ProductID: "prod_029", StoreID: "store_001", Name: "Перец черный", Price: 80, Unit: "50г", Kcal: 150, ProteinG: 0, FatG: 0, CarbsG: 35, Category: "специи", Allergens: []string{}},
		// Масла
		{ID: "p030", ProductID: "prod_030", StoreID: "store_001", Name: "Масло оливковое", Price: 350, Unit: "1л", Kcal: 884, ProteinG: 0, FatG: 100, CarbsG: 0, Category: "масла", Allergens: []string{}},
	}

	for _, p := range products {
		_, err := db.Exec(
			`INSERT INTO products (id, product_id, store_id, name, price_rub, unit, kcal, protein_g, fat_g, carbs_g, category, allergens)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			p.ID, p.ProductID, p.StoreID, p.Name, p.Price, p.Unit, p.Kcal, p.ProteinG, p.FatG, p.CarbsG, p.Category, p.Allergens,
		)
		if err != nil {
			log.Printf("Error inserting product %s: %v", p.Name, err)
		}
	}

	log.Printf("Inserted %d products into Mock Kuper DB", len(products))
	return nil
}

// hardcodedStores — запасные магазины если 2GIS недоступен
var hardcodedStores = []nearbyStore{
	{StoreID: "S1", StoreName: "Купер Тверская",        DistanceM: 320,  Address: "ул. Тверская, 15",         DeliveryTimeMins: 25},
	{StoreID: "S2", StoreName: "Купер Арбат",           DistanceM: 680,  Address: "ул. Арбат, 34",            DeliveryTimeMins: 35},
	{StoreID: "S3", StoreName: "Купер Пушкинская",      DistanceM: 950,  Address: "Пушкинская пл., 2",        DeliveryTimeMins: 40},
	{StoreID: "S4", StoreName: "Купер Садовое кольцо",  DistanceM: 1200, Address: "Садовая-Кудринская, 11",   DeliveryTimeMins: 50},
	{StoreID: "S5", StoreName: "Купер Патриаршие",      DistanceM: 1500, Address: "Малая Бронная, 26",        DeliveryTimeMins: 60},
}

type nearbyStore struct {
	StoreID        string `json:"store_id"`
	StoreName      string `json:"store_name"`
	DistanceM      int    `json:"distance_m"`
	Address        string `json:"address"`
	DeliveryTimeMins int   `json:"delivery_time_mins"`
}
