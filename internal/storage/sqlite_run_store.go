package storage

import (
	"context"
	"database/sql"

	"github.com/ClarionDev/clarion/internal/models"
)

type SQLiteRunStore struct {
	db *sql.DB
}

func NewSQLiteRunStore(db *sql.DB) *SQLiteRunStore {
	return &SQLiteRunStore{db: db}
}

func (s *SQLiteRunStore) SaveRun(ctx context.Context, run *models.Run) error {
	query := `INSERT INTO runs (id, project_id, run_data) VALUES (?, ?, ?)
			  ON CONFLICT(id) DO UPDATE SET run_data = excluded.run_data;`

	_, err := s.db.ExecContext(ctx, query, run.ID, run.ProjectID, run.RunData)
	return err
}

func (s *SQLiteRunStore) ListRunsByProject(ctx context.Context, projectID string) ([]*models.Run, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, project_id, run_data FROM runs WHERE project_id = ? ORDER BY created_at ASC;`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	runs := make([]*models.Run, 0)
	for rows.Next() {
		var run models.Run
		if err := rows.Scan(&run.ID, &run.ProjectID, &run.RunData); err != nil {
			return nil, err
		}
		runs = append(runs, &run)
	}
	return runs, nil
}
