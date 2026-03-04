<!-- @id cert.victor.nf461 -->
<!-- @do provide_nf461_reference_knowledge -->
<!-- @role electronic_archiving -->
<!-- @layer reference -->
<!-- @human Referentiel NF461 pour Victor -->

# NF461 — Systeme d'Archivage Electronique — Reference Victor

**TL;DR** : Certification AFNOR pour les SAE garantissant la valeur probante des documents electroniques. 6 principes (integrite, authenticite, perennite, tracabilite, confidentialite, reversibilite). 5 fonctions (versement, conservation, communication, elimination, restitution). Validite 3 ans.

**Organisme** : AFNOR Certification (NF 461) | **Norme** : NF Z42-013:2020 | **Equiv. intl** : ISO 14641-1
**Modele** : ISO 14721 (OAIS) | **Validite** : 3 ans (surveillance annuelle) | **Obligation** : Volontaire

---

## 1. Principes fondamentaux

| Principe | Description |
|----------|-------------|
| **Integrite** | Document non modifiable, hash verifie periodiquement |
| **Authenticite** | Origine et auteur traceables |
| **Perennite** | Lisible et exploitable pendant toute la duree de conservation |
| **Tracabilite** | Toutes operations journalisees (versement, acces, elimination) |
| **Confidentialite** | Acces controle et restreint |
| **Reversibilite** | Restitution format standard exploitable |

---

## 2. Exigences par fonction

### Versement (VER-01 a 08)

Verification conformite SIP, controle integrite (hash), validation metadonnees, enrichissement (horodatage, ID unique), accuse reception, gestion rejets, transformation SIP->AIP, journalisation.

### Conservation (CON-01 a 08)

Verification periodique integrite (recalcul hash), **minimum 2 copies supports differents**, distribution geographique, gestion cycle vie supports (rafraichissement), migration format si obsolescence (documentee, preuve non-alteration hash avant/apres), surveillance supports.

### Communication (COM-01 a 06)

Authentification, autorisation, generation DIP a la demande, journalisation tous acces, recherche/consultation (moteur, metadonnees), copies conformes.

### Elimination (ELI-01 a 06)

Autorisation formelle (workflow), uniquement a echeance duree conservation, destruction irreversible toutes copies, certificat destruction, journalisation, verification absence regle active.

### Restitution (RES-01 a 04)

Export format standard (SEDA, OAIS), completude verifiee, accompagnement (metadonnees, journaux, preuves integrite), destruction chez tiers-archiveur apres confirmation.

---

## 3. Exigences organisationnelles et infrastructure

| Type | Exigences |
|------|-----------|
| **Organisation** (ORG) | Politique archivage approuvee, roles definis, procedures par fonction, PCA, securite physique/logique, formation, engagements confidentialite, audit interne, conventions deposants, conformite RGPD |
| **Infrastructure** (INF) | Securite physique locaux, protection environnementale, alimentation secourue, redondance reseau, gestion cycle vie supports, chiffrement repos + transit |

---

## 4. Standards d'interoperabilite

| Standard | Usage |
|----------|-------|
| SEDA | Echange paquets archivage (SIP/AIP/DIP) — standard francais |
| OAIS (ISO 14721) | Modele reference systemes archivage |
| Dublin Core | Metadonnees descriptives |
| eIDAS | Signature, cachet, horodatage electroniques |
| METS / PREMIS | Metadonnees transmission / preservation |

---

## 5. Certification

| Etape | Detail |
|-------|--------|
| Candidature + revue recevabilite | Dossier AFNOR |
| Audit sur site | 6 jours (technique + organisationnel) |
| Decision comite certification | Attribution NF 461 |
| Surveillance annuelle | 2 jours/an (annees 2 et 3) |
| Renouvellement | Audit complet tous les 3 ans |

---

## 6. References legales

| Reference | Contenu |
|-----------|---------|
| Code Civil art. 1365-1368 | Preuve electronique, valeur probante |
| Code Patrimoine art. L211-1+ | Archives publiques |
| Decret 2011-144 | Archivage electronique actes administratifs |
| eIDAS (UE 910/2014) | Signature, horodatage, cachet |
| RGPD | Durees conservation, droit effacement DCP archivees |
| Code Commerce art. L123-22 | Conservation documents comptables (10 ans) |

---

## 7. Non-conformites courantes

Journalisation incomplete, verification integrite absente (hash non recalcules), politique archivage absente/non approuvee, redondance insuffisante (copie unique), PCA non teste, certificats destruction absents, metadonnees OAIS non conformes, controle acces insuffisant, migration format non documentee, reversibilite non testee.

---

## 8. Checklist Victor

**Versement** : [ ] Hash a l'ingestion [ ] Validation metadonnees [ ] Accuse reception [ ] Gestion rejets
**Conservation** : [ ] Hash recalcul periodique [ ] Min 2 copies supports differents [ ] Obsolescence supports geree [ ] Migration documentee
**Communication** : [ ] Auth + autorisation [ ] Journalisation acces [ ] Recherche fonctionnelle
**Elimination** : [ ] Workflow autorisation [ ] Destruction irreversible [ ] Certificats destruction
**Organisation** : [ ] Politique approuvee [ ] PCA teste [ ] Personnel forme [ ] Conventions deposants
**Infrastructure** : [ ] Securite physique [ ] Protection environnementale [ ] Chiffrement repos + transit

---

## 9. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| KindMother | DB SQLite pourrait beneficier d'un SAE pour conservation long terme |
| MiyuCloud | Si archivage documents (pas seulement stockage) -> NF461 applicable |
| Chunks chiffres | Chunking MiyuCloud avec hash par chunk compatible exigences integrite |
| Valeur probante | Si documents juridiques (contrats, factures) -> NF461 pertinent |

---

*Sources : NF Z42-013:2020, ISO 14641-1, ISO 14721 (OAIS), AFNOR Certification NF461, Code Civil*
