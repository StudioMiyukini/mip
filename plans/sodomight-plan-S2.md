# Sprint 2 -- Progression et inventaire (40 taches, 5-8j)
<!-- @id: sodomight-plan-S2 @do: sprint-2-plan @role: chef-dev @layer: 0 @human: miyuk -->

**TL;DR** : Skill tree 30 Necro (3 arbres + synergies), items Rare/Unique, inventaire grille 10x4, breakpoints, TOML data, SEC-03/04/05.

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md)

**Livrable** : Skill tree 30 Necro, items Rare/Unique, inventaire grille, TOML, breakpoints. SEC-03/04/05.

## MASS Sprint 2

### DAG de dependances (ASCII)

```
TASK-081 (Summoning) ──┐                           TASK-091 (Rare) ──> TASK-093 (sockets)
       │ (seq NC-03)   │                                  │                    │
TASK-082 (P&B) ────────┤                           TASK-092 (Unique)   TASK-094 (identify)
       │ (seq NC-03)   │                                  │
TASK-083 (Curses) ─────┤──> TASK-084 (synergies)         │
                       │          │                       v
                       │    TASK-103 (skill UI)    TASK-101 (inv grille) ──> TASK-102 (paperdoll)
                       │                                  │
                       │                           TASK-104 (tooltip)
                       │                                  │
                       │                           TASK-105 (tests UI batch 2)
                       │
TASK-109 (breakpoints) ─────────────────────────────────────────────────────┐
TASK-110 (resistances) ─────────────────────────────────────────────────────┤
                                                                            v
TASK-113 (TOML arbo) ──> TASK-114 (data loader) ──> TASK-118 (SEC-03)
                                                     TASK-119 (SEC-04)
                                                     TASK-120 (SEC-05)
                                                            │
                                                     TASK-125 (checkpoint)
```

### Vagues d'execution (NC-03 corrige : 081/082/083 sequentialises)

| Vague | Taches | Agents | Mode | Fichiers touches | Conflit potentiel | Duree est. |
|-------|--------|--------|------|-----------------|-------------------|------------|
| V2.1a | 081 | F | sequentiel | skills/def.rs (Summoning tree) | NC-03 : def.rs partage -> seq obligatoire | 2h |
| V2.1b | 082 | F | sequentiel | skills/def.rs (P&B tree) | NC-03 : meme fichier que 081 | 2h |
| V2.1c | 083 | F | sequentiel | skills/def.rs (Curses tree) | NC-03 : meme fichier que 081/082 | 2h |
| V2.1d | 084, 091, 092, 109, 110 | F, F, F, F, F | worktree swarm | skills/synergy.rs / items/instance.rs / items/instance.rs(uniques) / stats/block.rs / stats/derived.rs | 091+092 meme fichier instance.rs -> seq 091 puis 092 | 4h |
| V2.2 | 093, 094, 101, 103 | F, F, L, L | worktree swarm | items/equipment.rs / items/instance.rs / ui/inventory.rs / ui/skill_tree.rs | Fichiers disjoints F/L OK | 4h |
| V2.3 | 102, 104, 105 | L, L, L | subagent burst | ui/character.rs / ui/tooltip.rs / ui/tests | Fichiers disjoints OK | 3h |
| V2.4 | 113, 114 | F, F | sequentiel | sodomight/data/ (nouveau), sodomight/data_loader.rs | Creation arbo puis loader | 4h |
| V2.5 | 118, 119, 120 | F, F, F | sequentiel | net/packet.rs -> net/message.rs -> trade/trade_session.rs | Chain deps SEC | 3h |
| V2.6 | 125 | D | sequentiel | workspace | Gate | 1h |

### Strategie de merge

- V2.1a-c : Sequentielles (NC-03 AP-08). F commit apres chaque tree, push apres V2.1c.
- V2.1d : 5 taches, 091+092 seq (meme fichier). Denis merge. Checkpoint toutes 5 taches.
- V2.2 : F(back) et L(front) en //. Denis merge F puis L. Push.
- V2.3 : L seule, 3 taches //. Push apres completion.
- V2.4-V2.5 : Seq. Push apres V2.5.
- V2.6 : Gate sprint, tag `sprint-2-done`.
- Spot-checks : Victor sur SEC-03/04/05 (V2.5). Jean tokens/ligne V2.1 (chain longue).

### Metriques cibles

| Metrique | Cible |
|----------|-------|
| Tokens total S2 | ~200k (F: 140k S, L: 45k S, D: 15k S) |
| Tests nouveaux | ~45 (skills: 12, items: 10, UI: 15+, TOML: 8) |
| SEC resolus | SEC-03, SEC-04, SEC-05 (score 52->62) |

---

### V2.1a -- Skill tree Summoning (NC-03 seq)

### TASK-081: Arbre Summoning Necro (10 skills)
- **Crate(s)** : mge-arpg-skills
- **Fichier(s)** : `crates/arpg/mge-arpg-skills/src/def.rs`, `crates/arpg/mge-arpg-skills/src/registry.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [040] | **Vague** : V2.1a (NC-03 : seq, def.rs exclusif)
- **Implementation** : (1) 10 SkillDef pour arbre Summoning : Raise Skeleton (lvl1), Skeleton Mastery (lvl1), Clay Golem (lvl6), Golem Mastery (lvl12), Raise Skeletal Mage (lvl12), Blood Golem (lvl18), Summon Resist (lvl24), Iron Golem (lvl24), Fire Golem (lvl30), Revive (lvl30). (2) Chaque skill : mana_cost, base_effect, per_level_bonus, prerequisites Vec<SkillId>. (3) Prerequis D2 : Clay Golem requiert Skeleton Mastery, Blood Golem requiert Clay Golem + Golem Mastery, etc. (4) Enregistrer dans SkillRegistry avec tree = "Summoning".
- **Tests** : `cargo test -p mge-arpg-skills -- summoning_tree_10_skills` -- 10 skills enregistres. `summoning_prereq_chain` -- Fire Golem requiert Blood Golem qui requiert Clay Golem.
- **Ref** : REF-02 Section 4.1 (Necro Summoning)
- **SEC** : --

### V2.1b -- Skill tree Poison & Bone (NC-03 seq)

### TASK-082: Arbre Poison & Bone (10 skills)
- **Crate(s)** : mge-arpg-skills
- **Fichier(s)** : `crates/arpg/mge-arpg-skills/src/def.rs`, `crates/arpg/mge-arpg-skills/src/registry.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [040, 081] | **Vague** : V2.1b (NC-03 : seq apres 081, def.rs)
- **Implementation** : (1) 10 SkillDef : Teeth (lvl1), Bone Armor (lvl1), Poison Dagger (lvl6), Corpse Explosion (lvl6), Bone Wall (lvl12), Poison Explosion (lvl18), Bone Spear (lvl18), Bone Prison (lvl24), Poison Nova (lvl30), Bone Spirit (lvl30). (2) Memes champs que 081 : mana_cost, base_damage/effect, per_level, prerequisites. (3) Bone Spear deja cree en TASK-040 -> mise a jour avec synergies et prerequisites corrects.
- **Tests** : `cargo test -p mge-arpg-skills -- poison_bone_tree_10_skills` -- 10 skills. `bone_spear_synergy_teeth` -- Teeth en synergy de Bone Spear.
- **Ref** : REF-02 Section 4.2
- **SEC** : --

### V2.1c -- Skill tree Curses (NC-03 seq)

### TASK-083: Arbre Curses (10 skills)
- **Crate(s)** : mge-arpg-skills
- **Fichier(s)** : `crates/arpg/mge-arpg-skills/src/def.rs`, `crates/arpg/mge-arpg-skills/src/registry.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [040, 082] | **Vague** : V2.1c (NC-03 : seq apres 082, def.rs)
- **Implementation** : (1) 10 SkillDef : Amplify Damage (lvl1), Dim Vision (lvl6), Weaken (lvl6), Iron Maiden (lvl12), Terror (lvl12), Confuse (lvl18), Life Tap (lvl18), Attract (lvl24), Decrepify (lvl24), Lower Resist (lvl30). (2) Curses = debuff AoE avec duration. `CurseEffect` : radius, duration, stat_modifier. (3) 1 seule curse active a la fois (nouvelle remplace ancienne).
- **Tests** : `cargo test -p mge-arpg-skills -- curses_tree_10_skills` -- 10 skills. `curse_one_active` -- 2e curse remplace 1ere. `amplify_damage_effect` -- +100% phys damage pris.
- **Ref** : REF-02 Section 4.3
- **SEC** : --

### V2.1d -- Synergies + Items avances + Breakpoints (5 taches)

### TASK-084: SynergyCalculator (bonus % par hard point)
- **Crate(s)** : mge-arpg-skills
- **Fichier(s)** : `crates/arpg/mge-arpg-skills/src/synergy.rs`
- **Agent** : F | **Modele** : S (formules)
- **Deps** : [081, 082, 083] | **Vague** : V2.1d
- **Implementation** : (1) `SynergyCalculator::compute(skill_id, book: &SkillBook) -> f32` : somme des bonus synergies. (2) Chaque skill definit `synergy_bonus_per_point: f32` (ex: Bone Spear +7% par point de Teeth). (3) Seuls les hard points comptent (pas les +skills items). (4) `fn effective_damage(base, skill_level, synergy_bonus) -> i32` : `base * (1 + skill_level * per_level + synergy_bonus)`.
- **Tests** : `cargo test -p mge-arpg-skills -- synergy_bone_spear_teeth` -- 10 pts Teeth = +70% Bone Spear. `synergy_soft_points_ignored` -- +skills item ne comptent pas pour synergies.
- **Ref** : REF-02 Section 4.4 (synergies D2)
- **SEC** : --

### TASK-091: Items Rare (2-6 affixes, alvl filter)
- **Crate(s)** : mge-arpg-items
- **Fichier(s)** : `crates/arpg/mge-arpg-items/src/instance.rs`, `crates/arpg/mge-arpg-items/src/quality.rs`
- **Agent** : F | **Modele** : S (items)
- **Deps** : [047] | **Vague** : V2.1d
- **Implementation** : (1) Rare items : 2-3 prefixes + 1-3 suffixes (total 2-6 affixes). (2) Nom genere aleatoirement (prefix table + suffix table). (3) `fn generate_rare_item(base, alvl, rng) -> ItemInstance` : roll nombre affixes (weighted), puis roll chaque affix depuis pool filtre par alvl. (4) Pas de duplicate affix (meme groupe). (5) Affixes rare puisent dans le meme pool que Magic mais plus nombreux.
- **Tests** : `cargo test -p mge-arpg-items -- rare_item_2_to_6_affixes` -- count entre 2 et 6. `rare_no_duplicate_group` -- pas 2 affixes meme groupe. `rare_alvl_filter` -- alvl 1 = pool restreint.
- **Ref** : REF-02 Section 6.3 (Rare items D2)
- **SEC** : --

### TASK-092: Items Unique (15 Act 1, stats fixes)
- **Crate(s)** : mge-arpg-items
- **Fichier(s)** : `crates/arpg/mge-arpg-items/src/instance.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [047] | **Vague** : V2.1d (seq apres 091, meme fichier instance.rs)
- **Implementation** : (1) `UniqueItemDef` struct : base_id, name, required_level, fixed_stats Vec<(StatMod, RangeInclusive)>. (2) 15 Uniques Act 1 : The Gnasher, Deathspade, Bladebone, Skull Splitter, Rakescar, etc. (3) `fn generate_unique_item(def, rng) -> ItemInstance` : roll chaque stat dans son range. (4) Unique items sont toujours identified = false (need scroll/Cain). (5) Couleur : gold.
- **Tests** : `cargo test -p mge-arpg-items -- unique_item_fixed_stats` -- stats dans range. `unique_needs_identify` -- identified = false. `unique_15_act1` -- 15 defs enregistrees.
- **Ref** : REF-02 Section 6.4 (Unique items D2)
- **SEC** : --

### TASK-109: Breakpoints FCR/FHR/FBR/IAS Necromancer
- **Crate(s)** : mge-arpg-stats
- **Fichier(s)** : `crates/arpg/mge-arpg-stats/src/block.rs`
- **Agent** : F | **Modele** : S (formules)
- **Deps** : [] | **Vague** : V2.1d
- **Implementation** : (1) `BreakpointTable` struct : thresholds Vec<i32>, frames Vec<u8>. (2) Necro FCR breakpoints : 0%(15f), 9%(14f), 18%(13f), 30%(12f), 48%(11f), 75%(10f), 125%(9f). (3) Necro FHR : 0%(13f), 5%(12f), 10%(11f), 16%(10f), 26%(9f), 39%(8f), 56%(7f), 86%(6f), 152%(5f). (4) `fn frames_for_stat(table, stat_value) -> u8` : recherche seuil. (5) Appliquer dans CombatProcessor : cast speed, hit recovery, block.
- **Tests** : `cargo test -p mge-arpg-stats -- fcr_necro_75` -- 75% FCR = 10 frames. `fhr_necro_0` -- 0% FHR = 13 frames. `breakpoint_exact_threshold` -- exactement sur le seuil = frame suivante.
- **Ref** : REF-02 Section 7.5 (breakpoints D2)
- **SEC** : --

### TASK-110: Resistances + penalites difficulte
- **Crate(s)** : mge-arpg-stats
- **Fichier(s)** : `crates/arpg/mge-arpg-stats/src/derived.rs`
- **Agent** : F | **Modele** : S (formules)
- **Deps** : [] | **Vague** : V2.1d
- **Implementation** : (1) `Resistances { fire: i32, cold: i32, lightning: i32, poison: i32 }`. (2) Penalites par difficulte : Normal = 0, Nightmare = -40, Hell = -100. (3) `fn effective_resist(base, penalty, items_bonus) -> i32` : clamp(-100, 75). Max resist augmentable par items (cap 95). (4) Absorb stack avec resist. (5) Immunite si resist >= 100 (monster only, broken par Lower Resist 1/5 effectif).
- **Tests** : `cargo test -p mge-arpg-stats -- resist_hell_penalty` -- base 75 + hell -100 = -25. `resist_cap_75` -- >75 = 75. `resist_max_cap_95` -- avec +max resist items.
- **Ref** : REF-02 Section 7.3.2 (resistances D2)
- **SEC** : --

---

### V2.2 -- Sockets + Identification + UI (4 taches, F//L)

### TASK-093: Sockets + insertion gemmes/runes/jewels
- **Crate(s)** : mge-arpg-items
- **Fichier(s)** : `crates/arpg/mge-arpg-items/src/equipment.rs`
- **Agent** : F | **Modele** : S (items)
- **Deps** : [091] | **Vague** : V2.2
- **Implementation** : (1) `SocketedItem` : sockets Vec<Option<SocketFiller>>, max_sockets 1-6 (par base type). (2) `SocketFiller` enum : Gem(GemType, GemQuality), Rune(RuneId), Jewel(JewelInstance). (3) `fn insert_filler(item, index, filler) -> Result<()>` : verifie slot vide. (4) `fn remove_all_fillers(item) -> Vec<SocketFiller>` (Hel rune recipe). (5) Bonus appliques : chaque filler contribue ses stats via `filler_stats(filler) -> Vec<StatMod>`.
- **Tests** : `cargo test -p mge-arpg-items -- socket_insert` -- filler insere OK. `socket_full` -- slot plein = Err. `socket_stats_applied` -- stats du gem ajoutees.
- **Ref** : REF-02 Section 6.5 (sockets D2)
- **SEC** : --

### TASK-094: Identification items (scroll + Cain)
- **Crate(s)** : mge-arpg-items
- **Fichier(s)** : `crates/arpg/mge-arpg-items/src/instance.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [091] | **Vague** : V2.2
- **Implementation** : (1) `ItemInstance.identified: bool` -- false pour Magic/Rare/Unique/Set non identifies. (2) `fn identify(item) -> Result<()>` : set identified = true, revele affixes. (3) Non-identifie : tooltip affiche seulement base name + "Unidentified". (4) Deux methodes : Scroll of Identify (consume 1) ou NPC Cain (gratuit apres quete). (5) Normal items = toujours identified.
- **Tests** : `cargo test -p mge-arpg-items -- identify_reveals_affixes` -- avant = 0 visible, apres = N affixes. `normal_always_identified` -- Normal.identified = true.
- **Ref** : REF-02 Section 6.6
- **SEC** : --

### TASK-101: Inventaire grille 10x4 + drag&drop
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/inventory.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [091] | **Vague** : V2.2
- **Implementation** : (1) `InventoryGrid::render(ctx, items: &[Option<ItemInstance>; 40])` : grille 10 colonnes x 4 lignes. (2) Items occupent 1x1 (potions, rings) a 2x4 (armures). (3) Drag&drop : clic = pick up, clic = place. Swap si slot occupe. (4) Item size : `fn item_size(base_type) -> (u8, u8)`. (5) Placement : verifier que toutes les cases sont libres avant placer.
- **Tests** : `cargo test -p mge-ui -- inventory_place_item` -- item place aux coords. `inventory_overlap_reject` -- chevauchement = Err. `inventory_swap` -- clic sur item occupe = swap.
- **Ref** : REF-02 Section 11.7 (inventaire D2), GAP-04
- **SEC** : --

### TASK-103: Fenetre skill tree UI (3 onglets, prerequis)
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/skill_tree.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [081, 082, 083, 084] | **Vague** : V2.2
- **Implementation** : (1) 3 onglets : Summoning, Poison & Bone, Curses. (2) Layout arbre : icones connectees par lignes (prerequis). (3) Skill investable si : prerequis atteints + level requis + points dispo. (4) Clic gauche = investir 1 point (max 20). (5) Tooltip : nom, level actuel, effet, synergies, cout mana. (6) Grayed out si locked.
- **Tests** : `cargo test -p mge-ui -- skill_tree_prereq_lock` -- skill sans prereq = locked. `skill_tree_invest` -- clic = level+1. `skill_tree_max_20` -- >20 = ignore.
- **Ref** : REF-02 Section 11.8 (skill tree UI)
- **SEC** : --

---

### V2.3 -- Paperdoll + Tooltip + Tests UI (3 taches)

### TASK-102: Paperdoll (10 equipment slots)
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/character.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [101] | **Vague** : V2.3
- **Implementation** : (1) 10 slots : Helm, Armor, Belt, Boots, Gloves, Amulet, Ring1, Ring2, Weapon, Shield. (2) `Paperdoll::render(ctx, equipment: &Equipment)` : silhouette personnage + slots autour. (3) Drag from inventory to equip. Type check : casque ne va que dans Helm slot. (4) Stats panel : afficher stats totales (base + equipment). (5) Stat allocation : 5 points/level, boutons +STR/+DEX/+VIT/+ENE.
- **Tests** : `cargo test -p mge-ui -- paperdoll_equip_helm` -- casque dans Helm OK. `paperdoll_wrong_slot` -- casque dans Boots = Err. `paperdoll_stat_alloc` -- +1 STR consomme 1 point.
- **Ref** : REF-02 Section 11.9
- **SEC** : --

### TASK-104: Tooltip items (qualite, affixes, comparaison)
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/tooltip.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [091] | **Vague** : V2.3
- **Implementation** : (1) `ItemTooltip::render(ctx, item, equipped_item)`. (2) Nom colore par qualite : blanc=Normal, bleu=Magic, jaune=Rare, vert=Set, gold=Unique. (3) Affixes listes avec valeurs. (4) Si `equipped_item` fourni : comparaison diff (vert=mieux, rouge=pire). (5) Non-identifie : afficher "Unidentified" seulement. (6) Sockets affiches avec fillers.
- **Tests** : `cargo test -p mge-ui -- tooltip_color_by_quality` -- Magic=bleu, Rare=jaune. `tooltip_unidentified` -- pas d'affixes visibles. `tooltip_comparison` -- diff calculee correctement.
- **Ref** : REF-02 Section 11.10
- **SEC** : --

### TASK-105: Tests mge-ui batch 2 (15+ tests, GAP-04 total 30+)
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/` (tests)
- **Agent** : L | **Modele** : S (tests)
- **Deps** : [101, 102, 103, 104] | **Vague** : V2.3
- **Implementation** : 15+ tests unitaires logique : inventory grid 10x4 (3), item placement overlap (2), paperdoll slots (2), stat allocation (2), skill tree prereq (2), tooltip colors (2), tooltip comparison (2). Total avec batch 1 : 30+ tests (GAP-04 atteint).
- **Tests** : `cargo test -p mge-ui` -- 30+/30+ PASS (GAP-04 complet)
- **Ref** : GAP-04 tech-spec
- **SEC** : --

---

### V2.4 -- Migration TOML GAP-03 (2 taches, sequentielles)

### TASK-113: Arborescence data/ TOML (~20 fichiers)
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/data/` (NOUVEAU repertoire complet)
- **Agent** : F | **Modele** : Ha (boilerplate TOML)
- **Deps** : [081, 082, 083, 091, 092] | **Vague** : V2.4
- **Implementation** : Creer `games/sodomight/data/` avec : (1) `config/game.toml` (settings globaux). (2) `classes/necromancer.toml` (stats base, derived formulas). (3) `skills/summoning/*.toml`, `skills/poison_bone/*.toml`, `skills/curses/*.toml` (1 fichier par skill). (4) `items/bases/*.toml` (types d'items), `items/affixes/*.toml` (pool affixes), `items/uniques/act1.toml`. (5) `monsters/act1/*.toml` (1 par famille). (6) `loot_tables/act1.toml`. (7) `zones/act1/*.toml` (placeholder). (8) Chaque fichier TOML miroir exact de ce qui est hardcode dans content.rs.
- **Tests** : `find games/sodomight/data -name "*.toml" | wc -l` -- ~20 fichiers. Chaque fichier parse OK (test ci-dessous).
- **Ref** : GAP-03, tech-spec E-05
- **SEC** : --

### TASK-114: Data loader SodomightData + feature flag hardcoded-content
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/lib.rs`, `games/sodomight/Cargo.toml`
- **Agent** : F | **Modele** : S (architecture)
- **Deps** : [113] | **Vague** : V2.4
- **Implementation** : (1) `GameDataRegistry` struct : classes, skills, items, monsters, loot_tables, zones. (2) `GameDataRegistry::load_all(data_dir: &Path) -> Result<Self>` : iterate les sous-dossiers, deserialization TOML generique via mge-asset. (3) Feature flag `hardcoded-content` dans Cargo.toml : si active, fallback sur content.rs. Par defaut, desactive (data TOML). (4) Test de coherence : charger TOML, charger content.rs, assert_eq sur chaque champ. (5) Validation : IDs uniques, cross-refs valides (skill prereq IDs existent, loot table item IDs existent).
- **Tests** : `cargo test -p sodomight -- toml_load_matches_content` -- TOML = content.rs. `toml_unique_ids` -- 0 duplicat. `toml_cross_refs` -- toutes refs valides. Total ~8-10 tests GAP-03.
- **Ref** : GAP-03, tech-spec
- **SEC** : --

---

### V2.5 -- Securite Sprint 2 (3 taches, sequentielles)

### TASK-118: SEC-03 -- Separation ClientMessage/ServerMessage
- **Crate(s)** : mge-net
- **Fichier(s)** : `crates/engine/mge-net/src/packet.rs`
- **Agent** : F | **Modele** : S (securite)
- **Deps** : [] | **Vague** : V2.5
- **Implementation** : (1) Scinder `GameMessage` enum en `ClientMessage` (ce que le client envoie : Move, UseSkill, PickupItem, Chat, TradeRequest) et `ServerMessage` (ce que le serveur envoie : SyncState, SpawnEntity, DamageEvent, LootDrop, ChatBroadcast). (2) Serveur deserialization : accepter UNIQUEMENT `ClientMessage`. Rejeter (disconnect) tout paquet non-ClientMessage. (3) Client deserialization : accepter UNIQUEMENT `ServerMessage`. (4) Mettre a jour tous les usages dans mge-net et sodomight-server/client.
- **Tests** : `cargo test -p mge-net -- client_cannot_send_server_msg` -- deserialisation ServerMessage depuis client buffer = Err. `server_rejects_server_msg` -- message invalide = disconnect.
- **Ref** : SEC-03 (DREAD 9.0), analyse securite Victor N-07
- **SEC** : SEC-03

### TASK-119: SEC-04 -- Validation PlayerMove serveur (speed hack)
- **Crate(s)** : sodomight-server
- **Fichier(s)** : `games/sodomight-server/src/tick.rs`
- **Agent** : F | **Modele** : S (securite)
- **Deps** : [118] | **Vague** : V2.5
- **Implementation** : (1) Serveur recoit `ClientMessage::Move { dx, dy }`. (2) Validation : `let max_delta = max_speed * dt * 1.1` (10% tolerance reseau). (3) `if dx.abs() > max_delta || dy.abs() > max_delta { reject + log warning }`. (4) Verifier aussi collision serveur-side (pas de traversee murs). (5) Si reject : renvoyer position autoritaire au client (rubber-banding). (6) Rate limit : max 25 Move/s par client.
- **Tests** : `cargo test -p sodomight-server -- validate_move_normal` -- delta normal = accepte. `validate_move_speed_hack` -- delta 10x = rejete. `validate_move_rate_limit` -- >25/s = rejete.
- **Ref** : SEC-04 (DREAD 9.0), analyse securite Victor N-06
- **SEC** : SEC-04

### TASK-120: SEC-05 -- Trade atomique BEGIN/COMMIT/ROLLBACK
- **Crate(s)** : mge-arpg-trade
- **Fichier(s)** : `crates/arpg/mge-arpg-trade/src/trade_session.rs`
- **Agent** : F | **Modele** : S (securite)
- **Deps** : [] | **Vague** : V2.5
- **Implementation** : (1) `TradeSession::execute(&self, db) -> Result<()>` : wrapper dans `db.transaction(|tx| { ... })`. (2) Inside transaction : remove items from player A inventory, add to player B, remove items from B, add to A, transfer gold. (3) Si ANY step echoue : ROLLBACK automatique (SQLite transaction). (4) Verifier items existent et appartiennent au bon joueur AVANT transaction. (5) Lock : Mutex sur TradeSession pour eviter race condition reseau (SEC-11 partiel).
- **Tests** : `cargo test -p mge-arpg-trade -- trade_atomic_success` -- items transferes. `trade_atomic_rollback` -- si erreur mid-trade, aucun item perdu. `trade_wrong_owner` -- item pas au joueur = Err.
- **Ref** : SEC-05 (DREAD 8.0), analyse securite Victor T-02
- **SEC** : SEC-05, SEC-11 (partiel)

---

### V2.6 -- Gate Sprint 2

### TASK-125: Checkpoint Sprint 2
- **Crate(s)** : workspace
- **Fichier(s)** : aucun (gate)
- **Agent** : D | **Modele** : S (coordination)
- **Deps** : [toutes S2] | **Vague** : V2.6
- **Implementation** : (1) cargo build/clippy/test --workspace 0 erreur. (2) Verifier 30 skills Necro, items Rare/Unique, inventaire grille, TOML, breakpoints. (3) Verifier SEC-03/04/05 resolus. (4) MAJ metriques. (5) `git tag sprint-2-done`. (6) Score securite : 52 -> 62/100.
- **Tests** : Commandes workspace + verification fonctionnelle
- **Ref** : Jalon S2
- **SEC** : Score 62/100 atteint

---

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Sprint precedent : [sodomight-plan-S1-part2.md](sodomight-plan-S1-part2.md) | Sprint suivant : [sodomight-plan-S3.md](sodomight-plan-S3.md)
