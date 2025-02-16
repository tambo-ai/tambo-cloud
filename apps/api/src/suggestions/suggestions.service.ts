import { Inject, Injectable, Logger } from '@nestjs/common';
import type { HydraDatabase } from '@use-hydra-ai/db';
import { operations } from '@use-hydra-ai/db';
import type { DBSuggestion } from '@use-hydra-ai/db/src/schema';
import { GenerateSuggestionsDto } from './dto/generate-suggestions.dto';
import { SuggestionResponseDto } from './dto/suggestion-response.dto';
import {
  InvalidSuggestionRequestError,
  SuggestionGenerationError,
  SuggestionNotFoundException,
} from './types/errors';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDatabase,
  ) {}

  private async getMessage(messageId: string) {
    try {
      const messages = await operations.getMessages(this.db, messageId);
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        this.logger.warn(`Message not found: ${messageId}`);
        throw new InvalidSuggestionRequestError('Message not found');
      }
      return message;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error getting message: ${errorMessage}`, errorStack);
      throw new InvalidSuggestionRequestError('Failed to retrieve message');
    }
  }

  async getSuggestions(messageId: string): Promise<SuggestionResponseDto[]> {
    this.logger.log(`Getting suggestions for message: ${messageId}`);

    await this.getMessage(messageId);

    try {
      const suggestions = await operations.getSuggestions(this.db, messageId);
      if (!suggestions || suggestions.length === 0) {
        throw new SuggestionNotFoundException(messageId);
      }

      this.logger.log(
        `Found ${suggestions.length} suggestions for message: ${messageId}`,
      );
      return suggestions.map(this.mapSuggestionToDto);
    } catch (error: unknown) {
      if (error instanceof SuggestionNotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error getting suggestions: ${errorMessage}`,
        errorStack,
      );
      throw new SuggestionGenerationError(messageId);
    }
  }

  async generateSuggestions(
    messageId: string,
    generateSuggestionsDto: GenerateSuggestionsDto,
  ): Promise<SuggestionResponseDto[]> {
    this.logger.log(`Generating suggestions for message: ${messageId}`);

    const message = await this.getMessage(messageId);
    const count = generateSuggestionsDto.maxSuggestions ?? 3;

    try {
      // Generate mock suggestions
      const mockSuggestions = Array.from({ length: count }, (_, index) => ({
        messageId,
        title: `Suggestion ${index + 1}`,
        detailedSuggestion: `This is detailed suggestion number ${index + 1}`,
      }));

      const savedSuggestions = await operations.createSuggestions(
        this.db,
        mockSuggestions,
      );

      this.logger.log(
        `Generated ${savedSuggestions.length} suggestions for message: ${messageId}`,
      );
      return savedSuggestions.map(this.mapSuggestionToDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error generating suggestions: ${errorMessage}`,
        errorStack,
      );
      throw new SuggestionGenerationError(messageId, {
        maxSuggestions: generateSuggestionsDto.maxSuggestions,
      });
    }
  }

  private mapSuggestionToDto(suggestion: DBSuggestion): SuggestionResponseDto {
    return {
      id: suggestion.id,
      messageId: suggestion.messageId,
      title: suggestion.title,
      detailedSuggestion: suggestion.detailedSuggestion,
    };
  }
}
