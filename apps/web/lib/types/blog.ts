import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export type PostItem = {
  id: string;
  title: string;
  date: string;
  category: string;
};

export type BlogPost = {
  id: string;
  title: string;
  category: string;
  date: string;
  author?: string;
  featuredImage?: string;
  readingTime?: string;
  mdxSource: MDXRemoteSerializeResult;
};

export const categoryDisplayMap: Record<string, string> = {
  new: "New",
  feature: "Feature",
  "bug fix": "Bug Fix",
  update: "Update",
  event: "Event",
};
