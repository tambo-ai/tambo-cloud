import { cn } from "@/lib/utils";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1
        className={cn("font-heading text-4xl font-bold mt-8 mb-4", className)}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={cn("font-heading text-3xl font-bold mt-8 mb-3", className)}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={cn(
          "font-heading text-2xl font-semibold mt-6 mb-2",
          className,
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={cn(
          "font-sans leading-7 text-gray-700 dark:text-gray-300 my-4",
          className,
        )}
        {...props}
      />
    ),
    a: ({ className, ...props }) => (
      <a
        className={cn(
          "text-blue-600 dark:text-blue-400 font-medium hover:underline",
          className,
        )}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul className={cn("list-disc pl-6 my-4", className)} {...props} />
    ),
    ol: ({ className, ...props }) => (
      <ol className={cn("list-decimal pl-6 my-4", className)} {...props} />
    ),
    li: ({ className, ...props }) => (
      <li className={cn("my-1", className)} {...props} />
    ),
    code: ({ className, ...props }) => (
      <code
        className={cn(
          "font-mono text-sm px-1 py-0.5 rounded bg-gray-100",
          className,
        )}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <pre
        className={cn(
          "rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 p-4 overflow-x-auto",
          className,
        )}
        {...props}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          "border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic my-4 text-gray-700",
          className,
        )}
        {...props}
      />
    ),
    table: ({ className, ...props }) => (
      <table
        className={cn("w-full text-left border-collapse my-6", className)}
        {...props}
      />
    ),
    th: ({ className, ...props }) => (
      <th
        className={cn(
          "border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-100",
          className,
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        className={cn("border border-gray-200 px-3 py-2", className)}
        {...props}
      />
    ),
    hr: ({ className, ...props }) => (
      <hr className={cn("my-8 border-gray-200", className)} {...props} />
    ),
    ...components,
  };
}
