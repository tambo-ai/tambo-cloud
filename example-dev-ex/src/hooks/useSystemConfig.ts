import { useHydraContext } from "hydra-ai-react";
import { useCallback, useState } from "react";

export const useUpdateSystemMessage = () => {
  const context = useHydraContext();

  return useCallback(
    async (message: string) => {
      if (!context) throw new Error("Hydra context not found");
      await context.updateSystemMessage(message);
    },
    [context],
  );
};

export const useUpdatePrompt = () => {
  const context = useHydraContext();

  return useCallback(
    async (prompt: string) => {
      if (!context) throw new Error("Hydra context not found");
      await context.updatePrompt(prompt);
    },
    [context],
  );
};

export const useSystemConfig = () => {
  const context = useHydraContext();
  const [systemMessage, setSystemMessage] = useState<string | undefined>(
    context?.config.systemMessage,
  );
  const [prompt, setPrompt] = useState<string | undefined>(
    context?.config.prompt,
  );

  const updateSystemMessage = useCallback(
    async (message: string) => {
      if (!context) throw new Error("Hydra context not found");
      await context.updateSystemMessage(message);
      setSystemMessage(message);
    },
    [context],
  );

  const updatePrompt = useCallback(
    async (prompt: string) => {
      if (!context) throw new Error("Hydra context not found");
      await context.updatePrompt(prompt);
      setPrompt(prompt);
    },
    [context],
  );

  return {
    systemMessage,
    prompt,
    updateSystemMessage,
    updatePrompt,
  };
};
