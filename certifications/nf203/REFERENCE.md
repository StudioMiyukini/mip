<!-- @id cert.victor.nf203 -->
<!-- @do provide_nf203_reference_knowledge -->
<!-- @role accounting_software -->
<!-- @layer reference -->
<!-- @human Referentiel NF203 pour Victor -->

# NF203 — NF Logiciel — Reference Victor

**TL;DR** : Certification INFOCERT/AFNOR pour la qualite des progiciels commerciaux (RUSP). Qualite produit ISO 25051 (SQuaRE) + QMS editeur ISO 9001 + exigences specifiques par domaine. 10 domaines certifiables dont comptabilite (CI) et coffre-fort numerique (CCFN). Validite 3 ans.

**Organisme** : INFOCERT / AFNOR (marque NF) | **Norme** : ISO/IEC 25051:2014 (SQuaRE) + ISO 9001
**Validite** : 3 ans (surveillance annuelle) | **Obligation** : Volontaire (preuve conformite fiscale pour logiciels comptables)

---

## 1. Domaines fonctionnels certifiables

| Code | Domaine |
|------|---------|
| NF203-CI | Comptabilite informatisee (PCG, FEC) |
| NF203-GA | Gestion des achats |
| NF203-GI | Gestion des immobilisations |
| NF203-GS | Gestion des stocks |
| NF203-GC | Gestion commerciale (devis, commandes, factures) |
| NF203-LP | Livre de police (metaux precieux) |
| NF203-CCFN | Coffre-fort numerique (NF Z42-020) |
| NF203-LAU | Support aux utilisateurs (helpdesk) |
| NF203-LIP | Industrie pharmaceutique |
| NF203-CRM | Gestion relation client |

---

## 2. Exigences communes

### Qualite produit (ISO 25051 SQuaRE)

| Caracteristique | Exigences |
|-----------------|-----------|
| Aptitude fonctionnelle | Fonctions conformes specs, calculs exacts |
| Performance | Temps reponse acceptables, scalabilite documentee |
| Compatibilite | Fonctionnement environnement cible documente |
| Utilisabilite | Ergonomie, messages erreur clairs |
| Fiabilite | Stabilite, gestion erreurs, reprise incident |
| Securite | Controle acces, journalisation, protection donnees |
| Maintenabilite | Architecture modulaire, corrections possibles |
| Portabilite | Installation documentee, migration donnees |

### Documentation (DOC-01 a 06)

Doc utilisateur complete/a jour, doc technique, guide installation, notes version, anomalies connues, manuel admin.

### Tests (TEST-01 a 05)

Plan test (couverture fonctionnelle), cas test + jeux donnees, resultats avec preuves, regression par version, acceptation utilisateur.

### Systeme qualite editeur (QMS-01 a 07)

QMS dev logiciel, retours clients, NC, actions correctives, fournisseurs, gestion config/versions, support client (assistance, maintenance, MAJ).

---

## 3. Exigences specifiques

### NF203-CI — Comptabilite informatisee

| Ref | Exigence |
|-----|----------|
| CI-01 a 03 | Ecritures comptables, comptes tiers, TVA/declarations fiscales |
| CI-04 a 06 | Immobilisations (si integre), etats comptables (balance, grand livre), conformite PCG |
| CI-07 | **Generation FEC** conforme art. L47 A-1 LPF |
| CI-08 a 10 | Piste audit operations comptables, cloture exercices (irreversible), import/export |

### NF203-CCFN — Coffre-fort numerique

Conformite NF Z42-020, integrite/authenticite, controle acces, tracabilite, conservation long terme, restitution format standard.

---

## 4. Certification

| Etape | Description |
|-------|-------------|
| 1 | Candidature INFOCERT |
| 2 | Revue dossier produit (doc, specs, architecture) |
| 3 | Tests produit (fonctionnels + qualite ISO 25051) |
| 4 | Audit systeme qualite (ISO 9001) |
| 5 | Decision comite certification (marque NF) |
| 6 | Surveillance annuelle (MAJ evaluees) |
| 7 | Renouvellement 3 ans |

---

## 5. Non-conformites courantes

Doc utilisateur incomplete/obsolete, plan test insuffisant, FEC non conforme (format, champs, encodage), piste audit absente, gestion erreurs insuffisante, sauvegardes/restauration non documentees, calcul TVA non conforme, pas de controle version, support client deficient.

---

## 6. Checklist Victor

**Qualite produit** : [ ] Aptitude fonctionnelle (calculs exacts) [ ] Performance (temps reponse) [ ] Securite (acces, journalisation) [ ] Fiabilite (erreurs, reprise)
**Documentation** : [ ] Doc utilisateur complete/a jour [ ] Guide installation [ ] Notes version + anomalies
**Tests** : [ ] Plan test couverture fonctionnelle [ ] Regression par version [ ] Resultats avec preuves
**QMS** : [ ] QMS dev logiciel [ ] Retours clients [ ] NC + actions correctives [ ] Config + versions
**Specifique CI** : [ ] FEC generable et conforme [ ] Piste audit complete [ ] Cloture irreversible [ ] Conformite PCG

---

## 7. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| NF203-CI | Service comptabilite Miyukini -> NF203-CI applicable |
| NF203-CCFN | MiyuCloud certifiable coffre-fort numerique |
| Qualite logiciel | MIP v2 (TDD, P4 audit, checkpoints) repond aux exigences tests/QMS |
| Documentation | Artefacts MIP (specs, plans, audits) couvrent exigences doc |
| FEC | JayKonta devrait generer un FEC conforme |

---

*Sources : ISO/IEC 25051:2014, ISO/IEC 25010, ISO 9001, regles INFOCERT NF203, BOI-CF-COM-10-80*
