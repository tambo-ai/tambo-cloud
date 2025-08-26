import { WORDS_PER_MINUTE } from "../constants";

export function calculateReadingTime(content: string): string {
  const cleanText = content
    .replace(/^---[\s\S]*?---/, "") // Remove frontmatter
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Extract link text
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/~~(.*?)~~/g, "$1") // Remove strikethrough
    .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered lists
    .replace(/^\s*>\s+/gm, "") // Remove blockquotes
    .replace(/\n+/g, " ") // Replace newlines
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();

  const wordCount = cleanText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  return `${minutes} min read`;
}
