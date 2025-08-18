"use client";

import { Section } from "@/components/section";
import { Easing, motion } from "framer-motion";
import { BookOpen, Heart } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

// Animation configuration
const ease: Easing = [0.16, 1, 0.3, 1];

export function MCP() {
  return (
    <Section id="mcp" className="py-16 sm:py-24">
      <div className="text-center max-w-4xl mx-auto">
        <motion.div
          className="space-y-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <span className="text-4xl font-heading">MCP? We do too.</span>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Check out our MCP (Model Context Protocol) support for seamless
            integration with your AI models and tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          <div className="mx-auto w-full max-w-4xl">
            <div className="relative w-full overflow-hidden rounded-2xl border bg-black">
              <video
                className="w-full h-auto"
                controls
                preload="metadata"
                playsInline
              >
                <source
                  src="/demos/tambo-mcp-client-side.mp4#t=0.1"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          {/* Relevant docs */}
          <div className="flex flex-col items-center mt-4">
            <Link
              href="https://docs.tambo.co/concepts/model-context-protocol"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-base flex items-center gap-2 py-3 px-6 rounded-md",
              )}
            >
              <BookOpen className="w-5 h-5" />
              Read MCP Docs
            </Link>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
