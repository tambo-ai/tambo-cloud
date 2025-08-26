import { BlogHeader } from "@/components/sections/blog-header";
import { Footer } from "@/components/sections/footer";
import { TamboHackBanner } from "@/components/sections/tambohack-banner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | tambo blog",
    default: "blog",
  },
  description:
    "Latest updates, tutorials, and insights about tambo - the AI orchestration framework for React frontends.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TamboHackBanner />
      <BlogHeader />
      <main className="flex-1">{children}</main>
      <footer className="mt-auto">
        <div className="mx-auto w-full max-w-7xl">
          <Footer />
        </div>
      </footer>
    </div>
  );
}
