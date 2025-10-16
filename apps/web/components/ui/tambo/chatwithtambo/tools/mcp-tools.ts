import { MCPTransport } from "@tambo-ai-cloud/core";
import { z } from "zod";
import { invalidateMcpServersCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `fetchProjectMcpServers` function.
 * Defines the argument as a project ID string.
 * The schema's return type is an object representing the details of a single MCP server (as per this schema definition).
 */
export const fetchProjectMcpServersSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch MCP servers for"))
  .returns(
    z.object({
      id: z.string(),
      url: z.string().nullable(),
      customHeaders: z.record(z.string(), z.string()).nullable(),
      mcpRequiresAuth: z.boolean(),
      mcpIsAuthed: z.boolean(),
    }),
  );

/**
 * Zod schema for the `addMcpServer` function.
 * Defines the argument as an object containing parameters for adding an MCP server (project ID, URL, custom headers, MCP transport)
 * and the return type as an object representing the added MCP server's details.
 */
export const addMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      url: z.string().describe("The URL of the MCP server"),
      customHeaders: z
        .record(z.string(), z.string())
        .describe("Custom headers for the MCP server"),
      mcpTransport: z
        .nativeEnum(MCPTransport)
        .describe("Transport mechanism for MCP communication, default is SSE"),
    }),
  )
  .returns(
    z.object({
      id: z.string(),
      url: z.string(),
      customHeaders: z.record(z.string(), z.string()),
      mcpTransport: z.nativeEnum(MCPTransport),
      mcpRequiresAuth: z.boolean(),
      mcpCapabilities: z.record(z.string(), z.any()).optional(),
      mcpVersion: z.record(z.string(), z.any()).optional(),
      mcpInstructions: z.string().optional(),
    }),
  );

/**
 * Zod schema for the `updateMcpServer` function.
 * Defines the argument as an object containing parameters for updating an MCP server
 */
export const updateMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to update"),
      url: z.string().describe("The URL of the MCP server"),
      customHeaders: z
        .record(z.string(), z.string())
        .describe("Custom headers for the MCP server"),
      mcpTransport: z
        .nativeEnum(MCPTransport)
        .describe("Transport mechanism for MCP communication"),
    }),
  )
  .returns(
    z.object({
      id: z.string(),
      url: z.string(),
      customHeaders: z.record(z.string(), z.string()),
      mcpTransport: z.nativeEnum(MCPTransport),
      mcpRequiresAuth: z.boolean(),
      mcpCapabilities: z.record(z.string(), z.any()).optional(),
      mcpVersion: z.record(z.string(), z.any()).optional(),
      mcpInstructions: z.string().optional(),
    }),
  );

/**
 * Zod schema for the `deleteMcpServer` function.
 * Defines the argument as an object containing the project ID and server ID,
 * and the return type as an object indicating success.
 */
export const deleteMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to delete"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
    }),
  );

/**
 * Zod schema for the `getMcpServerTools` function.
 * Defines the argument as an object containing the project ID and server ID,
 * and the return type as an object containing available tools and server information.
 */
export const getMcpServerToolsSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to inspect"),
    }),
  )
  .returns(
    z.object({
      tools: z.object({
        name: z.string(),
        description: z.string().optional(),
        inputSchema: z.any().optional(),
      }),
      serverInfo: z.object({
        version: z.record(z.string(), z.any()).optional(),
        instructions: z.string().optional(),
        capabilities: z.record(z.string(), z.any()).optional(),
      }),
    }),
  );

/**
 * Register MCP server management tools
 */
export function registerMcpTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch all MCP (Model Context Protocol) servers for a project.
   * Returns server configuration including URL, headers, and authentication status.
   * @param {string} projectId - The project ID to fetch MCP servers for
   * @returns {Object} MCP server details including ID, URL, headers, and auth status
   */
  registerTool({
    name: "fetchProjectMcpServers",
    description: "Fetches MCP servers for a project.",
    tool: async (projectId: string) => {
      return await ctx.trpcClient.tools.listMcpServers.query({ projectId });
    },
    toolSchema: fetchProjectMcpServersSchema,
  });

  /**
   * Registers a tool to add a new MCP server to a project.
   * @param {string} projectId - The project ID to add the MCP server to
   * @param {Object} server - MCP server configuration
   * @param {string} server.url - The URL of the MCP server
   * @param {Record<string, string>} server.customHeaders - Custom HTTP headers for the server
   * @param {MCPTransport} server.mcpTransport - Transport mechanism (e.g., SSE, WebSocket)
   * @returns {Object} Created MCP server details including capabilities and version info
   */
  registerTool({
    name: "addMcpServer",
    description: "Adds a new MCP server to a project.",
    tool: async (params: {
      projectId: string;
      url: string;
      customHeaders: Record<string, string>;
      mcpTransport: MCPTransport;
    }) => {
      const result = await ctx.trpcClient.tools.addMcpServer.mutate({
        projectId: params.projectId,
        url: params.url,
        customHeaders: params.customHeaders,
        mcpTransport: params.mcpTransport,
      });

      // Invalidate the mcp server cache to refresh the component
      await invalidateMcpServersCache(ctx, params.projectId);

      return result;
    },
    toolSchema: addMcpServerSchema,
  });

  /**
   * Registers a tool to update an existing MCP server.
   * @param {Object} params - Update parameters
   * @param {string} params.projectId - The project ID containing the MCP server
   * @param {string} params.serverId - The ID of the MCP server to update
   * @param {string} params.url - The new URL of the MCP server
   * @param {Record<string, string>} params.customHeaders - Custom HTTP headers for the server
   * @param {MCPTransport} params.mcpTransport - Transport mechanism
   * @returns {Object} Updated MCP server details
   */
  registerTool({
    name: "updateMcpServer",
    description: "Updates an existing MCP server for a project.",
    tool: async (params: {
      projectId: string;
      serverId: string;
      url: string;
      customHeaders: Record<string, string>;
      mcpTransport: MCPTransport;
    }) => {
      const result = await ctx.trpcClient.tools.updateMcpServer.mutate({
        projectId: params.projectId,
        serverId: params.serverId,
        url: params.url,
        customHeaders: params.customHeaders,
        mcpTransport: params.mcpTransport,
      });

      // Invalidate the mcp server cache to refresh the component
      await invalidateMcpServersCache(ctx, params.projectId);

      return result;
    },
    toolSchema: updateMcpServerSchema,
  });

  /**
   * Registers a tool to delete an MCP server from a project.
   * @param {Object} params - Deletion parameters
   * @param {string} params.projectId - The project ID containing the MCP server
   * @param {string} params.serverId - The ID of the MCP server to delete
   * @returns {Object} Success status indicating the server was deleted
   */
  registerTool({
    name: "deleteMcpServer",
    description: "Deletes an MCP server for a project.",
    tool: async (params: { projectId: string; serverId: string }) => {
      await ctx.trpcClient.tools.deleteMcpServer.mutate({
        projectId: params.projectId,
        serverId: params.serverId,
      });

      // Invalidate the mcp server cache to refresh the component
      await invalidateMcpServersCache(ctx, params.projectId);

      return { success: true };
    },
    toolSchema: deleteMcpServerSchema,
  });

  /**
   * Registers a tool to inspect and get available tools from an MCP server.
   * Returns the tools/capabilities exposed by the MCP server along with server information.
   * @param {Object} params - Inspection parameters
   * @param {string} params.projectId - The project ID containing the MCP server
   * @param {string} params.serverId - The ID of the MCP server to inspect
   * @returns {Object} Available tools and server information including capabilities and version
   */
  registerTool({
    name: "getMcpServerTools",
    description: "Gets the tools for an MCP server for a project.",
    tool: async (params: { projectId: string; serverId: string }) => {
      return await ctx.trpcClient.tools.inspectMcpServer.query({
        projectId: params.projectId,
        serverId: params.serverId,
      });
    },
    toolSchema: getMcpServerToolsSchema,
  });
}
