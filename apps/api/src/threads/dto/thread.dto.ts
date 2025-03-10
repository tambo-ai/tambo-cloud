import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { GenerationStage } from '@tambo-ai-cloud/core';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ThreadMessageDto } from './message.dto';

export class ThreadRequest {
  @IsString()
  projectId!: string;

  @IsString()
  @IsOptional()
  contextKey?: string;

  @IsOptional()
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @IsEnum(GenerationStage)
  @IsOptional()
  generationStage?: GenerationStage;

  @IsString()
  @IsOptional()
  statusMessage?: string;
}

@ApiSchema({ name: 'Thread' })
export class Thread extends ThreadRequest {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

@ApiSchema({ name: 'ThreadWithMessages' })
export class ThreadWithMessagesDto extends Thread {
  messages!: ThreadMessageDto[];
}

@ApiSchema({
  name: 'UpdateComponentStateRequest',
})
export class UpdateComponentStateDto {
  @ApiProperty({
    additionalProperties: true,
  })
  /** The new state of the component */
  state!: Record<string, unknown>;
}

@ApiSchema({
  name: 'ThreadList',
})
export class ThreadListDto {
  items!: Thread[];
  total!: number;
  offset!: number;
  limit!: number;
  count!: number;
}
