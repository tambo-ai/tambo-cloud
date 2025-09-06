import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { CustomLlmParams } from "@tambo-ai-cloud/backend";

export class ProjectCreateRequest {
  projectName!: string;
}

export class ProjectUpdateRequest {
  name?: string;
  customLlmParams?: CustomLlmParams;
}

export class ProjectResponse {
  id!: string;
  name!: string;
  userId!: string;
  defaultLlmProviderName?: string;
  defaultLlmModelName?: string;
  customLlmModelName?: string;
  customLlmBaseURL?: string;
  customInstructions?: string;
  maxInputTokens?: number | null;
  isTokenRequired!: boolean;
  providerType!: AiProviderType;
  agentProviderType?: AgentProviderType;
  // TODO: This should not be exposed in the public API
  agentName?: string;
  // TODO: This should not be exposed in the public API
  agentUrl?: string;
  /** Custom LLM parameters that override defaults */
  customLlmParams!: CustomLlmParams;
}

export class SimpleProjectResponse {
  id!: string;
  name!: string;
}
