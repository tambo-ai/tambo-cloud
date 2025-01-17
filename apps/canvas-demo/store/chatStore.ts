import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hydraClient, ChatMessage } from "@/lib/hydra";
import type { ChatMessageProps } from "@/types/chat";
import { toast } from "sonner";

interface ChatState {
  messages: ChatMessageProps[];
  input: string;
  isLoading: boolean;
  activeCanvasId: string | null;
  chatThreads: Record<string, ChatMessageProps[]>;

  setInput: (input: string) => void;
  submitMessage: (input: string) => Promise<void>;
  clearMessages: () => void;
  setActiveCanvas: (canvasId: string) => void;
  loadChatThread: (canvasId: string) => void;
  saveChatThread: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      input: "",
      isLoading: false,
      activeCanvasId: null,
      chatThreads: {},

      setInput: (input) => set({ input }),

      clearMessages: () => {
        set({ messages: [] });
        // Also clear the active chat thread if there is one
        const state = get();
        if (state.activeCanvasId) {
          const canvasId = state.activeCanvasId;
          set((state) => ({
            chatThreads: {
              ...state.chatThreads,
              [canvasId]: [],
            },
          }));
        }
        toast.success("Chat history cleared");
      },

      setActiveCanvas: (canvasId: string) => {
        set({ activeCanvasId: canvasId });
        get().loadChatThread(canvasId);
      },

      loadChatThread: (canvasId: string) => {
        const state = get();
        const savedThread = state.chatThreads[canvasId] || [];
        set({ messages: savedThread });
      },

      saveChatThread: () => {
        const state = get();
        if (!state.activeCanvasId) return;
        const canvasId = state.activeCanvasId;

        set((state) => ({
          chatThreads: {
            ...state.chatThreads,
            [canvasId]: state.messages,
          },
        }));
      },

      submitMessage: async (input) => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        const userMessage: ChatMessageProps = {
          id: `user-${Date.now()}`,
          role: "user",
          content: trimmedInput,
        };

        // Optimistically update UI
        set((state) => ({
          messages: [...state.messages, userMessage],
          input: "",
          isLoading: true,
        }));

        try {
          const { messages } = get();
          const hydraMessages: ChatMessage[] = messages.map((msg) => ({
            sender: msg.role === "ai" ? "hydra" : "user",
            message: msg.content,
          }));

          const response = await hydraClient.generateComponent(
            JSON.stringify({
              messages: [
                ...hydraMessages,
                { sender: "user", message: trimmedInput },
              ],
              componentName: "FredChart",
            })
          );

          console.log("Raw Hydra Response:", JSON.stringify(response, null, 2));

          if (!response) throw new Error("No response from AI");

          if (response.component) {
            console.log(
              "Hydra Component Props:",
              JSON.stringify(response.component.props, null, 2)
            );
          }

          const aiMessage: ChatMessageProps = {
            id: `ai-${Date.now()}`,
            role: "ai",
            content: response.message || "No response",
            graph: response.component
              ? {
                  id: `graph-${Date.now()}`,
                  title: response.component.props.title,
                  description: response.component.props.description,
                  fredParams: response.component.props.fredParams,
                  height: response.component.props.height || 300,
                  inputs: response.component.props.inputs,
                }
              : undefined,
          };

          set((state) => ({
            messages: [...state.messages, aiMessage],
            isLoading: false,
          }));

          // Save the updated chat thread
          get().saveChatThread();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to process your request"
          );

          const errorMessage: ChatMessageProps = {
            id: `error-${Date.now()}`,
            role: "ai",
            content: "Sorry, there was an error processing your request.",
          };

          set((state) => ({
            messages: [...state.messages, errorMessage],
            isLoading: false,
          }));

          // Save even if there was an error
          get().saveChatThread();
        }
      },
    }),
    {
      name: "chat-storage",
      version: 1,
      partialize: (state) => ({
        chatThreads: state.chatThreads,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          toast.success("Chat history restored");
        }
      },
    }
  )
);
