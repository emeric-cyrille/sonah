import { HttpException, type Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * Journalise une erreur d'infrastructure (base, modèle) et la convertit en 503 :
 * le frontend affiche alors un message « service momentanément indisponible ».
 * Les erreurs HTTP déjà typées sont propagées telles quelles.
 */
export function rethrowAsUnavailable(error: unknown, logger: Logger, action: string): never {
  if (error instanceof HttpException) throw error;
  logger.error(`Échec : ${action}`, error instanceof Error ? error.stack : String(error));
  throw new ServiceUnavailableException('Service momentanément indisponible');
}
