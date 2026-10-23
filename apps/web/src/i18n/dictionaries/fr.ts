/**
 * Dictionnaire de référence (français). Sa forme définit le type `Dictionary` :
 * le dictionnaire anglais doit fournir exactement les mêmes clés.
 */
export const fr = {
  meta: {
    title: 'Sonah — vos droits et les textes officiels du Cameroun, expliqués simplement',
    description:
      'Posez votre question à Sonah : droit du travail, Constitution du Cameroun. Sonah cite les textes officiels quand il les trouve et vous dit quand il ne sait pas. Gratuit, sans inscription.',
    ogLocale: 'fr_CM',
    manifestName: 'Sonah — Assistant juridique et administratif',
    manifestDescription: 'Les textes officiels du Cameroun, expliqués et cités',
  },
  common: {
    skipToContent: 'Aller au contenu',
    loading: 'Chargement…',
    retry: 'Réessayer',
    close: 'Fermer',
    copy: 'Copier',
    copied: 'Copié',
    backHome: "Retour à l'accueil",
    mockBanner:
      'Mode démonstration : les réponses de cette page sont simulées localement (NEXT_PUBLIC_API_MOCK=1).',
    unavailable: 'Le service ne répond pas pour le moment. Réessayez dans quelques instants.',
    rateLimited: (seconds: number): string =>
      `Beaucoup de questions en peu de temps : patientez ${seconds} seconde${seconds > 1 ? 's' : ''} avant de réessayer.`,
    rateLimitedNoDelay:
      'Beaucoup de questions en peu de temps : patientez un instant avant de réessayer.',
    genericError: "Quelque chose s'est mal passé. Pouvez-vous réessayer ?",
    invalidResponse: 'Le serveur a renvoyé une réponse inattendue.',
    busy: 'Une étape est déjà en cours de traitement. Patientez quelques secondes, puis réessayez.',
    notFound: 'Élément introuvable.',
    dateLocale: 'fr-FR',
  },
  header: {
    mainNav: 'Navigation principale',
    mobileNav: 'Navigation mobile',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    cta: 'Parler à Sonah',
    links: {
      topics: 'Sujets',
      lab: 'Laboratoire',
      audit: 'Audit',
      about: 'À propos',
    },
    language: {
      label: 'Langue',
      switchTo: 'Switch to English',
      current: 'FR',
      other: 'EN',
    },
  },
  footer: {
    tagline:
      "Système d'Orientation Nationale et d'Accompagnement Harmonisé. Les réponses de Sonah sont indicatives : en cas de doute, l'administration concernée ou un professionnel du droit fait foi.",
    explore: 'Explorer',
    project: 'Projet',
    footerNav: 'Pied de page',
    links: {
      chat: 'Parler à Sonah',
      topics: 'Sujets couverts',
      how: 'Comment ça marche',
      lab: 'Laboratoire de politiques',
      audit: "Journal d'audit",
      about: 'À propos · architecture',
      privacy: 'Données et confidentialité',
      source: 'Code source',
      contact: 'Contact',
    },
    madeIn: 'Fait au Cameroun',
    prototype: 'Prototype indépendant',
    motifs: 'Motifs : ndop, toghu, perlage bamiléké, teleuk mousgoum',
  },
  orb: {
    label: 'Sonah, votre assistant (illustration animée)',
  },
  patterns: {
    ndop: { label: 'Ndop', origin: 'Grassfields · Ouest' },
    toghu: { label: 'Toghu', origin: 'Nord-Ouest' },
    perles: { label: 'Perlage bamiléké', origin: 'Ouest' },
    teleuk: { label: 'Teleuk mousgoum', origin: 'Extrême-Nord' },
  },
  home: {
    eyebrow: 'Assistant juridique · Cameroun',
    headline: { first: 'Bonjour,', words: ['je', 'suis'], accent: 'Sonah.' },
    intro:
      'Vos droits au travail, une naissance à déclarer, vos données personnelles, ce que dit la Constitution… Posez votre question avec vos mots : je cherche dans les textes officiels, je cite les articles que je trouve et je vous dis quand je ne sais pas.',
    askLabel: 'Votre question',
    askPlaceholder: 'Ex. : combien de jours de congés payés par an ?',
    askButton: 'Demander',
    askNote: 'Gratuit · Sans inscription · Français ou anglais',
    faqEyebrow: 'Ce que Sonah sait déjà',
    faqTitle: 'Une question sur vos droits',
    faqTitleEm: 'au travail ou ailleurs',
    faqLead:
      "Ces questions s'appuient sur les textes indexés aujourd'hui : Code du travail, Constitution et ses révisions, lois sur l'état civil, les données personnelles et la cybersécurité, décret sur la création d'entreprise. Touchez-en une pour démarrer.",
    faqAll: 'Voir les sujets couverts',
    questions: [
      { topic: 'Congés', question: 'Combien de jours de congés payés ai-je droit par an ?' },
      { topic: 'Embauche', question: "Combien de temps peut durer une période d'essai ?" },
      {
        topic: 'Maladie',
        question: 'Mon employeur peut-il me licencier pendant un arrêt maladie ?',
      },
      { topic: 'État civil', question: 'Dans quel délai faut-il déclarer une naissance ?' },
      {
        topic: 'Données personnelles',
        question: 'Quels sont mes droits sur mes données personnelles ?',
      },
      {
        topic: 'Cybersécurité',
        question: "Quelles sanctions pour l'accès frauduleux à un système informatique ?",
      },
      {
        topic: 'Entreprise',
        question: 'Quelles pièces faut-il pour créer une entreprise au CFCE ?',
      },
      {
        topic: 'Constitution',
        question: 'Combien de temps dure le mandat du Président de la République ?',
      },
    ],
    motifsEyebrow: 'Patrimoine camerounais',
    motifsTitle: 'Sonah porte les motifs du Cameroun.',
    marqueePause: 'Mettre en pause le défilement des motifs',
    marqueePlay: 'Reprendre le défilement des motifs',
    howEyebrow: 'Comment ça marche',
    howTitle: 'Une conversation, pas un formulaire.',
    steps: [
      {
        title: 'Vous racontez',
        text: 'Avec vos mots, en quelques phrases. Pas besoin de connaître le numéro de l’article ni le nom du texte.',
      },
      {
        title: 'Sonah cherche',
        text: 'Dans les textes officiels indexés, article par article : Code du travail, Constitution, état civil, données personnelles, cybersécurité, création d’entreprise.',
      },
      {
        title: 'Sonah répond, sources à l’appui',
        text: 'Il cite les textes quand il les trouve, signale un article modifié depuis, et vous dit quand il ne sait pas ou quand mieux vaut consulter un professionnel.',
      },
    ],
    promisesTitle: 'Trois engagements',
    promisesTitleEm: 'vérifiables',
    promises: [
      {
        title: 'Gratuit, vraiment.',
        text: "Rien à payer, ni à Sonah ni à un intermédiaire. L'information juridique appartient à tout le monde.",
      },
      {
        title: 'Honnête sur ses limites.',
        text: 'Quand un texte manque, se contredit ou a été modifié, Sonah le dit au lieu d’inventer une réponse.',
      },
      {
        title: 'Des sources, quand elles existent.',
        text: 'Sonah cite les textes quand il les trouve, avec l’extrait exact. Chaque réponse laisse une trace d’audit consultable.',
      },
    ],
    transparencyEyebrow: 'Pour les décideurs et les jurys',
    transparencyTitle: 'Voir comment Sonah raisonne.',
    transparencyCards: [
      {
        href: '/lab',
        title: 'Laboratoire de politiques',
        text: 'Des scénarios libérés événement par événement : les agents réagissent, les lacunes réglementaires apparaissent.',
      },
      {
        href: '/audit',
        title: "Journal d'audit",
        text: 'Chaque réponse est tracée étape par étape et chaînée par empreinte. Vérifiez l’intégrité de la chaîne.',
      },
      {
        href: '/about',
        title: 'Architecture · UIT Y.3172',
        text: 'Le pipeline, les textes couverts, ce qui est conservé et ce qui ne l’est pas.',
      },
    ],
    ctaTitle: 'Une question en tête ?',
    ctaText:
      'Sonah est là, à toute heure. Dites-moi ce qui vous préoccupe : je vous dirai ce que disent les textes, ou que je ne sais pas.',
    ctaButton: 'Discuter avec Sonah',
  },
  topics: {
    metaTitle: 'Sujets couverts',
    metaDescription:
      'Les textes officiels que Sonah connaît aujourd’hui, et ceux qui arrivent bientôt.',
    eyebrow: 'Sujets',
    title: 'Ce que Sonah connaît',
    titleEm: "aujourd'hui",
    lead: "Sonah ne répond qu'à partir des textes qu'il a indexés. Voici ce qui est couvert, et ce qui arrive. Pour le reste, il vous le dira franchement.",
    availableEyebrow: 'Disponible',
    ask: 'Demander à Sonah →',
    available: [
      {
        id: 'travail',
        title: 'Droit du travail',
        source: 'Code du travail · loi n° 92-007 du 14 août 1992 (versions française et anglaise)',
        questions: [
          'Combien de jours de congés payés ai-je droit par an ?',
          "Combien de temps peut durer une période d'essai ?",
          'Mon employeur peut-il me licencier pendant un arrêt maladie ?',
        ],
      },
      {
        id: 'etat-civil',
        title: 'État civil',
        source: 'Loi n° 2024/016 du 23 décembre 2024 (enregistrement des faits d’état civil)',
        questions: ['Dans quel délai faut-il déclarer une naissance ?'],
      },
      {
        id: 'donnees',
        title: 'Données personnelles',
        source: 'Loi n° 2024/017 du 23 décembre 2024 (protection des données personnelles)',
        questions: [
          'Quels sont mes droits sur mes données personnelles ?',
          "Quelles sont les obligations d'une entreprise qui collecte des données personnelles ?",
        ],
      },
      {
        id: 'numerique',
        title: 'Cybersécurité et communications électroniques',
        source: 'Lois n° 2010/012, n° 2010/013 et n° 2015/006',
        questions: ["Quelles sanctions pour l'accès frauduleux à un système informatique ?"],
      },
      {
        id: 'entreprise',
        title: "Création d'entreprise",
        source: 'Décret n° 2017/0877/PM du 28 février 2017 (CFCE)',
        questions: ['Quelles pièces faut-il pour créer une entreprise au CFCE ?'],
      },
      {
        id: 'constitution',
        title: 'Constitution',
        source: 'Constitution de 1996 · révisions de 2008 et de 2026',
        questions: [
          'Combien de temps dure le mandat du Président de la République ?',
          'Qui peut proposer une révision de la Constitution ?',
          'La liberté d’expression est-elle garantie par la Constitution ?',
        ],
      },
    ],
    soonEyebrow: 'Bientôt',
    soonTitle: 'Textes et démarches en préparation',
    soonLead:
      'Ces sujets ne sont pas encore indexés : Sonah ne peut pas encore y répondre avec des sources. Ils arrivent progressivement.',
    soonBadge: 'Pas encore couvert',
    soon: [
      {
        title: "Carte nationale d'identité et passeport",
        description: 'Pièces, coûts et délais, à partir de sources officielles vérifiées.',
      },
      {
        title: 'Impôts et sécurité sociale (CNPS)',
        description: 'Déclarations, cotisations et prestations.',
      },
      {
        title: 'Salaire minimum et textes d’application du Code du travail',
        description:
          'Le montant du salaire minimum est fixé par décret : ce texte n’est pas encore indexé.',
      },
    ],
  },
  chat: {
    metaTitle: 'Discuter avec Sonah',
    metaDescription:
      'Posez votre question : Sonah répond à partir des textes officiels camerounais indexés, sources à l’appui.',
    emptyTitle: "Qu'est-ce qui vous amène ?",
    emptyLead:
      "Décrivez votre situation avec vos mots. Je connais le Code du travail, la Constitution, l'état civil, les données personnelles, la cybersécurité et la création d'entreprise — si votre sujet n'est pas encore couvert, je vous le dirai.",
    suggestions: [
      'Combien de jours de congés payés ai-je droit par an ?',
      "Combien de temps peut durer une période d'essai ?",
      'Mon employeur peut-il me licencier pendant un arrêt maladie ?',
      'Dans quel délai faut-il déclarer une naissance ?',
      'Quels sont mes droits sur mes données personnelles ?',
      'Combien de temps dure le mandat du Président de la République ?',
    ],
    inputLabel: 'Votre message',
    placeholder: 'Écrivez à Sonah…',
    send: 'Envoyer',
    newConversation: 'Nouvelle conversation',
    thinking: 'Sonah réfléchit…',
    you: 'Vous',
    disclaimer:
      "Les réponses sont indicatives : l'administration concernée ou un professionnel du droit fait foi.",
    privacy:
      "Ne saisissez ni numéro de pièce d'identité, ni téléphone, ni information de santé : les échanges sont conservés pour l'audit.",
    privacyLink: 'En savoir plus',
    unavailable:
      'Je ne peux pas répondre pour le moment : le service est indisponible. Réessayez dans quelques instants.',
    citationsHeading: 'Textes cités',
    sourcesHeading: 'Sources',
    viewTrace: "Voir la trace d'audit",
    openCitation: (n: number): string => `Ouvrir la citation ${n}`,
  },
  verdicts: {
    ANSWERED_WITH_CITATIONS: {
      label: 'Réponse sourcée',
      explanation: 'La réponse s’appuie sur les textes cités. Vérifiez les extraits ci-dessous.',
    },
    INSUFFICIENT_EVIDENCE: {
      label: 'Sources insuffisantes',
      explanation:
        'Sonah n’a pas trouvé de texte suffisant pour répondre avec certitude. Il préfère le dire.',
    },
    CONFLICT_BETWEEN_TEXTS: {
      label: 'Textes contradictoires',
      explanation:
        'Des textes semblent se contredire. Faites vérifier la situation par un professionnel.',
    },
    OUTDATED_TEXT: {
      label: 'Texte modifié depuis',
      explanation: 'Texte modifié depuis — voir la version en vigueur avant de vous en prévaloir.',
    },
    REFER_TO_HUMAN: {
      label: 'Renvoi vers un professionnel',
      explanation:
        'Votre situation demande l’avis d’une personne : inspection du travail, avocat ou administration compétente.',
    },
    OUT_OF_SCOPE: {
      label: 'Hors du champ couvert',
      explanation: 'Ce sujet ne fait pas encore partie des textes indexés par Sonah.',
    },
    UNKNOWN: {
      label: 'Statut non précisé',
      explanation: 'Le statut de cette réponse n’a pas été précisé.',
    },
  },
  citation: {
    panelTitle: 'Extrait cité',
    reference: 'Référence',
    excerpt: 'Extrait',
    status: {
      in_force: 'En vigueur',
      amended: 'Modifié',
      repealed: 'Abrogé',
      unknown: 'Statut inconnu',
    },
    statusHelp: {
      in_force: 'Ce texte est indiqué comme en vigueur dans la base de Sonah.',
      amended: 'Ce texte a été modifié depuis : vérifiez la version en vigueur.',
      repealed: 'Ce texte a été abrogé : il ne s’applique plus.',
      unknown: 'Le statut de ce texte n’est pas renseigné.',
    },
    openSource: 'Ouvrir la source officielle',
    openDocument: 'Lire le texte complet dans Sonah',
  },
  feedback: {
    question: 'Cette réponse vous a-t-elle aidé ?',
    up: 'Utile',
    down: 'Pas utile',
    thanks: 'Merci, votre avis est enregistré sur cet appareil.',
  },
  audit: {
    metaTitle: "Journal d'audit",
    metaDescription:
      'Les traces de chaque réponse de Sonah, chaînées par empreinte et vérifiables.',
    eyebrow: 'Auditabilité',
    title: 'Chaque réponse laisse',
    titleEm: 'une trace',
    lead: 'Question reçue, textes retrouvés, contrôles appliqués, réponse produite : chaque étape est enregistrée. Les traces sont chaînées par empreinte cryptographique (hash) — modifier une trace casse la chaîne, et cela se voit.',
    recentTitle: 'Traces récentes',
    recentEmpty: 'Aucune trace pour le moment. Posez une question à Sonah pour en créer une.',
    colDate: 'Date',
    colVerdict: 'Verdict',
    colHash: 'Empreinte',
    kindChat: 'Conversation',
    kindScenario: 'Scénario',
    open: 'Ouvrir',
    lookupLabel: 'Ouvrir une trace par identifiant',
    lookupPlaceholder: 'Identifiant de trace',
    lookupButton: 'Ouvrir',
    verify: {
      button: "Vérifier l'intégrité de la chaîne",
      running: 'Vérification…',
      valid: (count: number): string =>
        `Chaîne intègre : ${count} trace${count > 1 ? 's' : ''} vérifiée${count > 1 ? 's' : ''}, aucune altération détectée.`,
      broken: (count: number, at: string): string =>
        `Chaîne rompue : ${count} trace${count > 1 ? 's' : ''} examinée${count > 1 ? 's' : ''}, incohérence détectée à la trace ${at}.`,
      brokenUnknown: 'Chaîne rompue : une incohérence a été détectée.',
      help: 'Recalcule l’empreinte de chaque trace et vérifie qu’elle pointe bien vers la précédente.',
    },
    trace: {
      metaTitle: "Trace d'audit",
      eyebrow: "Trace d'audit",
      createdAt: 'Créée le',
      conversation: 'Conversation',
      scenarioRun: 'Exécution de scénario',
      producedBy: 'Produite par',
      verdict: 'Verdict',
      hash: 'Empreinte (hash)',
      prevHash: 'Empreinte précédente',
      genesis: 'Aucune — première trace de la chaîne',
      chainHelp:
        'L’empreinte de cette trace est calculée à partir de son contenu et de l’empreinte précédente.',
      steps: 'Étapes',
      stepsLead: 'Dans l’ordre où elles ont été exécutées.',
      agent: 'Agent',
      duration: 'Durée',
      showData: 'Voir les données',
      hideData: 'Masquer les données',
      noSteps: 'Aucune étape enregistrée.',
      notFound:
        'Cette trace est introuvable. Elle a peut-être été créée sur un autre environnement.',
      backToAudit: "Retour au journal d'audit",
      backToChat: 'Retour à la conversation',
      totalDuration: 'Durée totale',
    },
    stepTypes: {
      input: { label: 'Entrée', help: 'La question reçue.' },
      retrieval: { label: 'Recherche', help: 'Les textes retrouvés dans la base.' },
      gate: { label: 'Contrôle', help: 'Une règle qui autorise ou bloque la suite.' },
      agent: { label: 'Agent', help: 'Le raisonnement d’un agent spécialisé.' },
      llm: { label: 'Modèle de langage', help: 'Un appel au modèle de langage.' },
      fallback: { label: 'Repli', help: 'Une solution de secours a été utilisée.' },
      coordination: { label: 'Coordination', help: 'Les agents ont été coordonnés.' },
      output: { label: 'Sortie', help: 'La réponse renvoyée.' },
      unknown: { label: 'Étape', help: '' },
    },
  },
  lab: {
    metaTitle: 'Laboratoire de politiques',
    metaDescription:
      'Scénarios progressifs : les agents de Sonah réagissent événement par événement et révèlent les lacunes réglementaires.',
    eyebrow: 'Laboratoire de politiques publiques',
    title: 'Mettre les textes à l’épreuve,',
    titleEm: 'un événement à la fois.',
    lead: 'Choisissez un scénario. Les événements sont libérés l’un après l’autre ; les agents de Sonah réagissent en citant les textes, et les lacunes réglementaires s’accumulent au fil de l’eau.',
    agentsTitle: 'Les agents',
    agentsLead: 'Chaque agent a un mandat et des sources précis.',
    mandate: 'Mandat',
    sources: 'Sources',
    allSources: 'tous les textes indexés',
    rules: 'Règles déterministes',
    ruleLabels: {
      'pii-masking': 'masquage des données personnelles',
      'verbatim-citation-gate': 'citations vérifiées mot à mot',
      'outdated-text-warning': 'alerte texte modifié',
      'conflict-detection': 'détection des contradictions',
      'refer-sensitive-situations': 'renvoi des situations sensibles',
      'extractive-fallback': 'repli extractif sans modèle',
      'legality-check': 'contrôle de légalité',
      'gap-flagging': 'signalement des lacunes',
      'service-continuity-check': 'continuité de service',
      'data-minimisation-check': 'minimisation des données',
      'procedure-consistency-check': 'cohérence des procédures',
    } as Record<string, string>,
    domains: {
      'legal-information': 'Information juridique',
      'data-protection': 'Protection des données',
      'service-continuity': 'Continuité de service',
      'business-creation': "Création d'entreprise",
    } as Record<string, string>,
    scenariosTitle: 'Scénarios',
    scenariosEmpty: 'Aucun scénario disponible.',
    stepsCount: (n: number): string => `${n} événement${n > 1 ? 's' : ''}`,
    start: 'Lancer ce scénario',
    starting: 'Lancement…',
    release: 'Libérer l’événement suivant',
    releasing: 'Les agents analysent…',
    progress: (step: number, total: number): string => `Événement ${step} sur ${total}`,
    notStarted: 'Le scénario est prêt. Libérez le premier événement quand vous voulez.',
    done: 'Scénario terminé : tous les événements ont été libérés.',
    restart: 'Recommencer',
    chooseAnother: 'Choisir un autre scénario',
    running: 'Scénario en cours',
    eventLabel: (n: number): string => `Événement ${n}`,
    injectedAt: 'Libéré à',
    noResponses: 'Aucun agent n’a réagi à cet événement.',
    gapsTitle: 'Lacunes identifiées',
    gapsLead: 'Ce que les textes actuels ne couvrent pas, ou mal.',
    gapsEmpty:
      'Aucune lacune pour l’instant. Elles apparaîtront à mesure que les événements sont libérés.',
    globalExample: 'Exemple international',
    gapSources: 'Sources',
    loadError: 'Impossible de charger le laboratoire.',
    runId: 'Exécution',
    resumeNote: 'Exécution reprise depuis cet onglet.',
  },
  documents: {
    metaTitle: 'Texte source',
    eyebrow: 'Texte source',
    reference: 'Référence',
    source: 'Source',
    category: 'Catégorie',
    metadata: 'Métadonnées',
    notFound: 'Ce texte est introuvable.',
    back: 'Retour',
    openOfficial: 'Ouvrir la source officielle',
  },
  about: {
    metaTitle: 'À propos · architecture',
    metaDescription:
      'Comment fonctionne Sonah : architecture, alignement UIT Y.3172, textes couverts, données et confidentialité.',
    eyebrow: 'À propos',
    title: 'Comment Sonah',
    titleEm: 'fonctionne',
    lead: 'Sonah est un prototype indépendant d’assistant juridique et administratif pour le Cameroun, développé pour le hackathon ITU AI for Good Lab. Cette page explique, honnêtement, ce qu’il fait et ce qu’il ne fait pas encore.',
    toc: 'Sur cette page',
    architectureTitle: 'Architecture',
    architecture: [
      {
        title: 'Base de connaissances',
        text: 'Les textes officiels sont découpés article par article, indexés en vecteurs (PostgreSQL + pgvector) et reliés dans un graphe (renvois, modifications).',
      },
      {
        title: 'Recherche et contrôles',
        text: 'Pour chaque question, Sonah retrouve les articles pertinents, puis applique des contrôles : assez de preuves ? textes contradictoires ? texte modifié ? sujet hors champ ?',
      },
      {
        title: 'Agents',
        text: 'Des agents spécialisés rédigent la réponse à partir des seuls extraits retrouvés, avec des citations numérotées [1], [2]… et un verdict explicite.',
      },
      {
        title: 'Traçabilité',
        text: 'Chaque étape est journalisée dans une trace d’audit chaînée par empreinte, consultable et vérifiable depuis le site.',
      },
    ],
    pipelineTitle: 'Alignement UIT-T Y.3172',
    pipelineLead:
      'La recommandation UIT-T Y.3172 décrit une architecture de pipeline d’apprentissage automatique. Voici comment les composants de Sonah s’y rattachent.',
    pipelineNote:
      'Correspondance provisoire : le dossier technique détaillera la mise en correspondance définitive.',
    pipelineDiagramLabel:
      'Schéma du pipeline Y.3172 appliqué à Sonah : source, collecteur, prétraitement, modèle, politique, distributeur, destination.',
    pipeline: [
      { code: 'SRC', name: 'Source', sonah: 'Textes officiels (PDF) · question de l’usager' },
      { code: 'C', name: 'Collecteur', sonah: 'Ingestion des textes · API de conversation' },
      {
        code: 'PP',
        name: 'Prétraitement',
        sonah: 'Découpage par article · vectorisation · graphe',
      },
      { code: 'M', name: 'Modèle', sonah: 'Recherche sémantique · agents · modèle de langage' },
      { code: 'P', name: 'Politique', sonah: 'Contrôles de preuve · verdicts · renvoi humain' },
      { code: 'D', name: 'Distributeur', sonah: 'API REST · conversation · laboratoire' },
      { code: 'SINK', name: 'Destination', sonah: 'Citoyen · décideur · journal d’audit' },
    ],
    pipelineOrchestrator: 'Orchestration (MLFO) : coordination des agents et des scénarios',
    readinessTitle: 'Préparation à l’IA',
    readiness:
      'Sonah sert aussi d’outil d’analyse : le laboratoire de politiques confronte les textes à des scénarios concrets et met en évidence les lacunes réglementaires, avec des exemples internationaux. Cette lecture alimente le cadre de préparation à l’IA (AI Readiness) — l’évaluation détaillée sera publiée dans le dossier du projet.',
    corpusTitle: 'Textes couverts',
    corpusLead:
      'Sonah ne répond qu’à partir des textes indexés ci-dessous, découpés article par article. Cette liste est générée depuis le manifeste du corpus utilisé par l’API.',
    corpusCount: (indexed: number, cited: number): string =>
      `${indexed} textes indexés${cited > 0 ? ` · ${cited} référence${cited > 1 ? 's' : ''} citée${cited > 1 ? 's' : ''} sans indexation` : ''}`,
    corpusGroups: {
      national: 'Droit camerounais',
      strategy: 'Stratégie nationale',
      international: 'Références internationales',
    },
    corpusAvailable: 'Indexé',
    corpusCitedOnly: 'Cité uniquement',
    corpusBinding: 'Contraignant',
    corpusAdvisory: 'Non contraignant',
    corpusLanguages: { fr: 'Français', en: 'Anglais' },
    corpusAmends: 'Modifie',
    corpusOfficial: 'Texte officiel',
    corpusSoon: 'Pas encore couvert',
    corpusComing: [
      "Démarches : carte nationale d'identité, passeport",
      'Fiscalité et sécurité sociale (CNPS)',
      "Textes d'application du Code du travail (salaire minimum, conventions collectives)",
      'Version anglaise des lois sur le numérique, les données et l’état civil',
    ],
    privacyTitle: 'Données et confidentialité',
    privacy: [
      {
        title: 'Ce qui est conservé',
        text: 'Les messages échangés avec Sonah, associés à un identifiant de conversation anonyme, et les traces d’audit de chaque réponse (étapes, textes retrouvés, verdict). Aucun compte, aucun nom n’est demandé.',
      },
      {
        title: 'Ce qui reste sur votre appareil',
        text: 'Votre choix de langue (cookie) et vos avis 👍/👎 (stockage local du navigateur). Ils ne sont pas envoyés au serveur.',
      },
      {
        title: 'Durée de conservation',
        text: 'À définir avant toute mise en service publique. Pendant le prototype, les données servent uniquement à l’évaluation et à l’audit.',
      },
      {
        title: 'Ce qu’il ne faut pas saisir',
        text: 'Numéros de carte d’identité, de passeport ou de téléphone, informations de santé, coordonnées bancaires. Décrivez votre situation sans ces détails.',
      },
    ],
    teamTitle: 'Équipe et statut',
    team: 'Conçu et développé par Fokam Emeric Cyrille. Sonah est un prototype indépendant : il n’est ni affilié à l’État du Cameroun ni approuvé par l’UIT ou une administration. Ses réponses sont indicatives et ne remplacent pas un avis juridique.',
    github: 'Code source sur GitHub',
    contact: 'Contact',
  },
  notFound: {
    eyebrow: 'Erreur 404',
    title: 'Je ne trouve pas cette page.',
    text: "Elle n'existe pas, ou elle a changé d'adresse.",
    back: "Retour à l'accueil",
  },
};

export type Dictionary = typeof fr;
