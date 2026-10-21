# Déploiement SONAH sur VPS Seazone

## Informations VPS

| Élément | Valeur |
|---------|--------|
| Hostname | `vps-05b4f925` |
| IP | `51.254.137.22` |
| Port SSH | `2222` |
| Utilisateur | `deploy` |
| Répertoire | `/home/deploy/sonah` |

## Ports Utilisés par SONAH

| Service | Port Hôte | Port Conteneur | Status |
|---------|-----------|----------------|--------|
| API (NestJS) | **3006** | 4000 | Libre ✅ |
| PostgreSQL | **5433** | 5432 | Libre ✅ |
| Neo4j Browser | **7475** | 7474 | Libre ✅ |
| Neo4j Bolt | **7688** | 7687 | Libre ✅ |
| Redis | **6380** | 6379 | Libre ✅ |
| RabbitMQ AMQP | **5673** | 5672 | Libre ✅ |
| RabbitMQ Management | **15673** | 15672 | Libre ✅ |

**Note** : Ces ports ont été choisis pour éviter les conflits avec :
- TravelLab (3004, 9002/9003)
- Portfolio (3003, 80, 443)
- ColisGo (3000, 9000/9001)
- CashEase (3002)
- Prestige (3001)
- Fedora (4002-4004)
- Ghomala-Translate (3005)

## Configuration SSH

Ajouter dans `~/.ssh/config` :

```sshconfig
Host seazone
    HostName 51.254.137.22
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Connexion :
```bash
ssh seazone
```

## Déploiement Initial

### 1. Connexion au VPS

```bash
ssh seazone
cd /home/deploy
```

### 2. Vérifier les Ports Disponibles

```bash
# Lister tous les ports en écoute
ss -ltnH | awk '{print $4}' | sed -E 's/.*:([0-9]+)$/\1/' | sort -n | uniq

# Vérifier que 3006 est libre
ss -ltn | grep :3006
# Doit retourner vide
```

### 3. Cloner le Repository

```bash
git clone https://github.com/emeric-cyrille/sonah.git
cd sonah
```

### 4. Configuration de Production

```bash
# Copier le fichier d'environnement
cp .env.production.example .env.production

# Éditer avec les vraies valeurs
nano .env.production
```

**Variables critiques** :
```env
# Base de données (port interne 5432, externe 5433)
DATABASE_URL="postgresql://sonah_user:STRONG_PASSWORD@localhost:5433/sonah_prod"

# Neo4j
NEO4J_PASSWORD="STRONG_NEO4J_PASSWORD"

# Redis
REDIS_PASSWORD="STRONG_REDIS_PASSWORD"

# RabbitMQ
RABBITMQ_USER="sonah_admin"
RABBITMQ_PASSWORD="STRONG_RABBITMQ_PASSWORD"

# OpenAI
OPENAI_API_KEY="sk-proj-VOTRE_CLE"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"

# CORS
CORS_ORIGIN="https://sonah.fokamemeric.com"
```

Générer un secret JWT :
```bash
openssl rand -base64 32
```

### 5. Build et Démarrage

```bash
# Build les images
docker compose -f docker-compose.prod.yml build

# Démarrer les services
docker compose up -d

# Vérifier les logs
docker compose logs -f
```

### 6. Initialiser la Base de Données

```bash
# Attendre que les services soient prêts (20-30 secondes)
sleep 30

# Appliquer les migrations Prisma
docker compose exec api pnpm prisma migrate deploy

# Vérifier la connexion
docker compose exec api pnpm prisma db push
```

### 7. Test Local

```bash
# Test API
curl http://127.0.0.1:3006/api/v1/health

# Devrait retourner :
# {"status":"healthy","timestamp":"...","services":{...}}
```

## Configuration Traefik (HTTPS)

### 1. Configurer DNS

Ajouter chez votre registrar DNS :

```
Type    Nom              Valeur              TTL
A       api.sonah        51.254.137.22       3600
```

Vérifier :
```bash
dig api.sonah.fokamemeric.com +short
# Doit retourner : 51.254.137.22
```

### 2. Copier la Route Traefik

**IMPORTANT** : Faire une backup avant toute modification !

```bash
# Se connecter au VPS
ssh seazone

# Backup de la config Traefik existante
cd /home/deploy/portfolio/traefik/dynamic
cp routes.yml routes.yml.bak-$(date +%Y%m%d-%H%M%S)

# Copier la route SONAH
# Depuis votre machine locale :
scp -P 2222 traefik/dynamic/sonah.yml deploy@51.254.137.22:/home/deploy/portfolio/traefik/dynamic/

# Sur le VPS, vérifier que Traefik a rechargé
docker logs --tail=50 portfolio-traefik | grep sonah
```

### 3. Vérifier HTTPS

```bash
# Test depuis l'extérieur
curl https://api.sonah.fokamemeric.com/api/v1/health

# Vérifier le certificat SSL
echo | openssl s_client -servername api.sonah.fokamemeric.com -connect 51.254.137.22:443 2>/dev/null | openssl x509 -noout -dates
```

## Mises à Jour

### Déploiement de Nouvelles Versions

```bash
ssh seazone
cd /home/deploy/sonah

# Pull les modifications
git pull origin main

# Rebuild et redémarrer
docker compose build
docker compose up -d

# Appliquer migrations si nécessaire
docker compose exec api pnpm prisma migrate deploy

# Vérifier
docker compose ps
curl http://127.0.0.1:3006/api/v1/health
```

### Script de Déploiement Automatique

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement SONAH..."

cd /home/deploy/sonah

# Backup DB
echo "💾 Backup base de données..."
docker compose exec -T postgres pg_dump -U sonah_user sonah_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Pull
echo "📥 Pull modifications..."
git pull origin main

# Build
echo "🔨 Build images..."
docker compose build

# Restart
echo "🔄 Redémarrage services..."
docker compose down
docker compose up -d

# Wait
sleep 15

# Migrations
echo "🗃️ Migrations..."
docker compose exec -T api pnpm prisma migrate deploy

# Health check
echo "🏥 Vérification..."
if curl -f http://127.0.0.1:3006/api/v1/health > /dev/null 2>&1; then
    echo "✅ API OK"
else
    echo "❌ API ERREUR"
    docker compose logs --tail=50 api
    exit 1
fi

echo "✅ Déploiement terminé"
```

Sauvegarder dans `/home/deploy/sonah/deploy.sh` et rendre exécutable :
```bash
chmod +x deploy.sh
```

## Monitoring

### Logs

```bash
# Tous les services
docker compose logs -f

# Service spécifique
docker compose logs -f api
docker compose logs -f postgres

# Dernières 100 lignes
docker compose logs --tail=100
```

### Ressources

```bash
# État des conteneurs
docker compose ps

# Utilisation CPU/RAM
docker stats sonah-api sonah-postgres sonah-neo4j

# Espace disque
df -h /
```

### Santé des Services

```bash
# API
curl http://127.0.0.1:3006/api/v1/health

# PostgreSQL
docker compose exec postgres pg_isready -U sonah_user

# Neo4j
docker compose exec neo4j wget -q --spider http://localhost:7474 && echo "Neo4j OK"

# Redis
docker compose exec redis redis-cli ping
```

## Sauvegardes

### Base de Données PostgreSQL

```bash
# Backup
docker compose exec postgres pg_dump -U sonah_user sonah_prod > sonah-backup-$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U sonah_user sonah_prod < sonah-backup-20261021.sql

# Automatiser avec cron
crontab -e
# Ajouter :
0 2 * * * cd /home/deploy/sonah && docker compose exec -T postgres pg_dump -U sonah_user sonah_prod > backups/sonah-$(date +\%Y\%m\%d).sql
```

### Neo4j

```bash
# Backup
docker compose exec neo4j neo4j-admin database dump neo4j --to-path=/data/dumps

# Restore
docker compose exec neo4j neo4j-admin database load neo4j --from-path=/data/dumps
```

## Sécurité

### Ports Exposés

**Depuis l'extérieur (via Traefik)** :
- `api.sonah.fokamemeric.com` → Port 3006 (API)

**Depuis le VPS uniquement** :
- `127.0.0.1:5433` → PostgreSQL
- `127.0.0.1:7475/7688` → Neo4j
- `127.0.0.1:6380` → Redis
- `127.0.0.1:5673/15673` → RabbitMQ

**Ne JAMAIS exposer** :
- PostgreSQL, Neo4j, Redis, RabbitMQ directement sur Internet

### Vérifier le Pare-feu

```bash
# Lister les règles
sudo ufw status

# Les ports 80, 443, 2222 devraient être ouverts
# Les autres ports (3006, 5433, etc.) doivent être fermés de l'extérieur
```

## Troubleshooting

### Service ne démarre pas

```bash
# Logs détaillés
docker compose logs [service]

# Vérifier la configuration
docker compose config

# Redémarrer un service
docker compose restart api
```

### Port déjà utilisé

```bash
# Vérifier quel processus utilise le port
sudo lsof -i :3006

# Ou
ss -ltnp | grep :3006
```

### Base de données inaccessible

```bash
# Vérifier PostgreSQL
docker compose exec postgres psql -U sonah_user -d sonah_prod -c "SELECT 1"

# Recréer les tables
docker compose exec api pnpm prisma db push --force-reset
```

### Mémoire insuffisante

```bash
# Vérifier l'utilisation
free -h

# Réduire les limites dans docker-compose.prod.yml
# Déjà configuré avec mem_limit pour chaque service
```

## Règles Importantes (Serveur Partagé)

1. **NE JAMAIS** :
   - Redémarrer Traefik (`portfolio-traefik`)
   - Toucher aux autres projets
   - Utiliser `docker system prune`
   - Modifier le pare-feu sans autorisation
   - Exposer les ports 80/443

2. **TOUJOURS** :
   - Vérifier les ports disponibles avant déploiement
   - Faire des backups avant modification
   - Limiter la mémoire des conteneurs (`mem_limit`)
   - Surveiller l'utilisation des ressources
   - Demander avant modification de Traefik

3. **LECTURE D'ABORD** :
   - Utiliser des commandes en lecture seule
   - Vérifier les logs avant action
   - Comprendre l'état actuel avant modification

## Contact

En cas de problème : fokamemeric@gmail.com
