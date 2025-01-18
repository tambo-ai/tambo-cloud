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
    title: "Easy to implement with detailed guides",
    description: "Clear documentation and step-by-step integration guides",
    icon: Icons.react,
  },
  {
    title: "Works seamlessly across web and mobile",
    description: "Built for cross-platform compatibility from the ground up",
    icon: Icons.tailwind,
  },
  {
    title: "Fits into any modern React stack",
    description:
      "Integrates with Next.js, React Native, Expo, Remix, Gatsby, Astro, and other modern frameworks",
    icon: Icons.radix,
  },
];

export function Community() {
  return (
    <Section id="developers">
      <div className="relative w-full p-6 lg:p-12 overflow-hidden">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div
            className="flex flex-col space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              <AuroraText>Built for Users, Loved by Developers</AuroraText>
            </h2>
            <p className="text-lg text-muted-foreground">
              Hydra AI is easy to integrate and built for scale. Developers love
              our clear documentation, fast setup, and flexibility.
            </p>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-8 md:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-muted/50"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              href="/docs"
              className={cn(
                buttonVariants({ variant: "default" }),
                "text-lg flex items-center gap-2"
              )}
            >
              <Icons.logo className="h-4 w-4" />
              Read our docs
            </Link>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
