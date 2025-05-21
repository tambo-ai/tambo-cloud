"use client";

import {
  TamboRegisteredComponents,
  TamboRegisteredTools,
} from "@/components/ui/tambo/chatwithtambo/config";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
}>;

export function TamboProviderWrapper({ children }: TamboProviderWrapperProps) {
  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      components={TamboRegisteredComponents}
      tools={TamboRegisteredTools}
    >
      <TamboMcpProvider
        mcpServers={[
          {
            url: process.env.NEXT_PUBLIC_TAMBO_MCP_SERVER_URL!,
          },
        ]}
      >
        {children}
      </TamboMcpProvider>
    </TamboProvider>
  );
}
