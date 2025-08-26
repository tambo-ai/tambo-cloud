import { getPosts } from "../posts/get-posts";

interface Config {
  title: string;
  siteUrl: string;
  description: string;
  lang: string;
}

const CONFIG: Config = {
  title: "Tambo Blog",
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://tambo.ai",
  description: "Latest insights and updates from the Tambo team",
  lang: "en-us",
};

export async function GET(): Promise<Response> {
  const allPosts = await getPosts();
  const posts = allPosts
    .map(
      (post) => `    <item>
        <title>${escapeXml(post.frontMatter.title)}</title>
        <description>${escapeXml(post.frontMatter.description || "")}</description>
        <link>${CONFIG.siteUrl}${post.route}</link>
        <pubDate>${new Date(post.frontMatter.date).toUTCString()}</pubDate>
        ${post.frontMatter.author ? `<author>${escapeXml(post.frontMatter.author)}</author>` : ""}
        ${post.frontMatter.tags ? post.frontMatter.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n        ") : ""}
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${CONFIG.title}</title>
    <link>${CONFIG.siteUrl}/blog</link>
    <description>${CONFIG.description}</description>
    <language>${CONFIG.lang}</language>
    <atom:link href="${CONFIG.siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
${posts}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
