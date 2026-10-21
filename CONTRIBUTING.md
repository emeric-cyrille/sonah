# Guide de Contribution

## Prérequis

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker Desktop
- Git
- Connaissance TypeScript, NestJS, Next.js

## Setup Initial

1. Fork le repository
2. Clone votre fork
```bash
git clone https://github.com/VOTRE-USERNAME/sonah.git
cd sonah
```

3. Ajouter le remote upstream
```bash
git remote add upstream https://github.com/emeric-cyrille/sonah.git
```

4. Installer les dépendances
```bash
pnpm install
```

5. Copier et configurer `.env`
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

6. Démarrer l'infrastructure
```bash
docker-compose up -d
```

7. Initialiser la base de données
```bash
pnpm db:generate
pnpm db:push
```

## Workflow de Développement

### 1. Créer une Branche

Toujours créer une branche depuis `main` à jour :

```bash
git checkout main
git pull upstream main
git checkout -b type/description-courte
```

**Types de branches** :
- `feat/` : Nouvelle fonctionnalité
- `fix/` : Correction de bug
- `refactor/` : Refactoring
- `docs/` : Documentation
- `test/` : Tests

**Exemples** :
```bash
git checkout -b feat/mincommerce-agent
git checkout -b fix/pgvector-connection
git checkout -b refactor/rag-service
```

### 2. Développer

1. Lire `.claude/instructions.md` pour comprendre l'architecture
2. Suivre les conventions de code
3. Écrire des tests si applicable
4. Tester manuellement

### 3. Commit

**Format** :
```
type(scope): description courte (max 72 caractères)

[Corps optionnel expliquant le pourquoi]

[Footer optionnel]
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement fonctionnel
- `perf`: Amélioration de performance
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance

**Scopes** :
- `agents`: Package agents
- `rag`: Package RAG
- `api`: Backend NestJS
- `web`: Frontend Next.js
- `database`: Prisma schema
- `shared`: Package shared
- `scraping`: Package scraping
- `infra`: Infrastructure/Docker

**Exemples** :
```bash
git commit -m "feat(agents): implement MINCOMMERCE agent with procedure extraction"
git commit -m "fix(rag): correct pgvector similarity search threshold"
git commit -m "refactor(api): extract validation logic to shared module"
```

### 4. Push et Pull Request

```bash
# Push sur votre fork
git push origin feat/mincommerce-agent

# Créer la PR sur GitHub
# Titre : même format que le commit principal
# Description : détails de l'implémentation
```

**Template PR** :
```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Nouvelle fonctionnalité (feat)
- [ ] Correction de bug (fix)
- [ ] Refactoring (refactor)
- [ ] Documentation (docs)

## Checklist
- [ ] Code suit les conventions du projet
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] `pnpm lint` passe
- [ ] `pnpm build` passe
- [ ] Testé manuellement

## Tests Effectués
Décrire les tests manuels effectués
```

## Standards de Code

### TypeScript

```typescript
// ✅ BON
interface User {
  id: string;
  email: string;
  name: string | null;
}

async function getUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }
  return user;
}

// ❌ MAUVAIS
async function getUser(id: any) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
}
```

### Error Handling

```typescript
// ✅ BON
try {
  const result = await riskyOperation();
  logger.log('Operation succeeded');
  return result;
} catch (error) {
  logger.error('Operation failed', { error });
  throw new InternalServerErrorException('Failed to perform operation');
}

// ❌ MAUVAIS
const result = await riskyOperation(); // Peut crash sans gestion
```

### Logging

```typescript
// ✅ BON
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);

  async doSomething() {
    this.logger.log('Starting operation');
    // ...
    this.logger.log('Operation completed');
  }
}
```

### Naming Conventions

```typescript
// Fichiers
user-service.ts          // kebab-case
create-user.dto.ts       // kebab-case

// Classes
class UserService {}     // PascalCase
class CreateUserDto {}   // PascalCase

// Functions/Variables
const getUserById = () => {}    // camelCase
const isValid = true            // camelCase

// Constants
const API_URL = 'http://...'    // UPPER_SNAKE_CASE
const MAX_RETRIES = 3           // UPPER_SNAKE_CASE

// Interfaces/Types
interface User {}               // PascalCase
type UserRole = 'admin' | 'user' // PascalCase
```

## Tests

### Tests Unitaires

```typescript
// example.spec.ts
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const createDto = { email: 'test@test.com', name: 'Test' };
    const expected = { id: '1', ...createDto };

    jest.spyOn(prisma.user, 'create').mockResolvedValue(expected);

    const result = await service.create(createDto);
    expect(result).toEqual(expected);
  });
});
```

### Lancer les Tests

```bash
# Tests unitaires
pnpm test

# Tests E2E
pnpm test:e2e

# Coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Commandes Utiles

```bash
# Linting
pnpm lint                           # Vérifier
pnpm lint --fix                     # Corriger automatiquement

# Formatting
pnpm format                         # Formatter tout

# Build
pnpm build                          # Build tout
pnpm --filter @sonah/api build      # Build API uniquement

# Database
pnpm db:generate                    # Générer Prisma client
pnpm db:push                        # Push schema (dev)
pnpm db:migrate                     # Créer migration
pnpm db:studio                      # Interface Prisma Studio

# Docker
docker-compose up -d                # Démarrer services
docker-compose down                 # Arrêter
docker-compose logs -f [service]    # Logs
```

## Revue de Code

Lors de la revue de PR, nous vérifions :

1. **Code Quality**
   - Respect des conventions
   - Typage correct
   - Gestion des erreurs
   - Logging approprié

2. **Tests**
   - Tests unitaires pertinents
   - Coverage suffisant
   - Tests E2E si applicable

3. **Documentation**
   - Code commenté si complexe
   - README mis à jour
   - Types documentés (JSDoc)

4. **Performance**
   - Pas de N+1 queries
   - Caching approprié
   - Optimisation DB

5. **Sécurité**
   - Validation des inputs
   - Sanitization
   - Pas de secrets hardcodés

## Questions / Support

- Lire `.claude/instructions.md`
- Consulter la documentation existante
- Ouvrir une issue sur GitHub
- Contacter : fokamemeric@gmail.com

## Licence

En contribuant, vous acceptez que vos contributions soient sous licence MIT.
