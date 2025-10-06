package api

import "github.com/ClarionDev/clarion/internal/models"

type LoadDirectoryRequest struct {
	Path string `json:"path"`
}

type ReadFileRequest struct {
	Path string `json:"path"`
}

type ReadFileResponse struct {
	Content string `json:"content"`
}

type ReadFilesRequest struct {
	Paths []string `json:"paths"`
}

type ReadFilesResponse struct {
	Files map[string]string `json:"files"`
}

type AgentRunRequest struct {
	SystemInstruction string           `json:"system_instruction"`
	Prompt              string           `json:"prompt"`
	CodebasePaths       []string         `json:"codebase_paths"`
	OutputSchema        map[string]any   `json:"output_schema"`
	ProjectRoot         string           `json:"project_root"`
	LLMConfig           models.LLMConfig `json:"llm_config"`
}

type AgentRunResponse struct {
	Output map[string]any `json:"output"`
}

type AgentPreparePromptRequest struct {
	SystemInstruction string           `json:"system_instruction"`
	Prompt              string           `json:"prompt"`
	CodebasePaths       []string         `json:"codebase_paths"`
	OutputSchema        map[string]any   `json:"output_schema"`
	ProjectRoot         string           `json:"project_root"`
	LLMConfig           models.LLMConfig `json:"llm_config"`
}

type AgentPreparePromptResponse struct {
	MarkdownPrompt string `json:"markdownPrompt"`
	JSONPrompt     string `json:"jsonPrompt"`
}

type SaveAgentRequest struct {
	Agent models.Agent `json:"agent"`
}

type PreviewFilterRequest struct {
	FilePaths    []string `json:"file_paths"`
	IncludeGlobs []string `json:"include_globs"`
	ExcludeGlobs []string `json:"exclude_globs"`
}

type PreviewFilterResponse struct {
	Status map[string]string `json:"status"`
}

type FileOperationRequest struct {
	RootPath string `json:"root_path"`
	Path     string `json:"path"`
}

type CopyFileRequest struct {
	RootPath    string `json:"root_path"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
}

type WriteFileRequest struct {
	RootPath string `json:"root_path"`
	Path     string `json:"path"`
	Content  string `json:"content"`
}
