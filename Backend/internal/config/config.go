package config

type Config struct {
	DSN           string
	GigaChatURL   string
	GigaChatToken string
	KuperBaseURL  string
	Port          string
}

func Load() *Config {
	return &Config{
		DSN:           "postgres://postgres:postgres@localhost:5432/hudeem?sslmode=disable",
		GigaChatURL:   "https://gigachat.devices.sberbank.ru/api/v1",
		GigaChatToken: "YOUR_GIGACHAT_TOKEN",
		KuperBaseURL:  "http://localhost:8081",
		Port:          "8080",
	}
}
