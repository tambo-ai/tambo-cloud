"use client";

import { fetchUserProjects } from "@/app/(authed)/utils/project-utils";
import { TamboTool } from "@tambo-ai/react";
import { fetchProjectsSchema } from "./tools";

export const TamboRegisteredComponents = [
  // {
  //   name: "ProjectTable",
  //   description:
  //     "A component for displaying a table of projects. Expects props conforming to ProjectTableProps.",
  //   component: ProjectTable,
  //   propsSchema: ProjectTableProps,
  // },
  // {
  //   name: "ProjectInfo",
  //   description:
  //     "A component for displaying project information. Expects props conforming to ProjectInfoProps.",
  //   component: ProjectInfo,
  //   propsSchema: ProjectInfoProps,
  // },
  // {
  //   name: "APIKeyList",
  //   description:
  //     "A component for displaying a list of API keys. Expects props conforming to APIKeyListProps. Always use fetchApiKeys tool to get the API keys. Always call AuthCheck tool before generating this component.",
  //   component: APIKeyList,
  //   propsSchema: APIKeyListProps,
  // },
  // {
  //   name: "ProviderKeySection",
  //   description:
  //     "A component for configuring LLM providers and API keys. Expects props conforming to ProviderKeySectionProps. Use fetchLlmConfig, fetchLlmSettings, and fetchProviderApiKeys tools to get the configuration data.",
  //   component: ProviderKeySection,
  //   propsSchema: ProviderKeySectionProps,
  // },
  // {
  //   name: "CustomInstructionsEditor",
  //   description:
  //     "A component for editing custom instructions for a project. Expects props conforming to CustomInstructionsEditorProps.",
  //   component: CustomInstructionsEditor,
  //   propsSchema: CustomInstructionsEditorProps,
  // },
  // {
  //   name: "AvailableMcpServers",
  //   description:
  //     "A component for displaying a list of available MCP servers. Expects props conforming to AvailableMcpServersProps. Always call AuthCheck tool before calling this tool.",
  //   component: AvailableMcpServers,
  //   propsSchema: AvailableMcpServersProps,
  // },
  // {
  //   name: "AvailableTools",
  //   description:
  //     "A component for displaying and managing available tools/apps for a project. Expects props conforming to AvailableToolsPropsSchema. Use listAvailableApps tool to get the list of tools.",
  //   component: AvailableTools,
  //   propsSchema: AvailableToolsProps,
  // },
];

export const TamboRegisteredTools: TamboTool[] = [
  {
    name: "fetchUserProjects",
    description: "Fetches the current user's projects.",
    toolSchema: fetchProjectsSchema,
    tool: fetchUserProjects,
  },
  // {
  //   name: "fetchApiKeys",
  //   description:
  //     "Fetches API keys for a given project ID. Expects a project ID as input. Always call AuthCheck tool before calling this tool.",
  //   toolSchema: fetchApiKeysSchema,
  //   tool: fetchApiKeys,
  // },
  // {
  //   name: "fetchProject",
  //   description:
  //     "Fetches detailed information for a specific project by ID. Expects a project ID as input.",
  //   toolSchema: fetchProjectSchema,
  //   tool: fetchProject,
  // },
  // {
  //   name: "updateProjectName",
  //   description:
  //     "Updates the name of a specific project. Expects a project ID and new name as input.",
  //   toolSchema: updateProjectNameSchema,
  //   tool: updateProjectNameTool,
  // },
  // {
  //   name: "fetchCustomInstructions",
  //   description:
  //     "Fetches custom instructions for a specific project. Expects a project ID as input.",
  //   toolSchema: fetchCustomInstructionsSchema,
  //   tool: fetchCustomInstructions,
  // },
  // {
  //   name: "updateCustomInstructions",
  //   description:
  //     "Updates custom instructions for a specific project. Expects a project ID and new custom instructions text as input.",
  //   toolSchema: updateCustomInstructionsSchema,
  //   tool: updateCustomInstructions,
  // },
  // {
  //   name: "createProject",
  //   description:
  //     "Creates a new project with a simple name. Expects a name for the project as input.",
  //   toolSchema: createNewProjectSchema,
  //   tool: createNewProject,
  // },
  // {
  //   name: "createProjectWithCustomInstructions",
  //   description:
  //     "Creates a new project with custom instructions. Expects a name and custom instructions text as input.",
  //   toolSchema: createProjectWithInstructionsSchema,
  //   tool: createProjectWithInstructions,
  // },
  // {
  //   name: "deleteProject",
  //   description:
  //     "Deletes a project by ID. Expects a project ID as input. This action cannot be undone.",
  //   toolSchema: deleteProjectSchema,
  //   tool: deleteProject,
  // },
  // {
  //   name: "getCurrentUser",
  //   description:
  //     "Fetches details of the currently authenticated user. Useful for personalization and access control checks.",
  //   toolSchema: getCurrentUserSchema,
  //   tool: getCurrentUser,
  // },
  // {
  //   name: "generateApiKey",
  //   description:
  //     "Generates a new API key for a given project ID. Expects a project ID and a name for the API key as input.",
  //   toolSchema: generateApiKeySchema,
  //   tool: generateApiKey,
  // },
  // {
  //   name: "deleteApiKey",
  //   description:
  //     "Deletes an API key for a given project ID and API key ID. Expects a project ID and API key ID as input.",
  //   toolSchema: deleteApiKeySchema,
  //   tool: deleteApiKey,
  // },
  // {
  //   name: "checkUserLoginStatus",
  //   description:
  //     "Checks if the current user is authenticated. Returns the user's ID and email if authenticated, or null if not. Always use this tool before any other tools that require authentication.",
  //   toolSchema: checkUserLoginStatusSchema,
  //   tool: checkUserLoginStatus,
  // },
  // {
  //   name: "fetchLlmConfig",
  //   description:
  //     "Fetches available LLM provider configuration options. Use this to get the list of supported LLM providers and their models.",
  //   toolSchema: fetchLlmConfigSchema,
  //   tool: fetchLlmConfig,
  // },
  // {
  //   name: "fetchLlmSettings",
  //   description:
  //     "Fetches the current LLM settings for a specific project. Expects a project ID as input.",
  //   toolSchema: fetchLlmSettingsSchema,
  //   tool: fetchLlmSettings,
  // },
  // {
  //   name: "fetchProviderApiKeys",
  //   description:
  //     "Fetches stored LLM provider API keys for a specific project. Expects a project ID as input.",
  //   toolSchema: fetchProviderApiKeysSchema,
  //   tool: fetchProviderApiKeys,
  // },
  // {
  //   name: "updateLlmSettings",
  //   description:
  //     "Updates LLM configuration settings for a project. Expects a project ID and settings object containing provider name, model name, and other configuration options.",
  //   toolSchema: updateLlmSettingsSchema,
  //   tool: updateLlmSettings,
  // },
  // {
  //   name: "updateProviderKey",
  //   description:
  //     "Adds or updates an LLM provider API key for a project. Expects a project ID, provider name, and optionally the API key (undefined removes the key).",
  //   toolSchema: updateProviderKeySchema,
  //   tool: updateProviderKey,
  // },
  // {
  //   name: "fetchMcpServers",
  //   description:
  //     "Fetches MCP servers for a specific project. Expects a project ID as input.",
  //   toolSchema: fetchMcpServersSchema,
  //   tool: fetchMcpServers,
  // },
  // {
  //   name: "addMcpServer",
  //   description:
  //     "Adds a new MCP server to a project. Expects project ID, server URL, custom headers, and MCPTransport type as input.",
  //   toolSchema: addNewMcpServerSchema,
  //   tool: addNewMcpServer,
  // },
  // {
  //   name: "updateMcpServer",
  //   description:
  //     "Updates an existing MCP server. Expects project ID, server ID, updated URL, custom headers, and MCPTransport type as input.",
  //   toolSchema: updateExistingMcpServerSchema,
  //   tool: updateExistingMcpServer,
  // },
  // {
  //   name: "deleteMcpServer",
  //   description:
  //     "Deletes an MCP server. Expects project ID and server ID as input.",
  //   toolSchema: removeMcpServerSchema,
  //   tool: removeMcpServer,
  // },
  // {
  //   name: "authorizeMcpServer",
  //   description:
  //     "Initiates authorization for an MCP server. Expects context key (or null) and tool provider ID (server ID) as input.",
  //   toolSchema: authorizeMcpServerSchema,
  //   tool: authorizeMcpServerTool,
  // },
  // {
  //   name: "inspectMcpServer",
  //   description:
  //     "Inspects an MCP server to get available tools. Expects project ID and server ID as input.",
  //   toolSchema: inspectMcpServerSchema,
  //   tool: inspectMcpServerTool,
  // },
  // {
  //   name: "listAvailableApps",
  //   description:
  //     "Lists available apps/tools for a project. Expects project ID as input.",
  //   toolSchema: listAvailableAppsSchema,
  //   tool: listAvailableAppsTool,
  // },
  // {
  //   name: "enableApp",
  //   description:
  //     "Enables an app/tool for a project. Expects project ID and app ID as input.",
  //   toolSchema: enableAppSchema,
  //   tool: enableAppTool,
  // },
  // {
  //   name: "disableApp",
  //   description:
  //     "Disables an app/tool for a project. Expects project ID and app ID as input.",
  //   toolSchema: disableAppSchema,
  //   tool: disableAppTool,
  // },
  // {
  //   name: "getComposioAuth",
  //   description:
  //     "Gets authentication details for a Composio tool. Expects project ID, app ID, and optional context key as input.",
  //   toolSchema: getComposioAuthSchema,
  //   tool: getComposioAuthTool,
  // },
  // {
  //   name: "updateComposioAuth",
  //   description:
  //     "Updates authentication for a Composio tool. Expects project ID, app ID, context key, authentication mode, and authentication field values as input.",
  //   toolSchema: updateComposioAuthSchema,
  //   tool: updateComposioAuthTool,
  // },
  // {
  //   name: "checkComposioConnectedAccountStatus",
  //   description:
  //     "Checks the status of a Composio connected account. Expects project ID, tool provider ID, and context key as input.",
  //   toolSchema: checkComposioConnectedAccountStatusSchema,
  //   tool: checkComposioConnectedAccountStatusTool,
  // },
];
