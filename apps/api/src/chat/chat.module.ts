import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { RagModule } from '../rag/rag.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LANGUAGE_MODEL, OpenAILanguageModel, type LanguageModel } from './language-model';

@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: LANGUAGE_MODEL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): LanguageModel | null => {
        const apiKey = config.get('OPENAI_API_KEY', { infer: true });
        const logger = new Logger('ChatModule');
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
export class ChatModule {}
