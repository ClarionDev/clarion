package models

import (
	"github.com/ClarionDev/clarion/internal/agent"
	"github.com/ClarionDev/clarion/internal/message"
)

type LLMConfig struct {
	Provider   string         `json:"provider" yaml:"provider"`
	Model      string         `json:"model" yaml:"model"`
	Parameters map[string]any `json:"parameters" yaml:"parameters"`
	ConfigID   string         `json:"configId,omitempty" yaml:"configId,omitempty"`
}

type Agent struct {
	Profile         agent.AgentProfile
	SystemPrompt    string            `json:"system_prompt" yaml:"system_prompt"`
	CodebaseFilters FilterSet         `json:"codebase_filters" yaml:"codebase_filters"`
	OutputSchema    OutputSchema      `json:"output_schema" yaml:"output_schema"`
	UserVariables   []UserVariableDef `json:"user_variables" yaml:"user_variables"`
	LLMConfig       LLMConfig         `json:"llm_config" yaml:"llm_config"`
}

type FilterSet struct {
	IncludeGlobs        []string `json:"include_globs" yaml:"include_globs"`
	ExcludeGlobs        []string `json:"exclude_globs" yaml:"exclude_globs"`
	ContentRegexInclude string   `json:"content_regex_include" yaml:"content_regex_include"`
	MaxTotalFiles       int      `json:"max_total_files" yaml:"max_total_files"`
}

type UserVariableDef struct {
	Name        string `json:"name" yaml:"name"`
	Description string `json:"description" yaml:"description"`
	Required    bool   `json:"required" yaml:"required"`
}

type PromptTemplate struct {
	Name        string    `json:"name" yaml:"name"`
	Description string    `json:"description" yaml:"description"`
	Messages    []Message `json:"messages" yaml:"messages"`
}

type Message struct {
	Role    message.ROLE `json:"role" yaml:"role"`
	Content string       `json:"content" yaml:"content"`
}

type OutputSchema struct {
	Schema map[string]any `json:"schema" yaml:"schema"`
}

type AgentRunRequest struct {
	SystemInstruction string
	Prompt            string
	OutputSchema      map[string]any
	LLMConfig         LLMConfig
}

type LLMProviderConfig struct {
	ID       string `json:"id" yaml:"id"`
	Name     string `json:"name" yaml:"name"`
	Provider string `json:"provider" yaml:"provider"`
	APIKey   string `json:"apiKey" yaml:"apiKey"`
}
