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
    title: "Make analytics conversational and intuitive",
    description: "Transform complex data into natural conversations",
    icon: Icons.react,
  },
  {
    title: "Reduce training and support costs",
    description: "Users get answers without extensive training",
    icon: Icons.tailwind,
  },
  {
    title: "Deliver insights without overwhelming dashboards",
    description: "Surface relevant insights when users need them",
    icon: Icons.radix,
  },
];

export function AnalyticsSection() {
  return (
    <Section id="analytics">
      <div className="flex flex-col lg:flex-row items-center w-full lg:gap-16">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-4 sm:px-6 lg:px-0 lg:max-w-[640px] order-2 lg:order-1">
          <motion.div
            className="flex flex-col space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              <AuroraText>Analytics That Users Actually Understand</AuroraText>
            </h2>
            <p className="text-lg text-muted-foreground">
              Most analytics apps overwhelm users with data. Hydra AI transforms
              the experience, letting users ask questions and get actionable
              insights in seconds.
            </p>
          </motion.div>

          <motion.div
            className="mt-8 grid gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
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

        <div className="relative lg:h-full w-full lg:w-[640px] aspect-square order-1 lg:order-2 mt-8 lg:mt-0">
          <div className="aspect-video w-full rounded-lg bg-muted">
            {/* Video player component will go here */}
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Video Demo Placeholder
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              href="https://canvas.usehydra.ai"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "flex gap-2 bg-accent hover:bg-accent/90"
              )}
            >
              <Icons.react className="h-4 w-4" />
              Try Canvas
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
