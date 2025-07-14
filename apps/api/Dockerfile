# Base image with Node.js
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/*/

# Install dependencies
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app

# Copy all source files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Node.js options for build
ENV NODE_OPTIONS="--experimental-require-module"

# Build the application
RUN npm run build --filter=api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NODE_OPTIONS="--experimental-require-module"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Set permissions
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "apps/api/dist/main.js"] 