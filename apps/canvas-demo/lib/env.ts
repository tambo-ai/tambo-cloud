import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    FRED_API_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    VERCEL_URL: z.string().optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  },
  client: {
    NEXT_PUBLIC_HYDRA_API_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    FRED_API_KEY: process.env.FRED_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_HYDRA_API_KEY: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
});
