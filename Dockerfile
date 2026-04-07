# syntax=docker/dockerfile:1

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# ── Stage 2: build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL is needed at build time for Prisma generate; value doesn't matter
ENV DATABASE_URL="file:/tmp/build.db"

RUN npx prisma generate && npm run build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Override at runtime or via docker-compose; default persists in /app/data
ENV DATABASE_URL="file:/app/data/holidays.db"

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static

# Prisma: schema (for db push) + generated client + CLI
COPY --from=builder --chown=nextjs:nodejs /app/prisma                    ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma      ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma       ./node_modules/prisma

# Persistent SQLite data directory
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
