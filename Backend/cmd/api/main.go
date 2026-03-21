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
	gigachatsvc "hudeem-backend/internal/service/gigachat"
	kupersvc "hudeem-backend/internal/service/kuper"
	profilerepo "hudeem-backend/internal/repository/profile"
	rationrepo "hudeem-backend/internal/repository/ration"

	gigachatclient "hudeem-backend/internal/client/gigachat"
	kuperclient "hudeem-backend/internal/client/kuper"
	profilesvc "hudeem-backend/internal/service/profile"

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

	gcClient := gigachatclient.New(cfg.GigaChatURL, cfg.GigaChatToken)
	kuperClient := kuperclient.NewHTTPClient()

	gigaSvc := gigachatsvc.New(gcClient)
	kuperSvc := kupersvc.NewService(kuperClient)
	profileSvc := profilesvc.New(profileRepo)

	orch := orchestrator.New(profileSvc, gigaSvc, kuperSvc, rationRepo)

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
