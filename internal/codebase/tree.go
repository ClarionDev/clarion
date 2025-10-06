package codebase

import (
	"path/filepath"
	"strings"
)

// FileTreeNode represents a node in the hierarchical file tree.
// It's used for sending the codebase structure to the frontend.
type FileTreeNode struct {
	ID       string          `json:"id"`
	Name     string          `json:"name"`
	Path     string          `json:"path"`
	Type     string          `json:"type"`
	Children []*FileTreeNode `json:"children,omitempty"`
}

// BuildFileTree converts a flat Codebase into a hierarchical FileTreeNode structure.
func BuildFileTree(cb *Codebase) []*FileTreeNode {
	root := &FileTreeNode{ID: "root", Name: "root", Type: "folder"}
	fileMap := make(map[string]*FileTreeNode)

	for _, file := range cb.Files {
		parts := strings.Split(filepath.ToSlash(file.Path), "/")
		currentNode := root

		for i, part := range parts {
			pathSoFar := strings.Join(parts[:i+1], "/")

			if fileMap[pathSoFar] == nil {
				newNode := &FileTreeNode{
					ID:   pathSoFar,
					Name: part,
					Path: pathSoFar,
				}
				if i == len(parts)-1 {
					newNode.Type = "file"
				} else {
					newNode.Type = "folder"
					newNode.Children = []*FileTreeNode{}
				}
				currentNode.Children = append(currentNode.Children, newNode)
				fileMap[pathSoFar] = newNode
				currentNode = newNode
			} else {
				currentNode = fileMap[pathSoFar]
			}
		}
	}

	return root.Children
}
