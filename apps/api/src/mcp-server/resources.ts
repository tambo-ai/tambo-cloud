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
  const registrations = await Promise.allSettled(
    mcpClients.map(async ({ client, serverId, serverKey }) => {
      try {
        const resourceResponse = await client.client.listResources();

        for (const resource of resourceResponse.resources) {
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
              const resourceResponse = await client.client.readResource({
                uri: uri.toString(),
              });
              return resourceResponse;
            },
          );
        }
      } catch (error) {
        if (
          error instanceof McpError &&
          error.code === ErrorCode.MethodNotFound
        ) {
          return;
        }

        console.error(
          "Error listing resources for MCP server",
          serverId,
          error,
        );
      }
    }),
  );

  for (const [index, result] of enumerate(registrations)) {
    const { serverId, serverKey, url } = mcpClients[index];
    if (result.status === "rejected") {
      console.error(
        "Error listing resources for MCP server",
        serverId,
        url,
        result.reason,
      );
    } else {
      console.log(
        "Registered resources from:",
        serverId,
        "with key:",
        serverKey,
        "at:",
        url,
      );
    }
  }
}

function enumerate<T>(iterable: Iterable<T>): Array<[number, T]> {
  const result: [number, T][] = [];
  let index = 0;
  for (const value of iterable) {
    result.push([index++, value]);
  }
  return result;
}
