### MCP server on Vercel (recommended: use `mcp.tambo.co`)

We recommend using our managed MCP endpoint at `mcp.tambo.co`. It provides a stable, branded entry point for client apps.

If you prefer to self-host (e.g., use your own domain or customize the template), you can fork and deploy the Inkeep template. Our clients operate gracefully if analytics/error logging are not configured; those integrations are optional.

Code in this repo (vendored from the Inkeep template) lives at: `apps/docs-mcp`.

## 1) Project setup (Vercel)

- Fork the Inkeep template: `inkeep/mcp-for-vercel`.
- Import the fork into Vercel as a new project. Root of the repo should be used (per template defaults).
- Set framework preset as recommended by the template (Node/Edge function; Vercel auto-detects).

## 2) Environment variables (Vercel → Settings → Environment Variables)

Add only the variables required by the template you deploy. If you enable analytics or error logging, add their env vars as needed. If these are omitted, the MCP still runs (observability will simply be disabled).

Reference: `https://docs.inkeep.com/mcp/vercel-deployment`.
