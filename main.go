// main.go
package main

import (
	"log"

	"github.com/ClarionDev/clarion/internal/api"
	"github.com/ClarionDev/clarion/internal/llm"
)

func main() {
	// Initialize the LLM Provider Registry at startup
	llm.RegisterProviders()

	server := api.NewServer()
	addr := ":2077"

	log.Printf("Starting server on %s", addr)
	if err := server.Start(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

	// llm.PrintSimulatedReq()

}
