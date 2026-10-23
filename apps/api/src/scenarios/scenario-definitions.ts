/**
 * Scénarios d'erreur interactifs : chaque scénario est découpé en étapes publiées une à une
 * (POST /scenarios/runs/:runId/next), jamais toutes à la fois.
 *
 * Les institutions sont simulées. Les lacunes sont formulées au niveau du domaine ; un exemple
 * international n'est cité que s'il est vérifié, sinon il est marqué « à vérifier ».
 */
import type { PositionDefinition, ScenarioDefinition } from './scenario.types';

const CONSTITUTION_ART6_OVERLAY = {
  sourceId: 'constitution-1996',
  reference: 'Article 6',
  status: 'amended',
  amendedBy: 'loi n° 2008-1 du 14 avril 2008',
} as const;

const CONSTITUTION_ART6 = { sourceId: 'constitution-1996', reference: 'Article 6' } as const;

/** Positions institutionnelles simulées et contradictoires (scénario du restaurant). */
const RESTAURANT_POSITIONS: readonly PositionDefinition[] = [
  {
    holder: {
      fr: 'Ministère chargé de la création d’entreprise (simulé)',
      en: 'Ministry for business creation (simulated)',
    },
    topic: 'restaurant-opening-sequence',
    statement: {
      fr: "Immatriculez d'abord l'entreprise au guichet unique, puis demandez le certificat d'hygiène.",
      en: 'Register the business at the one-stop shop first, then apply for the hygiene certificate.',
    },
    precedence: ['business-registration', 'hygiene-certificate'],
  },
  {
    holder: { fr: 'Mairie (simulée)', en: 'City council (simulated)' },
    topic: 'restaurant-opening-sequence',
    statement: {
      fr: "Le certificat d'hygiène est exigé avant toute immatriculation.",
      en: 'The hygiene certificate is required before any registration.',
    },
    precedence: ['hygiene-certificate', 'business-registration'],
  },
];

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: 'outdated-law',
    domain: 'legal-information',
    title: {
      fr: 'Un texte périmé servi à un citoyen',
      en: 'Outdated law served to a citizen',
    },
    description: {
      fr: "Sonah s'appuie sur l'article 6 de la Constitution de 1996, modifié en 2008. Le nœud de politique détecte le texte périmé, le conseiller juridique corrige, et l'exercice met au jour l'absence de textes consolidés lisibles par machine.",
      en: 'Sonah relies on article 6 of the 1996 Constitution, amended in 2008. The policy node detects the outdated text, the legal adviser corrects it, and the exercise surfaces the lack of consolidated, machine-readable legal texts.',
    },
    steps: [
      {
        title: {
          fr: 'Un citoyen interroge Sonah sur le mandat présidentiel',
          en: 'A citizen asks Sonah about the presidential term',
        },
        description: {
          fr: 'Question reçue en période électorale. Le seul texte indexé est la Constitution de 1996 : son article 6 a été modifié par la loi n° 2008-1 du 14 avril 2008.',
          en: 'Question received during an election period. The only indexed text is the 1996 Constitution: its article 6 was amended by Law No. 2008-1 of 14 April 2008.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'sonah',
            question: {
              fr: 'Combien de fois le Président de la République peut-il être réélu ?',
              en: 'How many times can the President of the Republic be re-elected?',
            },
            retrievalQuery: 'Président de la République élu mandat sept ans renouvelable',
            pinned: [CONSTITUTION_ART6],
            statusOverlay: [CONSTITUTION_ART6_OVERLAY],
          },
        ],
      },
      {
        title: {
          fr: 'Le conseiller juridique est consulté',
          en: 'The legal adviser is consulted',
        },
        description: {
          fr: "Le verdict OUTDATED_TEXT déclenche la consultation du conseiller juridique : la réponse repose-t-elle sur le texte en vigueur ? Le coordinateur décide de l'escalade.",
          en: 'The OUTDATED_TEXT verdict triggers a consultation of the legal adviser: is the answer based on the text in force? The coordinator decides on escalation.',
        },
        actions: [
          {
            kind: 'coordinate',
            agents: ['legal-adviser'],
            question: {
              fr: "L'article 6 de la Constitution de 1996 cité au citoyen est-il le texte en vigueur sur la durée et le renouvellement du mandat présidentiel ?",
              en: 'Is article 6 of the 1996 Constitution, cited to the citizen, the text in force on the length and renewal of the presidential term?',
            },
            retrievalQuery: 'Président de la République mandat renouvelable article 6 Constitution',
            pinned: [CONSTITUTION_ART6],
            statusOverlay: [CONSTITUTION_ART6_OVERLAY],
          },
        ],
      },
      {
        title: {
          fr: 'Analyse de la cause : pas de version consolidée',
          en: 'Root cause: no consolidated version',
        },
        description: {
          fr: "Le corpus ne contient que la version d'origine : les modifications sont publiées comme des lois distinctes et aucune version consolidée lisible par machine n'est disponible.",
          en: 'The corpus only holds the original version: amendments are published as separate laws and no consolidated, machine-readable version is available.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'legal-adviser',
            question: {
              fr: 'Existe-t-il une version consolidée officielle de la Constitution intégrant la révision de 2008 ?',
              en: 'Is there an official consolidated version of the Constitution that includes the 2008 revision?',
            },
            retrievalQuery: 'révision de la Constitution loi constitutionnelle version consolidée',
          },
        ],
        gaps: [
          {
            id: 'consolidated-legal-texts',
            title: {
              fr: 'Pas de textes juridiques consolidés et lisibles par machine',
              en: 'No consolidated, machine-readable legal texts',
            },
            description: {
              fr: "Les modifications sont publiées comme des actes séparés ; il n'existe pas de version officielle consolidée de chaque article avec ses dates de validité, sous un format ouvert. Ni un citoyen ni un assistant d'IA ne peut savoir de façon fiable quelle version est en vigueur.",
              en: 'Amendments are published as separate acts; there is no official consolidated version of each article with its validity dates, in an open format. Neither a citizen nor an AI assistant can reliably tell which version is in force.',
            },
            globalExample: {
              fr: 'France : Légifrance publie les versions consolidées des codes et lois avec leurs dates de vigueur, aussi en données ouvertes (DILA). Union européenne : EUR-Lex publie les versions consolidées des actes.',
              en: 'France: Légifrance publishes consolidated versions of codes and laws with their validity dates, also as open data (DILA). European Union: EUR-Lex publishes consolidated versions of legal acts.',
            },
            sources: ['https://www.legifrance.gouv.fr', 'https://eur-lex.europa.eu'],
          },
        ],
      },
    ],
  },
  {
    id: 'personal-data-in-chat',
    domain: 'data-protection',
    title: {
      fr: 'Un citoyen partage ses données personnelles',
      en: 'Citizen shares personal data in chat',
    },
    description: {
      fr: "Un citoyen écrit son numéro de CNI, son téléphone et son e-mail. Les données sont masquées avant tout stockage ou envoi au modèle ; l'autorité de protection des données évalue ; la conservation des conversations d'IA se révèle non encadrée.",
      en: 'A citizen types their ID card number, phone and email. The data is masked before any storage or model call; the data protection authority assesses; the retention of AI chat logs turns out to be unregulated.',
    },
    steps: [
      {
        title: {
          fr: 'Message contenant des données personnelles',
          en: 'Message containing personal data',
        },
        description: {
          fr: 'Le citoyen inclut des identifiants dans sa question. Le masquage déterministe remplace chaque donnée par un jeton avant tout traitement ; seuls les types et le nombre sont tracés.',
          en: 'The citizen includes identifiers in the question. Deterministic masking replaces each item with a token before any processing; only types and counts are traced.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'sonah',
            question: {
              fr: "Bonjour, je m'appelle Paul. Ma CNI n° 112233445, mon numéro +237 699 12 34 56 et mon e-mail paul.ndi@example.cm. Mon employeur peut-il me faire travailler plus de quarante heures par semaine ?",
              en: 'Hello, my name is Paul. My ID card number is 112233445, my phone +237 699 12 34 56 and my email paul.ndi@example.cm. Can my employer make me work more than forty hours a week?',
            },
            retrievalQuery: 'durée de travail quarante heures par semaine',
          },
        ],
      },
      {
        title: {
          fr: "L'autorité de protection des données évalue l'incident",
          en: 'The data protection authority assesses the incident',
        },
        description: {
          fr: "Le coordinateur consulte l'autorité de protection des données (simulée) et le conseiller juridique : quelles règles s'appliquent aux données saisies dans un assistant public ?",
          en: 'The coordinator consults the (simulated) data protection authority and the legal adviser: which rules apply to data typed into a public assistant?',
        },
        actions: [
          {
            kind: 'coordinate',
            agents: ['data-protection-authority', 'legal-adviser'],
            question: {
              fr: "Quelles obligations s'appliquent aux données personnelles (numéro de CNI, téléphone, e-mail) saisies par un citoyen dans un assistant conversationnel public ?",
              en: 'Which obligations apply to personal data (ID card number, phone, email) typed by a citizen into a public conversational assistant?',
            },
            retrievalQuery:
              'protection des données à caractère personnel traitement conservation consentement',
          },
        ],
      },
      {
        title: {
          fr: 'Durée de conservation des conversations',
          en: 'Retention of chat transcripts',
        },
        description: {
          fr: "Question de l'audit : combien de temps un service public peut-il conserver les conversations d'un assistant d'IA, et qui peut y accéder ?",
          en: 'Audit question: how long may a public service keep AI assistant transcripts, and who may access them?',
        },
        actions: [
          {
            kind: 'coordinate',
            question: {
              fr: "Quelle durée de conservation des données personnelles s'applique aux conversations d'un assistant d'IA public ?",
              en: 'Which retention period for personal data applies to the transcripts of a public AI assistant?',
            },
            retrievalQuery: 'conservation des données personnelles durée traitement',
          },
        ],
        gaps: [
          {
            id: 'ai-chat-retention',
            title: {
              fr: "Pas de règles de conservation pour les conversations d'assistants d'IA publics",
              en: 'No retention rules for public AI assistant transcripts',
            },
            description: {
              fr: "La durée de conservation, la finalité et l'accès aux transcriptions d'un assistant d'IA de service public ne sont pas précisés. L'applicabilité de la loi camerounaise de 2024 sur la protection des données personnelles à ces journaux est à vérifier. SONAH applique par défaut le masquage et la minimisation.",
              en: 'The retention period, purpose and access rules for transcripts of a public-service AI assistant are not specified. Whether Cameroon’s 2024 personal data protection law covers these logs is to be verified. SONAH applies masking and minimisation by default.',
            },
            globalExample: {
              fr: 'Union européenne : RGPD, article 5(1)(e) (limitation de la conservation) et article 25 (protection des données dès la conception et par défaut).',
              en: 'European Union: GDPR Article 5(1)(e) (storage limitation) and Article 25 (data protection by design and by default).',
            },
            sources: ['https://eur-lex.europa.eu/eli/reg/2016/679/oj'],
          },
        ],
      },
    ],
  },
  {
    id: 'llm-outage',
    domain: 'service-continuity',
    title: {
      fr: 'Panne du modèle de langage en pleine affluence',
      en: 'LLM outage / quota exhausted during peak',
    },
    description: {
      fr: "Le quota du modèle de langage est épuisé en pleine affluence. Sonah bascule sur des réponses extractives citées, le régulateur s'exprime sur la continuité de service, et l'absence de norme de service pour l'IA publique apparaît.",
      en: 'The language model quota runs out during peak demand. Sonah falls back to cited extractive answers, the regulator weighs in on service continuity, and the lack of a service standard for public AI emerges.',
    },
    steps: [
      {
        title: {
          fr: 'Quota du modèle épuisé',
          en: 'Model quota exhausted',
        },
        description: {
          fr: 'Pic de fréquentation : le fournisseur du modèle de langage refuse les requêtes. Les réponses doivent continuer, sans inventer.',
          en: 'Traffic peak: the language model provider rejects requests. Answers must keep flowing, without making things up.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'sonah',
            simulateModelOutage: true,
            question: {
              fr: 'Quelle est la durée légale du travail par semaine ?',
              en: 'What is the legal working time per week?',
            },
            retrievalQuery: 'durée de travail quarante heures par semaine',
          },
        ],
      },
      {
        title: {
          fr: 'Le régulateur est saisi de la continuité de service',
          en: 'The regulator is asked about service continuity',
        },
        description: {
          fr: 'La panne dure. Le coordinateur consulte le régulateur des télécommunications et du numérique (simulé) ; le modèle reste indisponible pour tous les agents.',
          en: 'The outage persists. The coordinator consults the (simulated) telecom and digital regulator; the model remains unavailable to every agent.',
        },
        actions: [
          {
            kind: 'coordinate',
            agents: ['regulator-minpostel'],
            simulateModelOutage: true,
            question: {
              fr: "Quelles obligations de continuité de service s'appliquent à un service numérique public en cas de panne de son fournisseur ?",
              en: 'Which service continuity obligations apply to a public digital service when its provider fails?',
            },
            retrievalQuery:
              'continuité du service communications électroniques obligations opérateur',
          },
        ],
      },
      {
        title: {
          fr: 'Bilan de l’incident',
          en: 'Incident review',
        },
        description: {
          fr: "Toutes les réponses pendant la panne ont été extractives et citées (voir les traces « fallback »). Reste la question : quel niveau de service exiger d'une IA publique ?",
          en: 'Every answer during the outage was extractive and cited (see the "fallback" trace steps). The open question: what service level should a public AI meet?',
        },
        actions: [
          {
            kind: 'coordinate',
            simulateModelOutage: true,
            question: {
              fr: "Quel niveau de disponibilité et quel mode dégradé un service public d'IA doit-il garantir en cas de panne ?",
              en: 'What availability level and degraded mode must a public AI service guarantee during an outage?',
            },
            retrievalQuery: 'continuité du service public disponibilité panne obligations',
          },
        ],
        gaps: [
          {
            id: 'public-ai-service-level',
            title: {
              fr: "Pas de norme de niveau de service pour les services publics d'IA",
              en: 'No service-level standard for public AI services',
            },
            description: {
              fr: "Aucun objectif de disponibilité, mode dégradé obligatoire ni obligation de signalement d'incident n'est défini pour les assistants d'IA au service des citoyens.",
              en: 'No availability target, mandatory degraded mode or incident reporting duty is defined for AI assistants serving citizens.',
            },
            globalExample: {
              fr: "Union européenne : règlement sur l'IA (UE) 2024/1689, article 15 (exactitude, robustesse et cybersécurité des systèmes à haut risque). Royaume-Uni : Government Service Standard, point 14 « Operate a reliable service ».",
              en: 'European Union: AI Act, Regulation (EU) 2024/1689, Article 15 (accuracy, robustness and cybersecurity of high-risk systems). United Kingdom: Government Service Standard, point 14 "Operate a reliable service".',
            },
            sources: [
              'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
              'https://www.gov.uk/service-manual/service-standard',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'conflicting-requirements',
    domain: 'business-creation',
    title: {
      fr: 'Exigences contradictoires pour ouvrir un restaurant',
      en: 'Conflicting requirements for opening a restaurant',
    },
    description: {
      fr: "Deux institutions (simulées) imposent un ordre inverse des formalités. Le coordinateur détecte la contradiction, oriente vers un humain, et l'absence de registre unique des procédures apparaît.",
      en: 'Two (simulated) institutions require the formalities in opposite order. The coordinator detects the contradiction, refers to a human, and the lack of a single procedure registry emerges.',
    },
    steps: [
      {
        title: {
          fr: 'Une citoyenne veut ouvrir un restaurant',
          en: 'A citizen wants to open a restaurant',
        },
        description: {
          fr: 'Elle demande à Sonah les démarches pour ouvrir un restaurant à Douala.',
          en: 'She asks Sonah for the steps to open a restaurant in Douala.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'sonah',
            question: {
              fr: 'Quelles démarches pour ouvrir un restaurant à Douala ?',
              en: 'What are the steps to open a restaurant in Douala?',
            },
            retrievalQuery: 'création entreprise commerce restaurant autorisation démarches',
          },
        ],
      },
      {
        title: {
          fr: 'Deux exigences contradictoires',
          en: 'Two contradictory requirements',
        },
        description: {
          fr: "Le ministère (simulé) exige l'immatriculation au guichet unique avant le certificat d'hygiène ; la mairie (simulée) exige le certificat d'hygiène avant l'immatriculation.",
          en: 'The (simulated) ministry requires registration at the one-stop shop before the hygiene certificate; the (simulated) city council requires the hygiene certificate before registration.',
        },
        actions: [
          {
            kind: 'coordinate',
            agents: ['ministry-business', 'legal-adviser'],
            question: {
              fr: "Dans quel ordre faut-il obtenir l'immatriculation de l'entreprise et le certificat d'hygiène pour ouvrir un restaurant ?",
              en: 'In which order must the business registration and the hygiene certificate be obtained to open a restaurant?',
            },
            retrievalQuery:
              'immatriculation entreprise autorisation hygiène salubrité établissement',
            positions: RESTAURANT_POSITIONS,
          },
        ],
      },
      {
        title: {
          fr: 'Qui fait foi ?',
          en: 'Which rule prevails?',
        },
        description: {
          fr: "Aucun texte indexé ne tranche l'ordre des formalités ni l'autorité compétente. Sonah doit le dire à la citoyenne et l'orienter vers un humain.",
          en: 'No indexed text settles the order of formalities or the competent authority. Sonah must say so to the citizen and refer her to a human.',
        },
        actions: [
          {
            kind: 'coordinate',
            agents: ['sonah', 'ministry-business'],
            question: {
              fr: "Quelle autorité est compétente pour fixer l'ordre des formalités d'ouverture d'un restaurant ?",
              en: 'Which authority is competent to set the order of formalities for opening a restaurant?',
            },
            retrievalQuery: 'autorité compétente formalités création entreprise commune',
            positions: RESTAURANT_POSITIONS,
          },
        ],
        gaps: [
          {
            id: 'single-procedure-registry',
            title: {
              fr: 'Pas de registre unique et opposable des procédures administratives',
              en: 'No single authoritative registry of administrative procedures',
            },
            description: {
              fr: "Les responsabilités entre ministères et collectivités ne sont pas clairement réparties et il n'existe pas de source unique, opposable et lisible par machine décrivant chaque procédure (étapes, ordre, pièces, coûts, autorité compétente).",
              en: 'Responsibilities between ministries and local councils are not clearly allocated, and there is no single, authoritative, machine-readable source describing each procedure (steps, order, documents, fees, competent authority).',
            },
            globalExample: {
              fr: 'Union européenne : portail numérique unique (règlement (UE) 2018/1724) et guichets uniques de la directive « services » 2006/123/CE.',
              en: 'European Union: Single Digital Gateway (Regulation (EU) 2018/1724) and the Points of Single Contact of the Services Directive 2006/123/EC.',
            },
            sources: [
              'https://eur-lex.europa.eu/eli/reg/2018/1724/oj',
              'https://eur-lex.europa.eu/eli/dir/2006/123/oj',
            ],
          },
        ],
      },
    ],
  },
];

export function findScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
