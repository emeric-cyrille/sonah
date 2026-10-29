import { ConflictException, NotFoundException } from '@nestjs/common';
import { CONSTITUTION_ART6, LABOUR_ARTICLE, makeResult } from '../testing/fixtures';
import { createHarness, RecordingModel } from '../testing/fakes';
import { SCENARIOS } from './scenario-definitions';
import { ScenarioEngine } from './scenario-engine.service';
import { MemoryScenarioRunRepository } from './scenario-run.repository';

const ORIGINAL_ART6 = makeResult({
  ...CONSTITUTION_ART6,
  metadata: { shortTitle: 'Constitution' },
});
const WORKING_TIME = makeResult({
  id: 'doc-travail-80',
  reference: 'Article 80',
  content:
    '1) Dans tous les établissements publics ou privés non agricoles, la durée de travail ne peut excéder quarante heures par semaine.',
});

function setup(model: RecordingModel | null = null) {
  const harness = createHarness([LABOUR_ARTICLE, WORKING_TIME, ORIGINAL_ART6], model);
  const repository = new MemoryScenarioRunRepository();
  const engine = new ScenarioEngine(repository, harness.engine, harness.audit);
  return { ...harness, repository, scenarios: engine };
}

describe('ScenarioEngine', () => {
  it('définit 4 scénarios de 3 étapes, avec des lacunes sourcées', () => {
    expect(SCENARIOS).toHaveLength(6);
    for (const scenario of SCENARIOS) {
      expect(scenario.steps.length).toBeGreaterThanOrEqual(3);
      expect(scenario.steps.length).toBeLessThanOrEqual(4);
      const gaps = scenario.steps.flatMap((s) => s.gaps ?? []);
      expect(gaps.length).toBeGreaterThan(0);
      for (const gap of gaps) expect(gap.sources.length).toBeGreaterThan(0);
    }
  });

  it('publie les étapes une par une, jamais toutes à la fois', async () => {
    const { scenarios } = setup();
    const { runId, totalSteps } = await scenarios.start('outdated-law', 'en');
    expect(totalSteps).toBe(3);
    expect((await scenarios.get(runId)).steps).toHaveLength(0);

    const first = await scenarios.next(runId);
    expect(first).toMatchObject({ step: 1, totalSteps: 3, done: false, gaps: [] });
    expect(first.event.title).toBe('A citizen asks Sonah about the presidential term');
    expect((await scenarios.get(runId)).steps).toHaveLength(1);

    const second = await scenarios.next(runId);
    expect(second.step).toBe(2);
    const third = await scenarios.next(runId);
    expect(third).toMatchObject({ step: 3, done: true });
    expect(third.gaps[0]?.id).toBe('consolidated-legal-texts');

    const run = await scenarios.get(runId);
    expect(run.status).toBe('COMPLETED');
    expect(run.steps.map((s) => s.step)).toEqual([1, 2, 3]);
    await expect(scenarios.next(runId)).rejects.toBeInstanceOf(ConflictException);
  });

  it('S1 : le texte périmé est détecté, le coordinateur escalade', async () => {
    const { scenarios, audit } = setup();
    const { runId } = await scenarios.start('outdated-law', 'fr');
    const first = await scenarios.next(runId);
    const sonah = first.responses[0];
    expect(sonah?.agentId).toBe('sonah');
    expect(sonah?.verdict).toBe('OUTDATED_TEXT');
    expect(sonah?.citations.find((c) => c.reference === 'Article 6')?.status).toBe('amended');

    const second = await scenarios.next(runId);
    expect(second.responses.map((r) => r.agentId)).toEqual(['legal-adviser', 'coordinator']);
    expect(second.responses[1]?.message).toContain('escalade vers un agent humain');

    const trace = await audit.get(sonah?.traceId ?? '');
    expect(trace).toMatchObject({ kind: 'scenario', scenarioRunId: runId, agentId: 'sonah' });
  });

  it('S2 : les données personnelles sont masquées dans les réponses, les traces et le modèle', async () => {
    const model = new RecordingModel(
      '« la durée de travail ne peut excéder quarante heures par semaine » [1]',
    );
    const { scenarios, traces } = setup(model);
    const { runId } = await scenarios.start('personal-data-in-chat', 'fr');
    const first = await scenarios.next(runId);
    expect(first.responses[0]?.message).toContain('j’ai masqué les données personnelles');
    const everything = JSON.stringify({ traces: traces.records, calls: model.calls, first });
    expect(everything).not.toContain('112233445');
    expect(everything).not.toContain('paul.ndi@example.cm');
    expect(everything).not.toContain('699 12 34 56');
    expect(traces.records[0]?.steps[0]?.data.piiMasked).toEqual({
      email: 1,
      phone: 1,
      id_number: 1,
    });

    const second = await scenarios.next(runId);
    expect(second.responses.map((r) => r.agentId)).toEqual([
      'data-protection-authority',
      'legal-adviser',
      'coordinator',
    ]);
  });

  it('S3 : pendant la panne, aucune requête au modèle et repli tracé', async () => {
    const model = new RecordingModel();
    const { scenarios, audit } = setup(model);
    const { runId } = await scenarios.start('llm-outage', 'en');
    const first = await scenarios.next(runId);
    expect(model.calls).toHaveLength(0);
    expect(first.responses[0]?.verdict).toBe('ANSWERED_WITH_CITATIONS');
    const trace = await audit.get(first.responses[0]?.traceId ?? '');
    expect(trace?.steps.some((s) => s.type === 'fallback')).toBe(true);
  });

  it('S4 : la contradiction entre institutions est détectée et escaladée', async () => {
    const { scenarios, audit } = setup();
    const { runId } = await scenarios.start('conflicting-requirements', 'en');
    await scenarios.next(runId);
    const second = await scenarios.next(runId);
    const coordinator = second.responses.find((r) => r.agentId === 'coordinator');
    expect(coordinator?.verdict).toBe('CONFLICT_BETWEEN_TEXTS');
    expect(coordinator?.message).toContain('Contradictions detected:');
    expect(coordinator?.message).toContain('Decision: escalate to a human officer');
    const trace = await audit.get(coordinator?.traceId ?? '');
    expect(trace?.steps.map((s) => s.type)).toEqual([
      'coordination',
      'coordination',
      'coordination',
      'output',
    ]);
    const third = await scenarios.next(runId);
    expect(third.gaps[0]?.id).toBe('single-procedure-registry');
  });

  it('chaque réponse d’agent est tracée et la chaîne reste valide', async () => {
    const { scenarios, audit } = setup();
    const { runId } = await scenarios.start('conflicting-requirements', 'fr');
    const released = [
      await scenarios.next(runId),
      await scenarios.next(runId),
      await scenarios.next(runId),
    ];
    const traceIds = released.flatMap((s) => s.responses.map((r) => r.traceId));
    expect(new Set(traceIds).size).toBe(traceIds.length);
    const listed = await audit.list({ scenarioRunId: runId, limit: 100 });
    expect(listed).toHaveLength(traceIds.length);
    expect((await audit.verify()).valid).toBe(true);
  });

  it('refuse un scénario inconnu, une exécution inconnue et une double publication simultanée', async () => {
    const { scenarios } = setup();
    await expect(scenarios.start('inconnu', 'fr')).rejects.toBeInstanceOf(NotFoundException);
    await expect(scenarios.next('00000000-0000-4000-8000-000000000000')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    const { runId } = await scenarios.start('llm-outage', 'fr');
    const results = await Promise.allSettled([scenarios.next(runId), scenarios.next(runId)]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect((await scenarios.get(runId)).currentStep).toBe(1);
  });
});
