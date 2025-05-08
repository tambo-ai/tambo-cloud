"use client";

import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { useSearchParams } from "next/navigation";
import { FC, PropsWithChildren } from "react";

export const ClientLayout: FC<PropsWithChildren> = ({ children }) => {
  const params = useSearchParams();
  const mcpServers = params.get("mcpServers");
  const mcpServersArray = mcpServers ? mcpServers.split(",") : [];
  return (
    <TamboProvider
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
    >
      <TamboMcpProvider mcpServers={mcpServersArray}>
        {children}
      </TamboMcpProvider>
    </TamboProvider>
  );
};
