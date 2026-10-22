import { PrismaClient } from '../generated/client';

export { Prisma, PrismaClient } from '../generated/client';
export type * from '../generated/client';

/** Crée un client Prisma configuré pour SONAH. */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}
