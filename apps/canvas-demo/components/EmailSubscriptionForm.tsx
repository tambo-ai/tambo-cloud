import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { posthog } from "@/app/providers";
import { useCallback, useEffect, useRef } from "react";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});

type FormData = z.infer<typeof formSchema>;

export function EmailSubscriptionForm() {
  const { toast } = useToast();
  const formStartTime = useRef<number | null>(null);
  const formOpenTime = useRef(Date.now());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Track when form is first interacted with
  useEffect(() => {
    const currentFormOpenTime = formOpenTime.current;

    posthog.capture("demo_form_viewed", {
      view_timestamp: currentFormOpenTime,
    });

    return () => {
      if (!isDirty) {
        posthog.capture("demo_form_abandoned", {
          time_spent_ms: Date.now() - currentFormOpenTime,
          had_interaction: false,
        });
      }
    };
  }, [isDirty]);

  // Watch for form interactions
  const email = watch("email");
  useEffect(() => {
    if (email && !formStartTime.current) {
      formStartTime.current = Date.now();
      const currentFormOpenTime = formOpenTime.current;
      posthog.capture("demo_form_started", {
        time_since_view_ms: Date.now() - currentFormOpenTime,
      });
    }
  }, [email]);

  const onSubmit = useCallback(
    (data: FormData) => {
      const submissionStartTime = performance.now();
      const currentFormStartTime = formStartTime.current;
      const currentFormOpenTime = formOpenTime.current;

      posthog.capture("demo_form_submitted", {
        time_to_complete_ms: currentFormStartTime
          ? Date.now() - currentFormStartTime
          : 0,
        total_time_on_form_ms: Date.now() - currentFormOpenTime,
      });

      void fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to send request");
          }

          posthog.capture("demo_request_success", {
            email_domain: data.email.split("@")[1],
            response_time_ms: performance.now() - submissionStartTime,
          });

          toast({
            title: "Thanks for your interest!",
            description: "We'll be in touch soon to schedule a demo.",
          });
          reset();
          formStartTime.current = null;
        })
        .catch((error: unknown) => {
          posthog.capture("demo_request_error", {
            error: error instanceof Error ? error.message : "Unknown error",
            failed_after_ms: performance.now() - submissionStartTime,
          });

          toast({
            title: "Error",
            description: "Failed to submit. Please try again.",
            variant: "destructive",
          });
        });
    },
    [reset, toast]
  );

  const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit(onSubmit)(e);
  };

  return (
    <form onSubmit={onSubmitForm} className="space-y-4">
      <h3 className="font-medium text-base">Want to book a demo?</h3>
      <div className="space-y-2">
        <Input
          {...register("email")}
          type="email"
          placeholder="you@company.com"
          className={cn(
            "h-10",
            errors.email && "border-destructive focus-visible:ring-destructive"
          )}
          aria-label="Email for demo request"
        />
        {errors.email && (
          <p className="text-sm text-destructive px-1">
            {errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Schedule a Demo"
        )}
      </Button>
    </form>
  );
}
