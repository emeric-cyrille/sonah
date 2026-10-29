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
  {
    id: 'chat-logs-secondary-use',
    domain: 'data-protection',
    title: {
      fr: 'Six mois après : réutiliser les conversations des citoyens',
      en: 'Six months later: reusing citizens’ conversations',
    },
    description: {
      fr: "Sonah est déployé et très utilisé. Six mois plus tard, l'exploitant veut réutiliser les conversations pour entraîner son modèle, puis un assureur propose de les acheter pour cibler sa publicité. Les agents tranchent à partir de la loi n° 2024/017 ; l'exercice révèle l'absence de règles sur la réutilisation des données d'un service public d'IA.",
      en: 'Sonah is deployed and widely used. Six months later, the operator wants to reuse the conversations to train its model, then an insurer offers to buy them to target its advertising. The agents decide on the basis of Law No. 2024/017; the exercise reveals the lack of rules on reusing the data of a public AI service.',
    },
    steps: [
      {
        title: {
          fr: 'Étape 1 — Déploiement : les conversations contiennent des questions de santé',
          en: 'Step 1 — Deployment: conversations include health questions',
        },
        description: {
          fr: "Six mois après le lancement, l'équipe produit constate que de nombreuses conversations portent sur la santé (certificat médical, maladie, congé maladie). Elle propose de les réutiliser pour entraîner un modèle plus performant. L'autorité de protection des données (simulée) est consultée.",
          en: 'Six months after launch, the product team notices that many conversations concern health (medical certificate, illness, sick leave). It proposes to reuse them to train a better model. The data protection authority (simulated) is consulted.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'data-protection-authority',
            question: {
              fr: "L'exploitant d'un service public d'information peut-il réutiliser les conversations des citoyens pour entraîner son modèle d'IA, sans nouveau consentement ?",
              en: "May the operator of a public information service reuse citizens' conversations to train its AI model without new consent?",
            },
            retrievalQuery:
              'données à caractère personnel finalités déterminées explicites légitimes traitement ultérieur incompatible consentement préalable',
            pinned: [
              { sourceId: 'loi-2024-017-donnees-personnelles', reference: 'Article 11' },
              { sourceId: 'loi-2024-017-donnees-personnelles', reference: 'Article 9' },
            ],
          },
        ],
      },
      {
        title: {
          fr: 'Étape 2 — Rebondissement : un assureur veut les données pour sa publicité',
          en: 'Step 2 — Twist: an insurer wants the data for advertising',
        },
        description: {
          fr: "Un assureur privé propose d'acheter les conversations « pseudonymisées » liées à la santé pour proposer des contrats ciblés. Le cas passe d'une question de qualité de service à une question d'éthique et de données sensibles. Le coordinateur réunit l'autorité de protection des données, le conseiller juridique et Sonah.",
          en: 'A private insurer offers to buy "pseudonymised" health-related conversations to offer targeted policies. The case moves from service quality to ethics and sensitive data. The coordinator convenes the data protection authority, the legal adviser and Sonah.',
        },
        actions: [
          {
            kind: 'coordinate',
            agents: ['data-protection-authority', 'legal-adviser', 'sonah'],
            question: {
              fr: 'Les conversations des citoyens portant sur leur santé peuvent-elles être communiquées à un assureur à des fins de prospection commerciale ?',
              en: "May citizens' health-related conversations be disclosed to an insurer for direct marketing?",
            },
            retrievalQuery:
              'communication des données à des tiers prospection directe consentement préalable opposition données sensibles santé',
            pinned: [
              { sourceId: 'loi-2024-017-donnees-personnelles', reference: 'Article 41' },
              { sourceId: 'loi-2024-017-donnees-personnelles', reference: 'Article 40' },
              { sourceId: 'loi-2024-017-donnees-personnelles', reference: 'Article 48' },
            ],
          },
        ],
      },
      {
        title: {
          fr: 'Étape 3 — Controverse : garder les traces pour l’audit sans les réutiliser',
          en: 'Step 3 — Controversy: keeping traces for audit without reusing them',
        },
        description: {
          fr: "Sonah doit conserver des traces vérifiables pour l'audit (chaîne de hachage), mais la loi limite la réutilisation. Le conseiller juridique cherche quelle autorisation encadre la conservation et l'éventuel entraînement d'un modèle.",
          en: 'Sonah must keep verifiable traces for audit (hash chain), but the law limits reuse. The legal adviser looks for the authorisation that governs retention and any model training.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'legal-adviser',
            question: {
              fr: "Quelle autorisation préalable encadre un traitement de données personnelles, et la loi prévoit-elle des règles propres à l'entraînement de modèles d'IA ?",
              en: 'Which prior authorisation governs the processing of personal data, and does the law provide specific rules for training AI models?',
            },
            retrievalQuery:
              'traitement soumis autorisation préalable Autorité de protection des données à caractère personnel',
            pinned: [{ sourceId: 'loi-2024-017-donnees-personnelles', reference: 'Article 19' }],
          },
        ],
        gaps: [
          {
            id: 'public-ai-data-reuse',
            title: {
              fr: "Pas de règle sur la réutilisation des données d'un service public d'IA",
              en: 'No rule on reusing the data of a public AI service',
            },
            description: {
              fr: "La loi n° 2024/017 pose la limitation des finalités (art. 11), le consentement à la prospection (art. 41) et l'autorisation préalable (art. 19), mais aucun texte indexé ne précise si et comment les échanges avec un assistant public peuvent servir à entraîner un modèle, ni la durée de conservation des traces d'audit.",
              en: 'Law No. 2024/017 sets purpose limitation (art. 11), consent for direct marketing (art. 41) and prior authorisation (art. 19), but no indexed text states whether and how exchanges with a public assistant may be used to train a model, nor how long audit traces may be kept.',
            },
            globalExample: {
              fr: "Union européenne : le règlement sur l'IA (UE) 2024/1689 impose une gouvernance des données d'entraînement (art. 10) et la conservation des journaux des systèmes à haut risque (art. 12 et 19).",
              en: 'European Union: the AI Act (Regulation (EU) 2024/1689) requires governance of training data (art. 10) and record-keeping of logs for high-risk systems (arts. 12 and 19).',
            },
            sources: ['https://eur-lex.europa.eu/eli/reg/2024/1689/oj'],
          },
        ],
      },
    ],
  },
  {
    id: 'language-equity',
    domain: 'inclusion',
    title: {
      fr: 'Six mois après : les anglophones moins bien servis',
      en: 'Six months later: English speakers served less well',
    },
    description: {
      fr: "Le suivi montre que les questions posées en anglais obtiennent plus souvent des fiches en français seulement. Pour mesurer l'écart, l'équipe veut enregistrer la langue et la région des usagers : la loi l'interdit. L'exercice oppose l'égalité des langues officielles et la protection des données.",
      en: "Monitoring shows that questions asked in English more often receive French-only procedure sheets. To measure the gap, the team wants to record users' language and region: the law forbids it. The exercise pits the equality of official languages against data protection.",
    },
    steps: [
      {
        title: {
          fr: 'Étape 1 — Déploiement : un écart entre français et anglais',
          en: 'Step 1 — Deployment: a gap between French and English',
        },
        description: {
          fr: 'Six mois après le lancement, des associations des régions anglophones signalent que Sonah répond souvent « détails disponibles en français seulement ». Le conseiller juridique vérifie ce que la Constitution exige.',
          en: 'Six months after launch, associations from the English-speaking regions report that Sonah often answers "details only available in French". The legal adviser checks what the Constitution requires.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'legal-adviser',
            question: {
              fr: "La Constitution impose-t-elle que l'anglais et le français aient la même valeur, y compris pour l'information donnée aux citoyens ?",
              en: 'Does the Constitution require English and French to have equal status, including for information given to citizens?',
            },
            retrievalQuery: 'anglais et français langues officielles égale valeur bilinguisme',
            pinned: [{ sourceId: 'constitution-1996', reference: 'Article premier (partie 1/2)' }],
          },
        ],
      },
      {
        title: {
          fr: 'Étape 2 — Rebondissement : mesurer l’écart en profilant les usagers ?',
          en: 'Step 2 — Twist: measuring the gap by profiling users?',
        },
        description: {
          fr: "Pour prouver l'écart, l'équipe propose d'enregistrer la langue maternelle et la région de chaque usager. Le coordinateur consulte l'autorité de protection des données et le conseiller juridique.",
          en: "To prove the gap, the team proposes to record each user's mother tongue and region. The coordinator consults the data protection authority and the legal adviser.",
        },
        actions: [
          {
            kind: 'coordinate',
            agents: ['data-protection-authority', 'legal-adviser'],
            question: {
              fr: "Un service public peut-il enregistrer l'origine linguistique ou régionale de ses usagers pour mesurer une inégalité de traitement ?",
              en: "May a public service record its users' linguistic or regional origin to measure unequal treatment?",
            },
            retrievalQuery:
              'interdit traitement données origine raciale ethnique linguistique régionale données sensibles',
            pinned: [
              { sourceId: 'loi-2024-017-donnees-personnelles', reference: 'Article 48' },
              { sourceId: 'constitution-1996', reference: 'Article premier (partie 1/2)' },
            ],
          },
        ],
      },
      {
        title: {
          fr: 'Étape 3 — Décision : mesurer sans profiler',
          en: 'Step 3 — Decision: measure without profiling',
        },
        description: {
          fr: "Sonah mesure l'écart à partir de la langue de chaque message (comptage agrégé, sans identifiant ni profil) et publie la part de fiches disponibles dans chaque langue officielle. Reste à savoir qui doit fournir les fiches officielles en anglais.",
          en: 'Sonah measures the gap from the language of each message (aggregate counts, no identifier or profile) and publishes the share of procedure sheets available in each official language. It remains to be seen who must supply official procedure sheets in English.',
        },
        actions: [
          {
            kind: 'agent',
            agentId: 'sonah',
            question: {
              fr: 'Quelle garantie la Constitution donne-t-elle sur le bilinguisme dans tout le territoire ?',
              en: 'What guarantee does the Constitution give on bilingualism throughout the territory?',
            },
            retrievalQuery:
              'promotion du bilinguisme sur toute l’étendue du territoire langues officielles',
            pinned: [{ sourceId: 'constitution-1996', reference: 'Article premier (partie 1/2)' }],
          },
        ],
        gaps: [
          {
            id: 'bilingual-procedure-information',
            title: {
              fr: "Pas d'obligation outillée d'information administrative bilingue",
              en: 'No operational duty to publish administrative information in both languages',
            },
            description: {
              fr: "La Constitution (art. 1er, al. 3) pose l'égale valeur de l'anglais et du français, mais aucun texte indexé n'oblige les administrations à publier leurs procédures dans les deux langues, sous une forme lisible par machine. Mesurer l'inégalité est en outre limité par l'interdiction de traiter l'origine linguistique ou régionale (loi n° 2024/017, art. 48).",
              en: 'The Constitution (art. 1(3)) gives English and French equal status, but no indexed text requires administrations to publish their procedures in both languages in machine-readable form. Measuring inequality is further limited by the ban on processing linguistic or regional origin (Law No. 2024/017, art. 48).',
            },
            globalExample: {
              fr: 'Canada : la Loi sur les langues officielles (partie IV) oblige les institutions fédérales à communiquer avec le public et à lui offrir leurs services dans les deux langues officielles.',
              en: 'Canada: the Official Languages Act (Part IV) requires federal institutions to communicate with and provide services to the public in both official languages.',
            },
            sources: ['https://laws-lois.justice.gc.ca/eng/acts/o-3.01/'],
          },
        ],
      },
    ],
  },
];

export function findScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
