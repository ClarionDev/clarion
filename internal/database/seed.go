package database

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/ClarionDev/clarion/internal/agent"
	"github.com/ClarionDev/clarion/internal/models"
	"github.com/ClarionDev/clarion/internal/storage"
)

type AgentRunData struct {
	ID         string                 `json:"id"`
	Prompt     string                 `json:"prompt"`
	AgentName  string                 `json:"agentName"`
	Status     string                 `json:"status"`
	Output     AgentRunOutput         `json:"output"`
	RawRequest map[string]interface{} `json:"rawRequest"`
}

type TokenUsage struct {
	Prompt     int `json:"prompt"`
	Completion int `json:"completion"`
	Total      int `json:"total"`
}

type AgentRunOutput struct {
	Summary     string       `json:"summary"`
	FileChanges []FileChange `json:"fileChanges"`
	RawOutput   any          `json:"rawOutput"`
	Error       string       `json:"error,omitempty"`
	TokenUsage  *TokenUsage  `json:"tokenUsage,omitempty"`
}

type FileChange struct {
	ID         string `json:"id"`
	Action     string `json:"action"`
	Path       string `json:"path"`
	NewContent string `json:"new_content"`
}

func SeedData(ctx context.Context, agentStore storage.AgentStore, llmStore storage.LLMConfigStore, projectStore storage.ProjectStore, runStore storage.RunStore) {
	agents, err := agentStore.ListAgents(ctx)
	if err != nil {
		log.Printf("Error checking for existing agents, skipping seed: %v", err)
		return
	}
	if len(agents) > 0 {
		log.Println("Database already contains data. Skipping seed.")
		return
	}

	log.Println("Database is empty. Seeding initial data...")

	llmConfig := &models.LLMProviderConfig{
		ID:       "seed_llm_config_openai",
		Name:     "Default OpenAI (Seeded)",
		Provider: "OpenAI",
		APIKey:   "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	}
	if err := llmStore.SaveLLMConfig(ctx, llmConfig); err != nil {
		log.Fatalf("Failed to seed LLM config: %v", err)
	}

	fileOpsSchema := map[string]any{
		"schema": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"summary": map[string]any{
					"type":        "string",
					"description": "A summary of the file changes to be performed.",
				},
				"file_changes": map[string]any{
					"type":        "array",
					"description": "A list of file modifications.",
					"items": map[string]any{
						"type": "object",
						"properties": map[string]any{
							"action": map[string]any{
								"type": "string",
								"enum": []string{"create", "modify", "delete"},
							},
							"path": map[string]any{
								"type":        "string",
								"description": "The relative path to the file.",
							},
							"new_content": map[string]any{
								"type":        "string",
								"description": "The new content for 'create' or 'modify' actions.",
							},
						},
						"required": []string{"action", "path"},
					},
				},
			},
			"required": []string{"summary", "file_changes"},
		},
	}
	basicAgent := &models.Agent{
		Profile: agent.AgentProfile{
			ID:          "seed_agent_basic_editor",
			Name:        "Basic File Editor",
			Description: "A simple agent that can create or modify files based on a prompt.",
			Version:     "1.0.0",
			Author:      "Clarion",
			Icon:        "Code",
		},
		SystemPrompt:    "You are an expert software developer. Your task is to perform file operations based on the user's request. You must only respond with the specified JSON output schema.",
		CodebaseFilters: models.FilterSet{
			IncludeGlobs: []string{},
			ExcludeGlobs: []string{"node_modules/**", ".git/**"},
		},
		OutputSchema: models.OutputSchema{
			Schema: fileOpsSchema["schema"].(map[string]any),
		},
		UserVariables: []models.UserVariableDef{},
		LLMConfig: models.LLMConfig{
			Provider:   "OpenAI",
			Model:      "gpt-4o",
			Parameters: map[string]any{"temperature": 0.7},
			ConfigID:   llmConfig.ID,
		},
	}
	if err := agentStore.SaveAgent(ctx, basicAgent); err != nil {
		log.Fatalf("Failed to seed basic agent: %v", err)
	}

	demoProject := &models.Project{
		ID:            "seed_project_demo",
		Name:          "Demo Project",
		Path:          "",
		LastOpenedAt:  time.Now().UTC().Format(time.RFC3339),
		ActiveAgentID: basicAgent.Profile.ID,
	}
	if err := projectStore.SaveProject(ctx, demoProject); err != nil {
		log.Fatalf("Failed to seed demo project: %v", err)
	}

	runID := "seed_run_basic_1"
	fileChangeID := runID + "-change-0"
	runOutput := AgentRunOutput{
		Summary: "Created a new file `hello.txt` with the content 'Hello, Clarion!'",
		FileChanges: []FileChange{
			{
				ID:         fileChangeID,
				Action:     "create",
				Path:       "hello.txt",
				NewContent: "Hello, Clarion!",
			},
		},
		RawOutput: map[string]interface{}{
			"summary": "Created a new file `hello.txt` with the content 'Hello, Clarion!'",
			"file_changes": []map[string]interface{}{
				{
					"action":      "create",
					"path":        "hello.txt",
					"new_content": "Hello, Clarion!",
				},
			},
		},
	}
	runData := AgentRunData{
		ID:        runID,
		Prompt:    "Create a new file named hello.txt and put 'Hello, Clarion!' inside it.",
		AgentName: "Basic File Editor",
		Status:    "success",
		Output:    runOutput,
		RawRequest: map[string]interface{}{
			"system_instruction": basicAgent.SystemPrompt,
			"prompt":             "Create a new file named hello.txt and put 'Hello, Clarion!' inside it.",
			"codebase_paths":     []string{},
			"output_schema":      basicAgent.OutputSchema.Schema,
			"project_root":       demoProject.Path,
			"llm_config":         basicAgent.LLMConfig,
		},
	}

	runDataJSON, err := json.Marshal(runData)
	if err != nil {
		log.Fatalf("Failed to marshal seed run data: %v", err)
	}

	basicRun := &models.Run{
		ID:        runID,
		ProjectID: demoProject.ID,
		RunData:   string(runDataJSON),
	}

	if err := runStore.SaveRun(ctx, basicRun); err != nil {
		log.Fatalf("Failed to seed basic run: %v", err)
	}

	log.Println("Successfully seeded database with initial data.")
}
