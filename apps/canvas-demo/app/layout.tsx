import "./globals.css";
import { PHProvider, PostHogPageview } from "./providers";
import { Suspense } from "react";
import { CanvasHeader } from "@/components/CanvasHeader";
import { ActiveTabProvider } from "@/contexts/ActiveTabContext";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Suspense>
        <PostHogPageview />
      </Suspense>
      <PHProvider>
        <body>
          <ActiveTabProvider>
            <div className="flex h-screen w-full flex-col overflow-hidden">
              <CanvasHeader />
              <main className="flex-1 flex overflow-hidden w-full">
                {children}
              </main>
            </div>
          </ActiveTabProvider>
          <Toaster />
        </body>
      </PHProvider>
    </html>
  );
}
