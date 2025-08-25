import type { PostItem } from "@/lib/types/blog";
import fs from "fs";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import path from "path";
import remarkGfm from "remark-gfm";

const postsDirectory = path.join(process.cwd(), "posts");

// Helper function to extract excerpt from content
const extractExcerpt = (content: string, maxLength: number = 160): string => {
  // Remove markdown syntax and get plain text
  const plainText = content
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();

  if (plainText.length <= maxLength) return plainText;

  // Find the last complete sentence within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf(".");

  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1);
  }

  // If no sentence break, find last word
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace) + "...";
};

const calculateReadingTime = (content: string): string => {
  const wordsPerMinute = 200;

  const cleanText = content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = cleanText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  return `${minutes} min read`;
};

export const getSortedPosts = (): PostItem[] => {
  try {
    const fileNames = fs.readdirSync(postsDirectory);

    if (fileNames.length > 0) {
      const allPostsData = fileNames.map((fileName) => {
        const id = fileName.replace(/\.mdx$/, "");
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf-8");
        const matterResult = matter(fileContents);
        const rawDate = String(matterResult.data.date ?? "");
        if (!/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
          throw new Error(
            `Invalid date "${rawDate}". Use ISO format YYYY-MM-DD.`,
          );
        }
        const displayDate = new Date(rawDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const category = String(matterResult.data.category ?? "").toLowerCase();

        return {
          id,
          title: matterResult.data.title,
          date: displayDate,
          dateISO: rawDate,
          category,
          excerpt:
            matterResult.data.excerpt || extractExcerpt(matterResult.content),
          featured: matterResult.data.featured,
        };
      });

      return allPostsData.sort(
        (a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime(),
      );
    }

    return [];
  } catch {
    throw new Error("Error getting sorted posts");
  }
};

export const getCategorisedPosts = (): Record<string, PostItem[]> => {
  const sortedPosts = getSortedPosts();
  const categorisedPosts: Record<string, PostItem[]> = {};

  sortedPosts.forEach((post) => {
    const key = post.category.toLowerCase();
    if (!categorisedPosts[key]) categorisedPosts[key] = [];
    categorisedPosts[key].push(post);
  });

  return categorisedPosts;
};

export const getPostData = async (id: string) => {
  try {
    const fullPath = path.join(postsDirectory, `${id}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf-8");
    const matterResult = matter(fileContents);

    const mdxSource = await serialize(matterResult.content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [],
      },
    });

    const rawCategory = String(matterResult.data.category ?? "").toLowerCase();
    const rawDate = String(matterResult.data.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      throw new Error(`Invalid date "${rawDate}". Use ISO format YYYY-MM-DD.`);
    }

    const formattedDate = new Date(rawDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const calculatedReadingTime = calculateReadingTime(matterResult.content);

    return {
      id,
      mdxSource,
      title: matterResult.data.title,
      category: rawCategory,
      date: formattedDate,
      dateISO: rawDate,
      author: matterResult.data.author,
      featuredImage: matterResult.data.featuredImage,
      readingTime: matterResult.data.readingTime || calculatedReadingTime,
      excerpt:
        matterResult.data.excerpt || extractExcerpt(matterResult.content),
      tags: matterResult.data.tags || [],
      featured: matterResult.data.featured,
    };
  } catch {
    throw new Error("Post not found");
  }
};
