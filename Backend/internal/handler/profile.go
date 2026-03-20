package handler

import (
	"net/http"

	"hudeem-backend/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *Handler) GetProfile(c *gin.Context) {
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

	profile, err := h.profileRepo.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

type updateProfileRequest struct {
	UserID            string `json:"user_id" binding:"required"`
	RemainingKcal     int    `json:"remaining_kcal"`
	RemainingProteinG int    `json:"remaining_protein_g"`
	RemainingFatG     int    `json:"remaining_fat_g"`
	RemainingCarbsG   int    `json:"remaining_carbs_g"`
	DailyKcal         int    `json:"daily_kcal"`
	Goal              string `json:"goal"`
	Dietary           string `json:"dietary_restrictions"`
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	p := &model.UserProfile{
		UserID:              userID,
		RemainingKcal:       req.RemainingKcal,
		RemainingProteinG:   req.RemainingProteinG,
		RemainingFatG:       req.RemainingFatG,
		RemainingCarbsG:     req.RemainingCarbsG,
		DailyKcal:           req.DailyKcal,
		Goal:                req.Goal,
		DietaryRestrictions: req.Dietary,
	}

	if err := h.profileRepo.Update(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}
