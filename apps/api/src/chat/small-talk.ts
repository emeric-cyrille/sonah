import type { Language } from '../policy/policy.types';
import { foldForKeywords } from '../policy/text';

/**
 * Échanges de politesse et demandes vagues : Sonah y répond comme une personne, sans rechercher
 * de texte ni citer de loi. Détection déterministe (pas d'appel au modèle).
 */
export type SmallTalkKind =
  | 'greeting'
  | 'thanks'
  | 'goodbye'
  | 'how_are_you'
  | 'identity'
  | 'capabilities'
  | 'help'
  | 'acknowledgement';

export interface SmallTalkAnalysis {
  /** Formules reconnues (dans l'ordre d'apparition). */
  readonly kinds: readonly SmallTalkKind[];
  /** Vrai si le message ne contient que de la politesse ou une demande vague. */
  readonly onlySmallTalk: boolean;
  /** Le message sans les formules de politesse en tête (« Bonjour, je veux… » → « je veux… »). */
  readonly rest: string;
}

const GREETING =
  /^(bonjour|bonsoir|salut|coucou|hello|hi|hey|yo|bjr|slt|cc|good (morning|afternoon|evening)|bonne (journee|soiree|matinee)|mbolo|on dit quoi|bienvenue)\b/;
const NAME = /^(sonah|cher sonah|chere sonah)\b/;
const POLITENESS =
  /^(s il (te|vous) plait|svp|stp|please|pls|merci d avance|excusez moi|excuse moi|pardon|sorry|madame|monsieur|mr|mme)\b/;

/** Messages entiers (après retrait des salutations) reconnus comme simple échange. */
const WHOLE: ReadonlyArray<[SmallTalkKind, RegExp]> = [
  [
    'thanks',
    /^(merci|mercii+|thanks|thank you|thx|ty|merci beaucoup|merci bien|merci infiniment|thank you (so|very) much|grand merci)( (beaucoup|bien|sonah|a toi|a vous|encore))*$/,
  ],
  [
    'goodbye',
    /^(au revoir|a bientot|a plus|a plus tard|bye|bye bye|goodbye|good bye|bonne nuit|ciao|see you|see you soon|a la prochaine|on se dit a plus)$/,
  ],
  [
    'how_are_you',
    /^((comment )?(ca va|tu vas|vas tu|allez vous|vous allez)( bien)?|comment (tu vas|vas tu|allez vous|ca se passe)|how are you( doing)?|how is it going|how s it going|tu vas bien|vous allez bien|la forme|on dit quoi)$/,
  ],
  [
    'identity',
    /^(qui es tu|qui etes vous|tu es qui|vous etes qui|c est quoi sonah|qu est ce que sonah|t es qui|who are you|what are you|what is sonah|tu t appelles comment|comment tu t appelles|ton nom|quel est ton nom|what s your name|what is your name)$/,
  ],
  [
    'capabilities',
    /^(que (peux|sais) tu faire|qu est ce que tu (peux|sais) faire|tu (peux|sais) faire quoi|que pouvez vous faire|a quoi (tu sers|sers tu|servez vous)|comment (ca|tu|vous) (marche|marches|fonctionne|fonctionnes)|what can you do|how does (it|this|sonah) work|how can you help( me)?|comment peux tu m aider|comment pouvez vous m aider|tu peux m aider|pouvez vous m aider|can you help( me)?)$/,
  ],
  [
    'help',
    /^((aide|aidez|help)( moi| me| nous)?|au secours|j ai (un|des|une) (probleme|souci|soucis|question|questions|difficulte|difficultes)|j ai besoin d aide|j ai besoin de toi|j ai besoin de vous|je ne sais pas (quoi|comment) faire|i need help|i have a (problem|question)|i need your help|je suis perdu|je suis perdue|i m lost|aide stp|help please)$/,
  ],
  [
    'acknowledgement',
    /^(ok|okay|okk|d accord|daccord|dac|parfait|super|cool|top|genial|bien|tres bien|compris|entendu|ah ok|ah d accord|oui|non|yes|no|yep|nope|great|perfect|got it|understood|merci ok)$/,
  ],
];

function clean(text: string): string {
  return foldForKeywords(text)
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Analyse les formules de politesse d'un message. Fonction pure. */
export function analyzeSmallTalk(message: string): SmallTalkAnalysis {
  const kinds: SmallTalkKind[] = [];
  let folded = clean(message);

  // Retire en tête salutations, nom de l'assistant et formules de politesse, dans n'importe quel ordre
  for (let guard = 0; guard < 6; guard += 1) {
    const greeting = GREETING.exec(folded);
    const name = NAME.exec(folded);
    const politeness = POLITENESS.exec(folded);
    const match = greeting ?? name ?? politeness;
    if (!match) break;
    if (greeting && !kinds.includes('greeting')) kinds.push('greeting');
    folded = folded.slice(match[0].length).trim();
  }
  // Formule de politesse en fin de message (« …, merci », « …, svp »)
  folded = folded.replace(/( (s il (te|vous) plait|svp|stp|please|merci|sonah))+$/, '').trim();

  if (folded.length === 0) return { kinds, onlySmallTalk: kinds.length > 0, rest: '' };

  for (const [kind, pattern] of WHOLE) {
    if (pattern.test(folded)) {
      kinds.push(kind);
      return { kinds, onlySmallTalk: true, rest: '' };
    }
  }
  // Demande réelle : on garde le texte d'origine sans la salutation en tête
  return { kinds, onlySmallTalk: false, rest: stripLeadingGreeting(message) };
}

/** Retire la salutation en tête du texte d'origine (accents et casse conservés). */
function stripLeadingGreeting(message: string): string {
  const stripped = message
    .replace(
      /^\s*((bonjour|bonsoir|salut|coucou|hello|hi|hey|good (morning|afternoon|evening)|bonne (journée|journee|soirée|soiree))\b[\s,!.:;-]*)+/i,
      '',
    )
    .replace(/^\s*(sonah)\b[\s,!.:;-]*/i, '')
    .trim();
  return stripped.length > 0 ? stripped : message;
}

const EXAMPLES: Record<Language, string> = {
  fr:
    '- **une démarche** : carte d’identité, passeport, acte de naissance, certificat médical, casier judiciaire, créer une entreprise…\n' +
    '- **vos droits** : travail (congés, licenciement, salaire), Constitution, données personnelles…',
  en:
    '- **an administrative procedure**: ID card, passport, birth certificate, medical certificate, criminal record, starting a business…\n' +
    '- **your rights**: work (leave, dismissal, wages), the Constitution, personal data…',
};

/** Réponse chaleureuse à un échange de politesse ou à une demande vague. */
export function smallTalkReply(kinds: readonly SmallTalkKind[], language: Language): string {
  const fr = language === 'fr';
  const has = (kind: SmallTalkKind): boolean => kinds.includes(kind);
  const parts: string[] = [];

  if (has('greeting')) parts.push(fr ? 'Bonjour ! 😊' : 'Hello! 😊');
  if (has('how_are_you'))
    parts.push(
      fr ? 'Je vais très bien, merci de demander.' : "I'm doing great, thanks for asking.",
    );

  if (has('thanks')) {
    parts.push(
      fr
        ? 'Avec plaisir ! Si vous avez une autre question sur une démarche ou sur vos droits, je suis là.'
        : "You're welcome! If you have another question about a procedure or your rights, I'm here.",
    );
    return parts.join(' ');
  }
  if (has('goodbye')) {
    parts.push(
      fr
        ? 'Au revoir et bon courage dans vos démarches ! Revenez quand vous voulez.'
        : 'Goodbye and good luck with your procedures! Come back anytime.',
    );
    return parts.join(' ');
  }
  if (has('acknowledgement') && !has('greeting')) {
    return fr
      ? 'Très bien. Dites-moi si je peux vous aider pour autre chose : une démarche, ou une question sur vos droits.'
      : 'Alright. Let me know if I can help with anything else: a procedure, or a question about your rights.';
  }
  if (has('help')) {
    parts.push(
      fr
        ? 'Je suis là pour vous aider. Pouvez-vous me dire en quelques mots de quoi il s’agit ? Par exemple :'
        : "I'm here to help. Can you tell me in a few words what it is about? For example:",
    );
    parts.push(`\n\n${EXAMPLES[language]}`);
    return parts.join(' ');
  }

  parts.push(
    fr
      ? 'Je suis Sonah, votre assistant pour les démarches administratives et vos droits au Cameroun. Je peux vous aider pour :'
      : "I'm Sonah, your assistant for administrative procedures and your rights in Cameroon. I can help you with:",
  );
  parts.push(`\n\n${EXAMPLES[language]}`);
  parts.push(
    fr
      ? '\n\nJe cite toujours les textes officiels et je vous dis quand je ne sais pas. Que puis-je faire pour vous ?'
      : '\n\nI always cite the official texts and tell you when I don’t know. What can I do for you?',
  );
  return parts.join(' ').replace(/ \n/g, '\n');
}
