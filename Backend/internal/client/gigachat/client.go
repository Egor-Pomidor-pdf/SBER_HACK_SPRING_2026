package gigachat

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

type HTTPClient struct {
	baseURL      string
	credentials  string
	token        string
	tokenExpiry  time.Time
	tokenMutex   sync.Mutex
	tokenClient  *http.Client
	chatClient   *http.Client
}

func New(baseURL, credentials string) *HTTPClient {
	tokenClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
		Timeout: 30 * time.Second,
	}

	chatClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
		Timeout: 30 * time.Second,
	}

	return &HTTPClient{
		baseURL:     baseURL,
		credentials: credentials,
		tokenClient: tokenClient,
		chatClient:  chatClient,
	}
}

func (c *HTTPClient) ensureToken(ctx context.Context) error {
	c.tokenMutex.Lock()
	defer c.tokenMutex.Unlock()

	if c.token != "" && time.Now().Before(c.tokenExpiry.Add(-1 * time.Minute)) {
		return nil
	}

	reqBody := url.Values{}
	reqBody.Set("scope", "GIGACHAT_API_PERS")
	reqBody.Set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer")

	req, err := http.NewRequestWithContext(ctx, "POST",
		"https://ngw.devices.sberbank.ru:9443/api/v2/oauth", strings.NewReader(reqBody.Encode()))
	if err != nil {
		return fmt.Errorf("create oauth request: %w", err)
	}

	req.Header.Set("Authorization", "Basic "+c.credentials)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("RqUID", uuid.New().String())

	resp, err := c.tokenClient.Do(req)
	if err != nil {
		return fmt.Errorf("oauth request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("oauth status %d", resp.StatusCode)
	}

	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresAt   int64  `json:"expires_at"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("oauth decode: %w", err)
	}

	c.token = result.AccessToken
	c.tokenExpiry = time.UnixMilli(result.ExpiresAt)

	return nil
}

func (c *HTTPClient) Complete(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	if err := c.ensureToken(ctx); err != nil {
		return "", err
	}

	reqBody := map[string]interface{}{
		"model": "GigaChat",
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"max_tokens": 2048,
	}

	body, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST",
		c.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.chatClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("chat status %d", resp.StatusCode)
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("gigachat returned empty choices")
	}

	content := result.Choices[0].Message.Content
	content = strings.TrimSpace(content)

	if strings.HasPrefix(content, "```json") {
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimPrefix(content, "\n")
	}

	if strings.HasSuffix(content, "```") {
		content = strings.TrimSuffix(content, "```")
		content = strings.TrimSuffix(content, "\n")
	}

	content = strings.TrimSpace(content)

	return content, nil
}
