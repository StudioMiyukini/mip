<!-- @id cert.denis.togaf -->
<!-- @do provide_togaf_reference_knowledge -->
<!-- @role architecture -->
<!-- @layer reference -->
<!-- @human Referentiel TOGAF pour Denis -->

# TOGAF 10 — Referentiel Denis

> **TL;DR** : Framework d'architecture d'entreprise de l'Open Group. Fournit l'ADM (Architecture Development Method) en 10 phases pour concevoir, planifier et gouverner l'architecture. Indispensable pour Denis dans le cadrage et la gouvernance des decisions architecturales Miyukini.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | The Open Group |
| Obligation | Volontaire (standard de facto en architecture d'entreprise) |
| Validite | Certification individuelle a vie (TOGAF Certified / Practitioner) |
| Prerequis | Aucun (Foundation), Foundation pour Certified |

## Domaine d'application

Framework generique pour developper, maintenir et gouverner l'architecture d'entreprise. Couvre 4 domaines : Business, Data, Application, Technology. Adaptable a toute taille d'organisation.

## Exigences cles — ADM (Architecture Development Method)

| Phase | Nom | Objectif | Livrables |
|-------|-----|----------|-----------|
| Preliminary | Preparation | Definir principes, framework, outils, gouvernance | Architecture Principles, Org Model |
| A | Architecture Vision | Cadrage, parties prenantes, valeur metier | Statement of Architecture Work, Vision |
| B | Business Architecture | Modeliser les processus et fonctions metier | Business Architecture Document |
| C | Information Systems Architecture | Data + Application architectures | Data/Application Architecture Docs |
| D | Technology Architecture | Infrastructure, plateformes, reseau | Technology Architecture Document |
| E | Opportunities & Solutions | Identifier projets, paquets de travail, roadmap | Implementation Factor Assessment |
| F | Migration Planning | Plan de migration, priorisation projets | Migration Plan, Transition Architectures |
| G | Implementation Governance | Superviser la conformite de l'implementation | Architecture Contract, Compliance Review |
| H | Architecture Change Management | Gerer les changements post-implementation | Change Requests, Updated Architecture |
| RM | Requirements Management | Gerer les exigences tout au long du cycle | Requirements Repository |

## Architecture Content Framework

| Composant | Description |
|-----------|-------------|
| Architecture Repository | Stockage centralise de tous les artefacts architecture |
| Enterprise Continuum | Classification des actifs (Foundation → Common → Industry → Org) |
| Architecture Building Blocks (ABBs) | Composants logiques reutilisables |
| Solution Building Blocks (SBBs) | Composants physiques implementables |
| Stakeholder Map | Cartographie parties prenantes, concerns, viewpoints |
| Architecture Views | Vues specifiques a chaque partie prenante (Catalogs, Matrices, Diagrams) |

## Architecture Governance

| Composant | Description |
|-----------|-------------|
| Architecture Board | Comite de gouvernance supervisant les decisions et la conformite |
| Architecture Contract | Accord formel entre equipes sur les contraintes et interfaces |
| Architecture Compliance Review | Verification que l'implementation respecte l'architecture cible |
| Dispensation | Derogation formelle documentee si ecart a l'architecture |
| Architecture Principles | Regles directrices (ex: LOI-1 a LOI-8 Miyukini = principes architecture) |

## Checklist Denis

- [ ] Architecture Vision documentee avec scope, principes, parties prenantes
- [ ] Gap Analysis realise (baseline vs target architecture, 4 domaines)
- [ ] Building Blocks identifies (ABBs logiques, SBBs implementation)
- [ ] Migration Planning : transitions, priorisation, dependances
- [ ] Architecture Governance : contrats, revues de conformite, change management
- [ ] Stakeholder Map : concerns identifies, viewpoints selectionnes
- [ ] Architecture Repository a jour (decisions, patterns, standards)
- [ ] Compliance Review apres chaque livraison majeure (P4)
- [ ] Requirements Management : tracabilite exigences → architecture → implementation
- [ ] Architecture Principles : LOI-1 a LOI-8 documentes et respectes
- [ ] Transition Architectures definies pour les chantiers T4-T5 multi-sprint

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Ivory Tower Architecture (architecture deconnectee du dev) | Impliquer Francois/Lise des Phase B-D, valider avec code reel |
| Sauter Phase A (pas de vision) | Toujours cadrer vision + valeur metier avant design technique |
| Ignorer les parties prenantes | Mapper concerns → viewpoints des P0 Temps 1 |
| Architecture statique (jamais mise a jour) | Phase H : change management continu, revoir a chaque T4-T5 |
| Over-engineering (tout modeliser) | Adapter la profondeur au niveau de risque (T1-T2 : leger, T4-T5 : complet) |
| Pas de gap analysis | Toujours comparer etat actuel vs cible avant plan migration |

## Application Miyukini

| Concept TOGAF | Application projet |
|---------------|-------------------|
| ADM Phase A (Vision) | P0 Temps 1-2 : exploration + ideation Maria/Lise |
| ADM Phase B-D (Architecture) | P0 Temps 4-6 : inventaire Denis, spec Francois, plan Denis |
| ADM Phase E-F (Migration) | P0 Temps 7 : plan exhaustif + guide implementation Denis |
| ADM Phase G (Governance) | P3 checkpoints Denis /5 taches, P4 integration |
| Architecture Repository | `.mip/` artefacts + `CLAUDE.md` + `memory/` |
| Building Blocks | Crates Rust = SBBs, Strates COG = ABBs logiques |
| Enterprise Continuum | Pyramide COG Strates 0-9 (Foundation → Cores → Outils → Operateurs) |
| Stakeholder Map | Agents MIP = parties prenantes techniques (roles definis CLAUDE.md) |
| Compliance Review | George P4 audit + Denis P5 validation + Arianne P6 capitalisation |

---

*Sources : TOGAF Standard 10th Edition (The Open Group), TOGAF Library, TOGAF ADM Guidelines & Techniques*
