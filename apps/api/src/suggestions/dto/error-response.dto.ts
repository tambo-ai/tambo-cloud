import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error code identifying the type of error',
    example: 'SUGGESTION_NOT_FOUND',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'No suggestions found for message msg_123456789',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    description: 'Additional error details',
    required: false,
    additionalProperties: true,
    example: { maxSuggestions: 3 },
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;
}
