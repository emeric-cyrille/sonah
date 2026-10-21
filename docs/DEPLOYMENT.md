# Guide de Déploiement - SONAH

## Architecture de Déploiement

**Domaine** : sonah.fokamemeric.com  
**VPS** : fokamemeric.com  
**Stack** : Docker Compose + Traefik + Let's Encrypt

```
                    ┌─────────────────┐
                    │   Internet      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Traefik       │
                    │  (Reverse Proxy)│
                    │  + Let's Encrypt│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │                             │
    ┌─────────▼────────┐        ┌──────────▼─────────┐
    │  sonah.          │        │  api.sonah.        │
    │  fokamemeric.com │        │  fokamemeric.com   │
    │  (Next.js)       │        │  (NestJS)          │
    └──────────────────┘        └────────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   Neo4j         │
                    │   Redis         │
                    │   RabbitMQ      │
                    └─────────────────┘
```

## Prérequis VPS

### Spécifications Minimales

- **OS** : Ubuntu 22.04 LTS
- **RAM** : 4 GB minimum (8 GB recommandé)
- **CPU** : 2 vCPU minimum
- **Disque** : 40 GB minimum (SSD recommandé)
- **Bande passante** : Illimitée

### Logiciels Requis

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git
sudo apt install git -y

# Node.js (pour build local si nécessaire)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
npm install -g pnpm@8.15.0
```

## Configuration DNS

### Sous-domaines à Configurer

Ajouter les enregistrements A suivants chez votre registrar DNS :

```
Type    Nom              Valeur              TTL
A       sonah            IP_DU_VPS           3600
A       api.sonah        IP_DU_VPS           3600
```

**Vérification** :
```bash
dig sonah.fokamemeric.com +short
dig api.sonah.fokamemeric.com +short
# Les deux doivent retourner l'IP du VPS
```

## Déploiement Initial

### 1. Connexion au VPS

```bash
ssh root@fokamemeric.com
# ou
ssh votre-user@fokamemeric.com
```

### 2. Création de l'Utilisateur de Déploiement

```bash
# Créer utilisateur sonah
sudo adduser sonah
sudo usermod -aG docker sonah
sudo usermod -aG sudo sonah

# Se connecter en tant que sonah
su - sonah
```

### 3. Clone du Repository

```bash
cd /home/sonah
git clone https://github.com/emeric-cyrille/sonah.git
cd sonah
```

### 4. Configuration des Variables d'Environnement

```bash
# Copier le fichier de production
cp .env.production.example .env.production

# Éditer avec les vraies valeurs
nano .env.production
```

**Variables Critiques à Remplir** :
- `OPENAI_API_KEY`
- `JWT_SECRET` (générer avec `openssl rand -base64 32`)
- `DATABASE_URL` (avec mot de passe fort)
- `NEO4J_PASSWORD`
- `REDIS_URL` (avec mot de passe)
- `RABBITMQ_URL` (avec mot de passe)

### 5. Configuration Traefik

Créer `docker-compose.prod.yml` :

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: sonah-traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=fokamemeric@gmail.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-letsencrypt:/letsencrypt
    networks:
      - sonah-network

  postgres:
    image: pgvector/pgvector:pg16
    container_name: sonah-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: sonah_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: sonah_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sonah-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sonah_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  neo4j:
    image: neo4j:5-community
    container_name: sonah-neo4j
    restart: unless-stopped
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc", "graph-data-science"]'
    volumes:
      - neo4j_data:/data
    networks:
      - sonah-network
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:7474 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: sonah-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - sonah-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: sonah-rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - sonah-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api.prod
    container_name: sonah-api
    restart: unless-stopped
    env_file:
      - .env.production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.sonah.fokamemeric.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=4000"
    depends_on:
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - sonah-network

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web.prod
    container_name: sonah-web
    restart: unless-stopped
    env_file:
      - .env.production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`sonah.fokamemeric.com`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=3000"
    depends_on:
      - api
    networks:
      - sonah-network

volumes:
  traefik-letsencrypt:
  postgres_data:
  neo4j_data:
  redis_data:
  rabbitmq_data:

networks:
  sonah-network:
    driver: bridge
```

### 6. Dockerfiles de Production

**docker/Dockerfile.api.prod** :
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@8.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @sonah/database prisma generate
RUN pnpm --filter @sonah/api build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@8.15.0

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "dist/main"]
```

**docker/Dockerfile.web.prod** :
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@8.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

RUN pnpm install --frozen-lockfile

COPY . .

ENV NEXT_PUBLIC_API_URL=https://api.sonah.fokamemeric.com

RUN pnpm --filter @sonah/web build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 7. Build et Déploiement

```bash
# Build les images
docker-compose -f docker-compose.prod.yml build

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f

# Initialiser la base de données
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy
```

### 8. Vérification

```bash
# Vérifier les services
docker-compose -f docker-compose.prod.yml ps

# Tester l'API
curl https://api.sonah.fokamemeric.com/api/v1/health

# Tester le frontend
curl https://sonah.fokamemeric.com
```

## Mises à Jour

### Déploiement Continu

```bash
cd /home/sonah/sonah

# Pull les dernières modifications
git pull origin main

# Rebuild et redémarrer
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Appliquer migrations DB
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy
```

### Script de Déploiement Automatique

Créer `scripts/deploy.sh` :
```bash
#!/bin/bash
set -e

echo "🚀 Déploiement SONAH en cours..."

# Pull
git pull origin main

# Backup DB
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U sonah_user sonah_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Build
docker-compose -f docker-compose.prod.yml build

# Down et Up
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Migrations
sleep 10
docker-compose -f docker-compose.prod.yml exec -T api pnpm prisma migrate deploy

echo "✅ Déploiement terminé"
```

## Monitoring

### Logs

```bash
# Tous les services
docker-compose -f docker-compose.prod.yml logs -f

# Service spécifique
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
```

### Health Checks

```bash
# API
curl https://api.sonah.fokamemeric.com/api/v1/health

# Frontend
curl -I https://sonah.fokamemeric.com
```

### Ressources

```bash
# Utilisation CPU/RAM
docker stats

# Espace disque
df -h
```

## Sauvegardes

### Base de Données

```bash
# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U sonah_user sonah_prod > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U sonah_user sonah_prod < backup.sql

# Automatiser avec cron
crontab -e
# Ajouter : 0 2 * * * /home/sonah/sonah/scripts/backup.sh
```

### Neo4j

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j-backup.dump

# Restore
docker-compose -f docker-compose.prod.yml exec neo4j neo4j-admin load --from=/backups/neo4j-backup.dump --database=neo4j --force
```

## Sécurité

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Mise à Jour Automatique

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Troubleshooting

### Service ne démarre pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs [service]

# Vérifier la configuration
docker-compose -f docker-compose.prod.yml config

# Redémarrer
docker-compose -f docker-compose.prod.yml restart [service]
```

### Certificat SSL

```bash
# Forcer renouvellement Let's Encrypt
docker-compose -f docker-compose.prod.yml restart traefik

# Vérifier expiration
echo | openssl s_client -servername sonah.fokamemeric.com -connect sonah.fokamemeric.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Base de données pleine

```bash
# Nettoyer les logs
docker-compose -f docker-compose.prod.yml exec postgres vacuumdb -U sonah_user --all --full --analyze

# Augmenter l'espace disque VPS
```

## Contact Support

En cas de problème : fokamemeric@gmail.com
