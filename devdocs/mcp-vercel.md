### MCP server on Vercel (`mcp.tambo.co`)

This guide documents how we deploy the Inkeep MCP server to Vercel and attach the custom domain `mcp.tambo.co`, with basic observability via PostHog and Sentry.

## 1) Project setup (Vercel)

- Fork the Inkeep template: `inkeep/mcp-for-vercel`.
- Import the fork into Vercel as a new project. Root of the repo should be used (per template defaults).
- Set framework preset as recommended by the template (Node/Edge function; Vercel auto-detects).

## 2) Environment variables (Vercel → Settings → Environment Variables)

Add the following. Use Production/Preview as appropriate.

- POSTHOG_KEY: your PostHog Project API key
- POSTHOG_HOST: PostHog host (e.g. https://app.posthog.com)
- SENTRY_DSN: Sentry DSN for the MCP service
- SENTRY_ENVIRONMENT: production
- NODE_ENV: production

If the Inkeep template requires additional variables, add those as documented in `https://docs.inkeep.com/mcp/vercel-deployment`.

## 3) PostHog integration (in the fork)

- Install server SDK in the forked repo:
  - npm i posthog-node
- Initialize once at module load (e.g., in the server entry or a small `telemetry.ts`):
  - const posthog = new PostHog(process.env.POSTHOG_KEY!, { host: process.env.POSTHOG_HOST });
- Track minimal events:
  - conversation_started, conversation_completed
  - tool_invoked (properties: toolName, durationMs, success)
- Ensure the client is flushed before function exit when needed (await posthog.shutdown()).

Environment variables used:

- POSTHOG_KEY
- POSTHOG_HOST (e.g. https://app.posthog.com)

## 4) Sentry integration (in the fork)

- Install: npm i @sentry/node @sentry/profiling-node
- Initialize early in the server code:
  - Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.SENTRY_ENVIRONMENT, tracesSampleRate: 1.0 });
    Environment variables used:
- SENTRY_DSN
- SENTRY_ENVIRONMENT (e.g. production)
- Wrap the request handler to capture exceptions (Sentry.captureException(err)).
- For Vercel edge/func handlers, ensure the init happens outside the handler for cold starts.

## 5) Custom domain: `mcp.tambo.co`

- In the Vercel project (fork), go to Settings → Domains → Add. Enter `mcp.tambo.co`.
- Vercel will provide a DNS target. In the DNS provider (Cloudflare) add:
  - CNAME `mcp` → the target shown by Vercel (commonly `cname.vercel-dns.com`).
- Verify the domain in Vercel once DNS propagates. SSL certs will be issued automatically by Vercel.

Notes:

- If using Cloudflare, start with DNS-only (grey-cloud). You can experiment with orange-cloud proxy later if desired; Vercel SSL works best with DNS-only.

## 6) Smoke test

- From this repo, run: `npm run smoke:mcp` (script calls `scripts/smoke-mcp.sh`).
- The script checks basic reachability of `https://mcp.tambo.co` and verifies Vercel headers.

## 7) Observability check

- Trigger a minimal request to generate an event:
  - Confirm PostHog events appear under the project (e.g., tool_invoked) with host `mcp.tambo.co`.
  - Trigger an intentional error on a test route (if available) to confirm Sentry receives it.

## 8) Updating

- Any changes to the MCP server (forked template) should be made in that fork and will deploy via Vercel.
- Do not commit secrets here; all sensitive config lives in Vercel env vars.

## Appendix: Minimal code snippets (to add in the fork)

```ts
// telemetry.ts (in the forked inkeep/mcp-for-vercel project)
import * as Sentry from "@sentry/node";
import { PostHog } from "posthog-node";

export const posthog = process.env.POSTHOG_KEY
  ? new PostHog(process.env.POSTHOG_KEY, { host: process.env.POSTHOG_HOST })
  : undefined;

export function initSentry() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: 1,
  });
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!posthog) return;
  posthog.capture({
    distinctId: "mcp-server",
    event: name,
    properties,
  });
}
```

```ts
// in your request handler
import * as Sentry from "@sentry/node";
import { initSentry, posthog, trackEvent } from "./telemetry";

initSentry();

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  try {
    trackEvent("conversation_started");
    // ... actual MCP handling ...
    trackEvent("conversation_completed", { durationMs: Date.now() - start });
    return new Response("ok");
  } catch (err) {
    Sentry.captureException(err);
    trackEvent("error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return new Response("error", { status: 500 });
  } finally {
    await posthog?.shutdownAsync?.();
  }
}
```
