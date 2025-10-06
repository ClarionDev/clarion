package llm

import (
	"context"
	"fmt"
	"log"

	"github.com/ClarionDev/clarion/internal/models"
)

func init() {
	RegisterProvider("Google Gemini", &GeminiProvider{})
}

// GeminiProvider implements the Provider interface for the Google Gemini LLM API.
type GeminiProvider struct{}

// Generate sends a request to the Gemini API and returns the structured output.
func (p *GeminiProvider) Generate(ctx context.Context, messages []ChatMessage, request models.AgentRunRequest) (map[string]any, error) {
	log.Printf("GeminiProvider selected, but it is not fully implemented yet.")
	return nil, fmt.Errorf("provider 'Google Gemini' is not yet implemented")
}
