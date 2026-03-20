package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"hudeem-backend/internal/config"
	"hudeem-backend/internal/handler"
	"hudeem-backend/internal/orchestrator"
	profilerepo "hudeem-backend/internal/repository/profile"
	rationrepo "hudeem-backend/internal/repository/ration"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()

	db, err := pgxpool.New(context.Background(), cfg.DSN)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer db.Close()

	rationRepo := rationrepo.New(db)
	profileRepo := profilerepo.New(db)

	// GigaChat and Kuper services will be injected by other team members.
	// For now, orchestrator accepts nil — handlers that don't need them still work.
	orch := orchestrator.New(nil, nil, nil, rationRepo)

	h := handler.NewHandler(orch, rationRepo, profileRepo)
	router := handler.NewRouter(h)

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
