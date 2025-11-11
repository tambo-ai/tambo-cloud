/**
 * Resource transformation utilities for converting MCP Resources to AI SDK-compatible content parts.
 *
 * This module handles fetching resources from MCP servers and converting them to formats
 * that can be passed to AI SDK providers (streamText, generateText, etc.).
 */

import {
  ChatCompletionContentPart,
  ChatCompletionContentPartResource,
  ContentPartType,
  Resource,
} from "@tambo-ai-cloud/core";
import { FilePart, ImagePart, TextPart } from "ai";

/**
 * Represents a successfully fetched and transformed resource
 */
export interface FetchedResourcePart {
  /** The MCP resource that was fetched */
  resource: Resource;
  /** The transformed AI SDK part (TextPart, FilePart, or ImagePart) */
  part: TextPart | FilePart | ImagePart;
}

/**
 * Fetch a resource from an MCP server by URI and transform it to an AI SDK compatible part.
 *
 * Supports multiple content formats:
 * - URI-based resources: fetched from the specified URI
 * - Text content: converted directly to TextPart
 * - Base64 blob data: converted to FilePart with appropriate MIME type
 *
 * @param resource - The MCP resource to fetch/transform
 * @param fetchFn - Function to fetch resource content by URI
 * @returns The transformed resource part, or undefined if transformation failed
 */
export async function transformResourceToContentPart(
  resource: Resource,
  fetchFn?: (uri: string) => Promise<{
    contents: Array<{ text?: string; blob?: string; mimeType?: string }>;
  }>,
): Promise<FetchedResourcePart | undefined> {
  try {
    // Case 1: Resource has inline text content
    if (resource.text) {
      return {
        resource,
        part: {
          type: "text",
          text: resource.text,
        },
      };
    }

    // Case 2: Resource has base64-encoded blob data
    if (resource.blob) {
      const mediaType = resource.mimeType || "application/octet-stream";
      const filePart: FilePart = {
        type: "file",
        data: resource.blob,
        mediaType,
        filename: resource.name,
      };
      return {
        resource,
        part: filePart,
      };
    }

    // Case 3: Resource has a URI - fetch the content
    if (resource.uri && fetchFn) {
      const result = await fetchFn(resource.uri);
      if (result.contents.length > 0) {
        const content = result.contents[0];

        // If fetched content is text
        if (content.text) {
          return {
            resource,
            part: {
              type: "text",
              text: content.text,
            },
          };
        }

        // If fetched content is blob
        if (content.blob) {
          const mediaType =
            content.mimeType || resource.mimeType || "application/octet-stream";

          // For image content, use ImagePart
          if (mediaType.startsWith("image/")) {
            return {
              resource,
              part: {
                type: "image",
                image: Buffer.from(content.blob, "base64"),
                mimeType: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
              } as ImagePart,
            };
          }

          // For non-image files, use FilePart
          return {
            resource,
            part: {
              type: "file",
              data: content.blob,
              mediaType,
            } as FilePart,
          };
        }
      }
    }

    console.warn(
      `Could not transform resource: no text, blob, or fetchable URI available`,
      resource,
    );
    return undefined;
  } catch (error) {
    console.error(`Error transforming resource:`, error);
    return undefined;
  }
}

/**
 * Transform a ChatCompletionContentPartResource to an AI SDK compatible content part.
 *
 * This is the main entry point for converting MCP resources in thread messages
 * to a format suitable for AI SDK providers.
 *
 * @param resourcePart - The resource content part from a thread message
 * @param fetchFn - Function to fetch resource content from MCP servers
 * @returns The transformed part (TextPart, FilePart, or ImagePart), or undefined if transformation failed
 */
export async function transformResourcePart(
  resourcePart: ChatCompletionContentPartResource,
  fetchFn?: (uri: string) => Promise<{
    contents: Array<{ text?: string; blob?: string; mimeType?: string }>;
  }>,
): Promise<TextPart | FilePart | ImagePart | undefined> {
  const result = await transformResourceToContentPart(
    resourcePart.resource,
    fetchFn,
  );
  return result?.part;
}

/**
 * Check if a content part is a resource type that needs transformation
 */
export function isResourceContentPart(
  part: ChatCompletionContentPart,
): part is ChatCompletionContentPartResource {
  return part.type === ContentPartType.Resource;
}

/**
 * Map of serverKey to fetch function.
 * This allows resource transformation to know which MCP server to fetch from.
 */
export type ResourceFetcherMap = Record<
  string,
  (uri: string) => Promise<{
    contents: Array<{ text?: string; blob?: string; mimeType?: string }>;
  }>
>;

/**
 * Extract serverKey from a resource name (e.g., "github:file" -> "github")
 */
export function extractServerKeyFromResourceName(
  resourceName?: string,
): string | undefined {
  if (!resourceName || !resourceName.includes(":")) {
    return undefined;
  }
  return resourceName.split(":")[0];
}
