import { ReactNode } from "react";
import { BlogHeader } from "./components/header";
import { Footer } from "@/components/sections/footer";

// Import styles
import "../globals.css";
import "./blog.css";

export const metadata = {
  title: "Tambo Blog",
  description: "Insights and updates from the Tambo team",
};

interface BlogLayoutProps {
  children: ReactNode;
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogHeader />

        {/* Main Content */}
        <main className="min-h-[60vh]">{children}</main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
