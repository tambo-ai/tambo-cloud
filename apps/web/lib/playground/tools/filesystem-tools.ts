/**
 * Tambo Tools: Filesystem Operations
 *
 * Tools for reading, writing, and listing files in the Freestyle sandbox.
 * All operations are authenticated and project-scoped.
 */

import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Helper function to make authenticated POST requests
 */
async function post<TOut>(
  url: string,
  args: Record<string, any>,
): Promise<TOut> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }

  return await res.json();
}

/**
 * Read a file from the sandbox
 */
export const readFileTool: TamboTool = {
  name: "read_file",
  description:
    "Read the contents of a file from the development sandbox. Provide the absolute path to the file you want to read (e.g., /src/app/page.tsx).",
  tool: async (args: { projectId: string; repoId: string; path: string }) => {
    const res = await post<{
      success: boolean;
      content?: string;
      error?: string;
    }>("/api/playground/filesystem/read", args);

    if (!res.success) {
      throw new Error(res.error || "Failed to read file");
    }

    return {
      success: true,
      content: res.content || "",
      path: args.path,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().describe("Project ID"),
        repoId: z.string().describe("Freestyle repository ID"),
        path: z
          .string()
          .describe("Absolute path to the file (e.g., /src/app/page.tsx)"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        content: z.string(),
        path: z.string(),
      }),
    ),
};

/**
 * Write a file to the sandbox
 */
export const writeFileTool: TamboTool = {
  name: "write_file",
  description:
    "Write or create a file in the development sandbox. Provide the absolute path and content. Creates parent directories if they don't exist.",
  tool: async (args: {
    projectId: string;
    repoId: string;
    path: string;
    content: string;
  }) => {
    const res = await post<{ success: boolean; error?: string }>(
      "/api/playground/filesystem/write",
      args,
    );

    if (!res.success) {
      throw new Error(res.error || "Failed to write file");
    }

    return {
      success: true,
      message: `Successfully wrote to ${args.path}`,
      path: args.path,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().describe("Project ID"),
        repoId: z.string().describe("Freestyle repository ID"),
        path: z
          .string()
          .describe("Absolute path to write (e.g., /src/app/page.tsx)"),
        content: z.string().describe("File content to write"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string(),
        path: z.string(),
      }),
    ),
};

/**
 * List files in a directory
 */
export const listDirectoryTool: TamboTool = {
  name: "list_directory",
  description:
    "List all files and directories in a given path in the sandbox. Useful for exploring the project structure. Use '/' for the root directory.",
  tool: async (args: { projectId: string; repoId: string; path: string }) => {
    const res = await post<{
      success: boolean;
      files?: string[];
      error?: string;
    }>("/api/playground/filesystem/list", args);

    if (!res.success) {
      throw new Error(res.error || "Failed to list directory");
    }

    return {
      success: true,
      files: res.files || [],
      path: args.path,
      count: res.files?.length || 0,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().describe("Project ID"),
        repoId: z.string().describe("Freestyle repository ID"),
        path: z.string().describe("Directory path to list (e.g., / or /src)"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        files: z.array(z.string()),
        path: z.string(),
        count: z.number(),
      }),
    ),
};

/**
 * Edit a file with find/replace operations
 *
 * Note: This is a client-side helper that reads, modifies, and writes back.
 * For simple edits, it's more efficient than calling read + write separately.
 */
export const editFileTool: TamboTool = {
  name: "edit_file",
  description:
    "Edit a file by applying find-and-replace operations. Provide the path and an array of edits. Each edit specifies the old text to find and the new text to replace it with. This is useful for making targeted changes without rewriting the entire file.",
  tool: async (args: {
    projectId: string;
    repoId: string;
    path: string;
    edits: Array<{ oldText: string; newText: string }>;
  }) => {
    // 1. Read the current file
    const readRes = await post<{
      success: boolean;
      content?: string;
      error?: string;
    }>("/api/playground/filesystem/read", {
      projectId: args.projectId,
      repoId: args.repoId,
      path: args.path,
    });

    if (!readRes.success || !readRes.content) {
      throw new Error(readRes.error || "Failed to read file for editing");
    }

    // 2. Apply edits
    let content = readRes.content;
    const appliedEdits: string[] = [];

    for (const edit of args.edits) {
      if (content.includes(edit.oldText)) {
        content = content.replace(edit.oldText, edit.newText);
        appliedEdits.push(`Replaced "${edit.oldText.substring(0, 50)}..."`);
      } else {
        throw new Error(
          `Could not find text to replace: "${edit.oldText.substring(0, 100)}"`,
        );
      }
    }

    // 3. Write back
    const writeRes = await post<{ success: boolean; error?: string }>(
      "/api/playground/filesystem/write",
      {
        projectId: args.projectId,
        repoId: args.repoId,
        path: args.path,
        content,
      },
    );

    if (!writeRes.success) {
      throw new Error(writeRes.error || "Failed to write edited file");
    }

    return {
      success: true,
      message: `Successfully applied ${args.edits.length} edit(s) to ${args.path}`,
      path: args.path,
      editsApplied: appliedEdits,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().describe("Project ID"),
        repoId: z.string().describe("Freestyle repository ID"),
        path: z.string().describe("Absolute path to the file to edit"),
        edits: z
          .array(
            z.object({
              oldText: z.string().describe("Text to find and replace"),
              newText: z.string().describe("Text to replace with"),
            }),
          )
          .describe("Array of find/replace operations to apply"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string(),
        path: z.string(),
        editsApplied: z.array(z.string()),
      }),
    ),
};

export const filesystemTools: TamboTool[] = [
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  editFileTool,
];
