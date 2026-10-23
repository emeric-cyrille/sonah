import { CONSTITUTION_ART6, LABOUR_ARTICLE, makeResult } from '../testing/fixtures';
import { extractiveSelection } from './extractive';
import {
  applyPolicyGate,
  extractCitationMarkers,
  extractQuotes,
  isVerbatim,
  normalizeCitationMarkers,
  OUT_OF_SCOPE_TOKEN,
  validateAnswer,
} from './policy-gate';

describe('extractCitationMarkers', () => {
  it('lit [1], [1, 2], [2-3] et [1][2]', () => {
    expect(extractCitationMarkers('a [1] b [1, 2] c [2-3] d [4][5]')).toEqual([
      1, 1, 2, 2, 3, 4, 5,
    ]);
  });

  it('ignore les jetons non numériques ([EMAIL])', () => {
    expect(extractCitationMarkers('écrivez à [EMAIL] [1]')).toEqual([1]);
  });
});

describe('extractQuotes', () => {
  it('trouve les citations en chevrons, guillemets anglais et droits, avec les numéros de la ligne', () => {
    const quotes = extractQuotes(
      'Selon [1] : « Le travail forcé est interdit ».\n“Autre texte” "encore"',
    );
    expect(quotes).toEqual([
      { text: 'Le travail forcé est interdit', lineMarkers: [1] },
      { text: 'Autre texte', lineMarkers: [] },
      { text: 'encore', lineMarkers: [] },
    ]);
  });
});

describe('isVerbatim', () => {
  it('tolère espaces, apostrophes typographiques et majuscule initiale', () => {
    const source = "L'élection a lieu   au suffrage universel direct.";
    expect(isVerbatim('l’élection a lieu au suffrage universel', source)).toBe(true);
    expect(isVerbatim("L'élection a lieu au suffrage indirect", source)).toBe(false);
  });
});

describe('validateAnswer', () => {
  const evidence = [LABOUR_ARTICLE, CONSTITUTION_ART6];

  it('accepte une citation littérale rattachée au bon extrait', () => {
    const result = validateAnswer('« Le travail forcé est interdit » [1].', evidence);
    expect(result.valid).toBe(true);
  });

  it('accepte une citation tronquée par des ellipses', () => {
    const result = validateAnswer(
      '« Le droit au travail est reconnu […] comme un droit fondamental… » [1]',
      evidence,
    );
    expect(result.valid).toBe(true);
  });

  it('rejette une citation attribuée au mauvais extrait', () => {
    const result = validateAnswer('« Le travail forcé est interdit » [2].', evidence);
    expect(result.valid).toBe(false);
    expect(result.reasons[0]).toContain('citation non littérale');
  });

  it('rejette un numéro de citation inventé', () => {
    const result = validateAnswer('Le travail forcé est interdit [7].', evidence);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('citation [7] ne correspond à aucun extrait retrouvé');
  });

  it('rejette une réponse sans aucune citation', () => {
    expect(validateAnswer('Le travail forcé est interdit.', evidence).reasons).toContain(
      'réponse sans citation des extraits',
    );
  });

  it('ne vérifie pas les termes courts entre guillemets', () => {
    expect(validateAnswer('Une « société anonyme » [1].', evidence).valid).toBe(true);
  });
});

describe('extractiveSelection', () => {
  it('écarte un texte modifié moins pertinent qu’un texte en vigueur', () => {
    expect(extractiveSelection([LABOUR_ARTICLE, CONSTITUTION_ART6])).toEqual([1]);
  });

  it('garde un texte modifié plus pertinent que tout texte en vigueur', () => {
    expect(extractiveSelection([CONSTITUTION_ART6, LABOUR_ARTICLE])).toEqual([1, 2]);
  });
});

describe('applyPolicyGate', () => {
  it('accepte un brouillon conforme : ANSWERED_WITH_CITATIONS', () => {
    const gate = applyPolicyGate({
      question: 'Le travail forcé est-il autorisé ?',
      language: 'fr',
      evidence: [LABOUR_ARTICLE],
      draft: 'Non : « Le travail forcé est interdit » [1].',
    });
    expect(gate.verdict).toBe('ANSWERED_WITH_CITATIONS');
    expect(gate.draftAccepted).toBe(true);
    expect(gate.reply).toBe('Non : « Le travail forcé est interdit » [1].');
    expect(gate.citations).toEqual([
      expect.objectContaining({
        index: 1,
        documentId: 'doc-travail-2',
        sourceId: 'code-du-travail-1992',
        title: 'Code du travail',
        reference: 'Article 2',
        status: 'in_force',
        url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
      }),
    ]);
  });

  it('remplace un brouillon à la citation inventée par la réponse extractive', () => {
    const gate = applyPolicyGate({
      question: 'Le travail forcé est-il autorisé ?',
      language: 'fr',
      evidence: [LABOUR_ARTICLE],
      draft: 'Selon l’article 12 : « Le travail forcé est puni de 10 ans de prison » [1].',
    });
    expect(gate.draftAccepted).toBe(false);
    expect(gate.rejectionReasons[0]).toContain('citation non littérale');
    expect(gate.reply).toContain('[1] Code du travail, Article 2 : « Le droit au travail');
    expect(gate.reply).not.toContain('10 ans');
    expect(gate.verdict).toBe('ANSWERED_WITH_CITATIONS');
    expect(gate.rule).toBe('answered:extractive_after_rejection');
  });

  it('sans modèle, produit la réponse extractive dans la langue demandée', () => {
    const gate = applyPolicyGate({
      question: 'Is forced labour allowed?',
      language: 'en',
      evidence: [LABOUR_ARTICLE],
      draft: null,
    });
    expect(gate.draftAccepted).toBeNull();
    expect(gate.reply).toContain('Here are the official texts closest to your question:');
    expect(gate.citations).toHaveLength(1);
  });

  it('sans extrait pour une question administrative : INSUFFICIENT_EVIDENCE', () => {
    const gate = applyPolicyGate({
      question: 'Comment obtenir un passeport ?',
      language: 'fr',
      evidence: [],
      draft: 'Allez au commissariat avec 110 000 FCFA.',
    });
    expect(gate.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(gate.reply).toContain("Je n'ai pas trouvé de texte officiel");
    expect(gate.reply).not.toContain('110 000');
    expect(gate.citations).toEqual([]);
  });

  it('question hors domaine : OUT_OF_SCOPE', () => {
    const gate = applyPolicyGate({
      question: 'Quel temps fait-il demain ?',
      language: 'fr',
      evidence: [],
      draft: null,
    });
    expect(gate.verdict).toBe('OUT_OF_SCOPE');
    expect(gate.reply).toContain('assistant administratif');
  });

  it('le modèle peut signaler une question hors sujet malgré des extraits', () => {
    const gate = applyPolicyGate({
      question: 'Raconte-moi une blague',
      language: 'fr',
      evidence: [LABOUR_ARTICLE],
      draft: `${OUT_OF_SCOPE_TOKEN} Je ne peux pas.`,
    });
    expect(gate.verdict).toBe('OUT_OF_SCOPE');
    expect(gate.rule).toBe('out_of_scope:model_hint');
  });

  it('texte cité modifié sans version en vigueur : OUTDATED_TEXT avec avertissement', () => {
    const gate = applyPolicyGate({
      question: 'Combien de mandats pour le Président de la République ?',
      language: 'fr',
      evidence: [CONSTITUTION_ART6],
      draft: 'Le mandat est de sept ans « renouvelable une fois » [1].',
    });
    expect(gate.verdict).toBe('OUTDATED_TEXT');
    expect(gate.reply).toContain('⚠️ [1] Constitution, Article 6 a été modifié (loi n° 2008-1');
    expect(gate.citations[0]?.status).toBe('amended');
    expect(gate.outdated).toEqual([
      {
        index: 1,
        status: 'amended',
        amendedBy: 'loi n° 2008-1 du 14 avril 2008',
        hasInForceCounterpart: false,
      },
    ]);
  });

  it('texte modifié mais version en vigueur disponible : réponse citée, avec avertissement', () => {
    const consolidated = makeResult({
      ...CONSTITUTION_ART6,
      id: 'doc-constitution-6-2008',
      sourceId: 'loi-2008-001',
      metadata: { shortTitle: 'Constitution', status: 'in_force' },
      content:
        'Le Président de la République est élu pour un mandat de sept (7) ans. Il est rééligible.',
    });
    const gate = applyPolicyGate({
      question: 'Combien de mandats pour le Président de la République ?',
      language: 'fr',
      evidence: [CONSTITUTION_ART6, consolidated],
      draft:
        'Selon le texte en vigueur, « Il est rééligible » [2] ; l’ancienne version [1] limitait à deux mandats.',
    });
    expect(gate.verdict).toBe('ANSWERED_WITH_CITATIONS');
    expect(gate.outdated[0]?.hasInForceCounterpart).toBe(true);
    expect(gate.reply).toContain('la version en vigueur figure parmi les extraits');
  });

  it('contradiction signalée par les métadonnées : CONFLICT_BETWEEN_TEXTS', () => {
    const a = makeResult({
      id: 'a',
      sourceId: 'decret-a',
      metadata: { conflictsWith: ['decret-b'] },
    });
    const b = makeResult({ id: 'b', sourceId: 'decret-b', reference: 'Article 5' });
    const gate = applyPolicyGate({
      question: 'Quelle autorisation pour ouvrir un commerce ?',
      language: 'fr',
      evidence: [a, b],
      draft: null,
    });
    expect(gate.verdict).toBe('CONFLICT_BETWEEN_TEXTS');
    expect(gate.conflicts).toHaveLength(1);
    expect(gate.reply).toContain('se contredisent');
  });

  it('contradiction signalée par le coordinateur', () => {
    const gate = applyPolicyGate({
      question: 'Ouvrir un restaurant',
      language: 'en',
      evidence: [LABOUR_ARTICLE],
      draft: null,
      conflictHints: [{ origin: 'coordinator', description: 'Ministry A vs Council B' }],
    });
    expect(gate.verdict).toBe('CONFLICT_BETWEEN_TEXTS');
    expect(gate.reply).toContain('- Ministry A vs Council B');
  });

  it('situation sensible : REFER_TO_HUMAN, avec orientation et textes cités', () => {
    const gate = applyPolicyGate({
      question: 'Mon employeur m’a licencié sans motif, je veux contester',
      language: 'fr',
      evidence: [LABOUR_ARTICLE],
      draft: '« Le droit au travail est reconnu à chaque citoyen » [1].',
    });
    expect(gate.verdict).toBe('REFER_TO_HUMAN');
    expect(gate.sensitiveCategory).toBe('dismissal_dispute');
    expect(gate.reply.startsWith('Un litige de licenciement')).toBe(true);
    expect(gate.citations).toHaveLength(1);
  });

  it('situation sensible sans extrait : REFER_TO_HUMAN quand même', () => {
    const gate = applyPolicyGate({
      question: 'I was arrested and detained by the police, what can I do?',
      language: 'en',
      evidence: [],
      draft: null,
    });
    expect(gate.verdict).toBe('REFER_TO_HUMAN');
    expect(gate.reply).toContain('lawyer');
  });
});

describe('normalizeCitationMarkers', () => {
  it('ramène les marqueurs des modèles de raisonnement au format [n]', () => {
    expect(normalizeCitationMarkers('six mois【6】 et huit【2†L1-L3】, voir【1，3】 et[^4].')).toBe(
      'six mois[6] et huit[2], voir[1,3] et[4].',
    );
  });

  it('laisse intacts les marqueurs déjà conformes et le texte sans marqueur', () => {
    expect(normalizeCitationMarkers('Article 89 [1] et [2, 3].')).toBe('Article 89 [1] et [2, 3].');
  });
});
