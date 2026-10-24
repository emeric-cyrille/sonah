import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AuditModule } from '../audit/audit.module';
import { LanguageModelModule } from './language-model.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AgentsModule, AuditModule, LanguageModelModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
