package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/loks1k192/ration-service/internal/model"
	"github.com/loks1k192/ration-service/internal/orchestrator"
)

type CartHandler struct {
	orchestrator *orchestrator.RationOrchestrator
}

func NewCartHandler(orch *orchestrator.RationOrchestrator) *CartHandler {
	return &CartHandler{orchestrator: orch}
}

// POST /api/v1/ration/:id/cart
func (h *CartHandler) CreateCart(c *gin.Context) {
	rationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ration id"})
		return
	}

	var req model.CreateCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
		return
	}

	storeID, err := uuid.Parse(req.StoreID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid store_id format"})
		return
	}

	resp, err := h.orchestrator.CreateCart(c.Request.Context(), rationID, storeID)
	if err != nil {
		log.Printf("error creating cart: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create cart"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
