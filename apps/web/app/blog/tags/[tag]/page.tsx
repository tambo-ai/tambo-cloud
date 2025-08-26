import { PostCard } from "../../components/post-card";
import { getPosts, getTags } from "../../posts/get-posts";

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export async function generateMetadata(props: TagPageProps) {
  const params = await props.params;
  return {
    title: `Posts Tagged with "${decodeURIComponent(params.tag)}" | Tambo Blog`,
  };
}

export async function generateStaticParams() {
  const allTags = await getTags();
  return [...new Set(allTags)].map((tag) => ({ tag }));
}

export default async function TagPage(props: TagPageProps) {
  const params = await props.params;
  const { title } = await generateMetadata({ params: Promise.resolve(params) });
  const posts = await getPosts();

  const filteredPosts = posts.filter((post) =>
    post.frontMatter.tags?.includes(decodeURIComponent(params.tag)),
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      {filteredPosts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No posts found with this tag.
        </p>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.route} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
