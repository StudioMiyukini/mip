<!-- @id cert.maria.psm -->
<!-- @do provide_psm_reference_knowledge -->
<!-- @role agile_management -->
<!-- @layer reference -->
<!-- @human Referentiel PSM pour Maria -->

# PSM (Professional Scrum Master) — Referentiel Maria

> **TL;DR** : Certification Scrum.org validant la maitrise du framework Scrum et du role de Scrum Master.
> Couvre le Scrum Guide 2020 (3 roles, 5 events, 3 artifacts), empirisme et auto-gestion.
> Impact Miyukini : structure les iterations MIP P3 (sprints TDD), ceremonies, et suivi velocity.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | Scrum.org |
| Obligation | Volontaire (reference pour les equipes Scrum) |
| Validite | A vie (pas de renouvellement) |
| Prerequis | Aucun (PSM I), PSM I obtenu (PSM II), PSM II obtenu (PSM III) |

## Domaine d'application

Framework leger pour gerer et livrer des produits complexes. Scrum repose sur l'empirisme (transparence, inspection, adaptation) et la confiance en des equipes auto-gerees. Applicable a tout domaine ou l'incertitude est elevee.

## Piliers et valeurs Scrum

| Pilier | Description |
|--------|-------------|
| Transparence | Processus et travail visibles par tous (artefacts, Definition of Done) |
| Inspection | Verification reguliere des artefacts et de la progression (events) |
| Adaptation | Ajustement immediat si deviation detectee |

| Valeur | Application |
|--------|-------------|
| Courage | Aborder les problemes difficiles, defendre la qualite |
| Focus | Concentration sur le Sprint Goal et le travail a haute valeur |
| Commitment | Engagement envers les objectifs de l'equipe |
| Respect | Reconnaitre les competences et l'autonomie de chacun |
| Openness | Transparence sur le travail, les defis, les obstacles |

## Scrum Framework — Roles, Events, Artifacts

### 3 Roles (Scrum Team)

| Role | Responsabilite | Cle |
|------|---------------|-----|
| Product Owner | Maximiser la valeur du produit, gerer le Product Backlog | Un seul PO, decisions finales sur le backlog |
| Scrum Master | Faciliter Scrum, lever les impediments, coacher | Servant-leader, pas chef de projet |
| Developers | Creer un Increment utilisable a chaque Sprint | Auto-geres, cross-fonctionnels |

### 5 Events

| Event | Timebox | But | Participants |
|-------|---------|-----|-------------|
| Sprint | 1-4 semaines | Conteneur pour tous les events, livrer un Increment | Toute l'equipe |
| Sprint Planning | 8h max (sprint 1 mois) | Definir Sprint Goal + selectionner items + plan | Toute l'equipe |
| Daily Scrum | 15 min | Inspecter progression vers Sprint Goal, adapter plan | Developers |
| Sprint Review | 4h max (sprint 1 mois) | Inspecter l'Increment, adapter le Product Backlog | Equipe + stakeholders |
| Sprint Retrospective | 3h max (sprint 1 mois) | Inspecter le Sprint, planifier ameliorations | Toute l'equipe |

### 3 Artifacts + Commitments

| Artifact | Commitment | Description |
|----------|------------|-------------|
| Product Backlog | Product Goal | Liste ordonnee de tout ce qui pourrait etre necessaire |
| Sprint Backlog | Sprint Goal | Items selectionnes + plan pour l'Increment |
| Increment | Definition of Done | Somme des items Done, utilisable, potentiellement livrable |

## Checklist Maria

- [ ] Sprint Planning tenu au debut de chaque sprint (Sprint Goal defini)
- [ ] Daily Scrum quotidien (15 min max, focus sur le Sprint Goal)
- [ ] Sprint Review a chaque fin de sprint (demo Increment + feedback)
- [ ] Sprint Retrospective tenue (au moins 1 action d'amelioration par sprint)
- [ ] Product Backlog raffine regulierement (PO + Developers)
- [ ] Velocity mesuree et utilisee pour la planification (tendance, pas objectif)
- [ ] Definition of Done explicite, partagee et respectee
- [ ] Impediments identifies, tracks, et resolus rapidement
- [ ] Sprint Goal clair et distinct de la liste de taches
- [ ] Aucun changement de scope pendant un Sprint sans accord PO

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Scrum Master = chef de projet | SM facilite et coache, ne dirige pas l'equipe |
| Daily = reporting status a un manager | Daily = sync Developers entre eux vers le Sprint Goal |
| Pas de Sprint Goal | Toujours definir un objectif coherent pour le Sprint |
| Sprint Review = demo sans feedback | Review = inspection + adaptation du Product Backlog |
| Retro sans actions concretes | Au moins 1 action d'amelioration dans le Sprint Backlog suivant |
| Velocity comme engagement (contrat) | Velocity = outil de prevision, pas de performance |
| Definition of Done trop faible | DoD doit inclure tests, qualite, documentation necessaire |

## Application Miyukini

| Concept Scrum | Application MIP v2 |
|---------------|---------------------|
| Sprint | Phase P3 (decoupee en taches TDD iteratives) |
| Sprint Planning | P0 Temps 7 (Denis) — plan exhaustif |
| Daily Scrum | Annonces TodoWrite + checkpoints /5 taches |
| Sprint Review | P5 — test humain + questionnaire satisfaction |
| Sprint Retrospective | P6 — rapport final + capitalisation (Arianne) |
| Product Backlog | Brief P0 + plan de taches ordonnees |
| Sprint Goal | Objectif de la feature branch `feat/<slug>` |
| Definition of Done | Gate P4 : 0 defaut bloquant + tests + clippy + audit |
| Scrum Master (Maria) | Facilite MIP, leve les blocages, coordonne agents |
| Velocity | Metriques `.mip/metrics/` (taches/session, temps par phase) |

---

*Sources : The Scrum Guide 2020 (Schwaber & Sutherland), Scrum.org PSM I Subject Areas, Nexus Guide (Scrum@Scale)*
