import { BlogPage as BlogPageComponent } from "@/components/blog/blog-page";
import { PostService } from "@/lib/blog/services/post-service";
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

const BlogPage = () => {
  const postService = new PostService();
  const allPosts = postService.getAllPosts();
  const featuredPosts = postService.getFeaturedPosts();

  return <BlogPageComponent posts={allPosts} featuredPosts={featuredPosts} />;
};

export default BlogPage;
