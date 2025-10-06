package api

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
)

var fsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type fsWatchRequest struct {
	Path string `json:"path"`
}

type fsWatchResponse struct {
	Event string `json:"event"`
	Path  string `json:"path,omitempty"`
	Op    string `json:"op,omitempty"`
}

var defaultIgnoreDirs = map[string]struct{}{
	".git":         {},
	"node_modules": {},
	"dist":         {},
	"build":        {},
	".vscode":      {},
	".idea":        {},
	"target":       {},
	"__pycache__":  {},
	".venv":        {},
	"venv":         {},
	"test_storage": {},
	"markdown":     {},
}

func (s *Server) handleFSWatchWS(w http.ResponseWriter, r *http.Request) {
	conn, err := fsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade fs watch connection: %v", err)
		return
	}
	defer conn.Close()

	var req fsWatchRequest
	if err := conn.ReadJSON(&req); err != nil {
		log.Printf("Failed to read initial fs watch message: %v", err)
		return
	}

	if req.Path == "" {
		log.Println("Invalid initial fs watch message: path is required")
		_ = conn.WriteJSON(fsWatchResponse{Event: "error_path_required"})
		return
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("Failed to create file watcher: %v", err)
		_ = conn.WriteJSON(fsWatchResponse{Event: "error_create_watcher"})
		return
	}
	defer watcher.Close()

	go func() {
		defer conn.Close()
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename) {
					relPath, err := filepath.Rel(req.Path, event.Name)
					if err != nil {
						log.Printf("Could not get relative path for changed file %s: %v", event.Name, err)
						continue
					}
					log.Printf("File change detected: %s op: %s", relPath, event.Op)
					if err := conn.WriteJSON(fsWatchResponse{Event: "change", Path: relPath, Op: event.Op.String()}); err != nil {
						log.Printf("Error sending fs watch event: %v", err)
						return
					}
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Printf("File watcher error: %v", err)
			case <-r.Context().Done():
				return
			}
		}
	}()

	err = filepath.Walk(req.Path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			dirName := info.Name()
			if _, ignored := defaultIgnoreDirs[dirName]; ignored && dirName != filepath.Base(req.Path) {
				return filepath.SkipDir
			}
			return watcher.Add(path)
		}
		return nil
	})

	if err != nil {
		log.Printf("Failed to add paths to watcher: %v", err)
		_ = conn.WriteJSON(fsWatchResponse{Event: "error_add_watch_path"})
		return
	}

	log.Printf("Watching %s for file changes.", req.Path)

	for {
		if _, _, err := conn.NextReader(); err != nil {
			log.Printf("FS Watch client disconnected: %v", err)
			break
		}
	}
	log.Printf("Stopped watching %s.", req.Path)
}
