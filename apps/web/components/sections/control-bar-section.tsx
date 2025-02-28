"use client";

import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BrainCircuitIcon,
  ExternalLinkIcon,
  Hourglass,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";

const iconMap = {
  BrainCircuit: BrainCircuitIcon,
  Hourglass: Hourglass,
  TrendingUp: TrendingUpIcon,
} as const;

const content = copy.controlBar;

export function ControlBarSection() {
  return (
    <Section id="control-bar" className="py-16 sm:py-24">
      <div className="flex flex-col items-center text-center lg:text-left lg:items-start max-w-3xl mx-auto lg:max-w-none lg:grid lg:grid-cols-2 gap-16">
        <div className="flex flex-col space-y-4 w-full order-1 lg:order-2">
          <div className="aspect-video w-full rounded-lg overflow-hidden">
            <HeroVideoDialog
              videoSrc={content.demo.videoSrc}
              className="w-full shadow-xl rounded-xl border border-border/50"
            />
          </div>
          <div className="flex justify-center">
            <Link
              href={content.cta.link}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "flex gap-2 py-6 px-8 rounded-md text-lg",
              )}
            >
              <ExternalLinkIcon className="h-5 w-5" />
              {content.cta.buttonText}
            </Link>
          </div>
        </div>

        <div className="flex flex-col space-y-8 order-2 lg:order-1">
          <motion.div
            className="flex flex-col space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              AI tools for every case.
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl">
              {content.description}
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {content.features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col lg:flex-row items-center lg:items-start gap-5 text-center lg:text-left"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#5C94F7] shadow-md icon-container ${index % 2 === 0 ? "float-animation" : "pulse-animation"}`}
                >
                  {(() => {
                    const Icon = iconMap[feature.icon as keyof typeof iconMap];
                    return <Icon className="h-7 w-7 text-white" />;
                  })()}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground text-lg">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
