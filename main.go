// main.go
package main

import (
	"context"
	"database/sql"
	"log"

	"github.com/ClarionDev/clarion/internal/api"
	"github.com/ClarionDev/clarion/internal/database"
	"github.com/ClarionDev/clarion/internal/llm"
	"github.com/ClarionDev/clarion/internal/storage"
)

func main() {
	// Initialize the LLM Provider Registry at startup
	llm.RegisterProviders()

	ctx := context.Background()
	db, err := database.New(ctx, "sqlite", "clarion.db")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.RunMigrations(ctx); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	sqlDB := db.Handle().(*sql.DB)
	agentStore := storage.NewSQLiteAgentStore(sqlDB)
	llmConfigStore := storage.NewSQLiteLLMConfigStore(sqlDB)

	server := api.NewServer(agentStore, llmConfigStore)
	addr := ":2077"

	log.Printf("Starting server on %s", addr)
	if err := server.Start(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
