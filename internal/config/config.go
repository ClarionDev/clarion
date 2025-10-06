package config

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

type Config struct {
	OpenAIAPIKey string `yaml:"openai_api_key"`
}

var loadedConfig *Config

func LoadConfig() (*Config, error) {
	if loadedConfig != nil {
		return loadedConfig, nil
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	configPath := filepath.Join(home, ".clarion", "config.yml")

	// Check if the config file exists. If not, create it.
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		configDir := filepath.Dir(configPath)
		if err := os.MkdirAll(configDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create config directory %s: %w", configDir, err)
		}

		// Create a template config file.
		templateContent := "openai_api_key: 'your_openai_api_key_here'\n"
		if err := os.WriteFile(configPath, []byte(templateContent), 0644); err != nil {
			return nil, fmt.Errorf("failed to create template config file at %s: %w", configPath, err)
		}

		// Return a user-friendly error instructing them to edit the new file.
		return nil, fmt.Errorf("configuration file created at %s. Please edit it to add your OpenAI API key", configPath)
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	loadedConfig = &cfg
	return loadedConfig, nil
}