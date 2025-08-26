### Docs MCP deployable placeholder

We recommend using our managed MCP endpoint at `mcp.tambo.co`.

If you prefer to host your own MCP (e.g., fork `inkeep/mcp-for-vercel` and deploy on Vercel under your domain), follow the guidance in `devdocs/mcp-vercel.md`. Our client-side code will work even if analytics and error logging are not configured; when the related env vars are omitted, those integrations remain disabled.
