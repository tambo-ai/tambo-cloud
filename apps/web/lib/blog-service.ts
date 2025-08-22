import fs from "fs";
import matter from "gray-matter";
import moment from "moment";
import path from "path";
import type { PostItem } from "@/lib/types/blog";
import { serialize } from "next-mdx-remote/serialize";
import rehypeHighlight from "rehype-highlight";
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
        const format = "DD-MM-YYYY";
        const dateOne = moment(a.date, format);
        const dateTwo = moment(b.date, format);
        if (dateOne.isBefore(dateTwo)) {
          return -1;
        } else if (dateTwo.isAfter(dateOne)) {
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
        rehypePlugins: [rehypeHighlight],
      },
    });

    return {
      id,
      mdxSource,
      title: matterResult.data.title,
      category: matterResult.data.category,
      date: moment(matterResult.data.date, "DD-MM-YYYY").format(
        "MMMM Do, YYYY",
      ),
      author: matterResult.data.author,
      featuredImage: matterResult.data.featuredImage,
      readingTime: matterResult.data.readingTime,
    };
  } catch {
    throw new Error("Post not found");
  }
};
