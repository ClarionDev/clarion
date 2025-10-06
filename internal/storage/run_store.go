package storage

import (
	"context"

	"github.com/ClarionDev/clarion/internal/models"
)

type RunStore interface {
	SaveRun(ctx context.Context, run *models.Run) error
	ListRunsByProject(ctx context.Context, projectID string) ([]*models.Run, error)
}
