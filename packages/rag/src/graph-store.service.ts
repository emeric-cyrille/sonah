import neo4j, { type Driver, type ManagedTransaction } from 'neo4j-driver';
import { z } from 'zod';
import {
  consoleLogger,
  type LegalChunk,
  type LegalSource,
  type LegalStatus,
  type RagLogger,
} from './types';

/** Clé d'un nœud Article : « constitution-1996:26 », « constitution-2008-amendment:6-nouveau ». */
export function graphArticleKey(chunk: LegalChunk): string {
  return `${chunk.sourceId}:${chunk.unitId}`;
}

/**
 * Types de relations entre démarches. Neo4j n'accepte pas de type de relation paramétré :
 * la liste blanche empêche toute injection Cypher.
 */
export const RELATION_TYPES = ['REQUIRES', 'PRECEDES', 'RELATED_TO', 'GOVERNED_BY'] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_:.-]+$/, 'Code de démarche invalide');

export interface ProcedureNode {
  readonly code: string;
  readonly title: string;
  readonly authority?: string;
}

export interface Dependency extends ProcedureNode {
  /** Distance à la démarche demandée : 1 = prérequis direct. */
  readonly depth: number;
}

export interface GraphConfig {
  readonly uri: string;
  readonly user: string;
  readonly password: string;
}

/**
 * Base graphe (Neo4j) : relations entre démarches, organismes et textes officiels.
 * Sert à détecter les prérequis d'une démarche et à ordonner un parcours.
 */
export class GraphStoreService {
  constructor(
    private readonly driver: Driver,
    private readonly logger: RagLogger = consoleLogger,
  ) {}

  static connect(config: GraphConfig, logger: RagLogger = consoleLogger): GraphStoreService {
    const driver = neo4j.driver(config.uri, neo4j.auth.basic(config.user, config.password), {
      maxConnectionPoolSize: 20,
      connectionAcquisitionTimeout: 10_000,
    });
    return new GraphStoreService(driver, logger);
  }

  async verifyConnectivity(): Promise<void> {
    await this.driver.verifyConnectivity();
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  /** Contraintes d'unicité (idempotent). */
  async ensureSchema(): Promise<void> {
    const statements = [
      'CREATE CONSTRAINT procedure_code IF NOT EXISTS FOR (p:Procedure) REQUIRE p.code IS UNIQUE',
      'CREATE CONSTRAINT law_id IF NOT EXISTS FOR (l:Law) REQUIRE l.id IS UNIQUE',
      'CREATE CONSTRAINT article_key IF NOT EXISTS FOR (a:Article) REQUIRE a.key IS UNIQUE',
    ];
    const session = this.driver.session();
    try {
      for (const statement of statements) await session.run(statement);
    } finally {
      await session.close();
    }
  }

  private async write<T>(work: (tx: ManagedTransaction) => Promise<T>): Promise<T> {
    const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
      return await session.executeWrite(work);
    } finally {
      await session.close();
    }
  }

  private async read<T>(work: (tx: ManagedTransaction) => Promise<T>): Promise<T> {
    const session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      return await session.executeRead(work);
    } finally {
      await session.close();
    }
  }

  /** Crée ou met à jour une démarche. */
  async upsertProcedure(procedure: ProcedureNode): Promise<void> {
    const code = codeSchema.parse(procedure.code);
    await this.write((tx) =>
      tx.run('MERGE (p:Procedure {code: $code}) SET p.title = $title, p.authority = $authority', {
        code,
        title: procedure.title,
        authority: procedure.authority ?? null,
      }),
    );
  }

  /**
   * Crée une relation `from -[type]-> to` entre deux démarches (créées si besoin).
   * Ex. createRelation('OUVERTURE_RESTAURANT', 'IMMATRICULATION_RCCM', 'REQUIRES').
   */
  async createRelation(from: string, to: string, type: RelationType): Promise<void> {
    const fromCode = codeSchema.parse(from);
    const toCode = codeSchema.parse(to);
    if (!RELATION_TYPES.includes(type)) throw new Error(`Type de relation non autorisé : ${type}`);
    if (fromCode === toCode) throw new Error('Une démarche ne peut pas dépendre d’elle-même');

    try {
      await this.write((tx) =>
        tx.run(
          `MERGE (a:Procedure {code: $from})
           MERGE (b:Procedure {code: $to})
           MERGE (a)-[:${type}]->(b)`,
          { from: fromCode, to: toCode },
        ),
      );
    } catch (error) {
      this.logger.error(
        `Échec de la relation ${fromCode} -[${type}]-> ${toCode}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Prérequis (directs et indirects) des démarches demandées, triés pour l'exécution :
   * les plus profonds d'abord. Les démarches demandées elles-mêmes sont exclues.
   */
  async getDependencies(procedures: readonly string[]): Promise<Dependency[]> {
    const codes = z.array(codeSchema).min(1).max(50).parse(procedures);
    const records = await this.read(async (tx) => {
      const result = await tx.run(
        `MATCH path = (p:Procedure)-[:REQUIRES*1..10]->(d:Procedure)
         WHERE p.code IN $codes AND NOT d.code IN $codes
         WITH d, max(length(path)) AS depth
         RETURN d.code AS code, d.title AS title, d.authority AS authority, depth
         ORDER BY depth DESC, code ASC`,
        { codes },
      );
      return result.records;
    });

    return records.map((record) => ({
      code: record.get('code') as string,
      title: (record.get('title') as string | null) ?? (record.get('code') as string),
      authority: (record.get('authority') as string | null) ?? undefined,
      depth: neo4j.integer.toNumber(record.get('depth')),
    }));
  }

  /**
   * Parcours le plus court entre deux démarches, dans le sens d'exécution :
   * A -[PRECEDES]-> B se parcourt de A vers B ; A -[REQUIRES]-> B signifie que B vient avant A,
   * il se parcourt donc de B vers A. Retourne [] s'il n'existe pas de chemin.
   */
  async findOptimalPath(start: string, end: string): Promise<ProcedureNode[]> {
    const startCode = codeSchema.parse(start);
    const endCode = codeSchema.parse(end);
    if (startCode === endCode) return [];

    const records = await this.read(async (tx) => {
      const result = await tx.run(
        `MATCH (a:Procedure {code: $start}), (b:Procedure {code: $end})
         MATCH path = shortestPath((a)-[:PRECEDES|REQUIRES*..15]-(b))
         WHERE all(i IN range(0, length(path) - 1) WHERE
           CASE type(relationships(path)[i])
             WHEN 'PRECEDES' THEN startNode(relationships(path)[i]) = nodes(path)[i]
             ELSE endNode(relationships(path)[i]) = nodes(path)[i]
           END)
         RETURN [n IN nodes(path) | {code: n.code, title: n.title, authority: n.authority}] AS steps`,
        { start: startCode, end: endCode },
      );
      return result.records;
    });

    const steps = records[0]?.get('steps') as
      Array<{ code: string; title: string | null; authority: string | null }> | undefined;
    return (steps ?? []).map((step) => ({
      code: step.code,
      title: step.title ?? step.code,
      authority: step.authority ?? undefined,
    }));
  }

  /**
   * Enregistre la structure d'un texte : (Law)-[:CONTAINS]->(Article), avec le statut de chaque unité.
   * Les unités qui ne figurent plus dans le texte (redécoupage) sont supprimées.
   */
  async upsertLegalStructure(
    source: LegalSource,
    chunks: readonly LegalChunk[],
    statusOf: (chunk: LegalChunk) => LegalStatus = () => 'in_force',
  ): Promise<number> {
    const articles = chunks
      .filter((chunk) => chunk.part === 1)
      .map((chunk) => ({
        key: graphArticleKey(chunk),
        reference: chunk.reference,
        number: chunk.articleNumber ?? null,
        path: [...chunk.path],
        status: statusOf(chunk),
      }));

    await this.write(async (tx) => {
      await tx.run(
        `MERGE (l:Law {id: $id})
         SET l.title = $title, l.shortTitle = $shortTitle, l.url = $url, l.docId = $docId,
             l.version = $version, l.date = $date, l.binding = $binding, l.type = $type
         WITH l
         UNWIND $articles AS article
         MERGE (a:Article {key: article.key})
         SET a.reference = article.reference, a.number = article.number, a.path = article.path,
             a.status = article.status
         MERGE (l)-[:CONTAINS]->(a)`,
        {
          id: source.id,
          title: source.title,
          shortTitle: source.shortTitle,
          url: source.url,
          docId: source.docId,
          version: source.version,
          date: source.date,
          binding: source.binding,
          type: source.type,
          articles,
        },
      );
      await tx.run(
        `MATCH (:Law {id: $id})-[:CONTAINS]->(a:Article)
         WHERE NOT a.key IN $keys
         DETACH DELETE a`,
        { id: source.id, keys: articles.map((article) => article.key) },
      );
    });
    return articles.length;
  }

  /** Relie chaque nouvelle rédaction à l'article qu'elle modifie : (nouveau)-[:AMENDS]->(ancien). */
  async linkAmendments(pairs: ReadonlyArray<readonly [string, string]>): Promise<void> {
    await this.write((tx) =>
      tx.run(
        `UNWIND $pairs AS pair
         MATCH (n:Article {key: pair[0]}), (o:Article {key: pair[1]})
         MERGE (n)-[:AMENDS]->(o)`,
        { pairs: pairs.map(([newer, older]) => [newer, older]) },
      ),
    );
  }

  /** Supprime les démarches dont le code commence par `prefix` (utilisé par les tests). */
  async deleteProceduresByPrefix(prefix: string): Promise<void> {
    const safePrefix = codeSchema.parse(prefix);
    await this.write((tx) =>
      tx.run('MATCH (p:Procedure) WHERE p.code STARTS WITH $prefix DETACH DELETE p', {
        prefix: safePrefix,
      }),
    );
  }
}
