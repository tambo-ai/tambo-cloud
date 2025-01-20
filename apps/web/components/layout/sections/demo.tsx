"use client";

import React from "react";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";

export const DemoSection: React.FC = () => {
  return (
    <section className="container w-full">
      <div className="flex flex-col items-center mx-auto py-12 md:py-20">
        <HeroVideoDialog
          videoSrc="/videos/yage-demo.mp4"
          animationStyle="from-bottom"
          className="w-full max-w-5xl"
          theme="system"
        />
      </div>
    </section>
  );
};
