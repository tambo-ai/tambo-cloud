import {
  ActionType,
  ComponentDecisionV2,
  ContentPartType,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  HydraDb,
  HydraTransaction,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { MessageRequest, ThreadMessageDto } from "../dto/message.dto";
import {
  convertContentDtoToContentPart,
  convertContentPartToDto,
} from "./content";

export async function addMessage(
  db: HydraDb,
  threadId: string,
  messageDto: MessageRequest,
): Promise<ThreadMessage> {
  const message = await operations.addMessage(db, {
    threadId,
    role: messageDto.role,
    content: convertContentDtoToContentPart(messageDto.content),
    componentDecision: messageDto.component ?? undefined,
    metadata: messageDto.metadata,
    actionType: messageDto.actionType ?? undefined,
    toolCallRequest: messageDto.toolCallRequest ?? undefined,
    toolCallId: messageDto?.tool_call_id,
    componentState: messageDto.componentState ?? {},
  });
  return {
    id: message.id,
    threadId: message.threadId,
    role: message.role,
    metadata: message.metadata ?? undefined,
    actionType: message.actionType ?? undefined,
    toolCallRequest: message.toolCallRequest ?? undefined,
    componentState: message.componentState ?? {},
    createdAt: message.createdAt,
    component: message.componentDecision ?? undefined,
    content: message.content,
    tool_call_id: message.toolCallId ?? undefined,
  };
}

export async function updateMessage(
  db: HydraDb,
  messageId: string,
  messageDto: MessageRequest,
): Promise<ThreadMessageDto> {
  const message = await operations.updateMessage(db, messageId, {
    content: convertContentDtoToContentPart(messageDto.content),
    componentDecision: messageDto.component ?? undefined,
    metadata: messageDto.metadata,
    actionType: messageDto.actionType ?? undefined,
    toolCallRequest: messageDto.toolCallRequest,
    toolCallId: messageDto.tool_call_id ?? undefined,
  });
  return {
    ...message,
    content: convertContentPartToDto(message.content),
    metadata: message.metadata ?? undefined,
    toolCallRequest: message.toolCallRequest ?? undefined,
    tool_call_id: message.toolCallId ?? undefined,
    actionType: message.actionType ?? undefined,
    componentState: message.componentState ?? {},
  };
}

export async function addResponseToThread(
  db: HydraDb,
  component: LegacyComponentDecision,
  threadId: string,
) {
  const serializedMessage: ComponentDecisionV2 = {
    message: component.message,
    componentName: component.componentName,
    props: component.props,
    componentState: component.componentState,
    reasoning: component.reasoning,
  };
  return await addMessage(db, threadId, {
    role: MessageRole.Assistant,
    content: [
      {
        type: ContentPartType.Text,
        text: component.message,
      },
    ],
    component: serializedMessage,
    actionType: component.toolCallRequest ? ActionType.ToolCall : undefined,
    toolCallRequest: component.toolCallRequest,
    tool_call_id: component.toolCallRequest?.tool_call_id,
    componentState: component.componentState ?? {},
  });
}

export async function verifyLatestMessageConsistency(
  db: HydraTransaction,
  threadId: string,
  addedUserMessage: ThreadMessage,
  inProgressMessageId?: string | undefined,
) {
  const latestMessages = await db.query.messages.findMany({
    where: eq(schema.messages.threadId, threadId),
    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
  });

  // If we have an in-progress message (streaming), we need to check the message before it
  // Otherwise, we check the latest message
  const messageToCheck = inProgressMessageId
    ? latestMessages[1] // Check message before our in-progress message
    : latestMessages[0]; // Check latest message directly

  if (
    !(
      messageToCheck.id === addedUserMessage.id &&
      messageToCheck.createdAt.toISOString() ===
        addedUserMessage.createdAt.toISOString()
    )
  ) {
    throw new Error(
      "Latest message before write is not the same as the added user message",
    );
  }
}

export function threadMessageDtoToThreadMessage(
  messages: ThreadMessageDto[],
): ThreadMessage[] {
  return messages.map(
    (message): ThreadMessage => ({
      ...message,
      content: convertContentDtoToContentPart(message.content),
    }),
  );
}
