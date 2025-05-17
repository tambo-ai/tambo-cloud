import { LlmModelConfig } from "../llm-config-types";

export const mistralModels: LlmModelConfig = {
  "open-mixtral-8x22b": {
    apiName: "open-mixtral-8x22b",
    displayName: "open Mixtral 8x22b",
    status: "untested",
    notes:
      "Mixtral 8x22B is Mistral's most powerful open-weight model, optimized for reasoning, coding, and math. Uses a sparse MoE setup with 39B active parameters per token.",
    docLink: "https://mistral.ai/news/mixtral-8x22b",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "mistral-small-latest": {
    apiName: "mistral-small-latest",
    displayName: "Mistral Small",
    status: "untested",
    notes:
      "Mistral Small is a compact, open-source model with multimodal support and 128K context. Fast and efficient for real-time tasks like chatbots and coding.",
    docLink: "https://mistral.ai/news/mistral-small-3-1",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "mistral-large-latest": {
    apiName: "mistral-large-latest",
    displayName: "Mistral Large",
    status: "untested",
    notes:
      "Mistral Large is Mistral's top-tier reasoning model for complex tasks, with latest version released in Nov 2024. Best for advanced problem-solving and analysis.",
    docLink: "https://mistral.ai/news/pixtral-large",
    tamboDocLink: "https://tambo.co/docs",
    properties: {
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
