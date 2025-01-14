import { ChatMessage } from '@hydra-ai/hydra-ai-server/dist/hydra-ai/model/chat-message';
import { AvailableComponents } from '@hydra-ai/hydra-ai-server/dist/hydra-ai/model/component-metadata';

export class GenerateComponentDto {
  messageHistory: ChatMessage[];
  availableComponents: AvailableComponents;
}
