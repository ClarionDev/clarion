package llm

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/ClarionDev/clarion/internal/models"
)

// ChatMessage represents a single message in a chat conversation,
// following the structure commonly used by LLM APIs.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// FileContent represents a single file's path and content.
type FileContent struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// PromptData is a structured representation of all components of a prompt.
type PromptData struct {
	CodebaseContext    []FileContent  `json:"Codebase,omitempty"`
	UserTask           string         `json:"Prompt"`
	SystemInstructions string         `json:"Systemp Instructions"`
	OutputSchema       map[string]any `json:"Output Schema"`
}

// buildPromptData constructs a structured representation of the prompt components.
// It ensures deterministic order for codebase files.
func buildPromptData(request models.AgentRunRequest, codebaseContent map[string]string) PromptData {
	var files []FileContent
	if len(codebaseContent) > 0 {
		keys := make([]string, 0, len(codebaseContent))
		for k := range codebaseContent {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		files = make([]FileContent, len(keys))
		for i, path := range keys {
			files[i] = FileContent{Path: path, Content: codebaseContent[path]}
		}
	}

	return PromptData{
		CodebaseContext:    files,
		UserTask:           request.Prompt,
		SystemInstructions: request.SystemInstruction,
		OutputSchema:       request.OutputSchema,
	}
}

// BuildPromptMarkdown constructs the final markdown string for the user prompt.
// It ensures deterministic order for codebase files.
func BuildPromptMarkdown(request models.AgentRunRequest, codebaseContent map[string]string) string {
	data := buildPromptData(request, codebaseContent)
	var builder strings.Builder

	// Append codebase context
	if len(data.CodebaseContext) > 0 {
		builder.WriteString("## Codebase Context\n")
		for _, file := range data.CodebaseContext {
			builder.WriteString(fmt.Sprintf("File: %s\n```\n%s\n```\n\n", file.Path, file.Content))
		}
	}

	// Append the user's main task/prompt
	builder.WriteString("## User's Task\n")
	builder.WriteString(data.UserTask)
	builder.WriteString("\n\n")

	// type AgentRunRequest struct {
	// 	SystemInstruction string
	// 	Prompt            string
	// 	OutputSchema      map[string]any
	// 	LLMConfig         LLMConfig
	// }

	builder.WriteString("## System Instructions: \n")
	builder.WriteString(data.SystemInstructions)
	builder.WriteString("\n\n")

	builder.WriteString("## Output Schema: \n")
	builder.WriteString("```json\n")
	schemaBytes, _ := json.MarshalIndent(data.OutputSchema, "", "  ")
	builder.Write(schemaBytes)
	builder.WriteString("\n```\n")

	return builder.String()
}

// BuildPromptJSON constructs the final prompt as a JSON string.
// It is useful for models that work better with structured JSON input.
func BuildPromptJSON(request models.AgentRunRequest, codebaseContent map[string]string) (string, error) {
	data := buildPromptData(request, codebaseContent)
	jsonBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal prompt data to JSON: %w", err)
	}
	return string(jsonBytes), nil
}

// // BuildChatMessages constructs the series of messages to be sent to the LLM.
// // It now builds a detailed string that includes all necessary context and instructions.
// func BuildChatMessages(request models.AgentRunRequest, codebaseContent map[string]string) ([]ChatMessage, error) {
// 	userContent := BuildPromptMarkdown(request, codebaseContent)

// 	// The final combined string is used as the content for the user message.
// 	// The SystemInstruction is passed separately in the new API request.
// 	messages := []ChatMessage{
// 		{
// 			Role:    "user",
// 			Content: userContent,
// 		},
// 	}

// 	return messages, nil
// }

func BuildChatMessages(request models.AgentRunRequest, codebaseContent map[string]string) ([]ChatMessage, error) {
	var messages []ChatMessage

	// 1. Add the System Message (if it exists)
	if request.SystemInstruction != "" {
		messages = append(messages, ChatMessage{
			Role:    "system",
			Content: request.SystemInstruction,
		})
	}

	// 2. Build the User Message content (Codebase + Task)
	var userContentBuilder strings.Builder
	if len(codebaseContent) > 0 {
		keys := make([]string, 0, len(codebaseContent))
		for k := range codebaseContent {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		userContentBuilder.WriteString("## Codebase Context\n")
		for _, path := range keys {
			content := codebaseContent[path]
			userContentBuilder.WriteString(fmt.Sprintf("File: %s\n```\n%s\n```\n\n", path, content))
		}
	}
	userContentBuilder.WriteString("## User's Task\n")
	userContentBuilder.WriteString(request.Prompt)

	// 3. Add the fully constructed User Message
	messages = append(messages, ChatMessage{
		Role:    "user",
		Content: userContentBuilder.String(),
	})

	return messages, nil
}
