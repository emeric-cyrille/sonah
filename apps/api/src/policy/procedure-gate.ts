/**
 * Contrôle de politique des réponses de démarche : le modèle de langage peut reformuler, jamais
 * inventer. Tout nombre (montant, délai, durée), toute pièce justificative et tout lien cités
 * doivent figurer dans la fiche de démarche (ou, sans fiche, dans la table d'orientation).
 */
import type { ProcedureSheet, SearchResult } from '@sonah/rag';
import { excerptOf } from './evidence';
import { ORIENTATION_MAP, orientationReply, type OrientationCategory } from './orientation';
import type { GateCheck, GateResult } from './policy-gate';
import type { Citation, Language } from './policy.types';
import { procedureIntro, renderProcedureReply } from './procedure-answer';
import { foldForKeywords } from './text';

/** Pièces et documents justificatifs courants (texte replié) : cités seulement s'ils sont dans la fiche. */
const DOCUMENT_TERMS = [
  'photo',
  'photos',
  'photographie',
  'timbre',
  'quittance',
  'recu',
  'recepisse',
  'justificatif',
  'attestation',
  'certificat',
  'acte de naissance',
  'acte de mariage',
  'acte de deces',
  'casier judiciaire',
  'extrait',
  'copie',
  'photocopie',
  'formulaire',
  'imprime',
  'demande timbree',
  'facture',
  'plan de localisation',
  'carte grise',
  'passeport',
  'cni',
  'carte nationale',
  'piece d identite',
  'declaration de perte',
  'diplome',
  'releve',
  'statuts',
  'enveloppe',
  'carnet',
  'livret',
  'procuration',
  'mandat',
  'photograph',
  'stamp',
  'receipt',
  'proof of',
  'certificate',
  'form',
  'copy',
  'passport',
  'utility bill',
  'bank statement',
  'power of attorney',
  'envelope',
] as const;

const URL_PATTERN = /https?:\/\/[^\s)\]»"]+/g;

/** Nombres d'un texte, normalisés (« 2 800 » → « 2800 », « 01 » → « 1 »), hors liens et marqueurs [n]. */
export function extractNumbers(text: string): string[] {
  const cleaned = text.replace(URL_PATTERN, ' ').replace(/\[\d+(?:\s*[,;–-]\s*\d+)*\]/g, ' ');
  const numbers: string[] = [];
  for (const match of cleaned.matchAll(
    /\d{1,3}(?:[ \u00a0\u202f.]\d{3})+(?!\d)|\d+(?:[.,]\d+)?/g,
  )) {
    const raw = match[0].replace(/[ \u00a0\u202f]/g, '');
    const value = /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, '') : raw.replace(',', '.');
    numbers.push(String(Number(value)));
  }
  return numbers;
}

function urlsOf(text: string): string[] {
  return [...text.matchAll(URL_PATTERN)].map((m) => m[0].replace(/[.,;:]+$/, ''));
}

/** Texte de référence d'une fiche : tous ses champs, plus les numéros d'étapes. */
export function sheetReferenceText(sheet: ProcedureSheet): string {
  return [
    JSON.stringify(sheet),
    sheet.cost?.amount_fcfa !== null && sheet.cost?.amount_fcfa !== undefined
      ? String(sheet.cost.amount_fcfa)
      : '',
    sheet.steps.map((_, i) => String(i + 1)).join(' '),
  ].join('\n');
}

/** Libellé « [n] » toléré : la fiche est l'unique source citée. */
const ALLOWED_MARKERS = new Set(['1']);

export interface ProcedureValidation {
  readonly valid: boolean;
  readonly checks: GateCheck[];
  readonly reasons: string[];
}

/**
 * Vérifie qu'un texte n'affirme rien d'absent de la référence : nombres, pièces, liens, marqueurs.
 * `reference` est la fiche (ou l'entrée d'orientation) sous forme de texte.
 */
export function validateAgainstReference(text: string, reference: string): ProcedureValidation {
  const checks: GateCheck[] = [];
  const reasons: string[] = [];
  const allowedNumbers = new Set(extractNumbers(reference));
  const foldedReference = ` ${foldForKeywords(reference).replace(/['’]/g, ' ')} `;
  const foldedText = ` ${foldForKeywords(text).replace(/['’]/g, ' ')} `;

  const invented = [...new Set(extractNumbers(text))].filter((n) => !allowedNumbers.has(n));
  checks.push({
    check: 'procedure_number',
    valid: invented.length === 0,
    detail:
      invented.length === 0
        ? 'nombres conformes à la fiche'
        : `nombres absents de la fiche : ${invented.join(', ')}`,
  });
  if (invented.length > 0) reasons.push(`nombre(s) absent(s) de la fiche : ${invented.join(', ')}`);

  const contains = (haystack: string, term: string) =>
    new RegExp(`[^a-z0-9]${term.replace(/ /g, '\\s+')}s?[^a-z0-9]`).test(haystack);
  const documents = DOCUMENT_TERMS.filter(
    (term) => contains(foldedText, term) && !contains(foldedReference, term),
  );
  checks.push({
    check: 'procedure_document',
    valid: documents.length === 0,
    detail:
      documents.length === 0
        ? 'pièces conformes à la fiche'
        : `pièces absentes de la fiche : ${documents.join(', ')}`,
  });
  if (documents.length > 0)
    reasons.push(`pièce(s) absente(s) de la fiche : ${documents.join(', ')}`);

  const allowedUrls = new Set(urlsOf(reference));
  const urls = urlsOf(text).filter((url) => !allowedUrls.has(url));
  const markers = [...text.matchAll(/\[(\d+)\]/g)]
    .map((m) => m[1] ?? '')
    .filter((m) => !ALLOWED_MARKERS.has(m));
  const linksValid = urls.length === 0 && markers.length === 0;
  checks.push({
    check: 'procedure_link',
    valid: linksValid,
    detail: linksValid
      ? 'liens et renvois conformes'
      : `liens ou renvois inconnus : ${[...urls, ...markers.map((m) => `[${m}]`)].join(', ')}`,
  });
  if (!linksValid) reasons.push('lien ou renvoi absent de la fiche');

  return { valid: reasons.length === 0, checks, reasons };
}

/** Vérifie un texte (brouillon ou réponse) contre une fiche de démarche. */
export function validateProcedureText(text: string, sheet: ProcedureSheet): ProcedureValidation {
  return validateAgainstReference(text, sheetReferenceText(sheet));
}

/** Citation de la fiche elle-même (marqueur [1]). */
export function procedureCitation(document: SearchResult, sheet: ProcedureSheet): Citation {
  const url = sheet.sources.find((source) => source.url)?.url ?? undefined;
  return {
    index: 1,
    documentId: document.id,
    sourceId: document.sourceId,
    title: 'Fiche démarche',
    reference: sheet.title_fr,
    excerpt: excerptOf(document.content),
    ...(url ? { url } : {}),
    status: 'in_force',
  };
}

export interface ProcedureGateInput {
  readonly sheet: ProcedureSheet;
  readonly document: SearchResult;
  readonly language: Language;
  /** Introduction rédigée par le modèle, ou null. */
  readonly draft: string | null;
}

/**
 * Réponse de démarche : introduction du modèle si elle ne contient rien d'absent de la fiche
 * (sinon introduction déterministe), puis corps structuré rendu depuis la fiche. La réponse
 * complète est revérifiée (défense en profondeur).
 */
export function applyProcedureGate(input: ProcedureGateInput): GateResult {
  const { sheet, language } = input;
  let intro = procedureIntro(sheet, language);
  let draftAccepted: boolean | null = null;
  let rejectionReasons: string[] = [];
  let checks: GateCheck[] = [];
  const draft = input.draft?.trim() ?? '';
  if (draft.length > 0) {
    const validation = validateProcedureText(draft, sheet);
    checks = validation.checks;
    if (validation.valid) {
      intro = draft;
      draftAccepted = true;
    } else {
      draftAccepted = false;
      rejectionReasons = validation.reasons;
    }
  }
  const reply = renderProcedureReply(sheet, language, intro);
  const final = validateProcedureText(reply, sheet);
  return {
    verdict: 'ANSWERED_WITH_CITATIONS',
    reply,
    citations: [procedureCitation(input.document, sheet)],
    draftAccepted,
    rejectionReasons,
    checks: [...checks, ...final.checks.map((c) => ({ ...c, detail: `réponse : ${c.detail}` }))],
    rule: draftAccepted === false ? 'procedure:sheet_after_rejection' : 'procedure:sheet',
    sensitiveCategory: null,
    outdated: [],
    conflicts: [],
  };
}

export interface OrientationGateInput {
  readonly category: OrientationCategory;
  /** Demande du citoyen : la reformulation peut nommer la pièce demandée (chiffres exclus). */
  readonly question?: string;
  readonly language: Language;
  /** Reformulation du modèle, ou null : acceptée seulement sans nombre, pièce ni lien inventés. */
  readonly draft: string | null;
}

/** Démarche sans fiche : orientation générale, verdict « preuves insuffisantes ». */
export function applyOrientationGate(input: OrientationGateInput): GateResult {
  const deterministic = orientationReply(input.category, input.language);
  const reference = [
    deterministic,
    ORIENTATION_MAP[input.category].authority.fr,
    ORIENTATION_MAP[input.category].authority.en,
    (input.question ?? '').replace(/\d/g, ' '),
  ].join('\n');
  let reply = deterministic;
  let draftAccepted: boolean | null = null;
  let rejectionReasons: string[] = [];
  let checks: GateCheck[] = [];
  const draft = input.draft?.trim() ?? '';
  if (draft.length > 0) {
    const validation = validateAgainstReference(draft, reference);
    checks = validation.checks;
    draftAccepted = validation.valid;
    if (validation.valid) reply = draft;
    else rejectionReasons = validation.reasons;
  }
  return {
    verdict: 'INSUFFICIENT_EVIDENCE',
    reply,
    citations: [],
    draftAccepted,
    rejectionReasons,
    checks,
    rule: `orientation:no_sheet:${input.category}`,
    sensitiveCategory: null,
    outdated: [],
    conflicts: [],
  };
}
