export interface LegacyComponentDecision {
  componentName: string | null;
  props: Record<string, unknown> | null;
  message: string;
  suggestedActions?: SuggestedAction[];
  toolCallRequest?: ToolCallRequest;
  toolCallId?: string;
  componentState: Record<string, unknown> | null;
  reasoning: string;
}

export interface ComponentDecisionV2 {
  componentName: string | null;
  props: Record<string, unknown> | null;
  message: string;
  componentState: Record<string, unknown> | null;
  reasoning: string;
}

export interface ToolCallRequest {
  toolName: string;
  /** @deprecated - The enclosing message's tool_call_id is used instead */
  tool_call_id?: string;
  parameters: {
    parameterName: string;
    parameterValue: unknown;
  }[];
}

export interface SuggestedAction {
  label: string;
  actionText: string;
}
