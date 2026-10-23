import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AuditModule } from '../audit/audit.module';
import { ScenarioEngine } from './scenario-engine.service';
import { PrismaScenarioRunRepository, SCENARIO_RUN_REPOSITORY } from './scenario-run.repository';
import { ScenariosController } from './scenarios.controller';

@Module({
  imports: [AgentsModule, AuditModule],
  controllers: [ScenariosController],
  providers: [
    ScenarioEngine,
    { provide: SCENARIO_RUN_REPOSITORY, useClass: PrismaScenarioRunRepository },
  ],
})
export class ScenariosModule {}
