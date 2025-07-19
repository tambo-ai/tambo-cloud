import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import "./styles.css"; // Import custom docs styles

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      nav={{
        ...baseOptions.nav,
      }}
      sidebar={{
        collapsible: false,
        tabs: {
          transform: (option, node) => ({
            ...option,
            icon: <div>hi</div>,
          }),
        },
      }}
      containerProps={{
        className: "bg-fd-background",
      }}
    >
      {children}
    </DocsLayout>
  );
}
