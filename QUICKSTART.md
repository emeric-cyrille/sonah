# Guide de Démarrage Rapide

## Prérequis

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker Desktop
- Clé API OpenAI

### Installation des prérequis

**Node.js et pnpm**
```bash
# Vérifier Node.js
node --version  # doit être >= 18.0.0

# Installer pnpm
npm install -g pnpm@8.15.0
```

**Docker Desktop**
- Télécharger depuis [docker.com](https://www.docker.com/products/docker-desktop/)
- Installer et démarrer Docker Desktop

**Clé API OpenAI**
- Créer un compte sur [platform.openai.com](https://platform.openai.com/)
- Générer une clé API dans Settings > API Keys

---

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/emeric-cyrille/sonah.git
cd sonah
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configuration de l'environnement

```bash
cp .env.example .env
```

Éditer `.env` et renseigner au minimum :

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sonah"
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password"
REDIS_URL="redis://localhost:6379"
RABBITMQ_URL="amqp://localhost:5672"
OPENAI_API_KEY="sk-proj-VOTRE_CLE_ICI"
JWT_SECRET="development-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:4000"
NODE_ENV="development"
```

### 4. Démarrer l'infrastructure

```bash
docker-compose up -d
```

Vérifier que tous les services sont actifs :

```bash
docker-compose ps
```

Services démarrés :
- sonah-postgres (port 5432)
- sonah-neo4j (ports 7474, 7687)
- sonah-redis (port 6379)
- sonah-rabbitmq (ports 5672, 15672)

### 5. Initialiser la base de données

```bash
# Générer le client Prisma
pnpm --filter @sonah/database prisma generate

# Créer les tables
pnpm --filter @sonah/database prisma db push
```

### 6. Lancer les applications

**Option A : Tout en un**
```bash
pnpm dev
```

**Option B : Séparément (2 terminaux)**
```bash
# Terminal 1 - Backend
pnpm --filter @sonah/api dev

# Terminal 2 - Frontend
pnpm --filter @sonah/web dev
```

---

## Vérification

### Frontend

Accéder à http://localhost:3000

La landing page SONAH doit s'afficher avec les statistiques du projet.

### Backend

```bash
curl http://localhost:4000/api/v1/health
```

Réponse attendue :
```json
{
  "status": "healthy",
  "timestamp": "2026-10-21T...",
  "uptime": 123.45,
  "environment": "development",
  "services": {
    "database": "connected",
    "redis": "connected",
    "neo4j": "connected",
    "rabbitmq": "connected"
  }
}
```

### Base de données

```bash
pnpm db:studio
```

Ouvre Prisma Studio sur http://localhost:5555

---

## Commandes Utiles

### Développement

```bash
pnpm dev                    # Lancer frontend + backend
pnpm build                  # Build production
pnpm lint                   # Linter
pnpm format                 # Formatter le code
```

### Base de données

```bash
pnpm db:generate            # Générer client Prisma
pnpm db:migrate             # Créer migration
pnpm db:push                # Push schema (dev)
pnpm db:studio              # Interface Prisma Studio
```

### Docker

```bash
docker-compose up -d        # Démarrer services
docker-compose down         # Arrêter services
docker-compose down -v      # Arrêter + supprimer volumes
docker-compose logs -f      # Voir logs
docker-compose restart      # Redémarrer services
```

### Services spécifiques

```bash
docker-compose logs -f postgres
docker-compose logs -f neo4j
docker-compose restart postgres
```

---

## Résolution de Problèmes

### Port déjà utilisé

**Erreur** : `Error: listen EADDRINUSE: address already in use :::3000`

**Solution** :
```bash
# Identifier le processus
lsof -ti:3000

# Terminer le processus
lsof -ti:3000 | xargs kill -9
```

### Services Docker ne démarrent pas

```bash
# Vérifier que Docker Desktop est lancé
docker ps

# Nettoyer et redémarrer
docker-compose down -v
docker-compose up -d

# Vérifier les logs
docker-compose logs
```

### Prisma ne trouve pas la base de données

```bash
# Vérifier PostgreSQL
docker-compose ps postgres

# Tester la connexion
docker exec -it sonah-postgres psql -U postgres -c "SELECT 1"

# Recréer le schema
pnpm --filter @sonah/database prisma db push --force-reset
```

### pgvector non installé

```bash
# Recréer le container PostgreSQL
docker-compose down -v postgres
docker-compose up -d postgres

# Vérifier l'extension
docker exec -it sonah-postgres psql -U postgres -d sonah -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Erreur de permissions Prisma

```bash
# Régénérer le client
pnpm --filter @sonah/database prisma generate

# Nettoyer le cache
rm -rf node_modules/.prisma
pnpm install
```

---

## Structure des Services

### Ports utilisés

| Service | Port(s) | Accès |
|---------|---------|-------|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (NestJS) | 4000 | http://localhost:4000 |
| PostgreSQL | 5432 | localhost:5432 |
| Neo4j Browser | 7474 | http://localhost:7474 |
| Neo4j Bolt | 7687 | bolt://localhost:7687 |
| Redis | 6379 | localhost:6379 |
| RabbitMQ AMQP | 5672 | localhost:5672 |
| RabbitMQ Management | 15672 | http://localhost:15672 |

### Identifiants par défaut

**Neo4j**
- User: neo4j
- Password: password

**RabbitMQ**
- User: admin
- Password: adminpassword

**PostgreSQL**
- User: postgres
- Password: password
- Database: sonah

---

## Prochaines Étapes

1. Lire [README.md](./README.md) pour la documentation complète
2. Consulter le [Prisma schema](./packages/database/prisma/schema.prisma)
3. Examiner l'architecture dans [apps/api/src](./apps/api/src)
4. Commencer par implémenter Phase 1.2 (RAG Foundation)

---

## Commandes de Diagnostic

```bash
# Vérifier toutes les dépendances
pnpm list

# Vérifier l'état des services Docker
docker-compose ps

# Voir l'utilisation des ressources
docker stats

# Vérifier les logs d'erreur
docker-compose logs --tail=100

# Tester la connexion API
curl http://localhost:4000/api/v1/health

# Vérifier Prisma
pnpm --filter @sonah/database prisma validate
```

---

## Support

En cas de problème :

1. Consulter cette documentation
2. Vérifier les logs : `docker-compose logs`
3. Consulter [GitHub Issues](https://github.com/emeric-cyrille/sonah/issues)
4. Contacter : fokamemeric@gmail.com
