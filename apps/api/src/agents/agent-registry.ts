import type { Language } from '../policy/policy.types';
import type { AgentDefinition, AgentId } from './agent.types';

/** Règles déterministes communes à tous les agents qui répondent sur des textes. */
const GATED_RULES = [
  'pii-masking',
  'verbatim-citation-gate',
  'outdated-text-warning',
  'conflict-detection',
  'refer-sensitive-situations',
] as const;

/**
 * Registre des agents. Les institutions sont SIMULÉES : leurs « positions » sont celles
 * d'un exercice de crise, jamais une communication officielle.
 */
export const AGENTS: readonly AgentDefinition[] = [
  {
    id: 'sonah',
    name: { fr: 'Sonah', en: 'Sonah' },
    role: 'Innovative AI solution',
    mandate: {
      fr: 'Assistant citoyen : oriente dans les démarches administratives et explique les droits, en citant les textes officiels.',
      en: 'Citizen assistant: guides people through administrative procedures and explains their rights, citing official texts.',
    },
    sources: [],
    sourcePatterns: [],
    keywords: [
      'citoyen',
      'usager',
      'demande',
      'question',
      'chat',
      'citizen',
      'user',
      'asks',
      'request',
    ],
    rules: [...GATED_RULES, 'extractive-fallback'],
    instructions: {
      fr: 'Tu réponds directement au citoyen, simplement et chaleureusement.',
      en: 'You answer the citizen directly, simply and warmly.',
    },
  },
  {
    id: 'legal-adviser',
    name: { fr: 'Conseiller juridique et politique', en: 'Policy and legal adviser' },
    role: 'Policy and legal adviser',
    mandate: {
      fr: 'Vérifie la légalité et l’actualité des réponses, cite les articles applicables et signale les lacunes du cadre juridique.',
      en: 'Checks the legality and currency of answers, cites the applicable articles and flags gaps in the legal framework.',
    },
    sources: [],
    sourcePatterns: [],
    keywords: [
      'loi',
      'legal',
      'law',
      'article',
      'constitution',
      'texte',
      'abroge',
      'modifie',
      'amend',
      'repeal',
      'conformite',
      'compliance',
      'droit',
      'right',
      'lacune',
      'gap',
      'litige',
      'dispute',
      'version',
      'outdated',
      'perime',
    ],
    rules: [...GATED_RULES, 'legality-check', 'gap-flagging'],
    instructions: {
      fr: 'Tu es conseiller juridique. Indique la règle applicable, son statut (en vigueur, modifiée, abrogée) et toute lacune du cadre juridique.',
      en: 'You are a legal adviser. State the applicable rule, its status (in force, amended, repealed) and any gap in the legal framework.',
    },
  },
  {
    id: 'regulator-minpostel',
    name: {
      fr: 'Régulateur des télécommunications et du numérique (vue simulée MINPOSTEL)',
      en: 'Telecom and digital regulator (simulated MINPOSTEL view)',
    },
    role: 'Institutional participant',
    mandate: {
      fr: 'Point de vue du régulateur des communications électroniques et de la cybersécurité : continuité de service, sécurité des systèmes, obligations des opérateurs.',
      en: 'Electronic communications and cybersecurity regulator view: service continuity, system security, operator obligations.',
    },
    sources: [
      'loi-2010-013-communications-electroniques',
      'loi-2015-006-communications-electroniques',
      'loi-2010-012-cybersecurite',
      'cameroun-numerique-2020',
    ],
    sourcePatterns: [/communications?-electroniques/, /telecom/, /cyber/],
    keywords: [
      'telecom',
      'operateur',
      'operator',
      'reseau',
      'network',
      'internet',
      'cyber',
      'panne',
      'outage',
      'indisponib',
      'unavailab',
      'continuite',
      'continuity',
      'quota',
      'service numerique',
      'digital service',
      'llm',
      'modele de langage',
      'language model',
      'cloud',
      'securite',
      'security',
      'sla',
    ],
    rules: [...GATED_RULES, 'service-continuity-check'],
    instructions: {
      fr: 'Tu représentes, dans un exercice simulé, le régulateur des télécommunications et du numérique. Raisonne sur la continuité et la sécurité des services numériques publics.',
      en: 'In a simulated exercise, you represent the telecom and digital regulator. Reason about the continuity and security of public digital services.',
    },
  },
  {
    id: 'data-protection-authority',
    name: {
      fr: 'Autorité de protection des données personnelles (vue simulée)',
      en: 'Personal data protection authority (simulated view)',
    },
    role: 'Institutional participant',
    mandate: {
      fr: 'Point de vue de l’autorité de protection des données : licéité des traitements, minimisation, durée de conservation, droits des personnes.',
      en: 'Data protection authority view: lawfulness of processing, minimisation, retention periods, data subject rights.',
    },
    sources: ['loi-2024-017-donnees-personnelles'],
    sourcePatterns: [/donnees-personnelles/, /protection-des-donnees/, /personal-data/, /privacy/],
    keywords: [
      'donnees personnelles',
      'personal data',
      'vie privee',
      'privacy',
      'cni',
      'identite',
      'identity',
      'telephone',
      'phone',
      'email',
      'e-mail',
      'conservation',
      'retention',
      'consentement',
      'consent',
      'fuite',
      'leak',
      'pii',
    ],
    rules: [...GATED_RULES, 'data-minimisation-check'],
    instructions: {
      fr: 'Tu représentes, dans un exercice simulé, l’autorité de protection des données personnelles. Évalue la minimisation, la conservation et la sécurité des données.',
      en: 'In a simulated exercise, you represent the personal data protection authority. Assess minimisation, retention and security of data.',
    },
  },
  {
    id: 'ministry-business',
    name: {
      fr: 'Ministère chargé de la création d’entreprise et de l’administration (vue simulée)',
      en: 'Ministry for business creation and public administration (simulated view)',
    },
    role: 'Institutional participant',
    mandate: {
      fr: 'Point de vue du ministère : création d’entreprise, guichets uniques, autorisations d’exercer, simplification des procédures.',
      en: 'Ministry view: business creation, one-stop shops, operating licences, simplification of procedures.',
    },
    sources: ['decret-2017-0877-pm-cfce', 'loi-2024-016-etat-civil'],
    sourcePatterns: [/cfce/, /ohada/, /societes/, /commerc/, /entreprise/, /pme/, /investissement/],
    keywords: [
      'entreprise',
      'business',
      'societe',
      'company',
      'restaurant',
      'commerce',
      'immatricul',
      'registration',
      'register',
      'licence',
      'license',
      'autorisation',
      'permit',
      'guichet',
      'one-stop',
      'cfce',
      'patente',
      'hygiene',
      'mairie',
      'municipal',
      'council',
      'procedure',
    ],
    rules: [...GATED_RULES, 'procedure-consistency-check'],
    instructions: {
      fr: 'Tu représentes, dans un exercice simulé, le ministère chargé de la création d’entreprise. Décris la procédure et les autorités compétentes.',
      en: 'In a simulated exercise, you represent the ministry for business creation. Describe the procedure and the competent authorities.',
    },
  },
  {
    id: 'coordinator',
    name: { fr: 'Coordinateur multi-agents', en: 'Multi-agent coordinator' },
    role: 'Multi-agent coordination',
    mandate: {
      fr: 'Oriente chaque événement vers les agents concernés selon leur mandat, fusionne leurs réponses, détecte les contradictions et décide de l’escalade vers un humain.',
      en: 'Routes each event to the concerned agents by mandate, merges their answers, detects contradictions and decides on escalation to a human.',
    },
    sources: [],
    sourcePatterns: [],
    keywords: [],
    rules: ['routing-by-mandate', 'position-conflict-detection', 'escalation-to-human'],
    instructions: {
      fr: 'Tu coordonnes les agents.',
      en: 'You coordinate the agents.',
    },
  },
];

const BY_ID = new Map(AGENTS.map((agent) => [agent.id, agent]));

export function getAgent(id: AgentId): AgentDefinition {
  const agent = BY_ID.get(id);
  if (!agent) throw new Error(`Agent inconnu : ${id}`);
  return agent;
}

export function isAgentId(id: string): id is AgentId {
  return BY_ID.has(id as AgentId);
}

export interface AgentDescription {
  readonly id: AgentId;
  readonly name: string;
  readonly role: string;
  readonly mandate: string;
  readonly sources: string[];
  readonly rules: string[];
}

export function describeAgent(agent: AgentDefinition, language: Language): AgentDescription {
  return {
    id: agent.id,
    name: agent.name[language],
    role: agent.role,
    mandate: agent.mandate[language],
    sources: [...agent.sources],
    rules: [...agent.rules],
  };
}
