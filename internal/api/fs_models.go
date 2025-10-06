package api

// FileChange represents a single file modification instruction.
// It's used for applying changes from the agent to the filesystem.
type FileChange struct {
	Action         string `json:"action"`         // "create", "modify", "delete"
	Path           string `json:"path"`
	OriginalContent string `json:"original_content,omitempty"` // For diffing on the frontend
	NewContent     string `json:"new_content,omitempty"`
}

// ApplyChangesRequest is the payload from the frontend to apply a batch of file changes.
type ApplyChangesRequest struct {
	RootPath string       `json:"root_path"`
	Changes  []FileChange `json:"changes"`
}
