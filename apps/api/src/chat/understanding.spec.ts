import type { LanguageModel } from './language-model';
import { parseUnderstanding, understandMessage } from './understanding';

describe('compréhension par le modèle', () => {
  it('lit le JSON renvoyé, même entouré de texte', () => {
    expect(
      parseUnderstanding('Voici : {"kind":"procedure","query":"Obtenir une carte d’identité"}'),
    ).toEqual({
      kind: 'procedure',
      query: 'Obtenir une carte d’identité',
    });
  });

  it('rejette une réponse invalide ou une démarche sans reformulation', () => {
    expect(parseUnderstanding('pas de json')).toBeNull();
    expect(parseUnderstanding('{"kind":"autre","query":"x"}')).toBeNull();
    expect(parseUnderstanding('{"kind":"rights","query":""}')).toBeNull();
    expect(parseUnderstanding('{"kind":"smalltalk","query":""}')).toEqual({
      kind: 'smalltalk',
      query: '',
    });
  });

  it('modèle en panne : null (les règles déterministes s’appliquent)', async () => {
    const failing: LanguageModel = {
      name: 'm',
      complete: async () => {
        throw new Error('quota');
      },
    };
    await expect(understandMessage(failing, 'mon papier de naissance')).resolves.toBeNull();
  });
});
