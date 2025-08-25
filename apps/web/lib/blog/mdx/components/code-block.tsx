"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { MDX_STYLES } from "../constants";

interface CodeHeaderProps {
  language?: string;
  code?: string;
}

export function CodeHeader({ language, code }: CodeHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={MDX_STYLES.codeHeader}>
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
}

interface CodeBlockProps {
  language?: string;
  content: string;
  highlighted?: string | null;
}

export function CodeBlock({ language, content, highlighted }: CodeBlockProps) {
  return (
    <div className={MDX_STYLES.codeContainer}>
      <CodeHeader language={language} code={content} />
      <div
        className={cn(
          MDX_STYLES.codeScrollArea,
          "[&::-webkit-scrollbar]:w-[6px]",
          "[&::-webkit-scrollbar-thumb]:bg-gray-600",
          "[&::-webkit-scrollbar-thumb]:rounded-md",
          "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        )}
      >
        <pre className="p-4 whitespace-pre">
          <code
            className="font-mono text-sm"
            dangerouslySetInnerHTML={{
              __html: highlighted ?? content,
            }}
          />
        </pre>
      </div>
    </div>
  );
}
