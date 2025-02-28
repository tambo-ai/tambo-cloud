"use client";

import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BookIcon,
  BookOpenIcon,
  PackageIcon,
  SmartphoneIcon,
} from "lucide-react";
import Link from "next/link";

const iconMap = {
  BookOpen: BookOpenIcon,
  Smartphone: SmartphoneIcon,
  Package: PackageIcon,
  Book: BookIcon,
} as const;

const content = copy.community;

export function Community() {
  return (
    <Section id="developers" className="py-16 sm:py-24">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div
          className="flex flex-col space-y-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Fits Into Your Workflow
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {content.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="flex flex-col space-y-8">
            <motion.div
              className="flex items-start gap-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#5C94F7] shadow-md icon-container pulse-animation">
                <BookOpenIcon className="h-7 w-7 text-white" />
              </div>
              <div className="text-left space-y-2">
                <h3 className="text-xl font-medium">
                  {content.features[0].title}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {content.features[0].description}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start gap-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#5C94F7] shadow-md icon-container float-animation">
                <SmartphoneIcon className="h-7 w-7 text-white" />
              </div>
              <div className="text-left space-y-2">
                <h3 className="text-xl font-medium">
                  {content.features[1].title}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {content.features[1].description}
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="flex items-start gap-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#5C94F7] shadow-md icon-container pulse-animation">
              <PackageIcon className="h-7 w-7 text-white" />
            </div>
            <div className="text-left space-y-2">
              <h3 className="text-xl font-medium">
                {content.features[2].title}
              </h3>
              <p className="text-muted-foreground text-lg">
                {content.features[2].description}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            href={content.cta.link}
            className={cn(
              buttonVariants({ variant: "default" }),
              "text-lg flex items-center gap-2 py-6 px-8 rounded-md",
            )}
          >
            {(() => {
              const Icon = iconMap[content.cta.icon as keyof typeof iconMap];
              return <Icon className="h-5 w-5" />;
            })()}
            {content.cta.text}
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
