import { ApiSchema } from '@nestjs/swagger';
import { GenerationStage } from '@use-hydra-ai/core';
import { AvailableComponentDto } from '../../components/dto/generate-component.dto';
import { MessageRequest, ThreadMessageDto } from './message.dto';

export class AdvanceThreadDto {
  messageToAppend?: MessageRequest;
  contextKey?: string;
  availableComponents?: AvailableComponentDto[];
}

@ApiSchema({ name: 'AdvanceThreadResponseDto' })
export class AdvanceThreadResponseDto {
  responseMessageDto!: ThreadMessageDto;
  generationStage!: GenerationStage;
  statusMessage?: string;
}
