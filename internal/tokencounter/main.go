package tokencounter

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"strings"
	"sync"
	"unicode"

	"github.com/ClarionDev/clarion/internal/models"
)

const wordTokenMultiplier = 1.33 // 1 token ~ 0.75 words

type CounterProvider interface {
	Count(ctx context.Context, modelName string, content string) (int, error)
}

var (
	registryMutex    sync.RWMutex
	providerRegistry = make(map[string]CounterProvider)
)

func RegisterProvider(providerName string, provider CounterProvider) {
	registryMutex.Lock()
	defer registryMutex.Unlock()
	providerRegistry[providerName] = provider
}

func GetProviderFor(providerName string) CounterProvider {
	registryMutex.RLock()
	defer registryMutex.RUnlock()
	return providerRegistry[providerName]
}

func SetupProviders(ctx context.Context, log *slog.Logger) {
	tiktokenCounter := NewTiktokenCounter()
	RegisterProvider(models.ProviderOpenAI, tiktokenCounter)
	RegisterProvider(models.ProviderAnthropic, tiktokenCounter)
	RegisterProvider(models.ProviderOpenRouter, tiktokenCounter)
	// For now, Google Gemini will use approximation until a dedicated counter is implemented.
	RegisterProvider(models.ProviderGoogle, &ApproximationCounter{})
}

type ApproximationCounter struct{}

func (a *ApproximationCounter) Count(_ context.Context, _ string, content string) (int, error) {
	return BasicTokenApproximation(content), nil
}

func BasicTokenApproximation(s string) int {
	if s == "" {
		return 0
	}
	wordCount := 0
	inWord := false
	for _, r := range s {
		if unicode.IsSpace(r) || unicode.IsPunct(r) {
			inWord = false
		} else if !inWord {
			wordCount++
			inWord = true
		}
	}
	approximation := float64(wordCount) * wordTokenMultiplier
	return int(math.Ceil(approximation))
}

func init() {
	RegisterProvider("Approximation", &ApproximationCounter{})
}

func Count(ctx context.Context, agent *models.Agent, userPrompt string, codebaseContent string) (int, error) {
	if agent == nil {
		return 0, fmt.Errorf("agent cannot be nil")
	}

	provider := GetProviderFor(agent.LLMConfig.Provider)
	if provider == nil {
		provider = GetProviderFor("Approximation")
	}

	var builder strings.Builder
	builder.WriteString(agent.SystemPrompt)
	builder.WriteString("\n\n")
	builder.WriteString("## Codebase Context\n")
	builder.WriteString(codebaseContent)
	builder.WriteString("\n\n## User's Task\n")
	builder.WriteString(userPrompt)

	if agent.OutputSchema.Schema != nil && len(agent.OutputSchema.Schema) > 0 {
		builder.WriteString("\n\n## Output Schema\n")
		builder.WriteString("```json\n")
		schemaBytes, err := json.MarshalIndent(agent.OutputSchema.Schema, "", "  ")
		if err == nil { // Silently ignore marshalling errors for counting
			builder.Write(schemaBytes)
		}
		builder.WriteString("\n```\n")
	}

	combinedContent := builder.String()

	count, err := provider.Count(ctx, agent.LLMConfig.Model, combinedContent)
	if err != nil {
		if agent.LLMConfig.Provider != "Approximation" {
			fallbackCount := BasicTokenApproximation(combinedContent)
			slog.Warn("Provider token counting failed, falling back to approximation",
				"provider", agent.LLMConfig.Provider,
				"error", err,
				"fallback_count", fallbackCount,
			)
			return fallbackCount, nil
		}
		return 0, fmt.Errorf("approximation token counting failed: %w", err)
	}

	return count, nil
}
