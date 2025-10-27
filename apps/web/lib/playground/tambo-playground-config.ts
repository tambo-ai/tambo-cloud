/**
 * Tambo Playground Configuration
 *
 * Central configuration for all playground tools and components.
 * Import and use these in your TamboProvider to enable AI-powered development.
 */

import type { TamboTool } from "@tambo-ai/react";
import { devserverTools } from "./tools/devserver-tools";
import { filesystemTools } from "./tools/filesystem-tools";
import { processTools } from "./tools/process-tools";
import { tamboTools } from "./tools/tambo-tools";

/**
 * All playground tools combined
 *
 * These tools enable AI to:
 * - Create and manage development sandboxes
 * - Read, write, and edit files
 * - Execute commands and run processes
 * - Manage git operations
 */
export const playgroundTools: TamboTool[] = [
  ...devserverTools,
  ...filesystemTools,
  ...processTools,
  ...tamboTools,
];

/**
 * Default system prompt for playground AI
 *
 * Provides context about the playground environment and available tools.
 */
export const playgroundSystemPrompt = `You are an AI assistant helping a developer build and modify applications in an interactive playground environment.

## Environment
You have access to a Freestyle development sandbox where you can:
- Read, write, and edit files
- Execute commands and run processes
- Install dependencies with npm
- Commit and push changes to git

## Available Tools
1. **Dev Server Management**
   - create_dev_server: Create or connect to a development sandbox
   - set_app_viewer_url: Update the preview URL
   - clear_app_viewer: Clear the preview

2. **File Operations**
   - read_file: Read file contents
   - write_file: Create or overwrite files
   - list_directory: Explore project structure
   - edit_file: Make targeted edits with find/replace

3. **Process Operations**
   - exec_command: Run shell commands
   - npm_install: Install dependencies
   - git_commit_and_push: Commit and push changes

## Best Practices
- Always read files before editing them to understand the current state
- Use edit_file for small changes, write_file for complete rewrites
- Run npm install after modifying package.json
- Test changes by executing commands (e.g., npm run build)
- Use descriptive commit messages when pushing changes
- List directories to explore the project structure
- For long-running processes like dev servers, use background: true

## Project Context
The playground context includes:
- projectId: Current project identifier
- repoId: Freestyle repository identifier
- ephemeralUrl: Live preview URL (if available)

Always include projectId and repoId in your tool calls.

## User Interaction
- Show your work step-by-step
- Explain what changes you're making and why
- Ask for confirmation before making significant changes
- Provide clear feedback about errors and how to fix them
- Suggest next steps after completing tasks`;

/**
 * Tool configuration presets for different use cases
 */
export const playgroundToolPresets = {
  /**
   * Full feature set - all tools enabled
   */
  full: playgroundTools,

  /**
   * Read-only mode - only file reading and listing
   */
  readOnly: [
    ...devserverTools.filter((t) => t.name === "create_dev_server"),
    ...filesystemTools.filter((t) =>
      ["read_file", "list_directory"].includes(t.name),
    ),
  ],

  /**
   * Safe mode - no git operations or dangerous commands
   */
  safe: playgroundTools.filter(
    (t) => !["git_commit_and_push"].includes(t.name),
  ),
};

/**
 * Helper to get tool by name
 */
export function getPlaygroundTool(name: string): TamboTool | undefined {
  return playgroundTools.find((t) => t.name === name);
}

/**
 * Helper to get tools by category
 */
export function getPlaygroundToolsByCategory(
  category: "devserver" | "filesystem" | "process",
): TamboTool[] {
  switch (category) {
    case "devserver":
      return devserverTools;
    case "filesystem":
      return filesystemTools;
    case "process":
      return processTools;
    default:
      return [];
  }
}
