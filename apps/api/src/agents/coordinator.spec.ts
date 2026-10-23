import { AGENTS, describeAgent, getAgent } from './agent-registry';
import { detectPositionConflicts, mergeOutcomes, routeEvent } from './coordinator';

describe('routeEvent', () => {
  it('oriente une panne du modèle vers le régulateur du numérique', () => {
    const routing = routeEvent(
      'Panne du modèle de langage : quota épuisé, continuité de service',
      AGENTS,
    );
    expect(routing.rule).toBe('keywords');
    expect(routing.selected[0]?.agentId).toBe('regulator-minpostel');
  });

  it('oriente une fuite de numéro de CNI vers l’autorité de protection des données', () => {
    const routing = routeEvent('A citizen shared personal data: ID card and phone number', AGENTS);
    expect(routing.selected.map((s) => s.agentId)).toContain('data-protection-authority');
    expect(routing.selected[0]?.agentId).toBe('data-protection-authority');
  });

  it('oriente l’ouverture d’un restaurant vers le ministère', () => {
    const routing = routeEvent(
      'Ouvrir un restaurant : immatriculation et certificat d’hygiène',
      AGENTS,
    );
    expect(routing.selected[0]?.agentId).toBe('ministry-business');
  });

  it('oriente un texte modifié vers le conseiller juridique', () => {
    const routing = routeEvent('Article de loi modifié : version périmée citée', AGENTS);
    expect(routing.selected[0]?.agentId).toBe('legal-adviser');
  });

  it('ne route jamais vers le coordinateur ni vers Sonah', () => {
    const routing = routeEvent('citoyen coordination question', AGENTS);
    expect(routing.selected.map((s) => s.agentId)).not.toContain('coordinator');
    expect(routing.selected.map((s) => s.agentId)).not.toContain('sonah');
  });

  it('sans mandat concerné : le conseiller juridique par défaut', () => {
    expect(routeEvent('xyz', AGENTS)).toEqual({
      selected: [{ agentId: 'legal-adviser', score: 0, matched: [] }],
      rule: 'default_legal_adviser',
    });
  });

  it('respecte une sélection imposée', () => {
    const routing = routeEvent('panne', AGENTS, ['sonah', 'ministry-business']);
    expect(routing.rule).toBe('explicit');
    expect(routing.selected.map((s) => s.agentId)).toEqual(['sonah', 'ministry-business']);
  });
});

describe('detectPositionConflicts', () => {
  const ministry = {
    holder: 'Ministère',
    topic: 'ordre',
    statement: 'Immatriculation puis hygiène',
    precedence: ['immatriculation', 'hygiene'] as const,
  };

  it('détecte un ordre inverse entre deux formalités', () => {
    const conflicts = detectPositionConflicts([
      ministry,
      {
        holder: 'Mairie',
        topic: 'ordre',
        statement: 'Hygiène puis immatriculation',
        precedence: ['hygiene', 'immatriculation'],
      },
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.origin).toBe('coordinator');
    expect(conflicts[0]?.description).toContain('Ministère');
  });

  it('détecte deux autorités compétentes différentes', () => {
    expect(
      detectPositionConflicts([
        { holder: 'A', topic: 'autorite', statement: 'x', value: 'Mairie' },
        { holder: 'B', topic: 'autorite', statement: 'y', value: 'Ministère' },
      ]),
    ).toHaveLength(1);
  });

  it('pas de contradiction sur des sujets différents ou des positions concordantes', () => {
    expect(
      detectPositionConflicts([
        ministry,
        { ...ministry, holder: 'Mairie' },
        {
          holder: 'Autre',
          topic: 'autre-sujet',
          statement: 'z',
          precedence: ['hygiene', 'immatriculation'],
        },
      ]),
    ).toEqual([]);
  });
});

describe('mergeOutcomes', () => {
  it('réponses concordantes et citées : pas d’escalade', () => {
    expect(
      mergeOutcomes(
        [
          { agentId: 'legal-adviser', verdict: 'ANSWERED_WITH_CITATIONS' },
          { agentId: 'ministry-business', verdict: 'ANSWERED_WITH_CITATIONS' },
        ],
        [],
      ),
    ).toEqual({ verdict: 'ANSWERED_WITH_CITATIONS', escalate: false, reasons: [] });
  });

  it('contradiction entre positions : CONFLICT_BETWEEN_TEXTS et escalade', () => {
    const decision = mergeOutcomes(
      [{ agentId: 'ministry-business', verdict: 'INSUFFICIENT_EVIDENCE' }],
      [{ origin: 'coordinator', description: 'A ↔ B' }],
    );
    expect(decision.verdict).toBe('CONFLICT_BETWEEN_TEXTS');
    expect(decision.escalate).toBe(true);
    expect(decision.reasons).toContain('position_conflict');
  });

  it('verdict le plus grave retenu, évaluations divergentes signalées', () => {
    const decision = mergeOutcomes(
      [
        { agentId: 'sonah', verdict: 'ANSWERED_WITH_CITATIONS' },
        { agentId: 'legal-adviser', verdict: 'OUTDATED_TEXT' },
      ],
      [],
    );
    expect(decision.verdict).toBe('OUTDATED_TEXT');
    expect(decision.reasons).toEqual(['divergent_assessments', 'outdated_text']);
  });

  it('aucun texte applicable pour tous les agents : escalade', () => {
    expect(
      mergeOutcomes([{ agentId: 'legal-adviser', verdict: 'INSUFFICIENT_EVIDENCE' }], []).reasons,
    ).toEqual(['no_applicable_text']);
  });
});

describe('registre des agents', () => {
  it('couvre les quatre rôles du défi', () => {
    expect(new Set(AGENTS.map((a) => a.role))).toEqual(
      new Set([
        'Innovative AI solution',
        'Policy and legal adviser',
        'Institutional participant',
        'Multi-agent coordination',
      ]),
    );
  });

  it('décrit un agent dans la langue demandée', () => {
    expect(describeAgent(getAgent('legal-adviser'), 'en')).toMatchObject({
      id: 'legal-adviser',
      name: 'Policy and legal adviser',
      role: 'Policy and legal adviser',
    });
  });
});
