"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import Image from "next/image";
import { FC, useEffect, useState } from "react";

const STORAGE_KEY = "product_hunt_notification_dismissed_session";

interface ProductHuntNotificationProps {
  /** Custom className for styling */
  className?: string;
  /** Custom Product Hunt URL */
  productHuntUrl?: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** CSS positioning mode for the wrapper (defaults to `fixed`) */
  position?: "fixed" | "absolute" | "relative" | "static" | "sticky";
}

export const ProductHuntNotification: FC<ProductHuntNotificationProps> = ({
  className,
  productHuntUrl = "https://www.producthunt.com/products/tambo",
  onDismiss,
  position = "fixed",
}) => {
  // Map to static Tailwind utilities to avoid purge issues
  const positionClass =
    position === "fixed"
      ? "fixed"
      : position === "absolute"
        ? "absolute"
        : position === "relative"
          ? "relative"
          : position === "static"
            ? "static"
            : "sticky";
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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
    onDismiss?.();
  };

  const handleUpvote = () => {
    window.open(productHuntUrl, "_blank", "noopener,noreferrer");
  };

  if (!mounted) return null;

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="product-hunt-notification"
          initial={{
            opacity: 0,
            y: 10,
            scale: 0.95,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: 10,
            scale: 0.95,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`${positionClass} z-[60] max-w-sm ${className || ""}`}
        >
          {/* Thought bubble design */}
          <div className="relative">
            {/* Main thought bubble */}
            <div className="bg-white border-2 border-orange-300 rounded-2xl shadow-lg p-4 relative">
              {/* Thought bubble tail */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r-2 border-b-2 border-orange-300 transform rotate-45"></div>
              <div className="absolute -bottom-4 right-12 w-2 h-2 bg-white border-2 border-orange-300 rounded-full"></div>
              <div className="absolute -bottom-6 right-16 w-1 h-1 bg-orange-300 rounded-full"></div>

              <div className="flex items-start gap-3">
                {/* Product Hunt Logo */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                    <Image
                      src="/product-hunt-logo.png"
                      alt="Product Hunt Logo"
                      width={24}
                      height={24}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                    We&apos;re live on Product Hunt! 🚀
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Help us reach more developers with an upvote
                  </p>

                  {/* Action button */}
                  <motion.button
                    type="button"
                    onClick={handleUpvote}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium rounded-md hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-sm"
                  >
                    <span>Upvote Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </motion.button>
                </div>

                {/* Close button */}
                <motion.button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={handleDismiss}
                  whileTap={{ scale: 0.94 }}
                  className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
