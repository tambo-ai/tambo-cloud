import {
  ChatCompletionContentPart,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import { ChatCompletionContentPartDto } from "../dto/message.dto";

export function convertContentDtoToContentPart(
  content: string | ChatCompletionContentPartDto[],
): ChatCompletionContentPart[] {
  if (!Array.isArray(content)) {
    return [{ type: ContentPartType.Text, text: content }];
  }
  return content
    .map((part): ChatCompletionContentPart | null => {
      switch (part.type) {
        case ContentPartType.Text:
          if (!part.text) {
            throw new Error("Text content is required for text type");
          }
          return {
            type: ContentPartType.Text,
            text: part.text,
          };
        case ContentPartType.ImageUrl:
          return {
            type: ContentPartType.ImageUrl,
            image_url: part.image_url ?? {
              url: "",
              detail: "auto",
            },
          };
        case ContentPartType.InputAudio:
          return {
            type: ContentPartType.InputAudio,
            input_audio: part.input_audio ?? {
              data: "",
              format: "wav",
            },
          };
        case "resource" as ContentPartType:
          // TODO: we get back "resource" from MCP servers, but it is not supported yet
          console.warn(
            "Ignoring 'resource' content part: it is not supported yet",
            part,
          );
          return null;
        default:
          throw new Error(`Unknown content part type: ${part.type}`);
      }
    })
    .filter((part): part is ChatCompletionContentPart => !!part);
}

export function convertContentPartToDto(
  part: ChatCompletionContentPart[] | string,
): ChatCompletionContentPartDto[] {
  if (typeof part === "string") {
    return [{ type: ContentPartType.Text, text: part }];
  }
  return part as ChatCompletionContentPartDto[];
}

export function tryParseJson(text: string): any {
  // we are assuming that JSON is only ever an object or an array,
  // so we don't need to check for other types of JSON structures
  if (!text.startsWith("{") && !text.startsWith("[")) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}
