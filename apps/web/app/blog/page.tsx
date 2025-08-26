import Link from "next/link";
import { PostCard } from "./components/post-card";
import { getPosts } from "./posts/get-posts";

export const metadata = {
  title: "Tambo Blog",
  description:
    "Welcome to the Tambo blog - insights about AI, development, and technology",
};

export default async function BlogHomePage() {
  const posts = await getPosts();
  const recentPosts = posts.slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Tambo Blog</h1>
        <div className="text-gray-700 dark:text-gray-300">
          <p>
            Welcome to the Tambo blog! We share insights about AI agents,
            development best practices, and the latest updates from our
            platform.
          </p>
        </div>
        <hr className="my-8 border-gray-200 dark:border-gray-700" />
      </div>

      {/* Recent Posts Section */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Recent Posts</h2>

        {recentPosts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No posts yet. Check back soon!
          </p>
        ) : (
          <div className="space-y-6">
            {recentPosts.map((post) => (
              <PostCard key={post.route} post={post} />
            ))}
          </div>
        )}

        {posts.length > 3 && (
          <div className="mt-8">
            <Link
              href="/blog/posts"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all posts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
