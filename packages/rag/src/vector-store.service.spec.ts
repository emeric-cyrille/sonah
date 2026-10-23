import { htmlToText } from './ingestion/html';
import { extractQueryTerms, reciprocalRankFusion, RRF_K } from './vector-store.service';

describe('reciprocalRankFusion', () => {
  it('additionne 1 / (k + rang) et favorise les documents présents dans les deux classements', () => {
    const fused = reciprocalRankFusion([
      ['a', 'b', 'c'],
      ['c', 'd'],
    ]);
    expect(fused[0]?.id).toBe('c');
    expect(fused[0]?.score).toBeCloseTo(1 / (RRF_K + 3) + 1 / (RRF_K + 1));
    expect(fused.map((entry) => entry.id)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('gère des classements vides', () => {
    expect(reciprocalRankFusion([[], []])).toEqual([]);
  });
});

describe('extractQueryTerms', () => {
  it('sépare les mots et les références numériques', () => {
    expect(extractQueryTerms("Que dit l'article 12 de la loi n° 2010/012 ?")).toEqual({
      words: ['que', 'dit', 'article', 'de', 'la', 'loi'],
      numbers: ['12', '2010/012'],
    });
  });

  it('ne laisse passer aucun opérateur tsquery', () => {
    const { words, numbers } = extractQueryTerms("salaire' | !minimum & (x) <-> 96-06:*");
    for (const term of [...words, ...numbers]) expect(term).toMatch(/^[\p{L}\p{N}/-]+$/u);
    expect(numbers).toEqual(['96-06']);
  });
});

describe('htmlToText', () => {
  it('extrait le texte des blocs, décode les entités et ignore scripts et styles', () => {
    const html =
      '<html><head><title>x</title><script>alert(1)</script></head><body><p class="ti">Article&nbsp;50</p>' +
      '<p>Obligations de transparence &eacute;tendues &#8217;IA&#x2019;</p><table><tr><td>1.</td><td>Les fournisseurs</td></tr></table></body></html>';
    expect(htmlToText(html)).toBe(
      'Article 50\n\nObligations de transparence étendues ’IA’\n\n1. Les fournisseurs',
    );
  });
});
