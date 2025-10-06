// main.go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/ClarionDev/clarion/internal/api"
	"github.com/ClarionDev/clarion/internal/database"
	"github.com/ClarionDev/clarion/internal/llm"
	"github.com/ClarionDev/clarion/internal/storage"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default or environment-set variables.")
	}

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
	projectStore := storage.NewSQLiteProjectStore(sqlDB)
	runStore := storage.NewSQLiteRunStore(sqlDB)

	database.SeedData(ctx, agentStore, llmConfigStore, projectStore, runStore)

	server := api.NewServer(agentStore, llmConfigStore, projectStore, runStore)

	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "2077"
	}
	addr := fmt.Sprintf(":%s", port)

	log.Printf("Starting server on %s", addr)
	if err := server.Start(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
