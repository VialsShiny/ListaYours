#!/usr/bin/env bash
# Light workload to keep the Oracle Always Free VM out of the idle-reclamation rule
# (see docs/DEPLOY.md, section "Rester hors de la regle de recuperation"). Runs from a
# systemd timer every 5 minutes: checks the API, then burns one core at low priority.
#
# Tunables (environment or /etc/default/listayours-keepalive):
#   KEEPALIVE_URL            default http://127.0.0.1:8000/health (through Docker: see README.md)
#   KEEPALIVE_PUBLIC_URL     default empty; e.g. https://api.example.com/api/public/wishlists
#   KEEPALIVE_BURST_SECONDS  default 60
set -euo pipefail

KEEPALIVE_URL="${KEEPALIVE_URL:-http://127.0.0.1:8000/health}"
KEEPALIVE_PUBLIC_URL="${KEEPALIVE_PUBLIC_URL:-}"
KEEPALIVE_BURST_SECONDS="${KEEPALIVE_BURST_SECONDS:-60}"

log() { printf '%s keepalive: %s\n' "$(date -Is)" "$*"; }

if curl -fsS --max-time 10 "$KEEPALIVE_URL" >/dev/null; then
  log "health ok ($KEEPALIVE_URL)"
else
  log "health FAILED ($KEEPALIVE_URL)"
fi

if [ -n "$KEEPALIVE_PUBLIC_URL" ]; then
  if curl -fsS --max-time 20 "$KEEPALIVE_PUBLIC_URL" >/dev/null; then
    log "public endpoint ok"
  else
    log "public endpoint FAILED ($KEEPALIVE_PUBLIC_URL)"
  fi
fi

# One core at 100 % for KEEPALIVE_BURST_SECONDS, lowest scheduling priority so real
# requests always win. On a 2-OCPU A1 this reads as roughly 50 % instance CPU for the burst.
log "cpu burst ${KEEPALIVE_BURST_SECONDS}s"
nice -n 19 timeout "$KEEPALIVE_BURST_SECONDS" sh -c 'while :; do :; done' || true
log "done"
