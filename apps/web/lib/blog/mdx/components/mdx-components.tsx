"use client";

import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import {
  ComponentPropsWithoutRef,
  ReactNode,
  useDeferredValue,
  useMemo,
} from "react";
import { MDX_STYLES } from "../constants";
import {
  extractLanguageFromClassName,
  extractTextContent,
  highlightCode,
  looksLikeCode,
} from "../utils/code-utils";
import { CodeBlock } from "./code-block";

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  className?: string;
  children?: ReactNode;
};

function Code({ className, children, ...props }: CodeProps) {
  const language = extractLanguageFromClassName(className);
  const content = extractTextContent(children).replace(/\n$/, "");
  const deferredContent = useDeferredValue(content);

  const highlighted = useMemo(() => {
    const result = highlightCode(deferredContent, language);
    return result ? DOMPurify.sanitize(result) : null;
  }, [deferredContent, language]);

  // Multi-line code block
  if (language && looksLikeCode(content)) {
    return (
      <CodeBlock
        language={language}
        content={content}
        highlighted={highlighted}
      />
    );
  }

  // Inline code
  return (
    <code className={cn(MDX_STYLES.inlineCode, className)} {...props}>
      {children}
    </code>
  );
}

export const createMDXComponents = (): MDXComponents => ({
  // Code
  code: Code,

  // Typography
  p: ({ children }) => <p className={MDX_STYLES.paragraph}>{children}</p>,

  h1: ({ children }) => <h1 className={MDX_STYLES.h1}>{children}</h1>,

  h2: ({ children }) => <h2 className={MDX_STYLES.h2}>{children}</h2>,

  h3: ({ children }) => <h3 className={MDX_STYLES.h3}>{children}</h3>,

  h4: ({ children }) => <h4 className={MDX_STYLES.h4}>{children}</h4>,

  // Lists
  ul: ({ children }) => <ul className={MDX_STYLES.ul}>{children}</ul>,

  ol: ({ children }) => <ol className={MDX_STYLES.ol}>{children}</ol>,

  li: ({ children }) => <li className={MDX_STYLES.li}>{children}</li>,

  // Block elements
  blockquote: ({ children }) => (
    <blockquote className={MDX_STYLES.blockquote}>{children}</blockquote>
  ),

  hr: () => <hr className={MDX_STYLES.hr} />,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={MDX_STYLES.link}
    >
      {children}
    </a>
  ),

  // Tables
  table: ({ children }) => (
    <div className={MDX_STYLES.tableWrapper}>
      <table className={MDX_STYLES.table}>{children}</table>
    </div>
  ),

  th: ({ children }) => <th className={MDX_STYLES.th}>{children}</th>,

  td: ({ children }) => <td className={MDX_STYLES.td}>{children}</td>,

  // Images
  img: ({ src, alt }) => {
    if (!src) return null;
    return (
      <div className={MDX_STYLES.imageContainer}>
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1024px"
          className="object-cover"
          priority
        />
        {alt && <p className={MDX_STYLES.imageCaption}>{alt}</p>}
      </div>
    );
  },
});
