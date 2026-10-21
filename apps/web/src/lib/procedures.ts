export type ProcedureCategory = 'entreprise' | 'identite' | 'etat-civil' | 'fiscalite' | 'social';

export interface ProcedureSummary {
  readonly slug: string;
  readonly title: string;
  readonly category: ProcedureCategory;
  readonly authority: string;
  readonly description: string;
  readonly prompt: string;
}

export const CATEGORY_LABELS: Readonly<Record<ProcedureCategory, string>> = {
  entreprise: 'Entreprise',
  identite: 'Identité',
  'etat-civil': 'État civil',
  fiscalite: 'Fiscalité',
  social: 'Protection sociale',
};

/**
 * Catalogue indicatif des démarches couvertes par les agents SONAH.
 * Les détails (pièces, coûts, délais) sont fournis par l'assistant à partir des sources officielles.
 */
export const PROCEDURES: readonly ProcedureSummary[] = [
  {
    slug: 'creation-entreprise',
    title: 'Créer une entreprise',
    category: 'entreprise',
    authority: 'CFCE · MINPMEESA',
    description:
      "Immatriculation au registre du commerce, choix de la forme juridique et formalités au Centre de Formalités de Création d'Entreprises.",
    prompt: 'Je veux créer une entreprise. Quelles sont les étapes ?',
  },
  {
    slug: 'restaurant',
    title: 'Ouvrir un restaurant',
    category: 'entreprise',
    authority: 'CFCE · Santé · Commune',
    description:
      "Démarche multi-administrations : création de l'entreprise, autorisations sanitaires et autorisations communales.",
    prompt: 'Je veux ouvrir un restaurant à Yaoundé. Que dois-je faire ?',
  },
  {
    slug: 'cni',
    title: "Carte nationale d'identité",
    category: 'identite',
    authority: 'DGSN',
    description:
      'Première demande ou renouvellement de la CNI, pièces à fournir et suivi du dossier.',
    prompt: "Comment obtenir ou renouveler ma carte nationale d'identité ?",
  },
  {
    slug: 'passeport',
    title: 'Passeport',
    category: 'identite',
    authority: 'DGSN',
    description: 'Demande de passeport biométrique : pré-enrôlement, paiement et retrait.',
    prompt: 'Comment faire une demande de passeport ?',
  },
  {
    slug: 'acte-naissance',
    title: 'Acte de naissance',
    category: 'etat-civil',
    authority: "Centre d'état civil",
    description:
      "Déclaration de naissance, établissement d'un acte ou d'une copie, et procédure de jugement supplétif.",
    prompt: "Comment obtenir une copie d'acte de naissance ?",
  },
  {
    slug: 'mariage',
    title: 'Mariage civil',
    category: 'etat-civil',
    authority: "Centre d'état civil",
    description: 'Publication des bans, constitution du dossier et célébration du mariage civil.',
    prompt: 'Quelles sont les démarches pour un mariage civil ?',
  },
  {
    slug: 'impots',
    title: 'Impôts et patente',
    category: 'fiscalite',
    authority: 'DGI · MINFI',
    description:
      "Obtention du numéro d'identifiant unique, déclarations fiscales et contribution des patentes.",
    prompt: "Comment obtenir mon numéro d'identifiant unique et payer ma patente ?",
  },
  {
    slug: 'cnps',
    title: 'Affiliation CNPS',
    category: 'social',
    authority: 'CNPS',
    description:
      'Immatriculation des employeurs et des travailleurs, cotisations et droits aux prestations sociales.',
    prompt: 'Comment immatriculer mes employés à la CNPS ?',
  },
];
