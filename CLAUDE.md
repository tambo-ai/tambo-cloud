# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a **Tambo Cloud** monorepo - an AI development platform with LLM integrations and Model Context Protocol (MCP) support. The platform provides project management, thread-based conversations, and tool connectivity for AI applications.

### Core Applications

- **apps/api** (hydra-api) - NestJS backend with Swagger documentation, provides REST APIs for projects, threads, users, and LLM interactions
- **apps/web** (tambo-ai-landing-page) - Next.js frontend with landing page, dashboard, and project management interface
- **apps/mcp-proxy** - MCP (Model Context Protocol) proxy service for tool integrations

### Shared Packages

- **packages/db** - Drizzle ORM schema and migrations for PostgreSQL database
- **packages/backend** - LLM interaction and business logic library
- **packages/core** - Shared utilities and constants
- **packages/eslint-config** - ESLint configurations
- **packages/typescript-config** - TypeScript configurations

### Key Technologies

- **Backend**: NestJS 11+, TypeScript, OpenAI SDK, Composio for tools
- **Frontend**: Next.js 15+, React 18, Tailwind CSS, Shadcn UI, tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Supabase Auth with GitHub/Google OAuth
- **Infrastructure**: Turborepo, Node.js 22+, Docker for local Supabase

## Development Commands

### Core Workflow Commands
```bash
npm run dev              # Start all apps in development mode
npm run build            # Build all applications
npm run lint             # Lint all applications
npm run lint:fix         # Lint with automatic fixes
npm run check-types      # TypeScript type checking
npm run test             # Run all tests
```

### Database Commands
```bash
npm run db:generate      # Generate new migrations from schema changes
npm run db:migrate       # Apply pending migrations
npm run db:studio        # Open Drizzle Studio for database visualization
npm run db:check         # Check migration status
```

### Individual App Commands
```bash
# API only
turbo dev --filter=hydra-api
turbo build --filter=hydra-api

# Web only  
turbo dev --filter=tambo-ai-landing-page
turbo build --filter=tambo-ai-landing-page
```

### Environment Setup
Local development requires Supabase running in Docker. Use the setup script:
```bash
chmod +x setup.sh && ./setup.sh
```

## Architecture Patterns

### Database Schema
Core entities: Users (Supabase auth), Projects (user workspaces), API Keys (project-scoped), Provider Keys (encrypted LLM credentials), Threads (conversations), MCP Servers (tool integrations).

### Authentication Flow
- Supabase Auth handles user sessions with JWT tokens
- Project-level API key authentication for external access
- Protected tRPC procedures with session validation
- Project access control guards

### Frontend State Management
- tRPC for type-safe API communication
- React Query for server state caching
- Context providers for app-wide state
- Form state with react-hook-form

### API Design
NestJS controllers with Swagger documentation, transaction-wrapped operations, comprehensive error handling, and rate limiting.

## Key File Locations

- **Main APIs**: `apps/api/src/{projects,threads,users}/*.controller.ts`
- **Database Schema**: `packages/db/src/schema/`
- **Frontend Pages**: `apps/web/app/` (App Router)
- **UI Components**: `apps/web/components/`
- **tRPC Routes**: `apps/web/server/api/routers/`

## Testing and Quality

- **API Tests**: `apps/api/src/**/*.spec.ts` - Use Jest with NestJS testing utilities
- **Frontend Tests**: Limited, use React Testing Library when needed
- **E2E Tests**: `apps/api/test/app.e2e-spec.ts`
- **Lint/Format**: ESLint + Prettier with pre-commit hooks via Husky

Always run `npm run check-types` and `npm run lint` before committing changes.