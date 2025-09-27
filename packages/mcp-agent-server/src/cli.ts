#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AbstractAgent } from "@ag-ui/client";
import { HttpAgent } from "@ag-ui/client";
import type {
  AgentYamlEntry,
  AgentsYamlConfigV1,
  MCPToolInput,
} from "./types.js";
import type { JSONSchema7 } from "json-schema";
import { registerAgentTool } from "./register.js";
import { toToolSafeName, validateToolName, hashConfig } from "./util.js";

async function loadYaml(filePath: string): Promise<AgentsYamlConfigV1> {
  const abs = path.resolve(process.cwd(), filePath);
  const raw = await fs.promises.readFile(abs, "utf8");
  return YAML.parse(raw) as AgentsYamlConfigV1;
}

async function createAgentFromConfig(
  entry: AgentYamlEntry,
): Promise<AbstractAgent> {
  const { type, url, params } = entry;
  if (!type) throw new Error("Agent 'type' is required");

  // Built-in support for simple HTTP agents that stream AG-UI events
  if (type === "http") {
    if (!url) throw new Error("HTTP agent requires 'url'");
    return new HttpAgent({ url });
  }

  // Best-effort dynamic import of @ag-ui/* integrations
  try {
    const mod = (await import(`@ag-ui/${type}`)) as Record<string, unknown>;
    // Common conventions: default export is a class, or a named *Agent class
    const ctorCandidate = (mod.default ??
      Object.values(mod).find((v) => typeof v === "function")) as unknown;
    if (typeof ctorCandidate !== "function") {
      throw new Error(`@ag-ui/${type} does not export an agent constructor`);
    }
    const Ctor = ctorCandidate as new (
      opts: Record<string, unknown>,
    ) => AbstractAgent;
    return new Ctor({ url, ...(params ?? {}) });
  } catch (err) {
    throw new Error(
      `Unsupported agent type '${type}'. Install and configure @ag-ui/${type} in this project or use type: "http". (${(err as Error).message})`,
    );
  }
}

type ToolRegistryEntry = {
  name: string;
  handler: (input: MCPToolInput) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
  inputSchema: JSONSchema7 | Record<string, unknown>;
  description?: string;
};

async function startServer(
  entries: ToolRegistryEntry[],
  server: Server,
  options: { port?: number },
) {
  const app = express();

  const tools = entries.map((e) => ({
    name: e.name,
    description: e.description,
    inputSchema: e.inputSchema,
  }));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(
    CallToolRequestSchema,
    async (req: CallToolRequest) => {
      const { name, arguments: args } = req.params;
      const entry = entries.find((t) => t.name === name);
      if (!entry) throw new Error(`Unknown tool: ${name}`);
      // The MCP SDK types the tool arguments loosely; coerce to our expected shape.
      return await entry.handler(args as unknown as MCPToolInput);
    },
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  app.post("/mcp", async (req, res) => {
    await transport.handleRequest(req, res);
  });
  await server.connect(transport);

  const desired =
    options.port ?? (process.env.PORT ? parseInt(process.env.PORT, 10) : 3210);
  const port = await new Promise<number>((resolve) => {
    const httpServer = app.listen(desired, () => resolve(desired));
    httpServer.on("error", () => {
      const fallback = desired + 1;
      app.listen(fallback, () => resolve(fallback));
    });
  });

  console.error(`mcp-agent-server running on http://localhost:${port}/mcp`);
  if (port !== desired) {
    console.error(`Note: picked port ${port} (desired ${desired} was busy)`);
  }
}

function asToolName(entry: AgentYamlEntry): string {
  if (entry.toolName) {
    validateToolName(entry.toolName);
    return entry.toolName;
  }
  if (entry.name) return toToolSafeName(entry.name);
  // Stable, collision-resistant fallback across same-type agents
  const hash = hashConfig({
    type: entry.type,
    url: entry.url,
    params: entry.params,
    inputSchema: entry.inputSchema,
  });
  return `run_agent_${hash}`;
}

async function main() {
  const program = new Command();
  program
    .name("mcp-agent-server")
    .description(
      "Expose agents as MCP tools; forward AG-UI events as MCP elicitations.",
    )
    .option("-c, --config <file>", "YAML config file", "agents.yaml")
    .option("-p, --port <number>", "Port for HTTP transport", (v) =>
      parseInt(v, 10),
    )
    .parse(process.argv);

  const opts = program.opts<{ config: string; port?: number }>();
  const cfg = await loadYaml(opts.config);
  const agents = cfg.agents ?? [];
  if (!Array.isArray(agents) || agents.length === 0) {
    throw new Error("No agents found in YAML (expected 'agents:')");
  }

  // Create the MCP server first so our handlers can elicit input
  const mcp = new McpServer(
    {
      name: cfg.server?.name ?? "mcp-agent-server",
      version: cfg.server?.version ?? "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  const server = mcp.server;

  const registry: ToolRegistryEntry[] = [];
  for (const entry of agents) {
    const agent = await createAgentFromConfig(entry);
    const name = asToolName(entry);
    const description = entry.description ?? entry.name ?? undefined;

    const { handler, inputSchema } = registerAgentTool(
      mcp,
      {
        ...entry,
        toolName: name,
        description,
        inputSchema: entry.inputSchema,
        staticParams: entry.params,
      },
      agent,
    );

    registry.push({ name, handler, inputSchema, description });
  }

  await startServer(registry, server, { port: opts.port });
}

// Run if executed directly
main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exit(1);
});
