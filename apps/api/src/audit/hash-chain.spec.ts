import { randomUUID } from 'node:crypto';
import { canonicalJson, computeTraceHash, GENESIS_HASH, verifyChain } from './hash-chain';
import { TraceRecorder } from './trace-recorder';
import { MemoryTraceStore } from './trace-store';
import type { TraceDraft, TraceRecord } from './trace.types';

function draft(overrides: Partial<TraceDraft> = {}): TraceDraft {
  const recorder = new TraceRecorder();
  recorder.add({ type: 'input', summary: 'question', data: { language: 'fr', masked: 0 } });
  recorder.add({
    type: 'retrieval',
    summary: '1 extrait',
    data: { results: [{ id: 'a', score: 0.8123, status: 'in_force' }], ignored: undefined },
    durationMs: 12.6,
  });
  return {
    id: randomUUID(),
    createdAt: new Date('2026-10-25T10:00:00.000Z'),
    kind: 'chat',
    conversationId: randomUUID(),
    scenarioRunId: null,
    agentId: 'sonah',
    verdict: 'ANSWERED_WITH_CITATIONS',
    promptVersion: 'sonah-test',
    model: 'extractive',
    steps: recorder.recordedSteps,
    ...overrides,
  };
}

describe('canonicalJson', () => {
  it('trie les clés récursivement et omet undefined', () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { z: true, y: null }], c: undefined } })).toBe(
      '{"a":{"d":[1,{"y":null,"z":true}]},"b":1}',
    );
  });

  it('est indépendant de l’ordre d’insertion des clés', () => {
    expect(canonicalJson({ x: 1, y: 2 })).toBe(canonicalJson({ y: 2, x: 1 }));
  });

  it('refuse les nombres non finis', () => {
    expect(() => canonicalJson({ score: Number.NaN })).toThrow();
  });
});

describe('chaîne de hachage', () => {
  async function chainOf(size: number): Promise<MemoryTraceStore> {
    const store = new MemoryTraceStore();
    for (let i = 0; i < size; i += 1) await store.append(draft());
    return store;
  }

  it('chaîne chaque trace à la précédente', async () => {
    const store = await chainOf(3);
    const [first, second, third] = store.records as [TraceRecord, TraceRecord, TraceRecord];
    expect(first.prevHash).toBe(GENESIS_HASH);
    expect(second.prevHash).toBe(first.hash);
    expect(third.prevHash).toBe(second.hash);
    expect(first.hash).toBe(computeTraceHash(GENESIS_HASH, first));
    expect(await store.verify()).toEqual({ valid: true, count: 3 });
  });

  it('une chaîne vide est valide', () => {
    expect(verifyChain([])).toEqual({ valid: true, count: 0 });
  });

  it('détecte la modification d’une étape', async () => {
    const store = await chainOf(3);
    const target = store.records[1] as TraceRecord;
    store.records[1] = {
      ...target,
      steps: [{ ...target.steps[0]!, summary: 'falsifié' }, ...target.steps.slice(1)],
    };
    expect(await store.verify()).toEqual({ valid: false, count: 2, brokenAt: target.id });
  });

  it('détecte la modification du verdict même si l’empreinte est recalculée', async () => {
    const store = await chainOf(3);
    const target = store.records[0] as TraceRecord;
    const forged = { ...target, verdict: 'REFER_TO_HUMAN' as const };
    store.records[0] = { ...forged, hash: computeTraceHash(forged.prevHash, forged) };
    // La trace suivante pointe toujours vers l'ancienne empreinte
    expect(await store.verify()).toEqual({
      valid: false,
      count: 2,
      brokenAt: store.records[1]?.id,
    });
  });

  it('détecte la suppression d’une trace', async () => {
    const store = await chainOf(4);
    const removed = store.records.splice(2, 1);
    expect(removed).toHaveLength(1);
    expect(await store.verify()).toMatchObject({ valid: false, brokenAt: store.records[2]?.id });
  });

  it('détecte l’inversion de deux traces', async () => {
    const store = await chainOf(3);
    const [a, b] = [store.records[0] as TraceRecord, store.records[1] as TraceRecord];
    store.records[0] = b;
    store.records[1] = a;
    expect(await store.verify()).toMatchObject({ valid: false, brokenAt: b.id });
  });

  it('le hachage est stable après passage par JSON (comme en base)', async () => {
    const store = await chainOf(1);
    const record = store.records[0] as TraceRecord;
    const reloaded = JSON.parse(JSON.stringify(record)) as TraceRecord;
    expect(
      computeTraceHash(record.prevHash, { ...reloaded, createdAt: new Date(reloaded.createdAt) }),
    ).toBe(record.hash);
  });
});
