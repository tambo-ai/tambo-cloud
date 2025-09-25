import { env } from "@/lib/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Resend } from "resend";
import { isResendEmailUnsubscribed } from "@tambo-ai-cloud/core";
import { z } from "zod";

/**
 * This router is used to handle application-level operations, mostly internal stuff
 */
export const appRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      if (!env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not set");
      }

      const resend = new Resend(env.RESEND_API_KEY);

      // If available, block emails to unsubscribed contacts (best‑effort)
      if (env.RESEND_AUDIENCE_ID) {
        try {
          const unsubscribed = await isResendEmailUnsubscribed(
            resend.contacts,
            env.RESEND_AUDIENCE_ID,
            input.email,
          );
          if (unsubscribed) {
            return { success: false, error: "Recipient is unsubscribed" };
          }
        } catch {
          // proceed if we cannot determine
        }
      }

      const data = await resend.emails.send({
        from: "Tambo AI <magan@tambo.co>",
        to: input.email,
        subject: "Welcome to Tambo AI Early Access",
        html: `
          <h1>Welcome to Tambo AI!</h1>
          <p>Thanks for joining our early access list. We'll keep you updated on our latest developments.</p>
          <p>Best,<br>The Tambo AI Team</p>
        `,
      });

      return { success: true, data };
    }),
});
