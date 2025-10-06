export const LLM_PROVIDERS = ['OpenAI', 'Anthropic', 'Google Gemini'] as const;
export type LLMProvider = typeof LLM_PROVIDERS[number];

export interface LLMProviderConfig {
    id: string;
    name: string;
    provider: LLMProvider;
    apiKey: string;
}
