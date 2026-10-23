import {
  BIRTH_CERTIFICATE,
  CONSTITUTION_ART6,
  LABOUR_ARTICLE,
  LOST_ID_CARD,
  makeResult,
  MEDICAL_CERTIFICATE,
} from '../testing/fixtures';
import { createHarness, FailingModel, RecordingModel } from '../testing/fakes';

const CORPUS = [
  CONSTITUTION_ART6,
  LABOUR_ARTICLE,
  MEDICAL_CERTIFICATE,
  LOST_ID_CARD,
  BIRTH_CERTIFICATE,
];

describe('démarches administratives (pipeline de conversation)', () => {
  it('« je veux faire mon certificat médical » → fiche de démarche, jamais la Constitution', async () => {
    const { chat, calls, audit } = createHarness(CORPUS, null);
    const response = await chat.reply('je veux faire mon certificat médical');

    expect(response.answerType).toBe('procedure');
    expect(response.verdict).toBe('ANSWERED_WITH_CITATIONS');
    expect(response.procedure).toMatchObject({
      id: 'certificat-medical',
      title: 'Certificat médical',
      authority: { name: 'Médecin agréé ou formation sanitaire publique' },
      cost: { amountFcfa: null },
      verifiedAt: '2026-10-01',
    });
    expect(response.reply).not.toMatch(/Constitution|Président/);
    expect(response.reply).toContain('**Où vous adresser**');
    expect(response.citations).toEqual([
      expect.objectContaining({
        index: 1,
        sourceId: 'procedures',
        documentId: MEDICAL_CERTIFICATE.id,
      }),
    ]);
    expect(response.sources).toEqual([
      {
        title: 'FIXTURE DE TEST — source fictive',
        url: 'https://example.org/fixtures/certificat-medical',
      },
    ]);
    // Seule la recherche des fiches a eu lieu (aucune recherche dans les lois)
    expect(calls.map((c) => c.types)).toEqual([['PROCEDURE']]);

    const trace = await audit.get(response.traceId);
    expect(trace?.steps.map((s) => s.type)).toEqual(['input', 'retrieval', 'gate', 'output']);
    expect(trace?.steps[0]?.data).toMatchObject({ intent: 'procedure' });
    expect(trace?.steps[1]?.data).toMatchObject({
      scope: 'procedures',
      selected: 'certificat-medical',
    });
    expect(trace?.steps[3]?.data).toMatchObject({
      answerType: 'procedure',
      intent: 'procedure',
      procedureId: 'certificat-medical',
    });
  });

  it('« j’ai perdu ma CNI » → fiche CNI avec le coût de la fiche', async () => {
    const { chat } = createHarness(CORPUS, null);
    const response = await chat.reply("j'ai perdu ma CNI");
    expect(response.procedure?.id).toBe('cni-perte');
    expect(response.reply).toContain('2 800 FCFA');
    expect(response.reply).toContain('**Délai** : non vérifié');
  });

  it('anglais : « how do I get a birth certificate » → fiche acte de naissance', async () => {
    const { chat } = createHarness(CORPUS, null);
    const response = await chat.reply('how do I get a birth certificate');
    expect(response.language).toBe('en');
    expect(response.procedure).toMatchObject({
      id: 'acte-de-naissance-copie',
      title: 'Copy of a birth certificate',
    });
    expect(response.reply).toContain('**Where to go**');
    expect(response.reply).toContain('**Cost** : not verified');
  });

  it('pas de fiche (« comment renouveler mon passeport ») → orientation honnête, aucune loi citée', async () => {
    const { chat, calls } = createHarness(CORPUS, new RecordingModel('Selon la Constitution [1].'));
    const response = await chat.reply('comment renouveler mon passeport');
    expect(response.answerType).toBe('orientation');
    expect(response.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(response.citations).toEqual([]);
    expect(response.sources).toEqual([]);
    expect(response.procedure).toBeUndefined();
    expect(response.reply).toContain("Je n'ai pas encore la fiche officielle de cette démarche");
    expect(response.reply).toContain('commissariat');
    expect(response.reply).not.toMatch(/\d|Constitution/);
    expect(calls.every((c) => c.types?.includes('PROCEDURE'))).toBe(true);
  });

  it('introduction du modèle : acceptée si fidèle, rejetée si elle invente un montant', async () => {
    const faithful = createHarness(
      CORPUS,
      new RecordingModel('Pas de panique : déclarez la perte au commissariat le plus proche.'),
    );
    const ok = await faithful.chat.reply("j'ai perdu ma CNI");
    expect(ok.reply.startsWith('Pas de panique')).toBe(true);
    const okTrace = await faithful.audit.get(ok.traceId);
    expect(okTrace?.model).toBe('modele-test');

    const inventive = createHarness(
      CORPUS,
      new RecordingModel('La nouvelle CNI coûte 25 000 FCFA et arrive en 3 jours.'),
    );
    const rejected = await inventive.chat.reply("j'ai perdu ma CNI");
    expect(rejected.reply).not.toContain('25 000');
    expect(rejected.reply).toContain('Voici la démarche');
    const trace = await inventive.audit.get(rejected.traceId);
    expect(trace?.model).toBe('extractive');
    expect(trace?.steps.map((s) => s.type)).toEqual([
      'input',
      'retrieval',
      'llm',
      'gate',
      'fallback',
      'output',
    ]);
  });

  it('modèle en panne : introduction déterministe', async () => {
    const { chat } = createHarness(CORPUS, new FailingModel());
    const response = await chat.reply('je veux faire mon certificat médical');
    expect(response.answerType).toBe('procedure');
    expect(response.reply).toContain('Voici la démarche « Certificat médical »');
  });

  it('question de droit : pipeline juridique inchangé', async () => {
    const { chat, calls } = createHarness(CORPUS, null);
    const response = await chat.reply('mon employeur peut-il me licencier');
    expect(response.answerType).toBe('legal');
    expect(response.procedure).toBeUndefined();
    expect(response.citations.every((c) => c.sourceId !== 'procedures')).toBe(true);
    expect(calls[0]?.types).toEqual(['CONSTITUTION', 'LAW', 'DECREE']);
  });

  it('demande mixte sans fiche : loi citée seulement si nettement pertinente', async () => {
    const relevant = createHarness(CORPUS, null);
    const mixed = await relevant.chat.reply(
      'Comment obtenir un passeport et est-il obligatoire pour voyager ?',
    );
    expect(mixed.answerType).toBe('legal');
    expect(mixed.reply).toContain("Je n'ai pas encore la fiche officielle");
    expect(mixed.citations.length).toBeGreaterThan(0);

    const weak = makeResult({ ...LABOUR_ARTICLE, id: 'faible', score: 0.16 });
    const irrelevant = createHarness([weak, MEDICAL_CERTIFICATE], null);
    const orientation = await irrelevant.chat.reply(
      'Comment obtenir un passeport et est-il obligatoire pour voyager ?',
    );
    expect(orientation.answerType).toBe('orientation');
    expect(orientation.citations).toEqual([]);
  });

  it('relance elliptique (« et combien ça coûte ? ») : reste sur la fiche de la question précédente', async () => {
    const { chat } = createHarness(CORPUS, null);
    const first = await chat.reply("j'ai perdu ma CNI");
    const second = await chat.reply('et combien ça coûte ?', first.conversationId);
    expect(second.answerType).toBe('procedure');
    expect(second.procedure?.id).toBe('cni-perte');
  });

  it('sans fiche indexée : orientation, aucune recherche vectorielle des fiches', async () => {
    const { chat, calls } = createHarness([LABOUR_ARTICLE], null);
    const response = await chat.reply('je veux faire mon certificat médical');
    expect(response.answerType).toBe('orientation');
    expect(response.reply).toContain('médecin agréé');
    expect(calls).toEqual([]);
  });
});
