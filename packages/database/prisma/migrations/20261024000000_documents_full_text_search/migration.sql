-- Nouveaux types de documents : stratégies nationales et instruments internationaux
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'STRATEGY';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'INTERNATIONAL';

-- Recherche plein texte (hybride avec pgvector) : colonne générée, toujours à jour.
-- - référence (« Article 12 ») : configurations simple et french, poids A ;
-- - titre du texte (« Loi n° 2010/012… ») : configuration simple, poids B (numéros exacts) ;
-- - contenu : configuration french (racinisation, mots outils), poids D.
ALTER TABLE "documents" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple'::regconfig, coalesce("reference", '')), 'A') ||
    setweight(to_tsvector('french'::regconfig, coalesce("reference", '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, "title"), 'B') ||
    setweight(to_tsvector('french'::regconfig, "content"), 'D')
) STORED;

-- CreateIndex
CREATE INDEX "documents_search_vector_idx" ON "documents" USING GIN ("search_vector");
