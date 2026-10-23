import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AGENTS, getAgent } from '../agents/agent-registry';
import type { AgentDefinition, AgentId, InstitutionalPosition } from '../agents/agent.types';
import { AnswerEngine } from '../agents/answer-engine.service';
import {
  describeReason,
  detectPositionConflicts,
  mergeOutcomes,
  routeEvent,
  type MergeDecision,
} from '../agents/coordinator';
import { AuditService } from '../audit/audit.service';
import { TraceRecorder } from '../audit/trace-recorder';
import { maskPii, piiNotice } from '../policy/pii';
import type { ConflictHint, Language } from '../policy/policy.types';
import { findScenario, SCENARIOS } from './scenario-definitions';
import {
  SCENARIO_RUN_REPOSITORY,
  type ScenarioRunRepository,
  type StoredRun,
  type StoredStep,
} from './scenario-run.repository';
import type {
  AgentAction,
  AgentResponse,
  CoordinateAction,
  Gap,
  ReleasedStep,
  ScenarioDefinition,
  ScenarioEvent,
  ScenarioRunView,
  ScenarioStepDefinition,
  ScenarioSummary,
} from './scenario.types';

interface StepContext {
  readonly run: StoredRun;
  readonly scenario: ScenarioDefinition;
  readonly step: number;
  readonly definition: ScenarioStepDefinition;
  readonly event: ScenarioEvent;
  readonly language: Language;
}

function summarize(scenario: ScenarioDefinition, language: Language): ScenarioSummary {
  return {
    id: scenario.id,
    title: scenario.title[language],
    description: scenario.description[language],
    totalSteps: scenario.steps.length,
    domain: scenario.domain,
  };
}

/**
 * Moteur de scénarios d'erreur : les étapes sont publiées une par une, chaque réponse d'agent
 * passe par le nœud de politique et produit une trace d'audit chaînée.
 */
@Injectable()
export class ScenarioEngine {
  private readonly logger = new Logger(ScenarioEngine.name);
  /** Exécutions dont une étape est en cours de publication (évite les doubles appels). */
  private readonly inFlight = new Set<string>();

  constructor(
    @Inject(SCENARIO_RUN_REPOSITORY) private readonly runs: ScenarioRunRepository,
    private readonly engine: AnswerEngine,
    private readonly audit: AuditService,
  ) {}

  list(language: Language): ScenarioSummary[] {
    return SCENARIOS.map((scenario) => summarize(scenario, language));
  }

  async start(
    scenarioId: string,
    language: Language,
  ): Promise<{ runId: string; scenario: ScenarioSummary; totalSteps: number }> {
    const scenario = findScenario(scenarioId);
    if (!scenario) throw new NotFoundException(`Scénario ${scenarioId} introuvable`);
    const run = await this.runs.create({
      scenarioId,
      totalSteps: scenario.steps.length,
      language,
    });
    this.logger.log(`Scénario ${scenarioId} démarré (exécution ${run.id})`);
    return { runId: run.id, scenario: summarize(scenario, language), totalSteps: run.totalSteps };
  }

  async get(runId: string): Promise<ScenarioRunView> {
    const run = await this.runs.find(runId);
    if (!run) throw new NotFoundException(`Exécution ${runId} introuvable`);
    const scenario = findScenario(run.scenarioId);
    if (!scenario) throw new NotFoundException(`Scénario ${run.scenarioId} introuvable`);
    return {
      runId: run.id,
      scenario: summarize(scenario, run.language),
      language: run.language,
      status: run.status,
      currentStep: run.currentStep,
      totalSteps: run.totalSteps,
      createdAt: run.createdAt.toISOString(),
      steps: run.steps.map((step) => this.toReleased(run, step)),
    };
  }

  /** Publie l'étape suivante : événement, réponses des agents, lacunes identifiées. */
  async next(runId: string): Promise<ReleasedStep> {
    if (this.inFlight.has(runId)) {
      throw new ConflictException('Une étape de ce scénario est déjà en cours de publication');
    }
    this.inFlight.add(runId);
    try {
      const run = await this.runs.find(runId);
      if (!run) throw new NotFoundException(`Exécution ${runId} introuvable`);
      const scenario = findScenario(run.scenarioId);
      if (!scenario) throw new NotFoundException(`Scénario ${run.scenarioId} introuvable`);
      if (run.currentStep >= run.totalSteps) {
        throw new ConflictException('Scénario terminé : toutes les étapes ont été publiées');
      }

      const step = run.currentStep + 1;
      const definition = scenario.steps[run.currentStep] as ScenarioStepDefinition;
      const language = run.language;
      const event: ScenarioEvent = {
        title: definition.title[language],
        description: definition.description[language],
        injectedAt: new Date().toISOString(),
      };
      const context: StepContext = { run, scenario, step, definition, event, language };

      const responses: AgentResponse[] = [];
      for (const action of definition.actions) {
        if (action.kind === 'agent') {
          responses.push(await this.runAgent(context, getAgent(action.agentId), action, []));
        } else {
          responses.push(...(await this.coordinate(context, action)));
        }
      }
      const gaps: Gap[] = (definition.gaps ?? []).map((gap) => ({
        id: gap.id,
        title: gap.title[language],
        description: gap.description[language],
        ...(gap.globalExample ? { globalExample: gap.globalExample[language] } : {}),
        sources: [...gap.sources],
      }));

      const done = step >= run.totalSteps;
      const stored: StoredStep = { step, event, responses, gaps };
      const appended = await this.runs.appendStep(run.id, stored, done);
      if (!appended) throw new ConflictException('Étape déjà publiée par une autre requête');
      this.logger.log(`Scénario ${scenario.id} : étape ${step}/${run.totalSteps} publiée`);
      return { runId: run.id, step, totalSteps: run.totalSteps, event, responses, gaps, done };
    } finally {
      this.inFlight.delete(runId);
    }
  }

  private toReleased(run: StoredRun, step: StoredStep): ReleasedStep {
    return {
      runId: run.id,
      step: step.step,
      totalSteps: run.totalSteps,
      event: step.event,
      responses: step.responses,
      gaps: step.gaps,
      done: step.step >= run.totalSteps,
    };
  }

  /** Un agent répond à la question de l'événement ; sa réponse est contrôlée et tracée. */
  private async runAgent(
    context: StepContext,
    agent: AgentDefinition,
    action: AgentAction | CoordinateAction,
    conflictHints: readonly ConflictHint[],
  ): Promise<AgentResponse> {
    const { language } = context;
    const recorder = new TraceRecorder();
    const pii = maskPii(action.question[language]);
    recorder.add({
      type: 'input',
      agent: agent.id,
      summary: `Étape ${context.step}/${context.run.totalSteps} — ${context.event.title}`,
      data: {
        scenarioId: context.scenario.id,
        runId: context.run.id,
        step: context.step,
        event: context.event,
        question: pii.text,
        language,
        piiMasked: pii.findings,
        simulateModelOutage: !!action.simulateModelOutage,
        conflictHints: conflictHints.map((hint) => hint.description),
      },
    });

    const outcome = await this.engine.answer({
      agent,
      question: pii.text,
      retrievalQuery: action.retrievalQuery,
      language,
      recorder,
      context: `${context.event.title}\n${context.event.description}`,
      conflictHints,
      simulateModelOutage: action.simulateModelOutage,
      pinned: action.pinned,
      statusOverlay: action.statusOverlay,
    });
    const message = pii.total > 0 ? `${piiNotice(language)}\n\n${outcome.reply}` : outcome.reply;
    recorder.add({
      type: 'output',
      agent: agent.id,
      summary: `Réponse ${outcome.verdict} avec ${outcome.citations.length} citation(s)`,
      data: {
        verdict: outcome.verdict,
        citations: outcome.citations.map((c) => ({
          index: c.index,
          documentId: c.documentId,
          status: c.status,
        })),
        writer: outcome.model,
        replyLength: message.length,
      },
    });
    await this.audit.record(recorder, {
      kind: 'scenario',
      verdict: outcome.verdict,
      scenarioRunId: context.run.id,
      agentId: agent.id,
      promptVersion: outcome.promptVersion,
      model: outcome.model,
    });
    return {
      agentId: agent.id,
      agentName: agent.name[language],
      role: agent.role,
      message,
      verdict: outcome.verdict,
      citations: outcome.citations,
      traceId: recorder.id,
    };
  }

  /** Coordination : routage par mandat, réponses des agents, contradictions, décision d'escalade. */
  private async coordinate(
    context: StepContext,
    action: CoordinateAction,
  ): Promise<AgentResponse[]> {
    const { language } = context;
    const coordinator = getAgent('coordinator');
    const recorder = new TraceRecorder();
    const question = maskPii(action.question[language]).text;

    const routing = routeEvent(
      `${context.event.title} ${context.event.description} ${question}`,
      AGENTS,
      action.agents,
    );
    recorder.add({
      type: 'coordination',
      agent: coordinator.id,
      summary: `Routage (${routing.rule}) vers ${routing.selected.map((s) => s.agentId).join(', ')}`,
      data: {
        step: context.step,
        event: context.event,
        question,
        rule: routing.rule,
        selected: routing.selected,
      },
    });

    const positions: InstitutionalPosition[] = (action.positions ?? []).map((p) => ({
      holder: p.holder[language],
      topic: p.topic,
      statement: p.statement[language],
      ...(p.precedence ? { precedence: p.precedence } : {}),
      ...(p.value ? { value: p.value } : {}),
    }));
    const conflicts = detectPositionConflicts(positions);
    if (positions.length > 0) {
      recorder.add({
        type: 'coordination',
        agent: coordinator.id,
        summary: `${positions.length} position(s) comparée(s), ${conflicts.length} contradiction(s)`,
        data: { rule: 'position-conflict-detection', positions, conflicts },
      });
    }

    const responses: AgentResponse[] = [];
    for (const routed of routing.selected) {
      responses.push(await this.runAgent(context, getAgent(routed.agentId), action, conflicts));
    }

    const decision = mergeOutcomes(
      responses.map((r) => ({ agentId: r.agentId, verdict: r.verdict })),
      conflicts,
    );
    recorder.add({
      type: 'coordination',
      agent: coordinator.id,
      summary: `Fusion : ${decision.verdict}${decision.escalate ? ', escalade vers un humain' : ''}`,
      data: {
        rule: 'escalation-to-human',
        agentVerdicts: responses.map((r) => ({
          agentId: r.agentId,
          verdict: r.verdict,
          traceId: r.traceId,
        })),
        verdict: decision.verdict,
        escalate: decision.escalate,
        reasons: decision.reasons,
      },
    });

    const message = this.coordinatorMessage(
      language,
      routing.selected.map((s) => s.agentId),
      responses,
      conflicts,
      decision,
    );
    const verdict =
      decision.escalate && decision.verdict === 'ANSWERED_WITH_CITATIONS'
        ? 'REFER_TO_HUMAN'
        : decision.verdict;
    recorder.add({
      type: 'output',
      agent: coordinator.id,
      summary: `Décision du coordinateur : ${verdict}`,
      data: { verdict, escalate: decision.escalate, replyLength: message.length },
    });
    await this.audit.record(recorder, {
      kind: 'scenario',
      verdict,
      scenarioRunId: context.run.id,
      agentId: coordinator.id,
      model: 'deterministic',
    });
    responses.push({
      agentId: coordinator.id,
      agentName: coordinator.name[language],
      role: coordinator.role,
      message,
      verdict,
      citations: [],
      traceId: recorder.id,
    });
    return responses;
  }

  private coordinatorMessage(
    language: Language,
    routed: readonly AgentId[],
    responses: readonly AgentResponse[],
    conflicts: readonly ConflictHint[],
    decision: MergeDecision,
  ): string {
    const names = routed.map((id) => getAgent(id).name[language]).join(', ');
    const verdicts = responses.map((r) => `- ${r.agentName} : ${r.verdict}`);
    if (language === 'fr') {
      return [
        `Agents consultés selon leur mandat : ${names}.`,
        'Verdicts :',
        ...verdicts,
        ...(conflicts.length > 0
          ? ['Contradictions détectées :', ...conflicts.map((c) => `- ${c.description}`)]
          : []),
        decision.escalate
          ? `Décision : escalade vers un agent humain (${decision.reasons.map((r) => describeReason(r, 'fr')).join(' ; ')}).`
          : 'Décision : réponses cohérentes et citées, pas d’escalade.',
      ].join('\n');
    }
    return [
      `Agents consulted by mandate: ${names}.`,
      'Verdicts:',
      ...verdicts.map((v) => v.replace(' : ', ': ')),
      ...(conflicts.length > 0
        ? ['Contradictions detected:', ...conflicts.map((c) => `- ${c.description}`)]
        : []),
      decision.escalate
        ? `Decision: escalate to a human officer (${decision.reasons.map((r) => describeReason(r, 'en')).join('; ')}).`
        : 'Decision: consistent, cited answers; no escalation.',
    ].join('\n');
  }
}
