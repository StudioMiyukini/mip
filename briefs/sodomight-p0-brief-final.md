# Brief Final P0 -- Sodomight MVP
<!-- @id: sodomight-p0-brief-final @do: brief-final @role: chef-projet @layer: 0 @human: miyuk -->

**Agent** : Maria | **Phase** : P0 T10 | **Date** : 2026-03-03 | **Classe** : T5
**Statut** : EN ATTENTE D'APPROBATION (v2 -- modularise, MASS explicite)

## TL;DR

- Sodomight : clone D2 LoD en Rust sur MGE (34 crates, 42 704 lignes, 611 tests, 62% complet).
- Scope : **Sprint 0-3** — single-player Acte 1, Necromancer, **197 taches**.
- **MASS** : DAG par sprint, vagues paralleles (Loi 9), fichiers disjoints, merge Denis.
- Budget : 1.28M tokens (Opus 11% / Sonnet 67% / Haiku 22%).
- Faisabilite 138/160 (86.3%). Efficience 7.8/10. **0 non-conformite bloquante**.
- 4 corrections Arianne integrees (NC-01..NC-04). 25/25 items SEC assignes.

---

## Etat actuel

| Metrique | Valeur |
|----------|--------|
| Lignes Rust | 42 704 (34 crates) |
| Tests | 611 (2 KO trivials) |
| Score securite | 42/100 |
| Gaps majeurs | 6 (GAP-01..06) |
| CI/CD | ABSENT |

## Architecture MASS

Chaque sprint est decrit dans un fichier dedie avec :
- **DAG ASCII** des dependances intra-sprint
- **Vagues d'execution** : taches, agents, mode (parallele/sequentiel), fichiers touches, conflits potentiels
- **Strategie de merge** : Denis toutes les 5 taches, spot-checks Victor (SEC) et Jean (tokens)
- **Modeles IA par tache** : Opus (kernel/GPU/reseau), Sonnet (gameplay standard), Haiku (boilerplate)

## Plan d'execution (197 taches, 4 sprints scope)

| Sprint | Livrable | Taches | Vagues | Duree |
|--------|----------|--------|--------|-------|
| **S0** Fondations | Clic-move sur map iso | 22 | 6 | 3-5j |
| **S1** Combat | Necro jouable, combat D2, loot, HUD, save | 50 | 8 | 5-8j |
| **S2** Progression | Skill tree 30, inventaire, Rare/Unique, TOML | 40 | 9 | 5-8j |
| **S3** Acte 1 | 25+ zones, 6 quetes, Andariel, runewords, audio | 50 | 5 | 8-12j |
| *S4 Multi* | *TCP, serveur autoritatif (projet MIP separe)* | *20* | *4* | *--* |
| *S5+ Contenu* | *Classes 2-7, Actes 2-5 (projet MIP separe)* | *15+* | *--* | *--* |

**Duree S0-S3** : 21-33 jours ouvres. **Premier livrable testable** : S0 (3-5j).

## Budget tokens

| Central | Optimiste | Pessimiste | Mix modeles |
|---------|-----------|------------|-------------|
| **1 280 000** | 1 050 000 | 1 850 000 | Opus 11% / Sonnet 67% / Haiku 22% |

## Corrections Arianne integrees

| NC | Probleme | Resolution |
|----|----------|------------|
| NC-01 | GAP-05 absent | 5 taches TASK-149..153 dans S3 V3.2 |
| NC-02 | 10 SEC sans tache | 25/25 SEC assignes (SEC-BATCH-MED S3, SEC-BATCH-LOW S5) |
| NC-03 | V2.1 conflit AP-08 | V2.1 sequentialise (a→b→c→d sur def.rs) |
| NC-04 | Discrepance compteurs | 42 704 lignes, 611 tests, 197 taches |

## Risques top 5

| # | Risque | P | I | Mitigation |
|---|--------|---|---|------------|
| R-02 | winit 0.30 migration | F | H | Pseudo-code fourni, Opus |
| R-01 | ECS Any downcasting | M | H | Bench S0 |
| R-05 | Data hardcodee | H | M | TOML S2 GAP-03 |
| R-07 | RNG predictible | H | C | SEC-01 debut S1 |
| R-11 | Scope creep | H | H | S4-5 = projets MIP separes |

Score securite : 42/100 → cible **72/100** apres S3 (25 items SEC integres S1-S3).

## Artefacts P0 (24 fichiers, tous <=400 lignes)

### References D2 (8 fichiers)

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `mge/docs/sodomight/ref/REF-01-GameDesign-Loop-Progression.md` | 356 | XP, progression, farming, difficultes |
| `REF-02a-Combat-Formulas.md` | 259 | Formules CTH, degats, breakpoints |
| `REF-02b-Classes-Skills.md` | 400 | 7 classes, 210 skills |
| `REF-03-Items-Loot-Runewords.md` | 399 | Items, loot, runes, runewords, crafting |
| `REF-04a-World-Zones.md` | 227 | Zones, area levels, waypoints, quetes |
| `REF-04b-Monsters-Multiplayer.md` | 357 | Monstres, boss, AI, multiplayer |
| `REF-05a-UI-HUD.md` | 150 | Layout HUD, menus, controles |
| `REF-05b-Render-Audio-OpenD2.md` | 386 | Rendu, audio, projets open source D2 |

### Plan d'execution (8 fichiers)

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `.mip/plans/sodomight-plan-index.md` | 255 | Vue d'ensemble, DAGs, risques, annexes |
| `sodomight-plan-S0.md` | 305 | Sprint 0 MASS : 22 taches, 6 vagues |
| `sodomight-plan-S1-part1.md` | 261 | Sprint 1 MASS (1/2) : V1.1-V1.4 |
| `sodomight-plan-S1-part2.md` | 206 | Sprint 1 MASS (2/2) : V1.5-V1.8 |
| `sodomight-plan-S2.md` | 311 | Sprint 2 MASS : 40 taches, 9 vagues |
| `sodomight-plan-S3-part1.md` | 306 | Sprint 3 MASS (1/2) : V3.1-V3.2 |
| `sodomight-plan-S3-part2.md` | 127 | Sprint 3 MASS (2/2) : V3.3-V3.5 |
| `sodomight-plan-S4-S5.md` | 199 | Sprint 4-5 : multi, contenu (ebauche) |

### Artefacts techniques (8 fichiers)

| Fichier | Lignes |
|---------|--------|
| `.mip/briefs/sodomight-tech-inventory.md` | 135 |
| `.mip/briefs/sodomight-infra-eval.md` | 105 |
| `.mip/briefs/sodomight-model-selection.md` | 97 |
| `.mip/briefs/sodomight-security-analysis.md` | 123 |
| `.mip/specs/sodomight-tech-spec.md` | 177 |
| `.mip/audits/sodomight-p0-audit.md` | 69 |
| `.mip/audits/2026-03-03-sodomight-efficiency-audit.md` | 98 |
| `.mip/briefs/sodomight-p0-brief-final.md` | ce doc |

---

## DECISION REQUISE

### Mode d'autonomie ? (FULL / BIG_STEPS / GUIDED)

- **FULL** : Autopilot complet. Frein d'urgence si bug apres 2 auto-corrections.
- **BIG_STEPS** : Gates entre phases (P3→P4, P4→P5).
- **GUIDED** : Gate par etape macro.

---

*Maria (Chef de Projet) -- MIP v2 P0 T10 v2 -- 2026-03-03*
