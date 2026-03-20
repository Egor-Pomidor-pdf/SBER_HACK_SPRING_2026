package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/loks1k192/ration-service/internal/model"
	"github.com/loks1k192/ration-service/internal/orchestrator"
	"github.com/loks1k192/ration-service/internal/repository"
)

type RationHandler struct {
	orchestrator *orchestrator.RationOrchestrator
	rationRepo   *repository.RationRepository
}

func NewRationHandler(orch *orchestrator.RationOrchestrator, rationRepo *repository.RationRepository) *RationHandler {
	return &RationHandler{
		orchestrator: orch,
		rationRepo:   rationRepo,
	}
}

// POST /api/v1/ration
func (h *RationHandler) GenerateRation(c *gin.Context) {
	var req model.GenerateRationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id format"})
		return
	}

	resp, err := h.orchestrator.GenerateRation(c.Request.Context(), userID, req.Lat, req.Lng)
	if err != nil {
		log.Printf("error generating ration: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate ration"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GET /api/v1/ration/history
func (h *RationHandler) GetHistory(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query parameter required"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id format"})
		return
	}

	items, err := h.rationRepo.GetHistory(c.Request.Context(), userID)
	if err != nil {
		log.Printf("error fetching history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch history"})
		return
	}

	if items == nil {
		items = []model.RationHistoryItem{}
	}

	c.JSON(http.StatusOK, gin.H{"rations": items})
}

// GET /api/v1/ration/:id
func (h *RationHandler) GetRationByID(c *gin.Context) {
	rationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ration id"})
		return
	}

	ration, meals, ingredients, stores, err := h.rationRepo.GetRationByID(c.Request.Context(), rationID)
	if err != nil {
		log.Printf("error fetching ration: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "ration not found"})
		return
	}

	resp := model.GenerateRationResponse{
		RationID: ration.ID,
	}
	for _, m := range meals {
		resp.Meals = append(resp.Meals, model.MealResponse{
			MealType: m.MealType,
			Name:     m.Name,
			Kcal:     m.Kcal,
		})
	}
	for _, ing := range ingredients {
		resp.Ingredients = append(resp.Ingredients, model.IngredientResponse{
			ID:       ing.ID,
			Name:     ing.Name,
			Quantity: ing.Quantity,
			Unit:     ing.Unit,
		})
	}
	for _, s := range stores {
		resp.Stores = append(resp.Stores, model.StoreResponse{
			ID:        s.ID,
			StoreID:   s.StoreID,
			StoreName: s.StoreName,
			DistanceM: s.DistanceM,
		})
	}

	c.JSON(http.StatusOK, resp)
}
