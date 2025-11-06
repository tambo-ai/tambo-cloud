import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { ActionType, ContentPartType, MessageRole } from "@tambo-ai-cloud/core";
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";
import { type OpenAI } from "openai";
import {
  ComponentDecisionV2Dto,
  ToolCallRequestDto,
} from "./component-decision.dto";

export enum AudioFormat {
  WAV = "wav",
  MP3 = "mp3",
}

export class InputAudio {
  data!: string;
  @IsEnum(AudioFormat)
  format!: AudioFormat;
}

export enum ImageDetail {
  Auto = "auto",
  High = "high",
  Low = "low",
}

export class ImageUrl {
  url!: string;
  @IsEnum(ImageDetail)
  detail?: ImageDetail;
}

/**
 * Annotations for file resources (MCP-specific metadata).
 */
export class FileResourceAnnotations {
  @ApiProperty({
    description: "Target audience for this resource",
    required: false,
  })
  audience?: string[];

  @ApiProperty({
    description: "Priority level for this resource",
    required: false,
  })
  priority?: number;

  // Additional custom properties (no decorator needed for index signature)
  [key: string]: unknown;
}

/**
 * MCP Resource-compatible file content.
 * Based on https://modelcontextprotocol.io/specification/2025-06-18/schema#resource
 *
 * Note: This is a flattened representation for our API. When storing or passing to LLMs,
 * File types are currently filtered out until S3 storage is implemented.
 */
@ApiSchema({ name: "FileResource" })
export class FileResource {
  @ApiProperty({
    description:
      "URI identifying the resource (e.g., file://, https://, s3://)",
    required: false,
    example: "file:///path/to/document.pdf",
  })
  uri?: string;

  @ApiProperty({
    description: "Human-readable name for the resource",
    required: false,
    example: "project-documentation.pdf",
  })
  name?: string;

  @ApiProperty({
    description: "Optional description of the resource",
    required: false,
    example: "Project documentation for Q4 2024",
  })
  description?: string;

  @ApiProperty({
    description: "MIME type of the resource",
    required: false,
    example: "application/pdf",
  })
  mimeType?: string;

  @ApiProperty({
    description: "Inline text content (alternative to uri)",
    required: false,
    example: "The contents of the document...",
  })
  text?: string;

  @ApiProperty({
    description: "Base64-encoded blob data (alternative to uri or text)",
    required: false,
    example: "SGVsbG8gV29ybGQh",
  })
  blob?: string;

  @ApiProperty({
    description:
      "Annotations for additional metadata (MCP-specific). Can include audience, priority, or custom properties.",
    required: false,
  })
  annotations?: FileResourceAnnotations;
}

/**
 * DTO for the content part of a message.
 *
 * Note: This extends ChatCompletionContentPartUnion with our custom File type.
 * File types are currently filtered out before database storage and LLM consumption.
 */
@ApiSchema({ name: "ChatCompletionContentPart" })
export class ChatCompletionContentPartDto {
  @ApiProperty({
    description: "The type of content part",
    enum: ContentPartType,
    enumName: "ContentPartType",
  })
  @IsEnum(ContentPartType)
  type!: ContentPartType;

  @ApiProperty({
    description: "Text content (when type is 'text')",
    required: false,
  })
  @ValidateIf((o) => o.type === ContentPartType.Text)
  text?: string;

  @ApiProperty({
    description: "Image URL content (when type is 'image_url')",
    required: false,
  })
  @ValidateIf((o) => o.type === ContentPartType.ImageUrl)
  image_url?: ImageUrl;

  @ApiProperty({
    description: "Input audio content (when type is 'input_audio')",
    required: false,
  })
  @ValidateIf((o) => o.type === ContentPartType.InputAudio)
  input_audio?: InputAudio;

  @ApiProperty({
    description:
      "File/resource content (when type is 'file'). Supports MCP Resources with URI, text, or blob data. Currently filtered out before storage.",
    required: false,
  })
  @ValidateIf((o) => o.type === ContentPartType.File)
  file?: FileResource;
}

@ApiSchema({ name: "ThreadMessage" })
export class ThreadMessageDto {
  id!: string;
  threadId!: string;
  @IsEnum(MessageRole)
  role!: MessageRole;

  @ApiProperty({
    description: `The id of the parent message, if the message was created during the 
generation of another message, such as during an agent call, MCP Elicitation, or MCP Sample`,
  })
  parentMessageId?: string;
  content!: ChatCompletionContentPartDto[];
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;
  component?: ComponentDecisionV2Dto;
  @ApiProperty({
    description: "Reasoning text from the LLM, if the model supports it.",
  })
  reasoning?: string[];
  @ApiProperty({
    description: "Duration of reasoning in milliseconds",
  })
  reasoningDurationMS?: number;

  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  componentState!: Record<string, unknown>;

  @ApiProperty({
    description:
      "The tool call request. This is filled in only if the tool call is a client-side tool call.",
  })
  toolCallRequest?: ToolCallRequestDto;
  @ApiProperty({
    description:
      "The unique id of the tool call. This is filled in only if the tool call is a client-side tool call.",
  })
  tool_call_id?: string;

  /**
   * @deprecated Use the role and the presence of tool calls to determine the action type
   */
  @IsEnum(ActionType)
  @ApiProperty({
    deprecated: true,
    description:
      "Deprecated: use the role and the presence of tool calls to determine the action type",
  })
  actionType?: ActionType;

  @ApiProperty({ required: false, type: String })
  error?: string;

  @ApiProperty({
    required: false,
    type: Boolean,
    description: "Whether the message has been cancelled",
  })
  isCancelled?: boolean;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  createdAt!: Date;

  @IsOptional()
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description:
      "Additional context to provide to the AI beyond the user query, such as the info about the current page the user is visiting.",
  })
  additionalContext?: Record<string, any>;
}

/**
 * Request DTO for creating or updating messages.
 * Supports our extended File content type which is filtered before storage.
 */
export class MessageRequest {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  content!: ChatCompletionContentPartDto[];

  @IsOptional()
  @ApiProperty({
    type: "array",
    items: { type: "string" },
    description: "Reasoning text from the LLM, if the model supports it.",
  })
  reasoning?: string[];

  @IsOptional()
  @ApiProperty({
    description: "Duration of reasoning in milliseconds",
  })
  reasoningDurationMS?: number;

  @IsOptional()
  @ApiProperty({
    type: "object",
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: ComponentDecisionV2Dto;

  @IsOptional()
  toolCallRequest?: ToolCallRequestDto;

  @IsOptional()
  tool_call_id?: string;

  /**
   * @deprecated Use the role and the presence of tool calls to determine the action type
   */
  @IsOptional()
  @IsEnum(ActionType)
  @ApiProperty({
    deprecated: true,
    description:
      "No longer used - instead set role and the tool call information",
  })
  actionType?: ActionType;

  @IsOptional()
  @ApiProperty({ required: false, type: String })
  error?: string;

  @IsOptional()
  @ApiProperty({
    required: false,
    type: Boolean,
    description: "Whether the message has been cancelled",
  })
  isCancelled?: boolean;

  /**
   * @deprecated Put the response in the content instead
   */
  @IsOptional()
  @ApiProperty({
    description: "@deprecated Put the response in the content instead",
  })
  toolResponse?: any;

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "The initial state of the component",
  })
  componentState?: Record<string, unknown>;

  @IsOptional()
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description:
      "Additional context to provide to the AI beyond the user query, such as the info about the current page the user is visiting.",
  })
  additionalContext?: Record<string, any>;
}
