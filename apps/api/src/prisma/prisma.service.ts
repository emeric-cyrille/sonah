import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@sonah/database';

/**
 * Client Prisma partagé. La connexion est établie à la première requête :
 * l'API démarre même si la base est momentanément indisponible.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ log: ['error'] });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.warn(
        `Base de données injoignable : ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
