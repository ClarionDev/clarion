package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/ClarionDev/clarion/internal/models"
)

type SQLiteAgentStore struct {
	db *sql.DB
}

func NewSQLiteAgentStore(db *sql.DB) *SQLiteAgentStore {
	return &SQLiteAgentStore{db: db}
}

func (s *SQLiteAgentStore) SaveAgent(ctx context.Context, agent *models.Agent) error {
	agentData, err := json.Marshal(agent)
	if err != nil {
		return fmt.Errorf("failed to marshal agent: %w", err)
	}

	query := `INSERT INTO agents (id, agent_data) VALUES (?, ?)
			  ON CONFLICT(id) DO UPDATE SET agent_data = excluded.agent_data, updated_at = CURRENT_TIMESTAMP;`

	_, err = s.db.ExecContext(ctx, query, agent.Profile.ID, string(agentData))
	return err
}

func (s *SQLiteAgentStore) GetAgent(ctx context.Context, id string) (*models.Agent, error) {
	var agentData string
	query := `SELECT agent_data FROM agents WHERE id = ?;`
	err := s.db.QueryRowContext(ctx, query, id).Scan(&agentData)
	if err != nil {
		return nil, err
	}

	var agent models.Agent
	err = json.Unmarshal([]byte(agentData), &agent)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal agent: %w", err)
	}

	return &agent, nil
}

func (s *SQLiteAgentStore) ListAgents(ctx context.Context) ([]*models.Agent, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT agent_data FROM agents ORDER BY created_at;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agents []*models.Agent
	for rows.Next() {
		var agentData string
		if err := rows.Scan(&agentData); err != nil {
			return nil, err
		}

		var agent models.Agent
		err = json.Unmarshal([]byte(agentData), &agent)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal agent: %w", err)
		}
		agents = append(agents, &agent)
	}

	return agents, nil
}

func (s *SQLiteAgentStore) DeleteAgent(ctx context.Context, id string) error {
	query := `DELETE FROM agents WHERE id = ?;`
	_, err := s.db.ExecContext(ctx, query, id)
	return err
}
