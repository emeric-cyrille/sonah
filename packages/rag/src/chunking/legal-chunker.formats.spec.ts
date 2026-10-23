import { sliceSegment } from '../ingestion/source-text';
import { chunkLegalText } from './legal-chunker';
import { normalizeLegalText } from './text-normalizer';

/**
 * Cas réel : le PDF FAOLEX de la Constitution de 1996 se termine par la loi n° 2008/001 qui la modifie.
 * Sans frontière de texte, l'ancien découpeur rattachait toute la loi de 2008 à l'article 69
 * (les numéros 6, 14, 15… étant inférieurs à 69, ils passaient pour des renvois).
 */
const CONSTITUTION_WITH_ANNEXED_LAW = `TITRE II
DU POUVOIR EXECUTIF
Art. 6.- (1) Le Président de la République est élu au suffrage universel direct.
(2) Le Président de la République est élu pour un mandat de sept (7) ans renouvelable une fois.
Art. 68.- La législation reste en vigueur.
Art. 69.- La présente loi sera enregistrée et publiée au journal officiel.
Yaoundé, le 18 janvier 1996
LOI N°2008/001 DU 14 AVRIL 2008MODIFIANT ET COMPLETANT
CERTAINES DISPOSITIONS DE LA LOI N° 96/06 du 18 JANVIER 1996
ART 1
er
. –Les dispositions des articles 6 (2) et 4, 53 de la loi n°96/06 sont modifiées ainsi qu'il suit :
ART 6 -(2) (nouveau) ; Le président de la République est élu pour un mandat de
sept (07) ans. Il est rééligible.
TITRE VIII- DE LA HAUTE COUR DE JUSTICE
Art 53 : (nouveau).
(1)- La Haute cour de justice est compétente pour juger les actes accomplis.
Art 2-La présente loi sera enregistrée, publiée suivant la procédure d'urgence.`;

describe('frontière d’un texte modificatif annexé (Constitution + loi n° 2008/001)', () => {
  const text = normalizeLegalText(CONSTITUTION_WITH_ANNEXED_LAW);
  const constitution = chunkLegalText(
    'constitution-1996',
    sliceSegment(text, { end: '^LOI N°\\s*2008/001' }),
    { preambleLabel: null },
  );
  const amendment = chunkLegalText(
    'constitution-2008-amendment',
    sliceSegment(text, { start: '^LOI N°\\s*2008/001' }),
    { preambleLabel: null, amendedArticles: ['6', '53'] },
  );

  it('l’article 69 ne contient plus la loi de 2008', () => {
    const article69 = constitution.find((chunk) => chunk.articleNumber === '69');
    expect(article69?.content).not.toContain('rééligible');
    expect(article69?.content).not.toContain('LOI N°2008');
    expect(constitution.map((chunk) => chunk.reference)).toEqual([
      'Article 6',
      'Article 68',
      'Article 69',
    ]);
  });

  it('indexe la loi modificative avec ses propres articles et les nouvelles rédactions', () => {
    expect(amendment.map((chunk) => [chunk.key, chunk.reference])).toEqual([
      ['constitution-2008-amendment:art-1:1', 'Article premier'],
      ['constitution-2008-amendment:art-6-nouveau:1', 'Article 6 (nouveau)'],
      ['constitution-2008-amendment:art-53-nouveau:1', 'Article 53 (nouveau)'],
      ['constitution-2008-amendment:art-2:1', 'Article 2'],
    ]);
    const article6 = amendment.find((chunk) => chunk.unitId === '6-nouveau');
    expect(article6?.amendsArticle).toBe('6');
    expect(article6?.content).toContain('Il est rééligible.');
    expect(amendment.find((chunk) => chunk.unitId === '53-nouveau')?.path).toEqual([
      'Titre VIII - DE LA HAUTE COUR DE JUSTICE',
    ]);
  });

  it('sans liste d’articles modifiés, l’article 2 de la loi serait pris pour un renvoi', () => {
    const naive = chunkLegalText('x', sliceSegment(text, { start: '^LOI N°\\s*2008/001' }), {
      preambleLabel: null,
    });
    expect(naive.map((chunk) => chunk.reference)).toEqual([
      'Article premier',
      'Article 6',
      'Article 53',
    ]);
    expect(naive[2]?.content).toContain('La présente loi sera enregistrée');
  });
});

describe('formats d’articles', () => {
  it('reconnaît les en-têtes coupés par l’extraction et les séparateurs « __ », « .-(nouveau) »', () => {
    const text = normalizeLegalText(
      'ARTICLE 1\ner\n.- Objet de la loi.\nARTICLE 10\n.- (nouveau) Texte dix.\nARTICLE34.- (nouveau) Texte.\n« ARTICLE 35.-(nouveau) Suite.',
    );
    expect(chunkLegalText('x', text, { preambleLabel: null }).map((c) => c.articleNumber)).toEqual([
      '1',
      '10',
      '34',
      '35',
    ]);
  });

  it('style anglais « Section 12: » avec hiérarchie PART / CHAPTER', () => {
    const chunks = chunkLegalText(
      'labour',
      'PART I - GENERAL PROVISIONS\nSection 1: (1) This law shall govern.\nSection 2 : (1) The right to work.\nSection 1 above applies.\nCHAPTER I - TRADE UNIONS\nSection 3: Unions.',
      { articleStyle: 'en-section', preambleLabel: null, language: 'en' },
    );
    expect(chunks.map((c) => c.reference)).toEqual(['Section 1', 'Section 2', 'Section 3']);
    expect(chunks[1]?.content).toContain('Section 1 above applies.');
    expect(chunks[2]?.path).toEqual(['Part I - GENERAL PROVISIONS', 'Chapter I - TRADE UNIONS']);
  });

  it('version anglaise de la Constitution : « Article 2. (1) », renvois ignorés', () => {
    const chunks = chunkLegalText(
      'c-en',
      'Article 1. (1) The Republic.\nArticle 2. (1) Sovereignty.\nArticle 1 above.\nArticle 3. Parties.',
      { preambleLabel: null, language: 'en' },
    );
    expect(chunks.map((c) => c.articleNumber)).toEqual(['1', '2', '3']);
  });

  it('style « Article 50 » seul sur sa ligne (JO de l’UE) et annexes', () => {
    const chunks = chunkLegalText(
      'eu',
      'CHAPITRE IV\nOBLIGATIONS DE TRANSPARENCE\nArticle 50\nObligations de transparence\n1. Les fournisseurs veillent...\nconformément à l’article 6\nArticle 51\nClassification\nANNEXE III\nSystèmes d’IA à haut risque',
      { articleStyle: 'line', preambleLabel: null, unitPatterns: ['^ANNEXE [IVXLC]+$'] },
    );
    expect(chunks.map((c) => [c.key, c.reference])).toEqual([
      ['eu:art-50:1', 'Article 50'],
      ['eu:art-51:1', 'Article 51'],
      ['eu:annexe-iii:1', 'Annexe III'],
    ]);
    expect(chunks[0]?.path).toEqual(['Chapitre IV - Obligations de transparence']);
    expect(chunks[2]?.path).toEqual([]);
  });

  it('ignore une page répétée (numéro d’article déjà vu)', () => {
    const chunks = chunkLegalText(
      'x',
      'ARTICLE 74.- Textes particuliers.\nARTICLE 75.- Enregistrement.\nARTICLE 75.- Enregistrement.',
      { preambleLabel: null },
    );
    expect(chunks.map((c) => c.key)).toEqual(['x:art-74:1', 'x:art-75:1']);
  });

  it('renseigne la page de chaque article à partir des marqueurs de page', () => {
    const text = normalizeLegalText(
      'Art. 1.- Premier.\n=====PAGE=====\nsuite du premier\nArt. 2.- Second.',
      [],
      { keepPageMarkers: true },
    );
    const chunks = chunkLegalText('x', text, { preambleLabel: null });
    expect(chunks.map((c) => [c.articleNumber, c.pageStart, c.pageEnd])).toEqual([
      ['1', 1, 2],
      ['2', 2, 2],
    ]);
    expect(chunks[0]?.content).toBe('Premier.\nsuite du premier');
  });
});

describe('textes sans articles', () => {
  it('paragraphes numérotés (recommandation) : suite stricte 1, 2, 3', () => {
    const chunks = chunkLegalText(
      'unesco',
      'Preamble text\nI. SCOPE\n1. This Recommendation addresses ethics.\n2. It covers:\n1. a list item\n3. Member States should act.',
      {
        mode: 'numbered-paragraphs',
        preambleLabel: 'Preamble',
        headingPatterns: ['^[IVX]+\\. '],
        language: 'en',
      },
    );
    expect(chunks.map((c) => c.reference)).toEqual([
      'Preamble',
      'Paragraph 1',
      'Paragraph 2',
      'Paragraph 3',
    ]);
    expect(chunks[2]?.content).toContain('1. a list item');
    expect(chunks[1]?.path).toEqual(['I. SCOPE']);
  });

  it('sections (stratégie) : un fragment par intitulé, petites sections regroupées', () => {
    const body = 'Texte de la section suffisamment long pour être conservé seul. '.repeat(5);
    const chunks = chunkLegalText(
      'strat',
      `Intro\n1. Introduction\n${body}\n1.1 Vision\nCourt.\n2. Gouvernance\n${body}`,
      { mode: 'sections', preambleLabel: null, unitPatterns: ['^\\d+(\\.\\d+)*\\.? [A-Z]'] },
    );
    expect(chunks.map((c) => c.reference)).toEqual(['1. Introduction', '2. Gouvernance']);
    expect(chunks[0]?.content).toContain('1.1 Vision\nCourt.');
    expect(chunks.map((c) => c.key)).toEqual(['strat:s-1:1', 'strat:s-3:1']);
  });
});

describe('normalizeLegalText', () => {
  it('garde le trait d’union des mots composés coupés en fin de ligne', () => {
    expect(normalizeLegalText('visé ci-\ndessus et la tra-\nvail')).toBe(
      'visé ci-dessus et la travail',
    );
  });

  it('applique les corrections d’extraction déclarées dans le manifeste', () => {
    expect(
      normalizeLegalText('TTITRE XIII', [], {
        replacements: [{ pattern: '^TTITRE', replacement: 'TITRE' }],
      }),
    ).toBe('TITRE XIII');
  });

  it('les motifs de bruit sont sensibles à la casse (tampons en capitales)', () => {
    expect(
      normalizeLegalText('COPIE CERTIFIEE CONFORME\ncopie conforme du texte', ['CONFORME$']),
    ).toBe('copie conforme du texte');
  });
});
