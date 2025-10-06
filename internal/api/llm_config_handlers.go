package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/ClarionDev/clarion/internal/models"
	"github.com/go-chi/chi/v5"
)

func (s *Server) handleListLLMConfigs(w http.ResponseWriter, r *http.Request) {
	configs, err := s.llmConfigStore.ListLLMConfigs(r.Context())
	if err != nil {
		http.Error(w, "Failed to list LLM configs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(configs); err != nil {
		log.Printf("Failed to write LLM config list response: %v", err)
	}
}

func (s *Server) handleSaveLLMConfig(w http.ResponseWriter, r *http.Request) {
	var configToSave models.LLMProviderConfig
	if err := json.NewDecoder(r.Body).Decode(&configToSave); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := s.llmConfigStore.SaveLLMConfig(r.Context(), &configToSave); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save LLM config: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("LLM config saved successfully"))
}

func (s *Server) handleDeleteLLMConfig(w http.ResponseWriter, r *http.Request) {
	configID := chi.URLParam(r, "configID")
	if configID == "" {
		http.Error(w, "Config ID is required", http.StatusBadRequest)
		return
	}

	if err := s.llmConfigStore.DeleteLLMConfig(r.Context(), configID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete LLM config: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("LLM config deleted successfully"))
}
