package kuper

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Register регистрирует все роуты mock-сервера Купера
func Register(r *gin.Engine) {
	r.Use(corsMiddleware())
	r.GET("/stores/nearby", handleNearbyStores)
	r.GET("/search", handleSearch)
	r.POST("/cart", handleCreateCart)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// GET /stores/nearby?lat=...&lng=...&limit=...
func handleNearbyStores(c *gin.Context) {
	lat := c.Query("lat")
	lng := c.Query("lng")

	stores := fetchFrom2GIS(lat, lng)
	if len(stores) == 0 {
		stores = hardcodedStores
	}

	c.JSON(http.StatusOK, stores)
}

func fetchFrom2GIS(lat, lng string) []nearbyStore {
	apiKey := os.Getenv("DGIS_KEY")
	if apiKey == "" || lat == "" || lng == "" {
		return staticStores
	}
	url := fmt.Sprintf(
		"https://catalog.api.2gis.com/3.0/items?q=купер&point=%s,%s&radius=3000&type=branch&key=%s&fields=items.point,items.address",
		lng, lat, apiKey,
	)
	resp, err := http.Get(url) //nolint:noctx
	if err != nil {
		log.Printf("2gis request failed: %v", err)
		return staticStores
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result struct {
		Result struct {
			Items []struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"items"`
		} `json:"result"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		log.Printf("2gis parse failed: %v", err)
		return staticStores
	}

	stores := make([]nearbyStore, 0, len(result.Result.Items))
	for i, item := range result.Result.Items {
		stores = append(stores, nearbyStore{
			StoreID:          item.ID,
			StoreName:        item.Name,
			DistanceM:        (i + 1) * 300,
			Address:          "адрес не найден",
			DeliveryTimeMins: 30 + (i+1)*15,
		})
	}
	return stores
}

// staticStores — фиксированные магазины Москвы с адресами для демо
var staticStores = []nearbyStore{
	{StoreID: "S1", StoreName: "Купер Тверская",        DistanceM: 320,  Address: "ул. Тверская, 15",         DeliveryTimeMins: 25},
	{StoreID: "S2", StoreName: "Купер Арбат",           DistanceM: 680,  Address: "ул. Арбат, 34",            DeliveryTimeMins: 35},
	{StoreID: "S3", StoreName: "Купер Пушкинская",      DistanceM: 950,  Address: "Пушкинская пл., 2",        DeliveryTimeMins: 40},
	{StoreID: "S4", StoreName: "Купер Садовое кольцо",  DistanceM: 1200, Address: "Садовая-Кудринская, 11",   DeliveryTimeMins: 50},
	{StoreID: "S5", StoreName: "Купер Патриаршие",      DistanceM: 1500, Address: "Малая Бронная, 26",        DeliveryTimeMins: 60},
}

// GET /search?q=...&store_id=...
func handleSearch(c *gin.Context) {
	if !initialized {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Mock Kuper DB not initialized"})
		return
	}

	q := strings.ToLower(c.Query("q"))
	storeID := c.Query("store_id")

	rows, err := db.Query(
		`SELECT id, name, price_rub, unit, kcal, protein_g, fat_g, carbs_g, allergens
		 FROM products WHERE name ILIKE $1 AND ($2 IS NULL OR store_id = $2) LIMIT 5`,
		"%"+q+"%", storeID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	results := make([]MockProductResponse, 0)
	for rows.Next() {
		var id string
		var name string
		var price int
		var unit string
		var kcal int
		var proteinG int
		var fatG int
		var carbsG int
		var allergensStr string

		if err := rows.Scan(&id, &name, &price, &unit, &kcal, &proteinG, &fatG, &carbsG, &allergensStr); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Парсим массив аллергенов
		var allergens []string
		if allergensStr != "" {
			// simplified parsing
			if strings.Contains(allergensStr, "[") && strings.Contains(allergensStr, "]") {
				allergensStr = allergensStr[1 : len(allergensStr)-1]
				for _, a := range strings.Split(allergensStr, ",") {
					allergens = append(allergens, strings.TrimSpace(a))
				}
			}
		}

		results = append(results, MockProductResponse{
			ProductID:   id,
			ProductName: name,
			PriceRub:    price,
			Found:       true,
			Kcal:        kcal, // добавляем КБЖУ в ответ
		})
	}

	c.JSON(http.StatusOK, results)
}

// POST /cart
func handleCreateCart(c *gin.Context) {
	var req struct {
		StoreID    string   `json:"store_id"`
		ProductIDs []string `json:"product_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	total := 0
	for _, pid := range req.ProductIDs {
		rows, err := db.Query(
			`SELECT price_rub FROM products WHERE id = $1`,
			pid,
		)
		if err != nil {
			log.Printf("Error getting product price: %v", err)
			continue
		}
		var price int
		if rows.Next() {
			if err := rows.Scan(&price); err == nil {
				total += price
			}
		}
		rows.Close()
	}

	// Фейковый cart ID
	cartID := uuid.New().String()

	// FAKE checkout URL для демо
	checkoutURL := "https://kuper.ru/cart/mock"

	c.JSON(http.StatusOK, gin.H{
		"cart_id":      cartID,
		"checkout_url": checkoutURL, // заглушка!
		"total_rub":    total,
	})
}
