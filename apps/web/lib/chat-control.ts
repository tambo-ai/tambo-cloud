/**
 * Chat control utilities for opening the chat interface and setting context
 */

export interface OpenChatEvent {
  message?: string;
  context?: {
    component: string;
    props?: Record<string, unknown>;
  };
}

export const OPEN_CHAT_EVENT = "tambo:open-chat";

/**
 * Opens the chat interface with optional initial message and context
 */
export function openChat(options?: OpenChatEvent) {
  const event = new CustomEvent(OPEN_CHAT_EVENT, {
    detail: options,
  });
  window.dispatchEvent(event);
}
