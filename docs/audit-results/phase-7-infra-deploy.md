# Phase 7 Infrastructure and Deployment Audit Results

## Checks Run
- `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.nginx.yml config`: pass; rendered the shared-VPS/Nginx stack with localhost-only service ports `3100`, `3101`, `8100`, `8101`, `8103`, and `8104`, required env placeholders from `.env.example`, and no Compose syntax errors.
- `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.caddy.yml config`: pass; rendered the Caddy ingress stack with Caddy on ports `80`/`443`, app services exposed only on the Compose network, and no Compose syntax errors.
- `pnpm --filter space-service check-types`: fail before typechecking; `tsc: command not found` and pnpm reported `node_modules` missing in this worktree.
- `pnpm --filter auth-service check-types`: fail before typechecking; `tsc: command not found` and pnpm reported `node_modules` missing in this worktree.
- `pnpm --filter email-service check-types`: fail before typechecking; `tsc: command not found` and pnpm reported `node_modules` missing in this worktree.
- `docker run --rm -v .../Caddyfile:/etc/caddy/Caddyfile:ro caddy:2.8-alpine caddy validate --config /etc/caddy/Caddyfile`: fail; standalone validation did not provide `CADDY_EMAIL`, so `email {$CADDY_EMAIL}` expanded empty.
- `docker run --rm -e CADDY_EMAIL=admin@spacefly.ai -v .../Caddyfile:/etc/caddy/Caddyfile:ro caddy:2.8-alpine caddy validate --config /etc/caddy/Caddyfile`: pass; Caddy reported `Valid configuration`.

## Fixes Applied
- `Caddyfile`: added `/venues` and `/currencies` matchers that reverse proxy to `product-service:8000`. This aligns Caddy ingress with `apps/product-service/src/index.ts` and with `deploy/nginx/spacefly.conf`.

## Findings
- `P1` Caddy ingress did not route venue or currency API paths
  - Area: Caddy reverse-proxy config for `api.spacefly.ai`.
  - Evidence: `apps/product-service/src/index.ts` mounts `/venues` and `/currencies`; `deploy/nginx/spacefly.conf` routed both to product-service; pre-fix `Caddyfile` routed `/spaces`, `/categories`, `/amenities`, and `/uploads` but not `/venues` or `/currencies`.
  - Reproduction: Before the fix, requests to `https://api.spacefly.ai/venues/...` or `https://api.spacefly.ai/currencies/rates` in Caddy mode would fall through to `respond 404`.
  - Recommendation: Fixed in this branch. Keep Caddy and Nginx product-service route lists synchronized when new product API roots are added.
- `P2` Type/build checks could not run in this worktree without dependencies
  - Area: Local verification environment.
  - Evidence: targeted `pnpm --filter ... check-types` commands failed with `tsc: command not found` and `Local package.json exists, but node_modules missing`.
  - Reproduction: Run any targeted TypeScript check in this worktree before installing workspace dependencies.
  - Recommendation: Re-run relevant `pnpm` checks after dependency installation or in a prepared CI/Orca environment. Do not interpret these failures as TypeScript diagnostics.
- `P3` Docker image/runtime checks were only partially exercised
  - Area: Docker build and runtime validation.
  - Evidence: Compose config rendered successfully and Caddy syntax validated, but full image builds and service health checks were not run to avoid expensive/destructive Docker activity in the audit worktree.
  - Reproduction: Not applicable; this is a coverage gap.
  - Recommendation: In a deployment rehearsal environment, run `./scripts/deploy.sh build`, `./scripts/deploy.sh up`, and `HEALTH_MODE=local LOCAL_HEALTH_SCHEME=http LOCAL_HEALTH_PORT=80 ./scripts/deploy.sh health`.

## Follow-Up Recommendations
- Re-run `pnpm check-types` after the Phase 4 booking-service type fix is integrated into this branch or after rebasing onto a branch that includes it.
- Run a full Docker build and local health gate in an isolated deploy rehearsal environment with production-like `.env` values.
- Add a small reverse-proxy route parity checklist or test for product API roots so Caddy and Nginx cannot drift again.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `docker-compose.yml`
- `docker-compose.caddy.yml`
- `docker-compose.nginx.yml`
- `Caddyfile`
- `docs/vps-nginx-deployment.md`
- `deploy/nginx/spacefly.conf`
- `scripts/deploy.sh`
- `apps/admin/Dockerfile`
- `apps/auth-service/Dockerfile`
- `apps/client/Dockerfile`
- `apps/email-service/Dockerfile`
- `apps/order-service/Dockerfile`
- `apps/product-service/Dockerfile`
- `apps/admin/next.config.ts`
- `apps/client/next.config.ts`
- `apps/auth-service/src/index.ts`
- `apps/product-service/src/index.ts`
- `apps/order-service/src/index.ts`
- `apps/email-service/src/index.ts`
- `apps/*/package.json`
- `packages/*/package.json`
- `package.json`
- `turbo.json`
- `.env.example`
