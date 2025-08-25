import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import type { BlogCategory, BlogFrontmatter } from "./frontmatter";

export interface BlogPost extends BlogFrontmatter {
  id: string;
  slug: string;
  dateISO: string;
  formattedDate: string;
  readingTime: string;
  mdxSource?: MDXRemoteSerializeResult;
}

export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  date: string;
  dateISO: string;
  featured?: boolean;
  author?: string;
  tags?: string[];
}
