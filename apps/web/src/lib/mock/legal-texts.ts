/**
 * Extraits verbatim des textes indexés (data/sources), utilisés uniquement par le mode démonstration.
 * Fichier généré à partir des PDF officiels : ne pas modifier le texte des articles à la main.
 */

export interface MockLegalText {
  readonly id: string;
  readonly sourceId: string;
  readonly title: string;
  readonly reference: string;
  readonly status: 'in_force' | 'amended' | 'repealed';
  readonly url: string;
  readonly category: string;
  readonly content: string;
}

export const MOCK_LEGAL_TEXTS: Readonly<Record<string, MockLegalText>> = {
  'ct-2': {
    id: 'ct-2',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail',
    reference: 'Article 2',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    category: 'Code du travail',
    content:
      '1) Le droit au travail est reconnu à chaque citoyen comme un droit fondamental. L’Etat doit tout mettre en oeuvre pour l’aider à trouver un emploi et à le conserver lorsqu’il l’a obtenu.\n2) Le travail est un droit national pour tout citoyen adulte et valide.\n3) Le travail forcé ou obligatoire est interdit.\n4) On entend par travail forcé ou obligatoire tout travail ou service, exigé d’un individu sous la menace d’une peine quelconque et pour lequel ledit individu ne s’est pas offert de son plein gré.\n5) Toutefois, le terme « travail forcé ou obligatoire » ne comprend pas :\n• a) tout travail ou service exigé en vertu des lois et règlements sur le service militaire et affecté à des travaux de caractère purement militaire ;\n• b) tout travail ou service d’intérêt général faisant partie des obligations civiques des citoyens, telles qu’elles sont définies par les lois et les règlements ;\n• c) tout travail ou service exigé d’un individu comme conséquence d’une condamnation prononcée par une décision judiciaire ;\n• d) tout travail ou service exigé dans les cas de force majeure, notamment dans les cas de guerre, de sinistres ou menaces de sinistres tels qu’incendies, inondations, épidémies et épizooties violentes, invasions d’animaux, d’insectes ou de parasites végétaux nuisibles et, en général, toutes circonstances mettant en danger ou risquant de mettre en danger la vie ou les conditions normales d’existence de l’ensemble ou d’une partie de la population.',
  },
  'ct-28': {
    id: 'ct-28',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail',
    reference: 'Article 28',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    category: 'Code du travail',
    content:
      '1) Il y a engagement à l’essai lorsque l’employeur et le travailleur, en vue de conclure un contrat définitif, décident au préalable d’apprécier notamment, le premier la qualité des services du travailleur et son rendement, le second, les conditions, chez l’employeur, de travail, de vie, de rémunération. d’hygiène, de sécurité ainsi que de climat.\n2) L’engagement à l’essai doit être stipulé par écrit. Il ne peut être conclu pour une durée supérieure au délai nécessaire pour mettre à l’épreuve le personnel engagé, compte tenu des techniques et usages de la profession. Dans tous les cas l’engagement à l’essai ne peut porter, renouvellement compris, que sur une période maximale de six mois, sauf en ce qui concerne les cadres pour lesquels cette période peut être prolongée jusqu’à huit mois.\n3) Les délais de recrutement, de route, de formation et de stage ne sont pas compris dans la durée de l’essai.\n4) Le rapatriement des travailleurs déplacés est supporté par l’employeur, quel que soit le motif de la rupture.\n5) La prolongation des services au-delà de l’expiration d’un contrat d’engagement à l’essai, sans intervention d’un nouveau contrat, vaut engagement définitif, prenant effet à compter du début de l’essai.\n6) Un arrêté du ministre chargé du Travail, pris après avis de la Commission nationale consultative du travail, fixe les modalités de l’engagement à l’essai.',
  },
  'ct-32': {
    id: 'ct-32',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail',
    reference: 'Article 32',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    category: 'Code du travail',
    content:
      'Le contrat est suspendu :\n• a) en cas de fermeture de l’établissement par suite du départ de l’employeur sous les drapeaux, quel qu’en soit le motif ;\n• b) pendant la durée du service militaire du travailleur ou de son rappel sous les drapeaux, quel qu’en soit le motif ;\n• c) pendant la durée de l’absence du travailleur dans le cas d’une maladie dûment constatée par un médecin agréé par l’employeur ou relevant d’un établissement hospitalier reconnu par l’État, durée limitée à six mois ; ce délai est prorogé jusqu’au remplacement effectif du travailleur ;\n• d) pendant la durée du congé de maternité prévu à l’article 84 ;\n• e) pendant la période de mise à pied prononcée dans les conditions définies à l’article 30 ;\n• f) pendant la durée du congé d’éducation ouvrière défini à l’article 91 ;\n• g) pendant la période d’indisponibilité résultant d’un accident de travail ou d’une maladie professionnelle ;\n• h) d’accord parties pendant l’exercice des fonctions politiques ou administratives d’une élection ou d’une nomination ;\n• i) pendant la période de la garde à vue ou la détention préventive du travailleur ;\n• j) pendant l’absence du travailleur appelé à suivre son conjoint ayant changé de résidence habituelle et en cas d’impossibilité de mutation. Cette durée est limitée à deux ans, éventuellement renouvelable d’accord parties ;\n• k) pendant la durée du chômage technique, dans la limite de six mois maximum ; le chômage technique étant défini comme l’interruption collective de travail, totale ou partielle, du personnel d’une entreprise ou d’un établissement résultant, soit de causes accidentelles ou de force majeure, soit d’une conjoncture économique défavorable.',
  },
  'ct-34': {
    id: 'ct-34',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail',
    reference: 'Article 34',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    category: 'Code du travail',
    content:
      '1) Le contrat de travail à durée indéterminée peut toujours être résilié par la volonté de l’une des parties. Cette résiliation est subordonnée à un préavis donné par la partie qui prend l’initiative de la rupture et doit être notifiée par écrit à l’autre partie avec indication du motif de la rupture.\n2) Le préavis commence à courir à compter de la date de la notification. Il ne doit être subordonné à aucune condition suspensive ou résolutoire. Il ne peut, en aucun cas, être imputé sur la période de congé du travailleur.\n3) Un arrêté du ministre chargé du Travail, pris après avis de la Commission nationale consultative du travail, détermine les conditions et la durée du préavis compte tenu de l’ancienneté du travailleur et de sa classification professionnelle.',
  },
  'ct-61': {
    id: 'ct-61',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail',
    reference: 'Article 61',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    category: 'Code du travail',
    content:
      '1) Au sens de la présente loi, le terme « salaire » signifie, quels qu’en soient la dénomination et le mode de calcul, la rémunération ou les gains susceptibles d’être évalués en espèces et fixés, soit par accord, soit par des dispositions réglementaires ou conventionnelles, qui sont dus en vertu d’un contrat de travail par un employeur à un travailleur, soit pour le travail effectué ou devant être effectué, soit pour les services rendus ou devant être rendus.\n2) A conditions égales de travail, d’aptitude professionnelle, le salaire est égal pour tous les travailleurs, quels que soient leur origine, leur sexe, leur âge, leur statut et leur confession religieuse, dans les conditions prévues au présent article.\n3) En dehors des cas prévus par la réglementation ou la convention collective applicable, et sauf accord entre les parties intéressées, aucun salaire n’est dû en cas d’absence du travailleur.',
  },
  'ct-62': {
    id: 'ct-62',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail',
    reference: 'Article 62',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    category: 'Code du travail',
    content:
      '1) Un décret pris après avis de la Commission nationale consultative du travailleur fixe le salaire minimum interprofessionnel garanti.\n2) Les catégories professionnelles et les salaires y afférents sont fixés par voie de négociation dans le cadre des conventions collectives ou des accords d’établissement prévus au titre III de la présente loi.',
  },
  'ct-89': {
    id: 'ct-89',
    sourceId: 'code-du-travail-1992',
    title: 'Code du travail',
    reference: 'Article 89',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr198304.pdf',
    category: 'Code du travail',
    content:
      '1) Sauf dispositions plus favorables des conventions collectives ou du contrat individuel de travail, le travailleur acquiert droit au congé payé, à la charge de son employeur, à raison d’un jour et demi ouvrable par mois de service effectif.\n2) Sont assimilées à un mois de service effectif les périodes équivalentes à quatre semaines ou à vingt quatre jours de travail.\n3) Pour la détermination du droit au congé, sont considérés comme période de service effectif :\n• a) les périodes d’indisponibilité pour accident du travail ou maladie professionnelle ;\n• b) dans la limite de six mois, les absences pour maladies médicalement constatées dans les conditions prévues à l’article 32 ci-dessus ;\n• c) le congé de maternité prévu à l’article 84 cidessus ;\n• d) le chômage technique prévu à l’article 32 cidessus.\n4) Dans la limite de dix jours par an, des permissions exceptionnelles d’absences payées, non déductibles du congé annuel, sont accordées au travailleur à l’occasion d’événements familiaux touchant son propre foyer. Un décret pris après avis de la Commission nationale consultative du travail fixe les modalités d’application du présent alinéa.',
  },
  'const-6': {
    id: 'const-6',
    sourceId: 'constitution-1996',
    title: 'Constitution',
    reference: 'Article 6',
    status: 'amended',
    url: 'https://faolex.fao.org/docs/pdf/cmr117236.pdf',
    category: 'Constitution',
    content:
      "(1)- Le Président de la République est élu au suffrage universel direct, égal et secret, à la majorité des suffrages exprimés.\n(2)- Le Président de la République est élu pour un mandat de sept (7) ans renouvelable une fois.\n(3)- L’élection a lieu vingt (20) jours au moins et cinquante (50) jours au plus avant l’expiration des pouvoirs du Président de la République en exercice.\n(4)- En cas de vacance de Présidence de la République pour cause de décès, de démission ou d’empêchement définitif constaté par le Conseil constitutionnel, le scrutin pour l’élection du nouveau Président de la République doit impérativement avoir lieu vingt (20) jours au moins et quarante (40) au plus après l’ouverture de la vacance. al’intérim du Président de la République est exercé de plein droit, jusqu'à l’élection du nouveau Président de la République, par le président du Sénat, et si ce dernier est, à son tour, empêché, par son suppléant, suivant l’ordre de préséance du Sénat. bLe Président de la République par intérim - le Président du Sénat ou son suppléant - ne peut modifier ni la Constitution, ni la composition du gouvernement. Il ne peut recourir au référendum. Il ne peut être candidat à l’élection organisée pour la Présidence de la République.\n(5)- Les candidats aux fonctions de Président de la République doivent être des citoyens camerounais d’origine, jouir de leurs droits civiques et politiques et avoir trente – cinq (35) ans révolus à la date de l’élection.\n(6)- Le régime de l’élection à la Présidence de la République est fixé par la loi.",
  },
  'const-63': {
    id: 'const-63',
    sourceId: 'constitution-1996',
    title: 'Constitution',
    reference: 'Article 63',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr117236.pdf',
    category: 'Constitution',
    content:
      '(1)- L’initiative de la révision de la Constitution appartient concurremment au Président de la République et au Parlement.\n(2)- Toute proposition de révision émanant des membres du Parlement doit être signée par un tiers au moins des membres de l’une ou de l’autre chambre.\n(3)- Le Parlement se réunit en congrès, lorsqu’il est appelé à se prononcer sur un projet ou une proposition de révision de la Constitution. Le texte est adopté à la majorité absolue des membres le composant. Le Président de la République peut demander une seconde lecture. Dans ce cas, la révision est votée à la majorité des deux tiers des membres composants le Parlement.\n(4)- Le Président de la République peut décider de soumettre tout projet ou toute proposition de révision de la Constitution au Référendum. Dans ce cas, le texte est adopté à la majorité simple des suffrages exprimés.',
  },
  'const-preambule': {
    id: 'const-preambule',
    sourceId: 'constitution-1996',
    title: 'Constitution',
    reference: 'Préambule',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr117236.pdf',
    category: 'Constitution',
    content:
      'La liberté de communication, la liberté d’expression, la liberté de presse, la liberté de réunion, la liberté d’association, la liberté syndicale et le droit de grève sont garantis dans les conditions fixées par la loi ;',
  },
  'const-correspondance': {
    id: 'const-correspondance',
    sourceId: 'constitution-1996',
    title: 'Constitution',
    reference: 'Préambule',
    status: 'in_force',
    url: 'https://faolex.fao.org/docs/pdf/cmr117236.pdf',
    category: 'Constitution',
    content:
      "Le secret de toute correspondance est inviolable. Il ne peut y être porté atteinte qu'en vertu des décisions émanant de l'autorité judiciaire ;",
  },
};
