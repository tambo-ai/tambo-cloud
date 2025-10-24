import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { AsyncQueue, GenerationStage } from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import {
  ProjectAccessOwnGuard,
  ProjectIdParameterKey,
} from "../projects/guards/project-access-own.guard";
import {
  AdvanceThreadDto,
  AdvanceThreadResponseDto,
} from "./dto/advance-thread.dto";
import { ProblemDetailsDto } from "./dto/error.dto";
import { MessageRequest, ThreadMessageDto } from "./dto/message.dto";
import { SuggestionDto } from "./dto/suggestion.dto";
import { SuggestionsGenerateDto } from "./dto/suggestions-generate.dto";
import {
  Thread,
  ThreadListDto,
  ThreadRequest,
  ThreadWithMessagesDto,
  UpdateComponentStateDto,
} from "./dto/thread.dto";
import { ThreadInProjectGuard } from "./guards/thread-in-project-guard";
import { ThreadsService } from "./threads.service";
import { throttleChunks } from "./util/streaming";

@ApiTags("threads")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("threads")
export class ThreadsController {
  private readonly logger = new Logger(ThreadsController.name);

  constructor(private readonly threadsService: ThreadsService) {}

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Post()
  async create(
    @Body() createThreadDto: ThreadRequest,
    @Req() request: Request,
  ): Promise<Thread> {
    const { contextKey } = extractContextInfo(
      request,
      createThreadDto.contextKey,
    );
    return await this.threadsService.createThread(createThreadDto, contextKey);
  }

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Get("project/:projectId")
  @ApiQuery({
    name: "contextKey",
    description: "Unique user identifier for the thread",
    required: false,
  })
  @ApiQuery({ name: "offset", required: false, type: Number, default: 0 })
  @ApiQuery({ name: "limit", required: false, type: Number, default: 10 })
  async findAllForProject(
    @Req() request: Request,
    @Param("projectId") _projectId: string,
    @Query("contextKey") apiContextKey?: string,
    @Query("offset") offset: number = 0,
    @Query("limit") limit: number = 10,
  ): Promise<ThreadListDto> {
    const { projectId: projectId, contextKey } = extractContextInfo(
      request,
      apiContextKey,
    );

    try {
      const [threads, total] = await Promise.all([
        this.threadsService.findAllForProject(projectId, {
          contextKey,
          offset,
          limit,
        }),
        this.threadsService.countThreadsByProject(projectId, {
          contextKey,
        }),
      ]);

      return {
        total,
        offset,
        limit,
        count: threads.length,
        items: threads,
      };
    } catch (error: any) {
      this.logger.error(
        `Error fetching threads for project ${projectId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get(":id")
  @UseGuards(ThreadInProjectGuard)
  @ApiQuery({ name: "contextKey", required: false })
  @ApiQuery({ name: "includeInternal", required: false, type: Boolean })
  async findOne(
    @Param("id") threadId: string,
    @Req() request: Request,
    @Query("contextKey") apiContextKey?: string,
    @Query("includeInternal") includeInternal?: boolean,
  ): Promise<ThreadWithMessagesDto> {
    if (includeInternal === false) {
      throw new BadRequestException(
        "includeInternal is deprecated, if passed, it can only be `true`",
      );
    }
    const { projectId, contextKey } = extractContextInfo(
      request,
      apiContextKey,
    );
    return await this.threadsService.findOne(threadId, projectId, contextKey);
  }

  @UseGuards(ThreadInProjectGuard)
  @Put(":id")
  async update(
    @Param("id") threadId: string,
    @Body() updateThreadDto: ThreadRequest,
  ): Promise<Thread> {
    const thread = await this.threadsService.update(threadId, updateThreadDto);
    return {
      ...thread,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage,
      statusMessage: thread.statusMessage ?? undefined,
      name: thread.name ?? undefined,
    };
  }

  @UseGuards(ThreadInProjectGuard)
  @Delete(":id")
  async remove(@Param("id") threadId: string) {
    return await this.threadsService.remove(threadId);
  }

  /**
   * Sets a thread's generation stage to CANCELLED.
   */
  @UseGuards(ThreadInProjectGuard)
  @Post(":id/cancel")
  @ApiOperation({
    summary: "Cancel thread advancement",
    description: "Sets a thread's generation stage to CANCELLED",
  })
  @ApiParam({
    name: "id",
    description: "ID of the thread to cancel",
    example: "thread_123456789",
  })
  @ApiResponse({
    status: 200,
    description: "Thread cancelled successfully",
    type: Thread,
  })
  @ApiResponse({
    status: 400,
    description: "Thread is not in a cancellable state",
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found",
    type: ProblemDetailsDto,
  })
  async cancelThread(@Param("id") threadId: string): Promise<Thread> {
    return await this.threadsService.cancelThread(threadId);
  }

  @UseGuards(ThreadInProjectGuard)
  @Post(":id/messages")
  async addMessage(
    @Param("id") threadId: string,
    @Body() messageDto: MessageRequest,
  ) {
    // Log only non-sensitive identifiers. Do not log message content or payloads.
    if (!["user", "tool"].includes(messageDto.role)) {
      this.logger.warn(
        `Received message with non-standard role: ${messageDto.role}`,
      );
    }
    const saved = await this.threadsService.addMessage(threadId, messageDto);
    // Minimal diagnostic logging – include at most role and message id
    this.logger.log(`Added message id=${saved.id} role=${messageDto.role}`);
    return saved;
  }

  @UseGuards(ThreadInProjectGuard)
  @Get(":id/messages")
  @ApiParam({
    name: "id",
    description: "Id of the thread to get messages for",
    example: "thr_123.456",
  })
  @ApiQuery({
    name: "includeInternal",
    description: "Whether to include internal messages, must be `true`",
    required: false,
    type: Boolean,
    deprecated: true,
  })
  async getMessages(
    @Param("id") threadId: string,
    @Query("includeInternal") includeInternal?: boolean,
  ): Promise<ThreadMessageDto[]> {
    if (includeInternal === false) {
      throw new BadRequestException(
        "includeInternal is deprecated, if passed, it can only be `true`",
      );
    }
    return await this.threadsService.getMessages({ threadId });
  }

  @UseGuards(ThreadInProjectGuard)
  @Delete(":id/messages/:messageId")
  @ApiParam({
    name: "id",
    description: "Id of the thread that contains the message",
    example: "thr_123.456",
  })
  @ApiParam({
    name: "messageId",
    description: "Id of the message to delete",
    example: "msg_123.456",
  })
  async deleteMessage(
    @Param("id") _threadId: string,
    @Param("messageId") messageId: string,
  ) {
    return await this.threadsService.deleteMessage(messageId);
  }

  @UseGuards(ThreadInProjectGuard)
  @Get(":id/messages/:messageId/suggestions")
  @ApiOperation({
    summary: "Get suggestions for a message",
    description: "Retrieves all suggestions generated for a specific message",
  })
  @ApiParam({
    name: "id",
    description: "ID of the thread to get suggestions for",
    example: "thread_123456789",
  })
  @ApiParam({
    name: "messageId",
    description: "ID of the message to get suggestions for",
    example: "msg_123456789",
  })
  @ApiResponse({
    status: 200,
    description: "List of suggestions for the message",
    type: [SuggestionDto],
  })
  @ApiResponse({
    status: 404,
    description: "Message not found or has no suggestions",
    type: ProblemDetailsDto,
  })
  async getSuggestions(
    @Param("id") threadId: string,
    @Param("messageId") messageId: string,
  ): Promise<SuggestionDto[]> {
    return await this.threadsService.getSuggestions(messageId);
  }

  @UseGuards(ThreadInProjectGuard)
  @Post(":id/messages/:messageId/suggestions")
  @ApiOperation({
    summary: "Generate new suggestions",
    description: "Generates and stores new suggestions for a specific message",
  })
  @ApiParam({
    name: "id",
    description: "ID of the thread to generate suggestions for",
    example: "thread_123456789",
  })
  @ApiParam({
    name: "messageId",
    description: "ID of the message to generate suggestions for",
    example: "msg_123456789",
  })
  @ApiResponse({
    status: 201,
    description: "New suggestions generated successfully",
    type: [SuggestionDto],
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request parameters",
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 500,
    description: "Failed to generate suggestions",
    type: ProblemDetailsDto,
  })
  async generateSuggestions(
    @Param("id") threadId: string,
    @Param("messageId") messageId: string,
    @Body() generateSuggestionsDto: SuggestionsGenerateDto,
  ): Promise<SuggestionDto[]> {
    return await this.threadsService.generateSuggestions(
      messageId,
      generateSuggestionsDto,
    );
  }

  @UseGuards(ThreadInProjectGuard)
  @Put(":id/messages/:messageId/component-state")
  @ApiParam({
    name: "id",
    description: "Id of the thread that contains the message",
    example: "thr_123.456",
  })
  @ApiParam({
    name: "messageId",
    description: "Id of the message to update component state for",
    example: "msg_123.456",
  })
  async updateComponentState(
    @Param("id") threadId: string,
    @Param("messageId") messageId: string,
    @Body() newState: UpdateComponentStateDto,
  ): Promise<ThreadMessageDto> {
    const message = await this.threadsService.updateComponentState(
      messageId,
      newState.state,
    );
    return message;
  }

  /**
   * Given a thread, generate the response message, optionally appending a message before generation.
   */
  @UseGuards(ThreadInProjectGuard)
  @Post(":id/advance")
  @ApiOperation({
    summary: "Advance a thread",
    description: "Generates the response message for an existing thread",
  })
  @ApiParam({
    name: "id",
    description: "Id of an existing thread to advance",
    example: "thr_123.456",
  })
  async advanceThread(
    @Param("id") threadId: string,
    @Req() request: Request,
    @Body() advanceRequestDto: AdvanceThreadDto,
  ): Promise<AdvanceThreadResponseDto> {
    const { projectId, contextKey } = extractContextInfo(
      request,
      advanceRequestDto.contextKey,
    );
    const queue = new AsyncQueue<AdvanceThreadResponseDto>();
    // This method will resolve when the queue is done or failed
    const p = this.threadsService.advanceThread(
      projectId,
      advanceRequestDto,
      threadId,
      false,
      advanceRequestDto.toolCallCounts ?? {},
      undefined,
      queue,
      contextKey,
    );

    let lastMessage: AdvanceThreadResponseDto | null = null;
    for await (const message of queue) {
      lastMessage = message;
    }
    if (!lastMessage) {
      throw new InternalServerErrorException("No message found in queue");
    }
    // await the promise to ensure the queue is finished
    await p;
    return lastMessage;
  }

  @UseGuards(ThreadInProjectGuard)
  @Post(":id/advancestream")
  @ApiOperation({
    summary: "Advance a thread stream",
    description:
      "Generates the response message for an existing thread, and streams the response message(s)",
  })
  @ApiParam({
    name: "id",
    description: "Id of an existing thread to advance",
    example: "thr_123.456",
  })
  async advanceThreadStream(
    @Param("id") threadId: string,
    @Req() request: Request,
    @Body() advanceRequestDto: AdvanceThreadDto,
    @Res() response: Response,
  ): Promise<void> {
    const { projectId, contextKey } = extractContextInfo(
      request,
      advanceRequestDto.contextKey,
    );
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");

    const queue = new AsyncQueue<AdvanceThreadResponseDto>();
    try {
      const p = this.threadsService.advanceThread(
        projectId,
        advanceRequestDto,
        threadId,
        true,
        advanceRequestDto.toolCallCounts ?? {},
        undefined,
        queue,
        contextKey,
      );

      await this.handleAdvanceStream(response, queue);
      await p;
    } catch (error: any) {
      response.write(`error: ${error.message}\n\n`);
      response.end();
    }
  }

  /**
   * Create a new thread and advance it, optionally appending a message before generation.
   */
  @Post("advance")
  @ApiOperation({
    summary: "Create and advance a thread",
    description: "Creates a new thread and advances it",
  })
  async createAndAdvanceThread(
    @Req() request: Request,
    @Body() advanceRequestDto: AdvanceThreadDto,
  ): Promise<AdvanceThreadResponseDto> {
    const { projectId, contextKey } = extractContextInfo(
      request,
      advanceRequestDto.contextKey,
    );
    const queue = new AsyncQueue<AdvanceThreadResponseDto>();
    const p = this.threadsService.advanceThread(
      projectId,
      advanceRequestDto,
      undefined,
      false,
      advanceRequestDto.toolCallCounts ?? {},
      undefined,
      queue,
      contextKey,
    );
    let lastMessage: AdvanceThreadResponseDto | null = null;
    for await (const message of queue) {
      lastMessage = message;
    }
    if (!lastMessage) {
      throw new InternalServerErrorException("No message found in queue");
    }
    // await the promise to ensure the queue is finished
    await p;
    // Since stream=false, result will be AdvanceThreadResponseDto
    return lastMessage;
  }

  @Post("advancestream")
  @ApiOperation({
    summary: "Create and advance a thread stream",
    description:
      "Creates a new thread and advances it, and streams the response message(s)",
  })
  async createAndAdvanceThreadStream(
    @Req() request: Request,
    @Body() advanceRequestDto: AdvanceThreadDto,
    @Res() response,
  ): Promise<void> {
    const { projectId, contextKey } = extractContextInfo(
      request,
      advanceRequestDto.contextKey,
    );
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");

    const queue = new AsyncQueue<AdvanceThreadResponseDto>();
    try {
      const p = this.threadsService.advanceThread(
        projectId,
        advanceRequestDto,
        undefined,
        true,
        advanceRequestDto.toolCallCounts ?? {},
        undefined,
        queue,
        contextKey,
      );
      await this.handleAdvanceStream(response, queue);
      await p;
    } catch (error: any) {
      response.write(`error: ${error.message}\n\n`);
      response.end();
    }
  }

  @UseGuards(ThreadInProjectGuard)
  @Post(":id/generate-name")
  @ApiOperation({
    summary: "Generate and set a thread's name",
    description:
      "Automatically generates and sets a name for the thread as a summary based on its messages.",
  })
  @ApiParam({
    name: "id",
    description: "ID of the thread to generate name for",
    example: "thread_123456789",
  })
  @ApiResponse({
    status: 201,
    description: "Thread name generated successfully",
    type: Thread,
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found",
    type: ProblemDetailsDto,
  })
  @ApiQuery({
    name: "contextKey",
    description: "Unique user identifier for the thread",
    required: false,
  })
  async generateName(
    @Param("id") threadId: string,
    @Req() request: Request,
    @Query("contextKey") contextKey?: string,
  ): Promise<Thread> {
    const { projectId } = extractContextInfo(request, contextKey);
    return await this.threadsService.generateThreadName(
      threadId,
      projectId,
      contextKey,
    );
  }

  private async handleAdvanceStream(
    @Res() response,
    stream: AsyncIterableIterator<{
      responseMessageDto: ThreadMessageDto;
      generationStage: GenerationStage;
    }>,
    shouldThrottle = true, // used mainly for debugging
  ) {
    try {
      if (shouldThrottle) {
        for await (const chunk of throttleChunks(
          stream,
          (m1, m2) => m1.responseMessageDto.id !== m2.responseMessageDto.id,
        )) {
          response.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      } else {
        for await (const chunk of stream) {
          response.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }
    } catch (error: any) {
      console.error(error);
      response.write(`error: ${error.message}\n\n`);
    } finally {
      response.write("data: DONE\n\n");
      response.end();
    }
  }
}
