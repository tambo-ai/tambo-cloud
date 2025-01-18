"use client";

import { AuroraText } from "@/components/aurora-text";
import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { EmailDialog } from "@/components/email-dialog";

const ease = [0.16, 1, 0.3, 1];

function HeroPill() {
  return (
    <motion.a
      href="https://canvas.usehydra.ai/"
      className="flex w-auto items-center space-x-2 rounded-full bg-primary/20 px-2 py-1 ring-1 ring-accent whitespace-pre"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="w-fit rounded-full bg-accent px-2 py-0.5 text-left text-xs font-medium text-primary sm:text-sm">
        🛠️ New
      </div>
      <p className="text-xs font-medium text-primary sm:text-sm">
        Introducing Canvas SDK
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
          fill="hsl(var(--primary))"
        />
      </svg>
    </motion.a>
  );
}

function HeroTitles() {
  return (
    <div className="flex flex-col items-center lg:items-start overflow-hidden pt-4 sm:pt-8 lg:pt-12">
      <motion.h1
        className="text-center lg:text-left text-3xl sm:text-4xl font-semibold leading-tight sm:leading-tighter text-foreground md:text-5xl lg:text-6xl tracking-tighter"
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
          <AuroraText className="leading-tight sm:leading-normal">
            Apps That Think Like Your Users
          </AuroraText>
        </motion.span>
      </motion.h1>
      <motion.p
        className="text-center lg:text-left max-w-xl leading-normal text-muted-foreground text-base sm:text-lg sm:leading-normal text-balance mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease,
        }}
      >
        Build adaptive interfaces that guide users to what they need, instantly
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
            "w-full sm:w-auto text-background flex gap-2 rounded-lg py-6 sm:py-4"
          )}
        >
          <Icons.logo className="h-5 w-5 sm:h-6 sm:w-6" />
          Get Early Access
        </Button>
      </motion.div>
      <EmailDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}
const LazySpline = lazy(() => import("@splinetool/react-spline"));

export function Hero() {
  const [showSpline, setShowSpline] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => {
        setShowSpline(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  return (
    <Section id="hero" className="py-8 sm:py-12 lg:py-24">
      <div className="flex flex-col lg:flex-row items-center w-full lg:gap-16">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-4 sm:px-6 lg:px-0 lg:max-w-[640px]">
          <HeroPill />
          <HeroTitles />

          {/* Mobile animation */}
          <div className="block lg:hidden w-full aspect-square mt-8">
            <Suspense>
              {showSpline && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="w-full h-full"
                >
                  <LazySpline
                    scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                    className="w-full h-full"
                  />
                </motion.div>
              )}
            </Suspense>
          </div>

          <HeroCTA />
        </div>

        {/* Desktop animation */}
        <div className="hidden lg:block w-[640px] aspect-square">
          <Suspense>
            {showSpline && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="w-full h-full"
              >
                <LazySpline
                  scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
                  className="w-full h-full"
                />
              </motion.div>
            )}
          </Suspense>
        </div>
      </div>
    </Section>
  );
}
