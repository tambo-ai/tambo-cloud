import { type Tool } from "@modelcontextprotocol/sdk/types.js";

type ToolResponse = {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
};

// Generic tool handler type
export type ToolHandler<A = any> = (args: A) => Promise<ToolResponse>;

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
