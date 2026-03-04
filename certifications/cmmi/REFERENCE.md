<!-- @id cert.victor.cmmi -->
<!-- @do provide_cmmi_reference_knowledge -->
<!-- @role process_maturity -->
<!-- @layer reference -->
<!-- @human Referentiel CMMI v2.0 pour Victor -->

# CMMI v2.0 — Capability Maturity Model Integration — Reference Victor

**TL;DR** : Modele de maturite des processus (ISACA). 5 niveaux maturite (Initial->Optimizing), 4 categories (Doing/Managing/Enabling/Improving), 10 Capability Areas, 25 Practice Areas. Evaluation Benchmark par Lead Appraiser certifie. Validite 3 ans. Souvent exige defense/aeronautique/banque.

**Organisme** : CMMI Institute (ISACA) | **Version** : v2.0 (2018, MAJ continue)
**Vues** : DEV, SVC, SPM, PM, DMM | **Validite** : 3 ans | **Obligation** : Volontaire

---

## 1. Architecture du modele

### 4 Categories, 10 Capability Areas, 25 Practice Areas

| Cat. | Capability Area | Practice Areas |
|------|----------------|----------------|
| **DO** (Doing) | Ensuring Quality (EQ) | PQA, V&V |
| | Engineering & Dev Products (EDP) | RDM, TS, PI |
| | Delivering & Managing Services (DMS) | SDM, STSM |
| | Selecting & Managing Suppliers (SMS) | SAM |
| **MA** (Managing) | Planning & Managing Work (PMW) | EST, PLAN, MC, ROM |
| | Managing Business Resilience (MBR) | IRP |
| **EN** (Enabling) | Managing the Workforce (MWF) | OT |
| | Supporting Implementation (SI) | CAR, DAR, CM, PR |
| | Sustaining Habit & Persistence (SHP) | GOV, II, PCM, PAD |
| **IM** (Improving) | Improving Performance (IP) | MPM |

---

## 2. Niveaux de maturite

| Niveau | Nom | Description | Indicateur |
|--------|-----|-------------|------------|
| 1 | Initial | Ad hoc, reactif, succes depend individus | Aucune exigence formelle |
| 2 | Managed | Planifie, execute, mesure au niveau **projet** | Plans projet geres |
| 3 | Defined | Standardise au niveau **organisation** | Standards organisationnels deployes |
| 4 | Quantitatively Managed | Mesure par techniques statistiques (SPC) | Maitrise statistique |
| 5 | Optimizing | Amelioration continue basee sur analyse quantitative | Innovation + optimisation |

### Niveaux de capacite (par Practice Area)

| Niveau | Nom | Description |
|--------|-----|-------------|
| 0 | Incomplete | Pas executees ou partiellement |
| 1 | Performed | Executees mais pas gerees |
| 2 | Managed | Planifiees, executees, mesurees |
| 3 | Defined | Standardisees au niveau organisationnel |

---

## 3. Exigences par niveau

### ML2 — Managed (12 Practice Areas)

| PA | Exigences cles |
|----|----------------|
| EST | Estimer taille, complexite, effort, cout |
| PLAN | Plans projet avec jalons, risques, ressources |
| MC | Suivi avancement vs plan, agir sur ecarts |
| ROM | Identifier, analyser, attenuer risques |
| CM | Baselines, controle changements, audits config |
| PQA | Evaluations objectives processus + produits |
| RDM | Developper, analyser, gerer exigences |
| PR | Revues par les pairs artefacts cles |
| VV | Verifier/valider avec criteres + resultats |
| TS | Concevoir et implementer solutions techniques |
| PI | Integrer composants, livrer produit |
| SAM | Gerer accords fournisseurs |

### ML3 — Defined (ajouts)

OT (formation organisationnelle), DAR (decision formelle avec criteres), GOV (gouvernance processus), II (infrastructure processus standards), PCM (gestion processus), PAD (actifs processus), IRP (resolution incidents), + pratiques "Defined" sur toutes PA ML2.

### ML4 — Quantitatively Managed

MPM (objectifs performance quantitatifs), baselines statistiques, SPC, sous-processus critiques, modeles predictifs.

### ML5 — Optimizing

CAR (causes racines), analyse performance quantitative, innovation, amelioration proactive, objectifs amelioration quantitatifs.

---

## 4. Documents requis par niveau

| Niveau | Documents cles |
|--------|---------------|
| ML2 | Plans projet, registre risques, baselines config, rapports QA, registre exigences, plans test, resultats V&V |
| ML3 | Standards processus organisationnels, bibliotheque actifs, programme formation, gouvernance, guides adaptation |
| ML4 | Baselines performance, modeles performance, objectifs quantitatifs, rapports SPC |
| ML5 | Analyses causales, rapports amelioration, propositions innovation |

---

## 5. Evaluation (Appraisal)

| Type | Description | Duree | Validite |
|------|-------------|-------|----------|
| **Benchmark** | Formelle, Lead Appraiser certifie, determine niveau officiel | 1-3 sem sur site | 3 ans |
| **Sustainment** | Maintien entre Benchmarks | 2-5 jours | Prolonge |
| **Action Plan** | Auto-evaluation guidee (preparation) | Variable | Interne |

**Processus Benchmark** : Planification -> Preparation (preuves) -> Conduite (interviews, artefacts) -> Rapport (forces/faiblesses, niveau) -> Publication (CMMI Institute).

**Equipe** : Lead Appraiser (certifie), 4-8 evaluateurs, Sponsor (direction).

**Cout** : Preparation 50-300k EUR | Benchmark 30-100k EUR | Lead Appraiser 2-3.5k EUR/jour.

---

## 6. Non-conformites courantes

Processus documentes mais non suivis, pas de mesures performance, plans projet incomplets, revues pairs absentes, gestion config faible, formation organisationnelle absente, QA non independante, exigences non tracees, donnees historiques non capitalisees, gouvernance processus absente.

---

## 7. Checklist Victor

**ML2** : [ ] Plans projet (jalons, risques, ressources) [ ] Estimations validees [ ] Suivi avancement (indicateurs, ecarts) [ ] Registre risques [ ] Config (baselines, changements, audits) [ ] QA (evaluations objectives) [ ] Exigences tracees [ ] Revues pairs [ ] V&V (criteres + resultats) [ ] Solutions documentees [ ] Integration planifiee [ ] Fournisseurs geres
**ML3** : [ ] Standards processus deployes [ ] Programme formation [ ] DAR utilise [ ] Gouvernance (comite, revues) [ ] Bibliotheque actifs [ ] Resolution incidents [ ] Guides adaptation
**ML4** : [ ] Objectifs quantitatifs [ ] Baselines performance [ ] SPC applique [ ] Sous-processus critiques [ ] Modeles predictifs
**ML5** : [ ] CAR systematique [ ] Ameliorations proactives [ ] Innovation encouragee [ ] Objectifs amelioration quantitatifs

---

## 8. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| Niveau cible | ML3 (Defined) realiste. ML2 minimum utile |
| MIP v2 | Classification T1-T5, phases P0-P6, gates = embryon ML2-ML3 |
| Config Management | Git + feature branches + merge --no-ff + tags = CM conforme |
| QA (PQA) | George (audit) + clippy + tests. Manque : evaluations independantes formalisees |
| V&V | cargo test + clippy + audits George. Manque : criteres V&V par exigence |
| Estimation | Non formalise. MIP ne definit pas de processus estimation effort |
| Tracabilite | Artefacts MIP (briefs->specs->plans->audits) = tracabilite partielle |
| Risques | Maria identifie en P0. Pas de registre formel maintenu |
| Amelioration | Arianne (P6) capitalise anti-patterns/lecons = embryon amelioration continue |

---

*Sources : CMMI v2.0 (CMMI Institute/ISACA), CMMI for Development v2.0, CMMI Appraisal Method v2.0*
