// internal/api/server.go
package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/ClarionDev/clarion/internal/codebase"
	"github.com/ClarionDev/clarion/internal/fs"
	"github.com/ClarionDev/clarion/internal/storage"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Server struct {
	router         *chi.Mux
	agentStore     storage.AgentStore
	llmConfigStore storage.LLMConfigStore
	projectStore   storage.ProjectStore
}

func NewServer(agentStore storage.AgentStore, llmConfigStore storage.LLMConfigStore, projectStore storage.ProjectStore) *Server {
	r := chi.NewRouter()

	s := &Server{
		router:         r,
		agentStore:     agentStore,
		llmConfigStore: llmConfigStore,
		projectStore:   projectStore,
	}

	s.setupMiddleware()
	s.setupRoutes()

	return s
}

func (s *Server) setupMiddleware() {
	s.router.Use(middleware.RequestID)
	s.router.Use(middleware.RealIP)
	s.router.Use(middleware.Logger)
	s.router.Use(middleware.Recoverer)

	cors := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*", "tauri://localhost"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	s.router.Use(cors.Handler)
}

func (s *Server) setupRoutes() {
	s.router.Get("/ping", handlePing)

	s.router.Route("/api/v2", func(r chi.Router) {
		r.Route("/fs", func(r chi.Router) {
			r.Post("/directory/load", s.handleLoadDirectory)
			r.Post("/file/read", s.handleReadFile)
			r.Post("/files/read", s.handleReadFiles)
			r.Post("/files/apply", s.handleApplyChanges)
			r.Post("/preview-filter", s.handlePreviewFilter)
			r.Post("/file/create", s.handleCreateFile)
			r.Post("/file/write", s.handleWriteFile)
			r.Post("/file/delete", s.handleDeleteFile)
			r.Post("/file/copy", s.handleCopyFile)
			r.Get("/watch", s.handleFSWatchWS)
		})
		r.Route("/agents", func(r chi.Router) {
			r.Get("/list", s.handleListAgents)
			r.Post("/save", s.handleSaveAgent)
			r.Post("/run", s.handleAgentRun)
			r.Post("/prepare-prompt", s.handlePreparePrompt)
			r.Delete("/delete/{agentID}", s.handleDeleteAgent)
		})
		r.Route("/llm-configs", func(r chi.Router) {
			r.Get("/list", s.handleListLLMConfigs)
			r.Post("/save", s.handleSaveLLMConfig)
			r.Delete("/delete/{configID}", s.handleDeleteLLMConfig)
		})
		r.Route("/terminal", func(r chi.Router) {
			r.Get("/ws", s.handleTerminalWS)
		})
		r.Route("/projects", func(r chi.Router) {
			r.Get("/list", s.handleListProjects)
			r.Post("/open", s.handleOpenProject)
			r.Post("/update", s.handleUpdateProject)
			r.Delete("/delete/{projectID}", s.handleDeleteProject)
		})
	})
}

func (s *Server) Start(addr string) error {
	fmt.Printf("Server listening on %s\n", addr)
	return http.ListenAndServe(addr, s.router)
}

func handlePing(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("pong"))
}

func (s *Server) handleLoadDirectory(w http.ResponseWriter, r *http.Request) {
	var req LoadDirectoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Path == "" {
		http.Error(w, "Path cannot be empty", http.StatusBadRequest)
		return
	}

	loader := codebase.NewLocalFSLoader()
	cb, err := loader.LoadCodebaseStructure(req.Path)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to load codebase: %v", err), http.StatusInternalServerError)
		return
	}

	tree := codebase.BuildFileTree(cb)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(tree); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}

func (s *Server) handleReadFile(w http.ResponseWriter, r *http.Request) {
	var req ReadFileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Path == "" {
		http.Error(w, "Path cannot be empty", http.StatusBadRequest)
		return
	}

	content, err := os.ReadFile(req.Path)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read file: %v", err), http.StatusInternalServerError)
		return
	}

	resp := ReadFileResponse{
		Content: string(content),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleReadFiles(w http.ResponseWriter, r *http.Request) {
	var req ReadFilesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Paths) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(ReadFilesResponse{Files: make(map[string]string)})
		return
	}

	filesContent := make(map[string]string)
	for _, path := range req.Paths {
		content, err := os.ReadFile(path)
		if err != nil {
			log.Printf("Could not read file %s: %v", path, err)
			filesContent[path] = fmt.Sprintf("// Error reading file: %v", err)
		} else {
			filesContent[path] = string(content)
		}
	}

	resp := ReadFilesResponse{
		Files: filesContent,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleApplyChanges(w http.ResponseWriter, r *http.Request) {
	var req ApplyChangesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.RootPath == "" {
		http.Error(w, "Root path is required to apply changes", http.StatusBadRequest)
		return
	}

	for _, change := range req.Changes {
		absolutePath := filepath.Join(req.RootPath, change.Path)

		var err error
		switch change.Action {
		case "create":
			err = fs.CreateFile(absolutePath, change.NewContent)
		case "modify":
			err = fs.ModifyFile(absolutePath, change.NewContent)
		case "delete":
			err = fs.DeleteFile(absolutePath)
		default:
			err = fmt.Errorf("unknown action: %s for path: %s", change.Action, change.Path)
		}

		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to apply change for %s: %v", change.Path, err), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Changes applied successfully"))
}

func (s *Server) handlePreviewFilter(w http.ResponseWriter, r *http.Request) {
	var req PreviewFilterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	statuses := codebase.GetFileStatuses(req.FilePaths, req.IncludeGlobs, req.ExcludeGlobs)

	resp := PreviewFilterResponse{
		Status: statuses,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleCreateFile(w http.ResponseWriter, r *http.Request) {
	var req FileOperationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	fullPath := filepath.Join(req.RootPath, req.Path)
	if err := fs.CreateFile(fullPath, ""); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) handleDeleteFile(w http.ResponseWriter, r *http.Request) {
	var req FileOperationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	fullPath := filepath.Join(req.RootPath, req.Path)
	if err := fs.DeleteFile(fullPath); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleCopyFile(w http.ResponseWriter, r *http.Request) {
	var req CopyFileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	sourcePath := filepath.Join(req.RootPath, req.Source)
	destPath := filepath.Join(req.RootPath, req.Destination)
	if err := fs.CopyFile(sourcePath, destPath); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleWriteFile(w http.ResponseWriter, r *http.Request) {
	var req WriteFileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	fullPath := filepath.Join(req.RootPath, req.Path)
	if err := fs.ModifyFile(fullPath, req.Content); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
