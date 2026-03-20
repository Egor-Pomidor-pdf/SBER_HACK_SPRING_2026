package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	// TODO: Илья А. — зарегистрировать роуты из internal/mock/kuper/handler.go
	// mockhandler.Register(r)
	log.Println("mock kuper starting on :8081")
	if err := r.Run(":8081"); err != nil {
		log.Fatalf("mock kuper: %v", err)
	}
}
