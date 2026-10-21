#!/usr/bin/env bash
# Déploiement SONAH sur le VPS — exécuté par la CI (ou à la main) depuis /home/deploy/sonah.
#
# Usage : ./scripts/deploy.sh <image-tag>
#
# 1. Installe la route Traefik si elle a changé (avec sauvegarde horodatée)
# 2. Récupère les images GHCR du tag demandé et redémarre web + api
# 3. Attend que les conteneurs soient « healthy », sinon revient au tag précédent
set -euo pipefail

IMAGE_TAG="${1:?Usage: deploy.sh <image-tag>}"
APP_DIR="${APP_DIR:-/home/deploy/sonah}"
TRAEFIK_DYNAMIC_DIR="${TRAEFIK_DYNAMIC_DIR:-/home/deploy/portfolio/traefik/dynamic}"
COMPOSE_FILE="docker-compose.prod.yml"
STATE_FILE=".deployed-tag"
HEALTH_TIMEOUT_SECONDS=120
SERVICES=(web api)

cd "$APP_DIR"

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

compose() { IMAGE_TAG="$1" docker compose -f "$COMPOSE_FILE" --env-file .env.production "${@:2}"; }

wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  for service in "${SERVICES[@]}"; do
    local container="sonah-${service}"
    while true; do
      local status
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo missing)"
      if [[ "$status" == "healthy" ]]; then
        log "✓ $container healthy"
        break
      fi
      if (( SECONDS > deadline )); then
        log "✗ $container: état '$status' après ${HEALTH_TIMEOUT_SECONDS}s"
        docker logs --tail 50 "$container" || true
        return 1
      fi
      sleep 3
    done
  done
}

# Fichier d'environnement requis par le service api (secrets renseignés à la main sur le VPS)
if [[ ! -f .env.production ]]; then
  log "Création d'un .env.production vide (à compléter avec les secrets)"
  install -m 600 /dev/null .env.production
fi

# Route Traefik : copie uniquement si elle a changé, avec sauvegarde de l'ancienne version
if [[ -d "$TRAEFIK_DYNAMIC_DIR" ]]; then
  target="$TRAEFIK_DYNAMIC_DIR/sonah.yml"
  if ! cmp -s traefik/dynamic/sonah.yml "$target"; then
    [[ -f "$target" ]] && cp "$target" "$target.bak-$(date +%Y%m%d-%H%M%S)"
    cp traefik/dynamic/sonah.yml "$target"
    log "Route Traefik mise à jour"
  fi
fi

previous_tag="$(cat "$STATE_FILE" 2>/dev/null || true)"

log "Déploiement du tag $IMAGE_TAG (précédent : ${previous_tag:-aucun})"
compose "$IMAGE_TAG" pull "${SERVICES[@]}"
compose "$IMAGE_TAG" up -d --remove-orphans "${SERVICES[@]}"

if wait_healthy; then
  echo "$IMAGE_TAG" > "$STATE_FILE"
  docker image prune -f --filter "label=org.opencontainers.image.source=https://github.com/emeric-cyrille/sonah" > /dev/null
  log "✅ Déploiement $IMAGE_TAG terminé"
  exit 0
fi

if [[ -n "$previous_tag" && "$previous_tag" != "$IMAGE_TAG" ]]; then
  log "↩️  Rollback vers $previous_tag"
  compose "$previous_tag" up -d "${SERVICES[@]}"
  wait_healthy || log "⚠️  Le rollback n'est pas healthy non plus"
fi
exit 1
