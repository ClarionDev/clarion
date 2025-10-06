package codebase

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLocalFSLoader_LoadCodebase(t *testing.T) {
	// 1. Setup: Create a temporary directory structure for our test.
	tempDir := t.TempDir() // t.TempDir() automatically handles cleanup.

	// Define the file structure and content we want to create.
	filesToCreate := map[string]string{
		"file1.txt":         "hello world",
		"main.go":           "package main",
		"subdir/file2.json": "{\"key\": \"value\"}",
		"subdir/deep/file3.js": "console.log('test');",
	}

	// Create the directories and files.
	for path, content := range filesToCreate {
		fullPath := filepath.Join(tempDir, path)
		err := os.MkdirAll(filepath.Dir(fullPath), 0755)
		if err != nil {
			t.Fatalf("Failed to create directory for %s: %v", path, err)
		}
		err = os.WriteFile(fullPath, []byte(content), 0644)
		if err != nil {
			t.Fatalf("Failed to write file %s: %v", path, err)
		}
	}

	// 2. Execution: Instantiate the loader and load the codebase.
	loader := NewLocalFSLoader()
	codebase, err := loader.LoadCodebase(tempDir)

	// 3. Assertions

	// Check for unexpected errors.
	if err != nil {
		t.Fatalf("LoadCodebase() returned an unexpected error: %v", err)
	}

	// Check that the codebase object is not nil.
	if codebase == nil {
		t.Fatal("LoadCodebase() returned a nil codebase")
	}

	// Check that the number of loaded files is correct.
	expectedFileCount := len(filesToCreate)
	if len(codebase.Files) != expectedFileCount {
		t.Errorf("Expected %d files, but got %d", expectedFileCount, len(codebase.Files))
	}

	// For more detailed checking, convert the slice of files to a map for easy lookups.
	loadedFiles := make(map[string]*CodeFile)
	for _, f := range codebase.Files {
		// Use filepath.ToSlash to ensure consistent path separators (especially on Windows).
		loadedFiles[filepath.ToSlash(f.Path)] = f
	}

	// Verify each expected file exists and its content is correct.
	for path, expectedContent := range filesToCreate {
		if file, ok := loadedFiles[path]; !ok {
			t.Errorf("Expected file '%s' was not found in the loaded codebase", path)
		} else {
			if string(file.Content) != expectedContent {
				t.Errorf("Content for file '%s' does not match. Got '%s', want '%s'",
					path, string(file.Content), expectedContent)
			}
		}
	}
}