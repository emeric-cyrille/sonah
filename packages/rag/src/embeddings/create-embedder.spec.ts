import { createEmbedder } from './create-embedder';

const silentLogger = { log: () => undefined, warn: () => undefined, error: () => undefined };

describe('createEmbedder', () => {
  it('privilégie Gemini, puis OpenAI, puis le modèle local multilingue', () => {
    expect(createEmbedder({ geminiApiKey: 'g', openaiApiKey: 'o' }, silentLogger).model).toBe(
      'gemini-embedding-2',
    );
    expect(createEmbedder({ openaiApiKey: 'o' }, silentLogger).model).toBe(
      'text-embedding-3-small',
    );
    expect(createEmbedder({ geminiApiKey: '  ' }, silentLogger).model).toBe(
      'local:multilingual-e5-small',
    );
  });

  it('respecte le fournisseur imposé', () => {
    expect(createEmbedder({ provider: 'hashing', geminiApiKey: 'g' }, silentLogger).model).toBe(
      'hashing-fr-v1',
    );
    expect(createEmbedder({ provider: 'local', openaiApiKey: 'o' }, silentLogger).model).toBe(
      'local:multilingual-e5-small',
    );
    expect(() => createEmbedder({ provider: 'gemini' }, silentLogger)).toThrow('GEMINI_API_KEY');
  });

  it('applique un seuil de pertinence calibré', () => {
    const embedder = createEmbedder(
      { provider: 'hashing', relevanceThreshold: 0.42 },
      silentLogger,
    );
    expect(embedder.relevanceThreshold).toBe(0.42);
    expect(embedder.model).toBe('hashing-fr-v1');
  });

  it('modèle local : indexation sous forme courte, conservée avec un seuil calibré', () => {
    expect(createEmbedder({ provider: 'local' }, silentLogger).embeddingTextStyle).toBe(
      'reference',
    );
    const calibrated = createEmbedder({ provider: 'local', relevanceThreshold: 0.8 }, silentLogger);
    expect(calibrated.embeddingTextStyle).toBe('reference');
    expect(
      createEmbedder({ provider: 'hashing' }, silentLogger).embeddingTextStyle,
    ).toBeUndefined();
  });
});
