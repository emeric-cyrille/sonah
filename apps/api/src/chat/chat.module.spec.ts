import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { embedderConfig } from '../rag/rag.module';
import { createLanguageModel } from './chat.module';

function config(values: Partial<Env>): Pick<ConfigService<Env, true>, 'get'> {
  const defaults: Partial<Env> = {
    GEMINI_CHAT_MODEL: 'gemini-3.8-flash',
    OPENAI_CHAT_MODEL: 'gpt-4o',
    GEMINI_EMBEDDING_MODEL: 'gemini-embedding-2',
    OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
  };
  const all = { ...defaults, ...values } as Record<string, unknown>;
  return { get: ((key: string) => all[key]) as ConfigService<Env, true>['get'] };
}

describe('choix du modèle de Sonah', () => {
  it('utilise Gemini Flash quand la clé Gemini est présente, même avec une clé OpenAI', () => {
    expect(createLanguageModel(config({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' }))?.name).toBe(
      'gemini-3.8-flash',
    );
  });

  it('se rabat sur OpenAI, puis sur le mode extractif', () => {
    expect(createLanguageModel(config({ OPENAI_API_KEY: 'o' }))?.name).toBe('gpt-4o');
    expect(createLanguageModel(config({}))).toBeNull();
  });

  it('transmet la clé Gemini et le seuil calibré aux embeddings', () => {
    expect(
      embedderConfig(config({ GEMINI_API_KEY: 'g', EMBEDDING_RELEVANCE_THRESHOLD: 0.6 })),
    ).toMatchObject({
      geminiApiKey: 'g',
      geminiEmbeddingModel: 'gemini-embedding-2',
      relevanceThreshold: 0.6,
    });
  });
});
