import { ChatMessage } from "./chat-message";
import { AvailableComponents } from "./component-metadata";

export type InputContext = {
  messageHistory: ChatMessage[];
  availableComponents: AvailableComponents;
  threadId: string;
  /** Flag to control whether suggestedActions should be generated */
  generateSuggestedActions?: boolean;
};
