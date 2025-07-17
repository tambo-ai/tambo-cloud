"use client";

import { demoComponents } from "@/components/ui/tambo/demo-config";
import { MessageThreadFull } from "@/components/ui/tambo/message-thread-full";
import { TamboEmailButton } from "@/components/ui/tambo/tambo-email-button";
import { env } from "@/lib/env";
import { TamboProvider, useTambo } from "@tambo-ai/react";

function DemoContent() {
  const { thread } = useTambo();

  return (
    <div className="w-full flex justify-center items-center bg-white">
      <MessageThreadFull />
      <TamboEmailButton />
    </div>
  );
}

export default function DemoPage() {
  return (
    <div className="w-full flex justify-center items-center h-screen">
      <TamboProvider
        apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
        tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
        components={demoComponents}
      >
        <DemoContent />
      </TamboProvider>
    </div>
  );
}
