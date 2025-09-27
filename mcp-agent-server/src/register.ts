import type { JSONSchema7 } from "json-schema";
import type { AgentSpec, MCPToolInput } from "./types.js";
import {
  ACK_REQUESTED_SCHEMA,
  buildToolInputSchema,
  toToolSafeName,
  validateToolName,
} from "./util.js";
import type { AbstractAgent, AgentSubscriber } from "@ag-ui/client";

export type McpLikeServer = {
  tool?: (
    name: string,
    description: string,
    inputSchema: JSONSchema7 | Record<string, unknown>,
    hints: Record<string, unknown>,
    handler: (input: Record<string, unknown>) => Promise<unknown>,
  ) => void;
  server?: {
    elicitInput?: (params: {
      message?: string;
      requestedSchema: JSONSchema7;
    }) => Promise<unknown>;
  };
  elicitInput?: (params: {
    message?: string;
    requestedSchema: JSONSchema7;
  }) => Promise<unknown>;
};

/** Fire-and-forget; log but don't throw on elicitation errors. */
async function tryElicitAck(
  server: McpLikeServer,
  message: string,
): Promise<void> {
  const payload = { message, requestedSchema: ACK_REQUESTED_SCHEMA } as const;
  try {
    const direct = server as Record<string, unknown>;
    if (typeof direct.elicitInput === "function") {
      await (direct.elicitInput as (p: typeof payload) => Promise<unknown>)(
        payload,
      );
      return;
    }
    const nested = (direct.server ?? {}) as Record<string, unknown>;
    if (typeof nested.elicitInput === "function") {
      await (nested.elicitInput as (p: typeof payload) => Promise<unknown>)(
        payload,
      );
      return;
    }
  } catch (err) {
    // Don't fail the tool call if the client doesn't support elicitations yet
    console.warn("Failed to elicit input (ack)", err);
  }
}

/**
 * Register an AG-UI agent as an MCP tool on an existing server.
 *
 * This works with both `mcp-handler` style servers (that expose `server.tool()` and
 * an underlying `.server.elicitInput()`), and raw `@modelcontextprotocol/sdk` servers
 * by returning a Tool spec and a handler you can wire up yourself.
 */
export function registerAgentTool(
  server: McpLikeServer,
  agentSpec: AgentSpec,
  agent: AbstractAgent,
): {
  name: string;
  inputSchema: JSONSchema7;
  handler: (
    input: MCPToolInput,
  ) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
} {
  let name = "run_agent";
  if (agentSpec.toolName) {
    name = agentSpec.toolName;
  } else if (agentSpec.name) {
    name = toToolSafeName(agentSpec.name);
  }
  validateToolName(name);

  const inputSchema = buildToolInputSchema(agentSpec.inputSchema);
  const description = agentSpec.description ?? agentSpec.name ?? "Run agent";

  const handler = async (
    input: MCPToolInput,
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> => {
    try {
      const { params, agent: agentOpts } = input;

      const subscriber: AgentSubscriber = {
        onEvent: async (evt) => {
          // Forward every AG-UI event as an elicitation
          await tryElicitAck(server, `ag-ui:${JSON.stringify(evt)}`);
        },
      };

      // Assemble arguments for the agent. We intentionally keep this generic and pass through
      // both tool-specific `params` and any `agent` runtime options like tools/headers.
      const runArgs: Record<string, unknown> = {};
      if (agentSpec.staticParams)
        Object.assign(runArgs, agentSpec.staticParams);
      Object.assign(runArgs, params);
      if (typeof agentOpts !== "undefined")
        Object.assign(runArgs, { agent: agentOpts });

      // Most AG-UI agents support `runAgent(parameters, subscriber)` and return a result object.
      // We don't rely on a specific shape; return the full JSON for maximum fidelity.
      const runnable = agent as unknown as {
        runAgent?: (
          a: Record<string, unknown>,
          s: AgentSubscriber,
        ) => Promise<unknown>;
      };
      const result = runnable.runAgent
        ? await runnable.runAgent(runArgs, subscriber)
        : undefined;

      // Prefer a compact text output if present; otherwise JSON-stringify the result
      const text =
        typeof result === "string" ? result : JSON.stringify(result ?? {});
      return { content: [{ type: "text", text }] };
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      return { content: [{ type: "text", text }], isError: true };
    }
  };

  // If the server exposes a convenient `tool()` API (e.g., via mcp-handler), register directly.
  if (typeof (server as Record<string, unknown>).tool === "function") {
    const toolFn = (server as Record<string, unknown>).tool as (
      n: string,
      d: string,
      s: JSONSchema7 | Record<string, unknown>,
      h: Record<string, unknown>,
      cb: (i: MCPToolInput) => Promise<unknown>,
    ) => void;
    toolFn(
      name,
      description,
      inputSchema,
      {},
      async ({ params, agent: agentOpts }: MCPToolInput) => {
        return await handler({ params, agent: agentOpts });
      },
    );
  }

  return { name, inputSchema, handler };
}
