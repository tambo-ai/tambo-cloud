export interface LlmModelProperty {
  [key: string]: string | number | boolean | undefined;
  supportsTools?: boolean;
  supportsJsonMode?: boolean;
}

export interface LlmModelConfig {
  [key: string]: {
    apiName: string; // The actual name used in API calls, e.g., "gpt-4o-mini"
    displayName: string; // User-friendly name, e.g., "GPT-4o Mini"
    status: "tested" | "untested";
    notes?: string; // For known issues, specific behaviors, etc.
    docLink?: string; // Link to external documentation about the model or its issues
    tamboDocLink?: string; // Link to Tambo's documentation about the model or its issues
    properties?: LlmModelProperty;
  };
}

export interface LlmProviderConfig {
  apiName: string; // e.g., "openai", "anthropic" - must match Provider type and providerKeys.providerName
  displayName: string; // User-friendly name, e.g., "OpenAI"
  docLinkRoot?: string; // Root URL for the provider's documentation
  apiKeyLink?: string; // Link to where users can get their API key
  models?: LlmModelConfig; // Keyed by model apiName for easy lookup
  isCustomProvider?: boolean; // Whether the provider is custom
  requiresBaseUrl?: boolean; // Whether the provider requires a base URL
}

export type LlmConfig = Record<string, LlmProviderConfig>;
