package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"hudeem-backend/internal/config"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	// TODO: инициализация после реализации repository/service/handler
	// db, err := pgxpool.New(context.Background(), cfg.DSN)
	// if err != nil {
	//     log.Fatalf("connect db: %v", err)
	// }
	// defer db.Close()
	//
	// rationRepo := rationrepo.New(db)
	// profileSvc := profilerepo.New(db)
	// gigachatClient := gigachatclient.New(cfg.GigaChatURL, cfg.GigaChatToken)
	// kuperClient := kuperclient.New(cfg.KuperBaseURL)
	// gigachatSvc := gigachatsvc.New(gigachatClient)
	// kuperSvc := kupersvc.New(kuperClient)
	// orch := orchestrator.New(profileSvc, gigachatSvc, kuperSvc, rationRepo)
	// router := handler.NewRouter(orch)

	router := gin.Default()
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("server starting on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
