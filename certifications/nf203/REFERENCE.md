# NF203 — NF Logiciel — Reference Victor

> Certification de la qualite des progiciels commerciaux

**Organisme** : INFOCERT / AFNOR Certification (marque NF)
**Norme de base** : ISO/IEC 25051:2014 (SQuaRE — Quality of Ready to Use Software Product)
**Complement** : ISO 9001 (systeme de management de la qualite)
**Validite** : 3 ans (audits de surveillance annuels)
**Obligation legale** : Volontaire (mais constitue une preuve de conformite fiscale pour les logiciels comptables)
**Prerequis** : Aucun

---

## 1. Champ d'application

La certification NF203 s'applique aux **progiciels commerciaux** (RUSP — Ready to Use Software Product). Elle certifie la qualite du produit logiciel ET du systeme qualite de l'editeur.

### Domaines fonctionnels certifiables

| Code | Domaine | Description |
|------|---------|-------------|
| NF203-CI | Comptabilite informatisee | Logiciel de comptabilite, conformite PCG, generation FEC |
| NF203-GA | Gestion des achats | Logiciel de gestion des achats et approvisionnements |
| NF203-GI | Gestion des immobilisations | Suivi du patrimoine immobilise |
| NF203-GS | Gestion des stocks | Gestion des inventaires et mouvements de stock |
| NF203-GC | Gestion commerciale | Devis, commandes, factures, relances |
| NF203-LP | Livre de police | Logiciel d'enregistrement des operations des commercants de metaux precieux |
| NF203-CCFN | Coffre-fort numerique | Conformite NF Z42-020 (conservation securisee de documents) |
| NF203-LAU | Support aux utilisateurs | Logiciel de helpdesk et support |
| NF203-LIP | Industrie pharmaceutique | Logiciel conforme aux exigences pharma |
| NF203-CRM | Gestion de la relation client | CRM |

---

## 2. Exigences communes (tous domaines)

### 2.1 Qualite du produit (ISO 25051 — modele SQuaRE)

| Caracteristique | Sous-caracteristiques | Exigences |
|-----------------|----------------------|-----------|
| **Aptitude fonctionnelle** | Completude, exactitude, pertinence | Fonctions conformes aux specifications, calculs exacts |
| **Performance** | Temps de reponse, utilisation des ressources, capacite | Temps de reponse acceptables, scalabilite documentee |
| **Compatibilite** | Coexistence, interoperabilite | Fonctionnement avec l'environnement cible documente |
| **Utilisabilite** | Facilite d'apprentissage, d'utilisation, protection contre les erreurs | Interface ergonomique, messages d'erreur clairs |
| **Fiabilite** | Maturite, disponibilite, tolerance aux pannes, capacite de recuperation | Stabilite, gestion des erreurs, reprise apres incident |
| **Securite** | Confidentialite, integrite, responsabilite, authenticite | Controle d'acces, journalisation, protection des donnees |
| **Maintenabilite** | Modularite, reutilisabilite, analysabilite, modifiabilite, testabilite | Architecture modulaire, corrections possibles |
| **Portabilite** | Adaptabilite, facilite d'installation, de remplacement | Installation documentee, migration de donnees |

### 2.2 Documentation produit

| Ref | Exigence |
|-----|----------|
| DOC-01 | Documentation utilisateur complete et a jour |
| DOC-02 | Documentation technique precise |
| DOC-03 | Guide d'installation detaille |
| DOC-04 | Notes de version et historique des modifications |
| DOC-05 | Documentation des anomalies connues |
| DOC-06 | Manuel d'administration (si applicable) |

### 2.3 Tests

| Ref | Exigence |
|-----|----------|
| TEST-01 | Plan de test documente (couverture fonctionnelle) |
| TEST-02 | Description des cas de test et jeux de donnees |
| TEST-03 | Resultats de test documentes avec preuves |
| TEST-04 | Tests de regression pour chaque version |
| TEST-05 | Tests d'acceptation utilisateur documentes |

### 2.4 Systeme qualite editeur (ISO 9001)

| Ref | Exigence |
|-----|----------|
| QMS-01 | Systeme de management de la qualite pour le developpement logiciel |
| QMS-02 | Gestion des retours clients et satisfaction |
| QMS-03 | Gestion des non-conformites |
| QMS-04 | Processus d'actions correctives |
| QMS-05 | Gestion des fournisseurs et sous-traitants |
| QMS-06 | Gestion de la configuration et des versions |
| QMS-07 | Support client (assistance, maintenance, mises a jour) |

---

## 3. Exigences specifiques par domaine

### NF203-CI — Comptabilite informatisee

| Ref | Exigence |
|-----|----------|
| CI-01 | Gestion des ecritures comptables (saisie, validation, journaux) |
| CI-02 | Gestion des comptes de tiers (clients, fournisseurs) |
| CI-03 | Gestion de la TVA et declarations fiscales |
| CI-04 | Gestion des immobilisations (si integre) |
| CI-05 | Generation des etats comptables (balance, grand livre, journaux) |
| CI-06 | Conformite au PCG (Plan Comptable General) |
| CI-07 | **Generation du FEC** (Fichier des Ecritures Comptables) conforme art. L47 A-1 LPF |
| CI-08 | Piste d'audit de toutes les operations comptables |
| CI-09 | Cloture des exercices et irreversibilite |
| CI-10 | Import/export des donnees comptables |

### NF203-CCFN — Coffre-fort numerique

| Ref | Exigence |
|-----|----------|
| CCFN-01 | Conformite NF Z42-020 |
| CCFN-02 | Integrite et authenticite des documents stockes |
| CCFN-03 | Controle d'acces et confidentialite |
| CCFN-04 | Tracabilite de toutes les operations |
| CCFN-05 | Garanties de conservation a long terme |
| CCFN-06 | Restitution dans un format standard |

---

## 4. Processus de certification

1. **Candidature** : Depot du dossier aupres d'INFOCERT
2. **Revue du dossier produit** : Documentation, specifications, architecture
3. **Tests du produit** : Tests fonctionnels, tests de qualite (ISO 25051)
4. **Audit du systeme qualite** : Verification des elements ISO 9001
5. **Decision du comite de certification** : Attribution de la marque NF
6. **Surveillance annuelle** : Verification du maintien de la conformite, evaluation des mises a jour
7. **Renouvellement** : Tous les 3 ans

---

## 5. Non-conformites courantes

1. **Documentation utilisateur incomplete ou obsolete**
2. **Plan de test insuffisant** (couverture fonctionnelle partielle)
3. **FEC non conforme** (format, champs manquants, encodage)
4. **Piste d'audit absente** pour les operations comptables
5. **Gestion des erreurs insuffisante** (pas de messages clairs, pas de recuperation)
6. **Procedures de sauvegarde/restauration non documentees**
7. **Calcul TVA non conforme** aux regles fiscales en vigueur
8. **Pas de controle de version** dans le processus de developpement
9. **Support client deficient** (delais de reponse, suivi des incidents)

---

## 6. Checklist Victor — Audit NF203

### Qualite produit
- [ ] Aptitude fonctionnelle verifiee (calculs exacts, fonctions conformes)
- [ ] Performance acceptable (temps de reponse mesures)
- [ ] Securite (controle d'acces, journalisation, protection donnees)
- [ ] Fiabilite (gestion des erreurs, reprise apres incident)

### Documentation
- [ ] Documentation utilisateur complete et a jour
- [ ] Guide d'installation disponible
- [ ] Notes de version et anomalies connues documentees

### Tests
- [ ] Plan de test avec couverture fonctionnelle
- [ ] Tests de regression pour chaque version
- [ ] Resultats documentes avec preuves

### Systeme qualite
- [ ] QMS en place pour le developpement logiciel
- [ ] Gestion des retours clients
- [ ] Gestion des non-conformites et actions correctives
- [ ] Gestion de la configuration et des versions

### Specifique comptabilite (CI)
- [ ] FEC generable et conforme
- [ ] Piste d'audit complete
- [ ] Cloture d'exercice irreversible
- [ ] Conformite PCG

---

## 7. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| **NF203-CI** | Si un service Miyukini gere de la comptabilite → NF203-CI applicable |
| **NF203-CCFN** | MiyuCloud pourrait etre certifie comme coffre-fort numerique |
| **Qualite logiciel** | Le protocole MIP v2 (TDD, P4 audit, checkpoints) repond aux exigences de tests et QMS |
| **Documentation** | Les artefacts MIP (specs, plans, audits) couvrent les exigences de documentation |
| **FEC** | JayKonta (comptabilite) devrait generer un FEC conforme |

---

*Sources : ISO/IEC 25051:2014, ISO/IEC 25010, ISO 9001, regles de certification INFOCERT NF203, BOI-CF-COM-10-80*
