"use client";

import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1];

const content = {
  title: "Check out our Demo App",
  description: "It's a simple chat with your data demo app.",
  demo: {
    videoSrc: "/assets/landing/videos/canvas-demo.mp4",
  },
  cta: {
    buttonText: "Try Demo",
    link: "https://canvas.usehydra.ai",
  },
};

function AnalyticsTitle() {
  return (
    <motion.div
      className="flex flex-col space-y-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease }}
    >
      <h2 className="text-center lg:text-left text-4xl font-heading tracking-tight sm:text-5xl md:text-6xl">
        {content.title}
      </h2>
      <p className="text-center lg:text-left text-xl text-muted-foreground max-w-xl">
        {content.description}
      </p>
    </motion.div>
  );
}

function AnalyticsVideo() {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="aspect-video w-full rounded-2xl overflow-hidden">
        <HeroVideoDialog
          videoSrc={content.demo.videoSrc}
          className="w-full h-full shadow-xl border border-border/50"
          animationStyle="from-bottom"
        />
      </div>
    </motion.div>
  );
}

function AnalyticsCTA() {
  return (
    <motion.div
      className="flex justify-center lg:justify-start mt-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <Link
        href={content.cta.link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "flex gap-2 py-6 px-8 rounded-md text-lg hover:bg-[#5C94F7]/20 hover:text-[#5C94F7] transition-colors",
        )}
      >
        <ExternalLinkIcon className="h-5 w-5" />
        {content.cta.buttonText}
      </Link>
    </motion.div>
  );
}

export function AnalyticsSection() {
  return (
    <Section id="analytics" className="py-16 sm:py-24">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full lg:gap-16">
        {/* Left side: Title and description */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-[45%] mb-12 lg:mb-0">
          <AnalyticsTitle />
          <AnalyticsCTA />
        </div>

        {/* Right side: Video */}
        <div className="w-full lg:w-[50%]">
          <AnalyticsVideo />
        </div>
      </div>
    </Section>
  );
}
