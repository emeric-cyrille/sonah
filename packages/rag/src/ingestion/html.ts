const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  laquo: '«',
  raquo: '»',
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  deg: '°',
  euro: '€',
  sect: '§',
  middot: '·',
  bull: '•',
  oelig: 'œ',
  OElig: 'Œ',
  aelig: 'æ',
  szlig: 'ß',
};

const ACCENTED: Record<string, string> = {
  acute: '\u0301',
  grave: '\u0300',
  circ: '\u0302',
  uml: '\u0308',
  cedil: '\u0327',
  tilde: '\u0303',
  ring: '\u030a',
};

function decodeEntity(entity: string): string {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
  }
  if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
  const named = NAMED_ENTITIES[entity];
  if (named) return named;
  // « eacute », « Agrave », « ccedil »… : lettre + diacritique
  const accented = /^([A-Za-z])(acute|grave|circ|uml|cedil|tilde|ring)$/.exec(entity);
  if (accented) return `${accented[1]}${ACCENTED[accented[2] ?? ''] ?? ''}`.normalize('NFC');
  return `&${entity};`;
}

/**
 * Convertit une page HTML/XHTML en texte brut, une ligne par bloc (paragraphe, titre, cellule).
 * Aucun script n'est exécuté : le document n'est traité que comme du texte.
 */
export function htmlToText(html: string): string {
  return (
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|head|nav|noscript)\b[\s\S]*?<\/\1>/gi, '')
      .replace(/<(br|hr)\b[^>]*>/gi, '\n')
      .replace(
        /<\/?(p|div|h[1-6]|li|ul|ol|tr|table|td|th|section|article|blockquote|dd|dt)\b[^>]*>/gi,
        '\n',
      )
      .replace(/<[^>]+>/g, '')
      .replace(/&(#x?[0-9a-fA-F]+|[A-Za-z]+);/g, (_match, entity: string) => decodeEntity(entity))
      .replace(/[ \t\r\f\v\u00a0\u202f]+/g, ' ')
      .replace(/ *\n */g, '\n')
      // Numéro de paragraphe ou de point isolé dans sa cellule (« 1. », « a) ») : recollé à son texte
      .replace(/^(\(?[0-9a-z]{1,3}[.)])\n+(?=\S)/gm, '$1 ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
