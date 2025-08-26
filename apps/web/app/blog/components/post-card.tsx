import Link from "next/link";
import type { BlogPost } from "../posts/get-posts";

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="post-card">
      <h3 className="post-card-title">
        <Link href={post.route} className="hover:text-blue-600">
          {post.frontMatter.title}
        </Link>
      </h3>

      {post.frontMatter.description && (
        <p className="post-card-description">{post.frontMatter.description}</p>
      )}

      <div className="post-card-meta">
        {post.frontMatter.date && (
          <time dateTime={post.frontMatter.date}>
            {new Date(post.frontMatter.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}

        {post.frontMatter.author && <span>by {post.frontMatter.author}</span>}

        {post.frontMatter.tags && post.frontMatter.tags.length > 0 && (
          <div className="flex gap-2">
            {post.frontMatter.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/blog/tags/${encodeURIComponent(tag)}`}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
