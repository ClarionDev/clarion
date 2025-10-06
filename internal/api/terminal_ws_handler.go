package api

import (
	"log"
	"net/http"
	"github.com/ClarionDev/clarion/internal/shell"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections for development
		return true
	},
}

func (s *Server) handleTerminalWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	var initMsg WsInitMessage
	if err := conn.ReadJSON(&initMsg); err != nil {
		log.Printf("Failed to read initial message: %v", err)
		return
	}

	if initMsg.Command == "" || initMsg.ProjectRoot == "" {
		log.Printf("Invalid initial message: command and project_root are required")
		return
	}

	log.Printf("Starting command '%s' in '%s'", initMsg.Command, initMsg.ProjectRoot)
	shell.StreamCommand(conn, initMsg.Command, initMsg.ProjectRoot)
	log.Printf("Command streaming finished for '%s'", initMsg.Command)
}
