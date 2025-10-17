import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { TAMBO_MCP_ACCESS_KEY_CLAIM } from "@tambo-ai-cloud/core";
import { getDb, HydraDb } from "@tambo-ai-cloud/db";
import { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getThreadMCPClients } from "src/common/systemTools";
import { extractAndVerifyMcpAccessToken } from "../common/utils/oauth";
import { registerPromptHandlers } from "./prompts";

export async function createMcpServer(
  db: HydraDb,
  projectId: string,
  threadId: string,
) {
  const server = new McpServer(
    {
      name: "tambo-service",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
      // Enable notification debouncing for specific methods
      debouncedNotificationMethods: [
        "notifications/tools/list_changed",
        "notifications/resources/list_changed",
        "notifications/prompts/list_changed",
      ],
    },
  );

  const mcpHandlers = {};
  const mcpClients = await getThreadMCPClients(
    db,
    projectId,
    threadId,
    mcpHandlers,
  );
  await registerPromptHandlers(server, mcpClients);
  return server;
}

const handler = async (
  req: Request,
  res: Response,
  projectId: string,
  threadId: string,
) => {
  const db = getDb(process.env.DATABASE_URL!);
  // we create the "server" on the fly, it only lives for the duration of the request,
  // though the request could stay open for a long time if there is streaming/etc.
  const server = await createMcpServer(db, projectId, threadId);
  const transport = new StreamableHTTPServerTransport({
    // we don't actually use the session id, but it's required for the transport
    sessionIdGenerator: () => randomUUID(),
  });
  await server.connect(transport);
  try {
    await transport.handleRequest(req, res, req.body);
  } finally {
    await server.close();
    await transport.close();
  }
};

/**
 * Register an express route that handles MCP requests for a given path
 * @param expressApp - The express application to register the route on
 * @param path - The path to register the route on
 * @param server - The MCP server to handle the requests
 */
export function registerHandler(expressApp: Express, path: string) {
  expressApp.use(path, async (req, res) => {
    const authorization = req.header("authorization");
    if (!authorization) {
      res.status(401).send("Unauthorized");
      return;
    }

    // make sure authorization is a bearer token
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      res.status(401).send("Unauthorized");
      return;
    }
    const [, bearerToken] = authorization.split(" ");
    const payload = await extractAndVerifyMcpAccessToken(
      bearerToken,
      process.env.API_KEY_SECRET!,
    );
    const { projectId, threadId } = payload[TAMBO_MCP_ACCESS_KEY_CLAIM];

    return await handler(req, res, projectId, threadId);
  });
}
