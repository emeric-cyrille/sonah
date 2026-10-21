#!/bin/bash
set -e

echo "🚀 Déploiement SONAH en cours..."

# Pull latest changes
echo "📥 Pull des dernières modifications..."
git pull origin main

# Backup database
echo "💾 Sauvegarde de la base de données..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U sonah_user sonah_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Build images
echo "🔨 Build des images Docker..."
docker-compose -f docker-compose.prod.yml build

# Stop services
echo "⏸️  Arrêt des services..."
docker-compose -f docker-compose.prod.yml down

# Start services
echo "▶️  Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo "⏳ Attente des services..."
sleep 15

# Run migrations
echo "🗃️  Application des migrations..."
docker-compose -f docker-compose.prod.yml exec -T api pnpm prisma migrate deploy

# Health check
echo "🏥 Vérification de la santé des services..."
sleep 5

if curl -f https://api.sonah.fokamemeric.com/api/v1/health > /dev/null 2>&1; then
    echo "✅ API: OK"
else
    echo "❌ API: ERREUR"
    exit 1
fi

if curl -f https://sonah.fokamemeric.com > /dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: ERREUR"
    exit 1
fi

echo "✅ Déploiement terminé avec succès!"
