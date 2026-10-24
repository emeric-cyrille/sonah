import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import {
  FallbackLanguageModel,
  GEMINI_OPENAI_BASE_URL,
  GROQ_OPENAI_BASE_URL,
  LANGUAGE_MODEL,
  OpenAICompatibleLanguageModel,
  type LanguageModel,
} from './language-model';

/**
 * Choix du modèle de rédaction selon les clés disponibles :
 * Groq (palier gratuit, gpt-oss-120b puis modèle de secours), sinon Gemini, sinon OpenAI,
 * sinon null : Sonah répond alors en citant les textes, sans rédaction.
 */
export function createLanguageModel(
  config: Pick<ConfigService<Env, true>, 'get'>,
): LanguageModel | null {
  const logger = new Logger('LanguageModelModule');
  const groqKey = config.get('GROQ_API_KEY', { infer: true });
  const geminiKey = config.get('GEMINI_API_KEY', { infer: true });
  const openaiKey = config.get('OPENAI_API_KEY', { infer: true });

  const forced = config.get('LLM_PROVIDER', { infer: true });
  const provider =
    forced ?? (groqKey ? 'groq' : geminiKey ? 'gemini' : openaiKey ? 'openai' : null);
  if (forced && !{ groq: groqKey, gemini: geminiKey, openai: openaiKey }[forced]) {
    logger.warn(`LLM_PROVIDER=${forced} sans clé correspondante : aucun modèle de rédaction`);
  }

  let model: LanguageModel | null = null;
  if (provider === 'groq' && groqKey) {
    const primary = new OpenAICompatibleLanguageModel({
      apiKey: groqKey,
      model: config.get('GROQ_CHAT_MODEL', { infer: true }),
      baseURL: GROQ_OPENAI_BASE_URL,
      reasoningEffort: 'low',
    });
    const fallbackName = config.get('GROQ_FALLBACK_MODEL', { infer: true });
    model = fallbackName
      ? new FallbackLanguageModel([
          primary,
          new OpenAICompatibleLanguageModel({
            apiKey: groqKey,
            model: fallbackName,
            baseURL: GROQ_OPENAI_BASE_URL,
          }),
        ])
      : primary;
  } else if (provider === 'gemini' && geminiKey) {
    model = new OpenAICompatibleLanguageModel({
      apiKey: geminiKey,
      model: config.get('GEMINI_CHAT_MODEL', { infer: true }),
      baseURL: GEMINI_OPENAI_BASE_URL,
      // La réflexion ne peut pas être désactivée sur Gemini 3 : niveau minimal pour la rapidité et le quota
      reasoningEffort: 'minimal',
    });
  } else if (provider === 'openai' && openaiKey) {
    model = new OpenAICompatibleLanguageModel({
      apiKey: openaiKey,
      model: config.get('OPENAI_CHAT_MODEL', { infer: true }),
    });
  }

  if (model) logger.log(`Rédaction des réponses avec ${model.name}`);
  else logger.warn('Aucune clé de modèle de langage : Sonah cite les textes, sans rédaction');
  return model;
}

/** Fournit le modèle de langage, ou null sans clé : les réponses sont alors extractives. */
@Module({
  providers: [
    {
      provide: LANGUAGE_MODEL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): LanguageModel | null =>
        createLanguageModel(config),
    },
  ],
  exports: [LANGUAGE_MODEL],
})
export class LanguageModelModule {}
