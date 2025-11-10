import {
  ChatCompletionContentPart,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import mimeTypes from "mime-types";
import { StorageService } from "../../common/services/storage.service";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

const SUPPORTED_APPLICATION_TYPES = new Set(["application/pdf"]);

const SUPPORTED_TYPE_DESCRIPTION =
  "PDF, plain text, Markdown, CSV, JPEG, and PNG files";

function normalizeMimeType(
  rawMimeType: string | undefined,
  filename: string | undefined,
  path: string,
): string | undefined {
  const trimmed = rawMimeType?.trim();
  if (
    trimmed &&
    trimmed !== "" &&
    trimmed !== "application/octet-stream" &&
    trimmed !== "undefined" &&
    trimmed !== "null"
  ) {
    return trimmed;
  }

  const candidates = [
    filename?.trim(),
    (() => {
      const segments = path.split("/");
      return segments[segments.length - 1];
    })(),
  ].filter((value): value is string => !!value && value.trim().length > 0);

  for (const candidate of candidates) {
    const detected = mimeTypes.lookup(candidate);
    if (typeof detected === "string") {
      return detected;
    }
  }

  return undefined;
}

function isImageMimeType(mimeType: string): boolean {
  if (SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    return true;
  }
  return mimeType.startsWith("image/");
}

function isSupportedMimeType(mimeType: string): boolean {
  if (isImageMimeType(mimeType)) {
    return true;
  }
  if (mimeType.startsWith("text/")) {
    return true;
  }
  return SUPPORTED_APPLICATION_TYPES.has(mimeType);
}

function toSafeFilename(filename: string | undefined, path: string): string {
  if (filename && filename.trim()) {
    return filename.trim();
  }
  const pathSegments = path.split("/");
  const fallback = pathSegments[pathSegments.length - 1];
  return fallback && fallback.trim() ? fallback.trim() : "file";
}

export async function processStorageUrls(
  content: ChatCompletionContentPart[],
  storageService: StorageService,
): Promise<ChatCompletionContentPart[]> {
  return await Promise.all(
    content.map(async (part) => {
      if (
        part.type === "image_url" &&
        part.image_url.url.startsWith("storage://")
      ) {
        const path = part.image_url.url.replace("storage://", "");
        const signedUrl = await storageService.getSignedUrl(path);
        return { ...part, image_url: { ...part.image_url, url: signedUrl } };
      }
      if (part.type === "text" && part.text.startsWith("storage://")) {
        const [rawPath = "", rawMimeType = "", rawFilename = ""] = part.text
          .replace("storage://", "")
          .split("|");

        const path = rawPath.trim();
        if (!path) {
          throw new Error(
            "Invalid storage reference: missing path component in message content.",
          );
        }

        const filename = rawFilename.trim();
        const normalizedMimeType = normalizeMimeType(
          rawMimeType,
          filename,
          path,
        );

        if (!normalizedMimeType) {
          throw new Error(
            `Unsupported file type for "${filename || path}". Supported types: ${SUPPORTED_TYPE_DESCRIPTION}`,
          );
        }

        if (isImageMimeType(normalizedMimeType)) {
          const signedUrl = await storageService.getSignedUrl(path);
          return {
            type: "image_url" as const,
            image_url: { url: signedUrl, detail: "auto" },
          };
        }

        if (!isSupportedMimeType(normalizedMimeType)) {
          throw new Error(
            `Unsupported file type "${normalizedMimeType}" for file "${filename || path}". Supported types: ${SUPPORTED_TYPE_DESCRIPTION}`,
          );
        }

        try {
          const signedUrl = await storageService.getSignedUrl(path);
          const resolvedFilename = toSafeFilename(filename, path);
          return {
            type: ContentPartType.Resource,
            resource: {
              uri: signedUrl,
              name: resolvedFilename,
              mimeType: normalizedMimeType,
            },
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to process document "${filename || path}": ${message}`,
          );
        }
      }
      return part;
    }),
  );
}
