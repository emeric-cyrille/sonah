import type { Driver } from 'neo4j-driver';
import { GraphStoreService, type RelationType } from './graph-store.service';

/** Pilote factice : enregistre les requêtes exécutées. */
function fakeDriver(): { driver: Driver; queries: Array<{ query: string; params: unknown }> } {
  const queries: Array<{ query: string; params: unknown }> = [];
  const tx = {
    run: async (query: string, params: unknown) => {
      queries.push({ query, params });
      return { records: [] };
    },
  };
  const session = {
    executeWrite: async (work: (t: typeof tx) => Promise<unknown>) => work(tx),
    executeRead: async (work: (t: typeof tx) => Promise<unknown>) => work(tx),
    run: tx.run,
    close: async () => undefined,
  };
  const driver = { session: () => session } as unknown as Driver;
  return { driver, queries };
}

const silentLogger = { log: () => undefined, warn: () => undefined, error: () => undefined };

describe('GraphStoreService', () => {
  it('crée une relation typée entre deux démarches', async () => {
    const { driver, queries } = fakeDriver();
    await new GraphStoreService(driver, silentLogger).createRelation(
      'RESTAURANT',
      'RCCM',
      'REQUIRES',
    );
    expect(queries[0]?.query).toContain('MERGE (a)-[:REQUIRES]->(b)');
    expect(queries[0]?.params).toEqual({ from: 'RESTAURANT', to: 'RCCM' });
  });

  it('refuse un type de relation hors liste blanche (injection Cypher)', async () => {
    const { driver, queries } = fakeDriver();
    const service = new GraphStoreService(driver, silentLogger);
    await expect(
      service.createRelation('A', 'B', 'REQUIRES]->(b) DETACH DELETE a //' as RelationType),
    ).rejects.toThrow('non autorisé');
    expect(queries).toHaveLength(0);
  });

  it('refuse des codes de démarche invalides et les boucles', async () => {
    const service = new GraphStoreService(fakeDriver().driver, silentLogger);
    await expect(service.createRelation("A'}) DELETE", 'B', 'REQUIRES')).rejects.toThrow();
    await expect(service.createRelation('A', 'A', 'REQUIRES')).rejects.toThrow('elle-même');
  });

  it('retourne un parcours vide entre une démarche et elle-même', async () => {
    const service = new GraphStoreService(fakeDriver().driver, silentLogger);
    await expect(service.findOptimalPath('A', 'A')).resolves.toEqual([]);
  });
});
