# Blog CLAUDE.md

This file provides guidance for working with the Tambo blog system.

## Technology Stack

**MDX Processing:**

- **Nextra v4.6.0** - Primary MDX framework that handles blog post compilation and metadata extraction
- **rehype-pretty-code** - Syntax highlighting (currently configured, may have issues)
- **rehype-katex** - Math equation rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **@theguild/remark-mermaid** - Diagram support

**Frontend:**

- Next.js 15 App Router
- React 18
- Tailwind CSS with @tailwindcss/typography
- Client-side filtering/sorting (BlogPage is "use client")

**Configuration:**

- MDX config in `next.config.mjs` (lines 144-165)
- Syntax highlighting theme: github-light/dark
- keepBackground: false (custom styling required)

## File Structure

```
apps/web/app/blog/
├── layout.tsx                    # Blog layout with header/footer
├── page.tsx                      # Blog list page (server component)
├── posts/
│   ├── tambo-hack/page.mdx
│   ├── tambo-with-tambo/page.mdx
│   └── mcp-sampling-support/page.mdx
└── CLAUDE.md                     # This file

apps/web/components/blog/
├── blog-page.tsx                 # Client component with search/filter/sort
├── blog-post.tsx                 # Individual post wrapper
├── blog-header.tsx
├── list/
│   ├── blog-filters.tsx          # Category filters
│   ├── blog-search.tsx           # Search input
│   └── blog-sort.tsx             # Sort dropdown
└── shared/
    ├── blog-card.tsx             # Post card component
    ├── blog-badge.tsx            # Category badge
    └── featured-post-card.tsx    # Featured post display

apps/web/lib/blog/
├── constants.ts                  # GRADIENTS, CATEGORY_COLORS, CATEGORY_DISPLAY_MAP
├── types.ts                      # BlogCategory, BlogPostListItem, etc.
└── get-posts.ts                  # Uses Nextra's getPageMap() API
```

## How Blog Posts Work

### Post Discovery

1. Nextra scans `app/blog/posts/` directory
2. `getPageMap("/blog/posts")` in `lib/get-posts.ts` returns all posts
3. `normalizePages()` extracts frontmatter and metadata
4. Posts rendered via `app/blog/page.tsx` calling `BlogPage` component

### Frontmatter Pattern

```yaml
---
title: "Post Title"
date: "2025-10-22"
description: "Brief description"
tags: ["tag1", "tag2"]
author: "Author Name"
category: "announcement" # or: event, feature, bug fix, update, tutorial, new
featured: true # or false
---
```

### MDX Components

Custom components available in MDX via `mdx-components.tsx`:

- `<BlogPost>` - Wraps post content with layout, breadcrumbs, title, author/date
- `<ImageZoom>` - Zoomable images
- Standard HTML elements with custom Tailwind styling

## Current Issues

### 1. Code Syntax Highlighting Not Working

Despite `rehype-pretty-code` being configured, code blocks may lack highlighting. Possible causes:

- Styling not applied (keepBackground: false requires custom CSS)
- Theme not loading correctly
- MDX components not rendering code blocks properly

### 2. Over-Engineering for 3 Posts

- Complex search/filter/sort functionality unnecessary
- Client-side state management adds overhead
- Post count calculations per category overkill

### 3. Performance Issues

- `/public/tambo-bg.png` is 563KB (used on every card)
- Background images use CSS instead of Next.js Image component
- Entire BlogPage is "use client" just for filters

### 4. Frontmatter Duplication

Every post repeats:

- `author: "Michael Magan"` (same across all posts)
- Category definitions could have defaults
- Tags structure verbose

## Best Practices

### Adding New Posts

1. Create new directory: `app/blog/posts/{slug}/`
2. Add `page.mdx` with frontmatter
3. Wrap content in `<BlogPost title="...">`
4. Images go in `/public/` or alongside MDX file
5. Use code blocks with language: ``tsx` or ``bash`

### Code Blocks

Use fenced code blocks with language identifier:

````markdown
```tsx
export function Example() {
  return <div>Hello</div>;
}
```
````

### Styling

- Tailwind utilities for layout
- Custom MDX component styling in `mdx-components.tsx`
- Code block styling should be in global CSS (if keepBackground: false)

## Known Dependencies

- `nextra` - v4.6.0
- `rehype-pretty-code` - Syntax highlighting
- `rehype-katex` - Math rendering
- `remark-gfm` - GitHub Flavored Markdown

## Development Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run lint             # Check code quality
```

## Related Files

- `/apps/web/next.config.mjs` - Nextra and rehype plugin configuration
- `/apps/web/mdx-components.tsx` - Custom MDX component definitions
- `/apps/web/styles/globals.css` - Global styles (check for code block CSS)
