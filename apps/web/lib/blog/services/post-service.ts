import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { PostRepository } from "../repository/post-repository";
import type {
  BlogFilter,
  BlogPost,
  BlogPostListItem,
  BlogSortOptions,
} from "../types";
import { formatDate, validateISODate } from "../utils/date";
import { extractExcerpt } from "../utils/excerpt";
import { calculateReadingTime } from "../utils/reading-time";

const readingTimeCache = new Map<string, string>();

export class PostService {
  private repository: PostRepository;

  constructor() {
    this.repository = new PostRepository();
  }

  async getPost(slug: string): Promise<BlogPost | null> {
    const postData = this.repository.getPostContent(slug);
    if (!postData) return null;

    const { content, data } = postData;

    if (!validateISODate(data.date)) {
      throw new Error(`Invalid date "${data.date}" in post ${slug}`);
    }

    const mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [],
      },
    });

    let readingTime = data.readingTime;
    if (!readingTime) {
      if (readingTimeCache.has(slug)) {
        readingTime = readingTimeCache.get(slug)!;
      } else {
        readingTime = calculateReadingTime(content);
        readingTimeCache.set(slug, readingTime);
      }
    }

    return {
      id: slug,
      slug,
      title: data.title,
      excerpt: data.excerpt || extractExcerpt(content),
      category: data.category,
      date: formatDate(data.date),
      dateISO: data.date,
      formattedDate: formatDate(data.date),
      author: data.author,
      featuredImage: data.featuredImage,
      featured: data.featured,
      readingTime,
      tags: data.tags || [],
      mdxSource,
    };
  }

  getAllPosts(): BlogPostListItem[] {
    const files = this.repository.getAllPostFiles();

    const posts = files
      .map((file) => {
        const slug = file.replace(/\.mdx$/, "");
        const postData = this.repository.getPostContent(slug);

        if (!postData) return null;

        const { content, data } = postData;

        if (!validateISODate(data.date)) {
          console.error(`Invalid date in ${slug}`);
          return null;
        }

        return {
          id: slug,
          slug,
          title: data.title,
          excerpt: data.excerpt || extractExcerpt(content),
          category: data.category,
          date: formatDate(data.date),
          dateISO: data.date,
          featured: data.featured,
          author: data.author,
          tags: data.tags || [],
        };
      })
      .filter((post) => post !== null);

    return this.sortPosts(posts, { field: "date", order: "desc" });
  }

  getFilteredPosts(filter: BlogFilter): BlogPostListItem[] {
    let posts = this.getAllPosts();

    if (filter.category) {
      posts = posts.filter((post) => post.category === filter.category);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query),
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      posts = posts.filter((post) =>
        filter.tags!.some((tag) => post.tags?.includes(tag)),
      );
    }

    return posts;
  }

  sortPosts(
    posts: BlogPostListItem[],
    options: BlogSortOptions,
  ): BlogPostListItem[] {
    return posts.toSorted((a, b) => {
      let comparison = 0;

      if (options.field === "date") {
        comparison =
          new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime();
      } else if (options.field === "title") {
        comparison = a.title.localeCompare(b.title);
      }

      return options.order === "asc" ? comparison : -comparison;
    });
  }

  getFeaturedPosts(): BlogPostListItem[] {
    return this.getAllPosts().filter((post) => post.featured);
  }

  getRelatedPosts(slug: string, limit: number = 3): BlogPostListItem[] {
    const currentPost = this.repository.getPostContent(slug);
    if (!currentPost) return [];

    const allPosts = this.getAllPosts().filter((post) => post.slug !== slug);

    // Simple related posts logic - same category or matching tags
    const related = allPosts
      .filter(
        (post) =>
          post.category === currentPost.data.category ||
          post.tags?.some((tag) => currentPost.data.tags?.includes(tag)),
      )
      .slice(0, limit);

    return related;
  }
}
