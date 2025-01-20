"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { AuroraText } from "@/components/aurora-text";

const features = [
  {
    title: "Adapt to user behavior in real time",
    description: "Surface relevant features based on user context",
    icon: Icons.react,
  },
  {
    title: "Reduce user frustration and churn",
    description: "Help users find what they need instantly",
    icon: Icons.tailwind,
  },
  {
    title: "Boost feature engagement and adoption",
    description: "Guide users to the right tools at the right time",
    icon: Icons.radix,
  },
];

export function SaasFeatures() {
  return (
    <Section id="saas-features">
      <div className="grid lg:grid-cols-2 items-center gap-16">
        <div className="relative lg:col-start-2">
          <div className="aspect-video w-full rounded-lg bg-muted">
            {/* Video player component will go here */}
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Video Demo Placeholder
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              href="https://control-bar.usehydra.ai"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "flex gap-2 bg-accent hover:bg-accent/90"
              )}
            >
              <Icons.react className="h-4 w-4" />
              Try Control Bar
            </Link>
          </div>
        </div>

        <div className="flex flex-col space-y-8 lg:col-start-1 lg:row-start-1">
          <motion.div
            className="flex flex-col space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              <AuroraText>
                Help Users Find and Use Features Instantly
              </AuroraText>
            </h2>
            <p className="text-lg text-muted-foreground">
              Hydra AI's dynamic control bar eliminates feature confusion by
              surfacing the right tools at the right time. Users spend less time
              searching and more time getting things done.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
