/**
 * Component suggestions for EditableHint components
 * This file contains suggestion arrays for different components across the app
 */

export interface ComponentSuggestion {
  id: string;
  title: string;
  detailedSuggestion: string;
  messageId: string;
}

/**
 * Suggestions for the Custom Instructions Editor component
 */
export const customInstructionsEditorSuggestions: ComponentSuggestion[] = [
  {
    id: "add-custom-instructions",
    title: "Add Custom Instructions",
    detailedSuggestion: "Add custom instructions to the project",
    messageId: "add-custom-instructions",
  },
  {
    id: "edit-custom-instructions",
    title: "Edit Custom Instructions",
    detailedSuggestion: "Make the custom instructions more detailed",
    messageId: "edit-custom-instructions",
  },
  {
    id: "update-prompt-to-greet-with-howdy",
    title: "Update Prompt to Greet with Howdy",
    detailedSuggestion: "Update the prompt to always greet with howdy",
    messageId: "update-prompt-to-greet-with-howdy",
  },
];

/**
 * Suggestions for the Provider Key Section component
 */
export const providerKeySectionSuggestions: ComponentSuggestion[] = [
  {
    id: "change-model",
    title: "Change Model",
    detailedSuggestion: "Change the model used for this project to gpt-4o",
    messageId: "change-model",
  },
  {
    id: "turn-on-thinking",
    title: "Turn on Thinking",
    detailedSuggestion: "Turn on thinking for the model used for this project",
    messageId: "turn-on-thinking",
  },
  {
    id: "change-input-token-limit",
    title: "Change Input Token Limit",
    detailedSuggestion:
      "Change the input token limit for the model used for this project",
    messageId: "change-input-token-limit",
  },
];

/**
 * Suggestions for the OAuth Settings component
 */
export const oauthSettingsSuggestions: ComponentSuggestion[] = [
  {
    id: "fetch-oauth-settings",
    title: "Fetch OAuth Settings",
    detailedSuggestion: "Fetch the OAuth settings for this project",
    messageId: "fetch-oauth-settings",
  },
  {
    id: "update-oauth-settings",
    title: "Update OAuth Settings",
    detailedSuggestion: "Update the OAuth settings for this project",
    messageId: "update-oauth-settings",
  },
  {
    id: "make-token-required-true",
    title: "Make Token Required True",
    detailedSuggestion: "Make the token required for this project to be true",
    messageId: "make-token-required-true",
  },
];

/**
 * Suggestions for the Available MCP Servers component
 */
export const availableMcpServersSuggestions: ComponentSuggestion[] = [
  {
    id: "fetch-mcp-servers",
    title: "Fetch MCP Servers",
    detailedSuggestion: "Fetch all MCP servers for this project",
    messageId: "fetch-mcp-servers",
  },
  {
    id: "add-mcp-server",
    title: "Add MCP Server",
    detailedSuggestion: "Add a new MCP server to this project",
    messageId: "add-mcp-server",
  },
  {
    id: "inspect-mcp-server-tools",
    title: "Inspect MCP Server Tools",
    detailedSuggestion:
      "Inspect the tools available on the MCP servers of this project",
    messageId: "inspect-mcp-server-tools",
  },
];

/**
 * Suggestions for the API Key List component
 */
export const apiKeyListSuggestions: ComponentSuggestion[] = [
  {
    id: "fetch-api-keys",
    title: "Fetch API Keys",
    detailedSuggestion: "Fetch all API keys for this project",
    messageId: "fetch-api-keys",
  },
  {
    id: "delete-api-key",
    title: "Delete API Key",
    detailedSuggestion: "Delete an API key from this project",
    messageId: "delete-api-key",
  },
  {
    id: "generate-api-key",
    title: "Generate New API Key",
    detailedSuggestion: "Generate a new API key for this project",
    messageId: "generate-api-key",
  },
];

/**
 * Suggestions for the Tool Call Limit Editor component
 */
export const toolCallLimitEditorSuggestions: ComponentSuggestion[] = [
  {
    id: "fetch-tool-call-limit",
    title: "Fetch Tool Call Limit",
    detailedSuggestion: "What is the current tool call limit for this project?",
    messageId: "fetch-tool-call-limit",
  },
  {
    id: "update-tool-call-limit",
    title: "Update Tool Call Limit",
    detailedSuggestion: "Update the tool call limit for this project to 10",
    messageId: "update-tool-call-limit",
  },
  {
    id: "how-to-use-tool-call-limit",
    title: "How to Use Tool Call Limit?",
    detailedSuggestion: "What is the tool call limit and how to use it?",
    messageId: "how-to-use-tool-call-limit",
  },
];

/**
 * Suggestions for the Observability/Threads page
 */
export const observabilityThreadsSuggestions: ComponentSuggestion[] = [
  {
    id: "thread-advanced-filters",
    title: "Advanced Filters",
    detailedSuggestion: "Add filters for date range, status, and user ID",
    messageId: "thread-advanced-filters",
  },
  {
    id: "thread-metadata-search",
    title: "Metadata Search",
    detailedSuggestion: "Add search by custom metadata fields",
    messageId: "thread-metadata-search",
  },
  {
    id: "thread-export-csv",
    title: "Export to CSV",
    detailedSuggestion: "Add functionality to export thread data to CSV",
    messageId: "thread-export-csv",
  },
];
