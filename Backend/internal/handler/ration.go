package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type generateRationRequest struct {
	UserID        string                       `json:"user_id" binding:"required"`
	Lat           float64                      `json:"lat" binding:"required"`
	Lng           float64                      `json:"lng" binding:"required"`
	ConsumedMeals []model.ConsumedMealDTO      `json:"consumed_meals" binding:"omitempty"`
}

func (h *Handler) GenerateRation(c *gin.Context) {
	var req generateRationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	resp, err := h.orch.GenerateRation(c.Request.Context(), userID, req.Lat, req.Lng, req.ConsumedMeals)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetRation(c *gin.Context) {
	rationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ration id"})
		return
	}

	ctx := c.Request.Context()

	ration, err := h.rationRepo.GetRationByID(ctx, rationID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ration not found"})
		return
	}

	meals, err := h.rationRepo.GetMealsByRationID(ctx, rationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ingredients, err := h.rationRepo.GetIngredientsByRationID(ctx, rationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stores, err := h.rationRepo.GetStoresByRationID(ctx, rationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ration_id":   ration.ID,
		"ration_date": ration.RationDate,
		"total_kcal":  ration.TotalKcal,
		"status":      ration.Status,
		"created_at":  ration.CreatedAt,
		"meals":       meals,
		"ingredients": ingredients,
		"stores":      stores,
	})
}

func (h *Handler) GetRationHistory(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query param required"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	rations, err := h.rationRepo.GetRationsByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rations": rations})
}
