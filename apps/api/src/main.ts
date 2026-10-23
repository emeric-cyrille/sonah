import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Derrière Traefik : l'adresse du client (limitation de débit) vient de X-Forwarded-For
  app.set('trust proxy', 1);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');

  const port = Number(process.env.API_PORT) || 4000;
  await app.listen(port);

  logger.log(`SONAH API listening on http://localhost:${port}/api/v1`);
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error(
    'Failed to start SONAH API',
    error instanceof Error ? error.stack : error,
  );
  process.exit(1);
});
