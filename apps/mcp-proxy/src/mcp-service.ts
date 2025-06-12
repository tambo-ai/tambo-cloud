import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Generic tool handler type
export type ToolHandler = (args: any) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

// MCP Service interface
export interface McpService {
  name: string;
  tools: Tool[];
  handlers: Record<string, ToolHandler>;
}

// MCP Service Registry
export class McpServiceRegistry {
  private services: McpService[] = [];
  private toolHandlers: Record<string, ToolHandler> = {};
  private allTools: Tool[] = [];

  // Register a service
  registerService(service: McpService): void {
    this.services.push(service);

    // Add tools to the registry
    this.allTools.push(...service.tools);

    // Add handlers to the registry
    for (const [toolName, handler] of Object.entries(service.handlers)) {
      if (toolName in this.toolHandlers) {
        throw new Error(`Tool handler '${toolName}' is already registered`);
      }
      this.toolHandlers[toolName] = handler;
    }
  }

  // Get all registered tools
  getAllTools(): Tool[] {
    return this.allTools;
  }

  // Get handler for a specific tool
  getHandler(toolName: string): ToolHandler | undefined {
    return this.toolHandlers[toolName];
  }

  // Setup MCP server with all registered services
  setupServer(server: Server): void {
    // Handle list tools request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAllTools(),
      };
    });

    // Handle call tool request
    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        const handler = this.getHandler(name);
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        return await handler(args);
      },
    );
  }

  // Get registered services info
  getServicesInfo(): Array<{
    name: string;
    toolCount: number;
    tools: string[];
  }> {
    return this.services.map((service) => ({
      name: service.name,
      toolCount: service.tools.length,
      tools: service.tools.map((tool) => tool.name),
    }));
  }
}
