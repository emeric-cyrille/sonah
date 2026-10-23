#!/usr/bin/env bash
# Retélécharge les documents d'origine de data/sources/manifest.json et vérifie leur SHA-256.
#   scripts/fetch-sources.sh            # vérification
#   scripts/fetch-sources.sh --cache    # met aussi en cache les textes non redistribuables (seed hors ligne)
#   scripts/fetch-sources.sh --strict   # échoue si une source est injoignable
set -euo pipefail
cd "$(dirname "$0")/.."
exec pnpm --filter @sonah/rag kb:fetch -- "$@"
