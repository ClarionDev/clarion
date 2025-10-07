package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"github.com/ClarionDev/clarion/internal/tokencounter"
)

func (s *Server) handleTokenCount(w http.ResponseWriter, r *http.Request) {
	var req TokenCountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.AgentID == "" {
		http.Error(w, "Agent ID is required", http.StatusBadRequest)
		return
	}

	agent, err := s.agentStore.GetAgent(r.Context(), req.AgentID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get agent: %v", err), http.StatusNotFound)
		return
	}

	codebaseContents, err := s.readCodebaseFiles(req.ProjectRoot, req.CodebasePaths)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read codebase files: %v", err), http.StatusInternalServerError)
		return
	}

	var contentBuilder strings.Builder
	keys := make([]string, 0, len(codebaseContents))
	for k := range codebaseContents {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, path := range keys {
		contentBuilder.WriteString(fmt.Sprintf("File: %s\n```\n%s\n```\n\n", path, codebaseContents[path]))
	}
	codebaseString := strings.TrimSpace(contentBuilder.String())

	count, err := tokencounter.Count(r.Context(), agent, req.UserPrompt, codebaseString)
	if err != nil {
		var fullContent strings.Builder
		fullContent.WriteString(agent.SystemPrompt)
		fullContent.WriteString(codebaseString)
		fullContent.WriteString(req.UserPrompt)
		count = tokencounter.BasicTokenApproximation(fullContent.String())
	}

	resp := TokenCountResponse{
		TokenCount: count,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
