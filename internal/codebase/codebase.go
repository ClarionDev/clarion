// internal/codebase/codebase.go
package codebase

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"github.com/ClarionDev/clarion/internal/models"
	"sort"
	"strings"
)

// defaultIgnoreDirs is a set of common directory names to skip during traversal for performance.
var defaultIgnoreDirs = map[string]struct{}{
	".git":         {},
	"node_modules": {},
	"dist":         {},
	"build":        {},
	".vscode":      {},
	".idea":        {},
	"target":       {}, // For Rust/Java
	"__pycache__":  {},
	".venv":        {},
	"venv":         {},
}

// CodebaseLoader defines the contract for loading a codebase from a source.
// This interface allows for future extensions, such as loading from a Git repository or a virtual filesystem.
type CodebaseLoader interface {
	LoadCodebase(path string) (*Codebase, error)
	LoadCodebaseStructure(path string) (*Codebase, error)
}

// LocalFSLoader implements the CodebaseLoader interface to load source code files from the local filesystem.
type LocalFSLoader struct{}

// NewLocalFSLoader creates a new loader capable of reading files from the local disk.
func NewLocalFSLoader() *LocalFSLoader {
	return &LocalFSLoader{}
}

// LoadCodebase recursively walks the filesystem at the given root path and constructs a complete
// Codebase object containing all discovered files and their content.
func (l *LocalFSLoader) LoadCodebase(rootPath string) (*Codebase, error) {
	absRoot, err := filepath.Abs(rootPath)
	if err != nil {
		return nil, err
	}

	codebase := &Codebase{
		RootPath: absRoot,
		Files:    []*CodeFile{},
	}

	walkErr := filepath.WalkDir(absRoot, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err // Propagate errors from WalkDir, like permission issues.
		}

		if d.IsDir() {
			// If the directory name is in our ignore list, skip it completely.
			if _, ignored := defaultIgnoreDirs[d.Name()]; ignored {
				return filepath.SkipDir
			}
			return nil
		}

		relativePath, err := filepath.Rel(absRoot, path)
		if err != nil {
			// This is unlikely but important to handle for robustness.
			return err
		}

		content, err := os.ReadFile(path)
		if err != nil {
			// Fail the entire load if a single file cannot be read to ensure a consistent state.
			return err
		}

		file := &CodeFile{
			Path:    relativePath,
			Content: content,
		}
		codebase.Files = append(codebase.Files, file)

		return nil
	})

	if walkErr != nil {
		return nil, walkErr
	}

	return codebase, nil
}

// LoadCodebaseStructure recursively walks the filesystem at the given root path and constructs a
// Codebase object containing only the file paths, without their content. This is much faster
// for building a file tree UI.
func (l *LocalFSLoader) LoadCodebaseStructure(rootPath string) (*Codebase, error) {
	absRoot, err := filepath.Abs(rootPath)
	if err != nil {
		return nil, err
	}

	codebase := &Codebase{
		RootPath: absRoot,
		Files:    []*CodeFile{},
	}

	walkErr := filepath.WalkDir(absRoot, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			// If the directory name is in our ignore list, skip it completely.
			if _, ignored := defaultIgnoreDirs[d.Name()]; ignored {
				return filepath.SkipDir
			}
			return nil
		}

		relativePath, err := filepath.Rel(absRoot, path)
		if err != nil {
			return err
		}

		// IMPORTANT: We do not read the file content here for performance.
		file := &CodeFile{
			Path:    relativePath,
			Content: nil, // Content is intentionally left nil
		}
		codebase.Files = append(codebase.Files, file)

		return nil
	})

	if walkErr != nil {
		return nil, walkErr
	}

	return codebase, nil
}

// ApplyFilter creates a new Codebase containing only the files that match the provided filter criteria.
// The filtering logic is glob-based:
// 1. A file is EXCLUDED if its path matches any pattern in `ExcludeGlobs`.
// 2. If not excluded, a file is INCLUDED if `IncludeGlobs` is empty, OR if its path matches any pattern in `IncludeGlobs`.
func (cb *Codebase) ApplyFilter(filter *models.FilterSet) *Codebase {
	// If the filter is nil, return a shallow copy of the original codebase.
	if filter == nil {
		newCb := *cb
		return &newCb
	}

	var filteredFiles []*CodeFile

	for _, file := range cb.Files {
		// Use a consistent forward-slash path separator for matching, which is standard for globs.
		pathForMatching := filepath.ToSlash(file.Path)
		isExcluded := false

		// --- 1. Check EXCLUSION rules first ---
		for _, pattern := range filter.ExcludeGlobs {
			if matched, err := filepath.Match(pattern, pathForMatching); err == nil && matched {
				isExcluded = true
				break
			}
		}
		if isExcluded {
			continue // Skip to the next file immediately if excluded.
		}

		// --- 2. If not excluded, check INCLUSION rules ---
		// If there are no specific inclusion rules, the file is included by default.
		if len(filter.IncludeGlobs) == 0 {
			filteredFiles = append(filteredFiles, file)
			continue
		}

		// Otherwise, the file must match at least one inclusion rule.
		isIncluded := false
		for _, pattern := range filter.IncludeGlobs {
			if matched, err := filepath.Match(pattern, pathForMatching); err == nil && matched {
				isIncluded = true
				break
			}
		}

		if isIncluded {
			filteredFiles = append(filteredFiles, file)
		}
	}

	// Return a new Codebase instance with the filtered list of files.
	return &Codebase{
		RootPath: cb.RootPath,
		Files:    filteredFiles,
	}
}

// GetFileStatuses takes a list of file paths and returns a map of their status based on glob patterns.
func GetFileStatuses(paths []string, includeGlobs []string, excludeGlobs []string) map[string]string {
	statuses := make(map[string]string)

	for _, path := range paths {
		pathForMatching := filepath.ToSlash(path)
		isExcluded := false

		for _, pattern := range excludeGlobs {
			if matched, err := filepath.Match(pattern, pathForMatching); err == nil && matched {
				isExcluded = true
				break
			}
		}

		if isExcluded {
			statuses[path] = "excluded"
			continue
		}

		if len(includeGlobs) == 0 {
			statuses[path] = "included"
			continue
		}

		isIncluded := false
		for _, pattern := range includeGlobs {
			if matched, err := filepath.Match(pattern, pathForMatching); err == nil && matched {
				isIncluded = true
				break
			}
		}

		if isIncluded {
			statuses[path] = "included"
		} else {
			statuses[path] = "excluded"
		}
	}

	return statuses
}


// PrintCobebaseTree prints a visual tree representation of the in-memory codebase structure.
// It constructs a hierarchy from the flat file list and prints it to the console.
func (cb *Codebase) PrintCobebaseTree() {
	if len(cb.Files) == 0 {
		fmt.Println(cb.RootPath)
		fmt.Println("└── (empty)")
		return
	}

	// The tree is represented as a map where keys are file/dir names
	// and values are sub-trees (another map) or nil for files.
	tree := make(map[string]interface{})

	// Populate the tree structure from the flat list of file paths.
	for _, file := range cb.Files {
		// Use filepath.Separator to handle paths correctly on any OS.
		parts := strings.Split(file.Path, string(filepath.Separator))
		currentNode := tree

		for i, part := range parts {
			// If it's the last part, it's a file.
			if i == len(parts)-1 {
				currentNode[part] = nil
			} else {
				// If it's a directory, ensure the node exists in the tree.
				if _, ok := currentNode[part]; !ok {
					currentNode[part] = make(map[string]interface{})
				}
				// Move down to the next level in the tree.
				currentNode = currentNode[part].(map[string]interface{})
			}
		}
	}

	// Print the root path of the codebase.
	fmt.Println(cb.RootPath)
	// Start the recursive printing process from the root of the tree.
	printTreeRecursive(tree, "")
}

// printTreeRecursive is a helper function that traverses the tree map and prints each node.
func printTreeRecursive(node map[string]interface{}, prefix string) {
	// Separate keys into directories and files to sort them separately.
	var dirs []string
	var files []string
	for key, val := range node {
		if val != nil {
			dirs = append(dirs, key)
		} else {
			files = append(files, key)
		}
	}

	// Sort directories and files alphabetically.
	sort.Strings(dirs)
	sort.Strings(files)

	// Combine them, with directories appearing before files.
	allKeys := append(dirs, files...)

	// Iterate over all keys to print them.
	for i, key := range allKeys {
		// Determine the connector and the prefix for child nodes.
		connector := "├── "
		childPrefix := "│   "
		if i == len(allKeys)-1 {
			connector = "└── "
			childPrefix = "    "
		}

		// Print the current file or directory.
		fmt.Printf("%s%s%s\n", prefix, connector, key)

		// If the current node is a directory, recurse into it.
		if node[key] != nil {
			printTreeRecursive(node[key].(map[string]interface{}), prefix+childPrefix)
		}
	}
}

// CodebaseToString is for inserting a codebase into a prompt template
// as a formatted string. It returns a string representation of the codebase,
// where each file is shown with its path and content, separated by markdown-style
// code fences for better readability in prompts.
func (cb *Codebase) CodebaseToString() string {
	// Handle the edge case where the codebase is nil or has no files.
	if cb == nil || len(cb.Files) == 0 {
		return "No codebase files provided or filtered."
	}

	// Use a strings.Builder for efficient string concatenation in a loop.
	var builder strings.Builder

	// Iterate over each file in the codebase.
	for _, file := range cb.Files {
		// Use filepath.ToSlash for consistent path separators (e.g., "/" on all systems).
		header := fmt.Sprintf("File: %s\n", filepath.ToSlash(file.Path))
		builder.WriteString(header)

		// Write the opening markdown code fence.
		builder.WriteString("```\n")

		// Write the file content. Using Write is more efficient than WriteString(string(...)).
		builder.Write(file.Content)

		// Write the closing markdown code fence, ensuring good separation for the next file.
		builder.WriteString("\n```\n\n")
	}

	// Return the final string, trimming any trailing whitespace from the last entry.
	return strings.TrimSpace(builder.String())
}