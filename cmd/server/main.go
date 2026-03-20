package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/loks1k192/ration-service/internal/handler"
	"github.com/loks1k192/ration-service/internal/orchestrator"
	"github.com/loks1k192/ration-service/internal/repository"
)

func main() {
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "ration")
	dbPass := getEnv("DB_PASSWORD", "ration")
	dbName := getEnv("DB_NAME", "ration_db")
	serverPort := getEnv("SERVER_PORT", "8080")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPass, dbName)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("connected to database")

	// Repositories
	profileRepo := repository.NewProfileRepository(db)
	rationRepo := repository.NewRationRepository(db)
	kuperRepo := repository.NewKuperRepository(db)

	// Orchestrator (GigaChat and Kuper services will be injected by other team members)
	// For now, pass nil — handlers that don't need them will still work
	orch := orchestrator.NewRationOrchestrator(profileRepo, rationRepo, kuperRepo, nil, nil)

	// Handlers
	rationHandler := handler.NewRationHandler(orch, rationRepo)
	cartHandler := handler.NewCartHandler(orch)
	profileHandler := handler.NewProfileHandler(profileRepo)

	// Router
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	{
		api.POST("/ration", rationHandler.GenerateRation)
		api.GET("/ration/history", rationHandler.GetHistory)
		api.GET("/ration/:id", rationHandler.GetRationByID)
		api.POST("/ration/:id/cart", cartHandler.CreateCart)

		api.GET("/profile", profileHandler.GetProfile)
	}

	log.Printf("starting server on :%s", serverPort)
	if err := r.Run(":" + serverPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
