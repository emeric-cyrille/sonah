const PAGE_SEPARATOR = /\n*=====PAGE=====\n*/g;

/**
 * Nettoie le texte extrait d'un PDF :
 * - supprime les séparateurs de pages et les lignes parasites (en-têtes, pieds de page) ;
 * - recolle les mots coupés en fin de ligne (« tra-\nvail » → « travail ») ;
 * - uniformise apostrophes et espaces.
 */
export function normalizeLegalText(raw: string, noisePatterns: readonly string[] = []): string {
  const noise = noisePatterns.map((pattern) => new RegExp(pattern, 'i'));

  const lines = raw
    .replace(PAGE_SEPARATOR, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u02bc\u2018\u2019]/g, "'")
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => !noise.some((regex) => regex.test(line)));

  return lines
    .join('\n')
    .replace(/([a-zà-ÿ])-\n([a-zà-ÿ])/g, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
