import type { BlogCategory } from "./frontmatter";

export * from "./frontmatter";
export * from "./post";

export interface BlogFilter {
  category?: BlogCategory;
  searchQuery?: string;
  tags?: string[];
}

export interface BlogSortOptions {
  field: "date" | "title";
  order: "asc" | "desc";
}
