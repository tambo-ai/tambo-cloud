"use client";

import {
  TamboRegisteredComponents,
  TamboRegisteredTools,
} from "@/components/ui/tambo/chatwithtambo/config";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";

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
      {children}
    </TamboProvider>
  );
}
