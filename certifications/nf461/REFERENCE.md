# NF461 — Systeme d'Archivage Electronique — Reference Victor

> Certification NF du systeme d'archivage electronique (SAE)

**Organisme** : AFNOR Certification (marque NF 461)
**Norme de base** : NF Z42-013:2020 (Archivage electronique — Recommandations et exigences)
**Equivalent international** : ISO 14641-1
**Modele de reference** : ISO 14721 (OAIS — Open Archival Information System)
**Validite** : 3 ans (audits de surveillance annuels)
**Obligation legale** : Volontaire (mais fortement recommande pour la valeur probante des documents)
**Prerequis** : Aucun

---

## 1. Champ d'application

La certification NF461 s'applique aux **systemes d'archivage electronique (SAE)** — editeurs, integrateurs et tiers-archiveurs — qui assurent la conservation perenne de documents electroniques avec garantie d'integrite, d'authenticite et de tracabilite.

**Objectif** : Garantir la **valeur probante** (force probatoire) des documents electroniques archives.

---

## 2. Principes fondamentaux

| Principe | Description |
|----------|-------------|
| **Integrite** | Le document archive ne peut etre modifie. Son empreinte (hash) est verifiee periodiquement |
| **Authenticite** | Le document est bien ce qu'il pretend etre. Origine et auteur sont traceables |
| **Perennite** | Le document reste lisible et exploitable pendant toute la duree de conservation |
| **Tracabilite** | Toutes les operations sur le document sont journalisees (versement, acces, elimination) |
| **Confidentialite** | L'acces aux archives est controle et restreint aux personnes autorisees |
| **Reversibilite** | Les archives peuvent etre restituees dans un format standard et exploitable |

---

## 3. Exigences par fonction du SAE

### 3.1 Versement (Ingest)

| Ref | Exigence |
|-----|----------|
| VER-01 | Verification de la conformite du paquet de versement (SIP — Submission Information Package) |
| VER-02 | Controle d'integrite a l'ingestion (verification du hash) |
| VER-03 | Validation des metadonnees (completude, format, coherence) |
| VER-04 | Enrichissement des metadonnees (horodatage, identifiant unique) |
| VER-05 | Generation d'un accuse de reception pour le deposant |
| VER-06 | Gestion des rejets (notification au deposant, motif du rejet) |
| VER-07 | Transformation du SIP en AIP (Archival Information Package) |
| VER-08 | Journalisation de toutes les operations de versement |

### 3.2 Conservation (Preservation)

| Ref | Exigence |
|-----|----------|
| CON-01 | Verification periodique de l'integrite (recalcul des hash) |
| CON-02 | Redondance minimale : **2 copies sur des supports differents** |
| CON-03 | Distribution geographique des copies (si possible) |
| CON-04 | Gestion du cycle de vie des supports de stockage (rafraichissement) |
| CON-05 | Migration de format si obsolescence du format d'origine |
| CON-06 | Documentation de toute migration (format source, format cible, outil, date) |
| CON-07 | Preuve de non-alteration apres migration (hash avant/apres) |
| CON-08 | Surveillance de l'etat des supports de stockage |

### 3.3 Communication (Acces)

| Ref | Exigence |
|-----|----------|
| COM-01 | Authentification des utilisateurs avant acces aux archives |
| COM-02 | Autorisation basee sur les droits du demandeur |
| COM-03 | Generation du DIP (Dissemination Information Package) a la demande |
| COM-04 | Journalisation de tous les acces (qui, quand, quel document) |
| COM-05 | Recherche et consultation des archives (moteur de recherche, metadonnees) |
| COM-06 | Fourniture de copies conformes sur demande |

### 3.4 Elimination (Destruction)

| Ref | Exigence |
|-----|----------|
| ELI-01 | Autorisation formelle avant toute elimination (workflow de validation) |
| ELI-02 | Elimination uniquement a l'echeance de la duree de conservation |
| ELI-03 | Destruction irreversible du document et de toutes ses copies |
| ELI-04 | Generation d'un certificat de destruction |
| ELI-05 | Journalisation de toutes les operations d'elimination |
| ELI-06 | Verification de l'absence de regle de conservation active avant elimination |

### 3.5 Restitution (Reversibilite)

| Ref | Exigence |
|-----|----------|
| RES-01 | Export des archives dans un format standard (SEDA, OAIS) |
| RES-02 | Verification de la completude des donnees restituees |
| RES-03 | Accompagnement de la restitution (metadonnees, journaux, preuves d'integrite) |
| RES-04 | Destruction des donnees chez le tiers-archiveur apres restitution confirmee |

---

## 4. Exigences organisationnelles

| Ref | Exigence |
|-----|----------|
| ORG-01 | Politique d'archivage documentee et approuvee par la direction |
| ORG-02 | Roles et responsabilites definis (archiviste, administrateur, DPO) |
| ORG-03 | Procedures operationnelles documentees pour chaque fonction du SAE |
| ORG-04 | Plan de continuite d'activite (PCA) pour le service d'archivage |
| ORG-05 | Gestion de la securite physique et logique |
| ORG-06 | Formation et competence du personnel |
| ORG-07 | Engagements de confidentialite signes |
| ORG-08 | Audit interne periodique du SAE |
| ORG-09 | Convention avec les deposants (SLA, responsabilites, durees de conservation) |
| ORG-10 | Conformite RGPD pour les archives contenant des DCP |

---

## 5. Exigences d'infrastructure

| Ref | Exigence |
|-----|----------|
| INF-01 | Securite physique des locaux de stockage (acces controle, surveillance) |
| INF-02 | Protection environnementale (temperature, humidite, incendie, inondation) |
| INF-03 | Alimentation electrique secourue (onduleur, generateur) |
| INF-04 | Redondance reseau |
| INF-05 | Gestion du cycle de vie des supports de stockage (obsolescence, rafraichissement) |
| INF-06 | Chiffrement des donnees au repos et en transit |

---

## 6. Standards d'interoperabilite

| Standard | Usage |
|----------|-------|
| **SEDA** (Standard d'Echange de Donnees pour l'Archivage) | Standard francais d'echange de paquets d'archivage (SIP/AIP/DIP) |
| **OAIS** (ISO 14721) | Modele de reference pour les systemes d'archivage |
| **Dublin Core** | Schema de metadonnees descriptives |
| **eIDAS** | Signature electronique, cachet electronique, horodatage |
| **METS** | Metadata Encoding and Transmission Standard |
| **PREMIS** | Metadonnees de preservation |

---

## 7. Processus de certification

1. **Candidature** : Depot du dossier aupres d'AFNOR Certification (description du SAE)
2. **Revue du dossier** : Verification de la recevabilite
3. **Audit sur site** : 6 jours (verification technique et organisationnelle)
4. **Rapport et constats** : Conformites, non-conformites, observations
5. **Decision du comite de certification** : Attribution de la marque NF 461
6. **Audits de surveillance** : 2 jours/an (annees 2 et 3)
7. **Renouvellement** : Audit complet tous les 3 ans

---

## 8. References legales francaises

| Reference | Contenu |
|-----------|---------|
| Code Civil art. 1365-1368 | Preuve electronique, conditions de valeur probante |
| Code du Patrimoine art. L211-1 et s. | Archives publiques, conservation, accessibilite |
| Decret 2011-144 du 2 fevrier 2011 | Archivage electronique des actes administratifs |
| eIDAS (UE 910/2014) | Signature electronique, horodatage, cachet |
| RGPD | Durees de conservation, droit a l'effacement des DCP archivees |
| Code de Commerce art. L123-22 | Conservation des documents comptables (10 ans) |

---

## 9. Non-conformites courantes

1. **Journalisation incomplete** (operations de versement/elimination non tracees)
2. **Verification d'integrite absente** (hash non recalcules periodiquement)
3. **Politique d'archivage absente** ou non approuvee par la direction
4. **Redondance insuffisante** (copie unique des archives)
5. **Pas de PCA teste** pour le service d'archivage
6. **Certificats de destruction absents**
7. **Metadonnees OAIS non conformes**
8. **Controle d'acces insuffisant** (pas de granularite fine)
9. **Migration de format non documentee**
10. **Procedures de reversibilite absentes** ou non testees

---

## 10. Checklist Victor — Audit NF461

### Versement
- [ ] Controle d'integrite a l'ingestion (hash)
- [ ] Validation des metadonnees
- [ ] Accuse de reception genere
- [ ] Gestion des rejets documentee

### Conservation
- [ ] Verification periodique de l'integrite (hash recalcul)
- [ ] Minimum 2 copies sur supports differents
- [ ] Gestion de l'obsolescence des supports
- [ ] Migration de format documentee si necessaire

### Communication
- [ ] Authentification et autorisation avant acces
- [ ] Journalisation de tous les acces
- [ ] Recherche et consultation fonctionnelles

### Elimination
- [ ] Workflow d'autorisation en place
- [ ] Destruction irreversible verificable
- [ ] Certificats de destruction generes

### Organisation
- [ ] Politique d'archivage documentee et approuvee
- [ ] PCA pour le service d'archivage teste
- [ ] Personnel forme et engage a la confidentialite
- [ ] Conventions avec les deposants en place

### Infrastructure
- [ ] Securite physique des locaux de stockage
- [ ] Protection environnementale
- [ ] Chiffrement au repos et en transit

---

## 11. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| **KindMother** | La DB SQLite de KindMother pourrait beneficier d'un SAE pour la conservation a long terme |
| **MiyuCloud** | Si MiyuCloud archive des documents (pas seulement du stockage), NF461 applicable |
| **Chunks chiffres** | Le chunking de MiyuCloud avec hash par chunk est compatible avec les exigences d'integrite |
| **Valeur probante** | Si les documents stockes ont une valeur juridique (contrats, factures), NF461 est pertinent |

---

*Sources : NF Z42-013:2020, ISO 14641-1, ISO 14721 (OAIS), AFNOR Certification NF461, Code Civil*
