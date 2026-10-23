/**
 * Fiches démarches du mode démonstration (NEXT_PUBLIC_API_MOCK=1).
 * Contenu volontairement marqué « exemple » : sources sur example.org, montants et délais
 * présentés comme illustratifs. Rien ici ne doit être lu comme une information officielle.
 */
import type { Locale } from '@/i18n/config';

type Bilingual = Readonly<Record<Locale, string>>;

export interface MockProcedure {
  readonly id: string;
  readonly title: string;
  readonly authority: { readonly name: string; readonly level: string } | null;
  readonly where: readonly string[];
  readonly documents: readonly string[];
  readonly steps: readonly { readonly order: number; readonly description: string }[];
  readonly cost: {
    readonly amount_fcfa: number | null;
    readonly description: string | null;
  } | null;
  readonly delay: string | null;
  readonly validity: string | null;
  readonly sources: readonly {
    readonly title: string;
    readonly url: string;
    readonly publisher: string;
  }[];
  readonly verifiedAt: string;
  readonly unverified: readonly { readonly field: string; readonly note: string }[];
}

export interface MockProcedureAnswer {
  readonly id: string;
  readonly match: RegExp;
  readonly verdict: string;
  readonly answerType: 'procedure' | 'orientation';
  readonly reply: Bilingual;
  readonly procedure: Readonly<Record<Locale, MockProcedure>> | null;
}

const VERIFIED_AT = '2026-10-01';
const PUBLISHER: Bilingual = {
  fr: 'Source d’exemple (mode démonstration)',
  en: 'Example source (demo mode)',
};

function exampleSource(locale: Locale, slug: string): MockProcedure['sources'][number] {
  return {
    title:
      locale === 'fr'
        ? `Page d’exemple « ${slug} » — non officielle`
        : `Example page “${slug}” — not official`,
    url: `https://example.org/sonah-demo/${slug}`,
    publisher: PUBLISHER[locale],
  };
}

export const MOCK_PROCEDURE_ANSWERS: readonly MockProcedureAnswer[] = [
  {
    id: 'passeport',
    match: /passeport|passport/i,
    verdict: 'PROCEDURE_GUIDANCE',
    answerType: 'procedure',
    reply: {
      fr: 'Voici une **fiche d’exemple** pour une demande de passeport ordinaire. En mode démonstration, son contenu est illustratif : vérifiez toujours auprès du service compétent avant de vous déplacer.',
      en: 'Here is an **example guide** for an ordinary passport application. In demo mode its content is illustrative: always check with the responsible office before you travel.',
    },
    procedure: {
      fr: {
        id: 'demo-passeport',
        title: 'Passeport ordinaire (fiche d’exemple)',
        authority: { name: 'Service des passeports (exemple)', level: 'national' },
        where: [
          'Centre de traitement des passeports le plus proche (exemple)',
          'Prise de rendez-vous en ligne, si le service la propose (exemple)',
        ],
        documents: [
          'Carte nationale d’identité en cours de validité (exemple)',
          'Copie d’acte de naissance (exemple)',
          'Justificatif de paiement des frais (exemple)',
          'Ancien passeport, en cas de renouvellement (exemple)',
        ],
        steps: [
          { order: 1, description: 'Payer les frais et conserver le reçu (exemple).' },
          {
            order: 2,
            description: 'Déposer le dossier et faire la capture biométrique (exemple).',
          },
          { order: 3, description: 'Retirer le passeport muni du récépissé de dépôt (exemple).' },
        ],
        cost: {
          amount_fcfa: 110000,
          description: 'Montant d’exemple pour la démonstration, non officiel',
        },
        delay: null,
        validity: '5 ans (valeur d’exemple)',
        sources: [exampleSource('fr', 'passeport')],
        verifiedAt: VERIFIED_AT,
        unverified: [
          {
            field: 'delay',
            note: 'Le délai varie selon le centre : demandez-le au moment du dépôt (exemple).',
          },
        ],
      },
      en: {
        id: 'demo-passeport',
        title: 'Ordinary passport (example guide)',
        authority: { name: 'Passport office (example)', level: 'national' },
        where: [
          'Nearest passport processing centre (example)',
          'Online appointment booking, if the office offers it (example)',
        ],
        documents: [
          'Valid national identity card (example)',
          'Copy of birth certificate (example)',
          'Proof of fee payment (example)',
          'Previous passport, for a renewal (example)',
        ],
        steps: [
          { order: 1, description: 'Pay the fee and keep the receipt (example).' },
          { order: 2, description: 'Submit the file and complete biometric capture (example).' },
          { order: 3, description: 'Collect the passport with your filing receipt (example).' },
        ],
        cost: { amount_fcfa: 110000, description: 'Example amount for the demo, not official' },
        delay: null,
        validity: '5 years (example value)',
        sources: [exampleSource('en', 'passeport')],
        verifiedAt: VERIFIED_AT,
        unverified: [
          {
            field: 'delay',
            note: 'Processing time varies by centre: ask when you submit your file (example).',
          },
        ],
      },
    },
  },
  {
    id: 'acte-naissance',
    match: /acte de naissance|copie d.acte|birth certificate/i,
    verdict: 'ANSWERED_WITH_CITATIONS',
    answerType: 'procedure',
    reply: {
      fr: 'Voici une **fiche d’exemple** pour obtenir une copie d’acte de naissance. Le coût et le délai ne sont pas confirmés : je préfère vous le dire plutôt que d’avancer un chiffre.',
      en: 'Here is an **example guide** to obtain a copy of a birth certificate. The cost and processing time are not confirmed: I would rather say so than guess a figure.',
    },
    procedure: {
      fr: {
        id: 'demo-acte-naissance',
        title: 'Copie d’acte de naissance (fiche d’exemple)',
        authority: {
          name: 'Centre d’état civil de la commune de naissance (exemple)',
          level: 'communal',
        },
        where: ['Centre d’état civil où la naissance a été déclarée (exemple)'],
        documents: [
          'Pièce d’identité du demandeur (exemple)',
          'Références de l’acte : numéro, date, centre (exemple)',
          'Procuration, si vous demandez pour un tiers (exemple)',
        ],
        steps: [
          {
            order: 1,
            description:
              'Se présenter au centre d’état civil avec les références de l’acte (exemple).',
          },
          { order: 2, description: 'Remplir la demande de copie (exemple).' },
          { order: 3, description: 'Retirer la copie certifiée conforme (exemple).' },
        ],
        cost: null,
        delay: null,
        validity: null,
        sources: [exampleSource('fr', 'acte-de-naissance')],
        verifiedAt: VERIFIED_AT,
        unverified: [
          { field: 'cost', note: 'Les frais éventuels dépendent de la commune (exemple).' },
          { field: 'delay', note: 'Délai à demander au guichet (exemple).' },
        ],
      },
      en: {
        id: 'demo-acte-naissance',
        title: 'Copy of a birth certificate (example guide)',
        authority: {
          name: 'Civil status centre of the birth council (example)',
          level: 'communal',
        },
        where: ['Civil status centre where the birth was registered (example)'],
        documents: [
          'Applicant’s identity document (example)',
          'Certificate references: number, date, centre (example)',
          'Power of attorney, if applying for someone else (example)',
        ],
        steps: [
          {
            order: 1,
            description: 'Go to the civil status centre with the certificate references (example).',
          },
          { order: 2, description: 'Fill in the copy request (example).' },
          { order: 3, description: 'Collect the certified true copy (example).' },
        ],
        cost: null,
        delay: null,
        validity: null,
        sources: [exampleSource('en', 'acte-de-naissance')],
        verifiedAt: VERIFIED_AT,
        unverified: [
          { field: 'cost', note: 'Any fees depend on the council (example).' },
          { field: 'delay', note: 'Ask at the counter for the processing time (example).' },
        ],
      },
    },
  },
  {
    id: 'certificat-medical',
    match: /certificat m[ée]dical|medical certificate/i,
    verdict: 'ANSWERED_WITH_CITATIONS',
    answerType: 'procedure',
    reply: {
      fr: 'Voici une **fiche d’exemple** pour obtenir un certificat médical. Les tarifs varient selon l’établissement : ils ne sont pas indiqués ici.',
      en: 'Here is an **example guide** to obtain a medical certificate. Fees vary between facilities: they are not shown here.',
    },
    procedure: {
      fr: {
        id: 'demo-certificat-medical',
        title: 'Certificat médical (fiche d’exemple)',
        authority: {
          name: 'Formation sanitaire publique ou médecin agréé (exemple)',
          level: 'local',
        },
        where: [
          'Hôpital de district ou centre médical d’arrondissement (exemple)',
          'Cabinet d’un médecin agréé (exemple)',
        ],
        documents: [
          'Pièce d’identité (exemple)',
          'Carnet de santé, s’il existe (exemple)',
          'Indication de l’usage du certificat : emploi, sport, concours (exemple)',
        ],
        steps: [
          {
            order: 1,
            description: 'Prendre rendez-vous ou se présenter à la consultation (exemple).',
          },
          { order: 2, description: 'Passer l’examen médical (exemple).' },
          { order: 3, description: 'Recevoir le certificat signé et cacheté (exemple).' },
        ],
        cost: null,
        delay: 'Le jour même, après l’examen (exemple)',
        validity: null,
        sources: [exampleSource('fr', 'certificat-medical')],
        verifiedAt: VERIFIED_AT,
        unverified: [
          { field: 'cost', note: 'Tarif propre à chaque établissement (exemple).' },
          {
            field: 'validity',
            note: 'La durée acceptée dépend de l’organisme qui le demande (exemple).',
          },
        ],
      },
      en: {
        id: 'demo-certificat-medical',
        title: 'Medical certificate (example guide)',
        authority: { name: 'Public health facility or approved doctor (example)', level: 'local' },
        where: [
          'District hospital or sub-divisional medical centre (example)',
          'Approved doctor’s practice (example)',
        ],
        documents: [
          'Identity document (example)',
          'Health booklet, if you have one (example)',
          'What the certificate is for: job, sport, competitive exam (example)',
        ],
        steps: [
          { order: 1, description: 'Book an appointment or attend a consultation (example).' },
          { order: 2, description: 'Undergo the medical examination (example).' },
          { order: 3, description: 'Receive the signed and stamped certificate (example).' },
        ],
        cost: null,
        delay: 'Same day, after the examination (example)',
        validity: null,
        sources: [exampleSource('en', 'certificat-medical')],
        verifiedAt: VERIFIED_AT,
        unverified: [
          { field: 'cost', note: 'Fees are set by each facility (example).' },
          { field: 'validity', note: 'Accepted validity depends on who requests it (example).' },
        ],
      },
    },
  },
  {
    id: 'cni-perdue',
    match: /\bcni\b|carte nationale d.identit|carte d.identit|identity card|\bid card\b/i,
    verdict: 'INSUFFICIENT_EVIDENCE',
    answerType: 'orientation',
    reply: {
      fr: 'Je n’ai pas encore de fiche vérifiée pour une carte nationale d’identité perdue. En général, une perte se déclare d’abord auprès de la police ou de la gendarmerie, puis le renouvellement se fait au centre d’identification — mais je ne peux pas vous donner les pièces, le coût ni le délai avec une source fiable.',
      en: 'I do not have a verified guide yet for a lost national identity card. Usually a loss is first reported to the police or gendarmerie, then the card is renewed at an identification centre — but I cannot give you the documents, cost or processing time from a reliable source.',
    },
    procedure: {
      fr: {
        id: 'demo-cni-perdue',
        title: 'Carte nationale d’identité perdue',
        authority: { name: 'Centre d’identification (exemple)', level: 'national' },
        where: ['Commissariat ou brigade de gendarmerie, pour la déclaration de perte (exemple)'],
        documents: [],
        steps: [],
        cost: null,
        delay: null,
        validity: null,
        sources: [],
        verifiedAt: VERIFIED_AT,
        unverified: [],
      },
      en: {
        id: 'demo-cni-perdue',
        title: 'Lost national identity card',
        authority: { name: 'Identification centre (example)', level: 'national' },
        where: ['Police station or gendarmerie, to report the loss (example)'],
        documents: [],
        steps: [],
        cost: null,
        delay: null,
        validity: null,
        sources: [],
        verifiedAt: VERIFIED_AT,
        unverified: [],
      },
    },
  },
];
