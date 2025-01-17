import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});

type FormData = z.infer<typeof formSchema>;

export function WelcomeModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      posthog?.capture("welcome_modal_viewed");
    }
  }, [isOpen]);

  const onSubmit = async (data: FormData) => {
    try {
      posthog?.capture("demo_request_submitted", { email: data.email });
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (response.ok) {
        setIsSuccess(true);
        posthog?.capture("demo_request_success", { email: data.email });
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      posthog?.capture("demo_request_error", {
        email: data.email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit(onSubmit)(e);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background">
            <motion.div
              className="absolute top-0 w-full h-1.5 bg-primary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <div className="relative p-8">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        Thanks for your interest!
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        We&apos;ll be in touch soon.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DialogHeader className="space-y-6 relative">
                      <motion.div
                        className="flex items-center justify-center space-x-3"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Sparkles className="h-8 w-8 text-primary" />
                        </motion.div>
                        <DialogTitle className="text-3xl font-bold text-foreground">
                          Analytics Canvas
                        </DialogTitle>
                      </motion.div>
                      <DialogDescription className="text-center text-base">
                        Built with{" "}
                        <a
                          href="https://usehydra.ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:text-primary/90 transition-colors inline-flex items-center gap-1 group"
                        >
                          Hydra AI
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </a>
                      </DialogDescription>
                    </DialogHeader>

                    <motion.div
                      className="space-y-8 py-8 relative"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.2,
                      }}
                    >
                      <div className="space-y-6">
                        <p className="text-lg text-foreground/90 leading-relaxed">
                          See how Hydra AI helps you build powerful analytics
                          applications with natural language.
                        </p>
                        <div className="bg-muted p-6 rounded-xl border">
                          <p className="text-base text-muted-foreground">
                            Want to use Hydra in your product? Let us know.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleFormSubmit} className="space-y-5">
                        <motion.div
                          className="space-y-2"
                          whileHover={{ scale: 1.01 }}
                          transition={{
                            duration: 0.2,
                          }}
                        >
                          <Input
                            {...register("email")}
                            type="email"
                            placeholder="you@company.com"
                            className={cn(
                              "h-12 text-base bg-background",
                              errors.email &&
                                "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive px-1">
                              {errors.email.message}
                            </p>
                          )}
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <span className="flex items-center gap-2">
                                Get Early Access
                                <ArrowRight className="h-4 w-4" />
                              </span>
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
