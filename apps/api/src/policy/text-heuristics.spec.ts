import { buildRetrievalQuery, isElliptical } from './follow-up';
import { detectLanguage } from './language';
import { maskPii } from './pii';
import { detectSensitiveSituation, isAdministrativeQuestion } from './situations';

describe('detectLanguage', () => {
  it.each([
    ['Comment créer une entreprise au Cameroun ?', 'fr'],
    ["Quels sont mes droits si l'employeur ne paie pas ?", 'fr'],
    ['How do I register a business in Cameroon?', 'en'],
    ['What are my rights if my employer does not pay me?', 'en'],
    ['Bonjour', 'fr'],
    ['12345', 'fr'],
  ])('%s → %s', (text, expected) => {
    expect(detectLanguage(text).language).toBe(expected);
  });

  it('la préférence explicite l’emporte', () => {
    expect(detectLanguage('Comment créer une entreprise ?', 'en')).toMatchObject({
      language: 'en',
      source: 'override',
    });
  });
});

describe('isElliptical', () => {
  it.each([
    'Et pendant un arrêt maladie ?',
    'et pour un étranger ?',
    'Aussi pour les fonctionnaires ?',
    'What about foreigners?',
    'And for a civil servant?',
    'Pourquoi ?',
    'Combien ?',
    'Et si je refuse ?',
  ])('« %s » est une relance', (message) => {
    expect(isElliptical(message)).toBe(true);
  });

  it.each([
    'Comment obtenir un passeport ?',
    'Quel est le salaire minimum ?',
    'How do I get a birth certificate?',
    'Et maintenant, je voudrais savoir comment on crée une société anonyme au Cameroun avec plusieurs associés',
  ])('« %s » est autonome', (message) => {
    expect(isElliptical(message)).toBe(false);
  });
});

describe('buildRetrievalQuery', () => {
  const previous = 'Quels sont mes droits si mon employeur me licencie ?';

  it('ajoute la question précédente à une relance', () => {
    expect(buildRetrievalQuery('Et pendant un arrêt maladie ?', previous)).toEqual({
      query: `${previous}\nEt pendant un arrêt maladie ?`,
      elliptical: true,
      previousQuestionUsed: true,
    });
  });

  it('ne dérive pas vers l’ancien sujet quand la question change', () => {
    expect(buildRetrievalQuery('Comment obtenir un passeport ?', previous)).toEqual({
      query: 'Comment obtenir un passeport ?',
      elliptical: false,
      previousQuestionUsed: false,
    });
  });

  it('sans question précédente, garde le message', () => {
    expect(buildRetrievalQuery('Et ?', undefined).previousQuestionUsed).toBe(false);
  });
});

describe('maskPii', () => {
  it('masque e-mail, téléphone camerounais et numéro de CNI, sans les journaliser', () => {
    const result = maskPii(
      'Je suis Paul, CNI n° 112233445, tél +237 6 99 12 34 56, mail paul.ndi@example.cm. Que faire ?',
    );
    expect(result.text).toBe(
      'Je suis Paul, CNI n° [ID_NUMBER], tél [PHONE], mail [EMAIL]. Que faire ?',
    );
    expect(result.findings).toEqual({ email: 1, phone: 1, id_number: 1 });
    expect(result.total).toBe(3);
  });

  it('masque un numéro local sans indicatif et un passeport alphanumérique', () => {
    const result = maskPii('Appelez le 699123456. Passport number AB1234567.');
    expect(result.text).toBe('Appelez le [PHONE]. Passport number [ID_NUMBER].');
  });

  it('masque un numéro international et une longue suite de chiffres', () => {
    const result = maskPii('Mon frère : +33 6 12 34 56 78 ; dossier 9876543210123');
    expect(result.text).toBe('Mon frère : [PHONE] ; dossier [ID_NUMBER]');
  });

  it('ne touche pas aux références juridiques', () => {
    const text = 'La loi n° 92-007 du 14 août 1992, article 2, et la loi n° 2008-1.';
    expect(maskPii(text)).toEqual({
      text,
      findings: { email: 0, phone: 0, id_number: 0 },
      total: 0,
    });
  });
});

describe('situations', () => {
  it.each([
    ['Mon patron m’a licencié sans motif, puis-je contester ?', 'dismissal_dispute'],
    ['I was unfairly dismissed, can I appeal?', 'dismissal_dispute'],
    ['Mon fils est en garde à vue depuis hier', 'detention'],
    ['Mon mari me bat, je subis des violences', 'violence'],
    ['Ma sœur fait un malaise, urgence médicale', 'health_emergency'],
    ['Je cherche un avocat pour mon dossier', 'lawyer_request'],
    ['Comment obtenir un acte de naissance ?', null],
    ['Violation de mes données personnelles', null],
  ])('%s → %s', (text, expected) => {
    expect(detectSensitiveSituation(text)).toBe(expected);
  });

  it('reconnaît les questions administratives', () => {
    expect(isAdministrativeQuestion('Comment créer une SARL ?')).toBe(true);
    expect(isAdministrativeQuestion('Comment créer une entreprise ?')).toBe(true);
    expect(isAdministrativeQuestion('How do I renew my passport?')).toBe(true);
    expect(isAdministrativeQuestion('Quel temps fait-il ?')).toBe(false);
  });
});
