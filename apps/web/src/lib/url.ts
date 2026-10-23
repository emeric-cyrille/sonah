/** Décode un segment d'URL sans lever d'erreur sur une séquence % invalide. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
