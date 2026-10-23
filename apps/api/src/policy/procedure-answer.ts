import type { ProcedureSheet } from '@sonah/rag';
import type { Language } from './policy.types';

/** Fiche de démarche renvoyée au client (rendu structuré), champs non vérifiés à null. */
export interface ProcedurePayload {
  readonly id: string;
  readonly title: string;
  readonly authority: { readonly name: string; readonly level: string | null } | null;
  readonly where: readonly string[];
  readonly documents: readonly string[];
  readonly steps: ReadonlyArray<{ readonly order: number; readonly description: string }>;
  readonly cost: { readonly amountFcfa: number | null; readonly description: string | null } | null;
  readonly delay: string | null;
  readonly validity: string | null;
  readonly legalBasis: ReadonlyArray<{
    readonly sourceId: string | null;
    readonly reference: string | null;
    readonly title: string;
  }>;
  readonly sources: ReadonlyArray<{
    readonly title: string;
    readonly url: string | null;
    readonly publisher: string | null;
  }>;
  readonly verifiedAt: string | null;
  readonly unverified: ReadonlyArray<{ readonly field: string; readonly note: string }>;
}

export function procedureTitle(sheet: ProcedureSheet, language: Language): string {
  return language === 'en' && sheet.title_en ? sheet.title_en : sheet.title_fr;
}

export function toProcedurePayload(sheet: ProcedureSheet, language: Language): ProcedurePayload {
  return {
    id: sheet.id,
    title: procedureTitle(sheet, language),
    authority: sheet.authority,
    where: sheet.where,
    documents: sheet.documents,
    steps: sheet.steps,
    cost: sheet.cost
      ? { amountFcfa: sheet.cost.amount_fcfa, description: sheet.cost.description }
      : null,
    delay: sheet.delay,
    validity: sheet.validity,
    legalBasis: sheet.legal_basis,
    sources: sheet.sources,
    verifiedAt: sheet.verified_at,
    unverified: sheet.unverified,
  };
}

/** Montant en FCFA avec séparateur de milliers (« 2 800 FCFA »). */
export function formatFcfa(amount: number): string {
  const digits = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${digits} FCFA`;
}

const LABELS = {
  fr: {
    where: 'Où vous adresser',
    who: 'Qui peut faire la demande',
    documents: 'Pièces à fournir',
    documentsUnknown:
      'La liste des pièces n’est pas encore vérifiée : demandez-la au service avant de vous déplacer.',
    steps: 'Étapes',
    cost: 'Coût',
    costUnknown: 'non vérifié, il peut varier : renseignez-vous sur place.',
    delay: 'Délai',
    delayUnknown: 'non vérifié, il peut varier.',
    validity: 'Validité',
    tips: 'Conseils',
    legal: 'Base légale',
    sources: 'Sources',
    verified: (date: string) => `Fiche vérifiée le ${date}.`,
    notVerified: 'Date de vérification de la fiche non renseignée.',
    unverified: 'Points non vérifiés',
    sheet: 'Fiche démarche SONAH',
    frenchOnly: '',
    intro: (title: string, authority: string | null) =>
      `Voici la démarche « ${title} »${authority ? `, auprès de : ${authority}` : ''}.`,
  },
  en: {
    where: 'Where to go',
    who: 'Who can apply',
    documents: 'Documents to provide',
    documentsUnknown:
      'The list of documents has not been verified yet: ask the office before you go.',
    steps: 'Steps',
    cost: 'Cost',
    costUnknown: 'not verified, it may vary: ask on site.',
    delay: 'Processing time',
    delayUnknown: 'not verified, it may vary.',
    validity: 'Validity',
    tips: 'Tips',
    legal: 'Legal basis',
    sources: 'Sources',
    verified: (date: string) => `Sheet verified on ${date}.`,
    notVerified: 'Verification date of this sheet not provided.',
    unverified: 'Unverified points',
    sheet: 'SONAH procedure sheet',
    frenchOnly: '(The details of this sheet are only available in French for now.)',
    intro: (title: string, authority: string | null) =>
      `Here is the procedure "${title}"${authority ? `, handled by: ${authority}` : ''}.`,
  },
} as const;

/** Libellés des champs de fiche signalés comme non vérifiés. */
const FIELD_LABELS: Record<string, Record<Language, string>> = {
  authority: { fr: 'Autorité', en: 'Authority' },
  where: { fr: 'Lieu', en: 'Where' },
  who_can_apply: { fr: 'Demandeur', en: 'Who can apply' },
  documents: { fr: 'Pièces', en: 'Documents' },
  steps: { fr: 'Étapes', en: 'Steps' },
  cost: { fr: 'Coût', en: 'Cost' },
  delay: { fr: 'Délai', en: 'Processing time' },
  validity: { fr: 'Validité', en: 'Validity' },
  legal_basis: { fr: 'Base légale', en: 'Legal basis' },
};

function fieldLabel(field: string, language: Language): string {
  return FIELD_LABELS[field]?.[language] ?? field;
}

/** Introduction déterministe (sans modèle de langage, ou brouillon rejeté). */
export function procedureIntro(sheet: ProcedureSheet, language: Language): string {
  return LABELS[language].intro(procedureTitle(sheet, language), sheet.authority?.name ?? null);
}

/**
 * Corps structuré de la réponse, rendu uniquement à partir de la fiche : coût et délai affichés
 * seulement s'ils y figurent, sinon signalés comme non vérifiés. Le marqueur [1] renvoie à la fiche.
 */
export function renderProcedureBody(sheet: ProcedureSheet, language: Language): string {
  const t = LABELS[language];
  const lines: string[] = [];
  const section = (title: string, body: string[]) => {
    if (body.length === 0) return;
    lines.push('', `**${title}**`, ...body);
  };

  if (language === 'en' && !sheet.language_versions.includes('en') && t.frenchOnly) {
    lines.push('', t.frenchOnly);
  }
  section(t.where, [
    ...(sheet.authority ? [`- ${sheet.authority.name}`] : []),
    ...sheet.where.map((place) => `- ${place}`),
  ]);
  section(t.who, sheet.who_can_apply ? [sheet.who_can_apply] : []);
  section(
    t.documents,
    sheet.documents.length > 0 ? sheet.documents.map((doc) => `- ${doc}`) : [t.documentsUnknown],
  );
  section(
    t.steps,
    sheet.steps.map((step, position) => `${position + 1}. ${step.description}`),
  );

  const cost =
    sheet.cost?.amount_fcfa !== null && sheet.cost?.amount_fcfa !== undefined
      ? [formatFcfa(sheet.cost.amount_fcfa), sheet.cost.description]
          .filter((part): part is string => Boolean(part))
          .filter((part, index, all) => index === 0 || part !== all[0])
          .join(' — ')
      : (sheet.cost?.description ?? t.costUnknown);
  lines.push('', `**${t.cost}** : ${cost}`);
  lines.push(`**${t.delay}** : ${sheet.delay ?? t.delayUnknown}`);
  if (sheet.validity) lines.push(`**${t.validity}** : ${sheet.validity}`);

  section(
    t.tips,
    sheet.tips.map((tip) => `- ${tip}`),
  );
  section(
    t.legal,
    sheet.legal_basis.map(
      (basis) => `- ${basis.title}${basis.reference ? `, ${basis.reference}` : ''}`,
    ),
  );
  if (sheet.unverified.length > 0) {
    section(
      `⚠️ ${t.unverified}`,
      sheet.unverified.map((item) => `- ${fieldLabel(item.field, language)} : ${item.note}`),
    );
  }
  section(t.sources, [
    `- ${t.sheet} « ${sheet.title_fr} » [1]`,
    ...sheet.sources.map(
      (source) =>
        `- ${source.title}${source.publisher ? ` (${source.publisher})` : ''}${source.url ? ` : ${source.url}` : ''}`,
    ),
    sheet.verified_at ? t.verified(sheet.verified_at) : t.notVerified,
  ]);
  return lines.join('\n').trim();
}

/** Réponse complète : introduction (rédigée ou déterministe) puis corps structuré. */
export function renderProcedureReply(
  sheet: ProcedureSheet,
  language: Language,
  intro: string = procedureIntro(sheet, language),
): string {
  return `${intro.trim()}\n\n${renderProcedureBody(sheet, language)}`;
}
