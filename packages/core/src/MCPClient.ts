import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { JSONSchema7 } from "json-schema";

export enum MCPTransport {
  SSE = "sse",
  HTTP = "http",
}
/**
 * A client for interacting with MCP (Model Context Protocol) servers.
 * Provides a simple interface for listing and calling tools exposed by the server.
 *
 * @example
 * ```typescript
 * const mcp = await MCPClient.create('https://api.example.com/mcp');
 * const tools = await mcp.listTools();
 * const result = await mcp.callTool('toolName', { arg1: 'value1' });
 * ```
 */
export class MCPClient {
  private client: Client;
  private transport: SSEClientTransport | StreamableHTTPClientTransport;

  /**
   * Private constructor to enforce using the static create method.
   * @param endpoint - The URL of the MCP server to connect to
   * @param headers - Optional custom headers to include in requests
   */
  private constructor(
    endpoint: string,
    transport: MCPTransport,
    headers?: Record<string, string>,
    authProvider?: OAuthClientProvider,
  ) {
    if (transport === MCPTransport.SSE) {
      this.transport = new SSEClientTransport(new URL(endpoint), {
        authProvider,
        requestInit: { headers },
      });
    } else {
      this.transport = new StreamableHTTPClientTransport(new URL(endpoint), {
        authProvider,
        requestInit: { headers },
      });
    }
    this.client = new Client({
      name: "tambo-mcp-client",
      version: "1.0.0",
    });
  }

  /**
   * Creates and initializes a new MCPClient instance.
   * This is the recommended way to create an MCPClient as it handles both
   * instantiation and connection setup.
   *
   * @param endpoint - The URL of the MCP server to connect to
   * @param headers - Optional custom headers to include in requests
   * @returns A connected MCPClient instance ready for use
   * @throws Will throw an error if connection fails
   */
  static async create(
    endpoint: string,
    transport: MCPTransport = MCPTransport.HTTP,
    headers?: Record<string, string>,
    authProvider?: OAuthClientProvider,
  ): Promise<MCPClient> {
    const mcpClient = new MCPClient(endpoint, transport, headers, authProvider);
    await mcpClient.client.connect(mcpClient.transport);
    return mcpClient;
  }

  /**
   * Retrieves a complete list of all available tools from the MCP server.
   * Handles pagination automatically by following cursors until all tools are fetched.
   *
   * @returns A complete list of all available tools and their descriptions
   * @throws Will throw an error if any server request fails during pagination
   */
  async listTools(): Promise<MCPToolSpec[]> {
    const allTools: MCPToolSpec[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    while (hasMore) {
      const response = await this.client.listTools({ cursor }, {});
      allTools.push(
        ...response.tools.map((tool): MCPToolSpec => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (tool.inputSchema.type !== "object") {
            throw new Error(
              `Input schema for tool ${tool.name} is not an object`,
            );
          }

          return {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema as JSONSchema7,
          };
        }),
      );

      if (response.nextCursor) {
        cursor = response.nextCursor;
      } else {
        hasMore = false;
      }
    }

    return allTools;
  }

  /**
   * Calls a specific tool on the MCP server with the provided arguments.
   *
   * @param name - The name of the tool to call
   * @param args - Arguments to pass to the tool, must match the tool's expected schema
   * @returns The result from the tool execution
   * @throws Will throw an error if the tool call fails or if arguments are invalid
   */
  async callTool(name: string, args: Record<string, unknown>) {
    const result = await this.client.callTool({
      name,
      arguments: args,
    });
    return result;
  }
}

// Example usage:
/*
const mcp = await MCPClient.create('https://api.example.com/mcp', MCPTransport.HTTP);
const tools = await mcp.listTools();
const result = await mcp.callTool('toolName', { arg1: 'value1' });
*/

export interface MCPToolSpec {
  name: string;
  description?: string;
  inputSchema?: JSONSchema7;
}
