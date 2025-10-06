package models

// BlockType defines the specific kind of entity a Block represents.
// This provides a controlled vocabulary, preventing errors from "magic strings".
type BlockType string

// Constants for all the types of Blocks our system understands. This enumeration
// is the foundation of our extensible architecture.
const (
	TypeAgent           BlockType = "Agent" // RENAMED: This is now the top-level concept.
	TypePromptTemplate  BlockType = "PromptTemplate"
	TypeFilterSet       BlockType = "FilterSet"
	TypeMessage         BlockType = "Message"
	TypeUserVariableDef BlockType = "UserVariableDef"
	TypeOutputSchema    BlockType = "OutputSchema"
	// New concepts like "Workflow" or "Tool" can be added here in the future
	// without changing the core parsing logic.
)

// Block is the unified, fundamental data structure for the entire application.
// Every configuration, from a simple message to a complex Agent, is represented
// as a Block. This structure is designed for maximum flexibility, allowing for
// composition and future expansion. It is the format for serialization and
// API communication.
type Block struct {
	ID      string            `json:"id" yaml:"id"`
	Type    BlockType         `json:"type" yaml:"type"`
	Version string            `json:"version" yaml:"version,omitempty"` // Also good to add here
	Metadata map[string]string `json:"metadata,omitempty" yaml:"metadata,omitempty"`

	// FIX: Add omitempty to ensure consistency with Children.
	// This means empty maps won't be written to the file.
	Properties map[string]any `json:"properties,omitempty" yaml:"properties,omitempty"`

	Children []*Block `json:"children,omitempty" yaml:"children,omitempty"`
}