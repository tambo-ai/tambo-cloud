# AGENTS.md — Unified coding instructions for AI agents

Audience: any AI/code assistant contributing to this repository (tambo-cloud). This file consolidates all agent-facing rules found in .cursor, .cursorrules, .charlie, CONTRIBUTING.md, devdocs, and local conventions. Prefer this document over scattered files. If something here conflicts with product requirements, ask in Slack before proceeding.

## 0) Scope and repository layout

- apps/web — Next.js app (UI)
- apps/api — NestJS app (OpenAPI server)
- packages/db — Drizzle ORM schema + migrations + DB helpers
- packages/core — Shared pure utilities (no DB access)
- packages/backend — LLM/agent-side helpers
- packages/eslint-config, packages/typescript-config — shared tooling configs

## 1) Core principles (always)

- Read the relevant code first; follow existing patterns and naming.
- Keep solutions small and simple; favor functions over classes; avoid unnecessary abstractions.
- Prefer immutability. Don’t mutate inputs; return new values. Use const, toSorted, object/array spreads.
- Handle errors up-front with guard clauses and early returns.
- Strict TypeScript: no any, no type assertions unless unavoidable; define precise types.
- Use English; meaningful names with standard abbreviations only (API, URL, ctx, req, res, next). Booleans start with is/has/can/should.
- File/dir naming: kebab-case. Classes: PascalCase. Vars/functions/methods: camelCase. ENV vars: UPPER_SNAKE_CASE.
- Exports: prefer named exports; allow multiple exports when they belong together (e.g., component + related types); avoid default exports.

## 2) Workspace commands and verification

Run locally before opening/updating a PR:

```bash
npm run check-types   # TS across workspace
npm run lint -- --fix # ESLint autofix
npm run format        # Prettier write
npm test              # Unit/integration tests
```

Database (Drizzle):

```bash
# Generate migrations from schema changes
npm run db:generate
# Apply migrations
npm run db:migrate
# Check status / open studio
npm run db:check
npm run db:studio
```

Conventional commits (PR titles too):

```
<type>[scope]: <description>

feat(api): add transcript export
fix(web): prevent duplicate project creation
chore(db): reorganize migration files
```

Primary scopes: api, web, core, db, deps, ci, config, docs, test, refactor, chore.

Closing issues: use “Fixes #123” (GitHub) or “Fixes TAM-123” (Linear) in PR body.

Dependencies and tooling: do not add/upgrade/remove deps or change tool configs unless explicitly asked.

## 3) Frontend (React + Next.js)

- Prefer functional, declarative components; avoid classes.
- Types
  - Use TypeScript everywhere. Use interfaces for object shapes.
  - Prefer React.FC for components. Use PropsWithChildren and ComponentProps[WithRef|WithoutRef] as needed.
  - Exports: prefer named exports; allow multiple exports when they belong together (e.g., component + related types); avoid default exports.
- State & data
  - Local UI: use useState/useReducer. Shared: Context. Server state: React Query/tRPC hooks.
  - Minimize useEffect; derive state or memoize instead. Memoize callbacks with useCallback when passed to children.
  - For tRPC/React Query, don’t track separate loading flags—use hook states. Follow devdocs/LOADING_STATES.md patterns for skeletons and disabling controls.
- Layout & styling (Tailwind + shadcn)
  - Use flex/grid; manage spacing primarily with gap-_, and element padding p-_. Avoid margins and avoid space-x/y.
  - Truncate overflowing text with text-ellipsis. Prefer minimal Tailwind usage; avoid ad-hoc CSS.
- Typography
  - Sentient for headings (font-heading/font-sentient), Geist Sans for body (font-sans), Geist Mono for code (font-mono). See apps/web/lib/fonts.ts and tailwind.config.ts.

## 4) Backend (NestJS in apps/api)

- Modular structure
  - One module per main route/domain; one primary controller per route; DTOs (class-validator) for inputs; simple types for outputs.
  - Services encapsulate business logic; keep pure where possible.
  - Use guards/filters/interceptors via a core module. Shared utilities live in a shared module.
- Error handling
  - Pure functions: return Result/Either-style objects; don’t throw.
  - Boundaries (controllers/services): translate into HTTP/Nest exceptions when appropriate.
- Testing
  - Unit tests for public functions; integration/e2e for controllers/modules via Jest + supertest.

## 5) Database (Drizzle ORM)

- Source of truth is packages/db/src/schema.ts. Do not hand-edit generated SQL.
- One logical change per migration; keep up/down idempotent and focused.
- Prefer prepared statements and transactions when needed; keep DB logic isolated from business logic.

## 6) Shared utilities and packages

- packages/core: pure utilities (validation, JSON, crypto, threading, tool utilities). Avoid DB access here.
- packages/backend: LLM/agent-side helpers and streaming utilities.
- Reuse helpers; don’t duplicate logic. If a utility is useful across packages, colocate in core; if it’s LLM-specific, in backend.

## 7) Functions and classes (design rules)

- Keep functions short and single-purpose; ideally <20 statements.
- Use verbs for functions; boolean-returning: isX/hasX/canX. If a function returns void, prefer executeX/saveX naming.
- Avoid deep nesting: prefer early exits and extracting helpers. Use map/filter/reduce for iteration.
- Prefer immutable data; use readonly and as const where applicable.
- Favor composition over inheritance. If classes are used, keep them small (<200 statements, <10 properties/methods) and validate invariants internally.

## 8) Documentation authoring (when adding docs)

Every concept page should follow this structure:

0. Title + one-line description
1. How Does It Work? (start with a simple code example)
2. Why Use X? (2–4 bullets)
3. Progressive feature sections (basic → advanced)
4. Usage patterns/examples
5. Integrations with other features

Include multiple TS examples with comments and good/poor markers (✅/❌) when helpful. Use callouts for cross-links and warnings.

## 9) Naming conventions (React-specific additions)

- React SDK naming in this repo follows devdocs/NAMING_CONVENTIONS.md. Common patterns:
  - Components: TamboXxx; Hooks: useTamboXxx; Props interfaces: TamboXxxProps.
  - Event props start with onX; internal handlers use handleX.

## 10) What agents must not do

- Don’t introduce dependencies or modify tool configs unless explicitly requested.
- Don’t create generic index.ts barrels for internal modules; import directly from concrete files.
- Don’t commit secrets. Use env files.

---
