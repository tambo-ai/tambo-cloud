import {
  SuggestedAction,
  ToolCallRequest,
} from '@use-hydra-ai/hydra-ai-server';

export class ComponentDecision {
  componentName?: string | null;
  props?: Record<string, any>;
  message?: string;
  suggestedActions?: SuggestedAction[];
  toolCallRequest?: ToolCallRequest;
  threadId?: string;
}
