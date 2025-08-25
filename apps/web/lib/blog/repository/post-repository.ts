import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { POSTS_DIRECTORY } from "../constants";
import type { BlogFrontmatter } from "../types";

export class PostRepository {
  private postsDirectory: string;

  constructor() {
    this.postsDirectory = path.join(process.cwd(), POSTS_DIRECTORY);
  }

  getAllPostFiles(): string[] {
    try {
      return fs
        .readdirSync(this.postsDirectory)
        .filter((file) => file.endsWith(".mdx"));
    } catch (error) {
      console.error("Error reading posts directory:", error);
      return [];
    }
  }

  getPostContent(
    slug: string,
  ): { content: string; data: BlogFrontmatter } | null {
    try {
      const fullPath = path.join(this.postsDirectory, `${slug}.mdx`);
      const fileContents = fs.readFileSync(fullPath, "utf-8");
      const { content, data } = matter(fileContents);

      return {
        content,
        data: data as BlogFrontmatter,
      };
    } catch (error) {
      console.error(`Error reading post ${slug}:`, error);
      return null;
    }
  }

  postExists(slug: string): boolean {
    const fullPath = path.join(this.postsDirectory, `${slug}.mdx`);
    return fs.existsSync(fullPath);
  }
}
