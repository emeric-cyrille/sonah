import { chunkLegalText, chunkToEmbeddingText } from './legal-chunker';
import { normalizeLegalText } from './text-normalizer';

const CONSTITUTION_SAMPLE = `LA CONSTITUTION DE LA REPUBLIQUE DU CAMEROUN
PREAMBULE
Le Peuple camerounais,
Proclame que l'être humain possède des droits inaliénables et sacrés ;
TITRE PREMIER
DE L'ETAT ET DE LA SOUVERAINETE
Article premier : (1)- La République Unie du Cameroun prend la dénomination de République du Cameroun.
(2)- La République du Cameroun est un Etat unitaire décentralisé.
Art. 2.- (1)- La souveraineté nationale appartient au peuple camerounais.
TITRE II
DU POUVOIR EXECUTIF
CHAPITRE I
DU PRESIDENT DE LA REPUBLIQUE
Art. 5.- (1-) Le Président de la République est le Chef de l'Etat.
Il veille au respect de la Constitution, comme prévu à
Art. 2 ci-dessus.`;

describe('chunkLegalText', () => {
  const chunks = chunkLegalText('constitution', normalizeLegalText(CONSTITUTION_SAMPLE));

  it('isole le préambule puis un fragment par article', () => {
    expect(chunks.map((chunk) => chunk.reference)).toEqual([
      'Préambule',
      'Article premier',
      'Article 2',
      'Article 5',
    ]);
  });

  it('retire le numéro et le séparateur du début de l’article', () => {
    expect(chunks[1]?.content.startsWith('(1)- La République Unie')).toBe(true);
    expect(chunks[2]?.content.startsWith('(1)- La souveraineté')).toBe(true);
  });

  it('conserve la hiérarchie titres › chapitres avec leurs intitulés', () => {
    expect(chunks[1]?.path).toEqual(["Titre PREMIER - De l'etat et de la souverainete"]);
    expect(chunks[3]?.path).toEqual([
      'Titre II - Du pouvoir executif',
      'Chapitre I - Du president de la republique',
    ]);
  });

  it('ne prend pas un renvoi (« Art. 2 ci-dessus ») pour un nouvel article', () => {
    expect(chunks[3]?.content).toContain('Art. 2 ci-dessus.');
    expect(chunks.filter((chunk) => chunk.articleNumber === '2')).toHaveLength(1);
  });

  it('produit des clés stables et uniques', () => {
    expect(chunks.map((chunk) => chunk.key)).toEqual([
      'constitution:preambule:1',
      'constitution:art-1:1',
      'constitution:art-2:1',
      'constitution:art-5:1',
    ]);
  });

  it('reconnaît le format « Art.12.- » et la coquille « Art.- 78.- »', () => {
    const result = chunkLegalText(
      'code',
      'Titre 1 - Dispositions générales\nArt.12.- 1) Premier alinéa.\nArt.- 78.- 1) Est considérée comme économat.',
      { preambleLabel: null },
    );
    expect(result.map((chunk) => chunk.articleNumber)).toEqual(['12', '78']);
    expect(result[0]?.path).toEqual(['Titre 1 - Dispositions générales']);
  });

  it('découpe les articles trop longs en parties numérotées', () => {
    const paragraphs = Array.from(
      { length: 12 },
      (_, i) => `${i + 1}) ${'Disposition très détaillée. '.repeat(8)}`,
    );
    const result = chunkLegalText('code', `Art.40.- ${paragraphs.join('\n')}`, {
      preambleLabel: null,
      maxChars: 600,
    });
    expect(result.length).toBeGreaterThan(1);
    expect(result.every((chunk) => chunk.content.length <= 600)).toBe(true);
    expect(result.map((chunk) => `${chunk.part}/${chunk.totalParts}`)).toEqual(
      result.map((_, i) => `${i + 1}/${result.length}`),
    );
  });

  it('ignore les lignes de sommaire', () => {
    const result = chunkLegalText(
      'code',
      'Titre 3 - Du contrat de travail ..........5\nArt.1.- Texte.',
      {
        preambleLabel: 'Préambule',
      },
    );
    expect(result.map((chunk) => chunk.reference)).toEqual(['Article 1']);
  });
});

describe('normalizeLegalText', () => {
  it('recolle les mots coupés, retire en-têtes et séparateurs de pages', () => {
    const raw =
      'www.Droit-Afrique.com Cameroun\nLe tra-\nvail forcé\n=====PAGE=====\nCode du travail 3/31\nest interdit ʼici';
    expect(
      normalizeLegalText(raw, ['^www\\.Droit-Afrique\\.com', '^Code du travail \\d+/\\d+$']),
    ).toBe("Le travail forcé\nest interdit 'ici");
  });
});

describe('chunkToEmbeddingText', () => {
  it('préfixe le contenu par son contexte', () => {
    const [chunk] = chunkLegalText(
      'code',
      'Titre 4 - Du salaire\nArt.61.- Le salaire est payé en monnaie.',
      {
        preambleLabel: null,
      },
    );
    expect(chunk && chunkToEmbeddingText(chunk, 'Code du travail')).toBe(
      'Code du travail › Titre 4 - Du salaire › Article 61\nLe salaire est payé en monnaie.',
    );
  });
});
