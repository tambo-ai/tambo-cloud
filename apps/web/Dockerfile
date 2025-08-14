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
RUN --mount=type=bind,source=.,target=/src,readonly \
  node -e "const fs=require('fs');const path=require('path');const dst=process.cwd();const src='/src';const rootPkg=JSON.parse(fs.readFileSync(path.join(src,'package.json'),'utf8'));let workspaces=rootPkg.workspaces||[];if(workspaces && workspaces.packages) workspaces=workspaces.packages;workspaces=Array.isArray(workspaces)?workspaces:[workspaces].filter(Boolean);function copyRel(rel){const from=path.join(src,rel);if(fs.existsSync(from)){const to=path.join(dst,rel);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}}copyRel('package.json');copyRel('package-lock.json');for(const pat of workspaces){if(!pat) continue; if(pat.includes('*')){const baseDir=pat.split('*')[0].replace(/\/$/,'');const absBase=path.join(src,baseDir);if(fs.existsSync(absBase)){for(const entry of fs.readdirSync(absBase)){const relDir=path.join(baseDir,entry);copyRel(path.join(relDir,'package.json'));copyRel(path.join(relDir,'package-lock.json'));}}}else{copyRel(path.join(pat,'package.json'));copyRel(path.join(pat,'package-lock.json'));}}"
# Install all dependencies (cached by manifests only)
# Install deps without running lifecycle scripts (postinstall, etc.)
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

# Build stage
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules
ARG TURBO_FILTER="tambo-ai-landing-page"
ENV NODE_OPTIONS="--max-old-space-size=4096"
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
COPY --from=builder /app/node_modules ./node_modules
# Copy only the built Next.js output and the minimal app folder needed to run `next start`
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.* ./apps/web/
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages ./packages
# Remove dev-only sources to slim image
RUN find packages -type d -name 'src' -prune -exec rm -rf {} + || true \
  && find packages -type d -name 'test' -prune -exec rm -rf {} + || true \
  && find packages -type d -name '__tests__' -prune -exec rm -rf {} + || true \
  && find packages -type f -name '*.ts' -exec rm -f {} + || true
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodejs \
  && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/apps/web
CMD ["npx", "next", "start"]