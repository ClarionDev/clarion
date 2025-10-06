package storage

import (
	"context"

	"github.com/ClarionDev/clarion/internal/models"
)

type LLMConfigStore interface {
	SaveLLMConfig(ctx context.Context, config *models.LLMProviderConfig) error
	GetLLMConfig(ctx context.Context, id string) (*models.LLMProviderConfig, error)
	ListLLMConfigs(ctx context.Context) ([]*models.LLMProviderConfig, error)
	DeleteLLMConfig(ctx context.Context, id string) error
}
