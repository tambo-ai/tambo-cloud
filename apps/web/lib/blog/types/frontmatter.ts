// Frontmatter types for blog posts
export interface BlogFrontmatter {
  title: string;
  excerpt?: string;
  category: BlogCategory;
  date: string; // ISO format: YYYY-MM-DD
  author?: string;
  featuredImage?: string;
  featured?: boolean;
  tags?: string[];
  readingTime?: string;
  draft?: boolean;
}

export type BlogCategory =
  | "new"
  | "feature"
  | "bug fix"
  | "update"
  | "event"
  | "tutorial"
  | "announcement";
