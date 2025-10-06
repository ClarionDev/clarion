package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/ClarionDev/clarion/internal/models"
	"github.com/ClarionDev/clarion/internal/storage"
)

func init() {
	RegisterProvider("OpenRouter", &OpenRouterProvider{})
}

type OpenRouterProvider struct{}

type ChatCompletionRequest struct {
	Model          string                  `json:"model"`
	Messages       []ChatCompletionMessage `json:"messages"`
	ResponseFormat *ResponseFormat         `json:"response_format,omitempty"`
	Temperature    *float64                `json:"temperature,omitempty"`
	TopP           *float64                `json:"top_p,omitempty"`
	MaxTokens      *int                    `json:"max_tokens,omitempty"`
}

type ChatCompletionMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ResponseFormat struct {
	Type       string          `json:"type"`
	JSONSchema *JSONSchemaSpec `json:"json_schema,omitempty"`
}

type JSONSchemaSpec struct {
	Name   string         `json:"name"`
	Strict bool           `json:"strict"`
	Schema map[string]any `json:"schema"`
}

type ChatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func enforceSchemaCompliance(schema map[string]any) {
	if t, ok := schema["type"].(string); ok && t == "object" {
		schema["additionalProperties"] = false

		if properties, ok := schema["properties"].(map[string]any); ok {
			requiredKeys := make([]string, 0, len(properties))
			for key := range properties {
				requiredKeys = append(requiredKeys, key)
			}
			schema["required"] = requiredKeys
		}
	}

	if properties, ok := schema["properties"].(map[string]any); ok {
		for _, propSchema := range properties {
			if subSchema, ok := propSchema.(map[string]any); ok {
				enforceSchemaCompliance(subSchema)
			}
		}
	}

	if items, ok := schema["items"].(map[string]any); ok {
		enforceSchemaCompliance(items)
	}
}

func (o *OpenRouterProvider) Generate(ctx context.Context, messages []ChatMessage, request models.AgentRunRequest, llmConfigStore storage.LLMConfigStore) (map[string]any, error) {
	if request.LLMConfig.ConfigID == "" {
		return nil, errors.New("API key for OpenRouter is not configured (missing Config ID)")
	}

	config, err := llmConfigStore.GetLLMConfig(ctx, request.LLMConfig.ConfigID)
	if err != nil {
		return nil, fmt.Errorf("failed to get LLM config for OpenRouter: %w", err)
	}
	apiKey := config.APIKey

	requestBody, err := createOpenRouterRequestPayload(request, messages)
	if err != nil {
		return nil, fmt.Errorf("failed to create OpenRouter request payload: %w", err)
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create POST request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request to OpenRouter: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errResp struct {
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		if json.Unmarshal(bodyBytes, &errResp) == nil && errResp.Error.Message != "" {
			return nil, fmt.Errorf("OpenRouter API error (%d): %s", resp.StatusCode, errResp.Error.Message)
		}
		return nil, fmt.Errorf("OpenRouter API error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var apiResp ChatCompletionResponse
	if err := json.Unmarshal(bodyBytes, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal OpenRouter response: %w. Body: %s", err, string(bodyBytes))
	}

	if apiResp.Error != nil {
		return nil, fmt.Errorf("OpenRouter API returned an error: %v", apiResp.Error.Message)
	}
	if len(apiResp.Choices) == 0 {
		return nil, errors.New("invalid response from OpenRouter: choices array is empty")
	}

	jsonContent := apiResp.Choices[0].Message.Content
	var finalOutput map[string]any
	if err := json.Unmarshal([]byte(jsonContent), &finalOutput); err != nil {
		return nil, fmt.Errorf("failed to unmarshal final JSON output from model: %w. Raw content: %s", err, jsonContent)
	}

	return finalOutput, nil
}

func createOpenRouterRequestPayload(request models.AgentRunRequest, messages []ChatMessage) (ChatCompletionRequest, error) {
	var chatMessages []ChatCompletionMessage
	for _, msg := range messages {
		chatMessages = append(chatMessages, ChatCompletionMessage(msg))
	}

	payload := ChatCompletionRequest{
		Model:    request.LLMConfig.Model,
		Messages: chatMessages,
	}

	if len(request.OutputSchema) > 0 {
		schema, ok := request.OutputSchema["schema"].(map[string]any)
		if !ok {
			log.Println("Warning: output_schema format for OpenRouter is incorrect, expected a nested 'schema' object.")
		} else {
			enforceSchemaCompliance(schema)
			payload.ResponseFormat = &ResponseFormat{
				Type: "json_schema",
				JSONSchema: &JSONSchemaSpec{
					Name:   "structured_output",
					Strict: true,
					Schema: schema,
				},
			}
		}
	}

	if params := request.LLMConfig.Parameters; params != nil {
		if temp, ok := params["temperature"].(float64); ok {
			payload.Temperature = &temp
		}
		if topP, ok := params["top_p"].(float64); ok {
			payload.TopP = &topP
		}
		if maxTokens, ok := params["max_tokens"].(float64); ok {
			maxTokensInt := int(maxTokens)
			payload.MaxTokens = &maxTokensInt
		}
	}

	return payload, nil
}
