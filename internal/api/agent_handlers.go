package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/ClarionDev/clarion/internal/llm"
	"github.com/ClarionDev/clarion/internal/models"
	"github.com/go-chi/chi/v5"
)

func (s *Server) handleAgentRun(w http.ResponseWriter, r *http.Request) {
	var apiReq AgentRunRequest
	if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Agent run initiated with prompt: '%s' using provider: %s, model: %s", apiReq.Prompt, apiReq.LLMConfig.Provider, apiReq.LLMConfig.Model)

	internalReq := models.AgentRunRequest{
		SystemInstruction: apiReq.SystemInstruction,
		Prompt:            apiReq.Prompt,
		OutputSchema:      apiReq.OutputSchema,
		LLMConfig:         apiReq.LLMConfig,
	}

	provider, err := llm.GetProvider(internalReq.LLMConfig.Provider)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get LLM provider: %v", err), http.StatusInternalServerError)
		return
	}

	codebaseContent, err := s.readCodebaseFiles(apiReq.ProjectRoot, apiReq.CodebasePaths)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read codebase files: %v", err), http.StatusInternalServerError)
		return
	}

	messages, err := llm.BuildChatMessages(internalReq, codebaseContent)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to build chat messages: %v", err), http.StatusInternalServerError)
		return
	}

	output, err := provider.Generate(r.Context(), messages, internalReq, s.llmConfigStore)
	if err != nil {
		http.Error(w, fmt.Sprintf("LLM generation failed: %v", err), http.StatusInternalServerError)
		return
	}

	resp := AgentRunResponse{
		Output: output,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handlePreparePrompt(w http.ResponseWriter, r *http.Request) {
	var apiReq AgentRunRequest // The request body is the same as a run request
	if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create an internal request model (same as in handleAgentRun)
	internalReq := models.AgentRunRequest{
		SystemInstruction: apiReq.SystemInstruction,
		Prompt:            apiReq.Prompt,
		OutputSchema:      apiReq.OutputSchema,
		LLMConfig:         apiReq.LLMConfig,
	}

	// Read codebase files (same as in handleAgentRun)
	codebaseContent, err := s.readCodebaseFiles(apiReq.ProjectRoot, apiReq.CodebasePaths)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read codebase files: %v", err), http.StatusInternalServerError)
		return
	}

	// 1. Build the chat messages using the SAME function as a live run.
	messages, err := llm.BuildChatMessages(internalReq, codebaseContent)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to build chat messages: %v", err), http.StatusInternalServerError)
		return
	}

	// 2. Create the final OpenAI request payload using the SAME function as a live run.
	// This assumes OpenAI is the provider for now. A future refactor could make this provider-agnostic.
	payload := llm.CreateRequestPayload(internalReq, messages)

	// 3. Marshal this accurate payload into a JSON string for the frontend.
	jsonPayloadBytes, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to marshal final payload to JSON: %v", err), http.StatusInternalServerError)
		return
	}

	// 4. Send this accurate JSON string in the response.
	// We keep the markdown prompt for potential future use or debugging.
	resp := AgentPreparePromptResponse{
		MarkdownPrompt: llm.BuildPromptMarkdown(internalReq, codebaseContent),
		JSONPrompt:     string(jsonPayloadBytes),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) readCodebaseFiles(projectRoot string, codebasePaths []string) (map[string]string, error) {
	contentMap := make(map[string]string)
	for _, relPath := range codebasePaths {
		absPath := filepath.Join(projectRoot, relPath)
		fileContent, err := os.ReadFile(absPath)
		if err != nil {
			log.Printf("Skipping file %s due to read error: %v", relPath, err)
			continue // Or handle error more gracefully
		}
		contentMap[relPath] = string(fileContent)
	}
	return contentMap, nil
}

func (s *Server) handleSaveAgent(w http.ResponseWriter, r *http.Request) {
	var agentToSave models.Agent
	if err := json.NewDecoder(r.Body).Decode(&agentToSave); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := s.agentStore.SaveAgent(r.Context(), &agentToSave); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save agent: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Agent saved successfully"))
}

func (s *Server) handleListAgents(w http.ResponseWriter, r *http.Request) {
	agents, err := s.agentStore.ListAgents(r.Context())
	if err != nil {
		http.Error(w, "Failed to list agents", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(agents); err != nil {
		log.Printf("Failed to write agent list response: %v", err)
	}
}

func (s *Server) handleDeleteAgent(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "agentID")
	if agentID == "" {
		http.Error(w, "Agent ID is required", http.StatusBadRequest)
		return
	}

	if err := s.agentStore.DeleteAgent(r.Context(), agentID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete agent: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Agent deleted successfully"))
}
