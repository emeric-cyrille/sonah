import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { RagModule } from '../rag/rag.module';
import { HealthController } from './health.controller';

@Module({
  imports: [RagModule, ChatModule],
  controllers: [HealthController],
})
export class HealthModule {}
