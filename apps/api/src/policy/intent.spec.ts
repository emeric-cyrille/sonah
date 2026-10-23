import { classifyIntent, type Intent } from './intent';

const CASES: ReadonlyArray<[string, Intent]> = [
  // Démarches (français)
  ['je veux faire mon certificat médical', 'procedure'],
  ['Je voudrais obtenir un acte de naissance', 'procedure'],
  ['comment renouveler mon passeport', 'procedure'],
  ["j'ai perdu ma CNI", 'procedure'],
  ['Comment obtenir un extrait de casier judiciaire ?', 'procedure'],
  ['Où faire légaliser mes diplômes ?', 'procedure'],
  ['Quelles pièces pour le permis de conduire ?', 'procedure'],
  ['Combien coûte la carte nationale d’identité ?', 'procedure'],
  ['Je dois déclarer la naissance de mon fils', 'procedure'],
  ['Comment créer une entreprise au Cameroun ?', 'procedure'],
  ['Je souhaite demander un certificat de nationalité', 'procedure'],
  ['Mon passeport est expiré, que faire ?', 'procedure'],
  ['On m’a volé mon permis de conduire', 'procedure'],
  ['Quel est le délai pour obtenir un passeport ?', 'procedure'],
  ['certificat médical', 'procedure'],
  ["J'ai besoin d'un acte de mariage", 'procedure'],
  ['Comment se faire délivrer une carte grise ?', 'procedure'],
  ['Où déposer mon dossier de titre foncier ?', 'procedure'],
  ['Puis-je obtenir un passeport en urgence ?', 'procedure'],
  ['Quels documents à fournir pour immatriculer ma société ?', 'procedure'],
  ['Je veux renouveler ma CNI', 'procedure'],
  ['Comment avoir mon NIU ?', 'procedure'],
  // Démarches (anglais)
  ['how do I get a birth certificate', 'procedure'],
  ['How can I renew my passport?', 'procedure'],
  ['I lost my ID card', 'procedure'],
  ['Where can I apply for a driving licence?', 'procedure'],
  ['What documents do I need for a business registration?', 'procedure'],
  ['How much does a passport cost?', 'procedure'],
  ['I need to register my company', 'procedure'],
  ['How to obtain a criminal record certificate', 'procedure'],
  // Droits (français)
  ['mon employeur peut-il me licencier', 'rights'],
  ['Ai-je le droit de refuser des heures supplémentaires ?', 'rights'],
  ['Est-ce légal de travailler à 14 ans ?', 'rights'],
  ['Le travail forcé est-il autorisé ? Que dit la loi ?', 'rights'],
  ['Quelle est la sanction pour la diffusion de données personnelles ?', 'rights'],
  ['Mon bailleur a-t-il le droit de garder ma caution ?', 'rights'],
  ['Quelle est la durée du mandat présidentiel ?', 'rights'],
  ['Quels sont mes droits en cas de licenciement ?', 'rights'],
  // Droits (anglais)
  ['Am I entitled to paid leave?', 'rights'],
  ['Can my employer fire me without notice?', 'rights'],
  ['Is it legal to record a phone call in Cameroon?', 'rights'],
  // Mixtes
  [
    'Mon employeur peut-il refuser de me donner mon certificat de travail, et comment l’obtenir ?',
    'mixed',
  ],
  ['Comment obtenir un passeport et est-il obligatoire pour voyager ?', 'mixed'],
  // Hors sujet
  ['Donne-moi la recette du ndolé', 'out_of_scope'],
  ['Qui va gagner la CAN 2027 ?', 'out_of_scope'],
  ['Quel temps fera-t-il demain à Douala ?', 'out_of_scope'],
  ['Raconte-moi une blague', 'out_of_scope'],
  ['What is the weather in Yaoundé?', 'out_of_scope'],
];

describe('classifyIntent', () => {
  it.each(CASES)('« %s » → %s', (message, expected) => {
    expect(classifyIntent(message).intent).toBe(expected);
  });

  it('couvre au moins 40 cas français et anglais', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(40);
  });

  it('relève les indices utilisés (trace d’audit)', () => {
    const result = classifyIntent("j'ai perdu ma CNI");
    expect(result.signals).toEqual(expect.arrayContaining(['procedure:perte', 'object:cni']));
    expect(classifyIntent('Raconte-moi une blague').signals).toEqual(['off_topic:entertainment']);
  });
});
