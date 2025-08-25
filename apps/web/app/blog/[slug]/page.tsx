import { BlogPost } from "@/components/blog/blog-post";
import { getPostData } from "@/lib/blog-service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const postData = await getPostData(slug);
    return {
      title: postData.title,
      description:
        postData.excerpt ||
        `Read ${postData.title} by ${postData.author || "tambo team"}`,
      authors: postData.author ? [{ name: postData.author }] : undefined,
      openGraph: {
        title: postData.title,
        description:
          postData.excerpt ||
          `Read ${postData.title} by ${postData.author || "tambo team"}`,
        type: "article",
        publishedTime: postData.dateISO,
        authors: postData.author ? [postData.author] : undefined,
        images: postData.featuredImage
          ? [
              {
                url: postData.featuredImage,
                width: 1200,
                height: 630,
                alt: postData.title,
              },
            ]
          : undefined,
        siteName: "tambo blog",
      },
      twitter: {
        card: "summary_large_image",
        title: postData.title,
        description:
          postData.excerpt ||
          `Read ${postData.title} by ${postData.author || "tambo team"}`,
        images: postData.featuredImage ? [postData.featuredImage] : undefined,
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

const Post = async ({ params: { slug } }: { params: { slug: string } }) => {
  try {
    const postData = await getPostData(slug);
    return <BlogPost post={postData} />;
  } catch {
    notFound();
  }
};

export default Post;
