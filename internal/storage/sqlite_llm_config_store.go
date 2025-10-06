package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/ClarionDev/clarion/internal/models"
)

type SQLiteLLMConfigStore struct {
	db *sql.DB
}

func NewSQLiteLLMConfigStore(db *sql.DB) *SQLiteLLMConfigStore {
	return &SQLiteLLMConfigStore{db: db}
}

func (s *SQLiteLLMConfigStore) SaveLLMConfig(ctx context.Context, config *models.LLMProviderConfig) error {
	configData, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal llm config: %w", err)
	}

	query := `INSERT INTO llm_configs (id, config_data) VALUES (?, ?)
			  ON CONFLICT(id) DO UPDATE SET config_data = excluded.config_data, updated_at = CURRENT_TIMESTAMP;`

	_, err = s.db.ExecContext(ctx, query, config.ID, string(configData))
	return err
}

func (s *SQLiteLLMConfigStore) GetLLMConfig(ctx context.Context, id string) (*models.LLMProviderConfig, error) {
	var configData string
	query := `SELECT config_data FROM llm_configs WHERE id = ?;`
	err := s.db.QueryRowContext(ctx, query, id).Scan(&configData)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("llm config with id '%s' not found", id)
		}
		return nil, err
	}

	var config models.LLMProviderConfig
	err = json.Unmarshal([]byte(configData), &config)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal llm config: %w", err)
	}

	return &config, nil
}

func (s *SQLiteLLMConfigStore) ListLLMConfigs(ctx context.Context) ([]*models.LLMProviderConfig, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT config_data FROM llm_configs ORDER BY created_at;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	configs := []*models.LLMProviderConfig{}
	for rows.Next() {
		var configData string
		if err := rows.Scan(&configData); err != nil {
			return nil, err
		}

		var config models.LLMProviderConfig
		err = json.Unmarshal([]byte(configData), &config)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal llm config: %w", err)
		}
		configs = append(configs, &config)
	}

	return configs, nil
}

func (s *SQLiteLLMConfigStore) DeleteLLMConfig(ctx context.Context, id string) error {
	query := `DELETE FROM llm_configs WHERE id = ?;`
	_, err := s.db.ExecContext(ctx, query, id)
	return err
}
