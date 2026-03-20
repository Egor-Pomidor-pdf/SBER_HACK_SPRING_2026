package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"

	mockhandler "hudeem-backend/internal/mock/kuper"
)

func main() {
	port := os.Getenv("MOCK_KUPER_PORT")
	if port == "" {
		port = "8081"
	}

	r := gin.Default()
	mockhandler.Register(r)

	log.Printf("mock kuper starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("mock kuper: %v", err)
	}
}
