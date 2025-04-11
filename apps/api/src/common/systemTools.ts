import { HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { OpenAIToolSet } from "composio-core";
import { MCPClient, MCPToolSpec } from "./MCPClient";

/** Get the tools available for the project */
export async function getSystemTools(db: HydraDatabase, projectId: string) {
  const { mcpTools, mcpToolSources } = await getMcpTools(db, projectId);

  const { composioTools, composioClient } = await getComposioTools(
    db,
    projectId,
  );

  const mcpToolNames = mcpTools.map((tool) => tool.name);
  const composioToolNames = composioTools.map((tool) => tool.name);
  // make sure there are no name conflicts
  const toolNames = [...mcpToolNames, ...composioToolNames];
  if (new Set(toolNames).size !== toolNames.length) {
    const duplicateToolNames = toolNames.filter(
      (toolName, index) => toolNames.indexOf(toolName) !== index,
    );
    console.warn(
      `Tool names must be unique, found duplicates for project ${projectId}: ${duplicateToolNames.join(
        ", ",
      )}`,
    );
  }
  return {
    tools: [...mcpTools, ...composioTools],
    mcpToolSources,
    composioClient,
  };
}
async function getMcpTools(
  db: HydraDatabase,
  projectId: string,
): Promise<{
  mcpTools: MCPToolSpec[];
  mcpToolSources: Record<string, MCPClient>;
}> {
  const mcpServers = await operations.getProjectMcpServers(db, projectId);

  const mcpTools: MCPToolSpec[] = [];
  const mcpToolSources: Record<string, MCPClient> = {};
  for (const mcpServer of mcpServers) {
    if (!mcpServer.url) {
      continue;
    }
    const mcpClient = await MCPClient.create(mcpServer.url);
    const tools = await mcpClient.listTools();
    mcpTools.push(...tools);

    for (const tool of tools) {
      mcpToolSources[tool.name] = mcpClient;
    }
  }
  return { mcpTools, mcpToolSources };
}

async function getComposioTools(
  db: HydraDatabase,
  projectId: string,
): Promise<{ composioTools: MCPToolSpec[]; composioClient: OpenAIToolSet }> {
  const composioTools: MCPToolSpec[] = [];
  const composioApps = await operations.getComposioApps(db, projectId);
  const appIds = composioApps
    .map((app) => app.composioAppId)
    .filter((appId): appId is string => !!appId);
  const composioClient = new OpenAIToolSet();

  const tools = await composioClient.getTools({ apps: appIds });

  for (const tool of tools) {
    composioTools.push({
      name: tool.function.name,
      description: tool.function.description,
      inputSchema: tool.function.parameters,
    });
  }
  return { composioTools, composioClient };
}
