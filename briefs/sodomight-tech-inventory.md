# Inventaire Technique MGE/Sodomight -- Condense
<!-- Refactorise le 2026-03-03. Original: 378 lignes -> 148 lignes -->

> **Agent** : Denis | **Phase** : P0 T4 | **Date** : 2026-03-02
> **Etat** : compile (1 erreur triviale sodomight-client), clippy clean, 611 tests

---

## Tableau recapitulatif -- 34 crates (42 704 lignes)

### Couche 1 -- Kernel (8 311 lignes, 155 tests, moy. 76%)

| Crate | Lignes | Tests | % | Statut |
|-------|--------|-------|---|--------|
| mge-core | 721 | 25 | 80% | Game loop fixe, EventBus, SystemScheduler |
| mge-ecs | 2 150 | 55 | 75% | Archetype SoA, sparse overlay, `Any` downcasting |
| mge-math | 656 | 28 | 90% | Iso 2:1, Vec2, AABB, lerp/smoothstep |
| mge-asset | 3 659 | 21 | 70% | Chargement TOML generique, hot-reload. 0 fichiers TOML data |
| mge-platform | 1 125 | 26 | 65% | Window/GPU wgpu+winit, input mapping |

### Couche 2 -- Engine (13 444 lignes, 225 tests, moy. 63%)

| Crate | Lignes | Tests | % | Statut |
|-------|--------|-------|---|--------|
| mge-render | 6 477 | 128 | 75% | Pipeline instancie wgpu, AnimationController FSM, TextRenderer TTF, 1 test KO |
| mge-audio | 433 | 12 | 50% | Facade kira. Pas de streaming/spatial |
| mge-ui | 1 544 | 0 | 60% | egui 0.28 D2-style HUD complet. **ZERO tests** |
| mge-pathfinding | 635 | 14 | 75% | A* budgete, octile heuristic, NavGrid |
| mge-collision | 698 | 15 | 70% | AABB broadphase SpatialGrid |
| mge-collision-rich | 564 | 16 | 60% | Circle/Capsule/OBB SAT. Non integre |
| mge-script | 996 | 15 | 55% | Rhai sandboxe. Manque map_size/expr_depth |
| mge-net | 527 | 13 | 50% | Codec seulement. Pas de transport TCP |
| mge-save | 1 570 | 12 | 65% | DAL SQLite, migrations, transactions |

### Couche 3 -- ARPG (7 434 lignes, 196 tests, moy. 63%)

| Crate | Lignes | Tests | % | Manque principal |
|-------|--------|-------|---|------------------|
| mge-arpg-world | 883 | 27 | 60% | Generation procedurale |
| mge-arpg-entity | 730 | 28 | 65% | -- |
| mge-arpg-combat | 921 | 21 | 70% | -- |
| mge-arpg-items | 771 | 17 | 65% | Runewords, sockets, sets |
| mge-arpg-stats | 596 | 17 | 70% | -- |
| mge-arpg-skills | 682 | 18 | 65% | Activation, mana, projectiles |
| mge-arpg-loot | 641 | 12 | 65% | -- |
| mge-arpg-ai | 736 | 17 | 60% | Group behavior, boss patterns |
| mge-arpg-quest | 802 | 17 | 60% | NPC dialogue integration |
| mge-arpg-trade | 672 | 22 | 55% | Integration reseau reelle |

### Couche 4 -- Game (9 634 lignes, 119 tests, moy. 47%)

| Crate | Lignes | Tests | % | Statut |
|-------|--------|-------|---|--------|
| sodomight | 2 802 | 49 | 60% | Content hardcode, manque TOML migration |
| sodomight-server | 243 | 11 | 25% | Quasi-vide (config+tick seulement) |
| sodomight-client | 6 589 | 59 | 55% | **NE COMPILE PAS** (line 843 game.rs) |

### Outils (3 881 lignes, 105 tests, moy. 63%)

| Crate | Lignes | Tests | % | Statut |
|-------|--------|-------|---|--------|
| mge-studio | 589 | 18 | 30% | Types data, pas d'UI (Dioxus commente) |
| mge-packer | 346 | 8 | 70% | Shelf packing OK |
| mge-slicer | 306 | 8 | 70% | Frame extraction OK |
| mge-rescale | 216 | 7 | 70% | Nearest-neighbor OK |
| mge-mirror | 180 | 7 | 70% | Horizontal flip OK |
| mge-remap | 198 | 7 | 70% | Palette remap OK |
| mge-anim-pack | 2 046 | 50 | 65% | CLI complet Aseprite+PNG |

---

## Metriques globales

| Metrique | Valeur |
|----------|--------|
| Lignes Rust | ~42 704 |
| Crates | 34 |
| Tests | 611 (2 KO) |
| Clippy | Clean (hors sodomight-client) |
| unwrap() prod | 0 |
| unsafe_code | forbid |
| Documentation design | ~40 000 lignes (22 docs) |
| Assets | 5 877 fichiers (874 Mo) |
| Data TOML | **0** (tout hardcode content.rs) |

---

## Blockers

### CRITIQUE

| # | Blocker | Fix |
|---|---------|-----|
| B1 | sodomight-client ne compile pas (line 843 game.rs, Display trait) | 5 min |
| B2 | 1 test mge-render echoue (floating_text_critical_has_shake) | 5 min |

### IMPORTANT (6 gaps)

| # | Gap | Crate | Effort |
|---|-----|-------|--------|
| B3 | 0 fichiers data TOML (content.rs hardcode) | mge-asset/sodomight | 1-2j |
| B4 | Pas de transport TCP reel | mge-net | 2-3j |
| B5 | Serveur quasi-vide (243 lignes) | sodomight-server | 2-3j |
| B6 | mge-ui ZERO tests | mge-ui | 1j |
| B7 | collision-rich non integre | mge-collision-rich | 1j |
| B8 | mge-studio sans UI | mge-studio | 5+j |

---

## Priorite d'implementation

| Phase | Actions | Effort |
|-------|---------|--------|
| 1 - Deblocage | Fix compile client + test render | 1h |
| 2 - Reseau | mge-net TCP + sodomight-server boucle autoritative | 1 sem |
| 3 - Data | Migrer content.rs vers TOML | 3-5j |
| 4 - Qualite | Tests mge-ui (30+), tests audio, collision-rich integration | 3-5j |
| 5 - ARPG | Runewords, skills activation, boss AI, quest scripting | 2-3 sem |
| 6 - Polish | mge-studio UI, streaming audio, trade reseau | 5+j |

---

## Risques

| Risque | P | I | Mitigation |
|--------|---|---|------------|
| ECS `Any` downcasting fragile | Moy | Haut | ECS type-safe a terme |
| Cross-workspace deps miyuki-ui | Faible | Moy | Freeze version |
| Pas de CI/CD | Haute | Haut | Pipeline Hugo |
| Data hardcodee | Haute | Haut | GAP-03 TOML |
| Assets non compresses (874 Mo) | Faible | Moy | Pipeline mge-packer |

---

> Score global : **~62% completude**. Fondations solides, couche Game fragile. 2 fixes critiques (10 min). Vrai gap = reseau + data pipeline.
