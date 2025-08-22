import BlogPost from "@/components/blog/blog-post";
import { getPostData } from "@/lib/blog-service";
import { notFound } from "next/navigation";

const Post = async ({ params }: { params: { slug: string } }) => {
  const { slug } = await params;

  try {
    const postData = await getPostData(slug);
    return <BlogPost post={postData} />;
  } catch (_error) {
    notFound();
  }
};

export default Post;
