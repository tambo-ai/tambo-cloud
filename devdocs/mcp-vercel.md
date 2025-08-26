### MCP server on Vercel (recommended: use `mcp.tambo.co`)

We recommend using our managed MCP endpoint at `mcp.tambo.co`. It provides a stable, branded entry point for client apps.

If you prefer to self-host (e.g., use your own domain or customize the template), you can fork and deploy the Inkeep template. Our clients operate gracefully if analytics/error logging are not configured; those integrations are optional.

## 1) Project setup (Vercel)

- Fork the Inkeep template: `inkeep/mcp-for-vercel`.
- Import the fork into Vercel as a new project. Root of the repo should be used (per template defaults).
- Set framework preset as recommended by the template (Node/Edge function; Vercel auto-detects).

## 2) Environment variables (Vercel → Settings → Environment Variables)

Add only the variables required by the template you deploy. If you enable analytics or error logging, add their env vars as needed. If these are omitted, the MCP still runs (observability will simply be disabled).

Reference: `https://docs.inkeep.com/mcp/vercel-deployment`.

## 3) Optional: Analytics (PostHog)

- If desired, add PostHog to your forked deployment and set `POSTHOG_KEY` and `POSTHOG_HOST`.
- If not configured, analytics are skipped.

## 4) Optional: Error logging (Sentry)

- If desired, add Sentry to your forked deployment and set `SENTRY_DSN` (and optionally `SENTRY_ENVIRONMENT`).
- If not configured, errors won't be reported to Sentry, but the server will continue to function.

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

## 7) Observability check (optional)

- If you enabled analytics or Sentry, trigger a few requests to confirm events and errors are being collected.

## 8) Updating

- Any changes to the MCP server (forked template) should be made in that fork and will deploy via Vercel.
- Do not commit secrets here; all sensitive config lives in Vercel env vars.

## Appendix

- The Inkeep template evolves; always check their docs for the latest required env vars and handlers.
