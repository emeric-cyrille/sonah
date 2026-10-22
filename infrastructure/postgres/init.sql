-- Active pgvector dans la base créée par POSTGRES_DB (sonah en dev, sonah_prod en production).
-- Le schéma lui-même est créé par les migrations Prisma (packages/database/prisma/migrations).
CREATE EXTENSION IF NOT EXISTS vector;
