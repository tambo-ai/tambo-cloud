"use client";

import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";
import { TamboProvider, useTambo } from "@tambo-ai/react";
import { useEffect, useRef } from "react";
import { TamboSuggestions } from "./TamboSuggestions";
import { TamboThreadInput } from "./TamboThreadInput";

// Define a simple type for message content handling
type MessageContent =
  | string
  | { text: string }
  | Array<string | { text: string }>;

interface Message {
  id: string;
  role: string;
  content: MessageContent;
}

// Simple demo component for registration
const DemoComponent = () => <div>Demo Component</div>;

// Inner component that uses Tambo hooks
const TamboDemoInner = () => {
  const { registerComponent, thread } = useTambo();
  // Use a simple string for the context key
  const contextKey = "tambo-demo";
  const messages = (thread?.messages ?? []) as Message[];
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Register the component with Tambo
  useEffect(() => {
    try {
      registerComponent({
        component: DemoComponent,
        name: "Tambo Demo",
        description: "Interactive demo of Tambo AI capabilities",
      });
    } catch (error) {
      console.error("Error registering component:", error);
    }
  }, [registerComponent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Small delay to ensure DOM updates are complete
    const scrollTimer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, [messages]);

  // Helper function to safely render message content
  const renderMessageContent = (message: Message) => {
    if (typeof message.content === "string") {
      return message.content;
    } else if (Array.isArray(message.content)) {
      // Handle array of content parts by extracting text content
      return message.content
        .map((part: any) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part)
            return part.text;
          return "";
        })
        .join("");
    }
    return "";
  };

  return (
    <Card className="p-4 shadow-md h-[90vh] sm:h-[80vh] flex flex-col bg-white dark:bg-black">
      <div className="space-y-4 flex flex-col h-full">
        {/* Messages display - with enhanced isolation from page scroll */}
        <div className="flex-grow relative">
          <div
            ref={chatContainerRef}
            className="space-y-4 absolute inset-0 overflow-y-auto p-4 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-950 scroll-container"
            id="chat-messages-container"
            style={{
              scrollBehavior: "smooth",
              overscrollBehavior: "contain",
            }}
          >
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No messages yet. Start a conversation!
              </p>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-gray-100 dark:bg-gray-900 ml-8"
                        : "bg-white dark:bg-gray-800 mr-8"
                    }`}
                  >
                    <p className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      {message.role === "user" ? "You" : "Tambo AI"}
                    </p>
                    <p className="whitespace-pre-wrap text-black dark:text-white">
                      {renderMessageContent(message)}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <TamboSuggestions maxSuggestions={3} />

        {/* Message Input */}
        <TamboThreadInput contextKey={contextKey} />
      </div>
    </Card>
  );
};

// Wrapper component that provides the TamboProvider
export const TamboDemo = () => {
  return (
    <Section id="tambo-demo" className="py-16 sm:py-24">
      <div className="w-full max-w-3xl mx-auto">
        <TamboProvider
          tamboUrl={env.NEXT_PUBLIC_HYDRA_API_URL!}
          apiKey={env.NEXT_PUBLIC_HYDRA_API_KEY!}
        >
          <TamboDemoInner />
        </TamboProvider>
      </div>
    </Section>
  );
};
