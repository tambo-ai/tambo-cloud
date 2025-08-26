import { normalizePages } from "nextra/normalize-pages";
import { getPageMap } from "nextra/page-map";

// Define our blog post types
export interface BlogFrontMatter {
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  author?: string;
}

export interface BlogPost {
  name: string;
  route: string;
  frontMatter: BlogFrontMatter;
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
      frontMatter: {
        title: item.frontMatter.title || "",
        date: item.frontMatter.date || new Date().toISOString(),
        description: item.frontMatter.description,
        tags: item.frontMatter.tags,
        author: item.frontMatter.author,
      },
    }))
    .sort(
      (a, b) =>
        new Date(b.frontMatter.date).getTime() -
        new Date(a.frontMatter.date).getTime(),
    );

  return posts;
}

export async function getTags(): Promise<string[]> {
  const posts = await getPosts();
  const tags = posts.flatMap((post) => post.frontMatter.tags || []);
  return tags;
}
