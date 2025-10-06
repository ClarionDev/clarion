package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ClarionDev/clarion/internal/hydrator"
	"github.com/ClarionDev/clarion/internal/models"

	"gopkg.in/yaml.v3"
)

type FileStore struct {
	basePath string
}

func NewFileStore(basePath string) (*FileStore, error) {
	if err := os.MkdirAll(basePath, os.ModePerm); err != nil {
		return nil, fmt.Errorf("failed to create base storage directory '%s': %w", basePath, err)
	}
	return &FileStore{basePath: basePath}, nil
}

func (s *FileStore) getPathForType(typeName string) (string, error) {
	dirName := strings.ToLower(typeName)
	path := filepath.Join(s.basePath, dirName)
	if err := os.MkdirAll(path, os.ModePerm); err != nil {
		return "", fmt.Errorf("failed to create storage directory for type '%s': %w", typeName, err)
	}
	return path, nil
}

// Agent Methods
func (s *FileStore) SaveAgent(agent *models.Agent) error {
	block, err := dehydrateAgent(agent)
	if err != nil {
		return fmt.Errorf("failed to dehydrate agent '%s': %w", agent.Profile.ID, err)
	}
	return s.saveYAML(string(models.TypeAgent), block.ID, block)
}

func (s *FileStore) LoadAgent(id string) (*models.Agent, error) {
	var block models.Block
	if err := s.loadYAML(string(models.TypeAgent), id, &block); err != nil {
		return nil, err
	}

	agent, err := hydrator.HydrateAgent(&block)
	if err != nil {
		return nil, fmt.Errorf("failed to hydrate agent block '%s': %w", id, err)
	}

	return agent, nil
}

func (s *FileStore) ListAgents() ([]string, error) {
	return s.listYAML(string(models.TypeAgent))
}

func (s *FileStore) DeleteAgent(id string) error {
	return s.deleteYAML(string(models.TypeAgent), id)
}

// LLM Provider Config Methods
func (s *FileStore) SaveLLMConfig(config *models.LLMProviderConfig) error {
	return s.saveYAML("llm_configs", config.ID, config)
}

func (s *FileStore) LoadLLMConfig(id string) (*models.LLMProviderConfig, error) {
	var config models.LLMProviderConfig
	if err := s.loadYAML("llm_configs", id, &config); err != nil {
		return nil, err
	}
	return &config, nil
}

func (s *FileStore) ListLLMConfigs() ([]string, error) {
	return s.listYAML("llm_configs")
}

func (s *FileStore) DeleteLLMConfig(id string) error {
	return s.deleteYAML("llm_configs", id)
}

// Generic YAML helpers
func (s *FileStore) saveYAML(typeName string, id string, data interface{}) error {
	if id == "" {
		return fmt.Errorf("%s id cannot be empty", typeName)
	}

	yamlData, err := yaml.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal %s '%s': %w", typeName, id, err)
	}

	path, err := s.getPathForType(typeName)
	if err != nil {
		return err
	}

	filePath := filepath.Join(path, fmt.Sprintf("%s.yml", id))
	return os.WriteFile(filePath, yamlData, 0644)
}

func (s *FileStore) loadYAML(typeName string, id string, target interface{}) error {
	if id == "" {
		return fmt.Errorf("%s id cannot be empty", typeName)
	}
	path, err := s.getPathForType(typeName)
	if err != nil {
		return err
	}

	filePath := filepath.Join(path, fmt.Sprintf("%s.yml", id))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("%s '%s' not found", typeName, id)
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read %s file: %w", typeName, err)
	}

	return yaml.Unmarshal(data, target)
}

func (s *FileStore) listYAML(typeName string) ([]string, error) {
	path, err := s.getPathForType(typeName)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read storage directory '%s': %w", path, err)
	}
	var names []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".yml") {
			name := strings.TrimSuffix(entry.Name(), ".yml")
			names = append(names, name)
		}
	}
	return names, nil
}

func (s *FileStore) deleteYAML(typeName string, id string) error {
	if id == "" {
		return fmt.Errorf("%s id cannot be empty", typeName)
	}
	path, err := s.getPathForType(typeName)
	if err != nil {
		return err
	}

	filePath := filepath.Join(path, fmt.Sprintf("%s.yml", id))

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("%s '%s' not found", typeName, id)
	}

	return os.Remove(filePath)
}

func dehydrateAgent(agent *models.Agent) (*models.Block, error) {
	filterSetBlock := &models.Block{
		Type: models.TypeFilterSet,
		Properties: map[string]any{
			"include_globs":         agent.CodebaseFilters.IncludeGlobs,
			"exclude_globs":         agent.CodebaseFilters.ExcludeGlobs,
			"content_regex_include": agent.CodebaseFilters.ContentRegexInclude,
			"max_total_files":       agent.CodebaseFilters.MaxTotalFiles,
		},
	}

	outputSchemaBlock := &models.Block{
		Type: models.TypeOutputSchema,
		Properties: map[string]any{
			"schema": agent.OutputSchema.Schema,
		},
	}

	llmConfigMap := map[string]any{
		"provider":   agent.LLMConfig.Provider,
		"model":      agent.LLMConfig.Model,
		"parameters": agent.LLMConfig.Parameters,
		"configId":   agent.LLMConfig.ConfigID,
	}

	agentBlock := &models.Block{
		ID:      agent.Profile.ID,
		Type:    models.TypeAgent,
		Version: agent.Profile.Version,
		Metadata: map[string]string{
			"name":        agent.Profile.Name,
			"description": agent.Profile.Description,
			"author":      agent.Profile.Author,
			"icon":        agent.Profile.Icon,
		},
		Properties: map[string]any{
			"system_prompt": agent.SystemPrompt,
			"llm_config":    llmConfigMap,
		},
		Children: []*models.Block{filterSetBlock, outputSchemaBlock},
	}

	for _, uv := range agent.UserVariables {
		uvBlock := &models.Block{
			Type: models.TypeUserVariableDef,
			Metadata: map[string]string{
				"name":        uv.Name,
				"description": uv.Description,
			},
			Properties: map[string]any{
				"required": uv.Required,
			},
		}
		agentBlock.Children = append(agentBlock.Children, uvBlock)
	}

	return agentBlock, nil
}
