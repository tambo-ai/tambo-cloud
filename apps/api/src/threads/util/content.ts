import {
  ChatCompletionContentPart,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import type OpenAI from "openai";
import { ChatCompletionContentPartDto } from "../dto/message.dto";

/**
 * Convert a serialized content part to a content part that can be consumed by an LLM.
 * Note: File types are filtered out and logged as they are not yet fully supported.
 * Returns only OpenAI-compatible content parts for storage and LLM consumption.
 */
export function convertContentDtoToContentPart(
  content: string | ChatCompletionContentPartDto[],
): OpenAI.Chat.Completions.ChatCompletionContentPart[] {
  if (!Array.isArray(content)) {
    return [{ type: ContentPartType.Text, text: content }];
  }
  return content
    .map((part): OpenAI.Chat.Completions.ChatCompletionContentPart | null => {
      switch (part.type) {
        case ContentPartType.Text:
          // empty strings are ok, but undefined/null is not
          if (!part.text && typeof part.text !== "string") {
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
        case ContentPartType.File:
          // TODO: Handle File types - Storage strategy:
          // - For large text content (>100KB): store in S3, replace with S3 URI
          // - For large blobs (>100KB): store in S3, replace with S3 URI
          // - For URIs: fetch content if needed, optionally cache in S3
          // - Store file metadata (name, mimeType, description) in database
          // - Add S3 path/key to database for retrieval
          // For now, filter out File types as they are not stored in the database
          console.warn(
            "File content part received but storage not yet implemented - filtering out",
            {
              hasUri: !!part.file?.uri,
              hasText: !!part.file?.text,
              hasBlob: !!part.file?.blob,
              name: part.file?.name,
              mimeType: part.file?.mimeType,
            },
          );
          return null;
        case "resource" as ContentPartType:
          // MCP servers return "resource" - treat as File type, but filter out for now
          console.warn(
            'Filtering out legacy "resource" content part (would be "file" type) - not yet stored in database',
            part,
          );
          return null;
        default:
          throw new Error(`Unknown content part type: ${part.type}`);
      }
    })
    .filter(
      (part): part is OpenAI.Chat.Completions.ChatCompletionContentPart =>
        !!part,
    );
}

/**
 * Convert a string or array of LLM content parts to a serialized content part
 */
export function convertContentPartToDto(
  part: ChatCompletionContentPart[] | string,
): ChatCompletionContentPartDto[] {
  if (typeof part === "string") {
    return [{ type: ContentPartType.Text, text: part }];
  }
  return part as ChatCompletionContentPartDto[];
}

/**
 * Try to parse a string as JSON, returning the original string if it is not valid JSON
 */
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
