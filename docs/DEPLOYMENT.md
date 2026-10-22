# Déploiement SONAH

Production : **https://sonah.fokamemeric.com** — VPS partagé seazone (`51.254.137.22`, SSH port `2222`, utilisateur `deploy`).

## Architecture

```
Internet ──443──▶ portfolio-traefik (Let's Encrypt)
                     │  réseau Docker portfolio-net
                     ├─ Host(sonah.fokamemeric.com) && PathPrefix(/api/v1) ─▶ sonah-api:4000  (NestJS)
                     └─ Host(sonah.fokamemeric.com)                         ─▶ sonah-web:3000  (Next.js)
```

- Un seul domaine : le frontend appelle l'API en relatif (`/api/v1/...`), donc **pas de CORS** et pas de sous-domaine `api.` à gérer.
- Aucun port SONAH n'est publié sur l'hôte : Traefik joint les conteneurs par leur nom sur `portfolio-net`
  (même modèle que `omega.yml` et `ghomala.yml`).
- La route Traefik est un fichier séparé, `traefik/dynamic/sonah.yml`, copié dans
  `/home/deploy/portfolio/traefik/dynamic/` et rechargé à chaud. `routes.yml` n'est jamais modifié.
- **PostgreSQL + pgvector** tourne en permanence (conversations, base vectorielle). Le mot de passe est généré
  automatiquement par `scripts/deploy.sh` dans `.env.production` au premier déploiement.
- **Neo4j** est dans le profil `graph` : il démarre si `NEO4J_URI=bolt://neo4j:7687` est présent dans `.env.production`.
- **Redis / RabbitMQ** sont dans le profil `queue` (orchestration multi-agents, à venir).

## Pipeline CI/CD

| Workflow | Déclencheur | Étapes |
|----------|-------------|--------|
| `ci.yml` | Pull request | install → format → lint → typecheck → test → build, puis build Docker des images web et api |
| `deploy.yml` | Push sur `main`, ou manuel | CI complète → build et push des images sur GHCR (`:<sha>` et `:latest`) → déploiement SSH → smoke test HTTPS |

Le déploiement exécute `scripts/deploy.sh <sha>` sur le VPS :

1. génère les secrets manquants et installe la route Traefik si elle a changé (sauvegarde horodatée) ;
2. démarre PostgreSQL (et Neo4j si activé), applique les migrations Prisma (`prisma migrate deploy`) ;
3. `docker compose pull` puis `up -d` pour `web` et `api` ;
4. attend que les deux conteneurs soient `healthy` (2 min max), sinon **rollback automatique** vers le tag précédent ;
5. indexe la Constitution et le Code du travail si aucun article n'est indexé pour le modèle d'embedding courant
   (premier déploiement, ou ajout d'une clé Gemini ou OpenAI).

### Secrets GitHub (environnement `production`)

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | `51.254.137.22` |
| `VPS_PORT` | `2222` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Clé privée ed25519 dédiée à la CI |
| `VPS_KNOWN_HOSTS` | Sortie de `ssh-keyscan -p 2222 51.254.137.22` |

Le token GHCR est le `GITHUB_TOKEN` éphémère du workflow : aucun secret registre à gérer.

## Mise en place initiale (une seule fois)

```bash
# 1. Clé SSH dédiée à la CI
ssh-keygen -t ed25519 -N "" -C "github-actions@sonah-deploy" -f ./sonah_deploy
ssh seazone 'cat >> ~/.ssh/authorized_keys' < sonah_deploy.pub

# 2. Secrets GitHub
gh secret set VPS_HOST --env production --body 51.254.137.22
gh secret set VPS_PORT --env production --body 2222
gh secret set VPS_USER --env production --body deploy
gh secret set VPS_SSH_KEY --env production < sonah_deploy
ssh-keyscan -p 2222 51.254.137.22 | gh secret set VPS_KNOWN_HOSTS --env production
rm sonah_deploy sonah_deploy.pub

# 3. Secrets applicatifs sur le VPS (le script crée un fichier vide s'il manque)
ssh seazone 'mkdir -p ~/sonah && cd ~/sonah && touch .env.production && chmod 600 .env.production'
# puis éditer ~/sonah/.env.production à partir de .env.production.example
```

Le DNS `sonah.fokamemeric.com → 51.254.137.22` est déjà configuré. Le certificat Let's Encrypt est émis
automatiquement par Traefik à la première requête.

## Opérations courantes

```bash
ssh seazone && cd ~/sonah

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail 100 api

# Redéployer un tag précis (ex. rollback manuel)
bash scripts/deploy.sh <sha>

# Activer Gemini : ajouter la clé, redémarrer l'API, réindexer avec les embeddings Gemini
echo 'GEMINI_API_KEY=AIza...' >> .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d api
docker compose -f docker-compose.prod.yml --env-file .env.production exec api node dist/scripts/seed.js --if-empty

# Réindexer les textes officiels (idempotent)
docker compose -f docker-compose.prod.yml --env-file .env.production exec api node dist/scripts/seed.js

# État des dépendances (base, graphe, modèle, nombre d'articles indexés)
curl -s https://sonah.fokamemeric.com/api/v1/health/ready
```

Déploiement manuel depuis GitHub : *Actions → Deploy → Run workflow*.

## Vérifications

```bash
curl -fsS https://sonah.fokamemeric.com/healthz          # frontend
curl -fsS https://sonah.fokamemeric.com/api/v1/health    # API
ssh seazone 'docker logs --tail 50 portfolio-traefik 2>&1 | grep -i sonah'
```
