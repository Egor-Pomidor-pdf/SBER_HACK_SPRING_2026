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
		return nil
	}
	url := fmt.Sprintf(
		"https://catalog.api.2gis.com/3.0/items?q=купер&point=%s,%s&radius=3000&type=branch&key=%s&fields=items.point,items.address",
		lng, lat, apiKey,
	)
	resp, err := http.Get(url) //nolint:noctx
	if err != nil {
		log.Printf("2gis request failed: %v", err)
		return nil
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
		return nil
	}

	stores := make([]nearbyStore, 0, len(result.Result.Items))
	for i, item := range result.Result.Items {
		stores = append(stores, nearbyStore{
			StoreID:   item.ID,
			StoreName: item.Name,
			DistanceM: (i + 1) * 300,
		})
	}
	return stores
}

// GET /search?q=...&store_id=...
func handleSearch(c *gin.Context) {
	q := strings.ToLower(c.Query("q"))

	for _, p := range catalog {
		if strings.Contains(strings.ToLower(p.Name), q) {
			c.JSON(http.StatusOK, gin.H{
				"product_id":   p.ID,
				"product_name": p.Name,
				"price_rub":    p.Price,
				"found":        true,
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"found": false})
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
		for _, p := range catalog {
			if p.ID == pid {
				total += p.Price
				break
			}
		}
	}

	cartID := uuid.New().String()
	c.JSON(http.StatusOK, gin.H{
		"cart_id":      cartID,
		"checkout_url": fmt.Sprintf("https://kuper.ru/cart/%s", cartID),
		"total_rub":    total,
	})
}
