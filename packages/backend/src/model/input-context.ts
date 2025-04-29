import { ThreadMessage } from "@tambo-ai-cloud/core";
import { AvailableComponent } from "./component-metadata";

export type InputContextAsArray = {
  messageHistory: ThreadMessage[];
  availableComponents: AvailableComponent[];
  threadId: string;
};
