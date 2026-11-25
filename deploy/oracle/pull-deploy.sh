#!/usr/bin/env bash
# Pull-based continuous deployment for the API container on the Oracle VM.
# Runs from a systemd timer (listayours-deploy.timer, every 5 minutes): pulls the configured
# image tag and recreates the container only when the image changed. Nothing connects to the VM
# from outside; the VM only talks to ghcr.io.
#
# Tunables (environment or /etc/default/listayours-deploy):
#   DEPLOY_DIR      default /home/ubuntu/listayours/deploy/oracle
#   COMPOSE_FILE    default docker-compose.prod.yml
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu/listayours/deploy/oracle}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

log() { printf '%s deploy: %s\n' "$(date -Is)" "$*"; }

cd "$DEPLOY_DIR"
compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

image="$(compose config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["services"]["api"]["image"])')"
before="$(docker image inspect --format '{{.Id}}' "$image" 2>/dev/null || echo none)"

if ! compose pull --quiet api; then
  log "pull FAILED for $image (registry unreachable or package private?) - keeping the running container"
  exit 1
fi
after="$(docker image inspect --format '{{.Id}}' "$image")"

if [ "$before" = "$after" ] && compose ps --status running --services | grep -qx api; then
  log "up to date ($image)"
  exit 0
fi

log "new image for $image, recreating the api container"
compose up -d --no-build api
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 http://127.0.0.1:8000/health >/dev/null; then
    log "healthy after update"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done
log "health check FAILED after update; previous image id was $before (roll back: set API_IMAGE to a sha- tag in .env and rerun)"
exit 1
