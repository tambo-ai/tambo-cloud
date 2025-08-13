// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DISALLOWED_EMAIL_DOMAINS: z.string().min(1).optional(),
    INTERNAL_SLACK_USER_ID: z.string().min(1).optional(),
    SLACK_OAUTH_TOKEN: z.string().min(1).optional(),
    PORT: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1),
    /** Generate with `openssl rand -hex 32` */
    API_KEY_SECRET: z.string().min(8),
    /** Generate with `openssl rand -hex 32` */
    PROVIDER_KEY_SECRET: z.string().min(8),
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_AUDIENCE_ID: z.string().min(1).optional(),
    // for smoketesting
    WEATHER_API_KEY: z.string().min(1).optional(),
    // Dev-only, allow testing server-side MCP servers running locally
    ALLOW_LOCAL_MCP_SERVERS: z.string().min(1).optional(),
    GITHUB_TOKEN: z.string().min(1).optional(),
    // NextAuth OAuth providers
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    /** Generate with `openssl rand -hex 32` */
    NEXTAUTH_SECRET: z.string().min(8),
    /** URL of the client app so we can redirect back to it after auth, e.g. https://tambo.co or http://localhost:3000 */
    NEXTAUTH_URL: z.string().url(),
    EMAIL_FROM_DEFAULT: z.string().min(1),

    // Whitelabeling (server-side copies; optional so can be omitted)
    TAMBO_WHITELABEL_ORG_NAME: z.string().min(1).optional(),
    TAMBO_WHITELABEL_ORG_LOGO: z.string().url().optional(),
    // Restrict logins to a specific verified email domain when self-hosting.
    // When unset, any verified email is allowed.
    ALLOWED_LOGIN_DOMAIN: z.string().min(1).optional(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1).optional(),
    // for dogfooding our own API
    NEXT_PUBLIC_TAMBO_API_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_TAMBO_DASH_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_TAMBO_API_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SMOKETEST_TAMBO_API_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SMOKETEST_PROJECT_ID: z.string().min(1).optional(),

    // TamboHack URL
    NEXT_PUBLIC_TAMBOHACK_URL: z.string().url().optional(),

    // Whitelabeling vars
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME: z.string().min(1).optional(),
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO: z.string().url().optional(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DISALLOWED_EMAIL_DOMAINS: process.env.DISALLOWED_EMAIL_DOMAINS,
    INTERNAL_SLACK_USER_ID: process.env.INTERNAL_SLACK_USER_ID,
    SLACK_OAUTH_TOKEN: process.env.SLACK_OAUTH_TOKEN,
    PORT: process.env.PORT,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    API_KEY_SECRET: process.env.API_KEY_SECRET,
    PROVIDER_KEY_SECRET: process.env.PROVIDER_KEY_SECRET,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    NEXT_PUBLIC_TAMBO_API_KEY: process.env.NEXT_PUBLIC_TAMBO_API_KEY,
    NEXT_PUBLIC_TAMBO_DASH_KEY: process.env.NEXT_PUBLIC_TAMBO_DASH_KEY,
    NEXT_PUBLIC_TAMBO_API_URL: process.env.NEXT_PUBLIC_TAMBO_API_URL,
    NEXT_PUBLIC_SMOKETEST_TAMBO_API_KEY:
      process.env.NEXT_PUBLIC_SMOKETEST_TAMBO_API_KEY,
    NEXT_PUBLIC_SMOKETEST_PROJECT_ID:
      process.env.NEXT_PUBLIC_SMOKETEST_PROJECT_ID,

    // TamboHack URL
    NEXT_PUBLIC_TAMBOHACK_URL: process.env.NEXT_PUBLIC_TAMBOHACK_URL,

    // Whitelabeling (falls back to non-public vars for convenience)
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME:
      process.env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME ??
      process.env.TAMBO_WHITELABEL_ORG_NAME,
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO:
      process.env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO ??
      process.env.TAMBO_WHITELABEL_ORG_LOGO,
    ALLOW_LOCAL_MCP_SERVERS: process.env.ALLOW_LOCAL_MCP_SERVERS,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    // NextAuth OAuth providers
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    EMAIL_FROM_DEFAULT: process.env.EMAIL_FROM_DEFAULT,

    // Whitelabeling server values (mirrors client fallbacks)
    TAMBO_WHITELABEL_ORG_NAME: process.env.TAMBO_WHITELABEL_ORG_NAME,
    TAMBO_WHITELABEL_ORG_LOGO: process.env.TAMBO_WHITELABEL_ORG_LOGO,
    ALLOWED_LOGIN_DOMAIN: process.env.ALLOWED_LOGIN_DOMAIN,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
