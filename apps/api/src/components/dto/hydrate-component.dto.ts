import { ChatMessage } from '@use-hydra-ai/hydra-ai-server/dist/hydra-ai/model/chat-message';
import { AvailableComponent } from '@use-hydra-ai/hydra-ai-server/dist/hydra-ai/model/component-metadata';

export class HydrateComponentDto {
  messageHistory: ChatMessage[];
  component: AvailableComponent;
  toolResponse: any;
}
