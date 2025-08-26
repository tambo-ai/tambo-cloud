import type { BlogCategory, BlogPostListItem } from "@/lib/blog/types";
import { normalizePages } from "nextra/normalize-pages";
import { getPageMap } from "nextra/page-map";

// Define our blog post types
export interface BlogFrontMatter {
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  author?: string;
  category?: string;
  featured?: boolean;
}

export interface BlogPost {
  name: string;
  route: string;
  frontMatter: BlogFrontMatter;
  content?: string;
}

// Helper to determine category from tags or frontmatter
function determineCategory(frontMatter: BlogFrontMatter): BlogCategory {
  // Check if category is explicitly set
  if (frontMatter.category) {
    // Validate it's a valid category
    const validCategories: BlogCategory[] = [
      "new",
      "feature",
      "bug fix",
      "update",
      "event",
      "tutorial",
      "announcement",
    ];
    if (validCategories.includes(frontMatter.category as BlogCategory)) {
      return frontMatter.category as BlogCategory;
    }
  }

  // Fallback to first tag or default
  const firstTag = frontMatter.tags?.[0]?.toLocaleLowerCase();
  if (firstTag) {
    if (firstTag === "new") return "new";
    if (firstTag === "feature") return "feature";
    if (firstTag === "bug fix" || firstTag === "bugfix") return "bug fix";
    if (firstTag === "update") return "update";
    if (firstTag === "event") return "event";
    if (firstTag === "tutorial") return "tutorial";
    if (firstTag === "announcement") return "announcement";
  }

  // Default category
  return "update";
}

export async function getPosts(): Promise<BlogPost[]> {
  const pageMap = await getPageMap("/blog/posts");
  const { directories } = normalizePages({
    list: pageMap,
    route: "/blog/posts",
  });

  // Filter and transform the posts with proper typing
  const posts = directories
    .filter((item: any) => item.name !== "index" && item.frontMatter)
    .map((item: any) => ({
      name: item.name,
      route: item.route,
      content: item.content || "",
      frontMatter: {
        title: item.frontMatter.title || "",
        date: item.frontMatter.date || new Date().toISOString(),
        description: item.frontMatter.description,
        tags: item.frontMatter.tags,
        author: item.frontMatter.author,
        category: item.frontMatter.category,
        featured: item.frontMatter.featured,
      },
    }))
    .sort(
      (a, b) =>
        new Date(b.frontMatter.date).getTime() -
        new Date(a.frontMatter.date).getTime(),
    );

  return posts;
}

// Transform posts to BlogPostListItem format
export async function getPostListItems(): Promise<BlogPostListItem[]> {
  const posts = await getPosts();

  return posts.map((post) => {
    const slug = post.name;
    const category = determineCategory(post.frontMatter);

    return {
      id: slug,
      slug,
      title: post.frontMatter.title,
      category,
      date: post.frontMatter.date,
      dateISO: post.frontMatter.date,
      featured: post.frontMatter.featured,
      author: post.frontMatter.author,
      tags: post.frontMatter.tags || [],
    };
  });
}

export async function getTags(): Promise<string[]> {
  const posts = await getPosts();
  const tags = posts.flatMap((post) => post.frontMatter.tags || []);
  return tags;
}
