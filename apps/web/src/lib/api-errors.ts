import type { Dictionary } from '@/i18n/dictionaries';
import {
  ApiNotFoundError,
  ApiRateLimitError,
  ApiUnavailableError,
  ApiValidationError,
} from './api-client';

/** Erreur d'API sérialisable, traduite au moment de l'affichage. */
export type ApiErrorKind =
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'rate-limited'; readonly retryAfterSeconds?: number }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'generic' };

export function toApiErrorKind(error: unknown): ApiErrorKind {
  if (error instanceof ApiRateLimitError) {
    return { kind: 'rate-limited', retryAfterSeconds: error.retryAfterSeconds };
  }
  if (error instanceof ApiUnavailableError) return { kind: 'unavailable' };
  if (error instanceof ApiNotFoundError) return { kind: 'not-found' };
  if (error instanceof ApiValidationError) return { kind: 'invalid' };
  return { kind: 'generic' };
}

export function describeApiError(error: ApiErrorKind, dict: Dictionary): string {
  switch (error.kind) {
    case 'rate-limited':
      return error.retryAfterSeconds !== undefined
        ? dict.common.rateLimited(error.retryAfterSeconds)
        : dict.common.rateLimitedNoDelay;
    case 'unavailable':
      return dict.common.unavailable;
    case 'not-found':
      return dict.common.notFound;
    case 'invalid':
      return dict.common.invalidResponse;
    default:
      return dict.common.genericError;
  }
}
