import { env } from "@/lib/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Resend } from "resend";
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

      // If available, block emails to unsubscribed contacts (best-effort)
      if (env.RESEND_AUDIENCE_ID) {
        try {
          const listResult: any = await (resend as any).contacts
            ?.list?.({ audienceId: env.RESEND_AUDIENCE_ID, limit: 200 })
            .catch(() => null);
          const contacts = Array.isArray(listResult?.data)
            ? listResult.data
            : Array.isArray(listResult?.results)
              ? listResult.results
              : Array.isArray(listResult)
                ? listResult
                : Array.isArray(listResult?.data?.data)
                  ? listResult.data.data
                  : [];
          const lower = input.email.toLowerCase();
          const match = contacts.find(
            (c: any) =>
              typeof c?.email === "string" && c.email.toLowerCase() === lower,
          );
          if (match?.unsubscribed === true) {
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
