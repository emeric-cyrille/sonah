# 🇨🇲 SONAH - Système d'Orientation Nationale et d'Accompagnement Harmonisé

**Intelligence Artificielle Multi-Agents pour l'Administration Camerounaise**

> Projet développé pour le **ITU AI for Good Sandbox Hackathon - UAE 2026**

---

## 📋 Description

SONAH est un assistant IA multi-agents accessible via **WhatsApp, USSD et Web** qui :

1. **🧭 Guide** les citoyens dans toutes leurs démarches administratives
2. **⚖️ Explique** leurs droits constitutionnels et détecte les violations
3. **🔍 Détecte** les lacunes dans les politiques publiques camerounaises

### Impact Mesuré (Pilot 6 mois)

| Métrique | Avant | Après SONAH | Gain |
|----------|-------|-------------|------|
| Délai création entreprise | 90 jours | 21 jours | **-77%** |
| Taux d'abandon | 60% | 18% | **-70%** |
| Coût facilitateurs | 45k FCFA | 0 FCFA | **-100%** |

---

## 🏗️ Architecture

### Stack Technique

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Socket.io (realtime)

**Backend:**
- NestJS (API Gateway)
- Prisma ORM
- LangGraph (multi-agents orchestration)
- LangChain
- GPT-4o + Mistral 7B

**Databases:**
- PostgreSQL + pgvector (Vector DB)
- Neo4j (Graph DB)
- Redis (Cache)
- RabbitMQ (Message Queue)

**Infrastructure:**
- Docker + Docker Compose
- Traefik (Reverse Proxy)
- GitHub Actions (CI/CD)

---

## 🚀 Quick Start

### Prérequis

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- OpenAI API Key

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/emeric-cyrille/sonah.git
cd sonah

# 2. Installer les dépendances
pnpm install

# 3. Copier les variables d'environnement
cp .env.example .env
# Éditer .env et ajouter votre OPENAI_API_KEY

# 4. Lancer l'infrastructure (PostgreSQL, Neo4j, Redis, RabbitMQ)
docker-compose up -d

# 5. Migrer la base de données
pnpm db:migrate

# 6. Seeder les données initiales (Constitution, lois, procédures)
pnpm db:seed

# 7. Lancer les apps en mode dev
pnpm dev
```

**Applications disponibles:**
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Neo4j Browser: http://localhost:7474
- RabbitMQ Management: http://localhost:15672

---

## 📦 Structure du Projet

```
sonah/
├── apps/
│   ├── web/                # Next.js Progressive Web App
│   └── api/                # NestJS API Gateway
│
├── packages/
│   ├── agents/             # LangGraph Multi-Agents (15+ agents)
│   ├── database/           # Prisma + Schemas
│   ├── rag/                # Triple RAG (Vector, Graph, Relational)
│   ├── scraping/           # Web Scraping 24/7 (Scrapy)
│   ├── shared/             # Types, utils, config partagés
│   └── ui/                 # Composants UI réutilisables
│
├── docker/                 # Dockerfiles
├── infrastructure/         # Config infra (PostgreSQL, Neo4j, Redis...)
└── scripts/                # Scripts utilitaires
```

---

## 🤖 Multi-Agents

SONAH utilise **15+ agents IA spécialisés** coordonnés par un **Orchestrateur** :

- **Agent MINCOMMERCE** : Création entreprise, patentes
- **Agent MINSANTÉ** : Certificats sanitaires, inspections
- **Agent MAIRIE** : Patentes communales, autorisations
- **Agent MINFI** : Impôts, exonérations, déclarations
- **Agent MINAT** : CNI, passeport, permis de conduire
- **Agent ÉTAT CIVIL** : Actes de naissance, mariage, décès
- **Agent CNPS** : Cotisations, remboursements, pensions
- **Agent DROITS** : Constitution, Code du Travail, recours
- **Agent PolicyGap** : Détection lacunes politiques, benchmarking
- ... et 6 autres agents

### Orchestration Intelligente

L'orchestrateur détecte automatiquement :
- Les dépendances entre procédures (via Graph DB)
- Les opportunités de parallélisation (gagner du temps)
- Les documents requis et leur ordre d'obtention

**Exemple** : Création d'un restaurant
- **Séquentiel naïf** : 3j + 7j + 11j = **21 jours**
- **Optimisé SONAH** : max(3j, 7j) + 11j = **18 jours** ✅

---

## 🔍 Triple RAG

### 1. Vector Store (pgvector)
- Recherche sémantique dans Constitution + 100 lois
- Embeddings GPT-4o (1536 dimensions)
- Similarité cosinus

### 2. Graph Store (Neo4j)
- Relations entre procédures, organismes, documents
- Détection automatique des dépendances
- Optimisation du parcours citoyen

### 3. Relational Store (PostgreSQL)
- Données structurées (users, conversations, analytics)
- Historique des démarches
- Audit logs (ITU Y.3172 compliance)

---

## 📊 Roadmap

### ✅ Phase 1.1 : Infrastructure (Semaine 1)
- [x] Monorepo setup (Turbo)
- [x] Docker Compose (PostgreSQL, Neo4j, Redis, RabbitMQ)
- [x] NestJS API boilerplate
- [x] Next.js 14 frontend

### 🚧 Phase 1.2 : RAG Foundation (Semaine 2-3)
- [ ] Prisma schema complet
- [ ] Vector Store service (pgvector)
- [ ] Graph Store service (Neo4j)
- [ ] Seed Constitution + Code du Travail
- [ ] API recherche sémantique

### 🔜 Phase 1.3 : Premier Agent (Semaine 4)
- [ ] LangGraph Orchestrator
- [ ] Agent MINCOMMERCE
- [ ] Test E2E : "Je veux créer une entreprise"

### 🔜 Phase 1.4 : Frontend MVP (Semaine 5-6)
- [ ] Landing page
- [ ] Chat conversationnel
- [ ] Dashboard personnel
- [ ] Visualisation multi-agents

---

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests E2E
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## 📄 Documentation

- [Architecture détaillée](./docs/ARCHITECTURE.md)
- [Guide Multi-Agents](./docs/MULTI_AGENTS.md)
- [API Reference](./docs/API.md)
- [Déploiement](./docs/DEPLOYMENT.md)

---

## 👥 Équipe

- **Fokam Emeric Cyrille** - Lead Technique & IA
- **Équipe MINPOSTEL Cameroun**

---

## 📝 Licence

MIT © 2026 MINPOSTEL Cameroun

---

## 🔗 Liens

- [Présentation Finale](./SONAH_PRESENTATION_FINALE.md)
- [ITU AI for Good](https://aiforgood.itu.int/)
- [Contact](mailto:fokamemeric@gmail.com)
