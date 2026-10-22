import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { RagModule } from '../rag/rag.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import {
  GEMINI_OPENAI_BASE_URL,
  LANGUAGE_MODEL,
  OpenAICompatibleLanguageModel,
  type LanguageModel,
} from './language-model';

/** Gemini (palier gratuit) si sa clé est présente, sinon OpenAI, sinon réponses extractives. */
export function createLanguageModel(
  config: Pick<ConfigService<Env, true>, 'get'>,
): LanguageModel | null {
  const logger = new Logger('ChatModule');
  const geminiKey = config.get('GEMINI_API_KEY', { infer: true });
  const openaiKey = config.get('OPENAI_API_KEY', { infer: true });

  let model: LanguageModel | null = null;
  if (geminiKey) {
    model = new OpenAICompatibleLanguageModel({
      apiKey: geminiKey,
      model: config.get('GEMINI_CHAT_MODEL', { infer: true }),
      baseURL: GEMINI_OPENAI_BASE_URL,
      // La réflexion ne peut pas être désactivée sur Gemini 3 : niveau minimal pour la rapidité et le quota
      reasoningEffort: 'minimal',
    });
  } else if (openaiKey) {
    model = new OpenAICompatibleLanguageModel({
      apiKey: openaiKey,
      model: config.get('OPENAI_CHAT_MODEL', { infer: true }),
    });
  }

  if (model) logger.log(`Rédaction des réponses avec ${model.name}`);
  else
    logger.warn(
      'Aucune clé GEMINI_API_KEY ni OPENAI_API_KEY : Sonah cite les textes, sans rédaction',
    );
  return model;
}

@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: LANGUAGE_MODEL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): LanguageModel | null =>
        createLanguageModel(config),
    },
  ],
  exports: [LANGUAGE_MODEL],
})
export class ChatModule {}
