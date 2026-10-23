import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

export interface RateLimitPolicy {
  /** Compteur partagé par les routes du même groupe (ex. « chat »). */
  readonly bucket: string;
  readonly limit: number;
  readonly windowMs: number;
}

const RATE_LIMIT_KEY = 'sonah:rate-limit';

/** Limites par défaut, par adresse IP et par minute. */
export const RATE_LIMITS = {
  chat: { bucket: 'chat', limit: 10, windowMs: 60_000 },
  search: { bucket: 'search', limit: 30, windowMs: 60_000 },
  scenarios: { bucket: 'scenarios', limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;

/** Applique une limite de débit à une route ou à un contrôleur. */
export const RateLimit = (policy: RateLimitPolicy) => SetMetadata(RATE_LIMIT_KEY, policy);

/** Au-delà, les clés les plus anciennes sont purgées pour borner la mémoire. */
const MAX_TRACKED_KEYS = 10_000;

/**
 * Fenêtre glissante en mémoire : on conserve l'horodatage des requêtes de chaque (groupe, IP)
 * sur la fenêtre, et on refuse au-delà de la limite (429 + Retry-After).
 * Suffisant pour une instance unique ; plusieurs instances demanderaient un stockage partagé.
 */
export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly now: () => number = Date.now) {}

  /** Enregistre une requête ; renvoie le délai d'attente (ms) si elle est refusée, sinon 0. */
  consume(
    key: string,
    policy: RateLimitPolicy,
  ): { allowed: boolean; retryAfterMs: number; remaining: number } {
    const now = this.now();
    const windowStart = now - policy.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    if (recent.length >= policy.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      return { allowed: false, retryAfterMs: oldest + policy.windowMs - now, remaining: 0 };
    }
    recent.push(now);
    this.hits.delete(key);
    this.hits.set(key, recent);
    if (this.hits.size > MAX_TRACKED_KEYS) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey !== undefined) this.hits.delete(oldestKey);
    }
    return { allowed: true, retryAfterMs: 0, remaining: policy.limit - recent.length };
  }

  reset(): void {
    this.hits.clear();
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  readonly limiter = new SlidingWindowLimiter();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<RateLimitPolicy | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!policy) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    // Derrière le proxy (Traefik), req.ip vient de X-Forwarded-For grâce à « trust proxy »
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const result = this.limiter.consume(`${policy.bucket}:${ip}`, policy);

    response.setHeader('X-RateLimit-Limit', String(policy.limit));
    response.setHeader('X-RateLimit-Remaining', String(result.remaining));
    if (!result.allowed) {
      const seconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
      response.setHeader('Retry-After', String(seconds));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Trop de requêtes : réessayez dans quelques instants',
          retryAfter: seconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
