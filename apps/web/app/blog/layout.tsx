import { Footer } from "@/components/sections/footer";
import { TamboHackBanner } from "@/components/sections/tambohack-banner";
import { ReactNode } from "react";
import { BlogHeader } from "../../components/blog/blog-header";

export const metadata = {
  title: "Tambo Blog",
  description: "Insights and updates from the Tambo team",
};

interface BlogLayoutProps {
  children: ReactNode;
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TamboHackBanner />
      <BlogHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="mt-auto">
        <div className="mx-auto w-full max-w-7xl">
          <Footer />
        </div>
      </footer>
    </div>
  );
}
