import type { LegalChunk, LegalSource, LegalStatus } from '../types';

/** Statut d'un fragment, calculé à partir des textes modificatifs et abrogatifs du manifeste. */
export interface ChunkStatus {
  readonly status: LegalStatus;
  /** Unité qui remplace celle-ci (« <source>:art-<n>-nouveau »), la plus proche dans le temps. */
  readonly amendedBy?: string;
  /** Intitulé lisible de la modification (« Loi n° 2008/001 du 14 avril 2008, Article 6 (nouveau) »). */
  readonly amendedByLabel?: string;
  /** Toutes les rédactions ultérieures, de la plus ancienne à la plus récente. */
  readonly amendmentHistory?: readonly string[];
  /** Rédaction en vigueur (dernière de la lignée) : celle à citer. */
  readonly currentVersion?: string;
  /** Alinéas modifiés par le texte suivant (vide : non précisé, ou article entièrement réécrit). */
  readonly amendedParagraphs?: readonly string[];
  /** Pour une nouvelle rédaction : unité du texte de base qu'elle modifie (« <source>:art-<n> »). */
  readonly amends?: string;
  readonly repealedBy?: string;
}

interface Version {
  readonly unitKey: string;
  readonly date: string;
  readonly label: string;
  readonly paragraphs: readonly string[];
}

/** Clé d'une unité (fragment sans son numéro de partie) : « constitution-1996:art-6 ». */
export function unitKeyOf(chunk: LegalChunk): string {
  return chunk.key.replace(/:\d+$/, '');
}

/**
 * Calcule le statut de chaque fragment (clé → statut) :
 * - un article modifié par un texte ultérieur est « amended », avec un renvoi vers la nouvelle rédaction ;
 * - une nouvelle rédaction elle-même modifiée plus tard (ex. art. 6 de 2008 réécrit en 2026) aussi ;
 * - la rédaction la plus récente est « in_force » ;
 * - les articles d'un texte abrogé sont « repealed ».
 * Lève une erreur si un article déclaré modifié est introuvable : cela signale un défaut de découpage.
 */
export function computeLegalStatuses(
  sources: readonly LegalSource[],
  chunksBySource: ReadonlyMap<string, readonly LegalChunk[]>,
): Map<string, ChunkStatus> {
  const statuses = new Map<string, ChunkStatus>();
  const byId = new Map(sources.map((source) => [source.id, source]));
  const unitsOf = (sourceId: string): Set<string> =>
    new Set((chunksBySource.get(sourceId) ?? []).map(unitKeyOf));

  // Lignée de chaque article modifié : texte de base puis rédactions successives
  const lineages = new Map<string, Version[]>();
  for (const amender of sources) {
    if (!amender.amends || !chunksBySource.has(amender.id)) continue;
    const base = byId.get(amender.amends.sourceId);
    if (!base || !chunksBySource.has(base.id)) continue;
    const amenderUnits = unitsOf(amender.id);
    const baseUnits = unitsOf(base.id);

    for (const [article, paragraphs] of Object.entries(amender.amends.articles)) {
      const slug = article.replace(/\s+/g, '-');
      const newUnit = `${amender.id}:art-${slug}-nouveau`;
      const baseUnit = `${base.id}:art-${slug}`;
      if (!amenderUnits.has(newUnit)) {
        throw new Error(`${amender.id} : nouvelle rédaction de l'article ${article} introuvable`);
      }
      if (!baseUnits.has(baseUnit)) {
        throw new Error(`${base.id} : article ${article} (modifié par ${amender.id}) introuvable`);
      }
      const lineageKey = `${base.id}:${article}`;
      const lineage = lineages.get(lineageKey) ?? [
        {
          unitKey: baseUnit,
          date: base.date,
          label: `${base.shortTitle}, Article ${article}`,
          paragraphs: [],
        },
      ];
      lineage.push({
        unitKey: newUnit,
        date: amender.date,
        label: `${amender.shortTitle}, Article ${article} (nouveau)`,
        paragraphs,
      });
      lineages.set(lineageKey, lineage);
    }
  }

  const unitStatuses = new Map<string, ChunkStatus>();
  for (const lineage of lineages.values()) {
    const sorted = [...lineage].sort((a, b) => a.date.localeCompare(b.date));
    const baseUnit = sorted[0]?.unitKey;
    sorted.forEach((version, index) => {
      const next = sorted[index + 1];
      const amends = index > 0 ? baseUnit : undefined;
      unitStatuses.set(
        version.unitKey,
        next
          ? {
              status: 'amended',
              amendedBy: next.unitKey,
              amendedByLabel: next.label,
              amendmentHistory: sorted.slice(index + 1).map((later) => later.unitKey),
              currentVersion: sorted[sorted.length - 1]?.unitKey,
              amendedParagraphs: next.paragraphs,
              amends,
            }
          : { status: 'in_force', amends },
      );
    });
  }

  // Abrogations : texte entier ou articles listés
  const repealed = new Map<string, string>();
  for (const repealer of sources) {
    if (!repealer.repeals) continue;
    const articles = repealer.repeals.articles?.map((article) => article.replace(/\s+/g, '-'));
    for (const chunk of chunksBySource.get(repealer.repeals.sourceId) ?? []) {
      if (!articles || articles.includes(chunk.unitId)) repealed.set(chunk.key, repealer.id);
    }
  }

  for (const chunks of chunksBySource.values()) {
    for (const chunk of chunks) {
      const repealedBy = repealed.get(chunk.key);
      const status = unitStatuses.get(unitKeyOf(chunk)) ?? { status: 'in_force' as const };
      statuses.set(chunk.key, repealedBy ? { ...status, status: 'repealed', repealedBy } : status);
    }
  }
  return statuses;
}
