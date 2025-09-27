import type { AgentSpec, MCPToolInput, RegisteredAgentTool } from "./types.js";
import {
  ACK_REQUESTED_SCHEMA,
  buildToolInputSchema,
  toToolSafeName,
  validateToolName,
  hashConfig,
} from "./util.js";
import type { AbstractAgent, RunAgentParameters } from "@ag-ui/client";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { ElicitRequest } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Fire-and-forget; log but don't throw on elicitation errors. */
async function tryElicitAck(
  server: Server | McpServer,
  message: string,
): Promise<void> {
  const payload = { message, requestedSchema: ACK_REQUESTED_SCHEMA } as const;
  const core: Server = server instanceof McpServer ? server.server : server;
  // Detach to avoid backpressure on the event path
  void core.elicitInput(payload as ElicitRequest["params"]).catch(() => {});
}

/**
 * Register an AG-UI agent as an MCP tool on an existing server.
 *
 * This works with both `mcp-handler` style servers (that expose `server.tool()` and
 * an underlying `.server.elicitInput()`), and raw `@modelcontextprotocol/sdk` servers
 * by returning a Tool spec and a handler you can wire up yourself.
 */
export function registerAgentTool(
  server: Server | McpServer,
  agentSpec: AgentSpec,
  agent: AbstractAgent,
): RegisteredAgentTool {
  const hash =
    !agentSpec.toolName && !agentSpec.name
      ? hashConfig({
          inputSchema: agentSpec.inputSchema,
          staticParams: agentSpec.staticParams,
        })
      : undefined;
  const name =
    agentSpec.toolName ??
    (agentSpec.name ? toToolSafeName(agentSpec.name) : `run_agent_${hash}`);
  validateToolName(name);

  const inputSchema = buildToolInputSchema(agentSpec.inputSchema);
  // Description may be used by upstream registration APIs; kept here for potential callers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const description = agentSpec.description ?? agentSpec.name ?? "Run agent";

  const handler = async (
    input: MCPToolInput,
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> => {
    try {
      const { params, agent: agentOpts } = input;

      const subscriber = {
        onEvent: async (evt: unknown) => {
          // Forward every AG-UI event as an elicitation (non-blocking)
          const text = `ag-ui:${JSON.stringify(evt)}`;
          await tryElicitAck(server, text);
        },
      };

      // Use the typed RunAgentParameters; pass tool-specific params via forwardedProps
      const runArgs: RunAgentParameters = {
        ...(agentOpts ?? {}),
        forwardedProps: {
          ...(agentOpts?.forwardedProps ?? {}),
          params: { ...(agentSpec.staticParams ?? {}), ...params },
        },
      };

      type SubscriberParam = Parameters<AbstractAgent["runAgent"]>[1];
      const result = await agent.runAgent(
        runArgs,
        subscriber as SubscriberParam,
      );

      // Prefer a compact text output if present; otherwise JSON-stringify the whole result
      const maybe = (result as { result?: unknown }).result;
      const payload = typeof maybe === "undefined" ? result : maybe;
      const text =
        typeof payload === "string" ? payload : JSON.stringify(payload ?? {});
      return { content: [{ type: "text", text }] };
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      return { content: [{ type: "text", text }], isError: true };
    }
  };

  return { name, inputSchema, handler };
}
