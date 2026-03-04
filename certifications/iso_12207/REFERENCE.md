<!-- @id cert.denis.iso_12207 -->
<!-- @do provide_iso12207_reference_knowledge -->
<!-- @role process_management -->
<!-- @layer reference -->
<!-- @human Referentiel ISO/IEC 12207 pour Denis -->

# ISO/IEC/IEEE 12207:2017 — Referentiel Denis

> **TL;DR** : Norme internationale definissant les processus du cycle de vie logiciel. Organise 30 processus en 4 groupes (Agreement, Organizational, Technical Management, Technical). Reference Denis pour structurer et auditer les processus MIP du projet Miyukini.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ISO/IEC JTC 1/SC 7 + IEEE |
| Obligation | Volontaire (reference standard pour les processus logiciels) |
| Validite | Permanente (derniere revision : 2017) |
| Prerequis | Aucun |

## Domaine d'application

Cadre de processus applicable a l'acquisition, la fourniture, le developpement, l'exploitation et la maintenance de systemes logiciels. S'applique a tout type de projet, taille d'organisation et modele de cycle de vie (agile, cascade, iteratif).

## Groupes de processus

### Agreement Processes (2 processus)

| Ref | Processus | Objectif |
|-----|-----------|----------|
| 6.1.1 | Acquisition | Obtenir un produit/service conforme aux besoins |
| 6.1.2 | Supply | Fournir un produit/service conforme au contrat |

### Organizational Project-Enabling Processes (5 processus)

| Ref | Processus | Objectif |
|-----|-----------|----------|
| 6.2.1 | Life Cycle Model Management | Definir et maintenir les modeles de cycle de vie |
| 6.2.2 | Infrastructure Management | Fournir l'infrastructure necessaire aux processus |
| 6.2.3 | Portfolio Management | Gerer le portefeuille de projets |
| 6.2.4 | Human Resource Management | Fournir les competences necessaires |
| 6.2.5 | Quality Management | Assurer la qualite des produits et processus |

### Technical Management Processes (8 processus)

| Ref | Processus | Objectif |
|-----|-----------|----------|
| 6.3.1 | Project Planning | Planifier le projet (scope, calendrier, ressources) |
| 6.3.2 | Project Assessment & Control | Evaluer et controler l'avancement |
| 6.3.3 | Decision Management | Prendre des decisions tracees et justifiees |
| 6.3.4 | Risk Management | Identifier, analyser, traiter les risques |
| 6.3.5 | Configuration Management | Gerer les versions et les changements |
| 6.3.6 | Information Management | Gerer les informations du projet |
| 6.3.7 | Measurement | Mesurer les processus et produits |
| 6.3.8 | Quality Assurance | Verifier la conformite aux plans et standards |

### Technical Processes (15 processus)

| Ref | Processus | Objectif |
|-----|-----------|----------|
| 6.4.1 | Business/Mission Analysis | Definir le probleme et les besoins metier |
| 6.4.2 | Stakeholder Needs Definition | Identifier les besoins des parties prenantes |
| 6.4.3 | System Requirements Definition | Transformer les besoins en exigences systeme |
| 6.4.4 | System Architecture Definition | Definir l'architecture solution |
| 6.4.5 | Design Definition | Concevoir les composants du systeme |
| 6.4.6 | System Analysis | Analyser les alternatives de conception |
| 6.4.7 | Implementation | Realiser les composants logiciels |
| 6.4.8 | Integration | Assembler les composants |
| 6.4.9 | Verification | Confirmer que le produit respecte les specifications |
| 6.4.10 | Transition | Deployer le produit dans l'environnement operationnel |
| 6.4.11 | Validation | Confirmer que le produit repond aux besoins |
| 6.4.12 | Operation | Exploiter le produit dans son environnement |
| 6.4.13 | Maintenance | Maintenir le produit en service |
| 6.4.14 | Disposal | Retirer le produit du service |

## Checklist Denis

- [ ] Processus pertinents selectionnes et adaptes (tailoring) selon la classe de tache (T1-T5)
- [ ] Tailoring documente : justification des processus inclus/exclus
- [ ] Configuration Management : baselines Git, tags, branches de feature
- [ ] Project Planning (6.3.1) : couvert par P0 (10 temps) + plan Denis
- [ ] Risk Management (6.3.4) : Maria P0 + Victor securite
- [ ] Verification (6.4.9) : cargo test + clippy + George P4
- [ ] Validation (6.4.11) : test humain P5 + questionnaire satisfaction
- [ ] Quality Assurance (6.3.8) : George audit P4, Denis checkpoints P3
- [ ] Measurement (6.3.7) : metriques `.mip/metrics/` collectees en continu
- [ ] Conformite evaluee en P4 pour les taches T3+

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Appliquer tous les processus a toute tache | Tailoring obligatoire : T1-T2 = subset minimal, T4-T5 = complet |
| Documenter sans executer | Chaque processus selectionne doit avoir des preuves d'execution |
| Pas de tracabilite besoins → validation | Chainer 6.4.2 → 6.4.3 → 6.4.9 → 6.4.11 avec artefacts traces |
| Ignorer la maintenance (6.4.13) | Prevoir maintenabilite des le design (modularity, testability) |
| Processus figes (pas de tailoring) | Revoir le tailoring a chaque changement de contexte projet |

## Application Miyukini

| Processus ISO 12207 | Equivalent MIP v2 |
|---------------------|-------------------|
| Project Planning (6.3.1) | P0 10 temps (Maria → Denis plan) |
| Project Assessment (6.3.2) | Denis checkpoints /5 taches P3, George P4 |
| Risk Management (6.3.4) | Maria P0 risques + Victor securite |
| Configuration Management (6.3.5) | Git workflow, feature branches, tags |
| Quality Assurance (6.3.8) | George audit P4, clippy pedantic, cargo test |
| Measurement (6.3.7) | `.mip/metrics/` horodatage + compteurs |
| Implementation (6.4.7) | Francois P3 back + Lise P3 front (TDD) |
| Integration (6.4.8) | Denis P4 integration + smoke test |
| Verification (6.4.9) | cargo test + cargo clippy + audits |
| Validation (6.4.11) | P5 test humain + questionnaire satisfaction |

---

*Sources : ISO/IEC/IEEE 12207:2017, ISO/IEC/IEEE 15288:2023 (System Life Cycle Processes), ISO/IEC 33001 (Process Assessment)*
