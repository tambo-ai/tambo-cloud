import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from "@/lib/config";
import { GeistMono, GeistSans, sentientLight } from "@/lib/fonts";
import { cn, constructMetadata } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/react";
import { Analytics } from "@vercel/analytics/react";
import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { PHProvider, PostHogPageview } from "./providers";

export const metadata: Metadata = constructMetadata({
  title: `${siteConfig.name} | ${siteConfig.description}`,
  description: siteConfig.metadata.description,
  keywords: siteConfig.keywords,
  openGraph: {
    title: siteConfig.metadata.openGraph.title,
    description: siteConfig.metadata.openGraph.description,
    images: siteConfig.metadata.openGraph.images,
  },
  twitter: {
    card: siteConfig.metadata.twitter.card,
    title: siteConfig.metadata.twitter.title,
    description: siteConfig.metadata.twitter.description,
    images: siteConfig.metadata.twitter.images,
  },
  icons: siteConfig.metadata.icons,
});

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "white" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        `${GeistSans.variable} ${GeistMono.variable} ${sentientLight.variable}`,
      )}
    >
      <Suspense>
        <PostHogPageview />
      </Suspense>
      <TRPCReactProvider>
        <PHProvider>
          <body
            className={cn(
              "min-h-screen bg-background antialiased w-full mx-auto scroll-smooth font-sans flex flex-col",
            )}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              forcedTheme="light"
            >
              <RootProvider>{children}</RootProvider>
              <TailwindIndicator />
            </ThemeProvider>
            <Toaster />
            <Analytics />
          </body>
        </PHProvider>
      </TRPCReactProvider>
    </html>
  );
}
