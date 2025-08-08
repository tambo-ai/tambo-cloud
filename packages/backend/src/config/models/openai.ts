import { LlmModelConfig } from "../llm-config-types";

export const openaiModels: LlmModelConfig = {
  "gpt-5-2025-08-07": {
    apiName: "gpt-5-2025-08-07",
    displayName: "gpt-5",
    status: "tested",
    notes: "The best model for coding and agentic tasks across domains",
    docLink: "https://platform.openai.com/docs/models/gpt-5",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 400000,
      temperature: 1,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-5-mini-2025-08-07": {
    apiName: "gpt-5-mini-2025-08-07",
    displayName: "gpt-5-mini",
    status: "tested",
    notes:
      "A faster, more cost-efficient version of GPT-5 for well-defined tasks",
    docLink: "https://platform.openai.com/docs/models/gpt-5-mini",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 400000,
      temperature: 1,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-5-nano-2025-08-07": {
    apiName: "gpt-5-nano-2025-08-07",
    displayName: "gpt-5-nano",
    status: "tested",
    notes: "Fastest, most cost-efficient version of GPT-5",
    docLink: "https://platform.openai.com/docs/models/gpt-5-nano",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 400000,
      temperature: 1,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-4.1-2025-04-14": {
    apiName: "gpt-4.1-2025-04-14",
    displayName: "gpt-4.1",
    status: "tested",
    notes: "Excels at function calling and instruction following",
    docLink: "https://platform.openai.com/docs/models/gpt-4.1",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 1047576,
      supportsTools: true,
      supportsJsonMode: true,
    },
    isDefaultModel: true,
  },
  "gpt-4.1-mini-2025-04-14": {
    apiName: "gpt-4.1-mini-2025-04-14",
    displayName: "gpt-4.1-mini",
    status: "tested",
    notes: "Balanced for intelligence, speed, and cost",
    docLink: "https://platform.openai.com/docs/models/gpt-4.1-mini",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 1047576,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "o3-2025-04-16": {
    apiName: "o3-2025-04-16",
    displayName: "o3",
    status: "tested",
    notes: "The most powerful reasoning model",
    docLink: "https://platform.openai.com/docs/models/o3",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 200000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-4o-2024-11-20": {
    apiName: "gpt-4o-2024-11-20",
    displayName: "gpt-4o",
    status: "tested",
    notes:
      "Versatile and high-intelligence model with text and image input support. Best for most tasks, combining strong reasoning, creativity, and multimodal understanding.",
    docLink: "https://platform.openai.com/docs/models/gpt-4o",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-4o-mini-2024-07-18": {
    apiName: "gpt-4o-mini-2024-07-18",
    displayName: "gpt-4o-mini",
    status: "tested",
    notes:
      "Fast, affordable model ideal for focused tasks and fine-tuning. Supports text and image inputs, with low cost and latency for efficient performance.",
    docLink: "https://platform.openai.com/docs/models/gpt-4o-mini",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
  "gpt-4-turbo-2024-04-09": {
    apiName: "gpt-4-turbo-2024-04-09",
    displayName: "gpt-4-turbo",
    status: "tested",
    notes:
      "High-intelligence model that's cheaper and faster than GPT-4. Still powerful, but we recommend using GPT-4o for most tasks.",
    docLink: "https://platform.openai.com/docs/models/gpt-4-turbo",
    tamboDocLink: "https://docs.tambo.co",
    properties: {
      inputTokenLimit: 128000,
      supportsTools: true,
      supportsJsonMode: true,
    },
  },
};
