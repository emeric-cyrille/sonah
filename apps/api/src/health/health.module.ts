import { Module } from '@nestjs/common';
import { LanguageModelModule } from '../chat/language-model.module';
import { RagModule } from '../rag/rag.module';
import { HealthController } from './health.controller';

@Module({
  imports: [RagModule, LanguageModelModule],
  controllers: [HealthController],
})
export class HealthModule {}
