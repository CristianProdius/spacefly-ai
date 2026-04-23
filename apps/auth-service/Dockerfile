FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.0.0 --activate

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.5.6 prune auth-service @repo/db --docker

FROM base AS builder
ARG DATABASE_URL=postgresql://spacefly:spacefly@localhost:5432/spacefly_build
ENV DATABASE_URL=$DATABASE_URL
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @repo/db db:generate
RUN pnpm --filter @repo/db build
RUN pnpm --filter auth-service build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8003

COPY --from=builder --chown=node:node /app /app
USER node
CMD ["node", "apps/auth-service/dist/index.js"]
