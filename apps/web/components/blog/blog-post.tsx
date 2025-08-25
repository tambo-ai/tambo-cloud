"use client";

import { MDXRenderer } from "@/components/blog/mdx-renderer";
import { Badge } from "@/components/ui/badge";
import { categoryDisplayMap, type BlogPostType } from "@/lib/types/blog";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

export const BlogPost: FC<{ post: BlogPostType }> = ({ post }) => {
  const categoryDisplay = categoryDisplayMap[post.category] || "New";

  const readingTime = post.readingTime;
  const author = post.author || "Michael Magan";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    author: {
      "@type": "Person",
      name: post.author || "tambo team",
    },
    publisher: {
      "@type": "Organization",
      name: "tambo",
      logo: {
        "@type": "ImageObject",
        url: "/logo/icon/Octo-Icon.png",
      },
    },
    datePublished: post.dateISO,
    dateModified: post.dateISO,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tambo.co/blog/${post.id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-background">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Blog Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blog</span>
          </Link>

          {/* Featured Image (if exists) */}
          {post.featuredImage && (
            <div className="relative w-full h-96 mb-8 rounded-xl overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8">
            <Badge variant="secondary" className="mb-4 text-xs">
              {categoryDisplay}
            </Badge>

            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>{post.date}</span>
              <span>•</span>
              <span>{readingTime}</span>
              <span>•</span>
              <span>by {author}</span>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-16">
            <MDXRenderer
              source={post.mdxSource}
              className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            />
          </div>
        </article>
      </div>
    </>
  );
};
