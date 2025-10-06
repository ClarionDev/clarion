package storage

import (
	"context"
	"github.com/ClarionDev/clarion/internal/models"
)

type ProjectStore interface {
	SaveProject(ctx context.Context, project *models.Project) error
	GetProject(ctx context.Context, id string) (*models.Project, error)
	GetProjectByPath(ctx context.Context, path string) (*models.Project, error)
	ListProjects(ctx context.Context) ([]*models.Project, error)
	DeleteProject(ctx context.Context, id string) error
}
