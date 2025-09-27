import type { JSONSchema7 } from "json-schema";
import type { RunAgentParameters } from "@ag-ui/client";

export interface AgentSpec {
  /** Optional human-friendly name used in tool description */
  readonly name?: string;
  /** Optional human-friendly description used in tool description */
  readonly description?: string;
  /**
   * Optional custom tool name. Must match /[a-zA-Z0-9_]+/.
   * If omitted, we will generate `run_<slug(name)>`.
   */
  readonly toolName?: string;
  /** JSON Schema for the agent-specific input parameters (first argument). */
  readonly inputSchema?: JSONSchema7;
  /** Optional JSON Schema for the agent result payload. */
  readonly outputSchema?: JSONSchema7;
  /** Static parameters merged into every run (e.g., agentId). */
  readonly staticParams?: Record<string, unknown>;
}

export interface MCPToolInput<TParams = Record<string, unknown>> {
  /** The tool-specific parameters for this agent (first argument). */
  params: TParams;
  /**
   * Generic agent runtime options (second argument). Borrowed from @ag-ui/client's
   * `RunAgentParameters` so we don't duplicate shapes.
   */
  agent?: RunAgentParameters;
}

/** YAML-driven CLI configuration */
export interface AgentsYamlConfigV1 {
  /** List of agents to expose as MCP tools. */
  agents?: AgentYamlEntry[];
  /** Optional MCP server name/version metadata; forwarded to the SDK Server constructor. */
  server?: {
    name?: string;
    version?: string;
  };
}

export interface AgentYamlEntry extends AgentSpec {
  /**
   * Agent integration type. "http" is supported out of the box. Others (e.g., "mastra", "crewai")
   * attempt a best-effort dynamic import of the corresponding `@ag-ui/<type>` package.
   */
  readonly type: string;
  /** Endpoint or identifier used to kick off the agent (semantics depend on type). */
  readonly url?: string;
  /** Static parameters that should be sent to the agent on every run. */
  readonly params?: Record<string, unknown>;
}

export interface RegisteredAgentTool {
  name: string;
  inputSchema: JSONSchema7;
  handler: (input: MCPToolInput) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}
