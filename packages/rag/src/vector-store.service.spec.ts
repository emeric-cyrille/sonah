import { htmlToText } from './ingestion/html';
import {
  extractQueryTerms,
  hasExplicitReference,
  reciprocalRankFusion,
  RRF_K,
} from './vector-store.service';

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

describe('hasExplicitReference', () => {
  it.each([
    'Que dit l’article 12 de la Constitution ?',
    'What does Section 28 of the Labour Code say?',
    'Article premier de la Constitution',
    'art. 47 bis',
    'Loi n° 2010/012 relative à la cybersécurité',
    'Law No. 92/007 of 14 August 1992',
    'loi 96-06',
    'décret n°2017/0877',
  ])('« %s » cite une référence', (query) => {
    expect(hasExplicitReference(query)).toBe(true);
  });

  it.each([
    'How long is the probation period for a worker in Cameroon?',
    'Combien de jours de congé payé par an ?',
    'Quelle équipe a gagné la Coupe d’Afrique des Nations 2017 ?',
    'What does French law say about the 35-hour working week?',
    'Né le 12/03/1985, mon employeur ne me paie plus',
  ])('« %s » est une question en langage naturel', (query) => {
    expect(hasExplicitReference(query)).toBe(false);
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
