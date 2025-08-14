# syntax=docker/dockerfile:1.6

# Common base
FROM node:22-alpine AS base
RUN npm install -g npm@^11
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
# Create non-root user consistently across images
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodejs \
  && chown -R nodejs:nodejs /app

# Dependencies layer: only package manifests, derived dynamically from workspaces
FROM base AS deps
# Add workspace manifest copy helper
COPY scripts/copy-workspace-manifests.js ./scripts/copy-workspace-manifests.js
# Dry-run to log what would be copied, then perform the copy
RUN --mount=type=bind,source=.,target=/src,readonly \
  node ./scripts/copy-workspace-manifests.js --dry-run --src /src --dst /app
RUN --mount=type=bind,source=.,target=/src,readonly \
  node ./scripts/copy-workspace-manifests.js --src /src --dst /app
# Install all dependencies (cached by manifests only)
# Install deps without running lifecycle scripts (postinstall, etc.)
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

# Build stage
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# Overlay workspace node_modules into packages/ and apps/
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
# Build filtered app
ARG TURBO_FILTER="hydra-api"
ENV NODE_OPTIONS="--experimental-require-module"
ENV SKIP_ENV_VALIDATION=true
RUN --mount=type=cache,target=/root/.npm npx turbo build --filter=${TURBO_FILTER}
# Prune dev dependencies after successful build to keep only production deps
RUN npm prune --omit=dev --workspaces --include-workspace-root

# Runtime stage
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat curl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# Copy pruned node_modules
COPY --from=builder /app/node_modules ./node_modules
# Copy only built API output
COPY --from=builder /app/apps/api/dist ./apps/api/dist
# Copy minimal packages (package.json + built dist) to satisfy workspace symlinks
COPY --from=builder /app/packages ./packages
# Remove development-only sources from packages to slim image
RUN find packages -type d -name 'src' -prune -exec rm -rf {} + || true \
  && find packages -type d -name 'test' -prune -exec rm -rf {} + || true \
  && find packages -type d -name '__tests__' -prune -exec rm -rf {} + || true \
  && find packages -type f -name '*.ts' -exec rm -f {} + || true
# Create and use non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodejs \
  && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
ENV PORT=3000

# Start API
CMD ["node", "apps/api/dist/apps/api/src/main"]