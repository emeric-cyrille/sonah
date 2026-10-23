/**
 * Questions de démarches administratives proposées sur l'accueil, le chat et /demarches.
 * Point unique de réglage : passer `enabled` à false retire une question partout, par exemple
 * si l'API ne renvoie pas encore de fiche (ou d'orientation) fiable pour ce sujet.
 */
import type { Locale } from '@/i18n/config';

export interface ProcedureQuestion {
  readonly id: string;
  /** Vrai seulement une fois la réponse vérifiée sur l'API réelle. */
  readonly enabled: boolean;
  readonly topic: Readonly<Record<Locale, string>>;
  readonly question: Readonly<Record<Locale, string>>;
}

export const PROCEDURE_QUESTIONS: readonly ProcedureQuestion[] = [
  {
    id: 'passeport',
    enabled: true,
    topic: { fr: 'Démarche', en: 'Procedure' },
    question: {
      fr: 'Quelles pièces faut-il pour obtenir un passeport ?',
      en: 'What documents do I need to get a passport?',
    },
  },
  {
    id: 'acte-naissance',
    enabled: true,
    topic: { fr: 'Démarche', en: 'Procedure' },
    question: {
      fr: 'Comment obtenir une copie d’acte de naissance ?',
      en: 'How do I get a copy of my birth certificate?',
    },
  },
  {
    id: 'certificat-medical',
    enabled: true,
    topic: { fr: 'Démarche', en: 'Procedure' },
    question: {
      fr: 'Comment obtenir un certificat médical ?',
      en: 'How do I get a medical certificate?',
    },
  },
  {
    id: 'cni-perdue',
    enabled: true,
    topic: { fr: 'Démarche', en: 'Procedure' },
    question: {
      fr: 'J’ai perdu ma CNI, que dois-je faire ?',
      en: 'I lost my national ID card (CNI), what should I do?',
    },
  },
];

/** Questions actives, dans la langue demandée. */
export function procedureQuestions(locale: Locale): { topic: string; question: string }[] {
  return PROCEDURE_QUESTIONS.filter((item) => item.enabled).map((item) => ({
    topic: item.topic[locale],
    question: item.question[locale],
  }));
}
