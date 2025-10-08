"use client";

import { NextAuthAuthForm } from "@/components/auth/nextauth-auth-form";
import {
  APIKeyList,
  APIKeyListProps,
} from "@/components/dashboard-components/project-details/api-key-list";
import {
  AvailableMcpServers,
  AvailableMcpServersProps,
} from "@/components/dashboard-components/project-details/available-mcp-servers";
import {
  CustomInstructionsEditor,
  CustomInstructionsEditorSchema,
} from "@/components/dashboard-components/project-details/custom-instructions-editor";
import {
  CustomLlmParametersEditor,
  CustomLlmParametersEditorSchema,
} from "@/components/dashboard-components/project-details/custom-llm-parameters/editor";
import {
  DailyMessagesChart,
  DailyMessagesChartSchema,
} from "@/components/dashboard-components/project-details/daily-messages-chart";
import {
  OAuthSettings,
  OAuthSettingsPropsSchema,
} from "@/components/dashboard-components/project-details/oauth-settings";
import {
  ProjectInfo,
  ProjectInfoProps,
} from "@/components/dashboard-components/project-details/project-info";
import {
  ProviderKeySection,
  ProviderKeySectionProps,
} from "@/components/dashboard-components/project-details/provider-key-section";
import {
  ToolCallLimitEditor,
  ToolCallLimitEditorPropsSchema,
} from "@/components/dashboard-components/project-details/tool-call-limit-editor";
import {
  ProjectTableContainer,
  ProjectTableContainerSchema,
} from "@/components/dashboard-components/project-table-container";
import {
  ThreadMessagesInline,
  ThreadMessagesInlineSchema,
} from "@/components/observability/messages/thread-messages-inline";
import {
  ThreadTableContainer,
  ThreadTableContainerSchema,
} from "@/components/observability/thread-table/thread-table-container";
import { z } from "zod";

export const tamboRegisteredComponents = [
  {
    name: "ProjectTable",
    description:
      "Displays a comprehensive table of all user projects. This component automatically fetches project data and renders a native table with project names, IDs (with copy functionality), creation dates, last message times, message counts, and navigation links. Use when users want to view, browse, or list their projects. Shows 'No projects found' message when empty. IMPORTANT: This component fetches its own data - do NOT call fetchAllProjects first. Simply call this component directly.",
    component: ProjectTableContainer,
    propsSchema: ProjectTableContainerSchema,
  },
  {
    name: "ProjectInfo",
    description:
      "Shows detailed information about a specific project including project name, unique ID (with copy button), owner details, and creation date. Features smooth animations and handles loading states. Use when displaying project overview information or when users need to reference project details like copying the project ID.",
    component: ProjectInfo,
    propsSchema: ProjectInfoProps,
  },
  {
    name: "APIKeyList",
    description:
      "Manages project API keys with full CRUD operations - create, view, and delete API keys. Automatically generates a first key for new projects. Shows masked key values, last usage dates, and provides secure key generation with one-time display. Includes animated interactions and handles loading states. Use when users need to manage authentication keys for their project.",
    component: APIKeyList,
    propsSchema: APIKeyListProps,
  },
  {
    name: "ProviderKeySection",
    description:
      "Comprehensive LLM provider configuration interface allowing users to select AI providers (OpenAI, Anthropic, etc.), configure models, set API keys, and manage custom endpoints. Handles free message limits, provider-specific settings, base URLs for custom providers, and validation. Shows real-time configuration status and supports both standard and OpenAI-compatible providers. Use when users need to configure or modify their AI model settings.",
    component: ProviderKeySection,
    propsSchema: ProviderKeySectionProps,
  },
  {
    name: "CustomInstructionsEditor",
    description:
      "NEVER RENDER THIS COMPONENT INLINE. This editor is only available on the project settings page and is for editing the CUSTOM INSTRUCTIONS TEXT/SYSTEM PROMPT ONLY (not model configuration like temperature or thinking mode). When users ask to view, edit, or improve custom instructions, direct them to the project settings page instead of rendering this component. If you need to suggest improved instructions, provide them as text in your response and tell the user they can copy them to the settings page. For updating model configuration like temperature, use the updateProjectModelConfig tool instead.",
    component: CustomInstructionsEditor,
    propsSchema: CustomInstructionsEditorSchema,
  },
  {
    name: "AvailableMcpServers",
    description:
      "Manages Model Context Protocol (MCP) servers for extending AI capabilities with external tools and data sources. Allows adding, configuring, and removing MCP servers with authentication handling. Shows server status, transport methods, and provides integration management. Use when users need to connect external tools, APIs, or data sources to enhance their AI assistant's capabilities.",
    component: AvailableMcpServers,
    propsSchema: AvailableMcpServersProps,
  },
  {
    name: "AuthForm",
    description:
      "A form that allows users to authenticate with GitHub or Google. Use when users are not authenticated and need to log in to access features or when the fetchCurrentUser tool indicates the user is not logged in.",
    component: NextAuthAuthForm,
    propsSchema: z.object({}),
  },
  {
    name: "DailyMessagesChart",
    description:
      "INTERACTABLE COMPONENT: An interactive bar chart showing message activity for a project that can be updated in-place. IMPORTANT: Requires a complete, valid project ID (e.g., 'p_abc123.def456') - do NOT use partial or incomplete IDs. Supports three view modes via the initialTimeRange prop: 'daily' (last 30 days), 'weekly' (last 12 weeks), or 'monthly' (last 3 months). Defaults to daily if not specified. When users ask to change the view (e.g., 'show weekly' or 'switch to monthly'), use the update_interactable_component tool to modify the initialTimeRange prop of the existing component on the page - do NOT re-render a new component. The chart will automatically update in place with the new view. Features responsive design with smooth animations, loading states, and empty state handling. Use when users want to view message activity trends and usage patterns for their project analytics.",
    component: DailyMessagesChart,
    propsSchema: DailyMessagesChartSchema,
  },
  {
    name: "ThreadTable",
    description:
      "Displays a comprehensive table of all threads for a specific project with full functionality including search, sorting, deletion, and message viewing. Features responsive design with smooth animations, loading states, and empty state handling. Shows thread ID, creation date, message count, tools, components, and errors. Supports compact mode which hides Updated, Context Key, and Thread Name columns for a cleaner view. IMPORTANT: This component requires a valid project ID (not project name). Always set compact=true for a cleaner interface. Use when users want to view and manage all threads for a specific project.",
    component: ThreadTableContainer,
    propsSchema: ThreadTableContainerSchema,
  },
  {
    name: "ThreadMessagesInline",
    description:
      "Lightweight self-contained component that fetches and displays recent messages from a specific thread inline in the conversation. Automatically handles its own data fetching via tRPC. Shows up to 10 most recent messages (default: 3) with user/assistant roles, timestamps, and message content. Truncates long messages at 2000 characters for performance. Includes thread metadata and tool/component indicators. IMPORTANT: This component fetches its own data - just provide projectId (not project name) AND threadId. Use fetchProjectThreads tool first to get the threadId, then call this component directly with both IDs. Perfect for showing 'the last message in this project' or 'recent conversation in this thread'. Use this when users ask to see specific messages rather than the full thread table.",
    component: ThreadMessagesInline,
    propsSchema: ThreadMessagesInlineSchema,
  },
  {
    name: "OAuthSettings",
    description:
      "Comprehensive OAuth token validation configuration interface for project security settings. Allows users to configure different validation modes including none, symmetric key (HS256), asymmetric auto (OpenID Connect), and asymmetric manual. Features preset configurations for popular providers (Google, GitHub, Auth0, Clerk, Supabase, etc.), secure key management with encryption, and real-time validation status. Includes animated form sections and handles loading states. Use when users need to configure OAuth token validation for their project's API endpoints and security requirements.",
    component: OAuthSettings,
    propsSchema: OAuthSettingsPropsSchema,
  },
  {
    name: "ToolCallLimitEditor",
    description:
      "Manages the maximum number of tool calls allowed per AI response to prevent infinite loops and control resource usage. Features inline editing with save/cancel functionality, input validation, and animated state transitions. Shows current limit prominently with explanatory text about behavior when limits are reached. Use when users need to configure or modify their project's tool call limits for performance and cost control.",
    component: ToolCallLimitEditor,
    propsSchema: ToolCallLimitEditorPropsSchema,
  },
  {
    name: "CustomLlmParametersEditor",
    description:
      "DISPLAY-ONLY COMPONENT: Shows the advanced LLM model configuration interface for viewing current settings. This component displays technical configuration like temperature, thinking mode, maxOutputTokens, topP, topK, presencePenalty, frequencyPenalty, etc. IMPORTANT: This component is for VIEWING the configuration only - do NOT use this to update settings. To UPDATE model configuration, use the updateProjectModelConfig tool instead. Only render this component when users explicitly ask to SEE or VIEW their current model configuration. This is NOT for custom instructions text - that's a separate field.",
    component: CustomLlmParametersEditor,
    propsSchema: CustomLlmParametersEditorSchema,
  },
];
