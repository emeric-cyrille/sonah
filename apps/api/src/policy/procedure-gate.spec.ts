import { LOST_ID_CARD, procedureSheetFixture } from '../testing/fixtures';
import { detectOrientationCategory, orientationReply } from './orientation';
import { applyOrientationGate, applyProcedureGate, validateProcedureText } from './policy-gate';
import { formatFcfa, renderProcedureReply, toProcedurePayload } from './procedure-answer';
import { extractNumbers } from './procedure-gate';

const cni = procedureSheetFixture('cni-perte');
const medical = procedureSheetFixture('certificat-medical');
const birth = procedureSheetFixture('acte-de-naissance-copie');

describe('rendu d’une fiche de démarche', () => {
  it('affiche autorité, pièces, étapes, coût, validité, base légale, sources et date de vérification', () => {
    const reply = renderProcedureReply(cni, 'fr');
    expect(reply).toContain('Délégation générale à la Sûreté nationale (DGSN)');
    expect(reply).toContain('- Déclaration de perte délivrée par le commissariat');
    expect(reply).toContain('1. Déclarer la perte au commissariat le plus proche');
    expect(reply).toContain("4. Retirer la carte au poste d'identification");
    expect(reply).toContain('**Coût** : 2 800 FCFA — Timbre de 2 800 FCFA');
    expect(reply).toContain('**Délai** : non vérifié, il peut varier.');
    expect(reply).toContain('**Validité** : 10 ans');
    expect(reply).toContain('Décret fixant les caractéristiques de la CNI (FIXTURE), Article 3');
    expect(reply).toContain('https://example.org/fixtures/cni');
    expect(reply).toContain('Fiche vérifiée le 2026-10-01.');
    expect(reply).toContain('- Délai : Délai de délivrance variable selon le poste.');
    expect(reply).toContain('[1]');
  });

  it('coût et délai absents de la fiche : signalés comme non vérifiés, jamais estimés', () => {
    const reply = renderProcedureReply(birth, 'fr');
    expect(reply).toContain('**Coût** : non vérifié, il peut varier');
    expect(reply).toContain('**Délai** : non vérifié');
    expect(reply).toContain('Date de vérification de la fiche non renseignée.');
    expect(reply).not.toMatch(/FCFA/);
    // Coût décrit sans montant : la description de la fiche est reprise telle quelle
    expect(renderProcedureReply(medical, 'fr')).toContain(
      '**Coût** : Variable selon la formation sanitaire et les examens demandés.',
    );
  });

  it('version anglaise : libellés traduits, contenu signalé comme disponible en français', () => {
    const reply = renderProcedureReply(cni, 'en');
    expect(reply).toContain('National identity card: replacement after loss');
    expect(reply).toContain('**Documents to provide**');
    expect(reply).toContain('only available in French');
  });

  it('charge utile structurée pour le client', () => {
    expect(toProcedurePayload(cni, 'fr')).toMatchObject({
      id: 'cni-perte',
      title: "Carte nationale d'identité : renouvellement après perte",
      cost: { amountFcfa: 2800, description: 'Timbre de 2 800 FCFA' },
      delay: null,
      validity: '10 ans',
      verifiedAt: '2026-10-01',
      unverified: [{ field: 'delay', note: expect.any(String) }],
    });
    expect(formatFcfa(150000)).toBe('150 000 FCFA');
  });
});

describe('contrôle des réponses de démarche', () => {
  it('extrait les nombres (milliers, dates) hors liens et marqueurs', () => {
    expect(
      extractNumbers('Timbre de 2 800 FCFA [1], voir https://x.org/a2024 le 2026-10-01'),
    ).toEqual(['2800', '2026', '10', '1']);
  });

  it('rejette un montant inventé', () => {
    const validation = validateProcedureText(
      'La nouvelle CNI coûte 10 000 FCFA, à payer au commissariat.',
      cni,
    );
    expect(validation.valid).toBe(false);
    expect(validation.reasons.join(' ')).toContain('10000');
  });

  it('rejette un délai ou une pièce inventés, accepte une reformulation fidèle', () => {
    expect(validateProcedureText('Comptez 48 heures pour la carte.', cni).valid).toBe(false);
    expect(
      validateProcedureText('Apportez aussi deux photos d’identité et une quittance.', cni).valid,
    ).toBe(false);
    expect(
      validateProcedureText(
        'Pas d’inquiétude : déclarez d’abord la perte au commissariat, puis présentez-vous au poste d’identification avec la déclaration de perte.',
        cni,
      ).valid,
    ).toBe(true);
    expect(validateProcedureText('Le timbre coûte 2 800 FCFA [1].', cni).valid).toBe(true);
  });

  it('rejette un lien ou un renvoi absent de la fiche', () => {
    expect(validateProcedureText('Voir https://dgsn.cm/cni', cni).valid).toBe(false);
    expect(validateProcedureText('Selon la fiche [2].', cni).valid).toBe(false);
  });

  it('introduction du modèle acceptée si conforme, remplacée sinon (rejet tracé)', () => {
    const accepted = applyProcedureGate({
      sheet: cni,
      document: LOST_ID_CARD,
      language: 'fr',
      draft: 'Pas de panique : adressez-vous au commissariat de votre lieu de résidence.',
    });
    expect(accepted).toMatchObject({
      verdict: 'ANSWERED_WITH_CITATIONS',
      draftAccepted: true,
      rule: 'procedure:sheet',
    });
    expect(accepted.reply.startsWith('Pas de panique')).toBe(true);
    expect(accepted.citations).toEqual([
      expect.objectContaining({
        index: 1,
        documentId: LOST_ID_CARD.id,
        sourceId: 'procedures',
        url: 'https://example.org/fixtures/cni',
        status: 'in_force',
      }),
    ]);

    const rejected = applyProcedureGate({
      sheet: cni,
      document: LOST_ID_CARD,
      language: 'fr',
      draft: 'La CNI coûte 5 000 FCFA et est prête en 15 jours.',
    });
    expect(rejected.draftAccepted).toBe(false);
    expect(rejected.rule).toBe('procedure:sheet_after_rejection');
    expect(rejected.reply).not.toContain('5 000');
    expect(rejected.reply).not.toContain('15 jours');
    expect(rejected.reply).toContain('Voici la démarche');
    expect(
      rejected.checks.filter((c) => c.detail.startsWith('réponse')).every((c) => c.valid),
    ).toBe(true);
  });
});

describe('orientation sans fiche', () => {
  it.each([
    ['comment renouveler mon passeport', 'identite'],
    ['je veux un extrait de casier judiciaire', 'justice'],
    ['je veux faire un certificat médical', 'sante'],
    ['comment déclarer une naissance', 'etat_civil'],
    ['comment créer une SARL', 'entreprise'],
    ['comment obtenir mon NIU', 'fiscalite'],
    ['je veux mon permis de conduire', 'transport'],
    ['je veux un papier', 'general'],
  ] as const)('« %s » → %s', (question, category) => {
    expect(detectOrientationCategory(question)).toBe(category);
  });

  it('réponse honnête : pas de fiche, administration habituelle, aucun chiffre ni pièce', () => {
    const gate = applyOrientationGate({ category: 'identite', language: 'fr', draft: null });
    expect(gate.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(gate.rule).toBe('orientation:no_sheet:identite');
    expect(gate.reply).toContain("Je n'ai pas encore la fiche officielle de cette démarche");
    expect(gate.reply).toContain('commissariat');
    expect(gate.reply).not.toMatch(/\d/);
    expect(gate.citations).toEqual([]);
    expect(orientationReply('sante', 'en')).toContain('approved doctor');
  });

  it('reformulation du modèle rejetée si elle ajoute un coût ou une pièce', () => {
    const invented = applyOrientationGate({
      category: 'identite',
      language: 'fr',
      question: 'comment renouveler mon passeport',
      draft: 'Le passeport coûte 110 000 FCFA ; apportez deux photos.',
    });
    expect(invented.draftAccepted).toBe(false);
    expect(invented.reply).toBe(orientationReply('identite', 'fr'));

    const faithful = applyOrientationGate({
      category: 'identite',
      language: 'fr',
      question: 'comment renouveler mon passeport',
      draft:
        "Je n'ai pas encore la fiche du passeport. Renseignez-vous auprès du commissariat de police de votre lieu de résidence.",
    });
    expect(faithful.draftAccepted).toBe(true);
  });
});
