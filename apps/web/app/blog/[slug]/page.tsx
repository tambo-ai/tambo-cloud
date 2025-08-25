import { BlogPost as BlogPostComponent } from "@/components/blog/blog-post";
import { PostService } from "@/lib/blog/services/post-service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

const getPostCached = cache(async (slug: string) => {
  const postService = new PostService();
  return await postService.getPost(slug);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await getPostCached(slug);
    if (!post) throw new Error("Post not found");

    return {
      title: post.title,
      description: post.excerpt,
      authors: post.author ? [{ name: post.author }] : undefined,
      openGraph: {
        title: post.title,
        description:
          post.excerpt ||
          `Read ${post.title} by ${post.author || "tambo team"}`,
        type: "article",
        publishedTime: post.dateISO,
        authors: post.author ? [post.author] : undefined,
        images: post.featuredImage
          ? [
              {
                url: post.featuredImage,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : undefined,
        siteName: "tambo blog",
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description:
          post.excerpt ||
          `Read ${post.title} by ${post.author || "tambo team"}`,
        images: post.featuredImage ? [post.featuredImage] : undefined,
      },
      alternates: { canonical: `/blog/${slug}` },
    };
  } catch {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }
}

const PostPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  try {
    const post = await getPostCached(slug);
    if (!post) notFound();

    const postService = new PostService();
    const relatedPosts = postService.getRelatedPosts(slug);

    return <BlogPostComponent post={post} relatedPosts={relatedPosts} />;
  } catch {
    notFound();
  }
};

export default PostPage;
