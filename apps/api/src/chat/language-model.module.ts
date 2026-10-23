import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { LANGUAGE_MODEL, OpenAILanguageModel, type LanguageModel } from './language-model';

/** Fournit le modèle de langage, ou null sans clé : les réponses sont alors extractives. */
@Module({
  providers: [
    {
      provide: LANGUAGE_MODEL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): LanguageModel | null => {
        const apiKey = config.get('OPENAI_API_KEY', { infer: true });
        const logger = new Logger('LanguageModelModule');
        if (!apiKey) {
          logger.warn('OPENAI_API_KEY absente : Sonah répond en citant les textes, sans rédaction');
          return null;
        }
        const model = config.get('OPENAI_CHAT_MODEL', { infer: true });
        logger.log(`Rédaction des réponses avec ${model}`);
        return new OpenAILanguageModel(apiKey, model);
      },
    },
  ],
  exports: [LANGUAGE_MODEL],
})
export class LanguageModelModule {}
