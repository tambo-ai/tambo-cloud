"use client";

import {
  ProjectTable,
  ProjectTableProps,
} from "@/components/dashboard-components/project-table";
import { TamboTool } from "@tambo-ai/react";
import {
  fetchApiKeys,
  fetchApiKeysSchema,
  fetchProjectInfoSchema,
  fetchProjects,
  fetchProjectsSchema,
  generateApiKey,
  generateApiKeySchema,
  deleteApiKey,
  deleteApiKeySchema,
  checkUserLoginStatusSchema,
  checkUserLoginStatus,
} from "./tools";
import {
  ProjectInfo,
  ProjectInfoProps,
} from "@/components/dashboard-components/project-details/project-info";
import {
  APIKeyList,
  APIKeyListProps,
} from "@/components/dashboard-components/project-details/api-key-list";

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
];
