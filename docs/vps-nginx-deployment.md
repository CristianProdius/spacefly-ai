# Spacefly Shared VPS Deployment

This deployment mode is for a server where Nginx already owns ports 80 and 443.
It does not start the Compose Caddy service and does not publish Docker images to
any registry.

## Server Layout

- Recommended VPS: `138.197.178.212`
- Repository path: `/root/spacefly-ai`
- Compose mode: `INGRESS_MODE=nginx`
- Public proxy: existing host Nginx
- Database: dedicated internal `postgres` container and `postgres_data` volume
- Upload storage: dedicated internal `minio` container and `minio_data` volume
- Spacefly container ports: localhost only
  - client: `127.0.0.1:3100`
  - admin: `127.0.0.1:3101`
  - auth-service: `127.0.0.1:8103`
  - product-service: `127.0.0.1:8100`
  - order-service: `127.0.0.1:8101`
  - email-service health: `127.0.0.1:8104`

Do not reuse Postgres, Redis, or MinIO containers owned by other projects on the
same VPS.

## Move From The Temporary VPS

If Spacefly was prepared on `174.138.6.248`, remove only the Spacefly files from
that host:

```bash
rm -f /etc/nginx/sites-enabled/spacefly
rm -f /etc/nginx/sites-available/spacefly
nginx -t
systemctl reload nginx
rm -rf /root/spacefly-ai
```

No Spacefly containers were started on that temporary host during preparation.

## First Deploy

1. Point DNS A records to the target VPS IP:
   - `spacefly.ai`
   - `admin.spacefly.ai`
   - `api.spacefly.ai`

2. Clone or pull the repository:

   ```bash
   cd /root
   git clone <repo-url> spacefly-ai
   cd /root/spacefly-ai
   git checkout deploy-infrastructure-subagents
   cp .env.example .env
   ```

3. Fill `.env` with production secrets and keep:

   ```bash
   INGRESS_MODE=nginx
   CORS_ORIGINS=https://spacefly.ai,https://admin.spacefly.ai
   NEXT_PUBLIC_AUTH_SERVICE_URL=https://api.spacefly.ai
   NEXT_PUBLIC_PRODUCT_SERVICE_URL=https://api.spacefly.ai
   NEXT_PUBLIC_ORDER_SERVICE_URL=https://api.spacefly.ai
   NEXT_PUBLIC_ADMIN_URL=https://admin.spacefly.ai
   ```

4. Build and start migration prerequisites:

   ```bash
   ./scripts/deploy.sh build
   COMPOSE_PROFILES= docker compose --env-file .env -f docker-compose.yml -f docker-compose.nginx.yml up -d kafka
   ```

5. Run migrations against the fresh internal Spacefly Postgres database:

   ```bash
   ./scripts/deploy.sh migrate
   ```

6. Start the stack:

   ```bash
   ./scripts/deploy.sh up
   ```

7. Install the Nginx site without editing existing sites:

   ```bash
   cp deploy/nginx/spacefly.conf /etc/nginx/sites-available/spacefly
   ln -s /etc/nginx/sites-available/spacefly /etc/nginx/sites-enabled/spacefly
   nginx -t
   systemctl reload nginx
   ```

8. Issue certificates after DNS resolves to the VPS:

   ```bash
   certbot --nginx -d spacefly.ai -d admin.spacefly.ai -d api.spacefly.ai
   nginx -t
   systemctl reload nginx
   ```

9. Verify:

   ```bash
   HEALTH_MODE=local LOCAL_HEALTH_SCHEME=http LOCAL_HEALTH_PORT=80 ./scripts/deploy.sh health
   curl -I https://spacefly.ai
   curl -I https://admin.spacefly.ai
   curl -I https://api.spacefly.ai/health/auth
   curl -I https://api.spacefly.ai/health/product
   curl -I https://api.spacefly.ai/health/order
   ```

## Routine Deploy

```bash
cd /root/spacefly-ai
git pull
./scripts/deploy.sh build
./scripts/deploy.sh migrate
./scripts/deploy.sh up
HEALTH_MODE=local LOCAL_HEALTH_SCHEME=http LOCAL_HEALTH_PORT=80 ./scripts/deploy.sh health
```

## Backups

Create backups before treating this deployment as production. At minimum:

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.nginx.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "backups/spacefly-$(date +%F).sql"
docker run --rm --volumes-from spacefly-minio-1 -v "$PWD/backups:/backups" alpine \
  tar czf "/backups/spacefly-minio-$(date +%F).tgz" /data
```

Store backup artifacts off the VPS.
