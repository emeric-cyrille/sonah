import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AuditModule } from '../audit/audit.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AgentsModule, AuditModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
