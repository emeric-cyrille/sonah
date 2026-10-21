// Constantes partagées
export const MINISTRIES = {
  MINCOMMERCE: 'MINCOMMERCE',
  MINSANTE: 'MINSANTÉ',
  MINFI: 'MINFI',
  MINAT: 'MINAT',
  MAIRIE: 'MAIRIE',
  CNPS: 'CNPS',
  ETAT_CIVIL: 'ÉTAT CIVIL',
} as const;

export const PROCEDURE_TYPES = {
  BUSINESS_CREATION: 'creation_entreprise',
  IDENTITY: 'document_identite',
  CIVIL_STATUS: 'etat_civil',
  HEALTH: 'sante_cnps',
  TAXES: 'impots',
  JUSTICE: 'justice',
} as const;

export const AGENT_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;
