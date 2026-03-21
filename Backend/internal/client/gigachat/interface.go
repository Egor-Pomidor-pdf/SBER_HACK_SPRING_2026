package gigachat

import "context"

type Client interface {
	Complete(ctx context.Context, systemPrompt, userPrompt string) (string, error)
}
