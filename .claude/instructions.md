# Instructions pour l'Agent SONAH

## Contexte du Projet

Tu travailles sur **SONAH** (Système d'Orientation Nationale et d'Accompagnement Harmonisé), un système d'intelligence artificielle multi-agents pour simplifier les démarches administratives au Cameroun.

## Architecture du Projet

### Structure Monorepo

```
sonah/
├── apps/
│   ├── web/          # Next.js 14 - Frontend PWA
│   └── api/          # NestJS - Backend API Gateway
├── packages/
│   ├── database/     # Prisma + PostgreSQL schema
│   ├── shared/       # Types, utils, constants partagés
│   ├── agents/       # LangGraph multi-agents (à implémenter)
│   ├── rag/          # Triple RAG system (à implémenter)
│   └── scraping/     # Web scraping (à implémenter)
```

### Stack Technique

**Frontend**
- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS
- Zustand (state management)
- Socket.io (temps réel)

**Backend**
- NestJS
- Prisma ORM
- LangGraph (orchestration multi-agents)
- LangChain
- GPT-4o (LLM principal)

**Bases de Données**
- PostgreSQL + pgvector (Vector DB)
- Neo4j (Graph DB)
- Redis (Cache)
- RabbitMQ (Message Queue)

## Principes de Développement

### 1. Standards de Code

- **TypeScript strict mode** : Toujours typer explicitement
- **Pas de `any`** : Utiliser `unknown` si type inconnu
- **Functional programming** : Préférer l'immutabilité
- **Error handling** : Toujours wrapper les erreurs dans try/catch
- **Naming conventions** :
  - Fichiers : kebab-case (`user-service.ts`)
  - Classes : PascalCase (`UserService`)
  - Functions/Variables : camelCase (`getUserById`)
  - Constants : UPPER_SNAKE_CASE (`API_URL`)

### 2. Architecture Multi-Agents

**Chaque agent doit** :
- Être autonome et spécialisé
- Communiquer via RabbitMQ
- Logger ses actions (audit trail)
- Gérer ses erreurs localement
- Retourner un résultat structuré

**Orchestrateur** :
- Analyse l'intention utilisateur
- Sélectionne les agents nécessaires
- Détecte les dépendances (Graph DB)
- Optimise l'exécution (parallèle/séquentiel)
- Synthétise les résultats

### 3. Triple RAG

**Vector Store (pgvector)** :
- Embeddings GPT-4o (1536 dimensions)
- Similarité cosinus
- Documents : Constitution, lois, procédures

**Graph Store (Neo4j)** :
- Relations entre procédures/organismes/documents
- Détection de dépendances
- Optimisation parcours

**Relational Store (PostgreSQL)** :
- Données structurées
- Historique conversations
- Audit logs

### 4. Conventions Git

**Format des commits** :
```
type(scope): description courte

[corps optionnel]

[footer optionnel]
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement fonctionnel
- `perf`: Amélioration de performance
- `docs`: Documentation
- `test`: Ajout/modification de tests
- `chore`: Maintenance (deps, config)

**Exemples** :
```
feat(agents): implement MINCOMMERCE agent with procedure extraction
fix(rag): correct pgvector similarity search query
refactor(api): extract common validation logic to shared package
```

**Interdictions** :
- ❌ Jamais de mention "Claude", "AI assistant" ou similaire dans les commits
- ❌ Jamais de "Co-Authored-By" automatique
- ❌ Jamais de force push sur main sans validation

## Roadmap et Priorités

### Phase 1.2 : RAG Foundation (PRIORITAIRE)

**Objectif** : Mettre en place le système de recherche sémantique

**Tâches** :
1. Implémenter `packages/rag/src/vector-store.service.ts`
   - Connexion pgvector
   - Méthode `createEmbedding(text: string)`
   - Méthode `search(query: string, topK: number)`
   - Méthode `upsert(doc: Document)`

2. Implémenter `packages/rag/src/graph-store.service.ts`
   - Connexion Neo4j
   - Méthode `getDependencies(procedures: string[])`
   - Méthode `createRelation(from, to, type)`
   - Méthode `findOptimalPath(start, end)`

3. Créer seed pour Constitution et Code du Travail
   - Parser les PDFs
   - Chunking intelligent (par article)
   - Générer embeddings
   - Insérer dans Vector DB + Graph DB

4. API endpoints dans `apps/api/src/modules/rag/`
   - `POST /api/v1/search` : Recherche sémantique
   - `POST /api/v1/documents` : Upload document
   - `GET /api/v1/documents/:id` : Récupérer document

### Phase 1.3 : Premier Agent

**Objectif** : Agent MINCOMMERCE fonctionnel

**Tâches** :
1. Créer structure `packages/agents/`
   ```
   packages/agents/
   ├── src/
   │   ├── orchestrator/
   │   │   └── index.ts
   │   ├── mincommerce/
   │   │   └── index.ts
   │   └── types.ts
   ```

2. Implémenter Orchestrator
   - Analyse intention (GPT-4o)
   - Sélection agents
   - Détection dépendances
   - Exécution orchestrée

3. Implémenter Agent MINCOMMERCE
   - Recherche procédure dans RAG
   - Extraction informations structurées
   - Validation résultat
   - Retour formaté

4. Test E2E
   - Input : "Je veux créer une entreprise de restauration à Yaoundé"
   - Output attendu : Plan avec étapes MINCOMMERCE/MINSANTÉ/MAIRIE

### Phase 1.4 : Frontend MVP

**Objectif** : Interface conversationnelle fonctionnelle

**Pages** :
- `/` : Landing (déjà fait)
- `/chat` : Interface conversationnelle
- `/dashboard` : Dashboard personnel
- `/droits` : Recherche Constitution

## Commandes Importantes

### Développement
```bash
pnpm dev                    # Lancer tout
pnpm --filter @sonah/api dev      # Backend seul
pnpm --filter @sonah/web dev      # Frontend seul
```

### Base de données
```bash
pnpm db:generate            # Générer client Prisma
pnpm db:push                # Push schema
pnpm db:migrate             # Créer migration
pnpm db:studio              # Interface visuelle
```

### Tests
```bash
pnpm test                   # Tests unitaires
pnpm test:e2e               # Tests E2E
pnpm test:coverage          # Coverage
```

### Docker
```bash
docker-compose up -d        # Démarrer services
docker-compose down         # Arrêter
docker-compose logs -f      # Logs
```

## Bonnes Pratiques

### 1. Avant de Commencer une Tâche

1. Lire le code existant dans le module concerné
2. Comprendre l'architecture actuelle
3. Vérifier le Prisma schema si DB concernée
4. Regarder les types dans `packages/shared/src/types.ts`

### 2. Pendant le Développement

- Typer explicitement tous les paramètres et retours
- Documenter les fonctions complexes avec JSDoc
- Logger les étapes importantes
- Gérer les erreurs avec try/catch
- Valider les inputs avec Zod

### 3. Avant de Commit

1. Lancer `pnpm lint`
2. Lancer `pnpm format`
3. Vérifier que `pnpm build` passe
4. Tester manuellement la fonctionnalité
5. Commit message selon la convention

### 4. Gestion des Erreurs

```typescript
// ❌ MAUVAIS
async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
}

// ✅ BON
async function getUser(id: string): Promise<User> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    
    return user;
  } catch (error) {
    logger.error('Error fetching user', { id, error });
    throw error;
  }
}
```

### 5. Logging

```typescript
import { Logger } from '@nestjs/common';

export class UserService {
  private readonly logger = new Logger(UserService.name);

  async createUser(data: CreateUserDto) {
    this.logger.log(`Creating user: ${data.email}`);
    
    try {
      const user = await this.prisma.user.create({ data });
      this.logger.log(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

## Fichiers Importants à Connaître

- `packages/database/prisma/schema.prisma` : Modèle de données complet
- `packages/shared/src/types.ts` : Types partagés
- `packages/shared/src/constants.ts` : Constantes (ministères, etc.)
- `apps/api/src/app.module.ts` : Configuration NestJS
- `docker-compose.yml` : Configuration infrastructure
- `.env.example` : Variables d'environnement

## Données de Test

### Utilisateur Test
```typescript
{
  phone: "+237699123456",
  email: "test@sonah.cm",
  name: "Test User",
  role: "CITIZEN"
}
```

### Exemple Procédure
```typescript
{
  type: "BUSINESS_CREATION",
  title: "Création restaurant à Yaoundé",
  userId: "...",
  status: "IN_PROGRESS"
}
```

## Resources Externes

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [LangChain Docs](https://js.langchain.com/docs)
- [Neo4j Docs](https://neo4j.com/docs)

## Support

En cas de blocage :
1. Consulter cette documentation
2. Lire le code existant dans le module similaire
3. Vérifier les logs : `docker-compose logs`
4. Tester manuellement avec Prisma Studio ou curl

## Objectif Final

Créer un système multi-agents capable de :
1. Comprendre l'intention de l'utilisateur
2. Orchestrer 15+ agents spécialisés
3. Optimiser le parcours administratif
4. Réduire délais et coûts
5. Démocratiser l'accès aux droits

**Impact cible** : -77% délai création entreprise, -70% taux abandon, -100% coûts facilitateurs
