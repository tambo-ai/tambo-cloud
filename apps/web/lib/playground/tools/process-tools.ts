/**
 * Tambo Tools: Process Operations
 *
 * Tools for executing commands and running processes in the Freestyle sandbox.
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
 * Execute a command in the sandbox
 */
export const execCommandTool: TamboTool = {
  name: "exec_command",
  description:
    "Execute a shell command in the development sandbox. Returns stdout, stderr, and exit code. Use 'background: true' for long-running processes like dev servers. Specify 'cwd' to run the command in a specific directory.",
  tool: async (args: {
    projectId: string;
    repoId: string;
    command: string;
    cwd?: string;
    timeoutMs?: number;
    background?: boolean;
  }) => {
    const res = await post<{
      success: boolean;
      stdout?: string;
      stderr?: string;
      exitCode?: number;
      error?: string;
    }>("/api/playground/process/exec", args);

    if (!res.success) {
      throw new Error(res.error || "Failed to execute command");
    }

    return {
      success: true,
      command: args.command,
      stdout: res.stdout || "",
      stderr: res.stderr || "",
      exitCode: res.exitCode || 0,
      cwd: args.cwd,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().describe("Project ID"),
        repoId: z.string().describe("Freestyle repository ID"),
        command: z
          .string()
          .describe("Shell command to execute (e.g., 'npm run build')"),
        cwd: z
          .string()
          .optional()
          .describe(
            "Working directory to run command in (e.g., /src). Defaults to repository root.",
          ),
        timeoutMs: z
          .number()
          .optional()
          .describe("Command timeout in milliseconds. Default is 30000 (30s)."),
        background: z
          .boolean()
          .optional()
          .describe(
            "Run command in background for long-running processes (e.g., dev servers)",
          ),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        command: z.string(),
        stdout: z.string(),
        stderr: z.string(),
        exitCode: z.number(),
        cwd: z.string().optional(),
      }),
    ),
};

/**
 * Run npm install
 */
export const npmInstallTool: TamboTool = {
  name: "npm_install",
  description:
    "Run 'npm install' in the sandbox to install dependencies. Specify 'cwd' if package.json is not in the root directory. This is useful after adding new dependencies to package.json.",
  tool: async (args: { projectId: string; repoId: string; cwd?: string }) => {
    const res = await post<{
      success: boolean;
      stdout?: string;
      stderr?: string;
      error?: string;
    }>("/api/playground/process/npm", args);

    if (!res.success) {
      throw new Error(res.error || "Failed to run npm install");
    }

    return {
      success: true,
      message: "npm install completed successfully",
      stdout: res.stdout || "",
      stderr: res.stderr || "",
      cwd: args.cwd,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().describe("Project ID"),
        repoId: z.string().describe("Freestyle repository ID"),
        cwd: z
          .string()
          .optional()
          .describe(
            "Directory containing package.json. Defaults to repository root.",
          ),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string(),
        stdout: z.string(),
        stderr: z.string(),
        cwd: z.string().optional(),
      }),
    ),
};

/**
 * Git commit and push (convenience tool)
 */
export const gitCommitTool: TamboTool = {
  name: "git_commit_and_push",
  description:
    "Commit all changes in the sandbox and push to the remote repository. Provide a commit message. This stages all changes, commits them, and pushes to the default remote branch.",
  tool: async (args: {
    projectId: string;
    repoId: string;
    message: string;
  }) => {
    // Execute git commands in sequence
    const commands = [
      "git add .",
      `git commit -m "${args.message.replace(/"/g, '\\"')}"`,
      "git push",
    ];

    const results: string[] = [];

    for (const command of commands) {
      const res = await post<{
        success: boolean;
        stdout?: string;
        stderr?: string;
        exitCode?: number;
        error?: string;
      }>("/api/playground/process/exec", {
        projectId: args.projectId,
        repoId: args.repoId,
        command,
      });

      if (!res.success || (res.exitCode && res.exitCode !== 0)) {
        throw new Error(
          `Git command failed: ${command}\n${res.stderr || res.error}`,
        );
      }

      results.push(`${command}: ${res.stdout || "Success"}`);
    }

    return {
      success: true,
      message: `Changes committed and pushed with message: "${args.message}"`,
      details: results,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().describe("Project ID"),
        repoId: z.string().describe("Freestyle repository ID"),
        message: z.string().describe("Commit message"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string(),
        details: z.array(z.string()),
      }),
    ),
};

export const processTools: TamboTool[] = [
  execCommandTool,
  npmInstallTool,
  gitCommitTool,
];
