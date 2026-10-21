import { Controller, Get } from '@nestjs/common';
import { AppService, type HealthStatus } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }

  @Get()
  getWelcome() {
    return {
      message: "🇨🇲 SONAH API - Système d'Orientation Nationale et d'Accompagnement Harmonisé",
      version: '0.1.0',
      status: 'active',
      endpoints: {
        health: '/api/v1/health',
      },
    };
  }
}
