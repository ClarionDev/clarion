// internal/codebase/models.go
package codebase

// CodeFile represents a single file within the codebase, containing its relative path and content.
// This is the fundamental unit that the agent will operate on.
type CodeFile struct {
	Path    string
	Content []byte
}

// Codebase represents the entire collection of source code files that an agent can perceive.
// It holds a flat list of all files loaded from a given directory path, forming the agent's environment.
type Codebase struct {
	RootPath string
	Files    []*CodeFile
}