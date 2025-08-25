import { BlogPage } from "@/components/blog/blog-page";
import { getSortedPosts } from "@/lib/blog-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "blog",
  description:
    "Latest updates, tutorials, and insights about tambo - the AI orchestration framework for React frontends.",
  openGraph: {
    title: "blog",
    description:
      "Latest updates, tutorials, and insights about tambo - the AI orchestration framework for React frontends.",
    type: "website",
    siteName: "blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "blog",
    description:
      "Latest updates, tutorials, and insights about tambo - the AI orchestration framework for React frontends.",
  },
  alternates: {
    canonical: "/blog",
  },
};

const Blog = () => {
  const allPosts = getSortedPosts();

  return <BlogPage posts={allPosts} />;
};

export default Blog;
