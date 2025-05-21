"use client";

import {
  APIKeyList,
  APIKeyListProps,
} from "@/components/dashboard-components/project-details/api-key-list";
import {
  ProjectInfo,
  ProjectInfoProps,
} from "@/components/dashboard-components/project-details/project-info";
import {
  ProviderKeySection,
  ProviderKeySectionProps,
} from "@/components/dashboard-components/project-details/provider-key-section";
import {
  ProjectTable,
  ProjectTableProps,
} from "@/components/dashboard-components/project-table";
import { TamboTool } from "@tambo-ai/react";
import {
  checkUserLoginStatus,
  checkUserLoginStatusSchema,
  deleteApiKey,
  deleteApiKeySchema,
  fetchApiKeys,
  fetchApiKeysSchema,
  fetchLlmConfig,
  fetchLlmConfigSchema,
  fetchLlmSettings,
  fetchLlmSettingsSchema,
  fetchProjectInfoSchema,
  fetchProjects,
  fetchProjectsSchema,
  fetchProviderApiKeys,
  fetchProviderApiKeysSchema,
  generateApiKey,
  generateApiKeySchema,
  updateLlmSettings,
  updateLlmSettingsSchema,
  updateProviderKey,
  updateProviderKeySchema,
} from "./tools";

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
      "A component for displaying a list of API keys. Expects props conforming to APIKeyListProps. Always use fetchApiKeys tool to get the API keys.",
    component: APIKeyList,
    propsSchema: APIKeyListProps,
  },
  {
    name: "ProviderKeySection",
    description:
      "A component for configuring LLM providers and API keys. Expects props conforming to ProviderKeySectionProps. Use fetchLlmConfig, fetchLlmSettings, and fetchProviderApiKeys tools to get the configuration data.",
    component: ProviderKeySection,
    propsSchema: ProviderKeySectionProps,
  },
];

export const TamboRegisteredTools: TamboTool[] = [
  {
    name: "fetchAndDisplayUserProjects",
    description:
      "Fetches the current user's projects from the backend and provides the data structured for the ProjectTable component. The ProjectTable will then be used to display these projects.",
    toolSchema: fetchProjectsSchema,
    tool: fetchProjects,
  },
  {
    name: "fetchProjectInfo",
    description:
      "Fetches project information for a given project ID. Expects a project ID as input.",
    toolSchema: fetchProjectInfoSchema,
    tool: fetchProjects,
  },
  {
    name: "fetchApiKeys",
    description:
      "Fetches API keys for a given project ID. Expects a project ID as input.",
    toolSchema: fetchApiKeysSchema,
    tool: fetchApiKeys,
  },
  {
    name: "generateApiKey",
    description:
      "Generates a new API key for a given project ID. Expects a project ID and a name for the API key as input.",
    toolSchema: generateApiKeySchema,
    tool: generateApiKey,
  },
  {
    name: "deleteApiKey",
    description:
      "Deletes an API key for a given project ID and API key ID. Expects a project ID and API key ID as input.",
    toolSchema: deleteApiKeySchema,
    tool: deleteApiKey,
  },
  {
    name: "checkUserLoginStatus",
    description:
      "Checks if the current user is authenticated. Returns the user's ID and email if authenticated, or null if not. Always use this tool before any other tools that require authentication.",
    toolSchema: checkUserLoginStatusSchema,
    tool: checkUserLoginStatus,
  },
  {
    name: "fetchLlmConfig",
    description:
      "Fetches available LLM provider configuration options. Use this to get the list of supported LLM providers and their models.",
    toolSchema: fetchLlmConfigSchema,
    tool: fetchLlmConfig,
  },
  {
    name: "fetchLlmSettings",
    description:
      "Fetches the current LLM settings for a specific project. Expects a project ID as input.",
    toolSchema: fetchLlmSettingsSchema,
    tool: fetchLlmSettings,
  },
  {
    name: "fetchProviderApiKeys",
    description:
      "Fetches stored LLM provider API keys for a specific project. Expects a project ID as input.",
    toolSchema: fetchProviderApiKeysSchema,
    tool: fetchProviderApiKeys,
  },
  {
    name: "updateLlmSettings",
    description:
      "Updates LLM configuration settings for a project. Expects a project ID and settings object containing provider name, model name, and other configuration options.",
    toolSchema: updateLlmSettingsSchema,
    tool: updateLlmSettings,
  },
  {
    name: "updateProviderKey",
    description:
      "Adds or updates an LLM provider API key for a project. Expects a project ID, provider name, and optionally the API key (undefined removes the key).",
    toolSchema: updateProviderKeySchema,
    tool: updateProviderKey,
  },
];
