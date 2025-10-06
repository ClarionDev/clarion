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
	RegisterProvider("OpenAI", &OpenAIProvider{})
}

type OpenAIProvider struct{}

type Input struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Reasoning struct {
	Effort string `json:"effort"`
}

type OutputSchemaContent map[string]any

type Format struct {
	Type   string              `json:"type"`
	Name   string              `json:"name"`
	Schema OutputSchemaContent `json:"schema"`
	Strict bool                `json:"strict"`
}

type Text struct {
	Format Format `json:"format"`
}

type RequestPayload struct {
	Model           string     `json:"model"`
	Reasoning       *Reasoning `json:"reasoning,omitempty"`
	Input           []Input    `json:"input"`
	Text            *Text      `json:"text,omitempty"`
	Temperature     *float64   `json:"temperature,omitempty"`
	TopP            *float64   `json:"top_p,omitempty"`
	MaxOutputTokens *int       `json:"max_output_tokens,omitempty"`
}

// enforceSchemaCompliance recursively traverses a JSON schema to ensure it meets
// OpenAI's strict requirements.
func enforceSchemaCompliance(schema map[string]any) {
	// Apply rules only if the current level is an object.
	if t, ok := schema["type"].(string); ok && t == "object" {
		// Rule 1: Add "additionalProperties": false
		schema["additionalProperties"] = false

		// Rule 2: Ensure all properties are in the "required" array.
		if properties, ok := schema["properties"].(map[string]any); ok {
			requiredKeys := make([]string, 0, len(properties))
			for key := range properties {
				requiredKeys = append(requiredKeys, key)
			}
			schema["required"] = requiredKeys
		}
	}

	// --- ALWAYS attempt to recurse deeper, regardless of the current type ---

	// Recurse into nested properties of an object.
	if properties, ok := schema["properties"].(map[string]any); ok {
		for _, propSchema := range properties {
			if subSchema, ok := propSchema.(map[string]any); ok {
				enforceSchemaCompliance(subSchema)
			}
		}
	}

	// Recurse into the "items" of an array.
	if items, ok := schema["items"].(map[string]any); ok {
		enforceSchemaCompliance(items)
	}
}

func CreateRequestPayload(runRequest models.AgentRunRequest, messages []ChatMessage) RequestPayload {
	var inputs []Input
	for _, msg := range messages {
		inputs = append(inputs, Input(msg)) // Use direct type conversion
	}

	var text *Text
	if len(runRequest.OutputSchema) > 0 {
		actualSchema, ok := runRequest.OutputSchema["schema"].(map[string]any)
		if !ok {
			log.Println("Warning: output_schema format is incorrect, expected a nested 'schema' object.")
		} else {
			enforceSchemaCompliance(actualSchema)
			text = &Text{
				Format: Format{
					Type:   "json_schema",
					Name:   "structured_output",
					Schema: actualSchema,
					Strict: true,
				},
			}
		}
	}

	payload := RequestPayload{
		Model: runRequest.LLMConfig.Model,
		Input: inputs,
		Text:  text,
	}

	if params := runRequest.LLMConfig.Parameters; params != nil {
		if temp, ok := params["temperature"].(float64); ok {
			payload.Temperature = &temp
		}
		if topP, ok := params["top_p"].(float64); ok {
			payload.TopP = &topP
		}
		if maxTokens, ok := params["max_output_tokens"].(float64); ok {
			maxTokensInt := int(maxTokens)
			payload.MaxOutputTokens = &maxTokensInt
		}
		if effort, ok := params["reasoning_effort"].(string); ok {
			payload.Reasoning = &Reasoning{Effort: effort}
		}
	}
	return payload
}

func SetRequestHeaders(req *http.Request, apiKey string) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
}

func (o *OpenAIProvider) Generate(ctx context.Context, messages []ChatMessage, request models.AgentRunRequest, llmConfigStore storage.LLMConfigStore) (map[string]any, error) {
	url := "https://api.openai.com/v1/responses"

	if request.LLMConfig.ConfigID == "" {
		return nil, errors.New("agent's LLM configuration is missing a Config ID")
	}

	llmConfig, err := llmConfigStore.GetLLMConfig(ctx, request.LLMConfig.ConfigID)
	if err != nil {
		return nil, fmt.Errorf("failed to load LLM config '%s': %w", request.LLMConfig.ConfigID, err)
	}
	apiKey := llmConfig.APIKey

	if apiKey == "" {
		return nil, fmt.Errorf("API key for LLM config '%s' is empty", request.LLMConfig.ConfigID)
	}

	requestBody := CreateRequestPayload(request, messages)
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("error marshalling request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("error creating POST request: %w", err)
	}

	SetRequestHeaders(req, apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making HTTP request to OpenAI: %w", err)
	}
	defer resp.Body.Close()

	type ResponseContent struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	type OutputItem struct {
		Type    string            `json:"type"`
		Content []ResponseContent `json:"content,omitempty"`
	}
	type APIResponse struct {
		Output []OutputItem `json:"output"`
		Error  any          `json:"error"`
	}

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error (%s): %s", resp.Status, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	log.Printf("Raw OpenAI Response Body: %s", string(bodyBytes))

	var apiResp APIResponse
	if err := json.Unmarshal(bodyBytes, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal OpenAI response structure: %w", err)
	}

	if apiResp.Error != nil {
		return nil, fmt.Errorf("OpenAI API returned an error in the response body: %v", apiResp.Error)
	}

	var jsonContentString string
	var messageFound bool
	for _, item := range apiResp.Output {
		if item.Type == "message" {
			if len(item.Content) > 0 && item.Content[0].Type == "output_text" {
				jsonContentString = item.Content[0].Text
				messageFound = true
				break
			}
		}
	}

	if !messageFound {
		return nil, errors.New("invalid response structure: could not find a 'message' with 'output_text' in the API response")
	}

	var finalOutput map[string]any
	if err := json.Unmarshal([]byte(jsonContentString), &finalOutput); err != nil {
		return nil, fmt.Errorf("failed to unmarshal structured output from model response: %w. Raw content: %s", err, jsonContentString)
	}

	return finalOutput, nil
}
