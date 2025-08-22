"use client";

import { createBlogMarkdownComponents } from "@/components/blog/blog-markdown-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { memo } from "react";

interface MDXRendererProps {
  source: MDXRemoteSerializeResult;
  className?: string;
}

export const MDXRenderer = memo(({ source, className }: MDXRendererProps) => {
  const components = createBlogMarkdownComponents();

  return (
    <div className={className}>
      <MDXRemote {...source} components={components} />
    </div>
  );
});

MDXRenderer.displayName = "MDXRenderer";
