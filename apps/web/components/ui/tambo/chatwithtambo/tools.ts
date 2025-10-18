"use client";

import { api, useTRPCClient } from "@/trpc/react";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";
import { registerAllTools } from "./tools/tool-registry";

/**
 * Hook to register all Tambo management tools.
 * This hook uses the centralized tool registry to register all tools in an organized manner.
 */
export function useTamboManagementTools() {
  const { registerTool } = useTambo();
  const trpcClient = useTRPCClient();
  const utils = api.useUtils();

  useEffect(() => {
    // Register all tools using the centralized registry
    registerAllTools(registerTool, { trpcClient, utils });
  }, [registerTool, trpcClient, utils]);
}
