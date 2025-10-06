package storage

import (
	"context"

	"github.com/ClarionDev/clarion/internal/models"
)

type AgentStore interface {
	SaveAgent(ctx context.Context, agent *models.Agent) error
	GetAgent(ctx context.Context, id string) (*models.Agent, error)
	ListAgents(ctx context.Context) ([]*models.Agent, error)
	DeleteAgent(ctx context.Context, id string) error
}
