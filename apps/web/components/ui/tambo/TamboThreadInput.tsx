"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTamboThreadInput } from "@tambo-ai/react";
import { FC } from "react";

interface TamboThreadInputProps {
  contextKey: string | undefined;
}

export const TamboThreadInput: FC<TamboThreadInputProps> = ({ contextKey }) => {
  const {
    value = "",
    setValue,
    submit,
    isPending,
    error,
  } = useTamboThreadInput(contextKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    submit({ streamResponse: true });
  };

  if (!contextKey) {
    return (
      <p className="text-red-500 dark:text-red-400">
        No context key provided, cannot send messages
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isPending}
            className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-gray-400 dark:focus:ring-gray-600"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black"
          >
            Send
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {error.message}
          </p>
        )}
      </div>
    </form>
  );
};
