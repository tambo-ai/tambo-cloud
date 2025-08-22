import BlogPage from "@/components/blog/blog-page";
import { getSortedPosts } from "@/lib/blog-service";

const Blog = () => {
  const allPosts = getSortedPosts();

  return <BlogPage posts={allPosts} />;
};

export default Blog;
