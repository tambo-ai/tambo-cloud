import type { api, useTRPCClient } from "@/trpc/react";
import type { z } from "zod";

/**
 * Tool registration interface
 */
export interface ToolRegistration<TSchema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  tool: (...args: any[]) => Promise<unknown>;
  toolSchema: TSchema;
}

/**
 * Tool context containing TRPC client and utilities
 */
export interface ToolContext {
  trpcClient: ReturnType<typeof useTRPCClient>;
  utils: ReturnType<typeof api.useUtils>;
}

/**
 * Tool registration function
 */
export type RegisterToolFn = (tool: ToolRegistration) => void;
