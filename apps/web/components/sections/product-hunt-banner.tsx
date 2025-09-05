"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import Image from "next/image";
import { FC, useEffect, useState } from "react";

const STORAGE_KEY = "product_hunt_banner_dismissed_session";

export const ProductHuntBanner: FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const productHuntUrl =
    process.env.NEXT_PUBLIC_PRODUCT_HUNT_URL ||
    "https://www.producthunt.com/products/tambo";

  useEffect(() => {
    try {
      const dismissed =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(STORAGE_KEY) === "1";
      setIsVisible(!dismissed);
    } catch {
      setIsVisible(true);
    } finally {
      setMounted(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  const handleUpvote = () => {
    window.open(productHuntUrl, "_blank", "noopener,noreferrer");
  };

  if (!mounted) return null;

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="product-hunt-banner"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full relative z-[70]"
        >
          <div className="w-full ring-1 ring-orange-400/20 bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur">
            <div className="mx-auto max-w-[1400px] px-4 py-3 relative">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-md flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/product-hunt-logo.png"
                      alt="Product Hunt Logo"
                      width={24}
                      height={24}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-orange-700 text-center">
                    <span className="hidden sm:inline">
                      We&apos;re live on Product Hunt! Help us reach more
                      developers.
                    </span>
                    <span className="sm:hidden">Live on Product Hunt!</span>
                  </span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={handleUpvote}
                    aria-label="Upvote on Product Hunt"
                    className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/40 text-orange-700 bg-orange-100/50 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-orange-200/50 transition-colors whitespace-nowrap"
                  >
                    <span>Upvote</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </motion.div>
              </div>

              <motion.button
                type="button"
                aria-label="Dismiss banner"
                onClick={handleDismiss}
                onPointerDown={(e) => {
                  if (e.pointerType === "mouse" || e.pointerType === "pen")
                    handleDismiss();
                }}
                whileTap={{ scale: 0.94 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-orange-600 hover:bg-orange-200/50 transition-colors"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
