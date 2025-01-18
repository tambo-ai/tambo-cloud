"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/section";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { AuroraText } from "@/components/aurora-text";
import { useState } from "react";
import { EmailDialog } from "@/components/email-dialog";

const features = [
  {
    title: "Start fast with prebuilt functionality",
    description:
      "Get up and running quickly with our ready-to-use components and integrations",
    icon: Icons.react,
  },
  {
    title: "Customize Hydra AI to fit your workflows",
    description: "Adapt and extend our platform to match your specific needs",
    icon: Icons.tailwind,
  },
  {
    title: "Scale confidently with smarter interfaces",
    description: "Build interfaces that grow and evolve with your application",
    icon: Icons.radix,
  },
];

export function Features() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <Section id="features">
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
              <AuroraText>
                Fast Start. Flexible Design. Smarter Apps.
              </AuroraText>
            </h2>
            <p className="text-lg text-muted-foreground">
              Hydra AI is built for developers who want to create adaptive,
              user-friendly interfaces without slowing down development.
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
            <Button
              onClick={() => setShowDialog(true)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "text-lg flex items-center gap-2"
              )}
            >
              We want to build with you.
              <Icons.logo className="h-4 w-4" />
            </Button>
            <EmailDialog open={showDialog} onOpenChange={setShowDialog} />
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
