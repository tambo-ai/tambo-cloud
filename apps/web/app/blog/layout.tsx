"use client";

import { Footer } from "@/components/sections/footer";
import { BlogHeader } from "@/components/sections/blog-header";
import { TamboHackBanner } from "@/components/sections/tambohack-banner";

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TamboHackBanner />
      <BlogHeader />
      <main className="flex-1">{children}</main>
      <div className="mx-auto w-full max-w-7xl">
        <Footer />
      </div>
    </div>
  );
}
