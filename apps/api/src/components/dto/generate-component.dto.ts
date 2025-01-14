import { ChatMessage } from '@use-hydra-ai/hydra-ai-server/dist/hydra-ai/model/chat-message';
import { AvailableComponents } from '@use-hydra-ai/hydra-ai-server/dist/hydra-ai/model/component-metadata';

export class GenerateComponentDto {
  messageHistory: ChatMessage[];
  availableComponents: AvailableComponents;
}
