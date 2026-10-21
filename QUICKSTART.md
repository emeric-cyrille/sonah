# 🚀 SONAH - Quick Start Guide

## Étapes pour Démarrer le Projet

### 1. Prérequis

Assurez-vous d'avoir installé :
- **Node.js** 18+ : [télécharger](https://nodejs.org/)
- **pnpm** 8+ : `npm install -g pnpm@8.15.0`
- **Docker Desktop** : [télécharger](https://www.docker.com/products/docker-desktop/)
- **OpenAI API Key** : [obtenir](https://platform.openai.com/api-keys)

### 2. Installation

```bash
# Cloner le repo (déjà fait si vous lisez ce fichier)
cd /Users/mac/Desktop/sonah

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env et ajouter votre OPENAI_API_KEY
# Ouvrir avec VS Code ou nano
code .env
# OU
nano .env
```

**Exemple `.env` minimal** :
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sonah"
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password"
REDIS_URL="redis://localhost:6379"
RABBITMQ_URL="amqp://localhost:5672"
OPENAI_API_KEY="sk-proj-VOTRE_CLE_ICI"
JWT_SECRET="development-secret-key-change-this"
NEXT_PUBLIC_API_URL="http://localhost:4000"
API_PORT=4000
NODE_ENV="development"
```

### 3. Installation des Dépendances

```bash
# Installer toutes les dépendances du monorepo
pnpm install
```

### 4. Lancer l'Infrastructure (Docker)

```bash
# Lancer PostgreSQL, Neo4j, Redis, RabbitMQ
docker-compose up -d

# Vérifier que tout tourne
docker-compose ps
```

**Services disponibles** :
- PostgreSQL : `localhost:5432`
- Neo4j Browser : http://localhost:7474 (user: neo4j, pass: password)
- Redis : `localhost:6379`
- RabbitMQ Management : http://localhost:15672 (user: admin, pass: adminpassword)

### 5. Initialiser la Base de Données

```bash
# Générer le client Prisma
pnpm --filter @sonah/database prisma generate

# Créer les tables
pnpm --filter @sonah/database prisma db push

# (Optionnel) Seed avec des données de test
# pnpm db:seed
```

### 6. Lancer les Applications

#### Option A : Lancer tout en même temps

```bash
# Lancer frontend + backend simultanément
pnpm dev
```

#### Option B : Lancer séparément (2 terminaux)

**Terminal 1 - Backend (NestJS)** :
```bash
pnpm --filter @sonah/api dev
```

**Terminal 2 - Frontend (Next.js)** :
```bash
pnpm --filter @sonah/web dev
```

### 7. Accéder aux Applications

- **Frontend** : http://localhost:3000
- **API** : http://localhost:4000
- **API Health** : http://localhost:4000/api/v1/health

---

## 🧪 Vérification du Bon Fonctionnement

### Test 1 : Frontend

Ouvrez http://localhost:3000 dans votre navigateur. Vous devriez voir la landing page SONAH avec les stats.

### Test 2 : Backend

```bash
curl http://localhost:4000/api/v1/health
```

Résultat attendu :
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

### Test 3 : Base de Données

```bash
# Ouvrir Prisma Studio (interface visuelle)
pnpm db:studio
```

Devrait ouvrir http://localhost:5555 avec l'interface Prisma Studio.

---

## 🔧 Commandes Utiles

### Base de Données

```bash
# Générer le client Prisma après modification du schema
pnpm db:generate

# Créer une migration
pnpm db:migrate

# Ouvrir Prisma Studio
pnpm db:studio

# Reset la base de données
pnpm --filter @sonah/database prisma migrate reset
```

### Docker

```bash
# Lancer l'infrastructure
docker-compose up -d

# Arrêter l'infrastructure
docker-compose down

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f postgres
docker-compose logs -f neo4j

# Redémarrer un service
docker-compose restart postgres
```

### Développement

```bash
# Linter
pnpm lint

# Formatter le code
pnpm format

# Build pour production
pnpm build

# Tests (quand disponibles)
pnpm test
```

---

## 🐛 Troubleshooting

### Problème 1 : Port déjà utilisé

**Erreur** : `Error: listen EADDRINUSE: address already in use :::3000`

**Solution** :
```bash
# Tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9

# Ou changer le port dans package.json
# "dev": "next dev -p 3001"
```

### Problème 2 : Docker services ne démarrent pas

**Solution** :
```bash
# Vérifier Docker Desktop est lancé
docker ps

# Nettoyer et relancer
docker-compose down -v
docker-compose up -d
```

### Problème 3 : Prisma ne trouve pas la base de données

**Solution** :
```bash
# Vérifier que PostgreSQL tourne
docker-compose ps postgres

# Vérifier la connection
docker exec -it sonah-postgres psql -U postgres -c "SELECT 1"

# Recréer les tables
pnpm --filter @sonah/database prisma db push --force-reset
```

### Problème 4 : pnpm command not found

**Solution** :
```bash
npm install -g pnpm@8.15.0
```

---

## 📦 Structure du Projet

```
sonah/
├── apps/
│   ├── web/          ✅ Next.js 14 (http://localhost:3000)
│   └── api/          ✅ NestJS (http://localhost:4000)
│
├── packages/
│   ├── database/     ✅ Prisma + PostgreSQL
│   ├── shared/       ✅ Types partagés
│   ├── agents/       🔜 Phase 1.3
│   ├── rag/          🔜 Phase 1.2
│   └── scraping/     🔜 Phase 1.6
│
└── infrastructure/   ✅ Docker services
```

---

## 🎯 Prochaines Étapes (Roadmap)

### ✅ Phase 1.1 : Infrastructure (FAIT)
- [x] Monorepo setup
- [x] Docker Compose
- [x] Frontend Next.js 14
- [x] Backend NestJS
- [x] Prisma + PostgreSQL

### 🚧 Phase 1.2 : RAG Foundation (EN COURS)
- [ ] Compléter le schema Prisma
- [ ] Vector Store service (pgvector)
- [ ] Graph Store service (Neo4j)
- [ ] Seed Constitution + lois

### 🔜 Phase 1.3 : Premier Agent
- [ ] LangGraph Orchestrator
- [ ] Agent MINCOMMERCE
- [ ] Test E2E

### 🔜 Phase 1.4-1.6 : Multi-Agents, Frontend, Scraping
Voir README.md pour détails complets.

---

## 📚 Documentation

- [README Principal](./README.md)
- [Présentation SONAH](./SONAH_PRESENTATION_FINALE.md)
- [Architecture Détaillée](./docs/ARCHITECTURE.md) (à venir)

---

## 🤝 Contribution

**Lead Technique** : Fokam Emeric Cyrille
- Email : fokamemeric@gmail.com
- GitHub : [@emeric-cyrille](https://github.com/emeric-cyrille)

---

## 📝 Notes de Développement

- Le projet utilise **Turbo** pour la gestion du monorepo
- **pnpm workspaces** pour les dépendances
- **TypeScript** strict mode
- **ESLint** + **Prettier** pour le code style
- **Docker Compose** pour l'environnement de développement

**Bonne chance avec SONAH ! 🇨🇲🚀**
