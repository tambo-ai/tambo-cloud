import { useState } from "react";
import type { ChatMessageProps } from "@/types/chat";

export function useChatState(initialMessages: ChatMessageProps[]) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageProps[]>(initialMessages);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      const newMessage: ChatMessageProps = {
        id: `user-${Date.now()}`,
        role: "user",
        content: input.trim(),
      };
      setMessages([...messages, newMessage]);
      setInput("");
      // Here you would typically handle sending the message to an AI service
      // and then add the AI's response to the messages
    }
  };

  return {
    input,
    messages,
    handleInputChange,
    handleSubmit,
    setMessages,
  };
}
