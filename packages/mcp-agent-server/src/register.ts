import type { AgentSpec, MCPToolInput, RegisteredAgentTool } from "./types.js";
import {
  buildToolInputSchema,
  toToolSafeName,
  validateToolName,
  hashConfig,
} from "./util.js";
import type { AbstractAgent, RunAgentParameters } from "@ag-ui/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Fire-and-forget; log but don't throw on elicitation errors. */
async function tryElicitAck(server: McpServer, message: string): Promise<void> {
  // Keep behavior predictable for now; await the client's response.
  await server.server.elicitInput({
    message,
    // Minimal, empty object schema so clients can "accept" without fields
    requestedSchema: { type: "object", properties: {} },
  });
}

/**
 * Register an AG-UI agent as an MCP tool on an McpServer.
 *
 * Requires an instance of `McpServer` (not a raw `@modelcontextprotocol/sdk` Server).
 * Returns a tool spec and a handler you can wire up yourself.
 */
export function registerAgentTool(
  server: McpServer,
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

      type SubscriberParam = Parameters<AbstractAgent["runAgent"]>[1];
      const subscriber: SubscriberParam = {
        onEvent: async ({ event }) => {
          // Forward AG-UI events as elicitations; serialize plainly for now
          const text = `ag-ui:${JSON.stringify(event)}`;
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

      const result = await agent.runAgent(runArgs, subscriber);

      // Agent returns a RunAgentResult; use its `result` field directly
      const payload = result.result;
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
