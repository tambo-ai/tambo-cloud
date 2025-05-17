import type { LlmConfig } from "./llm-config-types";
import { anthropicModels } from "./models/anthropic";
import { groqModels } from "./models/groq";
import { mistralModels } from "./models/mistral";
import { openaiModels } from "./models/openai";

export const llmConfig: LlmConfig = {
  openai: {
    apiName: "openai",
    displayName: "OpenAI",
    docLinkRoot: "https://platform.openai.com/docs",
    apiKeyLink: "https://platform.openai.com/api-keys",
    models: openaiModels,
  },
  anthropic: {
    apiName: "anthropic",
    displayName: "Anthropic",
    docLinkRoot: "https://docs.anthropic.com",
    apiKeyLink: "https://console.anthropic.com/settings/keys",
    models: anthropicModels,
  },
  groq: {
    apiName: "groq",
    displayName: "Groq",
    docLinkRoot: "https://console.groq.com/docs",
    apiKeyLink: "https://console.groq.com/keys",
    models: groqModels,
  },
  mistral: {
    apiName: "mistral",
    displayName: "Mistral",
    docLinkRoot: "https://docs.mistral.ai/",
    apiKeyLink: "https://console.mistral.ai/api-keys",
    models: mistralModels,
  },
  // TODO: when user selects openai-compatible, we should show UI to enter baseURL and custom models and provider name
  openaiCompatible: {
    apiName: "openai-compatible",
    displayName: "OpenAI Compatible",
    docLinkRoot: "https://docs.tokenjs.ai/providers/openai-compatible",
    isCustomProvider: true,
    requiresBaseUrl: true,
  },
};
