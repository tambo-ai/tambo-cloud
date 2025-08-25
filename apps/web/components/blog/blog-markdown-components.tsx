"use client";

import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";
import Image from "next/image";
import {
  ComponentPropsWithoutRef,
  ReactNode,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import type { Components } from "react-markdown";

const looksLikeCode = (text: string): boolean => {
  const codeIndicators = [
    /^import\s+/m,
    /^function\s+/m,
    /^class\s+/m,
    /^const\s+/m,
    /^let\s+/m,
    /^var\s+/m,
    /[{}[\]();]/,
    /^\s*\/\//m,
    /^\s*\/\*/m,
    /=>/,
    /^export\s+/m,
  ];
  return codeIndicators.some((pattern) => pattern.test(text));
};

const CodeHeader = ({
  language,
  code,
}: {
  language?: string;
  code?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
      <span className="font-mono text-gray-900">{language || "code"}</span>
      <button
        onClick={copyToClipboard}
        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
        title="Copy code"
      >
        {!copied ? (
          <Copy className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4 text-green-500" />
        )}
      </button>
    </div>
  );
};

// Helper function to extract text content from MDX children
const getTextContent = (children: ReactNode): string => {
  if (typeof children === "string") {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(getTextContent).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return getTextContent(children.props.children);
  }

  return String(children || "");
};

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  className?: string;
  children?: ReactNode;
};

const Code = ({ className, children, ...props }: CodeProps) => {
  const match = /language-(\w+)/.exec(className ?? "");
  const content = getTextContent(children).replace(/\n$/, "");
  const deferredContent = useDeferredValue(content);

  const highlighted = useMemo(() => {
    if (!match || !looksLikeCode(deferredContent)) return null;
    try {
      return hljs.highlight(deferredContent, { language: match[1] }).value;
    } catch {
      return deferredContent;
    }
  }, [deferredContent, match]);

  if (match && looksLikeCode(content)) {
    return (
      <div className="relative border border-gray-200 rounded-lg bg-gray-50 max-w-full text-sm my-6 overflow-hidden">
        <CodeHeader language={match[1]} code={content} />
        <div
          className={cn(
            "overflow-x-auto bg-gray-50",
            "[&::-webkit-scrollbar]:w-[6px]",
            "[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-md",
            "[&::-webkit-scrollbar:horizontal]:h-[4px]",
          )}
        >
          <pre className="p-4 whitespace-pre">
            <code
              className="font-mono text-sm"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(highlighted ?? content),
              }}
            />
          </pre>
        </div>
      </div>
    );
  }

  return (
    <code
      className={cn(
        "bg-gray-100 px-2 py-1 rounded text-sm font-mono text-pink-600",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
};

export const createBlogMarkdownComponents = (): Components => ({
  code: Code,

  p: ({ children }) => (
    <p className="mb-6 leading-relaxed text-gray-700">{children}</p>
  ),

  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-8 mt-12 text-gray-900 border-b border-gray-200 pb-4">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="text-3xl font-bold mb-6 mt-10 text-gray-900">{children}</h2>
  ),

  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold mb-4 mt-8 text-gray-900">
      {children}
    </h3>
  ),

  h4: ({ children }) => (
    <h4 className="text-xl font-semibold mb-3 mt-6 text-gray-900">
      {children}
    </h4>
  ),

  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700">
      {children}
    </ol>
  ),

  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-6 py-4 my-6 italic text-gray-800 rounded-r-lg">
      {children}
    </blockquote>
  ),

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium rounded hover:bg-blue-50 underline transition-colors inline-flex items-center"
    >
      {children}
    </a>
  ),

  hr: () => <hr className="my-8 border-gray-300" />,

  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  ),

  th: ({ children }) => (
    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200">
      {children}
    </td>
  ),

  img: ({ src, alt }) => {
    if (!src) return null;
    return (
      <div className="my-8">
        <Image
          src={src}
          alt={alt ?? ""}
          className="w-full rounded-lg shadow-lg"
          width={800}
          height={450}
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {alt && (
          <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>
        )}
      </div>
    );
  },
});
