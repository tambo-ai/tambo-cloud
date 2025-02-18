import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../components/guards/apikey.guard';
import { ErrorDto } from './dto/error.dto';
import { MessageRequest, ThreadMessage } from './dto/message.dto';
import { SuggestionDto } from './dto/suggestion.dto';
import { SuggestionsGenerateDto } from './dto/suggestions-generate.dto';
import { Thread, ThreadRequest } from './dto/thread.dto';
import { ThreadsService } from './threads.service';

@ApiTags('threads')
@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  create(@Body() createThreadDto: ThreadRequest, @Req() req): Promise<Thread> {
    return this.threadsService.createThread({
      ...createThreadDto,
      projectId: req.projectId,
    });
  }

  @Get('project')
  @ApiQuery({ name: 'contextKey', required: false })
  findAllForProject(
    @Req() req,
    @Query('contextKey') contextKey?: string,
  ): Promise<Thread[]> {
    return this.threadsService.findAllForProject(req.projectId, { contextKey });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req): Promise<Thread> {
    return this.threadsService.findOne(id, req.projectId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateThreadDto: ThreadRequest,
    @Req() req,
  ): Promise<Thread> {
    const thread = await this.threadsService.update(id, {
      ...updateThreadDto,
      projectId: req.projectId,
    });
    return {
      ...thread,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.threadsService.remove(id);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') threadId: string,
    @Body() messageDto: MessageRequest,
    @Req() req,
  ) {
    return this.threadsService.addMessage(threadId, messageDto);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') threadId: string,
    @Req() req,
  ): Promise<ThreadMessage[]> {
    return this.threadsService.getMessages(threadId);
  }

  @Delete(':id/messages/:messageId')
  deleteMessage(
    @Param('id') threadId: string,
    @Param('messageId') messageId: string,
    @Req() req,
  ) {
    return this.threadsService.deleteMessage(messageId);
  }

  @Get(':id/messages/:messageId/suggestions')
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
    type: [SuggestionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found or has no suggestions',
    type: ErrorDto,
  })
  getSuggestions(
    @Param('messageId') messageId: string,
  ): Promise<SuggestionDto[]> {
    return this.threadsService.getSuggestions(messageId);
  }

  @Post(':id/messages/:messageId/suggestions')
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
    type: [SuggestionDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to generate suggestions',
    type: ErrorDto,
  })
  generateSuggestions(
    @Param('messageId') messageId: string,
    @Body() generateSuggestionsDto: SuggestionsGenerateDto,
  ): Promise<SuggestionDto[]> {
    return this.threadsService.generateSuggestions(
      messageId,
      generateSuggestionsDto,
    );
  }
}
