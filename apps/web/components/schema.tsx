"use client";

import { useMemo } from "react";

interface SchemaProps {
  jsonLd: Record<string, any> | Record<string, any>[];
}

/**
 * Component to add JSON-LD schema to pages
 * Usage: <Schema jsonLd={generateWebsiteSchema()} />
 */
export function Schema({ jsonLd }: SchemaProps) {
  const markup = useMemo(
    () =>
      Array.isArray(jsonLd)
        ? jsonLd.map((item) => JSON.stringify(item)).join("")
        : JSON.stringify(jsonLd),
    [jsonLd],
  );

  // Only render on the client to avoid hydration issues
  if (typeof window === "undefined") return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
