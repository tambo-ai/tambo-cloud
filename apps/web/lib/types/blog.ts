import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export type PostItem = {
  id: string;
  title: string;
  date: string;
  dateISO?: string;
  category: string;
  excerpt?: string;
};

export type BlogPostType = {
  id: string;
  title: string;
  category: string;
  date: string;
  dateISO: string;
  author?: string;
  featuredImage?: string;
  readingTime?: string;
  excerpt?: string;
  tags?: string[];
  mdxSource: MDXRemoteSerializeResult;
};

export const categoryDisplayMap: Record<string, string> = {
  new: "New",
  feature: "Feature",
  "bug fix": "Bug Fix",
  update: "Update",
  event: "Event",
};
