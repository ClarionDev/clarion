package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/ClarionDev/clarion/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (s *Server) handleListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := s.projectStore.ListProjects(r.Context())
	if err != nil {
		http.Error(w, "Failed to list projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(projects); err != nil {
		log.Printf("Failed to write project list response: %v", err)
	}
}

// handleOpenProject creates or updates a project entry when a folder is opened.
func (s *Server) handleOpenProject(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if project already exists
	project, err := s.projectStore.GetProjectByPath(r.Context(), req.Path)
	if err != nil && err.Error() != "sql: no rows in result set" {
		// handle other errors, but continue if it's just not found
		http.Error(w, fmt.Sprintf("Error checking for existing project: %v", err), http.StatusInternalServerError)
		return
	}

	if project == nil {
		// Create new project
		project = &models.Project{
			ID:   uuid.New().String(),
			Name: filepath.Base(req.Path),
			Path: req.Path,
		}
	}

	project.LastOpenedAt = time.Now().UTC().Format(time.RFC3339)
	if err := s.projectStore.SaveProject(r.Context(), project); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save project: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(project)
}

func (s *Server) handleDeleteProject(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	if err := s.projectStore.DeleteProject(r.Context(), projectID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete project: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Project deleted successfully"))
}

func (s *Server) handleUpdateProject(w http.ResponseWriter, r *http.Request) {
	var projectToUpdate models.Project
	if err := json.NewDecoder(r.Body).Decode(&projectToUpdate); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := s.projectStore.SaveProject(r.Context(), &projectToUpdate); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update project: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Project updated successfully"))
}
