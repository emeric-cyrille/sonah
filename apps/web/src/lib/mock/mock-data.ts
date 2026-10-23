/**
 * Données du mode démonstration (NEXT_PUBLIC_API_MOCK=1).
 * Les extraits cités sont verbatim (voir legal-texts.ts) ; les réponses paraphrasent ces seuls extraits.
 * Les exemples internationaux renvoient à des textes publics vérifiables.
 */
import type { Locale } from '@/i18n/config';
import { MOCK_LEGAL_TEXTS } from './legal-texts';

type Bilingual = Readonly<Record<Locale, string>>;

export interface MockCitation {
  readonly index: number;
  readonly documentId: string;
  readonly sourceId: string;
  readonly title: string;
  readonly reference: string;
  readonly excerpt: string;
  readonly url: string;
  readonly status: string;
}

export function citationFor(index: number, textId: string): MockCitation {
  const text = MOCK_LEGAL_TEXTS[textId];
  if (!text) throw new Error(`Texte de démonstration inconnu : ${textId}`);
  return {
    index,
    documentId: text.id,
    sourceId: text.sourceId,
    title: text.title,
    reference: text.reference,
    excerpt: text.content,
    url: text.url,
    status: text.status,
  };
}

// ─── Conversation ─────────────────────────────────────────────────

export interface MockAnswer {
  readonly id: string;
  readonly match: RegExp;
  readonly verdict: string;
  readonly texts: readonly string[];
  readonly reply: Bilingual;
}

export const MOCK_ANSWERS: readonly MockAnswer[] = [
  {
    id: 'conges',
    match: /cong[ée]s?\s*pay|paid leave|annual leave|vacances|holiday/i,
    verdict: 'ANSWERED_WITH_CITATIONS',
    texts: ['ct-89'],
    reply: {
      fr: "D'après le Code du travail, vous acquérez **un jour et demi ouvrable de congé payé par mois de service effectif**, à la charge de votre employeur [1]. Sur une année complète, cela fait 18 jours ouvrables.\n\nÀ noter :\n- une convention collective ou votre contrat peut prévoir plus favorable [1] ;\n- certaines absences comptent comme service effectif, par exemple une maladie médicalement constatée, dans la limite de six mois [1].",
      en: 'Under the Labour Code, you earn **one and a half working days of paid leave per month of actual service**, paid by your employer [1]. Over a full year, that is 18 working days.\n\nNote:\n- a collective agreement or your contract may provide more favourable terms [1];\n- some absences count as actual service, for example a medically certified illness, up to six months [1].\n\nThe excerpt is quoted in its original French.',
    },
  },
  {
    id: 'essai',
    match: /essai|probation/i,
    verdict: 'ANSWERED_WITH_CITATIONS',
    texts: ['ct-28'],
    reply: {
      fr: "La période d'essai doit être **prévue par écrit** [1]. Renouvellement compris, elle ne peut pas dépasser **six mois**, ou **huit mois pour les cadres** [1].\n\nElle ne doit pas non plus durer plus que le temps nécessaire pour évaluer le travailleur, compte tenu des usages de la profession [1].",
      en: 'A probation period must be **stipulated in writing** [1]. Including any renewal, it cannot exceed **six months**, or **eight months for managers** [1].\n\nIt also must not last longer than needed to assess the worker, given the practices of the profession [1].\n\nThe excerpt is quoted in its original French.',
    },
  },
  {
    id: 'maladie',
    match: /maladie|malade|sick|illness/i,
    verdict: 'REFER_TO_HUMAN',
    texts: ['ct-32', 'ct-34'],
    reply: {
      fr: "Pendant une maladie **dûment constatée par un médecin** agréé par l'employeur ou relevant d'un établissement hospitalier reconnu par l'État, votre contrat est **suspendu**, dans la limite de six mois ; ce délai est prorogé jusqu'à votre remplacement effectif [1].\n\nToute rupture d'un contrat à durée indéterminée suppose un **préavis** et une **notification écrite indiquant le motif** [2].\n\nLes textes que je connais ne suffisent pas à trancher votre cas précis : je vous conseille de contacter l'**inspection du travail** de votre ressort.",
      en: 'During an illness **duly certified by a doctor** approved by the employer or from a State-recognised hospital, your contract is **suspended**, for up to six months; this period is extended until you are actually replaced [1].\n\nAny termination of an open-ended contract requires **notice** and a **written notification stating the reason** [2].\n\nThe texts I know are not enough to decide your specific case: I recommend contacting your local **labour inspectorate**.\n\nExcerpts are quoted in their original French.',
    },
  },
  {
    id: 'salaire',
    match: /salaire|smig|minimum wage|wage|salary/i,
    verdict: 'INSUFFICIENT_EVIDENCE',
    texts: ['ct-62', 'ct-61'],
    reply: {
      fr: "Oui, le principe existe : **un décret fixe le salaire minimum interprofessionnel garanti (SMIG)** [1]. Mais ce décret ne fait pas partie des textes que j'ai indexés : **je ne peux pas vous donner son montant actuel** avec une source fiable.\n\nCe que dit le Code : à conditions égales de travail et d'aptitude professionnelle, le salaire est égal pour tous [2].",
      en: 'Yes, the principle exists: **a decree sets the guaranteed minimum wage (SMIG)** [1]. But that decree is not among the texts I have indexed: **I cannot give you its current amount** with a reliable source.\n\nWhat the Code says: for equal work and professional aptitude, wages are equal for all workers [2].\n\nExcerpts are quoted in their original French.',
    },
  },
  {
    id: 'force',
    match: /forc[ée]|forced|obligatoire|esclav|slavery/i,
    verdict: 'ANSWERED_WITH_CITATIONS',
    texts: ['ct-2'],
    reply: {
      fr: "Oui. Le Code du travail l'énonce clairement : **le travail forcé ou obligatoire est interdit** [1]. Il s'agit de tout travail exigé sous la menace d'une peine et pour lequel la personne ne s'est pas offerte de son plein gré [1].\n\nLe Code prévoit des exceptions limitées, par exemple le service militaire ou certaines obligations civiques [1].",
      en: 'Yes. The Labour Code states it clearly: **forced or compulsory labour is prohibited** [1]. This means any work demanded under the threat of a penalty and for which the person has not offered themselves voluntarily [1].\n\nThe Code provides limited exceptions, for example military service or certain civic obligations [1].\n\nThe excerpt is quoted in its original French.',
    },
  },
  {
    id: 'mandat',
    match: /pr[ée]sident|mandat|presidential|term of/i,
    verdict: 'OUTDATED_TEXT',
    texts: ['const-6'],
    reply: {
      fr: "Dans la version de 1996 de la Constitution que j'ai indexée, le Président est élu au suffrage universel direct pour **un mandat de sept ans renouvelable une fois** [1].\n\n**Attention : cet article a été modifié depuis**, notamment par la loi n° 2008-1 du 14 avril 2008. Je ne dispose pas encore de la version consolidée : vérifiez la version en vigueur avant de vous appuyer sur ce texte.",
      en: 'In the 1996 version of the Constitution that I have indexed, the President is elected by direct universal suffrage for **a seven-year term, renewable once** [1].\n\n**Caution: this article has been amended since**, notably by Law No. 2008-1 of 14 April 2008. I do not have the consolidated version yet: check the version in force before relying on this text.\n\nThe excerpt is quoted in its original French.',
    },
  },
  {
    id: 'revision',
    match: /r[ée]vision|r[ée]viser|amend|modifier la constitution/i,
    verdict: 'ANSWERED_WITH_CITATIONS',
    texts: ['const-63'],
    reply: {
      fr: "L'initiative de la révision appartient **concurremment au Président de la République et au Parlement** [1]. Une proposition venant des parlementaires doit être signée par **au moins un tiers des membres** de l'une ou l'autre chambre [1].\n\nLe Parlement se réunit alors en congrès et adopte le texte à la **majorité absolue** de ses membres ; le Président peut aussi soumettre la révision au référendum [1].",
      en: 'The initiative to amend the Constitution belongs **jointly to the President of the Republic and Parliament** [1]. A proposal from members of Parliament must be signed by **at least one third of the members** of either chamber [1].\n\nParliament then meets in congress and adopts the text by an **absolute majority** of its members; the President may also submit the amendment to a referendum [1].\n\nThe excerpt is quoted in its original French.',
    },
  },
  {
    id: 'expression',
    match: /expression|presse|press|speech|opinion/i,
    verdict: 'ANSWERED_WITH_CITATIONS',
    texts: ['const-preambule'],
    reply: {
      fr: "Oui. Le préambule de la Constitution garantit **la liberté de communication, la liberté d'expression et la liberté de presse**, ainsi que les libertés de réunion, d'association, syndicale et le droit de grève [1].\n\nCes libertés s'exercent **dans les conditions fixées par la loi** [1] : d'autres textes, que je n'ai pas encore indexés, en précisent les limites.",
      en: 'Yes. The preamble of the Constitution guarantees **freedom of communication, freedom of expression and freedom of the press**, as well as freedom of assembly, association, trade unions and the right to strike [1].\n\nThese freedoms are exercised **under the conditions set by law** [1]: other texts, which I have not indexed yet, specify their limits.\n\nThe excerpt is quoted in its original French.',
    },
  },
];

export const MOCK_OUT_OF_SCOPE: Bilingual = {
  fr: "Je ne trouve pas ce sujet dans les textes que je connais aujourd'hui (Code du travail de 1992 et Constitution de 1996). Plutôt que d'inventer une réponse, je préfère vous le dire.\n\nD'autres textes arrivent bientôt : cybersécurité, communications électroniques, données personnelles, état civil.",
  en: 'I cannot find this topic in the texts I know today (the 1992 Labour Code and the 1996 Constitution). Rather than invent an answer, I prefer to tell you.\n\nMore texts are coming soon: cybersecurity, electronic communications, personal data, civil status.',
};

// ─── Laboratoire ─────────────────────────────────────────────────

export interface MockAgent {
  readonly id: string;
  readonly name: Bilingual;
  readonly role: Bilingual;
  readonly mandate: Bilingual;
  readonly sources: Readonly<Record<Locale, readonly string[]>>;
}

export const MOCK_AGENTS: readonly MockAgent[] = [
  {
    id: 'labour',
    name: { fr: 'Agent Travail', en: 'Labour Agent' },
    role: { fr: 'Droit du travail', en: 'Labour law' },
    mandate: {
      fr: 'Répondre uniquement à partir du Code du travail indexé, citer les articles et signaler ce qui relève de textes non indexés.',
      en: 'Answer only from the indexed Labour Code, cite articles and flag what depends on texts not indexed.',
    },
    sources: { fr: ['Code du travail (1992)'], en: ['Labour Code (1992)'] },
  },
  {
    id: 'constitution',
    name: { fr: 'Agent Constitution', en: 'Constitution Agent' },
    role: { fr: 'Libertés et institutions', en: 'Freedoms and institutions' },
    mandate: {
      fr: 'Situer chaque situation au regard des droits et libertés garantis par la Constitution, en signalant les articles modifiés.',
      en: 'Assess each situation against the rights and freedoms guaranteed by the Constitution, flagging amended articles.',
    },
    sources: { fr: ['Constitution (1996)'], en: ['Constitution (1996)'] },
  },
  {
    id: 'standards',
    name: { fr: 'Agent Normes', en: 'Standards Agent' },
    role: { fr: 'Normes internationales', en: 'International standards' },
    mandate: {
      fr: 'Comparer avec des cadres internationaux publics et décrire les lacunes du corpus national, sans les combler par des suppositions.',
      en: 'Compare with public international frameworks and describe gaps in the national corpus, without filling them with assumptions.',
    },
    sources: {
      fr: ['Règlement (UE) 2016/679 (RGPD)', 'UIT-T X.1056'],
      en: ['Regulation (EU) 2016/679 (GDPR)', 'ITU-T X.1056'],
    },
  },
  {
    id: 'coordinator',
    name: { fr: 'Sonah · Coordination', en: 'Sonah · Coordination' },
    role: { fr: 'Synthèse et renvoi', en: 'Synthesis and referral' },
    mandate: {
      fr: 'Synthétiser les réponses des agents, signaler les conflits et décider du renvoi vers une personne qualifiée.',
      en: 'Synthesise agent responses, flag conflicts and decide when to refer to a qualified person.',
    },
    sources: { fr: ['Réponses des agents'], en: ['Agent responses'] },
  },
];

export interface MockResponse {
  readonly agentId: string;
  readonly verdict: string;
  readonly texts: readonly string[];
  readonly message: Bilingual;
}

export interface MockGap {
  readonly id: string;
  readonly title: Bilingual;
  readonly description: Bilingual;
  readonly globalExample: Bilingual;
  readonly sources: readonly string[];
}

export interface MockEvent {
  readonly title: Bilingual;
  readonly description: Bilingual;
  readonly responses: readonly MockResponse[];
  readonly gaps: readonly MockGap[];
}

export interface MockScenario {
  readonly id: string;
  readonly title: Bilingual;
  readonly description: Bilingual;
  readonly domain: Bilingual;
  readonly events: readonly MockEvent[];
}

const GAP_HEALTH_DATA: MockGap = {
  id: 'health-data-confidentiality',
  title: {
    fr: 'Confidentialité des données de santé au travail',
    en: 'Confidentiality of health data at work',
  },
  description: {
    fr: "Aucun des textes indexés n'encadre la circulation des données de santé d'un salarié ni la conduite à tenir en cas de divulgation.",
    en: "None of the indexed texts governs how an employee's health data may circulate, nor what to do after a disclosure.",
  },
  globalExample: {
    fr: 'Union européenne : le RGPD classe les données concernant la santé parmi les catégories particulières de données, dont le traitement est interdit sauf exceptions limitativement énumérées (article 9).',
    en: 'European Union: the GDPR lists data concerning health among special categories of data, whose processing is prohibited save for listed exceptions (Article 9).',
  },
  sources: ['Règlement (UE) 2016/679, article 9'],
};

const GAP_BREACH_NOTIFICATION: MockGap = {
  id: 'breach-notification',
  title: {
    fr: 'Obligation de notifier une violation de données',
    en: 'Duty to notify a data breach',
  },
  description: {
    fr: 'Le corpus indexé ne prévoit ni délai ni autorité à qui signaler une intrusion touchant des données de clients.',
    en: 'The indexed corpus sets neither a deadline nor an authority to which an intrusion affecting customer data must be reported.',
  },
  globalExample: {
    fr: "RGPD : notification à l'autorité de contrôle dans les meilleurs délais et, si possible, 72 heures au plus tard après en avoir pris connaissance (article 33). L'UIT-T X.1056 propose des lignes directrices de gestion des incidents pour les opérateurs de télécommunications.",
    en: 'GDPR: notification to the supervisory authority without undue delay and, where feasible, no later than 72 hours after becoming aware of it (Article 33). ITU-T X.1056 provides incident management guidelines for telecommunication organisations.',
  },
  sources: ['Règlement (UE) 2016/679, article 33', 'Recommandation UIT-T X.1056'],
};

const GAP_DATA_SUBJECT: MockGap = {
  id: 'data-subject-information',
  title: {
    fr: 'Information des personnes concernées',
    en: 'Informing affected persons',
  },
  description: {
    fr: "La Constitution protège le secret des correspondances, mais aucun texte indexé n'oblige à prévenir les clients dont les données ont fuité.",
    en: 'The Constitution protects the secrecy of correspondence, but no indexed text requires informing customers whose data has leaked.',
  },
  globalExample: {
    fr: "RGPD : lorsqu'une violation est susceptible d'engendrer un risque élevé, la personne concernée en est informée dans les meilleurs délais (article 34).",
    en: 'GDPR: when a breach is likely to result in a high risk, the data subject is informed without undue delay (Article 34).',
  },
  sources: ['Règlement (UE) 2016/679, article 34'],
};

export const MOCK_SCENARIOS: readonly MockScenario[] = [
  {
    id: 'sick-leave-health-data',
    title: {
      fr: 'Arrêt maladie, licenciement et données de santé',
      en: 'Sick leave, dismissal and health data',
    },
    description: {
      fr: 'Une salariée en arrêt maladie reçoit une lettre de licenciement, puis découvre que son certificat médical circule en ligne.',
      en: 'An employee on sick leave receives a dismissal letter, then discovers that her medical certificate is circulating online.',
    },
    domain: { fr: 'Travail · données personnelles', en: 'Labour · personal data' },
    events: [
      {
        title: { fr: 'Un arrêt maladie de deux mois', en: 'A two-month sick leave' },
        description: {
          fr: "Une employée d'une PME est absente pour maladie. Un médecin agréé par l'employeur lui prescrit deux mois d'arrêt.",
          en: 'An employee of a small business is off sick. A doctor approved by the employer prescribes two months of leave.',
        },
        responses: [
          {
            agentId: 'labour',
            verdict: 'ANSWERED_WITH_CITATIONS',
            texts: ['ct-32', 'ct-89'],
            message: {
              fr: 'Le contrat est **suspendu** pendant une maladie dûment constatée par un médecin agréé, dans la limite de six mois [1]. Cette absence compte comme service effectif pour le calcul des congés, dans la même limite [2].',
              en: 'The contract is **suspended** during an illness duly certified by an approved doctor, for up to six months [1]. This absence counts as actual service for leave entitlement, within the same limit [2].',
            },
          },
        ],
        gaps: [],
      },
      {
        title: { fr: 'Une lettre de licenciement', en: 'A dismissal letter' },
        description: {
          fr: "Pendant l'arrêt, l'employeur adresse une lettre de licenciement mentionnant « absences prolongées ».",
          en: 'During the leave, the employer sends a dismissal letter citing "prolonged absences".',
        },
        responses: [
          {
            agentId: 'labour',
            verdict: 'REFER_TO_HUMAN',
            texts: ['ct-34', 'ct-32'],
            message: {
              fr: "La rupture d'un contrat à durée indéterminée exige un **préavis** et une **notification écrite du motif** [1]. Le contrat étant suspendu pendant la maladie [2], la validité de ce licenciement doit être appréciée au cas par cas.",
              en: 'Terminating an open-ended contract requires **notice** and a **written notification of the reason** [1]. Since the contract is suspended during the illness [2], the validity of this dismissal must be assessed case by case.',
            },
          },
          {
            agentId: 'coordinator',
            verdict: 'REFER_TO_HUMAN',
            texts: [],
            message: {
              fr: "Les agents s'accordent : la situation doit être soumise à l'**inspection du travail**. Sonah ne tranche pas un litige individuel.",
              en: 'The agents agree: the situation should be referred to the **labour inspectorate**. Sonah does not decide individual disputes.',
            },
          },
        ],
        gaps: [],
      },
      {
        title: {
          fr: 'Le certificat médical circule en ligne',
          en: 'The medical certificate circulates online',
        },
        description: {
          fr: "Une photo du certificat médical, avec le diagnostic, est partagée dans un groupe de discussion de l'entreprise.",
          en: 'A photo of the medical certificate, including the diagnosis, is shared in a company chat group.',
        },
        responses: [
          {
            agentId: 'constitution',
            verdict: 'INSUFFICIENT_EVIDENCE',
            texts: ['const-correspondance'],
            message: {
              fr: "La Constitution protège le **secret de toute correspondance** [1], mais aucun texte indexé ne traite directement des données de santé d'un salarié.",
              en: 'The Constitution protects the **secrecy of all correspondence** [1], but no indexed text directly addresses an employee’s health data.',
            },
          },
          {
            agentId: 'standards',
            verdict: 'INSUFFICIENT_EVIDENCE',
            texts: [],
            message: {
              fr: "Le texte national sur les données personnelles n'est pas encore intégré au corpus. Je signale une **lacune** et un exemple international, sans conclure sur le droit camerounais.",
              en: 'The national personal data text is not yet part of the corpus. I flag a **gap** and an international example, without drawing conclusions on Cameroonian law.',
            },
          },
        ],
        gaps: [GAP_HEALTH_DATA],
      },
    ],
  },
  {
    id: 'operator-data-breach',
    title: { fr: 'Fuite de données chez un opérateur', en: 'Data breach at an operator' },
    description: {
      fr: 'Un opérateur de communications électroniques subit une intrusion ; des données de clients sont publiées.',
      en: 'An electronic communications operator suffers an intrusion; customer data is published.',
    },
    domain: {
      fr: 'Cybersécurité · communications électroniques',
      en: 'Cybersecurity · electronic communications',
    },
    events: [
      {
        title: { fr: 'Intrusion détectée', en: 'Intrusion detected' },
        description: {
          fr: "L'équipe technique d'un opérateur détecte un accès non autorisé à sa base clients.",
          en: "An operator's technical team detects unauthorised access to its customer database.",
        },
        responses: [
          {
            agentId: 'standards',
            verdict: 'OUT_OF_SCOPE',
            texts: [],
            message: {
              fr: "Les lois sur la cybersécurité et les communications électroniques ne sont pas encore indexées. Je ne peux pas dire ce qu'elles imposent ; je décris la lacune et une pratique internationale.",
              en: 'The cybersecurity and electronic communications laws are not indexed yet. I cannot say what they require; I describe the gap and an international practice.',
            },
          },
        ],
        gaps: [GAP_BREACH_NOTIFICATION],
      },
      {
        title: { fr: 'Données de clients publiées', en: 'Customer data published' },
        description: {
          fr: 'Des numéros de téléphone et des historiques de messages apparaissent sur un forum public.',
          en: 'Phone numbers and message histories appear on a public forum.',
        },
        responses: [
          {
            agentId: 'constitution',
            verdict: 'ANSWERED_WITH_CITATIONS',
            texts: ['const-correspondance'],
            message: {
              fr: "Le **secret de toute correspondance est inviolable** ; il ne peut y être porté atteinte qu'en vertu de décisions de l'autorité judiciaire [1].",
              en: 'The **secrecy of all correspondence is inviolable**; it may only be infringed by decisions of the judicial authority [1].',
            },
          },
          {
            agentId: 'standards',
            verdict: 'INSUFFICIENT_EVIDENCE',
            texts: [],
            message: {
              fr: "Aucun texte indexé n'oblige à prévenir les clients concernés. Lacune signalée.",
              en: 'No indexed text requires notifying affected customers. Gap flagged.',
            },
          },
        ],
        gaps: [GAP_DATA_SUBJECT],
      },
      {
        title: { fr: 'Des employés mis en cause', en: 'Employees implicated' },
        description: {
          fr: "L'enquête interne soupçonne deux employés ; la direction veut les licencier immédiatement.",
          en: 'The internal investigation suspects two employees; management wants to dismiss them immediately.',
        },
        responses: [
          {
            agentId: 'labour',
            verdict: 'REFER_TO_HUMAN',
            texts: ['ct-34'],
            message: {
              fr: "Toute rupture d'un contrat à durée indéterminée suppose un **préavis** et une **notification écrite du motif** [1]. Les questions pénales relèvent de l'autorité judiciaire.",
              en: 'Any termination of an open-ended contract requires **notice** and a **written notification of the reason** [1]. Criminal matters are for the judicial authority.',
            },
          },
          {
            agentId: 'coordinator',
            verdict: 'REFER_TO_HUMAN',
            texts: [],
            message: {
              fr: "Synthèse : deux lacunes réglementaires identifiées, un renvoi vers l'autorité judiciaire et un conseil juridique pour l'opérateur.",
              en: 'Summary: two regulatory gaps identified, a referral to the judicial authority and legal advice for the operator.',
            },
          },
        ],
        gaps: [],
      },
    ],
  },
];
