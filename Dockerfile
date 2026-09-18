# syntax=docker/dockerfile:1
# Use Node for deps (handles native modules like tree-sitter)
# Use Bun for building and running
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
COPY apps/be/package.json ./apps/be/package.json
COPY apps/ws/package.json ./apps/ws/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/db/schema.prisma ./packages/db/schema.prisma
COPY packages/config ./packages/config
COPY packages/redis/package.json ./packages/redis/package.json
RUN npm install --frozen-lockfile --ignore-scripts=false 2>&1 | tail -20

FROM oven/bun:1.3.11 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate --schema packages/db/schema.prisma
RUN bunx turbo run build --filter=web...

FROM oven/bun:1.3.11 AS runner-base
ENV NODE_ENV=production
RUN groupadd --system app && useradd --system --gid app app
COPY --from=deps /app/package.json /app/bun.lock ./
COPY --from=deps /app/apps/be/package.json ./apps/be/package.json
COPY --from=deps /app/apps/ws/package.json ./apps/ws/package.json
COPY --from=deps /app/apps/web/package.json ./apps/web/package.json
COPY --from=deps /app/packages/ui/package.json ./packages/ui/package.json
COPY --from=deps /app/packages/utils/package.json ./packages/utils/package.json
COPY --from=deps /app/packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY --from=deps /app/packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY --from=deps /app/packages/db/package.json ./packages/db/package.json
COPY --from=deps /app/packages/db/schema.prisma ./packages/db/schema.prisma
COPY --from=deps /app/packages/config ./packages/config
COPY --from=deps /app/packages/redis/package.json ./packages/redis/package.json
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --production
COPY --from=builder --chown=app:app /app/packages ./packages

FROM runner-base AS runner-be
COPY --from=builder --chown=app:app /app/apps/be ./apps/be
USER app
EXPOSE 3001
CMD ["sh"]

FROM runner-base AS runner-web
COPY --from=builder --chown=app:app /app/apps/web ./apps/web
USER app
EXPOSE 3000
CMD ["sh"]

FROM runner-base AS runner-ws
COPY --from=builder --chown=app:app /app/apps/ws ./apps/ws
USER app
EXPOSE 3002
CMD ["sh"]