package handler

import (
	"net/http"

	"hudeem-backend/internal/orchestrator"
	rationrepo "hudeem-backend/internal/repository/ration"

	profilerepo "hudeem-backend/internal/repository/profile"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	orch        *orchestrator.Orchestrator
	rationRepo  rationrepo.Repository
	profileRepo profilerepo.Repository
}

func NewHandler(orch *orchestrator.Orchestrator, rationRepo rationrepo.Repository, profileRepo profilerepo.Repository) *Handler {
	return &Handler{
		orch:        orch,
		rationRepo:  rationRepo,
		profileRepo: profileRepo,
	}
}

func NewRouter(h *Handler) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	{
		api.POST("/ration", h.GenerateRation)
		api.GET("/ration/history", h.GetRationHistory)
		api.GET("/ration/:id", h.GetRation)
		api.POST("/ration/:id/cart", h.CreateCart)

		api.GET("/profile", h.GetProfile)
		api.PUT("/profile", h.UpdateProfile)
	}

	return r
}
