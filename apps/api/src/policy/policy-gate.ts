/**
 * Nœud de politique (Y.3172 « P ») : contrôle déterministe de chaque réponse avant sa diffusion.
 * Le modèle de langage rédige, ce module décide :
 *  - chaque citation [n] doit désigner un extrait effectivement retrouvé ;
 *  - chaque citation entre guillemets doit figurer mot pour mot dans l'extrait cité ;
 *  - un brouillon non conforme est remplacé par la réponse extractive (rejet tracé) ;
 *  - le verdict est typé : réponse citée, preuves insuffisantes, hors sujet, texte périmé,
 *    contradiction entre textes, ou orientation vers un humain.
 */
import type { SearchResult } from '@sonah/rag';
import { amendedByOf, conflictsWithOf, shortTitleOf, statusOf, toCitation } from './evidence';
import { extractiveReply, noEvidenceReply, outOfScopeReply } from './extractive';
import { detectOffTopic } from './off-topic';
import type { Citation, ConflictHint, Language, Verdict } from './policy.types';
import {
  detectSensitiveSituation,
  isAdministrativeQuestion,
  referralText,
  type SensitiveCategory,
} from './situations';
import { normalizeForMatch } from './text';

/** Jeton que le modèle est invité à émettre pour une question hors sujet. */
export const OUT_OF_SCOPE_TOKEN = '[OUT_OF_SCOPE]';
/**
 * Marqueur par lequel le modèle signale qu'aucun extrait ne répond à la question. Le nœud de
 * politique en fait un verdict INSUFFICIENT_EVIDENCE : sans lui, un aveu honnête (sans citation)
 * était rejeté et remplacé par des extraits voisins présentés comme une réponse sourcée.
 */
export const NO_EVIDENCE_TOKEN = '[NO_EVIDENCE]';

/** Une citation entre guillemets de moins de mots est un terme (« SARL »), pas un extrait. */
const MIN_QUOTE_WORDS = 4;
/** Un fragment de citation (entre deux ellipses) n'est vérifié qu'à partir de ce nombre de mots. */
const MIN_SEGMENT_WORDS = 3;

export const POLICY_GATE_VERSION = 'policy-gate-1.4';

// Démarches : réponses rendues depuis une fiche, ou orientation sans fiche (voir procedure-gate.ts)
export {
  applyOrientationGate,
  applyProcedureGate,
  validateAgainstReference,
  validateProcedureText,
} from './procedure-gate';

export interface GateInput {
  /** Question de l'utilisateur (déjà masquée). */
  readonly question: string;
  readonly language: Language;
  /** Extraits retrouvés, numérotés [1..n] dans cet ordre. */
  readonly evidence: readonly SearchResult[];
  /** Brouillon du modèle, ou null sans modèle (réponse extractive). */
  readonly draft: string | null;
  /** Contradictions signalées par le coordinateur. */
  readonly conflictHints?: readonly ConflictHint[];
}

export interface GateCheck {
  readonly check:
    | 'citation_index'
    | 'verbatim_quote'
    | 'has_citation'
    | 'procedure_number'
    | 'procedure_document'
    | 'procedure_link';
  readonly valid: boolean;
  readonly detail: string;
}

export interface OutdatedCitation {
  readonly index: number;
  readonly status: 'amended' | 'repealed';
  readonly amendedBy?: string;
  readonly hasInForceCounterpart: boolean;
}

export interface GateResult {
  readonly verdict: Verdict;
  readonly reply: string;
  readonly citations: Citation[];
  /** null : pas de brouillon ; true : brouillon accepté ; false : rejeté et remplacé. */
  readonly draftAccepted: boolean | null;
  readonly rejectionReasons: string[];
  readonly checks: GateCheck[];
  /** Règle qui a fixé le verdict (pour la trace). */
  readonly rule: string;
  readonly sensitiveCategory: SensitiveCategory | null;
  readonly outdated: OutdatedCitation[];
  readonly conflicts: string[];
}

/** Numéros cités sous la forme [1], [1, 2], [1-3] ou [1][2]. */
/**
 * Uniformise les marqueurs de citation produits par certains modèles :
 * « 【6】 », « 【6†L1-L3】 », « [^6] » ou « (6) » collé à un crochet deviennent « [6] ».
 */
export function normalizeCitationMarkers(text: string): string {
  return text
    .replace(
      /【\s*(\d+(?:\s*[,，;]\s*\d+)*)(?:†[^】]*)?\s*】/g,
      (_, numbers: string) => `[${numbers.replace(/，/g, ',')}]`,
    )
    .replace(/\[\^(\d+)\]/g, '[$1]');
}

export function extractCitationMarkers(text: string): number[] {
  const markers: number[] = [];
  for (const match of text.matchAll(/\[(\d+(?:\s*[,;–-]\s*\d+)*)\]/g)) {
    const body = match[1] ?? '';
    for (const part of body.split(/\s*[,;]\s*/)) {
      const range = part.split(/\s*[–-]\s*/).map(Number);
      const [start, end] = [range[0] ?? 0, range[1] ?? range[0] ?? 0];
      for (let n = start; n <= Math.min(end, start + 20); n += 1) markers.push(n);
    }
  }
  return markers;
}

export interface Quote {
  readonly text: string;
  /** Numéros [n] présents sur la même ligne que la citation. */
  readonly lineMarkers: number[];
}

/** Citations entre « … », “ … ” ou "…", avec les marqueurs [n] de leur ligne. */
export function extractQuotes(text: string): Quote[] {
  const quotes: Quote[] = [];
  for (const line of text.split('\n')) {
    const lineMarkers = extractCitationMarkers(line);
    for (const match of line.matchAll(/«([^»]+)»|“([^”]+)”|"([^"]+)"/g)) {
      const body = (match[1] ?? match[2] ?? match[3] ?? '').trim();
      if (body.length > 0) quotes.push({ text: body, lineMarkers });
    }
  }
  return quotes;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Fragments à vérifier : la citation découpée sur ses ellipses, ponctuation de bord retirée. */
function quoteSegments(quote: string): string[] {
  return quote
    .split(/\s*(?:\[(?:…|\.\.\.)\]|\((?:…|\.\.\.)\)|…|\.\.\.)\s*/)
    .map((segment) => segment.replace(/^[\s,;:.]+|[\s,;:.]+$/g, ''))
    .filter((segment) => wordCount(segment) >= MIN_SEGMENT_WORDS);
}

/** Vrai si le fragment figure mot pour mot dans le texte (espaces, apostrophes ; casse de l'initiale tolérée). */
export function isVerbatim(fragment: string, source: string): boolean {
  const needle = normalizeForMatch(fragment);
  const haystack = normalizeForMatch(source);
  if (needle.length === 0) return true;
  if (haystack.includes(needle)) return true;
  const first = needle.charAt(0);
  const swapped =
    (first === first.toLowerCase() ? first.toUpperCase() : first.toLowerCase()) + needle.slice(1);
  return haystack.includes(swapped);
}

interface DraftValidation {
  readonly valid: boolean;
  readonly checks: GateCheck[];
  readonly reasons: string[];
}

/** Vérifie un texte (brouillon du modèle ou réponse extractive) contre les extraits retrouvés. */
export function validateAnswer(text: string, evidence: readonly SearchResult[]): DraftValidation {
  const checks: GateCheck[] = [];
  const reasons: string[] = [];
  const markers = [...new Set(extractCitationMarkers(text))];

  for (const marker of markers) {
    const valid = marker >= 1 && marker <= evidence.length;
    checks.push({
      check: 'citation_index',
      valid,
      detail: valid ? `[${marker}] → ${evidence[marker - 1]?.id}` : `[${marker}] inexistant`,
    });
    if (!valid) reasons.push(`citation [${marker}] ne correspond à aucun extrait retrouvé`);
  }

  const validMarkers = markers.filter((m) => m >= 1 && m <= evidence.length);
  if (evidence.length > 0) {
    const hasCitation = validMarkers.length > 0;
    checks.push({
      check: 'has_citation',
      valid: hasCitation,
      detail: hasCitation ? `${validMarkers.length} extrait(s) cité(s)` : 'aucune citation [n]',
    });
    if (!hasCitation) reasons.push('réponse sans citation des extraits');
  }

  for (const quote of extractQuotes(text)) {
    if (wordCount(quote.text) < MIN_QUOTE_WORDS) continue;
    const cited = quote.lineMarkers.filter((m) => m >= 1 && m <= evidence.length);
    const candidates = (cited.length > 0 ? cited : evidence.map((_, i) => i + 1)).map(
      (m) => evidence[m - 1] as SearchResult,
    );
    const segments = quoteSegments(quote.text);
    const valid = segments.every((segment) =>
      candidates.some((result) => isVerbatim(segment, result.content)),
    );
    const preview = quote.text.length > 120 ? `${quote.text.slice(0, 117)}…` : quote.text;
    checks.push({
      check: 'verbatim_quote',
      valid,
      detail: `${valid ? 'conforme' : 'non conforme'} : « ${preview} »${
        cited.length > 0 ? ` (cité [${cited.join(', ')}])` : ' (sans numéro)'
      }`,
    });
    if (!valid) reasons.push(`citation non littérale : « ${preview} »`);
  }

  return { valid: reasons.length === 0, checks, reasons };
}

/** Un texte modifié ou abrogé a-t-il, parmi les extraits, un équivalent en vigueur ? */
function inForceCounterpart(
  result: SearchResult,
  evidence: readonly SearchResult[],
): SearchResult | undefined {
  const amendedBy = amendedByOf(result);
  return evidence.find(
    (other) =>
      other !== result &&
      statusOf(other) === 'in_force' &&
      ((amendedBy !== undefined && other.sourceId === amendedBy) ||
        (other.reference !== null &&
          other.reference === result.reference &&
          shortTitleOf(other) === shortTitleOf(result))),
  );
}

function retrievalConflicts(evidence: readonly SearchResult[]): string[] {
  const conflicts: string[] = [];
  evidence.forEach((result, position) => {
    if (statusOf(result) !== 'in_force') return;
    for (const target of conflictsWithOf(result)) {
      const otherIndex = evidence.findIndex(
        (other) =>
          other !== result &&
          statusOf(other) === 'in_force' &&
          (other.sourceId === target || other.id === target),
      );
      if (otherIndex > position) {
        conflicts.push(
          `[${position + 1}] ${shortTitleOf(result)} ${result.reference ?? ''} ↔ [${otherIndex + 1}] ${shortTitleOf(evidence[otherIndex] as SearchResult)} ${evidence[otherIndex]?.reference ?? ''}`.replace(
            /\s+/g,
            ' ',
          ),
        );
      }
    }
  });
  return conflicts;
}

function outdatedNotice(
  outdated: readonly OutdatedCitation[],
  evidence: readonly SearchResult[],
  language: Language,
): string {
  const lines = outdated.map((item) => {
    const result = evidence[item.index - 1] as SearchResult;
    const label = `[${item.index}] ${shortTitleOf(result)}${result.reference ? `, ${result.reference}` : ''}`;
    if (language === 'fr') {
      const state = item.status === 'repealed' ? 'a été abrogé' : 'a été modifié';
      const by = item.amendedBy ? ` (${item.amendedBy})` : '';
      const next = item.hasInForceCounterpart
        ? 'la version en vigueur figure parmi les extraits.'
        : 'je n’ai pas la version en vigueur : vérifiez le texte consolidé au Journal officiel ou auprès de l’administration.';
      return `⚠️ ${label} ${state}${by} : ${next}`;
    }
    const state = item.status === 'repealed' ? 'has been repealed' : 'has been amended';
    const by = item.amendedBy ? ` (${item.amendedBy})` : '';
    const next = item.hasInForceCounterpart
      ? 'the version in force is among the excerpts.'
      : 'I do not have the version in force: check the consolidated text in the Official Gazette or with the administration.';
    return `⚠️ ${label} ${state}${by}: ${next}`;
  });
  return lines.join('\n');
}

function conflictNotice(conflicts: readonly string[], language: Language): string {
  const head =
    language === 'fr'
      ? '⚠️ Les textes ou positions suivants se contredisent ; une vérification humaine est nécessaire avant toute démarche :'
      : '⚠️ The following texts or positions contradict each other; human review is needed before you act:';
  return [head, ...conflicts.map((c) => `- ${c}`)].join('\n');
}

/** Contrôle une réponse et fixe son verdict. Fonction pure. */
export function applyPolicyGate(input: GateInput): GateResult {
  const { evidence, language } = input;
  const sensitiveCategory = detectSensitiveSituation(input.question);
  const administrative = isAdministrativeQuestion(input.question);
  const offTopic = sensitiveCategory ? null : detectOffTopic(input.question);
  const modelSaysOutOfScope = input.draft?.includes(OUT_OF_SCOPE_TOKEN) ?? false;
  const draft =
    input.draft?.split(OUT_OF_SCOPE_TOKEN).join('').split(NO_EVIDENCE_TOKEN).join('').trim() ??
    null;
  // Le marqueur ne vaut abstention que si le brouillon ne cite aucun extrait : un brouillon qui
  // le porte tout en citant ses sources est une réponse (partielle), vérifiée normalement.
  const modelSaysNoEvidence =
    (input.draft?.includes(NO_EVIDENCE_TOKEN) ?? false) &&
    extractCitationMarkers(draft ?? '').length === 0;
  const referral = sensitiveCategory ? referralText(sensitiveCategory, language) : null;

  const base = {
    sensitiveCategory,
    outdated: [] as OutdatedCitation[],
    conflicts: [] as string[],
  };

  // Hors sujet : sujet manifestement étranger (cuisine, météo, sport…), ou ni mot du domaine
  // ni extrait (ou le modèle le signale)
  if (
    offTopic !== null ||
    (!sensitiveCategory && !administrative && (evidence.length === 0 || modelSaysOutOfScope))
  ) {
    return {
      ...base,
      verdict: 'OUT_OF_SCOPE',
      reply: outOfScopeReply(language),
      citations: [],
      draftAccepted: draft === null ? null : false,
      rejectionReasons:
        draft === null ? [] : ['question hors du domaine administratif et juridique'],
      checks: [],
      rule: offTopic
        ? `out_of_scope:off_topic:${offTopic}`
        : modelSaysOutOfScope
          ? 'out_of_scope:model_hint'
          : 'out_of_scope:no_domain_keyword',
    };
  }

  // Aucun extrait pertinent (ou le modèle signale que les extraits ne répondent pas) : on ne
  // laisse pas le modèle répondre de mémoire, ni des extraits voisins passer pour une réponse
  if (evidence.length === 0 || modelSaysNoEvidence) {
    const reply = referral
      ? `${referral}\n\n${noEvidenceReply(language)}`
      : noEvidenceReply(language);
    return {
      ...base,
      verdict: referral ? 'REFER_TO_HUMAN' : 'INSUFFICIENT_EVIDENCE',
      reply,
      citations: [],
      draftAccepted: draft === null ? null : false,
      rejectionReasons:
        draft === null
          ? []
          : modelSaysNoEvidence
            ? ['le modèle indique que les extraits ne répondent pas à la question']
            : ['aucun extrait pertinent : brouillon non vérifiable'],
      checks: [],
      rule: referral
        ? `refer_to_human:${sensitiveCategory}`
        : evidence.length > 0
          ? 'insufficient_evidence:model_hint'
          : 'insufficient_evidence:no_result',
    };
  }

  // Validation du brouillon ; rejet → réponse extractive
  let answer: string;
  let draftAccepted: boolean | null = null;
  let checks: GateCheck[] = [];
  let rejectionReasons: string[] = [];
  if (draft !== null && draft.length > 0) {
    const validation = validateAnswer(draft, evidence);
    checks = validation.checks;
    if (validation.valid) {
      answer = draft;
      draftAccepted = true;
    } else {
      answer = extractiveReply(evidence, language);
      draftAccepted = false;
      rejectionReasons = validation.reasons;
    }
  } else {
    answer = extractiveReply(evidence, language);
    checks = validateAnswer(answer, evidence).checks;
  }

  const citedIndices = [...new Set(extractCitationMarkers(answer))]
    .filter((m) => m >= 1 && m <= evidence.length)
    .sort((a, b) => a - b);
  const citations = citedIndices.map((index) =>
    toCitation(evidence[index - 1] as SearchResult, index),
  );

  // Textes cités modifiés ou abrogés
  const outdated: OutdatedCitation[] = citedIndices.flatMap((index) => {
    const result = evidence[index - 1] as SearchResult;
    const status = statusOf(result);
    if (status === 'in_force') return [];
    return [
      {
        index,
        status,
        amendedBy: amendedByOf(result),
        hasInForceCounterpart: inForceCounterpart(result, evidence) !== undefined,
      },
    ];
  });

  // Contradictions : métadonnées de la base ou signalement du coordinateur
  const conflicts = [
    ...retrievalConflicts(evidence),
    ...(input.conflictHints ?? []).map((hint) => hint.description),
  ];

  const notices: string[] = [];
  if (outdated.length > 0) notices.push(outdatedNotice(outdated, evidence, language));
  if (conflicts.length > 0) notices.push(conflictNotice(conflicts, language));

  let verdict: Verdict = 'ANSWERED_WITH_CITATIONS';
  let rule = draftAccepted === false ? 'answered:extractive_after_rejection' : 'answered:cited';
  if (outdated.some((item) => !item.hasInForceCounterpart)) {
    verdict = 'OUTDATED_TEXT';
    rule = 'outdated_text:no_in_force_counterpart';
  }
  if (conflicts.length > 0) {
    verdict = 'CONFLICT_BETWEEN_TEXTS';
    rule = 'conflict_between_texts';
  }
  if (referral) {
    verdict = 'REFER_TO_HUMAN';
    rule = `refer_to_human:${sensitiveCategory}`;
  }

  const reply = [referral, answer, ...notices].filter(Boolean).join('\n\n');
  return {
    ...base,
    verdict,
    reply,
    citations,
    draftAccepted,
    rejectionReasons,
    checks,
    rule,
    outdated,
    conflicts,
  };
}
