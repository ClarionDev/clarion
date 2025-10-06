package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/ClarionDev/clarion/internal/models"
	"github.com/ClarionDev/clarion/internal/storage"
	"github.com/go-chi/chi/v5"
)

func (s *Server) handleListLLMConfigs(w http.ResponseWriter, r *http.Request) {
	store, err := storage.NewFileStore(storagePath)
	if err != nil {
		http.Error(w, "Failed to initialize storage", http.StatusInternalServerError)
		return
	}

	configIDs, err := store.ListLLMConfigs()
	if err != nil {
		http.Error(w, "Failed to list LLM configs", http.StatusInternalServerError)
		return
	}

	var configs []models.LLMProviderConfig
	for _, id := range configIDs {
		config, err := store.LoadLLMConfig(id)
		if err != nil {
			log.Printf("Warning: could not load LLM config '%s': %v", id, err)
			continue
		}
		configs = append(configs, *config)
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

	store, err := storage.NewFileStore(storagePath)
	if err != nil {
		http.Error(w, "Failed to initialize storage", http.StatusInternalServerError)
		return
	}

	if err := store.SaveLLMConfig(&configToSave); err != nil {
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

	store, err := storage.NewFileStore(storagePath)
	if err != nil {
		http.Error(w, "Failed to initialize storage", http.StatusInternalServerError)
		return
	}

	if err := store.DeleteLLMConfig(configID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete LLM config: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("LLM config deleted successfully"))
}
