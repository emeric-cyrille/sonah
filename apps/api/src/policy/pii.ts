/**
 * Détection et masquage déterministes des données personnelles (adresses e-mail, numéros de
 * téléphone, numéros de pièces d'identité) AVANT tout stockage ou envoi au modèle de langage.
 * Seuls les types et le nombre d'occurrences sont journalisés, jamais les valeurs.
 */

export type PiiType = 'email' | 'phone' | 'id_number';

export const PII_PLACEHOLDERS: Record<PiiType, string> = {
  email: '[EMAIL]',
  phone: '[PHONE]',
  id_number: '[ID_NUMBER]',
};

export interface PiiMaskResult {
  readonly text: string;
  readonly findings: Readonly<Record<PiiType, number>>;
  readonly total: number;
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/** Numéro de pièce introduit par un mot-clé (CNI, passeport, NIU…) : on garde le mot-clé. */
const KEYWORD_ID =
  /(\b(?:CNI|NIU|carte nationale d['’]identit[ée]|carte d['’]identit[ée]|pi[èe]ce d['’]identit[ée]|passeport|passport|ID card|identity card|national ID)\b(?:\s*(?:n°|no\.?|num[ée]ro|number|est|is|:|#))*\s*)([A-Z0-9](?:[A-Z0-9 /.-]{4,22})[A-Z0-9])/gi;

/** Téléphones camerounais (+237 6XX XX XX XX, 2XX XX XX XX) et internationaux (+XX…). */
const CAMEROON_PHONE = /(?:(?:\+|00)237[\s.-]?)?\b[26](?:[\s.-]?\d){8}\b/g;
const INTERNATIONAL_PHONE = /(?:\+|00)\d{1,3}(?:[\s.-]?\d){6,13}\b/g;

/** Toute autre suite d'au moins 8 chiffres (éventuellement séparés) : identifiant probable. */
const LONG_NUMBER = /\b\d(?:[\s.-]?\d){7,}\b/g;

function digitCount(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

export function maskPii(input: string): PiiMaskResult {
  const findings: Record<PiiType, number> = { email: 0, phone: 0, id_number: 0 };
  let text = input.replace(EMAIL, () => {
    findings.email += 1;
    return PII_PLACEHOLDERS.email;
  });
  text = text.replace(KEYWORD_ID, (match, prefix: string, value: string) => {
    if (digitCount(value) < 5) return match;
    findings.id_number += 1;
    return `${prefix}${PII_PLACEHOLDERS.id_number}`;
  });
  for (const pattern of [INTERNATIONAL_PHONE, CAMEROON_PHONE]) {
    text = text.replace(pattern, () => {
      findings.phone += 1;
      return PII_PLACEHOLDERS.phone;
    });
  }
  text = text.replace(LONG_NUMBER, () => {
    findings.id_number += 1;
    return PII_PLACEHOLDERS.id_number;
  });
  const total = findings.email + findings.phone + findings.id_number;
  return { text, findings, total };
}

/** Avertissement affiché quand des données personnelles ont été masquées. */
export function piiNotice(language: 'fr' | 'en'): string {
  return language === 'fr'
    ? 'Par précaution, j’ai masqué les données personnelles de votre message (numéros, adresses e-mail) : elles ne sont ni conservées ni transmises. Évitez de les partager ici.'
    : 'As a precaution, I masked the personal data in your message (numbers, email addresses): it is neither stored nor transmitted. Please avoid sharing it here.';
}
