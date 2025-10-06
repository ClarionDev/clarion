package shell

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os/exec"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

type WsResponseMessage struct {
	Type string `json:"type"` // "stdout", "stderr", "exit", "error"
	Data string `json:"data"`
}

func writeJSONMessage(conn *websocket.Conn, msgType string, data string, mu *sync.Mutex) {
	mu.Lock()
	defer mu.Unlock()
	msg := WsResponseMessage{Type: msgType, Data: data}
	if err := conn.WriteJSON(msg); err != nil {
		log.Printf("WebSocket write error: %v", err)
	}
}

func streamPipe(conn *websocket.Conn, pipe io.Reader, msgType string, wg *sync.WaitGroup, mu *sync.Mutex) {
	defer wg.Done()
	scanner := bufio.NewScanner(pipe)
	for scanner.Scan() {
		writeJSONMessage(conn, msgType, scanner.Text()+"\n", mu)
	}
	if err := scanner.Err(); err != nil {
		log.Printf("Error reading from pipe (%s): %v", msgType, err)
		writeJSONMessage(conn, "error", "Error reading pipe: "+err.Error(), mu)
	}
}

// splitCommand parses a command string into a program and its arguments.
// It handles simple cases and quoted arguments.
func splitCommand(command string) ([]string, error) {
	var parts []string
	var currentPart strings.Builder
	inQuote := false

	for _, r := range command {
		if r == '"' {
			inQuote = !inQuote
			continue
		}

		if r == ' ' && !inQuote {
			if currentPart.Len() > 0 {
				parts = append(parts, currentPart.String())
				currentPart.Reset()
			}
		} else {
			currentPart.WriteRune(r)
		}
	}

	if currentPart.Len() > 0 {
		parts = append(parts, currentPart.String())
	}

	if inQuote {
		return nil, fmt.Errorf("mismatched quotes in command: %s", command)
	}

	if len(parts) == 0 {
		return nil, fmt.Errorf("empty command")
	}

	return parts, nil
}

func StreamCommand(conn *websocket.Conn, command string, workingDir string) {
	parts, err := splitCommand(command)
	if err != nil {
		log.Printf("Error parsing command: %v", err)
		writeJSONMessage(conn, "error", "Could not parse command: "+err.Error(), &sync.Mutex{})
		writeJSONMessage(conn, "exit", "Command failed due to parsing error.", &sync.Mutex{})
		return
	}

	cmd := exec.Command(parts[0], parts[1:]...)
	cmd.Dir = workingDir

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("Error creating stdout pipe: %v", err)
		writeJSONMessage(conn, "error", "Could not create stdout pipe: "+err.Error(), &sync.Mutex{})
		return
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		log.Printf("Error creating stderr pipe: %v", err)
		writeJSONMessage(conn, "error", "Could not create stderr pipe: "+err.Error(), &sync.Mutex{})
		return
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	if err := cmd.Start(); err != nil {
		log.Printf("Error starting command: %v", err)
		fullErrorMsg := fmt.Sprintf("Could not start command '%s': %v", parts[0], err)
		writeJSONMessage(conn, "error", fullErrorMsg, &mu)
		writeJSONMessage(conn, "exit", "Command failed to start.", &mu)
		return
	}

	wg.Add(2)
	go streamPipe(conn, stdout, "stdout", &wg, &mu)
	go streamPipe(conn, stderr, "stderr", &wg, &mu)

	wg.Wait()

	err = cmd.Wait()
	if err != nil {
		log.Printf("Command finished with error: %v", err)
		writeJSONMessage(conn, "exit", "Command finished with error: "+err.Error(), &mu)
	} else {
		log.Printf("Command finished successfully")
		writeJSONMessage(conn, "exit", "Command finished successfully.", &mu)
	}
}
