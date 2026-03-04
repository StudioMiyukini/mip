<!-- @id cert.maria.prince2 -->
<!-- @do provide_prince2_reference_knowledge -->
<!-- @role project_management -->
<!-- @layer reference -->
<!-- @human Referentiel PRINCE2 pour Maria -->

# PRINCE2 — Referentiel Maria

> **TL;DR** : Methode de gestion de projet structuree par AXELOS, largement adoptee en Europe.
> Basee sur 7 principes, 7 themes, 7 processus, avec un focus fort sur le Business Case et les gates.
> Impact Miyukini : renforce les gates MIP (P0-P6), la justification continue et la gestion par exception.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | AXELOS (PeopleCert depuis 2021) |
| Obligation | Volontaire (standard de fait UK, Europe, Australie) |
| Validite | Foundation = a vie, Practitioner = 3 ans |
| Prerequis | Foundation = aucun, Practitioner = Foundation obtenu |

## Domaine d'application

Methode de gestion de projet generique applicable a tout secteur et toute taille de projet. PRINCE2 est prescriptif dans sa structure mais concu pour etre adapte (tailored) a chaque contexte. L'edition 7 (2023) integre explicitement l'agilite.

## 7 Principes (non negociables)

| # | Principe | Description |
|---|----------|-------------|
| 1 | Justification continue | Le projet doit rester justifie (Business Case viable) |
| 2 | Lecons tirees de l'experience | Apprendre des projets precedents et en cours |
| 3 | Roles et responsabilites definis | Structure claire : Board, PM, Team Manager |
| 4 | Management par sequences | Projet decoupe en sequences gerees (stages) |
| 5 | Management par exception | Tolerances definies, escalade seulement si depassees |
| 6 | Focus produit | Livraison de produits conformes aux criteres qualite |
| 7 | Adaptation au contexte | Tailoring obligatoire selon l'environnement projet |

## 7 Themes

| Theme | But | Documents cles |
|-------|-----|----------------|
| Business Case | Justification et viabilite | Business Case, Benefits Review Plan |
| Organisation | Gouvernance et roles | Structure Board (Executive, Senior User, Senior Supplier) |
| Qualite | Criteres et controle qualite | Quality Register, Product Description |
| Plans | Planification multi-niveaux | Project Plan, Stage Plan, Team Plan |
| Risque | Identification et reponse aux risques | Risk Register (5 reponses : eviter, reduire, transferer, accepter, partager) |
| Changement | Maitrise des evolutions | Change Authority, Issue Register, Configuration Management |
| Progression | Suivi et controle avancement | Highlight Reports, End Stage Reports, tolerances |

## 7 Processus

| Processus | Quand | Responsable | Livrables |
|-----------|-------|-------------|-----------|
| Starting Up (SU) | Avant le projet | Executive + PM | Mandate, Projet Brief, Stage Plan initiation |
| Directing (DP) | Tout le projet | Project Board | Autorisations, decisions go/no-go |
| Initiating (IP) | Debut | PM | PID (Project Initiation Document), Business Case detaille |
| Controlling a Stage (CS) | Chaque sequence | PM | Work Packages, Highlight Reports |
| Managing Product Delivery (MP) | Chaque sequence | Team Manager | Produits livres, qualite verifiee |
| Managing Stage Boundary (SB) | Entre sequences | PM | End Stage Report, Plan sequence suivante |
| Closing (CP) | Fin | PM | End Project Report, Lessons Log, recommandations |

## Checklist Maria

- [ ] Business Case redige et approuve (valide a chaque stage gate)
- [ ] Stage gates planifiees avec criteres go/no-go explicites
- [ ] Tolerances definies (temps, cout, perimetre, risque, qualite, benefices)
- [ ] Gestion par exception : escalade si tolerances depassees
- [ ] Lecons apprises collectees a chaque sequence et archivees
- [ ] Product Descriptions avec criteres qualite avant production
- [ ] Risk Register maintenu et revise a chaque stage boundary
- [ ] Issue Register actif (changements, defauts, problemes)
- [ ] Highlight Reports produits selon cadence definie
- [ ] PID (ou equivalent Brief MIP) mis a jour et approuve

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Business Case jamais revise | Revalider la justification a chaque stage gate |
| Pas de tolerances definies | Definir des tolerances explicites pour chaque sequence |
| PM prend des decisions de Board | Respecter la separation PM / Project Board |
| Sequences trop longues | Decouper en sequences courtes pour un meilleur controle |
| Tailoring = ignorer des themes | Tailoring = adapter, pas supprimer (les 7 themes sont obligatoires) |
| Pas de lessons learned | Alimenter le Lessons Log des la premiere sequence |
| Micro-management par le Board | Le Board dirige par exception, pas par controle permanent |

## Application Miyukini

| Concept PRINCE2 | Application MIP v2 |
|-----------------|---------------------|
| Business Case | Brief P0 (Maria) — justification du chantier |
| Stage gates | Gates MIP : P0→P3, P3→P4, P4→P5, P5→P6 |
| Management par exception | Frein d'urgence MIP (arret si bug bloquant apres 2 auto-corrections) |
| 7 Processus | P0 (SU+IP), P3 (CS+MP), P4 (SB), P5 (CP+DP), P6 (Lessons) |
| Product Descriptions | Specs techniques P0 Temps 6 (Francois) |
| Risk Register | Analyse securite Victor (P0 T5) + registre risques |
| Highlight Reports | Annonces chat + TodoWrite (progression temps reel) |
| Tailoring | Classification T1-T5 adapte les phases actives |
| Lessons Log | Rapport P6 (Arianne) + capitalisation memoire |

---

*Sources : Managing Successful Projects with PRINCE2 7th Edition (AXELOS, 2023), PRINCE2 Foundation Study Guide (PeopleCert)*
