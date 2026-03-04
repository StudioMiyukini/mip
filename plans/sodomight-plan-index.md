# Plan Maitre Sodomight -- Index
<!-- @id: sodomight-plan-index @do: implementation-plan-index @role: chef-dev @layer: 0 @human: miyuk -->
<!-- Modularisation 2026-03-03. Source : sodomight-master-plan.md (1922l -> 6 fichiers). -->

**Agent** : Denis | **Phase** : P0 T7 | **Date** : 2026-03-03 | **Classe** : T5
**Branch** : `feat/sodomight-mvp`

## TL;DR

- 6 sprints, **197 taches** (192 + 5 NC), F (back) + L (front) + D (integration) + H (CI/CD).
- S0 : fix blockers + winit 0.30 + scene test. Livrable : clic-move sur map iso.
- S1 : Necromancer jouable, combat D2, loot, HUD, save/load. SEC-01/02.
- S2 : skill tree 30, inventaire grille, Rare/Unique, breakpoints, TOML. SEC-03/04/05.
- S3 : 25+ zones, 6 quetes, Andariel, runewords, audio, procgen, GAP-05 collision. SEC-08/17/21.
- S4-5 : reseau TCP, serveur autoritatif, classes 2-7, actes 2-5 (projets MIP separes).
- NC-01 : GAP-05 integre S3. NC-02 : 10 SEC assignes. NC-03 : V2.1 sequentialise. NC-04 : compteurs corriges.

---

## Corrections Arianne (NC-01..NC-04)

| NC | Probleme | Resolution |
|----|----------|------------|
| NC-01 | GAP-05 (mge-collision-rich) absent du plan | Ajoute : TASK-149..TASK-153 dans Sprint 3 V3.2 |
| NC-02 | 10 items SEC sans tache explicite | SEC-09/16/18/19/20/22 -> TASK-SEC-BATCH-MED (S3). SEC-23/24/25 -> TASK-SEC-BATCH-LOW (S5) |
| NC-03 | V2.1 conflit AP-08 (def.rs) -- 081/082/083 meme fichier | Sequentialise : V2.1a (081) -> V2.1b (082) -> V2.1c (083) -> V2.1d (084 synergies) |
| NC-04 | Discrepance lignes 42k vs 53k, tests 611 vs 800 | Chiffre retenu : 42 704 lignes (inventaire Denis). Tests : 611 confirmes (cargo test). 800 = comptage docs |

---

## Etat du projet

| Metrique | Valeur |
|----------|--------|
| Lignes Rust | 42 704 (34 crates) |
| Tests | 611 (2 KO : sodomight-client compile, mge-render floating_text) |
| Completude | ~62% |
| Score securite | 42/100 (DEFAUTS BLOQUANTS) |
| CI/CD | ABSENT |
| Blockers critiques | 2 (trivials, 10 min) |
| Gaps majeurs | 6 (GAP-01..GAP-06) |

## Decisions architecturales

1. Sprint 0 en premier (fenetre+rendu avant gameplay)
2. Single-player d'abord (multi = Sprint 4)
3. SEC-01 des Sprint 1 (RNG fixe corrige avant loot)
4. Migration TOML progressive (Sprint 2, GAP-03)
5. CI/CD des Sprint 0 (Hugo en parallele)
6. 1 classe d'abord (Necromancer)
7. GAP-06 (mge-studio UI) reporte post-S5
8. GAP-05 (collision-rich) integre Sprint 3 (NC-01)

## Conventions

- **Agents** : F=Francois, L=Lise, D=Denis, H=Hugo
- **Modeles** : O=Opus 4.6, S=Sonnet 4.6, Ha=Haiku 4.5 (ref: Jean selection modeles)
- **Chemins** : relatifs depuis `mge/` (racine workspace MGE)
- **Commits** : `<type>(<scope>): <description>` -- Types: feat, fix, test, refactor, docs, chore, sec
- **SEC-XX** : ref analyse securite Victor
- **REF-XX / SD-XX** : ref documents design dans `mge/docs/`

---

## DAG de dependances inter-sprints

```
S0 Fondations ──> S1 Combat ──> S2 Progression ──> S3 Acte 1 ──> S4 Multi ──> S5+ Contenu
     │                │               │                  │
     └─ CI/CD (H)     └─ SEC-01/02    └─ SEC-03/04/05    └─ GAP-05 + SEC-08/17/21
```

---

## Jalons

| Sprint | Jalon | Critere | Date est. |
|--------|-------|---------|-----------|
| S0 | Fenetre + clic-move | workspace vert, scene test, CI vert | J+3-5 |
| S1 | Combat + loot + save | Necro tue monstres, loot, save/load, SEC-01/02 | J+8-13 |
| S2 | Progression + inventaire | 30 skills, grille, Rare/Unique, TOML, SEC-03/04/05 | J+13-21 |
| S3 | Acte 1 jouable | 25+ zones, 6 quetes, Andariel, runewords, audio, GAP-05, SEC batch | J+21-33 |
| S4 | Multijoueur | 2-8 joueurs TCP, serveur autoritatif, SEC-06..15 | J+33-45 |
| S5+ | Jeu complet | 7 classes, 5 actes, 3 difficultes, endgame | J+45-65+ |

**Criteres transversaux** : cargo build/clippy/test 0 erreur, pas unwrap() prod, unsafe_code=forbid, MSCM, push par etape macro.

---

## Compteurs (NC-04 corrige)

| Metrique | S0 | S1 | S2 | S3 | S4 | S5+ | Total |
|----------|----|----|----|----|----|----|-------|
| Taches | 22 | 50 | 40 | **50** | 20 | 15+ | **197+** |
| Tests nouveaux | 10 | 40 | 45 | **35** | 20 | 50+ | **200+** |
| Fichiers touches | 25 | 35 | 30 | **45** | 25 | 50+ | **210+** |
| SEC resolus | 0 | 2 | 3 | **9** (3+6 batch) | 8 | 3 | **25** |
| Francois | 15 | 35 | 25 | **33** | 16 | 10+ | **134+** |
| Lise | 3 | 10 | 10 | **12** | 2 | 5+ | **42+** |
| Denis | 3 | 3 | 3 | 3 | 2 | 0 | **14** |
| Hugo | 4 | 0 | 0 | 0 | 1 | 0 | **5** |
| Score SEC | 42 | 52 | 62 | **72** | 85 | 90+ | -- |

---

## Index des fichiers de sprint

| Fichier | Contenu | Taches |
|---------|---------|--------|
| [sodomight-plan-S0.md](sodomight-plan-S0.md) | Sprint 0 -- Fondations moteur | TASK-001 a TASK-022 (22 taches) |
| [sodomight-plan-S1-part1.md](sodomight-plan-S1-part1.md) | Sprint 1 -- Boucle de combat (1/2) | TASK-031 a TASK-047 (MASS + V1.1 a V1.4) |
| [sodomight-plan-S1-part2.md](sodomight-plan-S1-part2.md) | Sprint 1 -- Boucle de combat (2/2) | TASK-048 a TASK-080 (V1.5 a V1.8) |
| [sodomight-plan-S2.md](sodomight-plan-S2.md) | Sprint 2 -- Progression et inventaire | TASK-081 a TASK-125 (40 taches) |
| [sodomight-plan-S3-part1.md](sodomight-plan-S3-part1.md) | Sprint 3 -- Acte 1 complet (1/2) | TASK-121 a TASK-153 (MASS + V3.1 + V3.2) |
| [sodomight-plan-S3-part2.md](sodomight-plan-S3-part2.md) | Sprint 3 -- Acte 1 complet (2/2) | TASK-127 a TASK-165 (V3.3 a V3.5) |
| [sodomight-plan-S4-S5.md](sodomight-plan-S4-S5.md) | Sprint 4 + 5+ -- Multi + Contenu | TASK-166 a TASK-195 (35+ taches) |

---

## Risques et mitigations

| # | Risque | P | I | Sprint | Mitigation |
|---|--------|---|---|--------|------------|
| R-01 | ECS Any downcasting fragile | M | H | S1+ | Bench 500 entites S0, refactor si besoin |
| R-02 | winit 0.30 migration | F | H | S0 | Pseudo-code fourni, Opus pour kernel |
| R-03 | CI/CD build >60min | H | M | S0 | sccache + cache Cargo |
| R-04 | Tests GPU en CI | H | F | S0 | #[ignore] TASK-017 |
| R-05 | Data hardcodee content.rs | H | H | S2 | GAP-03 TOML, feature flag fallback |
| R-06 | Reseau coquille vide | H | H | S4 | Pseudo-code complet, Opus pour GAP-01/02 |
| R-07 | RNG predictible (DEBUG_SEED) | H | C | S1 | SEC-01 premiere tache V1.1 |
| R-08 | Cross-workspace miyuki-ui | F | M | Tous | Freeze version |
| R-09 | kira bus factor | F | M | LT | Migration rodio possible |
| R-10 | Context window saturation | E | M | S1+ | Refactor gui.rs <1000l, index+drill-down |
| R-11 | Scope creep S5+ | H | H | S5 | Projets MIP separes par acte/classe |
| R-12 | Regression inter-sprints | M | H | S1+ | Checkpoints Denis /5 taches |
| R-13 | Procgen qualite | M | M | S3 | Seed deterministe + visual QA |
| R-14 | Tests visuels non automatisables | H | M | Tous | Screenshots ref + diff manuelle |

---

## Annexe A -- Crates par sprint

### Sprint 0

| Crate | Fichiers | Action |
|-------|----------|--------|
| sodomight-client | game.rs | Fix compile (B1) |
| mge-render | overhead.rs | Fix test (B2) |
| mge-platform | app.rs, window.rs, gpu.rs | Migration winit 0.30 (E-10) |
| mge-math | iso.rs | Validation |
| mge-pathfinding | src/ | Validation + bench |
| mge-ecs/core/asset/collision | src/ | Validation (4 crates) |

### Sprint 1

| Crate | Fichiers cles | Action |
|-------|--------------|--------|
| sodomight | world.rs, content.rs | SEC-01, spawner, combat ECS, monstres |
| mge-save | accounts.rs, characters.rs, items.rs | SEC-02, save/load |
| mge-arpg-stats | base.rs, level.rs | Necro stats, XP table |
| mge-arpg-entity | character.rs, item_drop.rs | Spawner, item drops |
| mge-arpg-combat | calculator.rs, damage.rs, processor.rs, status.rs | Pipeline combat D2 complet |
| mge-arpg-skills | def.rs, registry.rs, book.rs, cooldown.rs | 3 skills Necro + activation |
| mge-arpg-loot | registry.rs, quality.rs | Drop tables, MF |
| mge-arpg-ai | state.rs, agent.rs | FSM monstre |
| mge-arpg-trade | wallet.rs | Gold system |
| mge-audio | manager.rs, sfx.rs, bgm.rs | Audio basique |
| mge-ui | hud.rs, skill_tree.rs, dialog.rs, minimap.rs | HUD complet |
| mge-render | overhead.rs | Damage numbers |

### Sprint 2

| Crate | Fichiers cles | Action |
|-------|--------------|--------|
| mge-arpg-skills | def.rs, synergy.rs | 30 skills (3 arbres) + synergies |
| mge-arpg-items | instance.rs, quality.rs, equipment.rs | Rare, Unique, sockets, identify |
| mge-arpg-stats | block.rs, derived.rs | Breakpoints, resistances |
| mge-ui | inventory.rs, character.rs, skill_tree.rs, tooltip.rs | UI progression |
| mge-net | packet.rs | SEC-03 (ClientMessage/ServerMessage) |
| sodomight-server | tick.rs | SEC-04 (validation move) |
| mge-arpg-trade | trade_session.rs | SEC-05 (trade atomique) |
| sodomight | data/, lib.rs | TOML GAP-03 |

### Sprint 3

| Crate | Fichiers cles | Action |
|-------|--------------|--------|
| mge-arpg-world | zone.rs, chunk.rs, world_map.rs, waypoint.rs, tile.rs, portal.rs | Zones, procgen, WP, TP |
| mge-arpg-quest | def.rs | 6 quetes Act 1 |
| mge-collision-rich | lib.rs, intersect.rs, circle.rs, capsule.rs | GAP-05 (NC-01) |
| mge-script | engine.rs | SEC-08 sandbox Rhai |
| mge-audio | bgm.rs, sfx.rs, manager.rs | Audio Act 1 complet |
| mge-ui | menus/, inventory.rs | Menus, loot filter, stash |
| sodomight | content.rs | Bestiary, champions, Andariel |
| mge-arpg-trade | vendor.rs | NPC vendor (SEC-21) |
| multi-crates | multi-fichiers | SEC-BATCH-MED (NC-02) |

### Sprint 4

| Crate | Fichiers cles | Action |
|-------|--------------|--------|
| mge-net | server.rs, client.rs, session.rs, rate_limiter.rs | GAP-01 TCP complet |
| sodomight-server | server.rs, authority.rs, world_host.rs | GAP-02 serveur autoritatif |
| sodomight-client | state.rs | Client connect, sync, prediction |
| mge-ui | menus/ | Lobby browser |

---

## Annexe B -- Conventions commits

`<type>(<scope>): <description>` -- Types: feat, fix, test, refactor, docs, chore, sec

Exemples :
- `fix(sodomight-client): resolve Display trait error in game.rs:843`
- `sec(mge-save): add argon2 password hashing (SEC-02)`
- `feat(mge-arpg-skills): implement Necromancer Summoning tree (10 skills)`
- `test(mge-ui): add 15 unit tests for HUD components (GAP-04)`

---

## Annexe C -- Checklist securite

| Sprint | Items SEC | Score |
|--------|----------|-------|
| S0 | aucun | 42/100 |
| S1 | SEC-01 (RNG), SEC-02 (auth argon2) | 52/100 |
| S2 | SEC-03 (msg split), SEC-04 (move valid), SEC-05 (trade atomic) | 62/100 |
| S3 | SEC-08 (Rhai), SEC-17 (noms), SEC-21 (prix vendor) + SEC-BATCH-MED (09,16,18,19,20,22) = **9 items** | 72/100 |
| S4 | SEC-06 (ClientId), SEC-07 (seq#), SEC-10 (rate limit), SEC-11 (mutex trade), SEC-12 (stats valid), SEC-13 (session), SEC-14 (sqlcipher), SEC-15 (TLS) = **8 items** | 85/100 |
| S5+ | SEC-BATCH-LOW (23,24,25) = **3 items** | 90+/100 |
| **Total** | **25/25 items assignes** (NC-02 resolu) | |

---

## Annexe D -- Modeles par tache (ref Jean)

| Critere | Modele |
|---------|--------|
| Kernel/GPU (mge-platform, mge-render pipeline) | Opus |
| Reseau critique (GAP-01, GAP-02) | Opus |
| Boss AI complexe (Andariel) | Opus |
| Procgen algorithmique | Opus |
| Audit cross-crates (George P4) | Opus |
| Implementation standard (combat, skills, items, quetes) | Sonnet |
| UI/UX (HUD, menus, inventaire) | Sonnet |
| Securite (SEC-01..25) | Sonnet |
| Boilerplate (TOML, config, validation simple, assets) | Haiku |
| Spot-checks (Victor, Jean) | Haiku |

Regles de bascule : >3 auto-corrections Sonnet -> upgrade Opus. Haiku echoue >2 fois -> Sonnet.

---

*Denis (Chef Dev Senior) -- MIP v2 P0 T7 -- 2026-03-03*
*NC-01..NC-04 integrees. 197 taches, 25/25 SEC assignes, V2.1 sequentialise (AP-08).*
