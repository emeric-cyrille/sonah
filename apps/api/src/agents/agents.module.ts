import { Module } from '@nestjs/common';
import { LanguageModelModule } from '../chat/language-model.module';
import { RagModule } from '../rag/rag.module';
import { AgentsController } from './agents.controller';
import { AnswerEngine } from './answer-engine.service';
import { CORPUS_CATALOG, PrismaCorpusCatalog } from './corpus-catalog';

@Module({
  imports: [RagModule, LanguageModelModule],
  controllers: [AgentsController],
  providers: [AnswerEngine, { provide: CORPUS_CATALOG, useClass: PrismaCorpusCatalog }],
  exports: [AnswerEngine],
})
export class AgentsModule {}
