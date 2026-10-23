import { CONSTITUTION_ART6, LABOUR_ARTICLE, makeResult } from '../testing/fixtures';
import { createHarness, FailingModel, RecordingModel } from '../testing/fakes';

const ARTICLE = makeResult({
  metadata: {
    shortTitle: 'Code du travail',
    path: ['Titre 1 - Dispositions générales'],
    note: 'Texte de 1992.',
  },
});

describe('ChatService', () => {
  it('rédige la réponse avec le modèle, à partir des extraits numérotés et de leur statut', async () => {
    const model = new RecordingModel('Le travail forcé est interdit [1].');
    const { chat, messages } = createHarness([ARTICLE], model);

    const response = await chat.reply('Le travail forcé est-il autorisé ?');

    expect(response.reply).toBe('Le travail forcé est interdit [1].');
    expect(response.verdict).toBe('ANSWERED_WITH_CITATIONS');
    expect(response.language).toBe('fr');
    expect(response.citations).toEqual([
      expect.objectContaining({ index: 1, documentId: ARTICLE.id, status: 'in_force' }),
    ]);
    expect(response.sources).toEqual([
      {
        title: 'Code du travail',
        reference: 'Article 2',
        url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
      },
    ]);
    const context = model.calls[0]?.[1]?.content ?? '';
    expect(context).toContain('[1] Code du travail › Titre 1 - Dispositions générales › Article 2');
    expect(context).toContain('Statut : en vigueur');
    expect(context).toContain('Note de version : Texte de 1992.');
    expect(messages.map((m) => m.role)).toEqual(['USER', 'ASSISTANT']);
  });

  it('écrit une trace chaînée pour chaque requête', async () => {
    const { chat, traces, audit } = createHarness([ARTICLE], null);
    const first = await chat.reply('Le travail forcé est-il autorisé ?');
    await chat.reply('Et pour les mineurs ?', first.conversationId);

    expect(traces.records).toHaveLength(2);
    const trace = await audit.get(first.traceId);
    expect(trace?.conversationId).toBe(first.conversationId);
    expect(trace?.steps.map((s) => s.type)).toEqual([
      'input',
      'retrieval',
      'gate',
      'agent',
      'output',
    ]);
    expect(await audit.verify()).toEqual({ valid: true, count: 2 });
  });

  it('relance elliptique : la question précédente est ajoutée à la recherche', async () => {
    const model = new RecordingModel('Le travail forcé est interdit [1].');
    const { chat, calls } = createHarness([ARTICLE], model);

    const first = await chat.reply('Quels sont mes droits face au travail forcé ?');
    await chat.reply('Et pendant un arrêt maladie ?', first.conversationId);

    expect(calls[1]?.query).toBe(
      'Quels sont mes droits face au travail forcé ?\nEt pendant un arrêt maladie ?',
    );
    expect(model.calls[1]?.map((turn) => turn.role)).toEqual([
      'system',
      'system',
      'user',
      'assistant',
      'user',
    ]);
  });

  it('changement de sujet : pas de dérive vers la question précédente', async () => {
    const { chat, calls } = createHarness([ARTICLE], null);
    const first = await chat.reply('Quels sont mes droits face au travail forcé ?');
    await chat.reply('Comment obtenir un passeport ?', first.conversationId);
    expect(calls[1]?.query).toBe('Comment obtenir un passeport ?');
  });

  it('répond dans la langue de l’utilisateur, ou celle demandée', async () => {
    const { chat } = createHarness([ARTICLE], null);
    const english = await chat.reply('Is forced labour allowed in Cameroon?');
    expect(english.language).toBe('en');
    expect(english.reply).toContain('Here are the official texts closest to your question:');

    const forced = await chat.reply('Le travail forcé est-il autorisé ?', undefined, 'en');
    expect(forced.language).toBe('en');
  });

  it('transmet la langue de réponse au modèle', async () => {
    const model = new RecordingModel('Forced labour is prohibited [1].');
    const { chat } = createHarness([ARTICLE], model);
    await chat.reply('Is forced labour allowed?');
    expect(model.calls[0]?.[0]?.content).toContain('Réponds en anglais (English)');
  });

  it('remplace un brouillon à la citation inventée et trace le rejet', async () => {
    const model = new RecordingModel(
      'Selon « le travail forcé est puni de dix ans de prison » [1].',
    );
    const { chat, audit } = createHarness([ARTICLE], model);
    const response = await chat.reply('Le travail forcé est-il autorisé ?');

    expect(response.reply).not.toContain('dix ans');
    expect(response.reply).toContain('[1] Code du travail, Article 2');
    const trace = await audit.get(response.traceId);
    expect(trace?.model).toBe('extractive');
    const fallback = trace?.steps.find((s) => s.type === 'fallback');
    expect(fallback?.summary).toContain('rejeté');
    const gate = trace?.steps.find((s) => s.type === 'gate');
    expect(gate?.data.draftAccepted).toBe(false);
  });

  it('modèle en panne : réponse extractive citée et étape de repli tracée', async () => {
    const { chat, audit } = createHarness([ARTICLE], new FailingModel());
    const response = await chat.reply('Le travail forcé est-il autorisé ?');
    expect(response.verdict).toBe('ANSWERED_WITH_CITATIONS');
    expect(response.citations).toHaveLength(1);
    const trace = await audit.get(response.traceId);
    expect(trace?.steps.find((s) => s.type === 'fallback')?.data.reason).toBe('429 quota exceeded');
  });

  it('masque les données personnelles avant stockage et envoi au modèle', async () => {
    const model = new RecordingModel('Le travail forcé est interdit [1].');
    const { chat, messages, audit } = createHarness([ARTICLE], model);
    const response = await chat.reply(
      'Mon numéro est 699123456 et mon mail paul@example.cm : le travail forcé est-il autorisé ?',
    );

    expect(messages[0]?.content).toBe(
      'Mon numéro est [PHONE] et mon mail [EMAIL] : le travail forcé est-il autorisé ?',
    );
    expect(JSON.stringify(model.calls)).not.toContain('699123456');
    expect(response.reply).toContain('j’ai masqué les données personnelles');
    const trace = await audit.get(response.traceId);
    expect(JSON.stringify(trace)).not.toContain('paul@example.cm');
    expect(trace?.steps[0]?.data.piiMasked).toEqual({ email: 1, phone: 1, id_number: 0 });
  });

  it('texte modifié : verdict OUTDATED_TEXT et avertissement', async () => {
    const { chat } = createHarness([CONSTITUTION_ART6], null);
    const response = await chat.reply('Combien de mandats pour le Président de la République ?');
    expect(response.verdict).toBe('OUTDATED_TEXT');
    expect(response.citations[0]?.status).toBe('amended');
    expect(response.reply).toContain('a été modifié');
  });

  it('crée une nouvelle conversation si l’identifiant fourni est inconnu', async () => {
    const { chat } = createHarness([], new RecordingModel());
    const response = await chat.reply('Bonjour', '11111111-1111-4111-8111-111111111111');
    expect(response.conversationId).not.toBe('11111111-1111-4111-8111-111111111111');
  });

  it('sans modèle, cite honnêtement les articles trouvés avec leur note de version', async () => {
    const { chat } = createHarness([ARTICLE], null);
    const response = await chat.reply('travail forcé');
    expect(response.reply).toContain(
      '[1] Code du travail, Article 2 : « Le droit au travail est reconnu',
    );
    expect(response.reply).toContain('vérifiez auprès de l’administration concernée');
    expect(response.reply).toContain('⚠️ Code du travail : Texte de 1992.');
  });

  it('écarte les extraits sous le seuil de pertinence', async () => {
    const offTopic = makeResult({
      ...LABOUR_ARTICLE,
      id: '2',
      reference: 'Article 124',
      score: 0.07,
    });
    const { chat } = createHarness([offTopic], null);
    const response = await chat.reply('Comment obtenir un passeport ?');
    expect(response.sources).toEqual([]);
    expect(response.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(response.reply).toContain("Je n'ai pas trouvé de texte officiel");
  });

  it('question hors sujet : OUT_OF_SCOPE', async () => {
    const { chat } = createHarness([], null);
    const response = await chat.reply('Quel temps fait-il ?');
    expect(response.verdict).toBe('OUT_OF_SCOPE');
    expect(response.citations).toEqual([]);
  });
});
