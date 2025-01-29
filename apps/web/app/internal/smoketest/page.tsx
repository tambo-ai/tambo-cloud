"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";
import { api } from "@/trpc/react";
import HydraClient from "@hydra-ai/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SmokePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hydraClient] = useState(() => {
    const client = new HydraClient({ apiKey: env.HYDRA_API_KEY });
    return client;
  });
  const [threadId, setThreadId] = useState<string | null>(null);
  const { mutateAsync: getAirQuality } = api.demo.aqi.useMutation();
  const { mutateAsync: getForecast } = api.demo.forecast.useMutation();
  const { mutateAsync: getHistoricalWeather } = api.demo.history.useMutation();
  hydraClient.components.generate({
    threadId: threadId ?? undefined,
    availableComponents: [],
    messageHistory: [],
  });
  const { mutateAsync: generate } = useMutation({
    mutationFn: async () => {
      const response = await hydraClient.components.generate({
        threadId: threadId ?? undefined,
        availableComponents: [],
        messageHistory: [],
      });
      setThreadId((response as any).threadId);
      return response;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
    };

    // Add assistant response
    const assistantMessage: Message = {
      role: "assistant",
      content: "Ok",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card className="p-4 min-h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-12"
                  : "bg-muted mr-12"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}
