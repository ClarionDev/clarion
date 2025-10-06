package hydrator

import (
	"fmt"
	"github.com/ClarionDev/clarion/internal/agent"
	"github.com/ClarionDev/clarion/internal/message"
	"github.com/ClarionDev/clarion/internal/models"
)

// HydrateAgent orchestrates the conversion of a generic Block of type Agent
// into a validated, type-safe Agent struct. This is the primary entry point
// for making raw stored data usable by the application.
func HydrateAgent(block *models.Block) (*models.Agent, error) {
	// 1. Validate the root block's type. This is the first gate.
	if block.Type != models.TypeAgent {
		return nil, fmt.Errorf("invalid block type: expected '%s', but got '%s'", models.TypeAgent, block.Type)
	}

	// 2. Hydrate primitive properties and metadata from the root block.
	hydratedAgent := &models.Agent{
		Profile: agent.AgentProfile{
			ID:      block.ID, // The block's ID is the agent's unique ID/Name
			Version: block.Version,
		},
		UserVariables: []models.UserVariableDef{}, // Initialize slice to avoid nil pointer issues
	}

	// Extract metadata into the Profile
	if name, ok := block.Metadata["name"]; ok {
		hydratedAgent.Profile.Name = name
	} else {
		// If name is missing in metadata, fall back to the block ID.
		hydratedAgent.Profile.Name = block.ID
	}
	if desc, ok := block.Metadata["description"]; ok {
		hydratedAgent.Profile.Description = desc
	}
	if author, ok := block.Metadata["author"]; ok {
		hydratedAgent.Profile.Author = author
	}
	if icon, ok := block.Metadata["icon"]; ok {
		hydratedAgent.Profile.Icon = icon
	}

	// Extract system_prompt from properties
	if sysPrompt, ok := block.Properties["system_prompt"].(string); ok {
		hydratedAgent.SystemPrompt = sysPrompt
	} else {
		return nil, fmt.Errorf("validation error in Agent block '%s': properties is missing required 'system_prompt' field of type string", block.ID)
	}

	// Extract llm_config from properties
	if llmConfigMap, ok := block.Properties["llm_config"].(map[string]any); ok {
		var llmConfig models.LLMConfig
		if provider, ok := llmConfigMap["provider"].(string); ok {
			llmConfig.Provider = provider
		}
		if model, ok := llmConfigMap["model"].(string); ok {
			llmConfig.Model = model
		}
		if configId, ok := llmConfigMap["configId"].(string); ok {
			llmConfig.ConfigID = configId
		}
		if parameters, ok := llmConfigMap["parameters"].(map[string]any); ok {
			llmConfig.Parameters = parameters
		}
		hydratedAgent.LLMConfig = llmConfig
	}

	// 3. Iterate through all children to find, hydrate, and attach component parts.
	var filterSetFound bool
	var outputSchemaFound bool
	for _, child := range block.Children {
		if child == nil {
			continue // Safeguard against nil pointers in the children slice.
		}
		switch child.Type {
		case models.TypeFilterSet:
			fs, err := hydrateFilterSet(child)
			if err != nil {
				return nil, fmt.Errorf("failed to hydrate child FilterSet for agent '%s': %w", hydratedAgent.Profile.Name, err)
			}
			hydratedAgent.CodebaseFilters = *fs
			filterSetFound = true

		case models.TypeOutputSchema:
			os, err := hydrateOutputSchema(child)
			if err != nil {
				return nil, fmt.Errorf("failed to hydrate child OutputSchema for agent '%s': %w", hydratedAgent.Profile.Name, err)
			}
			hydratedAgent.OutputSchema = *os
			outputSchemaFound = true

		case models.TypeUserVariableDef:
			uv, err := hydrateUserVariableDef(child)
			if err != nil {
				return nil, fmt.Errorf("failed to hydrate child UserVariableDef for agent '%s': %w", hydratedAgent.Profile.Name, err)
			}
			hydratedAgent.UserVariables = append(hydratedAgent.UserVariables, *uv)
		}
	}

	// 4. Enforce mandatory children rules. An agent must have filters and an output schema.
	if !filterSetFound {
		return nil, fmt.Errorf("validation error in Agent '%s': must contain exactly one child block of type '%s'", hydratedAgent.Profile.Name, models.TypeFilterSet)
	}
	if !outputSchemaFound {
		return nil, fmt.Errorf("validation error in Agent '%s': must contain exactly one child block of type '%s'", hydratedAgent.Profile.Name, models.TypeOutputSchema)
	}

	return hydratedAgent, nil
}


// hydrateFilterSet converts a FilterSet Block into a FilterSet schema struct.
// (This function's logic does not need to change, but it's included for completeness)
func hydrateFilterSet(block *models.Block) (*models.FilterSet, error) {
	if block.Type != models.TypeFilterSet {
		return nil, fmt.Errorf("invalid block type: expected '%s', but got '%s'", models.TypeFilterSet, block.Type)
	}
	fs := &models.FilterSet{}
	var err error
	if include, ok := block.Properties["include_globs"]; ok {
		fs.IncludeGlobs, err = castToStringSlice(include)
		if err != nil {
			return nil, fmt.Errorf("validation error in FilterSet block '%s': property 'include_globs' must be a list of strings: %w", block.ID, err)
		}
	}
	if exclude, ok := block.Properties["exclude_globs"]; ok {
		fs.ExcludeGlobs, err = castToStringSlice(exclude)
		if err != nil {
			return nil, fmt.Errorf("validation error in FilterSet block '%s': property 'exclude_globs' must be a list of strings: %w", block.ID, err)
		}
	}
	if regex, ok := block.Properties["content_regex_include"].(string); ok {
		fs.ContentRegexInclude = regex
	}
	if maxFiles, ok := block.Properties["max_total_files"]; ok {
		if val, ok := maxFiles.(float64); ok {
			fs.MaxTotalFiles = int(val)
		} else if val, ok := maxFiles.(int); ok {
			fs.MaxTotalFiles = val
		} else {
			return nil, fmt.Errorf("validation error in FilterSet block '%s': property 'max_total_files' must be a whole number", block.ID)
		}
	}
	return fs, nil
}

// hydrateOutputSchema converts an OutputSchema Block into an OutputSchema schema struct.
// (This function's logic does not need to change)
func hydrateOutputSchema(block *models.Block) (*models.OutputSchema, error) {
	if block.Type != models.TypeOutputSchema {
		return nil, fmt.Errorf("invalid block type: expected '%s', but got '%s'", models.TypeOutputSchema, block.Type)
	}
	os := &models.OutputSchema{}
	if schema, ok := block.Properties["schema"].(map[string]any); ok {
		os.Schema = schema
	} else {
		return nil, fmt.Errorf("validation error in OutputSchema block '%s': property 'schema' is missing or not a valid map/object", block.ID)
	}
	return os, nil
}

// hydrateUserVariableDef converts a UserVariableDef Block into a UserVariableDef schema struct.
// (This function's logic does not need to change)
func hydrateUserVariableDef(block *models.Block) (*models.UserVariableDef, error) {
	if block.Type != models.TypeUserVariableDef {
		return nil, fmt.Errorf("invalid block type: expected '%s', but got '%s'", models.TypeUserVariableDef, block.Type)
	}
	uv := &models.UserVariableDef{}
	if name, ok := block.Metadata["name"]; ok {
		uv.Name = name
	} else {
		return nil, fmt.Errorf("validation error in UserVariableDef block '%s': metadata is missing required 'name' field", block.ID)
	}
	if desc, ok := block.Metadata["description"]; ok {
		uv.Description = desc
	}
	if required, ok := block.Properties["required"].(bool); ok {
		uv.Required = required
	}
	return uv, nil
}

// hydrateMessage converts a Block of TypeMessage into a models.Message struct.
func hydrateMessage(block *models.Block) (*models.Message, error) {
	if block.Type != models.TypeMessage {
		return nil, fmt.Errorf("invalid block type: expected '%s', but got '%s'", models.TypeMessage, block.Type)
	}

	msg := &models.Message{}
	if roleStr, ok := block.Properties["role"].(string); ok {
		msg.Role = message.ROLE(roleStr) // Cast string to message.ROLE
		// Optional: Add validation here to ensure the role string is one of the defined constants
		// e.g., if !isValidRole(msg.Role) { return nil, fmt.Errorf(...) }
	} else {
		return nil, fmt.Errorf("validation error in Message block '%s': properties is missing required 'role' field of type string", block.ID)
	}
	if content, ok := block.Properties["content"].(string); ok {
		msg.Content = content
	} else {
		return nil, fmt.Errorf("validation error in Message block '%s': properties is missing required 'content' field of type string", block.ID)
	}
	return msg, nil
}

// HydratePromptTemplate converts a Block of TypePromptTemplate into a models.PromptTemplate struct.
func HydratePromptTemplate(block *models.Block) (*models.PromptTemplate, error) {
	if block.Type != models.TypePromptTemplate {
		return nil, fmt.Errorf("invalid block type: expected '%s', but got '%s'", models.TypePromptTemplate, block.Type)
	}

	pt := &models.PromptTemplate{
		Name:        block.Metadata["name"], // Name and Description are optional for PromptTemplate metadata
		Description: block.Metadata["description"],
		Messages:    []models.Message{},
	}

	for _, child := range block.Children {
		if child == nil {
			continue
		}
		if child.Type == models.TypeMessage {
			msg, err := hydrateMessage(child)
			if err != nil {
				return nil, fmt.Errorf("failed to hydrate child Message for PromptTemplate '%s': %w", pt.Name, err)
			}
			pt.Messages = append(pt.Messages, *msg)
		} else {
			return nil, fmt.Errorf("validation error in PromptTemplate block '%s': unexpected child block type '%s'", block.ID, child.Type)
		}
	}

	return pt, nil
}

// castToStringSlice is a helper utility to safely convert an interface{} to a []string.
// (This function's logic does not need to change)
func castToStringSlice(slice interface{}) ([]string, error) {
	if s, ok := slice.([]interface{}); ok {
		result := make([]string, len(s))
		for i, v := range s {
			if str, ok := v.(string); ok {
				result[i] = str
			} else {
				return nil, fmt.Errorf("slice contains a non-string element")
			}
		}
		return result, nil
	}
	// Also handle the case where it might already be the correct type
	if s, ok := slice.([]string); ok {
		return s, nil
	}
	return nil, fmt.Errorf("value is not a slice")
}