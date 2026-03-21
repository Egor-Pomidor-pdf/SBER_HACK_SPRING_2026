package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"

	mockhandler "hudeem-backend/internal/mock/kuper"
)

func main() {
	port := os.Getenv("MOCK_KUPER_PORT")
	if port == "" {
		port = "8081"
	}

	// Инициализируем SQLite базу для Mock Купера
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		log.Fatalf("Error opening SQLite DB: %v", err)
	}
	defer db.Close()

	if err := mockhandler.InitializedMockKuperDB(db); err != nil {
		log.Fatalf("Error initializing Mock Kuper DB: %v", err)
	}

	r := gin.Default()
	mockhandler.Register(r)

	log.Printf("mock kuper starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("mock kuper: %v", err)
	}
}
