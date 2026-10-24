import { analyzeSmallTalk, smallTalkReply } from './small-talk';

describe('analyzeSmallTalk', () => {
  it.each([
    ['Bonjour', ['greeting']],
    ['bonsoir Sonah !', ['greeting']],
    ['Salut, ça va ?', ['greeting', 'how_are_you']],
    ['merci beaucoup', ['thanks']],
    ['Merci Sonah', ['thanks']],
    ['au revoir', ['goodbye']],
    ['comment tu vas ?', ['how_are_you']],
    ['qui es-tu ?', ['identity']],
    ['Que peux-tu faire ?', ['capabilities']],
    ["j'ai un problème", ['help']],
    ['aide moi svp', ['help']],
    ['ok', ['acknowledgement']],
    ['Hello, who are you?', ['greeting', 'identity']],
    ['thank you so much', ['thanks']],
    ['I need help', ['help']],
  ])('« %s » est un échange de politesse', (message, kinds) => {
    const analysis = analyzeSmallTalk(message);
    expect(analysis.onlySmallTalk).toBe(true);
    expect(analysis.kinds).toEqual(kinds);
  });

  it.each([
    ['Bonjour, je veux faire mon certificat médical', 'je veux faire mon certificat médical'],
    ['Bonsoir Sonah, combien coûte un passeport ?', 'combien coûte un passeport ?'],
    ['Hello, how do I get a birth certificate?', 'how do I get a birth certificate?'],
    ["j'ai perdu ma CNI", "j'ai perdu ma CNI"],
  ])('« %s » est une vraie demande (salutation retirée)', (message, rest) => {
    const analysis = analyzeSmallTalk(message);
    expect(analysis.onlySmallTalk).toBe(false);
    expect(analysis.rest).toBe(rest);
  });
});

describe('smallTalkReply', () => {
  it('salue, se présente et propose des exemples, sans chiffre ni loi', () => {
    const reply = smallTalkReply(['greeting'], 'fr');
    expect(reply).toContain('Bonjour');
    expect(reply).toContain('Sonah');
    expect(reply).toContain('une démarche');
    expect(reply).not.toMatch(/\d|article/i);
  });

  it('répond en anglais', () => {
    expect(smallTalkReply(['thanks'], 'en')).toContain("You're welcome");
  });

  it('demande vague : invite à préciser', () => {
    expect(smallTalkReply(['help'], 'fr')).toContain('Pouvez-vous me dire');
  });
});
