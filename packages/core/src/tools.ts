import { MCPClient, MCPTransport } from "./MCPClient";

export enum ToolProviderType {
  COMPOSIO = "composio",
  MCP = "mcp",
}

export async function validateMcpServer({
  url,
  customHeaders,
  mcpTransport,
}: {
  url: string;
  customHeaders?: Record<string, string>;
  mcpTransport: MCPTransport;
}) {
  const mcpClient = await MCPClient.create(url, mcpTransport, customHeaders);
  try {
    await mcpClient.listTools();
  } catch (error) {
    console.error("Got error validating MCP server", error);
    return {
      valid: false,
      error: error as Error,
    };
  }
  return {
    valid: true,
    error: null,
  };
}
