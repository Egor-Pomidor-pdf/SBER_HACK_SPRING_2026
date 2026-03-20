package config

import "os"

type Config struct {
	DSN           string
	GigaChatURL   string
	GigaChatToken string
	KuperBaseURL  string
	Port          string
}

func Load() *Config {
	return &Config{
		DSN:           getEnv("DSN", "postgres://postgres:postgres@localhost:5432/hudeem?sslmode=disable"),
		GigaChatURL:   getEnv("GIGACHAT_URL", "https://gigachat.devices.sberbank.ru/api/v1"),
		GigaChatToken: getEnv("GIGACHAT_TOKEN", ""),
		KuperBaseURL:  getEnv("KUPER_BASE_URL", "http://localhost:8081"),
		Port:          getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
