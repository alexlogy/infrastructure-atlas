# syntax=docker/dockerfile:1
# Production image for Infrastructure Atlas. Build from the repository root:
#   docker build -f docker/Dockerfile --build-arg NEXT_PUBLIC_SITE_URL=https://example.com .
# Targets: `runner` (default, the web server) and `migrate` (one-shot: applies committed migrations).
# docker/compose.yml wires both together with PostgreSQL.

ARG NODE_VERSION=24.22.3

FROM node:${NODE_VERSION}-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# pnpm (pinned by packageManager in package.json) for installing, building and migrating.
FROM base AS deps
ENV PNPM_HOME=/pnpm \
    COREPACK_HOME=/corepack
RUN corepack enable && mkdir -p /corepack && chmod 777 /corepack
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install && chmod -R a+rX /corepack
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# Baked into the browser bundle, canonical URLs and the sitemap: rebuild when it changes.
ARG NEXT_PUBLIC_SITE_URL
RUN test -n "$NEXT_PUBLIC_SITE_URL" || (echo "Set --build-arg NEXT_PUBLIC_SITE_URL" >&2 && exit 1)
# The build never connects to the database (public routes are dynamic), but the config validates
# these. Build-stage placeholders only: they are not part of the runtime image.
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    DATABASE_URI=postgresql://build:unused@localhost:5432/unused \
    PAYLOAD_SECRET=build-stage-placeholder-not-used-at-runtime \
    NEXT_OUTPUT=standalone
RUN pnpm build

# One-shot migration job: run before the app takes traffic (compose does this automatically).
FROM deps AS migrate
COPY . .
ENV NODE_ENV=production
USER node
CMD ["pnpm", "migrate"]

FROM base AS runner
# The server needs only node: drop the bundled npm and corepack, which it never uses.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# Uploads (mount a volume here) and the data cache the server empties on start.
RUN mkdir -p media .next/cache && chown node:node media .next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "server.js"]
