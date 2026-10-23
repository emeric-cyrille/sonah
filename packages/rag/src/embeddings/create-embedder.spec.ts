import { createEmbedder } from './create-embedder';

const silentLogger = { log: () => undefined, warn: () => undefined, error: () => undefined };

describe('createEmbedder', () => {
  it('privilégie Gemini, puis OpenAI, puis le mode hors ligne', () => {
    expect(createEmbedder({ geminiApiKey: 'g', openaiApiKey: 'o' }, silentLogger).model).toBe(
      'gemini-embedding-2',
    );
    expect(createEmbedder({ openaiApiKey: 'o' }, silentLogger).model).toBe(
      'text-embedding-3-small',
    );
    expect(createEmbedder({ geminiApiKey: '  ' }, silentLogger).model).toBe('hashing-fr-v1');
  });

  it('applique un seuil de pertinence calibré', () => {
    const embedder = createEmbedder({ relevanceThreshold: 0.42 }, silentLogger);
    expect(embedder.relevanceThreshold).toBe(0.42);
    expect(embedder.model).toBe('hashing-fr-v1');
  });
});
