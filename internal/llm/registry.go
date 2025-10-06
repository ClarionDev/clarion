package llm

import (
	"fmt"
	"sync"
)

// providerRegistry holds all registered LLM providers.
var providerRegistry = make(map[string]Provider)
var registryMutex sync.RWMutex

// RegisterProvider registers an LLM provider implementation with a specific name.
// The name should be the same as the Provider field in models.LLMConfig (e.g., "OpenAI", "Anthropic").
func RegisterProvider(name string, provider Provider) {
	registryMutex.Lock()
	defer registryMutex.Unlock()

	if _, exists := providerRegistry[name]; exists {
		// This is likely fine during startup, but we'll log it as a warning
		// in a more complex system you might want to panic.
		return
	}
	providerRegistry[name] = provider
}

// GetProvider retrieves an LLM provider by its name.
func GetProvider(name string) (Provider, error) {
	registryMutex.RLock()
	defer registryMutex.RUnlock()

	provider, ok := providerRegistry[name]
	if !ok {
		return nil, fmt.Errorf("unsupported LLM provider: %s. Please check your agent configuration.", name)
	}
	return provider, nil
}
