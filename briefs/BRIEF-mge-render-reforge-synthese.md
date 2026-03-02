# P0-T6 : Synthese & Brief Final — Reforge Moteur Graphique MGE

**Agent** : Maria (Chef de Projet)
**Date** : 2026-03-02
**Classification** : T5 — Chantier strategique
**Feature branch** : `feat/mge-render-reforge`

---

## Resume executif

Transformation du pipeline de rendu MGE d'un prototype fonctionnel (13 render passes/frame, 0 animation, sprites individuels, bitmap font procedural, pas d'UI monde) vers un moteur instanced moderne (1-3 draw calls, animation FSM 8 directions, texture array, frustum culling formel, polices TTF/OTF via fontdue, overhead UI style Ragnarok Online). Le chantier inclut aussi un outil d'import PNG avec presets et export Aseprite, et prepare les fondations de scalabilite pour Allumina (500+ entites).

## Decisions validees par l'utilisateur

| Decision | Choix |
|----------|-------|
| Priorite | Parallele : fondations + animation en meme temps |
| Outil animation | CLI `mge-anim-pack` d'abord, editeur `mge-studio` apres |
| Directions | 8 directions D2 (4 rendues S/SW/W/NW + 4 miroirs auto) |

## Chiffres cles du plan

| Metrique | Valeur |
|----------|--------|
| Taches totales | 58 (53 actives + 5 FUTURE Allumina) |
| Sprints | 7 (S0, S1, S1b, S1c, S2, S3, S4) |
| Fichiers touches | 34 |
| Lignes estimees | ~4800 |
| Tests nouveaux | 68+ |
| Checkpoints Denis | 9 |
| Nouveaux crates | 1 (mge-anim-pack) |
| Nouveaux modules | 5 (instanced.rs, animation.rs, culling.rs, text.rs, overhead.rs) |
| Dependance ajoutee | fontdue 0.9 (TTF/OTF rasterizer pur Rust) |

## Structure des sprints

| Sprint | Taches | Agent | Objet | Parallelisable |
|--------|--------|-------|-------|----------------|
| Sprint 0 | 12 | Francois | Pipeline instanced (InstanceData, shader WGSL, TextureArray, batcher, culling) | Oui (avec S1, S2) |
| Sprint 1 | 11 | Francois | Animation FSM, 8 directions, AnimationBank TOML, frame events, normes sprites | Oui (avec S0, S1b, S2) |
| Sprint 1b | 7 | Francois | Polices TTF/OTF (fontdue, TtfFont, GlyphCache, TextRenderer) | Oui (avec S0, S1, S1c, S2) |
| Sprint 1c | 6 | Francois | Overhead UI monde : texte flottant RO, emotes, barres de progression | Oui (avec S0, S1, S1b, S2) |
| Sprint 2 | 11 | Francois | CLI mge-anim-pack (Aseprite loader, MaxRects packer, miroir auto, import PNG, export .ase) | Oui (avec S0, S1, S1b, S1c) |
| Sprint 3 | 8 | Lise | Migration client Sodomight (instanced, frustum, depth, TextRenderer, overhead UI) | Sequentiel (apres S0+S1+S1b+S1c) |
| Sprint 4 | 3+5 | Francois+Denis | Index u32, animation LOD, integration workspace + 5 taches FUTURE | Apres S3 |

## Chemin critique

```
S0-T01 → S0-T02 → S0-T06 → S0-T12 → S1-T10 → S3-T01 → S3-T03 → S3-T07 → S4-T03
```

Les Sprints 0, 1, 1b, 1c, 2 sont 100% parallelisables entre eux, ce qui comprime significativement la timeline.

## Avant / Apres

| Aspect | Avant | Apres |
|--------|-------|-------|
| Draw calls/frame | 13+ (1 par texture) | 1-3 (instanced + texture array) |
| Animation | 0 frame, statique | FSM 7 etats, 8 directions, frame events |
| Culling | Ad-hoc inline | Formel (spatial hash + frustum AABB) |
| Sprites visibles/frame (typique) | ~30 | 30 (Sodomight), 200-500 (Allumina ready) |
| Trafic CPU→GPU/frame | 640 KB (5000 sprites × 128B) | ~64 KB (5000 × 12B instance) |
| Max sprites | 16 384 (u16 index) | 65 536+ (u32 index) |
| Directions | 1 (statique) | 8 (4 rendues + 4 miroirs) |
| Polices | BitmapFont procedural 5x7 ASCII | TTF/OTF via fontdue (multi-font, accents) |
| Overhead UI | Aucun | Texte flottant RO (degats, crit, esquive...), emotes, progress bar |
| Outil assets | Manuel (gen_placeholders.py) | CLI mge-anim-pack (Aseprite + PNG import + export .ase) |

## Feature flags (migration safe)

- `instanced` (defaut) : Nouveau pipeline
- `legacy-batcher` : Ancien pipeline (rollback instantane)

## Risques surveilles

| Risque | Probabilite | Impact | Mitigation |
|--------|------------|--------|------------|
| R-02 Regression visuelle (Sprint 3) | Elevee | Eleve | Feature flags, screenshots reference |
| R-06 Scope creep | Elevee | Eleve | Particules, post-process, lighting = HORS SCOPE |
| R-01 Texture array dimensions | Moyenne | Moyen | 2-3 arrays par classe de taille |

## Criteres de succes

1. `cargo build -p sodomight-client` compile sans erreur
2. `cargo clippy -p mge-render -p sodomight-client -- -D warnings` : 0 warnings
3. `cargo test -p mge-render -p sodomight-client` : 100% pass
4. Le client Sodomight affiche les memes entites qu'avant la refonte
5. Le nombre de render passes est <= 3 (contre 13 actuellement)
6. `mge-anim-pack validate` sur les assets placeholders passe sans erreur
7. Le systeme d'animation fait tourner au moins une animation (idle) sur le joueur
8. Le TextRenderer affiche du texte TTF avec accents francais (4+ familles chargees)
9. Texte flottant RO-style (degats, critique, esquive) avec animation float+fade
10. Emotes sprite (5+ types) au-dessus des entites
11. Barre de progression overhead pour gathering
12. `mge-anim-pack import-png` importe des PNG avec presets de taille
13. 68+ tests unitaires/integration nouveaux passent

## Artefacts du chantier

| Phase | Fichier | Auteur |
|-------|---------|--------|
| Exploration P0-T1 | `.mip/briefs/BRIEF-mge-render-reforge-exploration.md` | Maria |
| Analyse PR P0-T3 | `.mip/briefs/BRIEF-mge-render-reforge-concurrence.md` | Fabrice |
| Spec technique P0-T4 | `.mip/specs/SPEC-mge-render-reforge.md` | Francois |
| Plan exhaustif P0-T5 | `.mip/plans/PLAN-mge-render-reforge.md` | Denis |
| Synthese P0-T6 | `.mip/briefs/BRIEF-mge-render-reforge-synthese.md` | Maria |

---

**Gate P0** : En attente approbation utilisateur. Apres validation, l'AUTOPILOT demarre :
1. Denis cree la feature branch `feat/mge-render-reforge`
2. Francois lance S0+S1+S1b+S1c+S2 en parallele (TDD)
3. Lise prend le relais en S3 (migration client + TextRenderer + overhead UI)
4. George audite en P4
5. Arianne archive en P6
