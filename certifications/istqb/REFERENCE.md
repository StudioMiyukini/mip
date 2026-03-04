<!-- @id cert.francois.istqb -->
<!-- @do provide_istqb_reference_knowledge -->
<!-- @role testing -->
<!-- @layer reference -->
<!-- @human Referentiel ISTQB Foundation pour Francois -->

# ISTQB Foundation Level v4.0 — Referentiel Francois

> **TL;DR** : Certification internationale de test logiciel. Couvre les fondamentaux : niveaux de test, types, techniques de conception, gestion des defauts et automatisation. Reference Francois pour structurer les strategies de test TDD en P3 et la verification en P4.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ISTQB (International Software Testing Qualifications Board) |
| Obligation | Volontaire (standard de facto en test logiciel) |
| Validite | A vie (Foundation), recertification pour niveaux avances |
| Prerequis | Aucun (Foundation), Foundation pour Advanced |

## Domaine d'application

Certification individuelle attestant des competences en test logiciel. Couvre les principes, processus, techniques et gestion du test applicables a tout modele de developpement (agile, sequentiel, iteratif).

## 7 principes du test

| # | Principe | Implication |
|---|----------|-------------|
| 1 | Le test montre la presence de defauts | Ne prouve jamais l'absence de defauts |
| 2 | Le test exhaustif est impossible | Prioriser par risque et criticite |
| 3 | Tester tot (shift-left) | Commencer les activites de test des la conception |
| 4 | Regroupement des defauts | 80% des defauts dans 20% des modules (Pareto) |
| 5 | Paradoxe du pesticide | Varier les tests, les memes tests trouvent de moins en moins |
| 6 | Le test depend du contexte | Adapter la strategie au type de systeme |
| 7 | L'absence d'erreur est une illusion | Un logiciel sans defaut peut ne pas repondre au besoin |

## Niveaux de test

| Niveau | Scope | Responsable | Base de test |
|--------|-------|-------------|--------------|
| **Unit** | Fonction, module, crate | Developpeur (Francois) | Code source, design detaille |
| **Integration** | Interfaces entre modules/crates | Developpeur + Denis | Architecture, API specs |
| **System** | Systeme complet | Denis + George | Exigences systeme, specs |
| **Acceptance** | Validation metier | Utilisateur (P5) | Besoins utilisateur, criteres acceptance |

## Types de test

| Type | Objectif | Exemples Miyukini |
|------|----------|-------------------|
| **Functional** | Verifier les fonctions metier | Tests unitaires `#[test]`, integration API |
| **Non-functional** | Performance, securite, usabilite | Benchmarks render, cargo audit, UX review |
| **Structural** | Couverture du code (white-box) | Coverage cargo-tarpaulin, branch coverage |
| **Change-related** | Confirmation fix + regression | Re-run tests apres correction, regression suite |

## Techniques de conception de tests

| Technique | Type | Description | Quand utiliser |
|-----------|------|-------------|----------------|
| Equivalence Partitioning | Black-box | Diviser les inputs en classes d'equivalence | Tout parametre avec plages de valeurs |
| Boundary Value Analysis | Black-box | Tester les limites des classes | Valeurs numeriques, tailles, limites |
| Decision Table | Black-box | Combinaisons de conditions → actions | Logique metier complexe (>2 conditions) |
| State Transition | Black-box | Etats, transitions, evenements | FSM, workflows, animations MGE |
| Use Case Testing | Black-box | Scenarios utilisateur complets | Tests acceptance, parcours E2E |
| Statement/Branch Coverage | White-box | Couvrir les instructions/branches | Tests unitaires, code critique |

## Gestion des defauts

| Champ | Description |
|-------|-------------|
| ID | Identifiant unique (issue tracker) |
| Severite | Critique / Majeur / Mineur / Trivial |
| Priorite | Urgente / Haute / Moyenne / Basse |
| Statut | Nouveau → Ouvert → En cours → Resolu → Ferme → Reouvert |
| Description | Etapes de reproduction, resultat attendu vs obtenu |
| Environnement | OS, version, configuration |

## Checklist Francois

- [ ] Strategie de test definie en P0 (niveaux, types, techniques, couverture cible)
- [ ] Tests unitaires : equivalence partitioning + BVA pour chaque fonction publique
- [ ] Tests integration : interfaces entre crates, API endpoints, serialisation
- [ ] State Transition : FSM animation MGE, workflows UI Dioxus
- [ ] Decision Table : logique metier complexe (loot, combat, permissions)
- [ ] Regression suite : re-executer apres chaque correction
- [ ] Defect tracking : severite + priorite documentes dans les issues
- [ ] Test report P4 : couverture, defauts trouves, defauts ouverts, verdict
- [ ] Automatisation : `cargo test --workspace` + clippy + cargo audit en CI

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Tester uniquement le happy path | Ajouter cas d'erreur, limites, inputs invalides (BVA) |
| Tests fragiles (dependance a l'ordre) | Tests independants, fixtures propres, pas d'etat global |
| Pas de regression apres fix | Tout fix accompagne d'un test de non-regression |
| Ignorer les tests non-fonctionnels | Benchmarks performance + cargo audit securite en P4 |
| Tests sans assertions claires | Chaque test = un scenario precis avec assert explicite |
| Paradoxe du pesticide | Varier les donnees de test, ajouter mutation testing |

## Application Miyukini

| Concept ISTQB | Application projet |
|---------------|-------------------|
| Test tot (shift-left) | TDD en P3 : test ecrit AVANT le code (Francois) |
| Niveaux de test | Unit = `#[test]`, Integration = `cargo test -p`, System = smoke test Denis |
| Acceptance | P5 test humain + questionnaire satisfaction |
| Techniques black-box | BVA pour items/stats MGE, Decision Table pour loot/combat |
| State Transition | AnimationController FSM (mge-render), UI workflows |
| Defect management | GitHub Issues + TodoWrite suivi + P4 audit George |
| Regression | `cargo test --workspace` obligatoire avant chaque push P3 |
| Couverture | Objectif 80% unit, 60% integration (metriques `.mip/metrics/`) |

---

*Sources : ISTQB Certified Tester Foundation Level Syllabus v4.0 (2023), ISTQB Glossary, ISO/IEC/IEEE 29119 (Software Testing)*
