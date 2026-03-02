# CMMI v2.0 — Capability Maturity Model Integration — Reference Victor

> Modele de maturite des processus pour le developpement de logiciels et services

**Organisme** : CMMI Institute (filiale ISACA)
**Version actuelle** : CMMI v2.0 (mars 2018, mise a jour continue)
**Vues disponibles** : Development (DEV), Services (SVC), Supplier Management (SPM), People Management (PM), Data Management (DMM)
**Obligation legale** : Volontaire (mais souvent exige dans les appels d'offres defense, aeronautique, banque, sante)
**Validite** : 3 ans (renouvellement par nouvel appraisal)
**Prerequis** : Aucun

---

## 1. Champ d'application

### A quoi sert le CMMI ?

Le CMMI est un **modele de reference de bonnes pratiques** qui aide les organisations a ameliorer leurs processus de developpement logiciel, de fourniture de services et de gestion de projets. Il mesure la **maturite** (niveau organisationnel) et la **capacite** (niveau par domaine de pratique).

### Qui est concerne ?

- Editeurs de logiciels
- ESN / SSII
- Entreprises avec developpement interne
- Fournisseurs de services IT
- Organisations defense, aeronautique, bancaire, sante
- Tout organisme souhaitant structurer et ameliorer ses processus

### Difference v1.3 → v2.0

| Aspect | v1.3 | v2.0 |
|--------|------|------|
| Structure | 22 Process Areas | 10 Capability Areas, 25 Practice Areas |
| Niveaux | Maturity 1-5 | Maturity 1-5 + Capability 0-3 |
| Appraisal | SCAMPI A/B/C | Benchmark (formel) + Sustainment (maintien) + Action Plan (leger) |
| Performance | Implicite | Explicit avec benchmarks de performance |
| Adoption | Tout ou rien | Progressive par Practice Area |

---

## 2. Architecture du modele

### 4 Categories

| Categorie | Code | Description |
|-----------|------|-------------|
| **Doing** | DO | Les pratiques coeur de metier (developpement, services) |
| **Managing** | MA | La gestion de projet et du travail |
| **Enabling** | EN | Les pratiques de support et d'infrastructure |
| **Improving** | IM | L'amelioration continue et la gestion de la performance |

### 10 Capability Areas (Domaines de capacite)

| # | Capability Area | Categorie | Practice Areas incluses |
|---|----------------|-----------|------------------------|
| 1 | **Ensuring Quality** (EQ) | DO | Process Quality Assurance (PQA), Verification & Validation (VV) |
| 2 | **Engineering & Developing Products** (EDP) | DO | Requirements Development & Management (RDM), Technical Solution (TS), Product Integration (PI) |
| 3 | **Delivering & Managing Services** (DMS) | DO | Service Delivery Management (SDM), Strategic Service Management (STSM) |
| 4 | **Selecting & Managing Suppliers** (SMS) | DO | Supplier Agreement Management (SAM) |
| 5 | **Planning & Managing Work** (PMW) | MA | Estimating (EST), Planning (PLAN), Monitor & Control (MC), Risk & Opportunity Management (ROM) |
| 6 | **Managing Business Resilience** (MBR) | MA | Incident Resolution & Prevention (IRP) |
| 7 | **Managing the Workforce** (MWF) | EN | Organizational Training (OT) |
| 8 | **Supporting Implementation** (SI) | EN | Causal Analysis & Resolution (CAR), Decision Analysis & Resolution (DAR), Configuration Management (CM), Peer Reviews (PR) |
| 9 | **Sustaining Habit & Persistence** (SHP) | EN | Governance (GOV), Implementation Infrastructure (II), Process Management (PCM), Process Asset Development (PAD) |
| 10 | **Improving Performance** (IP) | IM | Managing Performance & Measurement (MPM) |

### 25 Practice Areas (Domaines de pratique)

Chaque Practice Area contient des **pratiques** organisees par niveau de capacite (1-3) et contribuant aux niveaux de maturite (2-5).

---

## 3. Niveaux de maturite

### Les 5 niveaux

| Niveau | Nom | Description | Indicateur cle |
|--------|-----|-------------|----------------|
| **1** | Initial | Processus ad hoc, imprevisiblkes, reactifs. Succes depend des individus | Aucune exigence formelle |
| **2** | Managed (Gere) | Processus planifies, executes, mesures, controles au niveau **projet** | Les projets sont geres avec des plans |
| **3** | Defined (Defini) | Processus standardises, definis et compris au niveau **organisation** | Standards organisationnels deployes |
| **4** | Quantitatively Managed (Gere quantitativement) | Processus mesures par des techniques statistiques et quantitatives | Maitrise statistique des processus (SPC) |
| **5** | Optimizing (En optimisation) | Amelioration continue basee sur une comprehension quantitative des causes de variation | Innovation et optimisation continue |

### Exigences par niveau de maturite

#### Niveau 2 — Managed

| Ref | Practice Area | Exigences cles |
|-----|--------------|-----------------|
| ML2-01 | Estimating (EST) | Estimer la taille et la complexite du travail, developper des estimations d'effort et de cout |
| ML2-02 | Planning (PLAN) | Developper et maintenir des plans projet avec jalons, risques, ressources |
| ML2-03 | Monitor & Control (MC) | Suivre l'avancement par rapport au plan, agir sur les ecarts |
| ML2-04 | Risk & Opportunity Mgmt (ROM) | Identifier, analyser et attenuer les risques |
| ML2-05 | Configuration Mgmt (CM) | Gerer les versions, les baselines et les changements aux artefacts |
| ML2-06 | Process Quality Assurance (PQA) | Evaluer objectivement l'adherence aux processus |
| ML2-07 | Requirements Dev & Mgmt (RDM) | Developper, analyser et gerer les exigences |
| ML2-08 | Peer Reviews (PR) | Conduire des revues par les pairs des artefacts cles |
| ML2-09 | Verification & Validation (VV) | Verifier et valider les produits de travail |
| ML2-10 | Technical Solution (TS) | Concevoir et implementer des solutions techniques |
| ML2-11 | Product Integration (PI) | Integrer les composants et livrer le produit |
| ML2-12 | Supplier Agreement Mgmt (SAM) | Gerer les accords avec les fournisseurs |

#### Niveau 3 — Defined

| Ref | Practice Area | Exigences cles supplementaires |
|-----|--------------|-------------------------------|
| ML3-01 | Organizational Training (OT) | Programme de formation organisationnel, competences identifiees |
| ML3-02 | Decision Analysis (DAR) | Processus formel de prise de decision avec criteres |
| ML3-03 | Governance (GOV) | Gouvernance des processus au niveau organisationnel |
| ML3-04 | Implementation Infrastructure (II) | Infrastructure pour deployer et maintenir les processus standards |
| ML3-05 | Process Management (PCM) | Gestion et amelioration des processus organisationnels |
| ML3-06 | Process Asset Development (PAD) | Developpement et maintenance des actifs de processus (guides, templates) |
| ML3-07 | Incident Resolution (IRP) | Processus de resolution et prevention des incidents |
| ML3-08 | Toutes PA de ML2 | Pratiques de niveau "Defined" ajoutees (standardisation, processus organisationnel) |

#### Niveau 4 — Quantitatively Managed

| Ref | Exigence | Detail |
|-----|----------|--------|
| ML4-01 | Managing Performance & Measurement (MPM) | Etablir des objectifs de performance quantitatifs |
| ML4-02 | Baselines statistiques | Lignes de base de performance des processus cles |
| ML4-03 | Maitrise statistique (SPC) | Techniques statistiques pour analyser la performance |
| ML4-04 | Sous-processus critiques | Identifier et gerer les sous-processus qui contribuent le plus a la performance |
| ML4-05 | Modeles de performance | Modeles predictifs pour estimer la performance future |

#### Niveau 5 — Optimizing

| Ref | Exigence | Detail |
|-----|----------|--------|
| ML5-01 | Causal Analysis & Resolution (CAR) | Identifier les causes racines des defauts et problemes |
| ML5-02 | Analyse de performance | Utiliser les donnees quantitatives pour identifier les opportunites d'amelioration |
| ML5-03 | Innovation | Deployer des innovations technologiques et de processus |
| ML5-04 | Amelioration proactive | Selectionner et deployer des ameliorations basees sur une analyse quantitative |
| ML5-05 | Objectifs d'amelioration | Objectifs quantitatifs d'amelioration de la performance organisationnelle |

---

## 4. Niveaux de capacite (par Practice Area)

En plus des niveaux de maturite (organisationnels), chaque Practice Area a un **niveau de capacite** :

| Niveau | Nom | Description |
|--------|-----|-------------|
| **0** | Incomplete | Pratiques non executees ou partiellement executees |
| **1** | Performed (Initial) | Pratiques executees mais pas necessairement gerees |
| **2** | Managed | Pratiques planifiees, executees, mesurees, controlees |
| **3** | Defined | Pratiques standardisees au niveau organisationnel |

**Note** : Les niveaux de capacite 0-3 correspondent aux Practice Areas individuelles. Les niveaux de maturite 1-5 evaluent l'ensemble de l'organisation.

---

## 5. Processus d'evaluation (Appraisal)

### Types d'evaluation

| Type | Nom | Description | Duree | Validite |
|------|-----|-------------|-------|----------|
| **Benchmark** | Evaluation formelle | Evaluation complete par un Lead Appraiser certifie. Determine le niveau de maturite officiel | 1-3 semaines sur site | 3 ans |
| **Sustainment** | Evaluation de maintien | Verification du maintien du niveau entre deux Benchmarks | 2-5 jours | Prolonge le Benchmark |
| **Action Plan** | Evaluation legere | Auto-evaluation guidee pour preparer un Benchmark | Variable | Interne uniquement |

### Processus Benchmark

1. **Planification** — Definition du perimetre, des unites organisationnelles, du calendrier
2. **Preparation** — Collecte des preuves, formation de l'equipe d'evaluation
3. **Conduite** — Interviews, revue des artefacts, evaluation des pratiques
4. **Rapport** — Forces, faiblesses, notation des Practice Areas, determination du niveau
5. **Publication** — Enregistrement officiel aupres du CMMI Institute (resultat public)

### Equipe d'evaluation

| Role | Description |
|------|-------------|
| **Lead Appraiser** | Certifie CMMI Institute, dirige l'evaluation |
| **Appraisal Team Members** | 4-8 evaluateurs formes |
| **Sponsor** | Representant de la direction de l'organisation evaluee |

### Cout indicatif

- **Preparation** (mise en conformite) : 50 000 - 300 000 EUR (selon niveau vise et taille)
- **Evaluation Benchmark** : 30 000 - 100 000 EUR (selon perimetre et duree)
- **Lead Appraiser** : 2 000 - 3 500 EUR/jour
- **Formation CMMI** : 2 000 - 5 000 EUR par personne

---

## 6. Exigences detaillees par Practice Area cle

### Configuration Management (CM)

| Ref | Pratique | Niveau |
|-----|----------|--------|
| CM-1.1 | Identifier les elements de configuration | CL2 |
| CM-1.2 | Creer et maintenir les baselines | CL2 |
| CM-1.3 | Controler les changements aux elements de configuration | CL2 |
| CM-1.4 | Suivre et enregistrer les changements | CL2 |
| CM-1.5 | Effectuer des audits de configuration | CL2 |
| CM-2.1 | Integrer la CM dans les processus standards organisationnels | CL3 |

### Process Quality Assurance (PQA)

| Ref | Pratique | Niveau |
|-----|----------|--------|
| PQA-1.1 | Evaluer objectivement les processus | CL2 |
| PQA-1.2 | Evaluer objectivement les produits de travail | CL2 |
| PQA-1.3 | Communiquer et resoudre les non-conformites | CL2 |
| PQA-1.4 | Etablir des enregistrements QA | CL2 |
| PQA-2.1 | Standardiser les processus QA au niveau organisationnel | CL3 |

### Verification & Validation (VV)

| Ref | Pratique | Niveau |
|-----|----------|--------|
| VV-1.1 | Selectionner les produits de travail a verifier/valider | CL2 |
| VV-1.2 | Etablir l'environnement de verification/validation | CL2 |
| VV-1.3 | Etablir les procedures et criteres de V&V | CL2 |
| VV-1.4 | Executer la verification/validation | CL2 |
| VV-1.5 | Analyser les resultats de V&V | CL2 |
| VV-2.1 | Standardiser les processus V&V au niveau organisationnel | CL3 |

### Risk & Opportunity Management (ROM)

| Ref | Pratique | Niveau |
|-----|----------|--------|
| ROM-1.1 | Identifier les risques et opportunites | CL2 |
| ROM-1.2 | Analyser et prioriser les risques et opportunites | CL2 |
| ROM-1.3 | Developper des plans d'attenuation des risques | CL2 |
| ROM-1.4 | Implementer les plans d'attenuation | CL2 |
| ROM-2.1 | Integrer la gestion des risques dans les processus standards | CL3 |

### Estimating (EST)

| Ref | Pratique | Niveau |
|-----|----------|--------|
| EST-1.1 | Estimer la taille et la complexite | CL2 |
| EST-1.2 | Developper des estimations d'effort et de cout | CL2 |
| EST-1.3 | Faire valider les estimations | CL2 |
| EST-2.1 | Utiliser des donnees historiques et des modeles d'estimation | CL3 |

---

## 7. Documents et artefacts requis

### Par niveau de maturite

| Niveau | Documents cles |
|--------|---------------|
| **ML2** | Plans projet, registre des risques, baselines de configuration, rapports QA, registre des exigences, plans de test, resultats de V&V |
| **ML3** | Standards de processus organisationnels, bibliotheque d'actifs de processus, programme de formation, processus de gouvernance, guides d'adaptation |
| **ML4** | Baselines de performance des processus, modeles de performance, objectifs quantitatifs, rapports SPC, analyses statistiques |
| **ML5** | Analyses causales, rapports d'amelioration, propositions d'innovation, donnees de performance d'amelioration |

---

## 8. Non-conformites courantes

1. **Processus documentes mais non suivis** — ecart entre documentation et pratique reelle
2. **Pas de mesures de performance** — processus executes sans indicateurs
3. **Plans projet incomplets** — risques, ressources ou jalons manquants
4. **Revues par les pairs absentes** — code review ou document review non systematiques
5. **Gestion de configuration faible** — pas de baselines, pas de controle des changements
6. **Formation organisationnelle absente** — pas de programme structure
7. **QA non independante** — l'assurance qualite est faite par les developpeurs eux-memes
8. **Exigences non tracees** — pas de matrice de tracabilite exigences → tests → code
9. **Donnees historiques non capitalisees** — pas de reutilisation des metriques d'estimation
10. **Gouvernance des processus absente** — pas de comite, pas de revues de processus

---

## 9. Checklist Victor — Audit CMMI

### Niveau 2 — Managed

- [ ] Plans projet documentes avec jalons, risques, ressources
- [ ] Estimations d'effort et de cout realisees et validees
- [ ] Suivi d'avancement par rapport au plan (indicateurs, ecarts)
- [ ] Registre des risques maintenu et mis a jour
- [ ] Gestion de configuration : baselines, controle des changements, audits
- [ ] Assurance qualite : evaluations objectives processus et produits
- [ ] Exigences developpees, analysees, tracees
- [ ] Revues par les pairs conduites sur les artefacts cles
- [ ] V&V executees avec criteres et resultats documentes
- [ ] Solutions techniques concues et documentees
- [ ] Integration des composants planifiee et executee
- [ ] Accords fournisseurs geres (si applicable)

### Niveau 3 — Defined

- [ ] Standards de processus organisationnels definis et deployes
- [ ] Programme de formation organisationnel en place
- [ ] Processus de decision formelle (DAR) utilise
- [ ] Gouvernance des processus en place (comite, revues)
- [ ] Bibliotheque d'actifs de processus maintenue
- [ ] Processus de resolution d'incidents defini
- [ ] Guides d'adaptation des processus standards disponibles

### Niveau 4 — Quantitatively Managed

- [ ] Objectifs de performance quantitatifs etablis
- [ ] Baselines de performance des processus definies
- [ ] Techniques statistiques appliquees (SPC)
- [ ] Sous-processus critiques identifies et geres
- [ ] Modeles de performance predictifs utilises

### Niveau 5 — Optimizing

- [ ] Analyse des causes racines (CAR) systematique
- [ ] Ameliorations proactives deployees
- [ ] Innovation technologique et de processus encouragee
- [ ] Objectifs d'amelioration quantitatifs definis et suivis
- [ ] Donnees quantitatives utilisees pour piloter l'amelioration

---

## 10. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| **Niveau cible** | ML3 (Defined) est realiste pour un editeur logiciel de la taille de Miyukini. ML2 est le minimum utile |
| **MIP v2** | Le protocole MIP v2 (classification T1-T5, phases P0-P6, gates) est un embryon de CMMI ML2-ML3 |
| **Configuration Management** | Git + branches de feature + merge --no-ff + tags = CM conforme. Les baselines sont les tags sur main |
| **QA (PQA)** | George (audit) + clippy + tests = assurance qualite. Manque : evaluations objectives independantes formalisees |
| **V&V** | cargo test + cargo clippy + audits George = V&V niveau 2. Manque : criteres V&V formalises par exigence |
| **Estimation** | Non formalise actuellement. MIP v2 ne definit pas de process d'estimation d'effort |
| **Formation** | Non applicable (equipe d'agents). Mais le pattern "memoire + anti-patterns" (Arianne P6) simule la capitalisation |
| **Tracabilite** | Les artefacts MIP (.mip/briefs → specs → plans → audits) constituent une tracabilite partielle |
| **Risques** | Maria identifie les risques en P0. Pas de registre formel des risques maintenus dans le temps |
| **Amelioration** | Arianne (P6) capitalise les anti-patterns et lecons apprises → embryon d'amelioration continue |

---

*Sources : CMMI v2.0 Model (CMMI Institute/ISACA), CMMI for Development v2.0, CMMI Appraisal Method v2.0, CMMI Institute online resources*
