import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SuggestionResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the suggestion',
    example: 'sug_123456789',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: 'Short title describing the suggestion',
    example: 'Add error handling',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Detailed explanation of the suggestion',
    example:
      'Add try-catch blocks to handle potential errors in the async operations',
  })
  @IsString()
  @IsNotEmpty()
  detailedSuggestion!: string;

  @ApiProperty({
    description: 'Additional metadata for the suggestion',
    required: false,
    additionalProperties: { type: 'string' },
    example: { category: 'error-handling', priority: 'high' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'ID of the message this suggestion is for',
    example: 'msg_123456789',
  })
  @IsString()
  @IsNotEmpty()
  messageId!: string;
}
