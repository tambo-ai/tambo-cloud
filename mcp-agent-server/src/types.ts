import type { JSONSchema7 } from "json-schema";

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

export interface AgentRuntimeOptions {
  /** Optional set of tools the agent may call; passed through to the agent. */
  readonly tools?: Array<{
    name: string;
    description?: string;
    inputSchema?: JSONSchema7;
  }>;
  /** Optional headers or auth data forwarded to HTTP agents. */
  readonly headers?: Record<string, string>;
}

export interface MCPToolInput<TParams = Record<string, unknown>> {
  /** The tool-specific parameters for this agent (first argument). */
  params: TParams;
  /** Generic agent runtime options (second argument). */
  agent?: AgentRuntimeOptions;
}

/** YAML-driven CLI configuration */
export interface AgentsYamlConfigV1 {
  /** List of agents to expose as MCP tools. */
  agents?: AgentYamlEntry[];
  /** Back-compat: allow `servers` as an alias for `agents`. */
  servers?: AgentYamlEntry[];
  /** Optional server name/version metadata. */
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
