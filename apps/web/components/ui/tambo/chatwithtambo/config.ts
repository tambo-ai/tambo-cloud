"use client";

import {
  addMcpServer,
  authorizeMcpServer,
  checkComposioConnectedAccountStatus,
  createProject,
  deleteMcpServer,
  deleteProjectApiKey,
  fetchAllProjects,
  fetchCurrentUser,
  fetchProjectApiKeys,
  fetchProjectById,
  fetchProjectMcpServers,
  generateProjectApiKey,
  getMcpServerTools,
  removeProject,
  updateMcpServer,
  updateProject,
  updateProjectLlmSettings,
} from "@/app/(authed)/utils/project-utils";
import { TamboTool } from "@tambo-ai/react";
import {
  addMcpServerSchema,
  authorizeMcpServerSchema,
  checkComposioConnectedAccountStatusSchema,
  createProjectSchema,
  deleteMcpServerSchema,
  deleteProjectApiKeySchema,
  fetchAllProjectsSchema,
  fetchCurrentUserSchema,
  fetchProjectApiKeysSchema,
  fetchProjectByIdSchema,
  fetchProjectMcpServersSchema,
  generateProjectApiKeySchema,
  getMcpServerToolsSchema,
  removeProjectSchema,
  updateMcpServerSchema,
  updateProjectLlmSettingsSchema,
  updateProjectSchema,
} from "./tools";
import {
  ProjectTable,
  ProjectTableProps,
} from "@/components/dashboard-components/project-table";
import {
  ProjectInfo,
  ProjectInfoProps,
} from "@/components/dashboard-components/project-details/project-info";
import {
  APIKeyList,
  APIKeyListProps,
} from "@/components/dashboard-components/project-details/api-key-list";
import {
  ProviderKeySection,
  ProviderKeySectionProps,
} from "@/components/dashboard-components/project-details/provider-key-section";
import {
  CustomInstructionsEditor,
  CustomInstructionsEditorProps,
} from "@/components/dashboard-components/project-details/custom-instructions-editor";
import {
  AvailableMcpServers,
  AvailableMcpServersProps,
} from "@/components/dashboard-components/project-details/available-mcp-servers";

export const TamboRegisteredComponents = [
  {
    name: "ProjectTable",
    description:
      "A component for displaying a table of projects. Expects props conforming to ProjectTableProps.",
    component: ProjectTable,
    propsSchema: ProjectTableProps,
  },
  {
    name: "ProjectInfo",
    description:
      "A component for displaying project information. Expects props conforming to ProjectInfoProps.",
    component: ProjectInfo,
    propsSchema: ProjectInfoProps,
  },
  {
    name: "APIKeyList",
    description:
      "A component for displaying a list of API keys. Expects props conforming to APIKeyListProps.",
    component: APIKeyList,
    propsSchema: APIKeyListProps,
  },
  {
    name: "ProviderKeySection",
    description:
      "A component for configuring LLM providers and API keys. Expects props conforming to ProviderKeySectionProps.",
    component: ProviderKeySection,
    propsSchema: ProviderKeySectionProps,
  },
  {
    name: "CustomInstructionsEditor",
    description:
      "A component for editing custom instructions for a project. Expects props conforming to CustomInstructionsEditorProps.",
    component: CustomInstructionsEditor,
    propsSchema: CustomInstructionsEditorProps,
  },
  {
    name: "AvailableMcpServers",
    description:
      "A component for displaying a list of available MCP servers. Expects props conforming to AvailableMcpServersProps.",
    component: AvailableMcpServers,
    propsSchema: AvailableMcpServersProps,
  },
];

export const TamboRegisteredTools: TamboTool[] = [
  {
    name: "fetchCurrentUser",
    description:
      "Fetches the current user. If the user is not logged in, return a link that leads to the login page at /login",
    toolSchema: fetchCurrentUserSchema,
    tool: fetchCurrentUser,
  },
  {
    name: "fetchAllProjects",
    description: "Fetches all projects for the current user.",
    toolSchema: fetchAllProjectsSchema,
    tool: fetchAllProjects,
  },
  {
    name: "fetchProjectById",
    description: "Fetches a specific project by ID.",
    toolSchema: fetchProjectByIdSchema,
    tool: fetchProjectById,
  },
  {
    name: "updateProject",
    description: "Updates a project.",
    toolSchema: updateProjectSchema,
    tool: updateProject,
  },
  {
    name: "createProject",
    description: "Creates a new project.",
    toolSchema: createProjectSchema,
    tool: createProject,
  },
  {
    name: "removeProject",
    description: "Removes a project.",
    toolSchema: removeProjectSchema,
    tool: removeProject,
  },
  {
    name: "fetchProjectApiKeys",
    description: "Fetches API keys for a project.",
    toolSchema: fetchProjectApiKeysSchema,
    tool: fetchProjectApiKeys,
  },
  {
    name: "generateProjectApiKey",
    description: "Generates a new API key for a project.",
    toolSchema: generateProjectApiKeySchema,
    tool: generateProjectApiKey,
  },
  {
    name: "deleteProjectApiKey",
    description: "Deletes an API key for a project.",
    toolSchema: deleteProjectApiKeySchema,
    tool: deleteProjectApiKey,
  },
  {
    name: "updateProjectLlmSettings",
    description:
      "Updates LLM configuration settings for a project. Always show ProviderKeySection component after calling this tool.",
    toolSchema: updateProjectLlmSettingsSchema,
    tool: updateProjectLlmSettings,
  },
  {
    name: "fetchProjectMcpServers",
    description: "Fetches MCP servers for a project.",
    toolSchema: fetchProjectMcpServersSchema,
    tool: fetchProjectMcpServers,
  },
  {
    name: "addMcpServer",
    description: "Adds a new MCP server to a project.",
    toolSchema: addMcpServerSchema,
    tool: addMcpServer,
  },
  {
    name: "updateMcpServer",
    description: "Updates an existing MCP server for a project.",
    toolSchema: updateMcpServerSchema,
    tool: updateMcpServer,
  },
  {
    name: "deleteMcpServer",
    description: "Deletes an MCP server for a project.",
    toolSchema: deleteMcpServerSchema,
    tool: deleteMcpServer,
  },
  {
    name: "authorizeMcpServer",
    description: "Authorizes an MCP server for a project.",
    toolSchema: authorizeMcpServerSchema,
    tool: authorizeMcpServer,
  },
  {
    name: "getMcpServerTools",
    description: "Gets the tools for an MCP server for a project.",
    toolSchema: getMcpServerToolsSchema,
    tool: getMcpServerTools,
  },
  // {
  //   name: "listAvailableApps",
  //   description: "Lists available apps for a project.",
  //   toolSchema: listAvailableAppsSchema,
  //   tool: listAvailableApps,
  // },
  // {
  //   name: "enableApp",
  //   description: "Enables an app for a project.",
  //   toolSchema: enableAppSchema,
  //   tool: enableApp,
  // },
  // {
  //   name: "disableApp",
  //   description: "Disables an app for a project.",
  //   toolSchema: disableAppSchema,
  //   tool: disableApp,
  // },
  // {
  //   name: "getComposioAuth",
  //   description: "Gets authentication details for a Composio tool.",
  //   toolSchema: getComposioAuthSchema,
  //   tool: getComposioAuth,
  // },
  // {
  //   name: "updateComposioAuth",
  //   description: "Updates authentication details for a Composio tool.",
  //   toolSchema: updateComposioAuthSchema,
  //   tool: updateComposioAuth,
  // },
  {
    name: "checkComposioConnectedAccountStatus",
    description: "Checks the status of a Composio connected account.",
    toolSchema: checkComposioConnectedAccountStatusSchema,
    tool: checkComposioConnectedAccountStatus,
  },
];
