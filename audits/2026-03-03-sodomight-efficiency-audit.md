# Audit Efficience Sodomight -- P0 T8 -- Condense
<!-- Refactorise le 2026-03-03. Original: 436 lignes -> ~85 lignes -->
<!-- @id: sodomight-efficiency-audit @do: efficiency-audit @role: efficience-ia @layer: 0 @human: miyuk -->

**Agent** : Jean | **Phase** : P0 T8 | **Date** : 2026-03-03 | **Classe** : T5
**Score efficience : 7.8/10**

## TL;DR

- Budget revise 1.65M (fourchette 1.3M-2.2M), +37.5% vs initial (192 taches vs 24 estimees).
- 14 economies identifiees -> gain 370K tokens (22.4%) -> budget ajuste **1.28M**.
- Strategie modeles : Opus 11% / Sonnet 67% / Haiku 22%.
- S3 le plus couteux (370K) : maximiser Haiku sur TOML/bestiary/menus.
- KPIs : 8 500 tokens/tache, 450 tokens/ligne, seuil alerte 1.5x.

---

## Budget par sprint

| Sprint | Taches | Tokens | % | Opus:Sonnet:Haiku |
|--------|--------|--------|---|-------------------|
| S0 Fondations | 22 | 185K | 11% | 25:55:20 |
| S1 Combat | 50 | 420K | 25% | 15:70:15 |
| S2 Progression | 40 | 350K | 21% | 10:65:25 |
| S3 Acte 1 | 45 | 370K | 22% | 5:50:45 |
| S4 Multi | 20 | 220K | 13% | 30:60:10 |
| S5+ Contenu | 15+ | 105K | 6% | 5:40:55 |
| **TOTAL** | **192+** | **1.65M** | | **Opus 12% / Sonnet 73% / Haiku 15%** |

## Fourchette apres economies

| Scenario | Avant | Apres economies | Delta |
|----------|-------|-----------------|-------|
| Optimiste | 1.3M | **1.05M** | -19% |
| Central | 1.65M | **1.28M** | -22% |
| Pessimiste | 2.2M | **1.85M** | -16% |

## Assignations Opus (7 sur 192+ taches = 3.6%)

| Tache(s) | Sprint | Raison |
|----------|--------|--------|
| 007, 008 (winit 0.30) | S0 | Boot sequence GPU critique |
| 009 (pipeline rendu) | S0 | Premiere frame visible |
| 045 (integration combat ECS) | S1 | Architecture systeme 6 crates |
| 124 (procgen) | S3 | Raisonnement algorithmique |
| 166 (TCP transport) | S4 | Code tokio, concurrence |
| 167 (serveur autoritatif) | S4 | Boucle 25Hz, coeur multi |
| 169 (sync entites) | S4 | Interpolation temps reel |

## Top 10 economies (sur 14)

| # | Economie | Sprint | Gain |
|---|----------|--------|------|
| E-10 | Index+drill-down 34 crates (charger 25% de fichiers en moins) | Tous | 80K |
| E-08 | Classes 2-7 en Haiku (pattern Sorceress replique) | S5+ | 50K |
| E-05 | Zones TOML en Haiku (25 fichiers repetitifs) | S3 | 40K |
| E-11 | TL;DR sur artefacts P0 (eviter 5000l redondantes/sprint) | S1-S5 | 35K |
| E-04 | Bestiary Act 1 en Haiku (15 familles) | S3 | 30K |
| E-03 | Skills Necro arbres 2-3 en pattern | S2 | 25K |
| E-12 | Cache formules D2 (<100l vs 7000l docs) | S1-S3 | 20K |
| E-07 | Quetes 4-6 en Haiku (pattern replique) | S3 | 18K |
| E-13 | Fusionner TASK-081+082+083 (2 context switches) | S2 | 15K |
| E-01 | Validations crates S0 en Haiku | S0 | 15K |
| | **Synthese** : Downgrade 208K + Chargement selectif 135K + Fusions 27K | | **370K (22.4%)** |

## KPIs de suivi

| KPI | Cible | Alerte (1.5x) | Critique (2.5x) |
|-----|-------|---------------|-----------------|
| Tokens/tache | 8 500 | >12 750 | >21 250 |
| Tokens/ligne | 450 | >675 | >1 125 |
| Taches/heure | 2.5 | <1.7 | <1.0 |
| Auto-corrections/tache | <2 | >3 | >5 |

**Faux positifs** : S4 tokens/tache >11K (normal, networking), MASS 4 agents (budget x4), George P4 >100K (lecture 53k lignes), TOML migration >20K (volume sortie).

## Score efficience

| Critere | Score |
|---------|-------|
| Reutilisation code existant | 9/10 |
| Mix modeles | 8/10 |
| Chargement selectif | 7/10 |
| Parallelisation | 8/10 |
| Detectabilite fuites | 8/10 |
| Budget global | 7/10 |
| **GLOBAL** | **7.8/10** |

## Actions avant P3

1. Creer 4 fichiers compacts ref-d2-* (<100-200l chacun) -- **Jean/Francois, HAUTE**
2. TL;DR manquant sur sodomight-tech-inventory.md -- **Denis, MOYENNE**
3. Valider fusions E-13/E-14 -- **Denis, MOYENNE**
4. Configurer KPIs dans .mip/metrics/ -- **Jean, HAUTE**

---

*Jean (Efficience IA) -- MIP v2 P0 T8 -- 2026-03-03*
