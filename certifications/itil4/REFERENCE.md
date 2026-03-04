<!-- @id cert.maria.itil4 -->
<!-- @do provide_itil4_reference_knowledge -->
<!-- @role service_management -->
<!-- @layer reference -->
<!-- @human Referentiel ITIL 4 pour Maria -->

# ITIL 4 Foundation — Referentiel Maria

> **TL;DR** : Framework AXELOS/PeopleCert de gestion des services IT, le plus adopte mondialement.
> Couvre le Service Value System (SVS), 4 dimensions, Service Value Chain, 7 principes, 34 pratiques.
> Impact Miyukini : structure la gestion des services Central (catalogue, incidents, changements, amelioration).

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | AXELOS / PeopleCert |
| Obligation | Volontaire (standard de facto gestion services IT) |
| Validite | A vie (Foundation), 3 ans (niveaux superieurs) |
| Prerequis | Aucun (Foundation) |

## Domaine d'application

Gestion et livraison de services IT de bout en bout. ITIL 4 integre Agile, Lean, DevOps dans un systeme de valeur holistique. Applicable a toute organisation fournissant des services (internes ou externes).

## Service Value System (SVS)

| Composant | Description |
|-----------|-------------|
| Principes directeurs | 7 principes universels (voir ci-dessous) |
| Gouvernance | Diriger, evaluer, surveiller les activites |
| Service Value Chain | 6 activites creant de la valeur (voir ci-dessous) |
| Pratiques | 34 pratiques organisees en 3 categories |
| Amelioration continue | Boucle permanente a tous les niveaux |

## 7 Principes directeurs

| # | Principe | Resume |
|---|----------|--------|
| 1 | Focus on value | Tout doit etre lie a la valeur pour le client |
| 2 | Start where you are | Evaluer l'etat actuel avant de changer |
| 3 | Progress iteratively with feedback | Petites iterations avec feedback frequent |
| 4 | Collaborate and promote visibility | Travailler ensemble, rendre le travail visible |
| 5 | Think and work holistically | Voir le systeme complet, pas les silos |
| 6 | Keep it simple and practical | Eliminer ce qui n'apporte pas de valeur |
| 7 | Optimize and automate | Optimiser d'abord, automatiser ensuite |

## 4 Dimensions de la gestion de services

| Dimension | Couverture |
|-----------|------------|
| Organisations et personnes | Roles, competences, culture, communication |
| Information et technologie | Donnees, outils, plateformes, architecture |
| Partenaires et fournisseurs | Relations, contrats, integration, sous-traitance |
| Flux de valeur et processus | Workflows, procedures, activites, metriques |

## Service Value Chain (6 activites)

| Activite | But | Entrees/Sorties cles |
|----------|-----|----------------------|
| Plan | Assurer une vision partagee et une direction | Politiques, portfolios, plans d'amelioration |
| Improve | Amelioration continue a tous les niveaux | Feedback, metriques, initiatives d'amelioration |
| Engage | Comprendre besoins, maintenir les relations | Demandes, feedback, SLAs, contrats |
| Design & Transition | Concevoir et transitionner les services | Architecture, specs, tests, mises en prod |
| Obtain/Build | Obtenir ou construire les composants | Composants services, code, infra, contrats |
| Deliver & Support | Livrer et supporter les services | Incidents resolus, services operationnels |

## 34 Pratiques (3 categories)

| Categorie | Pratiques (14+17+3) |
|-----------|---------------------|
| **Generales (14)** | Architecture mgmt, Continual improvement, Info security mgmt, Knowledge mgmt, Measurement & reporting, Org change mgmt, Portfolio mgmt, Project mgmt, Relationship mgmt, Risk mgmt, Service financial mgmt, Strategy mgmt, Supplier mgmt, Workforce & talent mgmt |
| **Services (17)** | Availability, Business analysis, Capacity & performance, **Change enablement**, **Incident mgmt**, IT asset mgmt, Monitoring & event mgmt, **Problem mgmt**, Release mgmt, **Service catalog mgmt**, Service config mgmt, Service continuity, Service design, **Service desk**, **Service level mgmt (SLA/SLO)**, Service request mgmt, Service validation & testing |
| **Technique (3)** | Deployment mgmt, Infrastructure & platform, Software dev & mgmt |

**Pratiques prioritaires pour Maria en gras** : Change enablement, Incident mgmt, Problem mgmt, Service catalog, Service desk, Service level mgmt.

## Checklist Maria

- [ ] Catalogue de services defini (services Central, apps standalone, MiyuCloud)
- [ ] Gestion des incidents structuree (detection, escalade, resolution)
- [ ] Change enablement en place (gates MIP = change approval)
- [ ] Amelioration continue active (retros P6, boucle MIP si refus P5)
- [ ] SLAs/SLOs definis pour les services critiques
- [ ] Knowledge management alimente (memoire MIP, CLAUDE.md)
- [ ] Registre de problemes (causes racines des bugs recurrents)
- [ ] Monitoring des services en production (Hugo)
- [ ] Catalogue a jour quand un nouveau service est ajoute

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| ITIL = bureaucratie lourde | Appliquer le principe "Keep it simple and practical" |
| Ignorer les 4 dimensions | Couvrir personnes, techno, fournisseurs ET processus |
| Incident sans problem management | Traiter les causes racines, pas seulement les symptomes |
| Catalogue obsolete | Mettre a jour le catalogue a chaque ajout/retrait de service |
| Changements sans evaluation | Tout changement passe par change enablement (gate) |
| Amelioration sans metriques | Mesurer avant et apres chaque amelioration |

## Application Miyukini

| Concept ITIL 4 | Application MIP v2 |
|----------------|---------------------|
| Service catalog | `OFFICIAL_CATALOG` dans `apps/central/src/state.rs` |
| Incident management | Bugs critiques = frein d'urgence MIP |
| Change enablement | Gates MIP (P0→P3, P3→P4, P4→P5) |
| Continual improvement | Boucle MIP (refuse P5 → retour P0), rapport P6 |
| SLA/SLO | Metriques DORA adaptees (Denis + Hugo) |
| Knowledge management | `MEMORY.md`, `.mip/reports/`, capitalisation P6 |
| Problem management | `memory/mip-antipatterns.md` (causes racines) |
| Release management | Git tags + merge main en P5 (Denis) |
| Service desk | Questionnaire satisfaction P5 |

---

*Sources : ITIL 4 Foundation (AXELOS, 2019), ITIL 4 Managing Professional, ITIL 4 Practice Guides (PeopleCert)*
