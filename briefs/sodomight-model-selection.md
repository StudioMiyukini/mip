# Recommandation Modeles Sodomight/MGE -- Condense
<!-- Refactorise le 2026-03-03. Original: 417 lignes -> 103 lignes -->

> **Agent** : Jean | **Phase** : P0 T4 | **Date** : 2026-03-02
> **Classe** : T5 (34 crates, 53k lignes Rust)
> **Budget estime** : 1M-2M tokens | **Economie vs all-Opus** : ~70%

---

## Modeles disponibles

| Modele | Cout relatif | Usage |
|--------|-------------|-------|
| Opus 4.6 | 25x | Archi, code critique GPU, audit cross-crates |
| Sonnet 4.6 | 5x | Implementation, tests, coordination, doc |
| Haiku 4.5 | 1x | Boilerplate, formatage, spot-checks mecaniques |

---

## Matrice agent x phase -> modele

| Agent | P0 | P3 | P4 | P5 | P6 |
|-------|----|----|----|----|-----|
| Maria | Sonnet | -- | -- | Haiku | -- |
| Fabrice | Sonnet+Haiku | -- | -- | -- | -- |
| Denis | **Opus** (T4,T7) | Sonnet | Sonnet | Sonnet | -- |
| Francois | Sonnet | **Opus** (kernel) / Sonnet (ARPG) / Haiku (boilerplate) | -- | -- | -- |
| Lise | Sonnet | **Opus** (bitmap font) / Sonnet (UI) / Haiku (assets) | -- | -- | -- |
| Arianne | Sonnet | -- | -- | -- | Sonnet+Haiku |
| George | -- | -- | **Opus** (audit) / Sonnet (tests) | -- | -- |
| Victor | Sonnet | Haiku | Sonnet | -- | -- |
| Hugo | Sonnet+Haiku | -- | Sonnet | -- | -- |
| Jean | **Opus** (T4) / Sonnet | Haiku | Sonnet | -- | Haiku |

---

## 5 assignations Opus (14% des slots)

| Assignation | Justification | Risque si downgrade |
|------------|---------------|---------------------|
| Denis P0 T4+T7 | Archi + plan 34 crates | Plan incomplet, boucles P3 |
| Francois P3 kernel/engine | wgpu, ECS, camera, pathfinding | Bugs GPU subtils, debug couteux |
| Lise P3 bitmap font v1 | Pipeline GPU + texte rendu | Blocage DELTA-U01 |
| George P4 audit | 53k lignes cross-review | Defauts latents non detectes |
| Jean P0 T4 | Analyse multi-dimensionnelle (ce doc) | Mauvais calibrage |

---

## Budget par phase

| Phase | Tokens | % |
|-------|--------|---|
| P0 | 210 000 | 18% |
| P3 | 670 000 | 56% |
| P4 | 215 000 | 18% |
| P5 | 50 000 | 4% |
| P6 | 40 000 | 3% |
| **TOTAL** | **~1 185 000** | 100% |

### Repartition par modele

| Modele | % tokens | Cout pondere |
|--------|---------|-------------|
| Opus | 15% (178k) | 4 450 u |
| Sonnet | 75% (889k) | 4 445 u |
| Haiku | 10% (118k) | 118 u |
| **TOTAL** | 100% | **9 013 u** |

Comparaison : All-Opus = 29 625 u (+229%), All-Sonnet = 5 925 u (-34% mais risque archi/audit).

---

## Top 5 points d'economie

| # | Economie | Gain |
|---|----------|------|
| E1 | Haiku pour boilerplate Rust (serde, config, content) | 15-20% sur P3 Francois |
| E2 | Haiku pour assets/theming (Lise) | 30% sur P3 Lise assets |
| E3 | Chargement selectif fichiers memoire par agent | 10-15% tous agents |
| E4 | Index + drill-down sur 34 crates (pas lire 53k lignes) | 20-30% lectures code |
| E5 | Spot-checks Jean/Victor en Haiku | 5% sur P3 |

---

## Regles de bascule dynamique (P3)

| Condition | Action |
|-----------|--------|
| >3 auto-corrections sur une tache Sonnet | Upgrade Opus |
| Tokens/ligne > 850 sur un agent Sonnet | Investiguer + decision Denis |
| Haiku echoue compilation >2 fois | Basculer Sonnet |
| Opus produit <200 tokens/ligne | Envisager downgrade Sonnet |
| Context window compression >2 fois | Reduire fichiers charges, index+drill-down |

---

> Autorite : CONSULTATIF. Denis + Maria valident. Revision apres P0 T7.
