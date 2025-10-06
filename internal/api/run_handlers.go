package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/ClarionDev/clarion/internal/models"
	"github.com/go-chi/chi/v5"
)

type SaveRunRequest struct {
	ProjectID string          `json:"project_id"`
	Run       json.RawMessage `json:"run"`
}

func (s *Server) handleSaveRun(w http.ResponseWriter, r *http.Request) {
	var req SaveRunRequest
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	var runData struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(req.Run, &runData); err != nil {
		http.Error(w, "Invalid run data: missing id", http.StatusBadRequest)
		return
	}

	if req.ProjectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	runToSave := &models.Run{
		ID:        runData.ID,
		ProjectID: req.ProjectID,
		RunData:   string(req.Run),
	}

	if err := s.runStore.SaveRun(r.Context(), runToSave); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save run: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Run saved successfully"))
}

func (s *Server) handleListRuns(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	if projectID == "" {
		http.Error(w, "Project ID is required", http.StatusBadRequest)
		return
	}

	runs, err := s.runStore.ListRunsByProject(r.Context(), projectID)
	if err != nil {
		http.Error(w, "Failed to list runs", http.StatusInternalServerError)
		return
	}

	var runDataList []json.RawMessage
	for _, run := range runs {
		runDataList = append(runDataList, []byte(run.RunData))
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(runDataList); err != nil {
		log.Printf("Failed to write run list response: %v", err)
	}
}
