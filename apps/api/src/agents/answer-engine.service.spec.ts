import { TraceRecorder } from '../audit/trace-recorder';
import { CONSTITUTION_ART6, LABOUR_ARTICLE, makeResult } from '../testing/fixtures';
import { fakeVectorStore, RecordingModel } from '../testing/fakes';
import { getAgent } from './agent-registry';
import { AnswerEngine } from './answer-engine.service';
import { MemoryCorpusCatalog } from './corpus-catalog';

const TELECOM = makeResult({
  id: 'doc-telecom',
  sourceId: 'loi-2010-013-communications-electroniques',
  reference: 'Article 1',
  content: 'La présente loi régit les communications électroniques au Cameroun.',
  metadata: { shortTitle: 'Loi sur les communications électroniques' },
});

function engineWith(results = [LABOUR_ARTICLE, TELECOM], corpus = results) {
  const { store, calls } = fakeVectorStore(results);
  const engine = new AnswerEngine(store, new MemoryCorpusCatalog(corpus), null);
  return { engine, calls };
}

describe('AnswerEngine', () => {
  it('limite la recherche aux sources de l’agent quand le corpus les contient', async () => {
    const { engine, calls } = engineWith();
    const recorder = new TraceRecorder();
    const outcome = await engine.answer({
      agent: getAgent('regulator-minpostel'),
      question: 'Quelles obligations pour les opérateurs ?',
      language: 'fr',
      recorder,
    });
    expect(calls[0]?.sourceIds).toEqual(['loi-2010-013-communications-electroniques']);
    expect(outcome.citations.map((c) => c.sourceId)).toEqual([
      'loi-2010-013-communications-electroniques',
    ]);
    expect(recorder.recordedSteps[0]?.data.scope).toBe('agent_sources');
  });

  it('se replie sur tout le corpus si les sources de l’agent ne sont pas indexées', async () => {
    const { engine, calls } = engineWith([LABOUR_ARTICLE]);
    const recorder = new TraceRecorder();
    await engine.answer({
      agent: getAgent('data-protection-authority'),
      question: 'Quelles règles pour les données personnelles ?',
      language: 'fr',
      recorder,
    });
    expect(calls[0]?.sourceIds).toBeUndefined();
    expect(recorder.recordedSteps[0]?.data.scope).toBe('fallback_all_sources');
  });

  it('épingle un article et applique le statut connu du scénario', async () => {
    const original = makeResult({ ...CONSTITUTION_ART6, metadata: { shortTitle: 'Constitution' } });
    const { engine } = engineWith([LABOUR_ARTICLE], [LABOUR_ARTICLE, original]);
    const recorder = new TraceRecorder();
    const outcome = await engine.answer({
      agent: getAgent('sonah'),
      question: 'Combien de mandats pour le Président de la République ?',
      language: 'fr',
      recorder,
      pinned: [{ sourceId: 'constitution-1996', reference: 'Article 6' }],
      statusOverlay: [
        {
          sourceId: 'constitution-1996',
          reference: 'Article 6',
          status: 'amended',
          amendedBy: 'loi n° 2008-1',
        },
      ],
    });
    expect(outcome.evidence[0]?.id).toBe(CONSTITUTION_ART6.id);
    expect(outcome.verdict).toBe('OUTDATED_TEXT');
    const retrieval = recorder.recordedSteps[0]?.data as { pinnedByScenario: string[] };
    expect(retrieval.pinnedByScenario).toEqual([CONSTITUTION_ART6.id]);
  });

  it('panne simulée : le modèle n’est pas appelé, repli extractif tracé', async () => {
    const { store } = fakeVectorStore([LABOUR_ARTICLE]);
    const model = new RecordingModel();
    const engine = new AnswerEngine(store, new MemoryCorpusCatalog([LABOUR_ARTICLE]), model);
    const recorder = new TraceRecorder();
    const outcome = await engine.answer({
      agent: getAgent('sonah'),
      question: 'Le travail forcé est-il autorisé ?',
      language: 'fr',
      recorder,
      simulateModelOutage: true,
    });
    expect(model.calls).toHaveLength(0);
    expect(outcome.usedFallback).toBe(true);
    expect(outcome.model).toBe('extractive');
    expect(recorder.recordedSteps.map((s) => s.type)).toEqual([
      'retrieval',
      'fallback',
      'gate',
      'agent',
    ]);
  });

  it('résume le raisonnement de l’agent (preuves, règle, décision)', async () => {
    const { engine } = engineWith([LABOUR_ARTICLE]);
    const recorder = new TraceRecorder();
    await engine.answer({
      agent: getAgent('legal-adviser'),
      question: 'Is forced labour legal?',
      language: 'en',
      recorder,
    });
    const agentStep = recorder.recordedSteps.find((s) => s.type === 'agent');
    expect(agentStep?.summary).toContain('rule applied: answered:cited');
    expect(agentStep?.data).toMatchObject({
      evidenceCited: [1],
      ruleApplied: 'answered:cited',
      decision: 'ANSWERED_WITH_CITATIONS',
    });
  });
});
