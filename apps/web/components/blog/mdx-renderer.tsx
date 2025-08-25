"use client";

import { createMDXComponents } from "@/lib/blog/mdx";
import { cn } from "@/lib/utils";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { memo, useMemo } from "react";

interface MDXRendererProps {
  source: MDXRemoteSerializeResult;
  className?: string;
  components?: Record<string, any>;
}

export const MDXRenderer = memo(
  ({ source, className, components: customComponents }: MDXRendererProps) => {
    const components = useMemo(() => {
      const baseComponents = createMDXComponents();
      return customComponents
        ? { ...baseComponents, ...customComponents }
        : baseComponents;
    }, [customComponents]);

    return (
      <div className={cn("mdx-content", className)}>
        <MDXRemote {...source} components={components} />
      </div>
    );
  },
);

MDXRenderer.displayName = "MDXRenderer";
