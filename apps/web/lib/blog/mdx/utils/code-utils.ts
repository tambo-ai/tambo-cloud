import hljs from "highlight.js";
import type { ReactNode } from "react";
import { CODE_INDICATORS } from "../constants";

export function looksLikeCode(text: string): boolean {
  return CODE_INDICATORS.some((pattern) => pattern.test(text));
}

export function extractTextContent(children: ReactNode): string {
  if (typeof children === "string") {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(extractTextContent).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return extractTextContent(children.props.children);
  }

  return String(children || "");
}

export function highlightCode(
  content: string,
  language?: string,
): string | null {
  if (!language || !looksLikeCode(content)) return null;

  try {
    return hljs.highlight(content, { language }).value;
  } catch {
    return content;
  }
}

export function extractLanguageFromClassName(
  className?: string,
): string | undefined {
  const match = /language-(\w+)/.exec(className ?? "");
  return match?.[1];
}
