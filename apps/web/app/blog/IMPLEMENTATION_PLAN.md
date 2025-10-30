# Implementation Plan: Blog Improvements

## Research Findings Summary

**Current Architecture:**

- Nextra v4.6.0 for MDX processing
- `rehype-pretty-code` already configured but highlighting not working (likely CSS styling issue)
- Over-engineered with search/filter/sort for only 3 posts
- 563KB background image used on every card
- Heavy frontmatter duplication across posts

## Changes to Implement

### 1. **Fix Code Syntax Highlighting** ✅ (Already configured, needs CSS)

**Issue:** `keepBackground: false` in config requires custom CSS for code blocks

**Files to modify:**

- `apps/web/styles/globals.css` - Add code block styling

**Pseudo-code:**

```css
/* Add Shiki code block styles */
pre {
  @apply rounded-lg p-4 overflow-x-auto my-4;
  background: hsl(var(--muted)) !important;
}

code {
  @apply text-sm font-mono;
}

/* Inline code */
:not(pre) > code {
  @apply bg-muted px-1.5 py-0.5 rounded;
}
```

### 2. **Remove Over-Engineering**

**Files to DELETE:**

- `components/blog/list/blog-filters.tsx`
- `components/blog/list/blog-sort.tsx`
- `components/blog/shared/featured-post-card.tsx`
- `components/blog/shared/blog-badge.tsx` (removing category badges)

**Files to MODIFY:**

- `components/blog/blog-page.tsx`:
  - **KEEP** search bar and "use client" directive
  - Remove filter/sort state and components
  - Remove featured post logic
  - Simplify to search + post list
  - Remove imports for deleted components

### 3. **Simplify Blog Cards** (Minimal text-only design)

**Files to modify:**

- `components/blog/shared/blog-card.tsx`:
  - Remove background image prop and 563KB tambo-bg.png usage
  - Remove gradient overlays
  - Remove category badges
  - **Minimal design:** Just title + short description + date
  - Use simple, clean colors (can be outside design system if needed)
  - No complex styling, pure text-based

**Pseudo-code:**

```tsx
// New minimal card design - text only with author
<Link href={`/blog/posts/${post.slug}`}>
  <article className="py-6 border-b hover:bg-muted/50 transition">
    <h3 className="font-bold text-xl">{post.title}</h3>
    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
      {post.description}
    </p>
    <div className="flex items-center gap-3 mt-3">
      <img src={post.authorImage} className="w-6 h-6 rounded-full" />
      <span className="text-xs text-muted-foreground">{post.author}</span>
      <span className="text-xs text-muted-foreground">•</span>
      <span className="text-xs text-muted-foreground">{post.date}</span>
    </div>
  </article>
</Link>
```

### 4. **Reduce Frontmatter Duplication**

**Create new file:**

- `lib/blog/defaults.ts`:

```ts
export const BLOG_DEFAULTS = {
  author: "Michael Magan",
  authorImage: "/authors/michael-magan.jpg", // or appropriate path
  // other common defaults
};
```

**Modify:**

- `lib/get-posts.ts` - Merge defaults with frontmatter
- `lib/blog/types.ts` - Add authorImage field
- All 3 blog post MDX files - Keep `author` if different from default, remove `category`, `featured`, `tags` fields

### 5. **Additional Improvements Identified**

**Performance:**

- Delete `/public/tambo-bg.png` (563KB - no longer needed)
- BlogPage stays as client component (for search functionality)

**Accessibility:**

- Add proper semantic HTML to cards
- Ensure keyboard navigation works

**Code Quality:**

- Clean up gradient constants (no longer needed)
- Remove category/tag-related code
- Simplify blog type definitions

## Task Breakdown (Non-Conflicting Sub-Tasks)

### **Task Group A: Deletions** (Can work independently)

1. Delete filters, sort components
2. Delete featured-post-card component
3. Delete blog-badge component
4. Delete tambo-bg.png

### **Task Group B: Core Components** (Sequential)

1. Simplify BlogCard component (minimal text-only design)
2. Refactor BlogPage (keep search, remove filters/sort/featured)
3. Update blog page.tsx imports

### **Task Group C: Frontmatter** (Independent)

1. Create blog defaults file
2. Update get-posts.ts to merge defaults
3. Update all 3 MDX files - minimal frontmatter (title, date, description only)

### **Task Group D: Styling** (Independent)

1. Add code block CSS to globals.css
2. Test syntax highlighting works
3. Ensure responsive design maintained

### **Task Group E: Polish** (Final)

1. Add accessibility improvements
2. Test all pages render correctly
3. Verify performance improvements

## Files That Need Changes

**Delete (5 files):**

- `components/blog/list/blog-filters.tsx`
- `components/blog/list/blog-sort.tsx`
- `components/blog/shared/featured-post-card.tsx`
- `components/blog/shared/blog-badge.tsx`
- `public/tambo-bg.png`

**Modify (9 files):**

- `components/blog/blog-page.tsx` - Keep search, remove filters/sort/featured
- `components/blog/shared/blog-card.tsx` - Minimal text-only design
- `lib/get-posts.ts` - Add default merging
- `lib/blog/types.ts` - Simplify types (remove category, tags, featured)
- `lib/blog/constants.ts` - Clean up unused gradients and category code
- `styles/globals.css` - Add code block styles
- `posts/tambo-hack/page.mdx` - Minimal frontmatter
- `posts/tambo-with-tambo/page.mdx` - Minimal frontmatter
- `posts/mcp-sampling-support/page.mdx` - Minimal frontmatter

**Create (1 file):**

- `lib/blog/defaults.ts` - Shared frontmatter defaults

## User Feedback Summary

✅ **Keep:** Search bar (stay as client component), author name and image
❌ **Remove:** Filters, sort, category badges, featured posts, tags, complex styling
🎨 **Design:** Minimal text-only list (title + short description + author + date)
🎨 **Colors:** Simple, clean - can be outside design system if needed
