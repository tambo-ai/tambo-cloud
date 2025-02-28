"use client";

import { EmailDialog } from "@/components/email-dialog";
import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { Button, buttonVariants } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

const ease = [0.16, 1, 0.3, 1];

const heroContent = copy.hero;

function HeroPill() {
  return (
    <motion.a
      href={heroContent.pill.link}
      className="flex w-auto items-center space-x-2 rounded-full bg-[#5C94F7]/10 px-2 py-1 ring-1 ring-[#5C94F7] whitespace-pre"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="w-fit rounded-full bg-[#5C94F7] px-2 py-0.5 text-left text-xs font-medium text-white sm:text-sm">
        {heroContent.pill.label}
      </div>
      <p className="text-xs font-medium text-[#5C94F7] sm:text-sm">
        {heroContent.pill.text}
      </p>
      <svg
        width="12"
        height="12"
        className="ml-1"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z"
          fill="#5C94F7"
        />
      </svg>
    </motion.a>
  );
}

function HeroTitles() {
  return (
    <div className="flex flex-col items-center lg:items-start overflow-hidden pt-4 sm:pt-8 lg:pt-12">
      <motion.h1
        className="text-center lg:text-left text-5xl sm:text-6xl font-semibold leading-tight sm:leading-tighter text-foreground md:text-7xl lg:text-8xl tracking-tighter"
        initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease,
          staggerChildren: 0.2,
        }}
      >
        <motion.span
          className="inline-block text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease,
          }}
        >
          Smarter conversations, happier users.
        </motion.span>
      </motion.h1>
      <motion.p
        className="text-center lg:text-left max-w-xl leading-normal text-muted-foreground text-lg sm:text-xl sm:leading-normal text-balance mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease,
        }}
      >
        {heroContent.subtitle}
      </motion.p>
    </div>
  );
}

function HeroCTA() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="flex flex-col items-center lg:items-start w-full mt-8 lg:mt-12">
      <motion.div
        className="flex flex-col items-center lg:items-start w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease }}
      >
        <Button
          onClick={() => setShowDialog(true)}
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full sm:w-auto flex gap-2 rounded-lg py-6 sm:py-5 px-8 text-lg bg-primary hover:bg-primary/90 text-[#023A41] font-medium shadow-md"
          )}
        >
          <Icons.logo className="h-5 w-5 sm:h-6 sm:w-6" />
          {heroContent.cta.buttonText}
        </Button>
      </motion.div>
      <EmailDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}

// Placeholder for illustration
function HeroIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full relative">
        {/* This is where your illustration will go */}
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
          <p className="text-lg">Your illustration will go here</p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <Section id="hero" className="py-16 sm:py-20 lg:py-32">
      <div className="flex flex-col lg:flex-row items-center w-full lg:gap-16">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:max-w-[640px]">
          <HeroPill />
          <HeroTitles />
          <HeroCTA />
        </div>

        {/* Hero illustration */}
        <div className="w-full lg:w-1/2 aspect-square mt-12 lg:mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
