package llm

import (
	"context"
	"github.com/ClarionDev/clarion/internal/models"
)

type Provider interface {
	// Generate is the core method for the LLM. It takes a pre-constructed set of messages
	// and the agent request configuration to return the LLM's raw JSON response.
	Generate(ctx context.Context, messages []ChatMessage, request models.AgentRunRequest) (map[string]any, error)
}

// RegisterProviders is called once on application startup to load all known providers.
func RegisterProviders() {
	// Providers are registered in their respective files' init() functions
	// by calling RegisterProvider.
	// This function serves as the entry point for initialization.
}
