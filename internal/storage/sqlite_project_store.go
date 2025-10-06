package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/ClarionDev/clarion/internal/models"
)

type SQLiteProjectStore struct {
	db *sql.DB
}

func NewSQLiteProjectStore(db *sql.DB) *SQLiteProjectStore {
	return &SQLiteProjectStore{db: db}
}

func (s *SQLiteProjectStore) SaveProject(ctx context.Context, project *models.Project) error {
	projectData, err := json.Marshal(project)
	if err != nil {
		return fmt.Errorf("failed to marshal project: %w", err)
	}

	query := `INSERT INTO projects (id, project_data) VALUES (?, ?)
			  ON CONFLICT(id) DO UPDATE SET project_data = excluded.project_data, updated_at = CURRENT_TIMESTAMP;`

	_, err = s.db.ExecContext(ctx, query, project.ID, string(projectData))
	return err
}

func (s *SQLiteProjectStore) GetProject(ctx context.Context, id string) (*models.Project, error) {
	var projectData string
	query := `SELECT project_data FROM projects WHERE id = ?;`
	err := s.db.QueryRowContext(ctx, query, id).Scan(&projectData)
	if err != nil {
		return nil, err
	}

	var project models.Project
	err = json.Unmarshal([]byte(projectData), &project)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal project: %w", err)
	}

	return &project, nil
}

func (s *SQLiteProjectStore) GetProjectByPath(ctx context.Context, path string) (*models.Project, error) {
	projects, err := s.ListProjects(ctx)
	if err != nil {
		return nil, err
	}
	for _, p := range projects {
		if p.Path == path {
			return p, nil
		}
	}
	return nil, sql.ErrNoRows
}

func (s *SQLiteProjectStore) ListProjects(ctx context.Context) ([]*models.Project, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT project_data FROM projects ORDER BY updated_at DESC;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := []*models.Project{}
	for rows.Next() {
		var projectData string
		if err := rows.Scan(&projectData); err != nil {
			return nil, err
		}

		var project models.Project
		err = json.Unmarshal([]byte(projectData), &project)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal project: %w", err)
		}
		projects = append(projects, &project)
	}

	return projects, nil
}

func (s *SQLiteProjectStore) DeleteProject(ctx context.Context, id string) error {
	query := `DELETE FROM projects WHERE id = ?;`
	_, err := s.db.ExecContext(ctx, query, id)
	return err
}
