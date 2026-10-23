import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaTraceStore, TRACE_STORE } from './trace-store';

@Module({
  controllers: [AuditController],
  providers: [AuditService, { provide: TRACE_STORE, useClass: PrismaTraceStore }],
  exports: [AuditService],
})
export class AuditModule {}
