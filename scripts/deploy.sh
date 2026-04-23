#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log() {
  printf '[deploy] %s\n' "$*"
}

die() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: scripts/deploy.sh <command>

Commands:
  build    Build Docker Compose images
  config   Render Docker Compose config
  up       Start the Docker Compose stack in the background
  migrate  Run Prisma migrations with pnpm --filter @repo/db db:deploy
  health   Check Docker health status and Spacefly health endpoints
  logs     Follow Docker Compose logs
  full     Run build, infra-only up, migrate, full up, and health

Environment:
  If .env exists in the repository root, Docker Compose commands use --env-file .env.
  INGRESS_MODE=nginx uses docker-compose.nginx.yml and publishes only localhost ports for an existing Nginx proxy.
  INGRESS_MODE=caddy uses docker-compose.caddy.yml and lets this stack bind ports 80/443.
  migrate runs locally with pnpm and loads .env if present.
  Fresh databases use normal Prisma deploy behavior by default.
  Existing databases that already match the init migration can be baselined with:
    BASELINE_EXISTING_DB=true BASELINE_CONFIRM=baseline-existing-db scripts/deploy.sh migrate
  Baseline mode only records 20260423150000_init as applied; use it only when the schema already exists and matches that migration.
  health checks production URLs by default. Set HEALTH_MODE=local to check Caddy on localhost.
  For shared VPS Nginx mode, use HEALTH_MODE=local LOCAL_HEALTH_SCHEME=http LOCAL_HEALTH_PORT=80.
USAGE
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

compose_cmd() {
  require_cmd docker
  load_env

  local args=(docker compose)
  case "${INGRESS_MODE:-nginx}" in
    nginx)
      args+=(-f "$REPO_ROOT/docker-compose.yml" -f "$REPO_ROOT/docker-compose.nginx.yml")
      ;;
    caddy)
      args+=(-f "$REPO_ROOT/docker-compose.yml" -f "$REPO_ROOT/docker-compose.caddy.yml")
      ;;
    *)
      die "Unsupported INGRESS_MODE: ${INGRESS_MODE:-}. Use nginx or caddy."
      ;;
  esac

  if [[ -f "$REPO_ROOT/.env" ]]; then
    args+=(--env-file "$REPO_ROOT/.env")
  fi

  if [[ "${INGRESS_MODE:-nginx}" == "nginx" ]]; then
    COMPOSE_PROFILES= "${args[@]}" "$@"
  else
    "${args[@]}" "$@"
  fi
}

load_env() {
  if [[ -f "$REPO_ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$REPO_ROOT/.env"
    set +a
  fi
}

cmd_build() {
  log "Building Docker Compose images"
  compose_cmd build
}

cmd_config() {
  compose_cmd config "$@"
}

cmd_up() {
  log "Starting Docker Compose stack"
  compose_cmd up -d
}

cmd_up_infra() {
  log "Starting migration prerequisites only: kafka"
  compose_cmd up -d --no-deps kafka
}

cmd_migrate() {
  require_cmd pnpm

  log "Running Prisma migrations with local pnpm"
  load_env
  [[ -n "${DATABASE_URL:-}" ]] || die "DATABASE_URL is required for migrate. Set it in .env or the environment."

  if [[ "${BASELINE_EXISTING_DB:-false}" == "true" ]]; then
    [[ "${BASELINE_CONFIRM:-}" == "baseline-existing-db" ]] || die "BASELINE_CONFIRM=baseline-existing-db is required when BASELINE_EXISTING_DB=true"
    log "Baselining existing database by marking 20260423150000_init as applied"
    log "Only use this when the existing schema already matches the init migration"
    (cd "$REPO_ROOT" && pnpm --filter @repo/db exec prisma migrate resolve --applied 20260423150000_init)
  fi

  (cd "$REPO_ROOT" && pnpm --filter @repo/db db:deploy)
}

service_health_state() {
  local service="$1"
  local container_id
  local state

  container_id="$(compose_cmd ps -q "$service")"
  [[ -n "$container_id" ]] || {
    printf 'missing'
    return 0
  }

  state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
  printf '%s' "$state"
}

wait_compose_health() {
  local timeout="${COMPOSE_HEALTH_TIMEOUT:-180}"
  local interval="${COMPOSE_HEALTH_INTERVAL:-5}"
  shift 0
  local services=("$@")
  local deadline=$((SECONDS + timeout))
  local pending
  local service
  local state

  require_cmd docker
  [[ "${#services[@]}" -gt 0 ]] || die "No services provided for compose health check"

  log "Waiting up to ${timeout}s for Docker health: ${services[*]}"
  while (( SECONDS < deadline )); do
    pending=0

    for service in "${services[@]}"; do
      state="$(service_health_state "$service")"
      case "$state" in
        healthy|running)
          ;;
        unhealthy|exited|dead|missing)
          log "$service is $state"
          pending=1
          ;;
        *)
          log "$service is $state"
          pending=1
          ;;
      esac
    done

    if [[ "$pending" -eq 0 ]]; then
      log "Docker health gate passed"
      return 0
    fi

    sleep "$interval"
  done

  log "Docker health gate timed out; final service states:"
  for service in "${services[@]}"; do
    log "$service: $(service_health_state "$service")"
  done
  return 1
}

cmd_compose_health() {
  local services=(kafka auth-service product-service order-service email-service client admin)
  if [[ "${INGRESS_MODE:-nginx}" == "caddy" ]]; then
    services+=(caddy)
  fi

  wait_compose_health "${services[@]}"
}

check_url() {
  local name="$1"
  local url="$2"
  shift 2
  local status

  log "Checking $name: $url"
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 15 "$@" "$url")"
  if [[ ! "$status" =~ ^2[0-9][0-9]$ ]]; then
    log "$name returned HTTP $status"
    return 1
  fi
}

cmd_health() {
  require_cmd curl

  cmd_compose_health

  local failed=0
  if [[ "${HEALTH_MODE:-public}" == "local" ]]; then
    local local_host="${LOCAL_HEALTH_HOST:-127.0.0.1}"
    local local_scheme="${LOCAL_HEALTH_SCHEME:-https}"
    local local_port="${LOCAL_HEALTH_PORT:-443}"
    local tls_args=()
    if [[ "$local_scheme" == "http" ]]; then
      local_port="${LOCAL_HEALTH_PORT:-80}"
    else
      tls_args+=(--insecure)
    fi

    if [[ "${INGRESS_MODE:-nginx}" == "caddy" ]]; then
      check_url "caddy" "$local_scheme://api.spacefly.ai/health/caddy" --resolve "api.spacefly.ai:$local_port:$local_host" "${tls_args[@]}" || failed=1
    fi
    check_url "auth-service" "$local_scheme://api.spacefly.ai/health/auth" --resolve "api.spacefly.ai:$local_port:$local_host" "${tls_args[@]}" || failed=1
    check_url "product-service" "$local_scheme://api.spacefly.ai/health/product" --resolve "api.spacefly.ai:$local_port:$local_host" "${tls_args[@]}" || failed=1
    check_url "order-service" "$local_scheme://api.spacefly.ai/health/order" --resolve "api.spacefly.ai:$local_port:$local_host" "${tls_args[@]}" || failed=1

    if [[ "${CHECK_FRONTEND_HEALTH:-false}" == "true" ]]; then
      check_url "client" "$local_scheme://spacefly.ai/" --resolve "spacefly.ai:$local_port:$local_host" "${tls_args[@]}" || failed=1
      check_url "admin" "$local_scheme://admin.spacefly.ai/" --resolve "admin.spacefly.ai:$local_port:$local_host" "${tls_args[@]}" || failed=1
    fi
  else
    local api_base="${API_HEALTH_BASE_URL:-https://api.spacefly.ai}"
    check_url "auth-service" "$api_base/health/auth" || failed=1
    check_url "product-service" "$api_base/health/product" || failed=1
    check_url "order-service" "$api_base/health/order" || failed=1

    if [[ -n "${CLIENT_HEALTH_URL:-}" ]]; then
      check_url "client" "$CLIENT_HEALTH_URL" || failed=1
    fi
    if [[ -n "${ADMIN_HEALTH_URL:-}" ]]; then
      check_url "admin" "$ADMIN_HEALTH_URL" || failed=1
    fi
  fi

  [[ "$failed" -eq 0 ]] || die "One or more health checks failed"
  log "Health checks passed"
}

cmd_logs() {
  log "Following Docker Compose logs"
  compose_cmd logs -f --tail=100
}

cmd_full() {
  cmd_build
  cmd_up_infra
  log "Checking migration prerequisites before applying database migrations"
  wait_compose_health kafka
  cmd_migrate
  log "Starting full stack after migrations succeeded"
  cmd_up
  cmd_health
}

main() {
  cd "$REPO_ROOT"

  local command="${1:-}"
  if [[ $# -gt 0 ]]; then
    shift
  fi

  case "$command" in
    build)
      cmd_build
      ;;
    config)
      cmd_config "$@"
      ;;
    up)
      cmd_up
      ;;
    migrate)
      cmd_migrate
      ;;
    health)
      cmd_health
      ;;
    logs)
      cmd_logs
      ;;
    full)
      cmd_full
      ;;
    -h|--help|help)
      usage
      ;;
    *)
      usage
      die "Unknown or missing command: ${command:-<none>}"
      ;;
  esac
}

main "$@"
