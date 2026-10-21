import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'healthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || 'dev',
    };
  }
}
