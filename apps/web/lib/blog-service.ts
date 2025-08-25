import fs from "fs";
import matter from "gray-matter";
import path from "path";
import type { PostItem } from "@/lib/types/blog";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

const postsDirectory = path.join(process.cwd(), "posts");

export const getSortedPosts = (): PostItem[] => {
  try {
    const fileNames = fs.readdirSync(postsDirectory);

    if (fileNames.length > 0) {
      const allPostsData = fileNames.map((fileName) => {
        const id = fileName.replace(/\.mdx$/, "");

        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf-8");

        const matterResult = matter(fileContents);

        return {
          id,
          title: matterResult.data.title,
          date: matterResult.data.date,
          category: matterResult.data.category,
        };
      });

      return allPostsData.sort((a, b) => {
        const dateOne = new Date(a.date);
        const dateTwo = new Date(b.date);
        if (dateOne < dateTwo) {
          return -1;
        } else if (dateOne > dateTwo) {
          return 1;
        } else {
          return 0;
        }
      });
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
    if (!categorisedPosts[post.category]) {
      categorisedPosts[post.category] = [];
    }
    categorisedPosts[post.category].push(post);
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

    return {
      id,
      mdxSource,
      title: matterResult.data.title,
      category: matterResult.data.category,
      date: new Date(matterResult.data.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      author: matterResult.data.author,
      featuredImage: matterResult.data.featuredImage,
      readingTime: matterResult.data.readingTime,
    };
  } catch {
    throw new Error("Post not found");
  }
};
