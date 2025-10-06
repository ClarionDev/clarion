import { TreeNodeData } from "../data/file-tree";
import { AgentPersona, LLMConfig } from "../data/agent-personas";
import { LLMProviderConfig } from "../data/llm-configs";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2077';

export interface AgentRunRequest {
  system_instruction: string;
  prompt: string;
  codebase_paths: string[];
  output_schema: object;
  project_root: string;
  llm_config: LLMConfig;
}

export interface FileChange {
  id?: string;
  action: 'create' | 'modify' | 'delete';
  path: string;
  original_content?: string;
  new_content: string;
}

export interface AgentOutput {
  summary?: string;
  file_changes?: FileChange[];
  error?: string;
  [key: string]: any;
}

export interface ApplyChangesPayload {
    root_path: string;
    changes: FileChange[];
}

export interface PreparedPromptResponse {
    markdownPrompt: string;
    jsonPrompt: string;
}

export const fetchDirectoryTree = async (path: string): Promise<TreeNodeData[]> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/directory/load`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load directory: ${errorText}`);
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Error fetching directory tree:", error);
        return [];
    }
};

export const fetchFileContent = async (path: string): Promise<string> => {
    try {
         const response = await fetch(`${API_URL}/api/v2/fs/file/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to read file: ${errorText}`);
        }

        const data = await response.json();
        return data.content || '';

    } catch (error) {
        console.error("Error fetching file content:", error);
        return `// Error loading file: ${error}`;
    }
}

export const writeFileContent = async (rootPath: string, path: string, content: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/file/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ root_path: rootPath, path, content }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const fetchFilesContent = async (paths: string[]): Promise<Record<string, string>> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/files/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paths }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to read files: ${errorText}`);
        }

        const data = await response.json();
        return data.files || {};

    } catch (error) {
        console.error("Error fetching files content:", error);
        return paths.reduce((acc, path) => {
            acc[path] = `// Error loading file: ${error}`;
            return acc;
        }, {} as Record<string, string>);
    }
};

export const fetchFilterPreview = async (
    filePaths: string[], 
    includeGlobs: string[], 
    excludeGlobs: string[]
): Promise<Record<string, 'included' | 'excluded'>> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/preview-filter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file_paths: filePaths, include_globs: includeGlobs, exclude_globs: excludeGlobs }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to preview filter: ${errorText}`);
        }

        const data = await response.json();
        return data.status || {};
    } catch (error) {
        console.error("Error fetching filter preview:", error);
        return {};
    }
};

export const fetchPreparedPrompt = async (payload: AgentRunRequest): Promise<PreparedPromptResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/agents/prepare-prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to prepare prompt: ${errorText}`);
        }

        const data: PreparedPromptResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching prepared prompt:", error);
        throw error;
    }
};

export const runAgent = async (request: AgentRunRequest): Promise<AgentOutput> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/agents/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Agent run failed with non-JSON response' }));
            throw new Error(errorData.error || `Agent run failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.output || {};
    } catch (error) {
        console.error("Error running agent:", error);
        return { error: (error as Error).message };
    }
};

export const applyFileChanges = async (payload: ApplyChangesPayload): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/files/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }

        return { success: true };
    } catch (error) {
        console.error("Error applying file changes:", error);
        return { success: false, error: (error as Error).message };
    }
};

export const createFile = async (rootPath: string, path: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/file/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ root_path: rootPath, path }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const deleteFile = async (rootPath: string, path: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/file/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ root_path: rootPath, path }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const copyFile = async (rootPath: string, source: string, destination: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/fs/file/copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ root_path: rootPath, source, destination }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

export const fetchAgents = async (): Promise<AgentPersona[]> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/agents/list`);
        if (!response.ok) {
            throw new Error('Failed to fetch agents');
        }
        const agents = await response.json();
        return agents.map((agent: any) => ({
            id: agent.Profile.ID,
            name: agent.Profile.Name,
            description: agent.Profile.Description,
            author: agent.Profile.Author,
            version: agent.Profile.Version,
            icon: agent.Profile.Icon,
            systemPrompt: agent.system_prompt,
            codebaseFilters: {
                includeGlobs: agent.codebase_filters.include_globs || [],
                excludeGlobs: agent.codebase_filters.exclude_globs || [],
                contentRegexInclude: agent.codebase_filters.content_regex_include || '',
                maxTotalFiles: agent.codebase_filters.max_total_files || 0,
            },
            outputSchema: agent.output_schema,
            userVariables: agent.user_variables || [],
            llmConfig: {
                provider: agent.llm_config?.provider || 'OpenAI',
                model: agent.llm_config?.model || 'gpt-4o',
                parameters: agent.llm_config?.parameters || { temperature: 0.7 },
                configId: agent.llm_config?.configId || '',
            },
        }));
    } catch (error) {
        console.error("Error fetching agents:", error);
        return [];
    }
};

export const saveAgent = async (agent: AgentPersona): Promise<{ success: boolean; error?: string }> => {
    const payload = {
        Profile: {
            ID: agent.id,
            Name: agent.name,
            Description: agent.description,
            Author: agent.author,
            Version: agent.version,
            Icon: agent.icon,
        },
        system_prompt: agent.systemPrompt,
        codebase_filters: {
            include_globs: agent.codebaseFilters.includeGlobs,
            exclude_globs: agent.codebaseFilters.excludeGlobs,
            content_regex_include: agent.codebaseFilters.contentRegexInclude,
            max_total_files: agent.codebaseFilters.maxTotalFiles,
        },
        output_schema: agent.outputSchema,
        user_variables: agent.userVariables,
        llm_config: {
            provider: agent.llmConfig.provider,
            model: agent.llmConfig.model,
            parameters: agent.llmConfig.parameters,
            configId: agent.llmConfig.configId,
        },
    };

    try {
        const response = await fetch(`${API_URL}/api/v2/agents/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        console.error("Error saving agent:", error);
        return { success: false, error: (error as Error).message };
    }
};

export const deleteAgent = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/agents/delete/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting agent:", error);
        return { success: false, error: (error as Error).message };
    }
};

export const fetchLLMConfigs = async (): Promise<LLMProviderConfig[]> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/llm-configs/list`);
        if (!response.ok) throw new Error('Failed to fetch LLM configs');
        return await response.json();
    } catch (error) {
        console.error("Error fetching LLM configs:", error);
        return [];
    }
};

export const saveLLMConfig = async (config: LLMProviderConfig): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/llm-configs/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        console.error("Error saving LLM config:", error);
        return { success: false, error: (error as Error).message };
    }
};

export const deleteLLMConfig = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_URL}/api/v2/llm-configs/delete/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting LLM config:", error);
        return { success: false, error: (error as Error).message };
    }
};
