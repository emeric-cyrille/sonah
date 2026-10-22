import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { Env } from '../config/env';

/** Protège les routes d'administration par l'en-tête « x-admin-token ». */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('ADMIN_TOKEN', { infer: true });
    if (!expected) throw new ForbiddenException('Ajout de documents désactivé sur ce serveur');

    const provided = context.switchToHttp().getRequest<Request>().header('x-admin-token') ?? '';
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new ForbiddenException('Jeton d’administration invalide');
    return true;
  }
}
