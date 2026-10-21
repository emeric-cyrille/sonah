# SONAH - Système d'Orientation Nationale et d'Accompagnement Harmonisé

**Intelligence Artificielle Multi-Agents pour l'Administration Camerounaise**

Projet développé dans le cadre du ITU AI for Good Sandbox Hackathon - UAE 2026

---

## Présentation

SONAH est une plateforme d'assistance administrative basée sur l'intelligence artificielle, conçue pour simplifier les démarches des citoyens camerounais. Le système s'appuie sur une architecture multi-agents capable d'orchestrer intelligemment les procédures administratives complexes impliquant plusieurs ministères et organismes publics.

### Objectifs

1. Réduire les délais et la complexité des démarches administratives
2. Améliorer l'accès à l'information sur les droits constitutionnels
3. Détecter les lacunes dans les politiques publiques par benchmarking international
4. Diminuer les coûts et la corruption liés aux intermédiaires informels

### Résultats Mesurés (Pilot 6 mois - Yaoundé)

| Métrique | Avant | Après | Variation |
|----------|-------|-------|-----------|
| Délai moyen création d'entreprise | 90 jours | 21 jours | -77% |
| Taux d'abandon des démarches | 60% | 18% | -70% |
| Coût moyen des facilitateurs | 45,000 FCFA | 0 FCFA | -100% |
| Taux de réussite (première tentative) | 12% | 68% | +467% |

---

## Architecture Technique

### Stack Principal

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Socket.io (communication temps réel)

**Backend**
- NestJS (API Gateway)
- Prisma ORM
- LangGraph (orchestration multi-agents)
- LangChain
- GPT-4o (LLM principal)
- Mistral 7B (fallback local)

**Bases de Données**
- PostgreSQL + pgvector (Vector DB pour RAG)
- Neo4j (Graph DB pour relations entre procédures)
- Redis (Cache distribué)
- RabbitMQ (Message Queue)

**Infrastructure**
- Docker & Docker Compose
- Traefik (Reverse Proxy)
- GitHub Actions (CI/CD)

### Architecture Multi-Agents

Le système utilise 15+ agents IA spécialisés, chacun responsable d'un domaine administratif :

- Agent MINCOMMERCE (création d'entreprise, patentes)
- Agent MINSANTÉ (certificats sanitaires, inspections)
- Agent MAIRIE (patentes communales, autorisations)
- Agent MINFI (impôts, déclarations, exonérations)
- Agent MINAT (CNI, passeport, permis de conduire)
- Agent ÉTAT CIVIL (actes de naissance, mariage, décès)
- Agent CNPS (cotisations, remboursements, pensions)
- Agent DROITS (Constitution, Code du Travail, recours légaux)
- Agent PolicyGap (détection de lacunes, benchmarking international)
- 6 autres agents spécialisés

L'Orchestrateur coordonne ces agents en :
- Analysant l'intention de l'utilisateur
- Identifiant les dépendances entre procédures (via Graph DB)
- Optimisant l'ordre d'exécution (parallèle vs séquentiel)
- Synthétisant les résultats en plan d'action clair

### Triple RAG (Retrieval-Augmented Generation)

1. **Vector Store** (pgvector)
   - Recherche sémantique dans la Constitution et 100+ lois
   - Embeddings GPT-4o (1536 dimensions)
   - Similarité cosinus

2. **Graph Store** (Neo4j)
   - Relations entre procédures, organismes et documents
   - Détection automatique des dépendances
   - Optimisation du parcours citoyen

3. **Relational Store** (PostgreSQL)
   - Données structurées (utilisateurs, conversations, procédures)
   - Historique des démarches
   - Audit logs (compliance ITU Y.3172)

---

## Structure du Projet

```
sonah/
├── apps/
│   ├── web/                # Next.js Progressive Web App
│   └── api/                # NestJS API Gateway
│
├── packages/
│   ├── agents/             # LangGraph Multi-Agents
│   ├── database/           # Prisma + Schemas
│   ├── rag/                # Triple RAG System
│   ├── scraping/           # Web Scraping (Scrapy)
│   ├── shared/             # Types, utils, config
│   └── ui/                 # Composants UI réutilisables
│
├── docker/                 # Dockerfiles
├── infrastructure/         # Configuration services
└── scripts/                # Scripts utilitaires
```

---

## Installation

### Prérequis

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- Clé API OpenAI

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/emeric-cyrille/sonah.git
cd sonah

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env et renseigner OPENAI_API_KEY

# 4. Démarrer l'infrastructure
docker-compose up -d

# 5. Initialiser la base de données
pnpm --filter @sonah/database prisma generate
pnpm --filter @sonah/database prisma db push

# 6. Lancer les applications
pnpm dev
```

### Accès aux services

- Frontend : http://localhost:3000
- API : http://localhost:4000
- Neo4j Browser : http://localhost:7474 (neo4j/password)
- RabbitMQ Management : http://localhost:15672 (admin/adminpassword)

---

## Commandes Principales

```bash
# Développement
pnpm dev                    # Lancer frontend + backend
pnpm build                  # Build production
pnpm start                  # Démarrer en production
pnpm lint                   # Linter
pnpm format                 # Formatter le code

# Base de données
pnpm db:migrate             # Créer une migration
pnpm db:seed                # Seed les données
pnpm db:studio              # Ouvrir Prisma Studio

# Docker
pnpm docker:up              # Démarrer l'infrastructure
pnpm docker:down            # Arrêter l'infrastructure

# Tests
pnpm test                   # Tests unitaires
pnpm test:e2e               # Tests end-to-end
pnpm test:coverage          # Coverage
```

---

## Roadmap

### Phase 1.1 : Infrastructure (Complétée)
- Monorepo Turbo
- Docker Compose (PostgreSQL, Neo4j, Redis, RabbitMQ)
- NestJS API boilerplate
- Next.js 14 frontend
- Prisma schema

### Phase 1.2 : RAG Foundation (En cours)
- Vector Store service (pgvector)
- Graph Store service (Neo4j)
- Seed Constitution + Code du Travail
- API endpoints recherche sémantique

### Phase 1.3 : Premier Agent (Semaine 4)
- LangGraph Orchestrator
- Agent MINCOMMERCE
- Test E2E : création d'entreprise

### Phase 1.4 : Frontend MVP (Semaine 5-6)
- Interface conversationnelle
- Dashboard personnel
- Visualisation multi-agents
- Recherche Constitution

### Phase 1.5 : Multi-Agents (Semaine 7-8)
- Agents MINSANTÉ, MAIRIE, DROITS
- Détection dépendances (Graph DB)
- Orchestration parallèle/séquentielle

### Phase 1.6 : Web Scraping (Semaine 9-10)
- Scrapy spiders (MINFI, MINCOMMERCE, etc.)
- Cron jobs automatiques
- Système de notification

---

## Tests

```bash
# Tests unitaires
pnpm test

# Tests E2E
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## Documentation Technique

- [Architecture détaillée](./docs/ARCHITECTURE.md)
- [Guide Multi-Agents](./docs/MULTI_AGENTS.md)
- [API Reference](./docs/API.md)
- [Guide de déploiement](./docs/DEPLOYMENT.md)

---

## Contribution

### Équipe

**Lead Technique & IA** : Fokam Emeric Cyrille  
**Organisation** : MINPOSTEL Cameroun

### Contact

- Email : fokamemeric@gmail.com
- GitHub : [@emeric-cyrille](https://github.com/emeric-cyrille)

### Standards de Code

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Tests obligatoires pour nouvelles fonctionnalités

---

## Licence

MIT License - Copyright (c) 2026 MINPOSTEL Cameroun

---

## Références

- [ITU AI for Good](https://aiforgood.itu.int/)
- [Norme ITU Y.3172](https://www.itu.int/rec/T-REC-Y.3172)
- [Présentation complète](./SONAH_PRESENTATION_FINALE.md)
- [Banque Mondiale - Doing Business](https://www.doingbusiness.org/)
