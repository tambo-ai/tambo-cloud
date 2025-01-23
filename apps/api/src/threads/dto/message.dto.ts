import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
  Function = 'function',
}

export class MessageDto {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  content!: string | Record<string, unknown>;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
