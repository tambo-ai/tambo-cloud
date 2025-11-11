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
  ThreadMessage,
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

/**
 * Resource content that has been fetched and cached
 */
interface FetchedResourceContent {
  text?: string;
  blob?: string;
  mimeType?: string;
}

/**
 * Pre-fetch all resources from thread messages and cache them inline.
 * This converts URI-based resources to cached text/blob resources.
 *
 * Strategy:
 * 1. Extract all unique resource URIs from messages
 * 2. Fetch them in parallel into a map (uri -> content)
 * 3. Apply the map to messages to cache content inline
 *
 * This approach:
 * - Handles duplicates efficiently (fetch once, use many times)
 * - Gracefully handles fetch failures
 * - Keeps async work in one phase, then does synchronous message updates
 *
 * @param messages - Thread messages potentially containing resources
 * @param resourceFetchers - Map of serverKey to fetch functions
 * @returns New messages with fetched resources cached as text/blob
 */
export async function prefetchAndCacheResources(
  messages: ThreadMessage[],
  resourceFetchers?: ResourceFetcherMap,
): Promise<ThreadMessage[]> {
  if (!resourceFetchers) {
    return messages;
  }

  // Phase 1: Extract all unique resource URIs that need fetching
  const urisToFetch = new Map<
    string,
    {
      uri: string;
      serverKey?: string;
      fetchFn: (
        uri: string,
      ) => Promise<{ contents: Array<FetchedResourceContent> }>;
    }
  >();

  for (const message of messages) {
    if (!Array.isArray(message.content)) {
      continue;
    }

    for (const part of message.content) {
      if (
        part.type !== ContentPartType.Resource ||
        !isResourceContentPart(part)
      ) {
        continue;
      }

      const resource = part.resource;

      // Skip if already has content
      if (resource.text || resource.blob) {
        continue;
      }

      // Skip if no URI to fetch
      if (!resource.uri) {
        continue;
      }

      // Skip if we've already queued this URI
      if (urisToFetch.has(resource.uri)) {
        continue;
      }

      // Find fetcher for this resource's serverKey
      const serverKey = extractServerKeyFromResourceName(resource.name);
      const fetchFn = serverKey ? resourceFetchers[serverKey] : undefined;

      if (!fetchFn) {
        console.warn(
          `No fetcher available for resource with serverKey: ${serverKey}`,
        );
        continue;
      }

      urisToFetch.set(resource.uri, { uri: resource.uri, serverKey, fetchFn });
    }
  }

  // Phase 2: Fetch all unique URIs in parallel
  const fetchedContent = new Map<string, FetchedResourceContent>();

  await Promise.all(
    Array.from(urisToFetch.entries()).map(async ([uri, { fetchFn }]) => {
      try {
        const result = await fetchFn(uri);
        if (result.contents.length > 0) {
          fetchedContent.set(uri, result.contents[0]);
        }
      } catch (error) {
        // Make sure not to throw an error here, so we do not break other resource fetches
        console.error(`Error fetching resource ${uri}:`, error);
      }
    }),
  );

  // Phase 3: Apply cached content to messages
  return messages.map((message) => {
    if (!Array.isArray(message.content)) {
      return message;
    }

    const transformedContent = message.content.map((part) => {
      if (
        part.type !== ContentPartType.Resource ||
        !isResourceContentPart(part)
      ) {
        return part;
      }

      const resource = part.resource;

      // Skip if already has content
      if (resource.text || resource.blob || !resource.uri) {
        return part;
      }

      // Check if we fetched content for this URI
      const content = fetchedContent.get(resource.uri);
      if (!content) {
        return part;
      }

      // Cache the fetched content back into the resource
      const cachedResource: ChatCompletionContentPartResource = {
        type: ContentPartType.Resource,
        resource: {
          ...resource,
          text: content.text,
          blob: content.blob,
          mimeType: content.mimeType || resource.mimeType,
        },
      };

      return cachedResource;
    });

    return {
      ...message,
      content: transformedContent,
    };
  });
}

/**
 * Extract all Resource content parts from messages for pre-fetching.
 * Useful for identifying which resources need to be fetched upfront.
 */
export function extractResourcesFromMessages(
  messages: ThreadMessage[],
): ChatCompletionContentPartResource[] {
  const resources: ChatCompletionContentPartResource[] = [];

  for (const message of messages) {
    for (const part of message.content) {
      if (isResourceContentPart(part)) {
        resources.push(part);
      }
    }
  }

  return resources;
}
