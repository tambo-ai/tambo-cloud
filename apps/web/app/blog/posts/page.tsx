import Link from "next/link";
import { PostCard } from "../components/post-card";
import { getPosts, getTags } from "./get-posts";

export const metadata = {
  title: "All Posts | Tambo Blog",
};

interface TagCount {
  [key: string]: number;
}

export default async function PostsPage() {
  const tags = await getTags();
  const posts = await getPosts();
  const allTags: TagCount = Object.create(null);

  for (const tag of tags) {
    allTags[tag] ??= 0;
    allTags[tag] += 1;
  }

  return (
    <div data-pagefind-ignore="all">
      <h1 className="text-4xl font-bold mb-6">All Posts</h1>

      {/* Tags Section */}
      {Object.keys(allTags).length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {Object.entries(allTags).map(([tag, count]) => (
            <Link
              key={tag}
              href={`/blog/tags/${encodeURIComponent(tag)}`}
              className="nextra-tag"
            >
              {tag} ({count})
            </Link>
          ))}
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 mt-8">
          No posts yet. Check back soon!
        </p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.route} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
