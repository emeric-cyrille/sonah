import { TraceRecorder } from '../audit/trace-recorder';
import { CONSTITUTION_ART6, LABOUR_ARTICLE, makeResult } from '../testing/fixtures';
import { FailingModel, fakeVectorStore, RecordingModel } from '../testing/fakes';
import { getAgent } from './agent-registry';
import { AnswerEngine, CONTEXT_SIZE } from './answer-engine.service';
import { EXCERPT_CHAR_LIMIT, estimateTokens, PROMPT_TOKEN_BUDGET } from '../chat/sonah-prompt';
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
  it('Sonah et le conseiller juridique ne consultent que les textes contraignants', async () => {
    for (const id of ['sonah', 'legal-adviser'] as const) {
      const { engine, calls } = engineWith();
      const recorder = new TraceRecorder();
      await engine.answer({
        agent: getAgent(id),
        question: 'Le travail forcé est-il autorisé ?',
        language: 'fr',
        recorder,
      });
      expect(calls[0]?.types).toEqual(['CONSTITUTION', 'LAW', 'DECREE']);
      expect(calls[0]?.sourceIds).toBeUndefined();
      expect(recorder.recordedSteps[0]?.data.scope).toBe('binding_texts');
    }
    // Les institutions gardent leurs sources déclarées, sans filtre de type
    const { engine, calls } = engineWith();
    await engine.answer({
      agent: getAgent('regulator-minpostel'),
      question: 'Quelles obligations pour les opérateurs ?',
      language: 'fr',
      recorder: new TraceRecorder(),
    });
    expect(calls[0]?.types).toBeUndefined();
  });

  it('question hors sujet : ni recherche ni modèle, réponse immédiate', async () => {
    const { store, calls } = fakeVectorStore([LABOUR_ARTICLE]);
    const model = new RecordingModel();
    const engine = new AnswerEngine(store, new MemoryCorpusCatalog([LABOUR_ARTICLE]), model);
    const recorder = new TraceRecorder();
    const outcome = await engine.answer({
      agent: getAgent('sonah'),
      question: 'Donne-moi une recette de ndolé',
      language: 'fr',
      recorder,
    });
    expect(calls).toHaveLength(0);
    expect(model.calls).toHaveLength(0);
    expect(outcome.verdict).toBe('OUT_OF_SCOPE');
    expect(recorder.recordedSteps[0]?.data).toMatchObject({ skipped: true, offTopic: 'cooking' });
  });

  it('aucun extrait au-dessus du seuil : le modèle n’est pas appelé', async () => {
    const weak = makeResult({ score: 0.01 });
    const { store } = fakeVectorStore([weak]);
    const model = new FailingModel();
    const engine = new AnswerEngine(store, new MemoryCorpusCatalog([weak]), model);
    const outcome = await engine.answer({
      agent: getAgent('sonah'),
      question: 'Quel est le délai pour contester une amende fiscale ?',
      language: 'fr',
      recorder: new TraceRecorder(),
    });
    expect(model.calls).toBe(0);
    expect(outcome.verdict).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('prompt compact : extraits tronqués, contrôle mot pour mot sur l’extrait complet', async () => {
    const filler = 'Les dispositions du présent article sont applicables à tous les travailleurs. ';
    const tail = 'Le salaire est payé à intervalles réguliers ne pouvant excéder un mois.';
    const long = makeResult({
      id: 'doc-long',
      reference: 'Article 68',
      content: `${filler.repeat(30)}${tail}`,
    });
    const results = Array.from({ length: 8 }, (_, i) =>
      makeResult({ ...long, id: `doc-long-${i}`, reference: `Article ${60 + i}` }),
    );
    const { store } = fakeVectorStore(results);
    // Le modèle cite mot pour mot une phrase absente de l'extrait abrégé, mais présente dans le texte complet
    const model = new RecordingModel(`Oui : « ${tail} » [1].`);
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: 'Une réponse précédente très longue. '.repeat(60),
    }));
    const engine = new AnswerEngine(store, new MemoryCorpusCatalog(results), model);
    const outcome = await engine.answer({
      agent: getAgent('sonah'),
      question: 'Le salaire doit-il être payé chaque mois ?',
      language: 'fr',
      recorder: new TraceRecorder(),
      history,
    });
    const turns = model.calls[0] ?? [];
    const context = turns[1]?.content ?? '';
    expect(context.match(/^\[\d+\]/gm)).toHaveLength(CONTEXT_SIZE);
    expect(context).toContain('[…]');
    expect(context).not.toContain(tail);
    for (const block of context.split(/\n\n(?=\[\d+\])/).slice(1)) {
      expect(block.length).toBeLessThan(EXCERPT_CHAR_LIMIT + 200);
    }
    const chars = turns.reduce((sum, turn) => sum + turn.content.length, 0);
    expect(estimateTokens(chars)).toBeLessThanOrEqual(PROMPT_TOKEN_BUDGET);
    expect(outcome.gate.draftAccepted).toBe(true);
    expect(outcome.evidence[0]?.content).toContain(tail);
  });
});
