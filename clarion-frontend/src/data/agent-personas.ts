import { LucideIcon, Bot, Code, GitBranch, Beaker } from 'lucide-react';

export const iconMap: { [key: string]: LucideIcon } = {
  Bot,
  Code,
  GitBranch,
  Beaker,
  default: Bot,
};

export interface LLMConfig {
  provider: string;
  model: string;
  parameters: { [key: string]: any };
  configId?: string;
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  icon: string;
  systemPrompt: string;
  codebaseFilters: {
    includeGlobs: string[];
    excludeGlobs: string[];
    contentRegexInclude: string;
    maxTotalFiles: number;
  };
  outputSchema: object;
  userVariables: {
    name: string;
    description: string;
    required: boolean;
  }[];
  llmConfig: LLMConfig;
}

export const agentPersonas: AgentPersona[] = [];
