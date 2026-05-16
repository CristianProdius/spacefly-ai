# Spacefly

Spacefly is a pnpm/Turborepo monorepo for a workspace and venue booking product.
It contains public customer browsing and booking flows, an admin/host dashboard,
backend API services, shared packages, and Docker Compose deployment assets.

## Workspace Map

### Apps

- `apps/client` (`client`): Next.js public app on local port `3002`; localized routes live under `src/app/[locale]`.
- `apps/admin` (`admin`): Next.js admin and host dashboard on local port `3003`.
- `apps/product-service` (`space-service`): Express API for spaces, venues, categories, amenities, currencies, uploads, and reviews; default port `8000`.
- `apps/order-service` (`booking-service`): Fastify booking API; default port `8001`.
- `apps/auth-service` (`auth-service`): Express auth and user management API; default port `8003`.
- `apps/email-service` (`email-service`): Kafka/Resend email worker with health server; default port `8004`.

### Packages

- `packages/db` (`@repo/db`): Prisma schema, generated client, migrations, and shared Prisma export.
- `packages/types` (`@repo/types`): Shared domain types.
- `packages/auth-middleware` (`@repo/auth-middleware`): JWT/password helpers and Express/Fastify/Hono auth middleware.
- `packages/kafka` (`@repo/kafka`): Shared KafkaJS helpers.
- `packages/eslint-config` and `packages/typescript-config`: shared tooling config.

## Common Commands

Install dependencies:

```sh
pnpm install --frozen-lockfile
```

Run type checks across packages that define `check-types`:

```sh
pnpm check-types
```

Run targeted checks:

```sh
pnpm --filter client check-types
pnpm --filter admin check-types
pnpm --filter admin test
pnpm --filter space-service check-types
pnpm --filter space-service test
pnpm --filter booking-service check-types
pnpm --filter auth-service check-types
pnpm --filter email-service check-types
pnpm --filter @repo/auth-middleware typecheck
```

Note the package names are not always the same as their directory or Compose
service names: `apps/product-service` is package `space-service`, and
`apps/order-service` is package `booking-service`.

## Local Development

Run all dev tasks through Turbo:

```sh
pnpm dev
```

Or run a single app/service by package name:

```sh
pnpm --filter client dev
pnpm --filter admin dev
pnpm --filter space-service dev
pnpm --filter booking-service dev
pnpm --filter auth-service dev
pnpm --filter email-service dev
```

Backend services expect database, JWT, Kafka, and service-specific environment
variables. Use `.env.example` as the production/deployment reference and app
`.env.example` files where present for frontend public URLs.

## Database

The Prisma workspace package is `@repo/db`.

Safe generation command:

```sh
pnpm --filter @repo/db db:generate
```

Migration commands are intentionally separate from normal build/test commands:

```sh
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:deploy
```

Do not run migrations unless you are targeting the intended database.

## Deployment Assets

- `docker-compose.yml`: shared internal service stack.
- `docker-compose.nginx.yml`: localhost port bindings for a VPS where host Nginx owns ports `80` and `443`.
- `docker-compose.caddy.yml` and `Caddyfile`: Caddy ingress for a dedicated VPS.
- `deploy/nginx/spacefly.conf`: Nginx virtual host configuration.
- `scripts/deploy.sh`: build, config, up, migrate, health, logs, and full deploy helper.
- `docs/vps-nginx-deployment.md`: shared VPS deployment runbook.
