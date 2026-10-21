import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it('reports a healthy status with an ISO timestamp', () => {
    const health = controller.getHealth();

    expect(health.status).toBe('healthy');
    expect(Number.isNaN(Date.parse(health.timestamp))).toBe(false);
    expect(health.uptime).toBeGreaterThanOrEqual(0);
  });
});
