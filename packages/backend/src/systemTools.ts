import { MCPClient, MCPHandlers } from "@tambo-ai-cloud/core";
import OpenAI from "openai";

/** Information about an MCP tool source */
export interface McpToolSource {
  /** The MCP client for calling the tool */
  client: MCPClient;
  /** The serverKey prefix for this tool */
  serverKey: string;
}

/** Registry of available MCP tools during a request */
export interface McpToolRegistry {
  /** Schemas for all MCP tools */
  mcpToolsSchema: OpenAI.Chat.Completions.ChatCompletionTool[];
  /** A mapping of MCP tool name to MCP tool source info */
  mcpToolSources: Record<string, McpToolSource>;

  mcpHandlers: MCPHandlers;
}

/** Registry of all browser-side client tools */
export interface ClientToolRegistry {
  /** Schemas for all client tools */
  clientToolsSchema: OpenAI.Chat.Completions.ChatCompletionTool[];
}

/** Registry of all available tools during a request, including both MCP Tools and client tools */
export interface ToolRegistry extends ClientToolRegistry, McpToolRegistry {}
