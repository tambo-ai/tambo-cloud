import { MessageRole } from '@use-hydra-ai/db';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class MessageDto {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  message!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: Record<string, unknown>;
}
