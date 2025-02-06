import {
  ActionType,
  ChatCompletionContentPart as ChatCompletionContentPartInterface,
  ContentPartType,
  MessageRole,
} from '@use-hydra-ai/core';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { type OpenAI } from 'openai';
import { ComponentDecision } from '../../components/dto/component-decision.dto';
type ChatCompletionAssistantMessageParam = Omit<
  OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
  'role'
>;
type ChatCompletionUserMessageParam = Omit<
  OpenAI.Chat.Completions.ChatCompletionUserMessageParam,
  'role'
>;

type ChatCompletionToolMessageParam = Omit<
  OpenAI.Chat.Completions.ChatCompletionToolMessageParam,
  'role'
>;

type ChatCompletionDeveloperMessageParam = Omit<
  OpenAI.Chat.Completions.ChatCompletionDeveloperMessageParam,
  'role'
>;

type ChatCompletionSystemMessageParam = Omit<
  OpenAI.Chat.Completions.ChatCompletionSystemMessageParam,
  'role'
>;

export class ChatCompletionAssistantMessage
  implements Partial<ChatCompletionAssistantMessageParam>
{
  content!: ChatCompletionAssistantMessageParam['content'];
  name?: ChatCompletionAssistantMessageParam['name'];
  refusal?: ChatCompletionAssistantMessageParam['refusal'];
  tool_calls?: ChatCompletionAssistantMessageParam['tool_calls'];
  audio?: ChatCompletionAssistantMessageParam['audio'];
}

export class ChatCompletionUserMessage
  implements Partial<ChatCompletionUserMessageParam>
{
  content!: ChatCompletionUserMessageParam['content'];
  name?: ChatCompletionUserMessageParam['name'];
}

export class ChatCompletionToolMessage
  implements Partial<ChatCompletionToolMessageParam>
{
  content!: ChatCompletionToolMessageParam['content'];
  tool_call_id?: ChatCompletionToolMessageParam['tool_call_id'];
}

export class ChatCompletionDeveloperMessage
  implements ChatCompletionDeveloperMessageParam
{
  content!: ChatCompletionDeveloperMessageParam['content'];
  name?: ChatCompletionDeveloperMessageParam['name'];
}

export class ChatCompletionSystemMessage
  implements ChatCompletionSystemMessageParam
{
  content!: ChatCompletionSystemMessageParam['content'];
  name?: ChatCompletionSystemMessageParam['name'];
}
export class ChatCompletionContentPart {
  @IsEnum(ContentPartType)
  type!: ContentPartType;
  text?: string;
  image_url?: {
    url: string;
    detail?: 'auto' | 'high' | 'low';
  };
  input_audio?: {
    data: string;
    format: 'wav' | 'mp3';
  };
}

/** Internal type to make sure that subclasses are aligned on types */
interface InternalThreadMessage {
  role: MessageRole;
  content: ChatCompletionContentPartInterface[];
  metadata?: Record<string, unknown>;
  component?: ComponentDecision;
  actionType?: ActionType;

  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}
export class ThreadMessage implements InternalThreadMessage {
  id!: string;
  @IsEnum(MessageRole)
  role!: MessageRole;
  content!: ChatCompletionContentPartInterface[];
  metadata?: Record<string, unknown>;
  component?: ComponentDecision;
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

export class MessageRequest implements InternalThreadMessage {
  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsNotEmpty()
  content!: ChatCompletionContentPartInterface[];

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  component?: ComponentDecision;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}
