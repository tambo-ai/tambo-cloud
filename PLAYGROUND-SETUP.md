# Tambo Cloud Setup Guide (Playground + DB + Env)

This guide covers environment variables, database (SQL) migrations, and steps to run the Tambo Cloud workspace locally, including the Playground changes (Quick Start button that asks AI to start a dev server) and required keys.

---

## Prerequisites

- Node.js 22 and npm 11 (Volta/pnpm not required)
- PostgreSQL 14+ (via Docker or Supabase local)
- Optional: Docker Desktop (for full-stack via docker-compose)

Check package engines:

- node >= 22
- npm >= 10 (repo uses npm 11)

---

## Environment Variables

There are multiple env files. Start by copying the examples:

- apps/web/.env.example → apps/web/.env
- packages/db/.env.example → packages/db/.env
- docker.env.example → docker.env (only if using Docker compose)

Key variables you will likely need:

Server/runtime (apps/web/lib/env.ts enforces/reads these)

- DATABASE_URL: Postgres connection string
- API_KEY_SECRET: Secret used for encrypting/decrypting Hydra API keys
- PROVIDER_KEY_SECRET: Secret used for encrypting/decrypting provider keys
- NEXTAUTH_SECRET: Random string (openssl rand -hex 32)
- NEXTAUTH_URL: e.g. http://localhost:3000
- FREESTYLE_API_KEY: Required for the AI Playground sandbox integration (server-side only)
- Optional auth providers: GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET
- Optional: RESEND_API_KEY/RESEND_AUDIENCE_ID, SLACK_OAUTH_TOKEN, GITHUB_TOKEN, ALLOW_LOCAL_MCP_SERVERS, etc.

Client/public

- NEXT_PUBLIC_TAMBO_API_URL: e.g. http://localhost:3001 (your Tambo API URL)
- NEXT_PUBLIC_TAMBO_API_KEY: API key for talking to your Tambo API
- NEXT_PUBLIC_TAMBO_DASH_KEY: Optional dashboard key
- Optional analytics/sentry: NEXT*PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_SENTRY*\*

Reference files:

- tambo-cloud/apps/web/.env.example
- tambo-cloud/packages/db/.env.example
- tambo-cloud/docker.env.example

---

## Database and SQL Migrations

This repo uses Drizzle for schema and migrations.

- Drizzle config: tambo-cloud/packages/db/drizzle.config.ts
- Migrations directory: tambo-cloud/packages/db/migrations/
- Initial and incremental SQL changes are tracked as sequential files (e.g., 0000*init_setup.sql, 0001*..., etc.). Apply all migrations to provision the database.

Common commands (run from tambo-cloud/):

- npm run db:generate → Generate migrations from schema changes
- npm run db:migrate → Apply migrations (uses packages/db/drizzle.config.ts)
- npm run db:check → Check migration status
- npm run db:studio → Open Drizzle Studio

Docker flow:

- Copy docker.env.example → docker.env and fill values
- Start stack (see DOCKER_README.md or scripts): docker compose --env-file docker.env up -d
- Initialize DB inside the API container: ./scripts/init-database.sh (delegates into the running container and runs npm run db:migrate)

Local Postgres (without Docker):

- Ensure DATABASE_URL in packages/db/.env and/or apps/web/.env points to your local DB
- Run: npm run db:migrate

Note on SQL changes: the entire set of SQL changes is the cumulative migration history in packages/db/migrations. If you need a plain-text dump of all changes, concatenate these files in order.

---

## Running the Apps

Monorepo scripts (from tambo-cloud/):

- npm install
- npm run dev → runs workspace apps via Turborepo

Key apps:

- apps/web (Next.js): the main dashboard + Playground UI
- apps/api (if present in your workspace filters) → Hydra API

If using Docker, refer to tambo-cloud/DOCKER_README.md for containerized start commands.

---

## Playground: Quick Start Button + Keys

The Playground includes a Quick Start button in the App Viewer when no sandbox is connected. It dispatches a message asking AI to:

- Create a development sandbox and start a dev server
- Set env (notably your Tambo API key)
- Expose a live preview URL (saved and auto-loaded in the viewer)

To enable Playground actions, set:

- FREESTYLE_API_KEY (server-only)
- NEXT_PUBLIC_TAMBO_API_URL and NEXT_PUBLIC_TAMBO_API_KEY (client)

You can also use the chat to ask: "Create a tambo chat app".

---

## Recommended Local Values

- DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
  - If you use Supabase local: supabase start (ports usually 54322)
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=(openssl rand -hex 32)
- NEXT_PUBLIC_TAMBO_API_URL=http://localhost:3001
- NEXT_PUBLIC_TAMBO_API_KEY=(your key)
- FREESTYLE_API_KEY=(your Freestyle API key)

---

## Troubleshooting

- Env validation errors at boot: apps/web/lib/env.ts prints missing/invalid keys. Set the required variables.
- DB connection issues: verify DATABASE_URL and that Postgres is reachable.
- Migrations not applied: run npm run db:migrate or ./scripts/init-database.sh (Docker).
- Playground not starting sandboxes: ensure FREESTYLE_API_KEY is set on the server and that your account has access.

---

## PR Checklist (use in your PR description)

- [ ] Added SETUP.md with env and DB steps
- [ ] Verified .env files created from examples
- [ ] Database migrated (npm run db:migrate or init script)
- [ ] FREESTYLE_API_KEY configured for Playground
- [ ] NEXT_PUBLIC_TAMBO_API_URL and NEXT_PUBLIC_TAMBO_API_KEY set
- [ ] Manual test: Quick Start button dispatches message and chat receives it
- [ ] Manual test: If sandbox exists, viewer loads preview URL

---

## References

- tambo-cloud/GETTING_STARTED.md
- tambo-cloud/DOCKER_README.md
- tambo-cloud/apps/web/.env.example
- tambo-cloud/packages/db/.env.example
- tambo-cloud/packages/db/migrations/
