# Sprint 3 -- Acte 1 complet (50 taches, 8-12j) -- Partie 1/2
<!-- @id: sodomight-plan-S3-part1 @do: sprint-3-plan @role: chef-dev @layer: 0 @human: miyuk -->

**TL;DR** : Partie 1 : MASS config + V3.1 (zones, waypoints, bestiary, SEC-08, GAP-05) + V3.2 (procgen, runewords, audio, menus, collision). 24 taches.

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Partie 2 : [sodomight-plan-S3-part2.md](sodomight-plan-S3-part2.md)

**Livrable** : 25+ zones, 6 quetes, boss Andariel, runewords, audio, procgen, GAP-05 collision. SEC-08/17/21.
**NC-01** : GAP-05 (collision-rich) integre ce sprint via TASK-149..153.
**NC-02** : SEC-09/16/18/19/20/22 integres via TASK-SEC-BATCH-MED.

## MASS Sprint 3

### DAG de dependances (ASCII)

```
TASK-121 (outdoor zones) ──> TASK-124 (procgen) ──> TASK-133 (Andariel)
TASK-122 (dungeons) ──────────────────────────────────────────────┘
TASK-123 (monastery) ─────────────────────────────────────────────┘
                                                                  │
TASK-125 (waypoints) ──> TASK-126 (town portal)                   │
TASK-127..132 (6 quetes) ──────────────────────────────────────> TASK-165 (gate)
TASK-134 (bestiary) ──> TASK-135 (champions)
TASK-136 (runewords) ────────────────────────────────────────────┘
TASK-137 (loot filter) ──────────────────────────────────────────┘
TASK-138..140 (audio) ───────────────────────────────────────────┘
TASK-141 (SEC-08 Rhai) ──────────────────────────────────────────┘
TASK-142..145 (menus) ───────────────────────────────────────────┘
TASK-146 (NPC dialogue) ──> TASK-147 (vendor) ───────────────────┘
TASK-148 (stash) ────────────────────────────────────────────────┘
TASK-149..153 (GAP-05 collision-rich) ── NC-01 ──────────────────┘
TASK-154 (SEC-BATCH-MED) ── NC-02 ──────────────────────────────-┘
TASK-160 (SEC-17 noms) ──────────────────────────────────────────┘
```

### Vagues d'execution

| Vague | Taches | Agents | Mode | Fichiers touches | Conflit | Duree est. |
|-------|--------|--------|------|-----------------|---------|------------|
| V3.1 | 121, 122, 123, 125, 134, 141, 149 | F, F, F, F, F, F, F | worktree swarm | world/zone.rs / world/chunk.rs / world/world_map.rs / world/waypoint.rs / content.rs / script/engine.rs / collision-rich/*.rs | 121/122/123 meme crate -> fichiers diff OK | 5h |
| V3.2 | 124, 126, 135, 136, 137, 138, 139, 140, 142, 143, 144, 145, 148, 150, 151, 152, 153 | F, F, F, F, L, L, L, L, L, L, L, L, L, F, F, F, F | worktree swarm (F/L//) | F: world/*.rs, items/*.rs, collision-rich/*.rs / L: ui/*.rs, audio/*.rs | F et L fichiers disjoints | 8h |
| V3.3 | 127, 128, 129, 130, 131, 132, 146, 160 | F (quetes seq) | subagent burst (quetes //) | quest/def.rs par quete (6 fichiers TOML separees) | Quetes independantes -> // | 4h |
| V3.4 | 133, 147, 154 | F, F, F | subagent burst | content.rs(boss) / trade/vendor.rs / multi-fichiers SEC batch | 133+147 fichiers diff OK | 3h |
| V3.5 | 165 | D | sequentiel | workspace | Gate | 1h |

### Strategie de merge

- V3.1 : 7 taches //, F seul mais fichiers disjoints. Denis merge. Checkpoint.
- V3.2 : F et L en //. Push apres merge. Checkpoint toutes 5 taches.
- V3.3 : 6 quetes + NPC + SEC-17 en //. Denis merge.
- V3.4 : Boss + vendor + SEC batch. Push.
- V3.5 : Gate sprint, tag `sprint-3-done`.
- Spot-checks : Victor sur SEC-08 (V3.1), SEC-17 (V3.3). Jean tokens budget.

---

### V3.1 -- Zones + Waypoints + Securite + GAP-05 (7 taches)

### TASK-121: Zones outdoor Act 1 (6 zones)
- **Crate(s)** : mge-arpg-world
- **Fichier(s)** : `crates/arpg/mge-arpg-world/src/zone.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [] | **Vague** : V3.1
- **Implementation** : (1) `ZoneDef` struct : id, name, level_range, tiles_x/y, connections Vec<ZoneId>, monster_families, ambient. (2) 6 zones outdoor : Blood Moor (lvl1-3), Cold Plains (lvl3-5), Stony Field (lvl4-6), Dark Wood (lvl5-7), Black Marsh (lvl6-8), Tamoe Highland (lvl8-10). (3) Connections bidirectionnelles entre zones adjacentes. (4) Chaque zone : liste de monster families autorisees.
- **Tests** : `cargo test -p mge-arpg-world -- act1_outdoor_6_zones` -- 6 zones. `zone_connections_bidirectional` -- A->B implique B->A.
- **Ref** : REF-02 Section 13 (zones Act 1)
- **SEC** : --

### TASK-122: Zones dungeons (12+ zones)
- **Crate(s)** : mge-arpg-world
- **Fichier(s)** : `crates/arpg/mge-arpg-world/src/chunk.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [] | **Vague** : V3.1
- **Implementation** : (1) 12+ zones dungeon : Den of Evil (1 level), Underground Passage (2 levels), Hole (2 levels), Pit (2 levels), Countess Tower (5 levels), Forgotten Tower (5 levels), Burial Grounds, Crypt, Mausoleum. (2) Chaque dungeon : entrance_zone, levels count, monster_level, is_optional. (3) Connection : outdoor zone -> dungeon entrance -> levels.
- **Tests** : `cargo test -p mge-arpg-world -- act1_dungeons_12_zones` -- 12+ zones. `dungeon_entrance_connected` -- chaque dungeon connecte a une outdoor.
- **Ref** : REF-02 Section 13.2
- **SEC** : --

### TASK-123: Zones Monastery (12 zones)
- **Crate(s)** : mge-arpg-world
- **Fichier(s)** : `crates/arpg/mge-arpg-world/src/world_map.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [] | **Vague** : V3.1
- **Implementation** : (1) 12 zones : Outer Cloister, Barracks, Jail L1-L3, Inner Cloister, Cathedral, Catacombs L1-L4 (Andariel). (2) `WorldMap::act1()` : assembler toutes zones (outdoor + dungeons + monastery) avec connections. (3) Progression lineaire : Outer Cloister -> Barracks -> Jail -> Cathedral -> Catacombs. (4) Andariel dans Catacombs L4.
- **Tests** : `cargo test -p mge-arpg-world -- monastery_12_zones` -- 12 zones. `world_map_act1_total` -- 30+ zones total. `catacombs_l4_boss` -- Andariel flag.
- **Ref** : REF-02 Section 13.3
- **SEC** : --

### TASK-125: Waypoints Act 1 (9 WP)
- **Crate(s)** : mge-arpg-world
- **Fichier(s)** : `crates/arpg/mge-arpg-world/src/waypoint.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [] | **Vague** : V3.1
- **Implementation** : (1) `Waypoint` struct : id, zone_id, position, activated. (2) 9 WP Act 1 : Rogue Encampment, Cold Plains, Stony Field, Dark Wood, Black Marsh, Outer Cloister, Jail L1, Inner Cloister, Catacombs L2. (3) `fn activate(wp_id)` : set activated = true, persist dans save. (4) `fn teleport(from_wp, to_wp)` : instantaneous si both activated. (5) Render : stone pillar sprite, glow si activated.
- **Tests** : `cargo test -p mge-arpg-world -- waypoint_activate` -- activated = true. `waypoint_teleport_both_active` -- OK. `waypoint_teleport_inactive` -- Err.
- **Ref** : REF-02 Section 14 (waypoints)
- **SEC** : --

### TASK-134: Bestiary Act 1 complet (~15 familles)
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/content.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [] | **Vague** : V3.1
- **Implementation** : (1) 15 families : Fallen (Shaman, melee), Zombie, Skeleton (warrior, archer, mage), Wendigo, Corrupted Rogue (melee, archer), Goatman (melee, fire), Brute, Tainted, Ghoul, Gargantuan Beast, Dark Hunter, Vile Hunter. (2) Chaque famille : base stats, attack type, resistances, drop TC, XP, animation set. (3) Organise par zone : Blood Moor = Fallen+Zombie, Cold Plains = Skeleton+Corrupted Rogue, etc.
- **Tests** : `cargo test -p sodomight -- bestiary_15_families` -- 15+ monster defs. `bestiary_zone_assignment` -- Blood Moor contient Fallen.
- **Ref** : REF-02 Section 8 (Act 1 bestiary)
- **SEC** : --

### TASK-141: SEC-08 -- Sandbox Rhai (max_map_size 256, max_expr_depth 32)
- **Crate(s)** : mge-script
- **Fichier(s)** : `crates/engine/mge-script/src/engine.rs`
- **Agent** : F | **Modele** : S (securite)
- **Deps** : [] | **Vague** : V3.1
- **Implementation** : (1) Dans `ScriptEngine::new()` : `engine.set_max_map_size(256)`. (2) `engine.set_max_expr_depth(32)`. (3) Verifier que `engine.set_max_string_size(65536)` est aussi present. (4) Tester qu'un script malicieux (map overflow, recursion profonde) est rejete. (5) `eval()` deja desactive (confirme dans audit Victor).
- **Tests** : `cargo test -p mge-script -- rhai_max_map_overflow` -- map >256 = Err. `rhai_max_expr_depth` -- recursion >32 = Err.
- **Ref** : SEC-08, analyse securite Victor, Context7 rhai 1.20
- **SEC** : SEC-08

### TASK-149: GAP-05 -- UnifiedCollider enum (NC-01)
- **Crate(s)** : mge-collision-rich
- **Fichier(s)** : `crates/engine/mge-collision-rich/src/lib.rs`
- **Agent** : F | **Modele** : S (integration)
- **Deps** : [] | **Vague** : V3.1
- **Implementation** : (1) `UnifiedCollider` enum : `Aabb(AabbCollider)`, `Circle(CircleCollider)`, `Capsule(CapsuleCollider)`, `Obb(ObbCollider)`. (2) `impl UnifiedCollider { fn bounding_aabb(&self) -> Aabb }` : AABB englobant pour broadphase. (3) Re-exporter depuis mge-collision-rich/src/lib.rs. (4) Integrer les types existants (circle.rs, capsule.rs, obb.rs) sous cette enum.
- **Tests** : `cargo test -p mge-collision-rich -- unified_collider_aabb_bound` -- chaque variante retourne un AABB englobant correct.
- **Ref** : GAP-05 tech-spec, NC-01
- **SEC** : --

---

### V3.2 -- Procgen + Runewords + Audio + Menus + Collision (17 taches, F//L)

### TASK-124: Generation procedurale tile-based
- **Crate(s)** : mge-arpg-world
- **Fichier(s)** : `crates/arpg/mge-arpg-world/src/tile.rs`
- **Agent** : F | **Modele** : O (algo complexe)
- **Deps** : [121] | **Vague** : V3.2
- **Implementation** : (1) `fn generate_zone(zone_def, seed) -> TileGrid` : algorithme "chemin principal + branches". (2) Etape 1 : random walk pour le chemin principal (entree -> sortie). (3) Etape 2 : branches secondaires (dead ends, loops). (4) Etape 3 : placer tiles (sol, murs, decorations) selon biome. (5) Etape 4 : placer spawn points monstres, items, events. (6) Seed par zone pour reproductibilite (derive du world seed).
- **Tests** : `cargo test -p mge-arpg-world -- procgen_path_connected` -- entree connectee a sortie. `procgen_deterministic` -- meme seed = meme map. `procgen_different_seed` -- seeds differents = maps differentes.
- **Ref** : Tech-spec procgen
- **SEC** : --

### TASK-126: Town Portal
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/world.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [125] | **Vague** : V3.2
- **Implementation** : (1) `fn cast_town_portal(player, current_zone) -> TownPortal`. (2) Animation cast 1.5s. (3) Creer portail bleu a la position du joueur. (4) Teleporter joueur en town. (5) Portail persiste : clic pour revenir a la zone. (6) Disparait apres retour ou changement de zone.
- **Tests** : `cargo test -p sodomight -- town_portal_roundtrip` -- aller-retour OK. `town_portal_disappear` -- disparait apres retour.
- **Ref** : REF-02 Section 14.2
- **SEC** : --

### TASK-135: Champions + Uniques monstres (3 affixes Normal)
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/content.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [134] | **Vague** : V3.2
- **Implementation** : (1) `MonsterRank` enum : Normal, Champion, Unique, SuperUnique. (2) Champion : +HP, +damage, +XP, 1-3 affixes (Extra Fast, Extra Strong, Aura Enchanted, etc.). (3) Unique (random boss) : nom aleatoire, 3 affixes Normal difficulty, minions. (4) `fn promote_monster(def, rank, rng) -> MonsterDef` : appliquer bonus. (5) Affixes : ~10 possibles (Teleportation, Spectral Hit, Stone Skin, Multishot, etc.).
- **Tests** : `cargo test -p sodomight -- champion_bonus_hp` -- champion HP > normal. `unique_3_affixes` -- 3 affixes en Normal.
- **Ref** : REF-02 Section 8.3 (champion/unique D2)
- **SEC** : --

### TASK-136: Runewords low-tier 2-3 runes
- **Crate(s)** : mge-arpg-items
- **Fichier(s)** : `crates/arpg/mge-arpg-items/src/equipment.rs`
- **Agent** : F | **Modele** : S (items)
- **Deps** : [093] | **Vague** : V3.2
- **Implementation** : (1) `RunewordDef` struct : name, runes Vec<RuneId>, base_types Vec<BaseType>, granted_stats. (2) 8 low-tier runewords : Steel (TirEl), Malice (IthElEth), Stealth (TalEth), Nadir (NefTir), Leaf (TirRal), Zephyr (OrtEth), Edge (TirTalAmn), Strength (AmnTir). (3) `fn check_runeword(item) -> Option<RunewordDef>` : verifie runes dans l'ordre + base type correct. (4) Si match : appliquer stats bonus, changer nom.
- **Tests** : `cargo test -p mge-arpg-items -- runeword_steel_match` -- TirEl dans sword = Steel. `runeword_wrong_order` -- ElTir = pas de match. `runeword_wrong_base` -- Steel dans armor = pas de match.
- **Ref** : REF-02 Section 6.7 (runewords D2)
- **SEC** : --

### TASK-137: Loot filter basique (toggle par qualite)
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/inventory.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) `LootFilter` struct : show_normal, show_magic, show_rare, show_set, show_unique, show_gold. (2) Toggle par touche (ex: Alt+N pour Normal). (3) Items filtres : labels au sol invisibles, items non-ramassables. (4) Persist dans config locale. (5) Visual : icone filtre dans HUD corner.
- **Tests** : `cargo test -p mge-ui -- loot_filter_hide_normal` -- Normal masque. `loot_filter_show_all` -- tout visible par defaut.
- **Ref** : REF-02 Section 11.11
- **SEC** : --

### TASK-138: Audio BGM Act 1 par zone
- **Crate(s)** : mge-audio
- **Fichier(s)** : `crates/engine/mge-audio/src/bgm.rs`
- **Agent** : L | **Modele** : Ha (assets)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) `BgmMap` : HashMap<ZoneId, BgmId>. (2) Mapping : Town=tristram, Outdoor=wilderness, Dungeon=dungeon, Monastery=monastery, Boss=boss_andariel. (3) Zone change -> crossfade BGM (1s). (4) Preload les BGM Act 1 au chargement.
- **Tests** : `cargo test -p mge-audio -- bgm_zone_mapping` -- chaque zone a un BGM assigne.
- **Ref** : mge-audio bgm.rs existant
- **SEC** : --

### TASK-139: Audio SFX Act 1
- **Crate(s)** : mge-audio
- **Fichier(s)** : `crates/engine/mge-audio/src/sfx.rs`
- **Agent** : L | **Modele** : Ha (assets)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) SFX bank Act 1 : ~15 sons (melee_hit, spell_cast, arrow_fly, monster_death, portal_open, waypoint_activate, potion_drink, level_up, quest_complete, door_open, chest_open, gold_pickup, item_drop, item_identify, town_portal). (2) Mapper CombatEvent/GameEvent -> SfxId. (3) Volume falloff par distance (simple linear).
- **Tests** : `cargo test -p mge-audio -- sfx_bank_15_sounds` -- 15 SFX enregistres. `sfx_event_mapping` -- CombatEvent::Hit -> melee_hit.
- **Ref** : mge-audio sfx.rs existant
- **SEC** : --

### TASK-140: Audio ambiance zones
- **Crate(s)** : mge-audio
- **Fichier(s)** : `crates/engine/mge-audio/src/manager.rs`
- **Agent** : L | **Modele** : Ha (assets)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) Ambiance par zone type : outdoor=birds+wind, dungeon=drips+echoes, town=crowd+fire, monastery=choir. (2) Jouer en parallele du BGM, volume plus bas (-12dB). (3) Crossfade 2s au changement de zone. (4) Loopable.
- **Tests** : `cargo test -p mge-audio -- ambient_zone_type` -- chaque type a un ambient assigne.
- **Ref** : mge-audio manager.rs
- **SEC** : --

### TASK-142: Menu principal
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/menus/` (nouveau sous-dossier)
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) Logo Sodomight + fond anime. (2) Boutons : Single Player, Multiplayer (grayed S0-S3), Options, Credits, Exit. (3) Single Player -> Character Select. (4) Options : Volume, Resolution, Fullscreen, Keybinds.
- **Tests** : `cargo test -p mge-ui -- main_menu_buttons` -- 5 boutons presents.
- **Ref** : REF-02 Section 15 (menus)
- **SEC** : --

### TASK-143: Menu character select
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/menus/`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) Liste personnages sauvegardes (nom, classe, level). (2) Preview : sprite idle + stats resume. (3) Boutons : Create New, Delete, Play. (4) Max 8 personnages. (5) Delete : confirmation dialog.
- **Tests** : `cargo test -p mge-ui -- char_select_max_8` -- >8 = Create disable.
- **Ref** : REF-02 Section 15.2
- **SEC** : --

### TASK-144: Menu pause
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/menus/`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) Touche Escape = pause (single player uniquement). (2) Boutons : Resume, Save, Options, Quit to Menu, Quit to Desktop. (3) Game loop arretee pendant pause. (4) Overlay semi-transparent.
- **Tests** : `cargo test -p mge-ui -- pause_menu_stops_game` -- game_paused = true.
- **Ref** : REF-02 Section 15.3
- **SEC** : --

### TASK-145: Menu creation personnage
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/menus/`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) Selection classe (7, seul Necro jouable S3). (2) Input nom personnage (2-24 chars, SEC-17). (3) Preview sprite + base stats. (4) Difficulte : Normal (seul dispo initialement). (5) Bouton Create -> spawn en town.
- **Tests** : `cargo test -p mge-ui -- create_char_name_validation` -- <2 ou >24 = Err. `create_char_necro_only_s3` -- seul Necro selectable.
- **Ref** : REF-02 Section 15.4, SEC-17
- **SEC** : SEC-17 (validation nom)

### TASK-148: Stash 1 page 10x10
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/inventory.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V3.2
- **Implementation** : (1) Stash = grille 10x10 (100 slots). (2) Accessible uniquement en town (clic NPC Stash). (3) Drag&drop entre inventaire et stash. (4) Meme logique placement que TASK-101 (verifier espace libre). (5) Persist dans save (table `stash` en DB).
- **Tests** : `cargo test -p mge-ui -- stash_10x10` -- 100 slots. `stash_town_only` -- hors town = Err.
- **Ref** : REF-02 Section 11.12
- **SEC** : --

### TASK-150: GAP-05 -- Broadphase SpatialGrid + UnifiedCollider (NC-01)
- **Crate(s)** : mge-collision-rich, mge-collision
- **Fichier(s)** : `crates/engine/mge-collision-rich/src/intersect.rs`, `crates/engine/mge-collision/src/grid.rs`
- **Agent** : F | **Modele** : S (algo)
- **Deps** : [149] | **Vague** : V3.2
- **Implementation** : (1) `SpatialGrid::insert(entity_id, unified_collider)` : inserer AABB englobant de UnifiedCollider. (2) `SpatialGrid::query_pairs() -> Vec<(EntityId, EntityId)>` : broadphase candidates. (3) Pour chaque paire candidate : `narrowphase_intersect(a: &UnifiedCollider, b: &UnifiedCollider) -> bool` dispatch selon les 2 types.
- **Tests** : `cargo test -p mge-collision-rich -- broadphase_narrowphase_circle_aabb` -- cercle chevauchant AABB = true. `broadphase_no_overlap` -- entites loin = 0 paires.
- **Ref** : GAP-05, NC-01
- **SEC** : --

### TASK-151: GAP-05 -- Circle-Circle intersection (NC-01)
- **Crate(s)** : mge-collision-rich
- **Fichier(s)** : `crates/engine/mge-collision-rich/src/circle.rs`
- **Agent** : F | **Modele** : S (algo)
- **Deps** : [149] | **Vague** : V3.2
- **Implementation** : (1) `fn circle_circle_intersect(a: &Circle, b: &Circle) -> bool` : `dist_sq(a.center, b.center) <= (a.radius + b.radius)^2`. (2) Gerer cas degenere radius=0. (3) Retourner aussi penetration depth et normal si necessaire.
- **Tests** : `cargo test -p mge-collision-rich -- circle_circle_overlap` -- centres proches = true. `circle_circle_apart` -- centres loin = false.
- **Ref** : GAP-05, NC-01
- **SEC** : --

### TASK-152: GAP-05 -- Capsule-AABB intersection (NC-01)
- **Crate(s)** : mge-collision-rich
- **Fichier(s)** : `crates/engine/mge-collision-rich/src/capsule.rs`
- **Agent** : F | **Modele** : S (algo)
- **Deps** : [149] | **Vague** : V3.2
- **Implementation** : (1) `fn capsule_aabb_intersect(cap: &Capsule, aabb: &Aabb) -> bool`. (2) Capsule = segment + radius. (3) Closest point on segment to AABB center, puis distance check avec radius.
- **Tests** : `cargo test -p mge-collision-rich -- capsule_aabb_overlap` -- chevauchement = true. `capsule_aabb_miss` -- separation = false.
- **Ref** : GAP-05, NC-01
- **SEC** : --

### TASK-153: GAP-05 -- Dispatch narrowphase complet (NC-01)
- **Crate(s)** : mge-collision-rich
- **Fichier(s)** : `crates/engine/mge-collision-rich/src/intersect.rs`
- **Agent** : F | **Modele** : S (integration)
- **Deps** : [150, 151, 152] | **Vague** : V3.2
- **Implementation** : (1) `fn narrowphase_intersect(a: &UnifiedCollider, b: &UnifiedCollider) -> bool` : match sur (a, b) -> dispatch vers circle_circle, capsule_aabb, aabb_aabb, obb_obb, etc. (2) Couvrir les 10 combinaisons (4 types x 4 / symmetrie). (3) Si combinaison non implementee : fallback sur AABB-AABB.
- **Tests** : `cargo test -p mge-collision-rich -- dispatch_all_pairs` -- 10 combinaisons testees (ou fallback). GAP-05 total : 6-8 tests.
- **Ref** : GAP-05, NC-01
- **SEC** : --

---

> Suite dans : [sodomight-plan-S3-part2.md](sodomight-plan-S3-part2.md) (V3.3 a V3.5 : quetes, boss, vendor, SEC batch)
> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md)
