import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { MCPClient } from "@tambo-ai-cloud/core";

export async function registerResourceHandlers(
  server: McpServer,
  mcpClients: {
    client: MCPClient;
    serverId: string;
    serverKey: string;
    url: string;
  }[],
) {
  const results = await Promise.allSettled(
    mcpClients.map(async ({ client, serverId: _serverId, serverKey }) => {
      try {
        const listResponse = await client.client.listResources();

        let registered = 0;
        for (const resource of listResponse.resources) {
          const resourceName = serverKey
            ? `${serverKey}:${resource.name}`
            : resource.name;

          // We only support static URIs; resource templates require list/complete callbacks
          // which we can't easily proxy from remote MCP servers
          if (!resource.uri) {
            console.warn(`Resource ${resource.name} has no URI, skipping`);
            continue;
          }

          // Build the resource metadata (Omit<Resource, 'uri' | 'name'>)
          const metadata: Omit<Resource, "uri" | "name"> = {
            description: resource.description,
            mimeType: resource.mimeType,
          };

          server.registerResource(
            resourceName,
            String(resource.uri),
            metadata,
            async (uri) => {
              const readResponse = await client.client.readResource({
                uri: uri.toString(),
              });
              return readResponse;
            },
          );
          registered += 1;
        }
        return registered;
      } catch (error) {
        if (
          error instanceof McpError &&
          error.code === ErrorCode.MethodNotFound
        ) {
          // Treat as success with zero registrations when the server
          // doesn't support resources.
          return 0;
        }
        // Propagate all other errors so Promise.allSettled can classify
        // this client as a rejection and the summary pass can log it once.
        throw error;
      }
    }),
  );

  results.forEach((result, index) => {
    const { serverId, serverKey, url } = mcpClients[index];
    if (result.status === "rejected") {
      console.error(
        "Error listing resources for MCP server",
        serverId,
        url,
        result.reason,
      );
      return;
    }
    // Only log a success message when at least one resource was registered
    if (result.value > 0) {
      console.log(
        "Registered",
        result.value,
        "resources from:",
        serverId,
        "with key:",
        serverKey,
        "at:",
        url,
      );
    }
  });
}
