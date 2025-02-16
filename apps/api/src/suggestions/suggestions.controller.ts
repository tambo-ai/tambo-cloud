import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from 'nest-supabase-guard/dist/supabase-auth.guard';
import {
  MessageIdParameterKey,
  MessageProjectAccessGuard,
} from '../messages/guards/message-project-access.guard';
import { ErrorResponseDto } from './dto/error-response.dto';
import { GenerateSuggestionsDto } from './dto/generate-suggestions.dto';
import { SuggestionResponseDto } from './dto/suggestion-response.dto';
import { SuggestionsService } from './suggestions.service';

@ApiTags('suggestions')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(SupabaseAuthGuard)
@Controller('messages')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get(':messageId/suggestions')
  @ApiOperation({
    summary: 'Get suggestions for a message',
    description: 'Retrieves all suggestions generated for a specific message',
  })
  @ApiParam({
    name: 'messageId',
    description: 'ID of the message to get suggestions for',
    example: 'msg_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'List of suggestions for the message',
    type: [SuggestionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found or has no suggestions',
    type: ErrorResponseDto,
  })
  @UseGuards(MessageProjectAccessGuard)
  @MessageIdParameterKey('messageId')
  getSuggestions(
    @Param('messageId') messageId: string,
  ): Promise<SuggestionResponseDto[]> {
    return this.suggestionsService.getSuggestions(messageId);
  }

  @Post(':messageId/suggestions')
  @ApiOperation({
    summary: 'Generate new suggestions',
    description: 'Generates and stores new suggestions for a specific message',
  })
  @ApiParam({
    name: 'messageId',
    description: 'ID of the message to generate suggestions for',
    example: 'msg_123456789',
  })
  @ApiResponse({
    status: 201,
    description: 'New suggestions generated successfully',
    type: [SuggestionResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to generate suggestions',
    type: ErrorResponseDto,
  })
  @UseGuards(MessageProjectAccessGuard)
  @MessageIdParameterKey('messageId')
  generateSuggestions(
    @Param('messageId') messageId: string,
    @Body() generateSuggestionsDto: GenerateSuggestionsDto,
  ): Promise<SuggestionResponseDto[]> {
    return this.suggestionsService.generateSuggestions(
      messageId,
      generateSuggestionsDto,
    );
  }
}
