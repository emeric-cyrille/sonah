# Procedure sheets (fiches démarches)

Structured, sourced descriptions of common Cameroonian administrative procedures, used by SONAH to answer practical questions ("je veux faire ma CNI", "comment déclarer une naissance") with steps, documents, costs and offices instead of bare legal articles.

## Format

- One JSON file per procedure: `data/procedures/<id>.json`, where `id` equals the file name.
- Every file validates against [`procedure.schema.json`](./procedure.schema.json) (JSON Schema 2020-12).
- Factual items (`where`, `who_can_apply`, `documents`, `steps`, `cost`, `delay`, `validity`, `legal_basis`, `tips`) carry `source_refs`: 0-based indexes into the sheet's `sources` array.
- `legal_basis[].sourceId` points to an entry of [`../sources/manifest.json`](../sources/manifest.json) when the text is in the corpus, otherwise `null`.
- `sources[].official` is `true` only for Cameroonian public authorities (ministries, DGSN, DGI, CNPS, ELECAM, Cameroonian embassies, eRegulations portals run with the government, laws published by the Presidency). Foreign embassies, press and private guides are `false`.
- All sheets were researched and checked on `verified_at` = 2026-10-23. Content is in French (`language_versions: ["fr"]`); `title_en` and `keywords_en` exist for retrieval.

## Sourcing rules

- Nothing is invented. A cost, delay, validity or document list that could not be confirmed is `null` (or omitted) and listed in `unverified` with a note.
- Fees that depend on the provider (e.g. a doctor's fee for a medical certificate, the value of a vehicle) are explained in `cost.description` with `amount_fcfa: null`.
- Unofficial guides (blogs, aggregator sites) were not used for facts; when they disagree with official sources this is noted in `unverified`.
- Fees and procedures change with each finance law: re-check `unverified` entries and costs before relying on them, and update `verified_at` when a sheet is re-verified.

## Sheets

| id | category | official / total sources | fixed cost (FCFA) | unverified fields |
|---|---|---|---|---|
| [`carte-nationale-identite-perte-vol`](./carte-nationale-identite-perte-vol.json) | identite | 2 / 4 | 10 000 | cost, delay, documents, where |
| [`carte-nationale-identite-premiere-demande`](./carte-nationale-identite-premiere-demande.json) | identite | 2 / 5 | 10 000 | cost, delay, documents, validity |
| [`carte-nationale-identite-renouvellement`](./carte-nationale-identite-renouvellement.json) | identite | 2 / 4 | 10 000 | cost, delay, documents, validity |
| [`certificat-de-domicile`](./certificat-de-domicile.json) | identite | 2 / 2 | — | cost, delay, documents, title_fr, validity |
| [`passeport-ordinaire`](./passeport-ordinaire.json) | identite | 4 / 5 | 110 000 | documents, legal_basis, validity |
| [`acte-de-deces-declaration`](./acte-de-deces-declaration.json) | etat-civil | 1 / 1 | 0 | documents, validity |
| [`acte-de-mariage`](./acte-de-mariage.json) | etat-civil | 1 / 1 | 0 | documents, validity, who_can_apply |
| [`acte-de-naissance-declaration`](./acte-de-naissance-declaration.json) | etat-civil | 1 / 1 | 0 | documents, validity |
| [`acte-de-naissance-enregistrement-tardif`](./acte-de-naissance-enregistrement-tardif.json) | etat-civil | 1 / 1 | — | cost, documents |
| [`acte-etat-civil-copie`](./acte-etat-civil-copie.json) | etat-civil | 1 / 1 | — | cost.amount_fcfa, delay, documents, validity, who_can_apply |
| [`rectification-reconstitution-acte-etat-civil`](./rectification-reconstitution-acte-etat-civil.json) | etat-civil | 1 / 1 | — | cost, documents |
| [`certificat-de-nationalite`](./certificat-de-nationalite.json) | justice | 3 / 4 | — | cost, documents, legal_basis, validity, where |
| [`extrait-casier-judiciaire-bulletin-3`](./extrait-casier-judiciaire-bulletin-3.json) | justice | 3 / 5 | 2 200 | cost, legal_basis, validity, where |
| [`certificat-medical`](./certificat-medical.json) | sante | 2 / 3 | — | cost, delay, documents, validity |
| [`carte-grise-immatriculation`](./carte-grise-immatriculation.json) | transport | 3 / 6 | — | cost, delay, documents, steps, validity |
| [`permis-de-conduire-obtention`](./permis-de-conduire-obtention.json) | transport | 4 / 6 | — | cost, delay, documents, legal_basis, steps, validity, who_can_apply |
| [`creation-entreprise-individuelle-cfce`](./creation-entreprise-individuelle-cfce.json) | entreprise | 3 / 4 | 41 500 | cost, validity, where |
| [`creation-sarl-cfce`](./creation-sarl-cfce.json) | entreprise | 4 / 4 | — | cost.amount_fcfa, validity, where |
| [`attestation-de-non-redevance`](./attestation-de-non-redevance.json) | fiscalite | 1 / 2 | — | cost.amount_fcfa, delay, documents, legal_basis, validity |
| [`impot-liberatoire-patente`](./impot-liberatoire-patente.json) | fiscalite | 1 / 3 | — | cost, legal_basis, sources |
| [`numero-identifiant-unique-niu`](./numero-identifiant-unique-niu.json) | fiscalite | 3 / 4 | — | cost, steps, validity |
| [`immatriculation-cnps-employeur`](./immatriculation-cnps-employeur.json) | social | 4 / 4 | — | cost.amount_fcfa, documents, legal_basis |
| [`immatriculation-cnps-travailleur`](./immatriculation-cnps-travailleur.json) | social | 5 / 5 | — | cost, documents, legal_basis, validity |
| [`inscription-listes-electorales`](./inscription-listes-electorales.json) | elections | 2 / 4 | — | cost, documents, legal_basis |
| [`inscription-examens-officiels`](./inscription-examens-officiels.json) | education | 0 / 1 | 13 000 | cost, delay, documents, where, who_can_apply |
| [`legalisation-copie-certifiee-conforme`](./legalisation-copie-certifiee-conforme.json) | autre | 4 / 5 | — | cost, delay, validity, where |

## Details per sheet

### `carte-nationale-identite-perte-vol`

National identity card (CNI): lost, stolen or damaged card — *Carte nationale d'identité (CNI) : perte, vol ou détérioration*

Sources:

0. [Tout sur vos titres identitaires : modalités d'établissement et de délivrance des titres identitaires (dépliant)](https://www.dgsn.cm/wp-content/uploads/2020/01/Depliant-CNI.pdf) — Délégation Générale à la Sûreté Nationale (DGSN) (official)
1. [Ordonnance n° 2024/001 du 20 juin 2024 modifiant et complétant certaines dispositions de la loi de finances 2024 (articles 548 et 549 du CGI)](https://www.prc.cm/files/41/5c/26/3621ac2603f3f0a3d2ebf7657b1202f3.pdf) — Présidence de la République du Cameroun (official)
2. [Cameroon: National identity cards, including requirements and procedures (CMR105627.FE)](https://www.ecoi.net/en/document/1397225.html) — Immigration and Refugee Board of Canada (via ecoi.net) (non-official)
3. [CNI en 48h au Cameroun : voici les trois étapes à suivre](https://fr.journalducameroun.com/cni-en-48h-au-cameroun-voici-les-trois-etapes-a-suivre/) — Journal du Cameroun (non-official)

Unverified:

- `where`: Le dépliant officiel parle de « toute autorité habilitée » sans les nommer ; des guides non officiels citent le commissariat ou la gendarmerie, non confirmé par une source officielle.
- `documents`: Des guides non officiels ajoutent une photocopie de l'ancienne CNI et une copie certifiée de l'acte de naissance ; non confirmé par le dépliant DGSN, donc non retenu. Le portail idcam.cm n'a pas pu être consulté (HTTP 403).
- `cost`: Le coût de l'attestation de déclaration de perte n'a pas été trouvé dans une source officielle.
- `delay`: Délai de 48 heures annoncé par la DGSN et rapporté par la presse ; non garanti par un texte.

### `carte-nationale-identite-premiere-demande`

National identity card (CNI): first application — *Carte nationale d'identité (CNI) : première demande*

Sources:

0. [Tout sur vos titres identitaires : modalités d'établissement et de délivrance des titres identitaires (dépliant)](https://www.dgsn.cm/wp-content/uploads/2020/01/Depliant-CNI.pdf) — Délégation Générale à la Sûreté Nationale (DGSN) (official)
1. [Ordonnance n° 2024/001 du 20 juin 2024 modifiant et complétant certaines dispositions de la loi de finances 2024 (articles 548 et 549 du CGI)](https://www.prc.cm/files/41/5c/26/3621ac2603f3f0a3d2ebf7657b1202f3.pdf) — Présidence de la République du Cameroun (official)
2. [Cameroon: National identity cards, including requirements and procedures (CMR105627.FE)](https://www.ecoi.net/en/document/1397225.html) — Immigration and Refugee Board of Canada (via ecoi.net) (non-official)
3. [CNI en 48h au Cameroun : voici les trois étapes à suivre](https://fr.journalducameroun.com/cni-en-48h-au-cameroun-voici-les-trois-etapes-a-suivre/) — Journal du Cameroun (non-official)
4. [ANTIC alerte sur un faux communiqué au sujet de la nouvelle CNI au Cameroun](https://cybersecuritymag.africa/antic-alerte-sur-un-faux-communique-au-sujet-de-la-nouvelle-cni-au-cameroun) — Cybersecurity Mag Africa (non-official)

Unverified:

- `documents`: La liste des pièces provient du dépliant officiel DGSN de 2020 (antérieur à la nouvelle CNI biométrique de 2025). Le portail idcam.cm n'a pas pu être consulté (HTTP 403) pour confirmer la liste actuelle.
- `delay`: Le délai de 48 heures est une annonce de la DGSN rapportée par la presse, pas un texte réglementaire ; aucun texte officiel consulté ne le garantit.
- `validity`: Des articles de presse évoquent une validité portée à 15 ans pour la nouvelle CNI ; aucun texte officiel consulté ne le confirme. La valeur retenue (10 ans) est celle du dépliant DGSN et du décret de 2016.
- `cost`: Montant issu de l'ordonnance n° 2024/001 ; une éventuelle modification par les lois de finances 2025 ou 2026 n'a pas été vérifiée.

### `carte-nationale-identite-renouvellement`

National identity card (CNI): renewal of an expired card — *Carte nationale d'identité (CNI) : renouvellement (carte périmée)*

Sources:

0. [Tout sur vos titres identitaires : modalités d'établissement et de délivrance des titres identitaires (dépliant)](https://www.dgsn.cm/wp-content/uploads/2020/01/Depliant-CNI.pdf) — Délégation Générale à la Sûreté Nationale (DGSN) (official)
1. [Ordonnance n° 2024/001 du 20 juin 2024 modifiant et complétant certaines dispositions de la loi de finances 2024 (articles 548 et 549 du CGI)](https://www.prc.cm/files/41/5c/26/3621ac2603f3f0a3d2ebf7657b1202f3.pdf) — Présidence de la République du Cameroun (official)
2. [Cameroon: National identity cards, including requirements and procedures (CMR105627.FE)](https://www.ecoi.net/en/document/1397225.html) — Immigration and Refugee Board of Canada (via ecoi.net) (non-official)
3. [CNI en 48h au Cameroun : voici les trois étapes à suivre](https://fr.journalducameroun.com/cni-en-48h-au-cameroun-voici-les-trois-etapes-a-suivre/) — Journal du Cameroun (non-official)

Unverified:

- `documents`: Liste issue du dépliant officiel DGSN de 2020 (cas de péremption). Le portail idcam.cm n'a pas pu être consulté (HTTP 403) pour confirmer la liste en vigueur depuis la CNI biométrique de 2025.
- `delay`: Délai de 48 heures annoncé par la DGSN et rapporté par la presse ; non garanti par un texte.
- `validity`: Des articles de presse évoquent 15 ans pour la nouvelle CNI ; non confirmé par un texte officiel consulté.
- `cost`: Une éventuelle modification par les lois de finances 2025 ou 2026 n'a pas été vérifiée.

### `certificat-de-domicile`

Certificate of domicile (often called certificate of residence) — *Certificat de domicile (souvent appelé certificat de résidence)*

Sources:

0. [Tout sur vos titres identitaires : modalités d'établissement et de délivrance des titres identitaires (dépliant)](https://www.dgsn.cm/wp-content/uploads/2020/01/Depliant-CNI.pdf) — Délégation Générale à la Sûreté Nationale (DGSN) (official)
1. [Décret n° 2023/147 du 2 mars 2023 fixant les modalités d'application de la loi n° 97/012 relative aux conditions d'entrée, de séjour et de sortie des étrangers au Cameroun](https://www.prc.cm/files/47/4a/a3/a84330acd666b5684ff46711e2b7669e.pdf) — Présidence de la République du Cameroun (official)

Unverified:

- `documents`: Aucune source officielle ne liste les pièces à fournir pour obtenir le certificat lui-même ; des guides non officiels citent une pièce d'identité et des justificatifs (factures), non retenus.
- `cost`: Aucun tarif officiel trouvé.
- `delay`: Aucun délai officiel trouvé.
- `validity`: Durée de validité non indiquée par les sources officielles consultées.
- `title_fr`: Les textes officiels parlent de « certificat de domicile » ; l'équivalence avec le « certificat de résidence » couramment demandé, et l'éventuelle compétence de la mairie (citée par des guides non officiels), ne sont pas confirmées par une source officielle.

### `passeport-ordinaire`

Ordinary biometric passport: first application and renewal — *Passeport biométrique ordinaire : première demande et renouvellement*

Sources:

0. [PassCam : services de passeports camerounais (page d'accueil, procédure)](https://www.passcam.cm/) — AUGENTIC / Délégation Générale à la Sûreté Nationale (official)
1. [PassCam : passeports, pièces requises](https://www.passcam.cm/passeports) — AUGENTIC / Délégation Générale à la Sûreté Nationale (official)
2. [PassCam : FAQ](https://www.passcam.cm/faq) — AUGENTIC / Délégation Générale à la Sûreté Nationale (official)
3. [Ordonnance n° 2024/001 du 20 juin 2024 modifiant et complétant certaines dispositions de la loi de finances 2024 (articles 548 et 549 du CGI)](https://www.prc.cm/files/41/5c/26/3621ac2603f3f0a3d2ebf7657b1202f3.pdf) — Présidence de la République du Cameroun (official)
4. [Le prix du passeport biométrique camerounais reste inchangé : 110 000 FCFA](https://www.focusmediaafrique.com/le-prix-du-passeport-biometrique-camerounais-reste-inchange-110-000-fcfa/) — Focus Média Afrique (relayant le ministère des Finances, 19 janvier 2026) (non-official)

Unverified:

- `validity`: La durée de validité du passeport ordinaire n'est indiquée ni sur passcam.cm ni dans les textes consultés ; des guides non officiels parlent de 5 ans, non retenu.
- `documents`: La liste des pièces pour les Camerounais résidant à l'étranger (carte de séjour, carte consulaire) et pour les changements de nom ou de filiation n'est pas reprise en détail ; consulter https://www.passcam.cm/passeports.
- `legal_basis`: Le texte réglementaire fixant les modalités de délivrance du passeport n'a pas été identifié ; seule la base fiscale (article 548 du CGI) est sourcée.

### `acte-de-deces-declaration`

Death declaration and death certificate — *Déclaration de décès et acte de décès*

Sources:

0. [Loi n° 2024/016 du 23 décembre 2024 portant organisation du système d'enregistrement des faits d'état civil au Cameroun](https://www.prc.cm/fr/actualites/actes/lois/7589-loi-n-2024-016-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-10) — Présidence de la République du Cameroun (official)

Unverified:

- `documents`: La loi ne cite pas le certificat médical de décès comme pièce obligatoire pour les décès en communauté ; les pièces exigées en pratique (certificat de décès médical, acte de naissance du défunt, etc.) n'ont pas pu être vérifiées sur une source officielle.
- `validity`: Sans objet pour l'acte ; durée de validité des copies non fixée par la loi.

### `acte-de-mariage`

Civil marriage and marriage certificate (and registration of a customary marriage) — *Mariage civil et acte de mariage (et transcription d'un mariage coutumier)*

Sources:

0. [Loi n° 2024/016 du 23 décembre 2024 portant organisation du système d'enregistrement des faits d'état civil au Cameroun](https://www.prc.cm/fr/actualites/actes/lois/7589-loi-n-2024-016-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-10) — Présidence de la République du Cameroun (official)

Unverified:

- `documents`: La loi n° 2024/016 ne fixe pas de liste de pièces justificatives et aucun texte d'application ni page officielle (commune, BUNEC, MINDDEVEL) n'a pu être consulté ; les listes publiées par des sites non officiels varient d'une commune à l'autre. Se renseigner auprès du centre d'état civil. Des sites non officiels citent extraits d'acte de naissance récents, certificat de célibat, certificat de résidence, certificat médical prénuptial, pièces d'identité et photos : non vérifié pour la loi n° 2024/016.
- `who_can_apply`: Les conditions de fond du mariage (âge minimum, consentement) relèvent du droit des personnes et ne figurent pas dans les textes consultés.
- `validity`: Sans objet pour l'acte ; durée de validité des copies non fixée par la loi.

### `acte-de-naissance-declaration`

Birth declaration and issuance of the birth certificate — *Déclaration de naissance et établissement de l'acte de naissance*

Sources:

0. [Loi n° 2024/016 du 23 décembre 2024 portant organisation du système d'enregistrement des faits d'état civil au Cameroun](https://www.prc.cm/fr/actualites/actes/lois/7589-loi-n-2024-016-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-10) — Présidence de la République du Cameroun (official)

Unverified:

- `documents`: La loi n° 2024/016 ne fixe pas de liste de pièces justificatives et aucun texte d'application ni page officielle (commune, BUNEC, MINDDEVEL) n'a pu être consulté ; les listes publiées par des sites non officiels varient d'une commune à l'autre. Se renseigner auprès du centre d'état civil. Les guides non officiels citent généralement le certificat (ou attestation) de naissance délivré par la formation sanitaire et les pièces d'identité des parents.
- `validity`: La loi ne fixe pas de durée de validité de l'acte ; certaines administrations exigent une copie récente, à vérifier auprès de l'administration destinataire.

### `acte-de-naissance-enregistrement-tardif`

Late birth registration (prosecutor's requisition or declaratory judgment, formerly 'supplementary judgment') — *Enregistrement tardif d'une naissance (réquisition du Procureur ou jugement déclaratif, ex-« jugement supplétif »)*

Sources:

0. [Loi n° 2024/016 du 23 décembre 2024 portant organisation du système d'enregistrement des faits d'état civil au Cameroun](https://www.prc.cm/fr/actualites/actes/lois/7589-loi-n-2024-016-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-10) — Présidence de la République du Cameroun (official)

Unverified:

- `cost`: Les frais de justice (timbres, droits de greffe, enquête) ne sont pas fixés par la loi n° 2024/016 et n'ont pas pu être vérifiés sur une source officielle.
- `documents`: Hors les mentions de la requête et les témoins prévus par la loi, les pièces exigées par les greffes (certificat d'âge apparent, pièces d'identité des témoins, etc.) n'ont pas pu être vérifiées.

### `acte-etat-civil-copie`

Obtaining a copy or extract of a birth, marriage or death certificate (including after loss) — *Obtenir une copie ou un extrait d'acte de naissance, de mariage ou de décès (y compris en cas de perte)*

Sources:

0. [Loi n° 2024/016 du 23 décembre 2024 portant organisation du système d'enregistrement des faits d'état civil au Cameroun](https://www.prc.cm/fr/actualites/actes/lois/7589-loi-n-2024-016-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-10) — Présidence de la République du Cameroun (official)

Unverified:

- `cost.amount_fcfa`: Le montant du droit de timbre sur les copies et extraits d'actes d'état civil (Code général des impôts) n'a pas pu être vérifié sur une source officielle.
- `who_can_apply`: Les règles d'accès aux données du fichier national (art. 79, 82) renvoient à des textes réglementaires non consultés : qui peut demander la copie de l'acte d'un tiers n'est pas vérifié.
- `documents`: La loi n° 2024/016 ne fixe pas de liste de pièces justificatives et aucun texte d'application ni page officielle (commune, BUNEC, MINDDEVEL) n'a pu être consulté ; les listes publiées par des sites non officiels varient d'une commune à l'autre. Se renseigner auprès du centre d'état civil.
- `delay`: Aucun délai de délivrance n'est fixé par la loi ni publié par une source officielle consultée.
- `validity`: La loi ne fixe pas de durée de validité ; l'exigence d'une copie « de moins de 3 mois » relève des administrations destinataires et n'a pas été vérifiée.

### `rectification-reconstitution-acte-etat-civil`

Correction or reconstitution of a civil status record (wrong name or date, destroyed record) — *Rectification ou reconstitution d'un acte d'état civil (erreur de nom, de date, acte détruit)*

Sources:

0. [Loi n° 2024/016 du 23 décembre 2024 portant organisation du système d'enregistrement des faits d'état civil au Cameroun](https://www.prc.cm/fr/actualites/actes/lois/7589-loi-n-2024-016-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-10) — Présidence de la République du Cameroun (official)

Unverified:

- `cost`: Frais de justice non fixés par la loi n° 2024/016 et non vérifiés.
- `documents`: Pièces annexes exigées par les greffes (copie de l'acte erroné, pièces d'identité, preuves) non vérifiées sur une source officielle.

### `certificat-de-nationalite`

Certificate of Cameroonian nationality — *Certificat de nationalité camerounaise*

Sources:

0. [Tout sur vos titres identitaires : modalités d'établissement et de délivrance des titres identitaires (dépliant)](https://www.dgsn.cm/wp-content/uploads/2020/01/Depliant-CNI.pdf) — Délégation Générale à la Sûreté Nationale (DGSN) (official)
1. [Le certificat de nationalité : définition, utilité et démarches](https://www.ambacamvat.com/le-certificat-de-nationalite-definition-utilite-et-demarches/) — Ambassade du Cameroun près le Saint-Siège (official)
2. [Certificat de nationalité](https://ambacam.it/certificat-de-nationalite/) — Ambassade du Cameroun en Italie (official)
3. [Loi n° 1968-LF-3 du 11 juin 1968 portant code de la nationalité camerounaise](https://www.refworld.org/docid/3ae6b4d734) — UNHCR Refworld (non-official)

Unverified:

- `documents`: Liste issue d'une page d'ambassade (destinée à la diaspora), pas d'une source du ministère de la Justice ; les tribunaux au Cameroun peuvent exiger d'autres pièces (des guides non officiels citent les actes de naissance des parents, un certificat de résidence, des photos et une demande timbrée).
- `cost`: Aucun tarif officiel trouvé ; montants indicatifs fournis par des ambassades.
- `validity`: Durée de validité du certificat non indiquée par les sources consultées.
- `legal_basis`: L'article du code de la nationalité qui régit la délivrance du certificat n'a pas pu être lu (texte Refworld inaccessible, HTTP 403).
- `where`: Les ambassades se contredisent sur la possibilité de demander le certificat à l'étranger ; à confirmer auprès de l'ambassade du pays de résidence.

### `extrait-casier-judiciaire-bulletin-3`

Criminal record extract (bulletin No. 3) — *Extrait de casier judiciaire (bulletin n° 3)*

Sources:

0. [Demande d'extrait de casier judiciaire (étape 384, procédure « S'enregistrer comme commerçant individuel - Initiale »)](https://yaounde.eregulations.org/procedure/175/69/step/384?l=fr) — eRegulations Yaoundé (MINPMEESA) (official)
1. [Retrait de l'extrait de casier judiciaire (étape 385)](https://yaounde.eregulations.org/procedure/175/69/step/385?l=fr) — eRegulations Yaoundé (MINPMEESA) (official)
2. [Comment obtenir un certificat de police – Cameroun](https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/medical-police/certificats-police/comment/cameroun.html) — Immigration, Réfugiés et Citoyenneté Canada (non-official)
3. [La coopération judiciaire pénale en zone CEMAC (mémoire, section casier judiciaire)](https://www.memoireonline.com/03/08/989/m_cooperation-judiciaire-penale-zone-cemac35.html) — Memoire Online (non-official)
4. [Authentication / Legalization of official Cameroonian documents (version January 2023)](https://www.cameroonembassyusa.org/main23/Images/documents_folder/AuthenticationLegalizationofOfficialCameroonianDocuments.pdf) — Ambassade de la République du Cameroun aux États-Unis (official)

Unverified:

- `validity`: Aucune source officielle trouvée sur la durée de validité. Des guides non officiels parlent de 3 mois ; les administrations qui exigent le document fixent souvent elles-mêmes une ancienneté maximale.
- `cost`: Montant issu d'une fiche eRegulations de 2015 (TPI de Yaoundé) ; la page procédure officielle du MINJUSTICE (« Procédure de délivrance de Casier Judiciaire ») est vide (« Contenu en attente »). Peut varier selon le tribunal.
- `legal_basis`: Les numéros exacts des articles du Code de procédure pénale relatifs au casier judiciaire n'ont pas pu être vérifiés sur un texte officiel ; le Code n'est pas dans le corpus data/sources.
- `where`: Aucune plateforme officielle de demande en ligne n'a été trouvée ; la démarche est décrite comme physique.

### `certificat-medical`

Medical certificate (fitness certificate, pre-employment or exam medical check) — *Certificat médical (aptitude physique, visite médicale d'embauche ou de concours)*

Sources:

0. [Arrêté MINESUP portant ouverture de l'Examen National d'Entrée au Cycle de Spécialisation en Médecine au Cameroun, année académique 2021-2022](https://minesup.gov.cm/site/2021/DAUQ/Examen%20National%20d'entree%20au%20cycle%20de%20Specialisation%202021_fr.pdf) — Ministère de l'Enseignement Supérieur (MINESUP) (official)
1. [Arrêté MINFOPRA du 21 décembre 2017 portant ouverture d'un test de sélection pour le recrutement de 150 sages-femmes/maïeuticiens (MINSANTE)](https://www.minsante.cm/site/sites/default/files/150sfm2017.pdf) — Ministère de la Santé Publique / MINFOPRA (official)
2. [Code du travail (loi n° 92-007 du 14 août 1992) — texte du corpus SONAH (data/sources, id code-du-travail-1992)](https://faolex.fao.org/docs/pdf/cmr198304.pdf) — Assemblée nationale du Cameroun (édition Droit-Afrique, hébergée par FAOLEX) (non-official)

Unverified:

- `cost`: Pas de tarif officiel national ; le montant dépend de l'établissement ou du médecin. Ne pas annoncer de prix.
- `documents`: Aucune source officielle ne liste les pièces à présenter au médecin (une pièce d'identité est d'usage mais non vérifiée).
- `delay`: Dépend de l'établissement et des examens éventuellement demandés (analyses, radiographie) ; non vérifié.
- `validity`: Aucune règle générale officielle trouvée ; l'organisme demandeur (concours, employeur) fixe en pratique l'ancienneté maximale acceptée.

### `carte-grise-immatriculation`

Vehicle registration card (carte grise): registering the transfer of a used vehicle — *Carte grise : enregistrement de la mutation d'un véhicule d'occasion et établissement de la carte grise*

Sources:

0. [Note explicative sur la réforme des procédures d'enregistrement des mutations des véhicules d'occasion (entrée en vigueur le 1er juin 2017)](https://www.impots.cm/uploads/Telechargement/NOTE%20EXPLICATIVE%20SUR%20LA%20MUTATIO%20DES%20VEHICULE%20AUTO%20F.pdf) — Direction Générale des Impôts, Ministère des Finances (official)
1. [Véhicules d'occasion : le Cameroun lance une nouvelle modalité d'enregistrement des mutations en ligne (communiqué DGI du 31 août 2022, effet au 15 septembre 2022)](https://www.cncc.cm/fr/article/vehicules-d-occasion-le-cameroun-lance-une-nouvelle-modalite-d-enregistrement-des-mutations-en-ligne-379) — Conseil National des Chargeurs du Cameroun (CNCC) (official)
2. [Titres de transports : la nouvelle carte grise est là (27 août 2020)](https://www.cameroon-tribune.cm/article.html/34577/fr.html/titres-de-transports-la-nouvelle-carte-grise) — Cameroon Tribune (SOPECAM) (non-official)
3. [Portail des services des transports (permis de conduire, carte grise, licences)](https://ssdtmint.cm/) — Ministère des Transports du Cameroun (official)
4. [Les Camerounais peuvent désormais demander un permis de conduire en ligne (communiqué du ministre des Transports du 14 novembre 2024)](https://laminute.info/2024/11/15/les-camerounais-peuvent-desormais-demander-un-permis-de-conduire-en-ligne/) — La Minute (non-official)
5. [Véhicules d'occasion : les droits d'enregistrement et de timbre sur les mutations désormais payés dans Camcis (3 janvier 2024, communiqué MINFI du 2 janvier 2024)](https://www.investiraucameroun.com/gestion-publique/0301-20155-vehicules-d-occasion-les-droits-d-enregistrement-et-de-timbre-sur-les-mutations-desormais-payes-dans-camcis) — Investir au Cameroun (non-official)

Unverified:

- `documents`: La liste couvre la mutation d'un véhicule d'occasion (achat local ou importation). Les pièces pour la première immatriculation d'un véhicule neuf et pour un duplicata de carte grise n'ont pas été trouvées dans une source officielle.
- `cost`: Les frais d'établissement de la carte grise perçus par le ministère des Transports (recette non fiscale, payable en ligne selon des guides non officiels) n'ont pas pu être vérifiés ; seuls les droits fiscaux (DGI) sont indiqués.
- `delay`: Aucun délai officiel de délivrance de la carte grise n'a été trouvé.
- `validity`: Durée de validité de la carte grise non trouvée dans une source officielle.
- `steps`: L'articulation exacte entre la plateforme ssdtmint.cm (depuis décembre 2024) et la transmission impôts → délégation décrite par la note DGI de 2017 n'a pas pu être vérifiée ; la plateforme ne publie pas de guide accessible.

### `permis-de-conduire-obtention`

Getting a driving licence (first application) — *Obtenir le permis de conduire (première demande)*

Sources:

0. [Ministère des Transports – page d'accueil (Résultats examens permis, Titres des transports)](https://mintransports.cm/) — Ministère des Transports du Cameroun (official)
1. [Portail des services des transports (permis de conduire et badges, carte grise)](https://ssdtmint.cm/) — Ministère des Transports du Cameroun (official)
2. [Les Camerounais peuvent désormais demander un permis de conduire en ligne (communiqué du ministre des Transports du 14 novembre 2024)](https://laminute.info/2024/11/15/les-camerounais-peuvent-desormais-demander-un-permis-de-conduire-en-ligne/) — La Minute (non-official)
3. [Request for Driving License Documents (certificat d'authenticité du permis)](http://cameroonemb-jp.org/legalization-certification/driving-license-documents/) — Ambassade de la République du Cameroun au Japon (official)
4. [Ordonnance de juin 2024 modifiant la loi de finances 2024 – recettes « Production des documents sécurisés de transport » (agrément des établissements de formation à la conduite automobile, permis de conduire national et international)](https://prc.cm/files/41/5c/26/3621ac2603f3f0a3d2ebf7657b1202f3.pdf) — Présidence de la République du Cameroun (official)
5. [Cameroun : pas d'augmentation des frais du timbre du permis de conduire (14 novembre 2023)](https://fr.journalducameroun.com/cameroun-pas-daugmentation-des-frais-du-timbre-du-permis-de-conduire/) — Journal du Cameroun (non-official)

Unverified:

- `who_can_apply`: Âges minimums par catégorie (A, B, C, D, E, F) cités seulement par des guides non officiels ; texte réglementaire (arrêtés du ministre des Transports de 2015) non retrouvé en ligne.
- `documents`: Aucune liste officielle des pièces (CNI, certificat médical d'aptitude, attestation d'auto-école, photos, etc.) n'a été trouvée ; seuls des blogs en publient. La plateforme ssdtmint.cm n'expose pas de guide public.
- `cost`: Montant du timbre / des frais d'établissement non publié par une source officielle accessible ; le chiffre de 5 000 FCFA n'apparaît que dans une rumeur démentie rapportée par la presse, sans confirmation du montant actuel.
- `delay`: Aucun délai officiel de délivrance trouvé.
- `validity`: Durée de validité du permis national non trouvée dans une source officielle.
- `legal_basis`: Les arrêtés de 2015 du ministre des Transports sur les auto-écoles et les conditions d'obtention du permis sont mentionnés par la presse mais leurs numéros et textes n'ont pas été retrouvés.
- `steps`: Les modalités exactes de l'examen (épreuves théorique et pratique, inscription par l'auto-école), du paiement en ligne et du retrait du titre (permis sécurisé) n'ont pas été confirmées par une source officielle.

### `creation-entreprise-individuelle-cfce`

Registering a sole proprietorship (Établissement) at the CFCE — *Créer une entreprise individuelle (Établissement) au CFCE*

Sources:

0. [CFCE in brief / Business creation space in the Republic of Cameroon](https://minfi.gov.cm/en/business-creation-space-in-the-republic-of-cameroon/) — Ministère des Finances (MINFI) (official)
1. [S'enregistrer comme commerçant individuel – en ligne](https://yaounde.eregulations.org/procedure/181/136?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)
2. [S'enregistrer comme commerçant individuel – procédure initiale (en cours de révision)](https://yaounde.eregulations.org/procedure/81/69?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)
3. [Bon à savoir sur l'Impôt général synthétique (IGS) – mars 2025 (brochure DGI, copie hébergée par Lefisk)](https://lefisk.cm/uploads/brochure-igs-dgi-cameroun.pdf) — Direction générale des Impôts (copie sur lefisk.cm) (non-official)

Unverified:

- `where`: Le domaine mybusiness.cm affichait une page parking (« domain may be for sale ») le 2026-10-23 ; la disponibilité du dépôt en ligne n'a pas pu être confirmée. Le dépôt physique au CFCE reste la voie sûre.
- `cost`: Les deux sources officielles concordent sur 41 500 FCFA, mais les pages eRegulations ne sont pas datées et une ancienne fiche indique 53 000 FCFA ; à confirmer au CFCE.
- `validity`: L'immatriculation au RCCM n'a pas de durée de validité indiquée dans les sources consultées.
- `where`: Les adresses précises des CFCE régionaux ne sont pas publiées sur la page du MINFI.

### `creation-sarl-cfce`

Incorporating a limited liability company (SARL) at the CFCE with privately drafted articles — *Créer une SARL au CFCE (statuts sous seing privé)*

Sources:

0. [Décret n° 2017/0877/PM du 28 février 2017 (corpus SONAH : decret-2017-0877-pm-cfce)](https://spm.gov.cm/site/sites/default/files/PM%20%2822%29.pdf) — Services du Premier Ministre (official)
1. [CFCE in brief / Business creation space in the Republic of Cameroon](https://minfi.gov.cm/en/business-creation-space-in-the-republic-of-cameroon/) — Ministère des Finances (MINFI) (official)
2. [Créer une société locale – CFCE – statuts sous seing privé](https://yaounde.eregulations.org/procedure/184/139?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)
3. [Créer une société locale – en ligne – statuts sous seing privé](https://yaounde.eregulations.org/procedure/185/140?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)

Unverified:

- `cost.amount_fcfa`: Pas de montant unique : le droit de timbre dépend du nombre de pages des statuts, et les deux sources officielles présentent les frais différemment (MINFI 41 500 FCFA de frais d'enregistrement ; eRegulations 21 500 + 20 000 FCFA ou 20 500 + 1 000 + 20 000 FCFA selon la fiche).
- `where`: Le domaine mybusiness.cm affichait une page parking le 2026-10-23 ; la disponibilité du dépôt en ligne n'a pas pu être confirmée.
- `validity`: Aucune durée de validité n'est indiquée dans les sources pour l'immatriculation RCCM.

### `attestation-de-non-redevance`

Obtaining a tax compliance certificate (ACF, formerly tax clearance certificate / ANR) — *Obtenir une attestation de conformité fiscale (ACF, ex-attestation de non-redevance)*

Sources:

0. [L'attestation de conformité fiscale en cinq points (dépliant DGI, janvier 2024)](https://minfi.gov.cm/wp-content/uploads/2024/01/DEPLIANT_ATTESTATION_DE_CONFORMITE_FISCALE.pdf) — Ministère des Finances – Direction générale des Impôts (official)
1. [Bon à savoir sur l'Impôt général synthétique (IGS) – mars 2025 (brochure DGI, copie hébergée par Lefisk)](https://lefisk.cm/uploads/brochure-igs-dgi-cameroun.pdf) — Direction générale des Impôts (copie sur lefisk.cm) (non-official)

Unverified:

- `documents`: Le dépliant officiel ne liste aucune pièce : la démarche est en ligne à partir du compte contribuable. Liste laissée vide.
- `cost.amount_fcfa`: Aucun frais officiel indiqué. Un site non officiel (lefisk.cm) évoque 5 000 / 10 000 FCFA selon le régime : non retenu faute de source officielle.
- `delay`: Délai non indiqué par la DGI (document généré en ligne). Les 72 h à 15 jours évoqués par lefisk.cm ne sont pas confirmés officiellement.
- `validity`: Durée de validité non indiquée dans le dépliant DGI ; les 3 mois avancés par lefisk.cm ne sont pas confirmés officiellement.
- `legal_basis`: Le numéro de la loi de finances 2024 et l'article exact du CGI ne sont pas cités dans le dépliant.

### `impot-liberatoire-patente`

Paying the General Synthetic Tax (IGS, formerly the flat-rate 'impôt libératoire') or the business licence tax (patente) — *Payer l'Impôt général synthétique (IGS, ex-impôt libératoire) ou la patente*

Sources:

0. [Bon à savoir sur l'Impôt général synthétique (IGS) – Réforme de la fiscalité locale, mars 2025 (brochure DGI, copie hébergée par Lefisk)](https://lefisk.cm/uploads/brochure-igs-dgi-cameroun.pdf) — Direction générale des Impôts (copie sur lefisk.cm) (non-official)
1. [Cameroun : réforme de la loi portant fiscalité locale](https://www.labase-lextenso.fr/l-essentiel-droits-africains-des-affaires/2025-n2/cameroun-reforme-de-la-loi-portant-fiscalite-locale-DAA202v3) — L'Essentiel Droits africains des affaires (Lextenso) (non-official)
2. [Paiement des impôts (menu : impôt libératoire, chiffre d'affaires annuel < 10 millions FCFA)](https://yaounde.eregulations.org/menu/18?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)

Unverified:

- `sources`: La brochure IGS porte l'en-tête de la DGI mais n'a pas été trouvée sur impots.cm ; elle a été consultée sur un site tiers (lefisk.cm). Le texte de la loi n° 2024/020 n'a pas été consulté directement.
- `cost`: Les tarifs intermédiaires (classes 2 à 9 : 30 000, 40 000, 50 000, 60 000, 150 000, 300 000, 500 000, 1 000 000 FCFA) figurent dans un tableau dont l'extraction texte est ambiguë ; seules les bornes sont reprises. À vérifier sur le texte de loi.
- `cost`: Le mode de calcul et le montant de la patente pour les entreprises du régime du réel n'ont pas été vérifiés.
- `legal_basis`: La loi de finances 2026 a pu modifier les seuils de l'IGS (projet d'abaissement à 30 M FCFA pour les professions libérales évoqué par la presse) : non vérifié sur texte officiel.

### `numero-identifiant-unique-niu`

Obtaining a Unique Taxpayer Identification Number (NIU) and tax registration certificate — *Obtenir son Numéro d'Identifiant Unique (NIU) et son attestation d'immatriculation fiscale*

Sources:

0. [Immatriculation](https://www.impots.cm/fr/immatriculation) — Direction générale des Impôts (DGI) (official)
1. [CFCE in brief / Business creation space in the Republic of Cameroon](https://minfi.gov.cm/en/business-creation-space-in-the-republic-of-cameroon/) — Ministère des Finances (MINFI) (official)
2. [Guide d'utilisateur – déclaration annuelle des particuliers](https://www.impots.cm/sites/default/files/documents/Guide%20d%27utilisateur%20de%CC%81claration%20annuelle%20des%20particuliers_082146.pdf) — Direction générale des Impôts (DGI) (official)
3. [www.impots.cm numéro d'immatriculation en ligne Cameroun (reprise du communiqué DGI)](https://kamerpower.com/fr/www-impots-cm-numero-dimmatriculation-en-ligne-cameroun) — Kamerpower (non-official)

Unverified:

- `cost`: La gratuité repose sur un communiqué DGI (avril 2020) reproduit par un site tiers ; la page officielle impots.cm ne mentionne pas de frais. Montant laissé à null.
- `validity`: La durée de validité du NIU ou de l'attestation d'immatriculation n'est pas indiquée par la DGI.
- `steps`: Les étapes 1 à 3 s'appuient sur le guide DGI des particuliers (consulté via les résultats de recherche) ; l'interface du portail peut avoir changé.

### `immatriculation-cnps-employeur`

Registering as an employer with the National Social Insurance Fund (CNPS) — *Immatriculer un employeur à la CNPS*

Sources:

0. [Règles générales pour les employeurs](https://www.cnps.cm/fr/employeurs/regles-generales-pour-les-employeurs1.html) — Caisse nationale de prévoyance sociale (CNPS) (official)
1. [Services en ligne pour employeurs](https://www.cnps.cm/fr/employeurs/services-en-ligne-pour-employeurs.html) — Caisse nationale de prévoyance sociale (CNPS) (official)
2. [Immatriculation de l'entreprise et du salarié à la CNPS](https://yaounde.eregulations.org/procedure/93/53?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)
3. [S'enregistrer comme commerçant individuel – en ligne (résultats : fiche CNPS employeur)](https://yaounde.eregulations.org/procedure/181/136?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)

Unverified:

- `cost.amount_fcfa`: La CNPS ne publie aucun frais d'immatriculation ; montant laissé à null plutôt que 0.
- `legal_basis`: Références reprises d'eRegulations, qui signale une incohérence entre le numéro de l'ordonnance (73-17) et le nom du fichier joint (73-14) ; textes non consultés directement.
- `documents`: La patente demandée par la CNPS peut ne plus exister pour les petites entreprises soumises à l'IGS depuis la réforme de 2024 ; pièce de substitution non vérifiée.

### `immatriculation-cnps-travailleur`

Registering a worker (insured person) with the CNPS — *Immatriculer un travailleur (assuré social) à la CNPS*

Sources:

0. [Assuré(e) obligatoire](https://www.cnps.cm/fr/assures/assure-e.html) — Caisse nationale de prévoyance sociale (CNPS) (official)
1. [Règle générale pour assuré(e)](https://www.cnps.cm/fr/assures/regle-generale-pour-assure-e.html) — Caisse nationale de prévoyance sociale (CNPS) (official)
2. [CNPS – page d'accueil (liens e-services)](https://www.cnps.cm) — Caisse nationale de prévoyance sociale (CNPS) (official)
3. [Immatriculation de l'entreprise et du salarié à la CNPS](https://yaounde.eregulations.org/procedure/93/53?l=fr) — eRegulations Yaoundé (portail des procédures administratives) (official)
4. [Règles générales pour les employeurs](https://www.cnps.cm/fr/employeurs/regles-generales-pour-les-employeurs1.html) — Caisse nationale de prévoyance sociale (CNPS) (official)

Unverified:

- `documents`: Les pages CNPS mélangent les listes de l'assuré obligatoire et de l'assuré volontaire ; une page « règle générale » ne demande que acte de naissance, pièce d'identité et certificat de travail. À confirmer au CPS.
- `validity`: Aucune carte ni durée de validité n'est mentionnée par la CNPS pour l'immatriculation de l'assuré.
- `cost`: Le taux de cotisation des salariés n'est pas publié sur les pages consultées.
- `legal_basis`: Le Code du travail de 1992 est cité par la CNPS uniquement pour la définition du « travailleur » ; il ne fixe pas la procédure d'immatriculation, régie par les textes de prévoyance sociale (non consultés directement).

### `inscription-listes-electorales`

Voter registration (Elections Cameroon – ELECAM) — *Inscription sur les listes électorales (ELECAM)*

Sources:

0. [Code électoral — Loi n° 2012/001 du 19 avril 2012 modifiée par la loi n° 2012/017 du 21 décembre 2012 (édition ELECAM / DGE, 2013)](https://www.electionpassport.com/files/Cameroon-Electoral-Code-French.pdf) — Elections Cameroon (ELECAM), Direction Générale des Élections — copie hébergée par ElectionPassport (official)
1. [Cameroun : Elecam annonce la publication du fichier électoral national sur son site internet (11 juillet 2025)](https://fr.journalducameroun.com/cameroun-elecam-annonce-la-publication-du-fichier-electoral-national-sur-son-site-internet/) — Journal du Cameroun (non-official)
2. [Cameroun : Elections - L'opération d'enregistrement des électeurs, avec Elecam, bat son plein (juillet 2025)](https://fr.allafrica.com/stories/202507070220.html) — AllAfrica (non-official)
3. [Elections Cameroon — site officiel](https://www.elecam.cm/) — Elections Cameroon (ELECAM) (official)

Unverified:

- `documents`: Les pièces exigées pour l'enrôlement (CNI ou récépissé de CNI, etc.) ne sont pas listées dans le Code électoral et aucune page officielle d'ELECAM les détaillant n'a été trouvée ; le site elecam.cm ne propose qu'un lien de consultation.
- `cost`: Gratuité non énoncée explicitement dans les sources consultées.
- `legal_basis`: Texte de 2012 (édition 2013). D'éventuelles modifications ultérieures du Code électoral n'ont pas été vérifiées ; le Code n'est pas dans le corpus data/sources.

### `inscription-examens-officiels`

Registration for official exams run by the Office du Baccalauréat (Probatoire, Baccalauréat) — 2026/2027 session — *Inscription aux examens officiels de l'Office du Baccalauréat (probatoire, baccalauréat) — session 2026/2027*

Sources:

0. [Examens officiels 2026/2027 : Les inscriptions ont démarré en ligne (14 octobre 2026)](https://cameroon-tribune.cm/article.html/81582/fr.html/details_2) — Cameroon Tribune (SOPECAM, quotidien national) (non-official)

Unverified:

- `documents`: Pièces à fournir non mentionnées dans l'article (texte partiellement payant) ; la circulaire MINESEC du 18 septembre 2026 n'a pas été trouvée en ligne.
- `who_can_apply`: Modalités pour les candidats libres non trouvées dans une source officielle.
- `cost`: Frais du probatoire et détail par série technique non précisés ; montants à confirmer dans la circulaire MINESEC.
- `delay`: Date de clôture des inscriptions non indiquée dans la source.
- `where`: URL exacte de la plateforme Epim-Exam.cm non vérifiée (citée seulement par son nom). Les examens du sous-système anglophone (GCE Board) et le BEPC/CAP (MINESEC/DECC) ne sont pas couverts : aucune source officielle trouvée sur leurs modalités d'inscription.

### `legalisation-copie-certifiee-conforme`

Certified true copies and legalisation of documents — *Copie certifiée conforme et légalisation de documents*

Sources:

0. [Authentication / Legalization of official Cameroonian documents (version January 2023)](https://www.cameroonembassyusa.org/main23/Images/documents_folder/AuthenticationLegalizationofOfficialCameroonianDocuments.pdf) — Ambassade de la République du Cameroun aux États-Unis (official)
1. [Achat de timbres communaux (étape 382, procédure « S'enregistrer comme commerçant individuel »)](https://yaounde.eregulations.org/procedure/81/69/step/382?l=fr) — eRegulations Yaoundé (MINPMEESA) (official)
2. [Obtention des actes d'état civil et du certificat de domicile (étape 383)](https://yaounde.eregulations.org/procedure/81/69/step/383?l=fr) — eRegulations Yaoundé (MINPMEESA) (official)
3. [Légalisation et Apostille de La Haye](https://exteriores.gob.es/Embajadas/yaunde/fr/ServiciosConsulares/Paginas/Consular/Legalizacion-y-apostilla-de-La-Haya.aspx) — Ambassade d'Espagne à Yaoundé (non-official)
4. [Arrêté MINFOPRA du 21 décembre 2017 portant ouverture d'un test de sélection pour le recrutement de 150 sages-femmes/maïeuticiens (MINSANTE)](https://www.minsante.cm/site/sites/default/files/150sfm2017.pdf) — Ministère de la Santé Publique / MINFOPRA (official)

Unverified:

- `cost`: Aucun tarif officiel trouvé pour la légalisation de signature au MINREX ni pour la certification conforme de photocopies (diplômes, CNI) en mairie, sous-préfecture ou commissariat. Des sites non officiels citent des montants divergents ; non retenus.
- `where`: La pratique courante de certification conforme de photocopies (diplômes, CNI) en mairie, sous-préfecture ou commissariat n'a pas pu être confirmée par une source officielle décrivant la procédure ; seule la formule « autorité civile compétente » figure dans les avis de concours.
- `delay`: Délai de traitement au MINREX non vérifié.
- `validity`: Aucune règle officielle générale trouvée sur la durée de validité d'une copie certifiée conforme ; chaque administration destinataire peut fixer sa propre exigence.

## Not covered

Procedures researched but not written because no official or reputable source could be found on 2026-10-23:

- **Driving licence duplicate / replacement** (`permis-de-conduire-duplicata`): only blogs describe it; the MINT portals (mintransports.cm, ssdtmint.cm) publish no guide.
- **Opening a restaurant / bar (débit de boissons)**: only an unofficial blog citing décret n° 90/1483 of 9 November 1990 and press articles; no eRegulations procedure and no MINAT/MINCOMMERCE page.
- **GCE Board and BEPC/CAP exam registration**: only third-party pages; no official GCE Board or MINESEC page found. Only the OBC Probatoire/Baccalauréat 2026/2027 registration is covered.
- **Certificat de résidence as a separate procedure**: no official source distinguishes it from the certificat de domicile; it is a keyword of `certificat-de-domicile`.

Known caveats: idcam.cm, bunec.cm and mybusiness.cm could not be reached during research; several sheets rely on eRegulations data whose last update predates 2026; the attestation de non-redevance has been replaced by the attestation de conformité fiscale and the impôt libératoire by the Impôt général synthétique (loi n° 2024/020), which the sheets with the legacy ids explain.
