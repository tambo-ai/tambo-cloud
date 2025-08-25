"use client";

import { BlogPostListItem } from "@/lib/blog/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BlogBadge } from "./blog-badge";

interface BlogCardProps {
  post: BlogPostListItem;
  gradient?: string;
  className?: string;
}

export function BlogCard({ post, gradient, className }: BlogCardProps) {
  const defaultGradient = "bg-gradient-to-br from-gray-100 to-gray-200";

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className={cn("group cursor-pointer", className)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl h-48 p-6",
            "hover:shadow-lg transition-shadow",
            gradient || defaultGradient,
          )}
        >
          <div className="relative z-10 h-full flex flex-col">
            <BlogBadge
              category={post.category}
              className="mb-auto bg-white/90 text-gray-700 text-xs w-fit"
            />
            {post.featured && (
              <span className="text-xs font-semibold text-gray-600 mt-2">
                FEATURED
              </span>
            )}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold line-clamp-2 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">{post.date}</p>
        </div>
      </article>
    </Link>
  );
}
