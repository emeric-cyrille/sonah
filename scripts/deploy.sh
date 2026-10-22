#!/usr/bin/env bash
# Déploiement SONAH sur le VPS — exécuté par la CI (ou à la main) depuis /home/deploy/sonah.
#
# Usage : ./scripts/deploy.sh <image-tag>
#
# 1. Génère les secrets manquants (mot de passe PostgreSQL) et installe la route Traefik
# 2. Démarre PostgreSQL, applique les migrations Prisma
# 3. Récupère les images GHCR du tag demandé et redémarre web + api
# 4. Attend que les conteneurs soient « healthy », sinon revient au tag précédent
# 5. Indexe les textes officiels s'ils ne le sont pas encore pour le modèle d'embedding courant
set -euo pipefail

IMAGE_TAG="${1:?Usage: deploy.sh <image-tag>}"
APP_DIR="${APP_DIR:-/home/deploy/sonah}"
TRAEFIK_DYNAMIC_DIR="${TRAEFIK_DYNAMIC_DIR:-/home/deploy/portfolio/traefik/dynamic}"
COMPOSE_FILE="docker-compose.prod.yml"
STATE_FILE=".deployed-tag"
HEALTH_TIMEOUT_SECONDS=120
SERVICES=(web api)
PROFILES=()

cd "$APP_DIR"

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

compose() { IMAGE_TAG="$1" docker compose -f "$COMPOSE_FILE" --env-file .env.production "${PROFILES[@]}" "${@:2}"; }

# Ajoute un secret aléatoire à .env.production s'il n'y est pas encore
ensure_secret() {
  if ! grep -q "^$1=" .env.production; then
    printf '%s=%s\n' "$1" "$(openssl rand -hex 24)" >> .env.production
    log "Secret $1 généré"
  fi
}

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
ensure_secret POSTGRES_PASSWORD
# Graphe Neo4j : activé seulement si NEO4J_URI est renseignée
if grep -q '^NEO4J_URI=.' .env.production; then
  ensure_secret NEO4J_PASSWORD
  PROFILES=(--profile graph)
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

log "Bases de données et migrations"
compose "$IMAGE_TAG" up -d --wait postgres $([[ ${#PROFILES[@]} -gt 0 ]] && echo neo4j)
compose "$IMAGE_TAG" run --rm --no-deps api node_modules/.bin/prisma migrate deploy \
  --schema node_modules/@sonah/database/prisma/schema.prisma

compose "$IMAGE_TAG" up -d --remove-orphans "${SERVICES[@]}"

if wait_healthy; then
  echo "$IMAGE_TAG" > "$STATE_FILE"
  log "Indexation des textes officiels (si nécessaire)"
  compose "$IMAGE_TAG" exec -T api node dist/scripts/seed.js --if-empty || log "⚠️  Indexation échouée (Sonah reste en ligne)"
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
