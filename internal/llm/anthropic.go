package llm

import (
	"context"
	"fmt"
	"log"

	"github.com/ClarionDev/clarion/internal/models"
)

func init() {
	RegisterProvider("Anthropic", &AnthropicProvider{})
}

// AnthropicProvider implements the Provider interface for the Anthropic LLM API.
type AnthropicProvider struct{}

// Generate sends a request to the Anthropic API and returns the structured output.
func (p *AnthropicProvider) Generate(ctx context.Context, messages []ChatMessage, request models.AgentRunRequest) (map[string]any, error) {
	log.Printf("AnthropicProvider selected, but it is not fully implemented yet.")
	return nil, fmt.Errorf("provider 'Anthropic' is not yet implemented")
}
