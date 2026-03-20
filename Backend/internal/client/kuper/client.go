package kuper

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

	"hudeem-backend/internal/model"
)

type HTTPClient struct {
	baseURL string
	http    *http.Client
}

func NewHTTPClient() *HTTPClient {
	base := os.Getenv("KUPER_MOCK_URL")
	if base == "" {
		base = "http://localhost:8081"
	}
	return &HTTPClient{
		baseURL: base,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *HTTPClient) GetNearbyStores(ctx context.Context, lat, lng float64, limit int) ([]model.KuperNearbyStore, error) {
	u := fmt.Sprintf("%s/stores/nearby?lat=%f&lng=%f&limit=%d", c.baseURL, lat, lng, limit)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("kuper nearby stores: status %d", resp.StatusCode)
	}
	var result []model.KuperNearbyStore
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

func (c *HTTPClient) SearchProduct(ctx context.Context, query string, storeID string) (*model.KuperSearchResult, error) {
	u := fmt.Sprintf("%s/search?q=%s&store_id=%s", c.baseURL, url.QueryEscape(query), url.QueryEscape(storeID))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("kuper search: status %d", resp.StatusCode)
	}
	var result model.KuperSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *HTTPClient) CreateCart(ctx context.Context, storeID string, productIDs []string) (*model.KuperCartCreateResponse, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"store_id":    storeID,
		"product_ids": productIDs,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/cart", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("kuper create cart: status %d", resp.StatusCode)
	}
	var result model.KuperCartCreateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}
