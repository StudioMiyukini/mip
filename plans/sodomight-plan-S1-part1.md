# Sprint 1 -- Boucle de combat (50 taches, 5-8j) -- Partie 1/2
<!-- @id: sodomight-plan-S1-part1 @do: sprint-1-plan @role: chef-dev @layer: 0 @human: miyuk -->

**TL;DR** : Necro jouable, combat D2, loot, HUD, save/load. SEC-01/02 resolus. Partie 1 : MASS config + V1.1 a V1.4 (17 taches).

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Partie 2 : [sodomight-plan-S1-part2.md](sodomight-plan-S1-part2.md)

**Livrable** : Necro jouable, combat D2, loot, HUD, save/load. SEC-01/02 resolus.

## MASS Sprint 1

### DAG de dependances (ASCII)

```
TASK-031 (SEC-01 RNG) ───────────────────────────────────────────────────> TASK-046 (drop table)
TASK-032 (SEC-02 auth) ──────────────────────────────────────> TASK-067 (save char)
TASK-033 (Necro stats) ──> TASK-035 (spawner) ──> TASK-042 (IA FSM) ──> TASK-043 (monstres)
       │                         │                      │                    │
       └──> TASK-036 (hit chance) ──> TASK-037 (phys dmg) ──> TASK-038 (elem dmg)
                                           │                       │
                                      TASK-039 (CombatProcessor) <─┘
                                           │
                    ┌──────────────────────┼────────────────────────┐
                    v                      v                        v
              TASK-040 (skills)      TASK-044 (status)       TASK-045 (ECS combat)
                    │                                              │
              TASK-041 (activation)                          TASK-071 (integration)
                    │                                              │
              TASK-058 (skill bar UI)                        TASK-075 (smoke test)

TASK-034 (XP table) ──> TASK-059 (XP bar UI)

TASK-046 ──> TASK-047 (items) ──> TASK-048 (quality) ──> TASK-049 (item drop) ──> TASK-050 (gold)

TASK-056..061 (HUD batch, parallele) ──> TASK-062 (tests UI)

TASK-066 (audio) ─────────────────────────────────────────────> TASK-071
TASK-067 ──> TASK-068 (save items)
```

### Vagues d'execution

| Vague | Taches | Agents | Mode | Fichiers touches | Conflit potentiel | Duree est. |
|-------|--------|--------|------|-----------------|-------------------|------------|
| V1.1 | 031, 032, 033, 034 | F, F, F, F | worktree swarm | world.rs / accounts.rs / entity/*.rs,stats/*.rs / stats/level.rs | 033+034 meme crate stats -> fichiers diff (character.rs vs level.rs) OK | 3h |
| V1.2 | 035, 036 | F, F | subagent burst | sodomight/content.rs / combat/calculator.rs | Fichiers disjoints OK | 2h |
| V1.3 | 037, 038, 039, 040, 041, 042 | F (seq chain) | sequentiel | combat/damage.rs -> combat/processor.rs -> skills/def.rs -> skills/book.rs -> ai/state.rs,agent.rs | Chaine deps -> seq obligatoire | 6h |
| V1.4 | 043, 044, 045, 046, 047 | F, F, F, F, F | subagent burst | content.rs / combat/status.rs / world.rs / loot/registry.rs / items/instance.rs,quality.rs | 043+045 sur world.rs -> sequentialiser 043 puis 045 | 4h |
| V1.5 | 048, 049, 050, 056, 057, 058, 059, 060, 061 | F, F, F, L, L, L, L, L, L | worktree swarm | loot/quality.rs / entity/item_drop.rs / trade/wallet.rs / ui/hud.rs / ui/hud.rs(belt) / ui/skill_tree.rs / ui/hud.rs(xp) / ui/dialog.rs / ui/minimap.rs | L : 056/057/059 meme fichier hud.rs -> seq L (056->057->059), 058/060/061 paralleles | 5h |
| V1.6 | 062, 066, 067, 068 | L, F, F, F | worktree swarm | ui/tests / audio/manager.rs / save/characters.rs / save/items.rs | Fichiers disjoints OK | 3h |
| V1.7 | 071, 072, 073 | F+L, L, F | sequentiel | game.rs / render/overhead.rs / world.rs | Integration -> seq | 3h |
| V1.8 | 075, 080 | D, D | sequentiel | workspace | Gate | 1h |

### Strategie de merge

- V1.1 : 4 taches //, Denis merge. Checkpoint build+test crates modifies.
- V1.2-V1.3 : Seq, commit par tache. Push apres V1.3 (checkpoint 5 taches).
- V1.4 : 5 taches, 043 puis 045 seq (meme fichier), reste //. Denis merge.
- V1.5 : 9 taches, F et L en //. L sequentialise hud.rs (056->057->059). Denis merge F+L.
- V1.6-V1.7 : Push apres V1.6. V1.7 integration seq.
- V1.8 : Gate sprint, tag `sprint-1-done`.
- Spot-checks : Victor sur SEC-01/02 (V1.1). Jean tokens/ligne sur V1.3 (chaine longue).

### Metriques cibles

| Metrique | Cible |
|----------|-------|
| Tokens total S1 | ~250k (F: 180k S/O, L: 50k S, D: 20k S) |
| Tests nouveaux | ~40 (combat: 15, loot: 8, UI: 15, save: 2) |
| SEC resolus | SEC-01, SEC-02 (score 42->52) |

---

### V1.1 -- Securite + fondations gameplay (4 taches, paralleles)

### TASK-031: SEC-01 -- Remplacer DEBUG_SEED par ChaCha8Rng::from_entropy()
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/world.rs` (lignes 44, 271)
- **Agent** : F | **Modele** : S (securite)
- **Deps** : [] | **Vague** : V1.1
- **Implementation** : (1) Supprimer `const DEBUG_SEED: u64 = 0xDEAD_BEEF_CAFE`. (2) Remplacer `ChaCha8Rng::seed_from_u64(DEBUG_SEED)` par `ChaCha8Rng::from_entropy()` aux lignes 44 et 271. (3) Ajouter `#[cfg(test)] fn test_rng() -> ChaCha8Rng { ChaCha8Rng::seed_from_u64(42) }` pour tests deterministes. (4) Ajouter feature flag `--debug-seed` via clap pour debug local uniquement.
- **Tests** : `cargo test -p sodomight -- rng_not_deterministic` -- 2 runs donnent des resultats differents. Verifier `grep -r "DEBUG_SEED" mge/` retourne 0 resultat.
- **Ref** : SEC-01 (DREAD 9.4), analyse securite Victor L-01
- **SEC** : SEC-01

### TASK-032: SEC-02 -- Hashing argon2 mot de passe
- **Crate(s)** : mge-save
- **Fichier(s)** : `crates/engine/mge-save/src/accounts.rs`, `crates/engine/mge-save/Cargo.toml`
- **Agent** : F | **Modele** : S (securite)
- **Deps** : [] | **Vague** : V1.1
- **Implementation** : (1) Ajouter `argon2 = "0.5"` et `password-hash = "0.5"` dans Cargo.toml. (2) Dans `AccountDal::create()` : `Argon2::default().hash_password(password.as_bytes(), &salt)` avec `SaltString::generate(&mut OsRng)`. (3) Dans `AccountDal::verify()` : `Argon2::default().verify_password(password.as_bytes(), &hash)`. (4) Stocker le hash PHC string en DB (colonne `password_hash TEXT NOT NULL`). (5) Migration SQLite : `ALTER TABLE accounts ADD COLUMN password_hash TEXT`.
- **Tests** : `cargo test -p mge-save -- account_hash_verify` -- hash + verify roundtrip. `account_wrong_password` -- verify echoue.
- **Ref** : SEC-02 (DREAD 9.2), analyse securite Victor A-01
- **SEC** : SEC-02

### TASK-033: Necromancer stats de base + CharacterClass
- **Crate(s)** : mge-arpg-stats, mge-arpg-entity
- **Fichier(s)** : `crates/arpg/mge-arpg-stats/src/base.rs`, `crates/arpg/mge-arpg-entity/src/character.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [] | **Vague** : V1.1
- **Implementation** : (1) Enum `CharacterClass { Necromancer, Sorceress, Paladin, Amazon, Barbarian, Druid, Assassin }`. (2) `BaseStats::for_class(CharacterClass::Necromancer)` : STR=15, DEX=25, VIT=15, ENE=25. (3) `DerivedStats::compute(base, level)` : HP = base_hp + vit_per_hp * vit, ou base_hp=45, vit_per_hp=2 pour Necro. Mana = base_mana + ene_per_mana * ene, base_mana=25, ene_per_mana=2. (4) Stat points par level = 5. (5) Stocker dans composant ECS `CharacterStats`.
- **Tests** : `cargo test -p mge-arpg-stats -- necro_base_stats` -- STR=15,DEX=25,VIT=15,ENE=25. `necro_hp_level_1` -- HP=45.
- **Ref** : REF-02 Section 3 (classes D2)
- **SEC** : --

### TASK-034: Experience table 1-99
- **Crate(s)** : mge-arpg-stats
- **Fichier(s)** : `crates/arpg/mge-arpg-stats/src/level.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [] | **Vague** : V1.1
- **Implementation** : (1) `const XP_TABLE: [u64; 99]` avec formule D2 : `xp(n) = xp(n-1) + ((n-1)^3 + n*5 + 14) * ((n-1) + 1)`. (2) `xp_table[98] = 3_520_485_254` (level 99). (3) `fn level_for_xp(xp: u64) -> u8` : recherche binaire dans XP_TABLE. (4) `fn xp_for_level(level: u8) -> u64`. (5) `fn xp_progress(xp: u64) -> f32` : pourcentage vers prochain level (0.0..1.0).
- **Tests** : `cargo test -p mge-arpg-stats -- xp_level_99` -- xp_for_level(99) == 3_520_485_254. `xp_level_1` -- xp_for_level(1) == 0. `xp_progress_half` -- 50% entre deux levels.
- **Ref** : REF-02 Section 5 (XP D2)
- **SEC** : --

---

### V1.2 -- Spawner + Hit chance (2 taches)

### TASK-035: Spawner entites (spawn_character + spawn_monster)
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/content.rs`, `games/sodomight/src/world.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [033] | **Vague** : V1.2
- **Implementation** : (1) `spawn_character(world, class, position) -> EntityId` : insere composants Position, CharacterStats, Animation, Sprite, Collision, Path dans ECS. (2) `spawn_monster(world, monster_def, position) -> EntityId` : idem avec MonsterStats, AiState, DropTable. (3) `MonsterDef` struct : name, base_stats, speed, aggro_range, skills, drop_table_id. (4) Hardcode 3 MonsterDef : Fallen (faible), Zombie (lent), Skeleton (moyen).
- **Tests** : `cargo test -p sodomight -- spawn_character_components` -- entite a tous les composants. `spawn_monster_fallen` -- Fallen a stats correctes.
- **Ref** : Tech-spec E-02
- **SEC** : --

### TASK-036: Hit chance D2 -- formule CTH
- **Crate(s)** : mge-arpg-combat
- **Fichier(s)** : `crates/arpg/mge-arpg-combat/src/calculator.rs`
- **Agent** : F | **Modele** : S (formules)
- **Deps** : [033] | **Vague** : V1.2
- **Implementation** : (1) `fn hit_chance(ar: i32, dr: i32, alvl: u8, dlvl: u8) -> f32` : `CTH = clamp(200.0 * ar as f32 / (ar + dr) as f32 * alvl as f32 / (alvl + dlvl) as f32, 5.0, 95.0)`. (2) Gerer cas ar=0 -> CTH=5%. (3) Gerer cas dr=0 -> CTH=95%. (4) `fn roll_hit(rng: &mut impl Rng, cth: f32) -> bool` : `rng.gen::<f32>() < cth / 100.0`.
- **Tests** : `cargo test -p mge-arpg-combat -- hit_chance_min_5` -- ar=0 -> 5%. `hit_chance_max_95` -- ar=9999,dr=1 -> 95%. `hit_chance_equal` -- ar=dr, alvl=dlvl -> ~100% * 50% = ~50%.
- **Ref** : REF-02 Section 7 (combat D2)
- **SEC** : --

---

### V1.3 -- Pipeline combat (6 taches, chaine sequentielle)

### TASK-037: Pipeline degats physiques D2
- **Crate(s)** : mge-arpg-combat
- **Fichier(s)** : `crates/arpg/mge-arpg-combat/src/damage.rs`
- **Agent** : F | **Modele** : S (formules)
- **Deps** : [033] | **Vague** : V1.3
- **Implementation** : (1) `fn physical_damage(base_min: i32, base_max: i32, str_bonus: f32, skill_bonus: f32, crit_mult: f32, rng) -> i32`. (2) Formule D2 : `base = rng.gen_range(min..=max)`, `total = base * (1.0 + str_bonus/100.0) * (1.0 + skill_bonus/100.0)`. (3) Critical strike : `if rng.gen::<f32>() < crit_chance { total *= crit_mult }`. (4) Defense : `reduced = total * (1.0 - defense_factor)` ou `defense_factor = defense / (defense + 200 + 8*alvl)`.
- **Tests** : `cargo test -p mge-arpg-combat -- phys_damage_range` -- resultat entre min et max*bonuses. `phys_damage_defense_reduces` -- avec defense > 0, damage < base.
- **Ref** : REF-02 Section 7.2 (physical damage D2)
- **SEC** : --

### TASK-038: Pipeline degats elementaux (6 types)
- **Crate(s)** : mge-arpg-combat
- **Fichier(s)** : `crates/arpg/mge-arpg-combat/src/damage.rs`
- **Agent** : F | **Modele** : S (formules)
- **Deps** : [037] | **Vague** : V1.3
- **Implementation** : (1) Enum `DamageType { Physical, Fire, Cold, Lightning, Poison, Magic }`. (2) `fn elemental_damage(base: i32, elem_type, resist_pct: i32, absorb: i32) -> i32` : `reduced = base * (100 - resist_pct) / 100 - absorb`. (3) Resist clamp : -100% .. +75% (Hell penalty applied before). (4) Poison special : damage = total / duration (DoT over frames). (5) Cold special : slow_pct applique a la vitesse cible.
- **Tests** : `cargo test -p mge-arpg-combat -- elem_fire_resist_50` -- 50% resist = moitie degats. `elem_resist_cap_75` -- >75% resist clamp a 75%. `elem_poison_dot` -- poison reparti sur duration.
- **Ref** : REF-02 Section 7.3 (elemental damage D2)
- **SEC** : --

### TASK-039: CombatProcessor -- execution attaque complete
- **Crate(s)** : mge-arpg-combat
- **Fichier(s)** : `crates/arpg/mge-arpg-combat/src/processor.rs`
- **Agent** : F | **Modele** : S (integration combat)
- **Deps** : [036, 037, 038] | **Vague** : V1.3
- **Implementation** : (1) `CombatProcessor::process_attack(attacker, defender, skill, rng) -> AttackResult`. (2) Pipeline : roll hit (036) -> si touche : compute damage par type (037/038) -> apply defense -> apply resist -> apply absorb -> deduire HP. (3) `AttackResult { hit: bool, damages: Vec<(DamageType, i32)>, crit: bool, killed: bool }`. (4) Emettre `CombatEvent::Hit/Miss/Kill` via EventBus.
- **Tests** : `cargo test -p mge-arpg-combat -- processor_full_attack` -- attaque complete avec resultat. `processor_miss` -- miss si AR=0. `processor_kill` -- killed si HP <= 0.
- **Ref** : REF-02 Section 7 (combat flow)
- **SEC** : --

### TASK-040: 3 skills Necro -- Bone Spear, Raise Skeleton, Corpse Explosion
- **Crate(s)** : mge-arpg-skills
- **Fichier(s)** : `crates/arpg/mge-arpg-skills/src/def.rs`, `crates/arpg/mge-arpg-skills/src/registry.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [039] | **Vague** : V1.3
- **Implementation** : (1) `SkillDef` struct : id, name, tree, mana_cost, cooldown_ms, damage_type, base_damage, synergy_ids. (2) `SkillRegistry::register(SkillDef)` + `get(SkillId)`. (3) Bone Spear : Magic damage, projectile, mana=7, base_dmg=15-17 lvl1, +5/lvl. (4) Raise Skeleton : Summon type, mana=6, summon_count=1 lvl1, max=skelevel/3+2. (5) Corpse Explosion : fire+physical, AoE, mana=15, dmg=60-100% corpse HP.
- **Tests** : `cargo test -p mge-arpg-skills -- bone_spear_def` -- stats correctes. `raise_skeleton_max_count` -- max summons = (level/3)+2. `registry_get` -- enregistre et retrouve.
- **Ref** : REF-02 Section 4 (Necromancer skills)
- **SEC** : --

### TASK-041: Skill activation + mana cost + cooldown
- **Crate(s)** : mge-arpg-skills
- **Fichier(s)** : `crates/arpg/mge-arpg-skills/src/book.rs`, `crates/arpg/mge-arpg-skills/src/cooldown.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [040] | **Vague** : V1.3
- **Implementation** : (1) `SkillBook` : HashMap<SkillId, u8> (skill -> level invest). (2) `fn can_use(skill_id, mana, cooldowns) -> bool` : verifie mana >= cost ET cooldown elapsed. (3) `fn activate(skill_id, book, stats) -> SkillActivation` : deduire mana, demarrer cooldown, retourner DamageRequest ou SummonRequest. (4) `CooldownTracker` : HashMap<SkillId, Instant>, tick via `update(dt)`.
- **Tests** : `cargo test -p mge-arpg-skills -- activate_mana_check` -- pas assez mana = Err. `activate_cooldown` -- 2e activation pendant cooldown = Err. `activate_success` -- mana deduite, cooldown demarre.
- **Ref** : REF-02 Section 4.1 (skill activation)
- **SEC** : --

### TASK-042: IA monstre FSM (Idle->Chase->Attack->Flee->Dead)
- **Crate(s)** : mge-arpg-ai
- **Fichier(s)** : `crates/arpg/mge-arpg-ai/src/state.rs`, `crates/arpg/mge-arpg-ai/src/agent.rs`
- **Agent** : F | **Modele** : S (IA)
- **Deps** : [035] | **Vague** : V1.3
- **Implementation** : (1) Enum `AiState { Idle, Chase, Attack, Flee, Dead }`. (2) `AiAgent::tick(self_pos, target_pos, hp, aggro_range, attack_range)` : transitions Idle -> Chase si target dans aggro_range. Chase -> Attack si dans attack_range. Attack -> Chase si target hors attack_range. Any -> Flee si hp < 20%. Any -> Dead si hp <= 0. (3) Chase : A* vers target, move. (4) Attack : timer entre attaques (attack_speed), declenche CombatProcessor.
- **Tests** : `cargo test -p mge-arpg-ai -- fsm_idle_to_chase` -- aggro range trigger. `fsm_flee_low_hp` -- <20% HP = flee. `fsm_dead` -- 0 HP = dead.
- **Ref** : Tech-spec E-03
- **SEC** : --

---

### V1.4 -- Monstres + Status + Loot (5 taches)

### TASK-043: 3 monstres Act 1 -- Fallen, Zombie, Skeleton
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/content.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [042] | **Vague** : V1.4
- **Implementation** : (1) `fn fallen_def() -> MonsterDef` : HP=8-10, AR=20, speed=6, aggro=8 tiles, attack=melee, drop=TC1. (2) `fn zombie_def() -> MonsterDef` : HP=20-25, AR=12, speed=2.5, slow, poison attack, drop=TC2. (3) `fn skeleton_def() -> MonsterDef` : HP=15-18, AR=30, speed=4, melee+block, drop=TC3. (4) Chaque def inclut animation_set, collision_box, XP reward.
- **Tests** : `cargo test -p sodomight -- fallen_stats` -- HP dans range. `zombie_slow` -- speed < 3. `skeleton_ar` -- AR=30.
- **Ref** : REF-02 Section 8 (Act 1 monsters)
- **SEC** : --

### TASK-044: StatusEffect -- poison DoT, cold slow, cursed
- **Crate(s)** : mge-arpg-combat
- **Fichier(s)** : `crates/arpg/mge-arpg-combat/src/status.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [039] | **Vague** : V1.4
- **Implementation** : (1) Enum `StatusType { Poison, Cold, Cursed, Amp, Decrepify }`. (2) `StatusEffect { kind, remaining_ms, potency }`. (3) `StatusTracker` : Vec<StatusEffect>. `tick(dt)` : decremente timers, applique effets. Poison : `hp -= potency * dt`. Cold : `speed *= (1.0 - potency)`. Cursed : `phys_resist -= 25`. (4) `apply(effect)` : si meme type, refresh duration (pas stack). (5) `is_affected(kind) -> bool`.
- **Tests** : `cargo test -p mge-arpg-combat -- poison_dot_ticks` -- HP decremente chaque tick. `cold_slow_speed` -- speed reduite. `status_expire` -- effet disparait apres duration.
- **Ref** : REF-02 Section 7.4 (status effects D2)
- **SEC** : --

### TASK-045: Integration combat ECS -- CombatSystem dans FixedUpdate
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/world.rs`
- **Agent** : F | **Modele** : S (integration)
- **Deps** : [039, 042, 044] | **Vague** : V1.4
- **Implementation** : (1) `CombatSystem::tick(world, dt)` enregistre dans SystemScheduler a FixedUpdate (25Hz). (2) Pour chaque entite avec AiAgent : tick IA, si Attack -> CombatProcessor. (3) Pour chaque entite avec StatusTracker : tick statuts. (4) Nettoyer entites Dead (marquer pour suppression). (5) Emettre events via EventBus : Hit, Miss, Kill, XpGain.
- **Tests** : `cargo test -p sodomight -- combat_system_kills_monster` -- monstre 1HP + attaque = dead event. `combat_system_xp_gain` -- kill = XP ajoutee.
- **Ref** : Tech-spec E-02, E-03
- **SEC** : --

### TASK-046: Drop table Act 1 -- Treasure Classes
- **Crate(s)** : mge-arpg-loot
- **Fichier(s)** : `crates/arpg/mge-arpg-loot/src/registry.rs`
- **Agent** : F | **Modele** : S (loot)
- **Deps** : [031] | **Vague** : V1.4
- **Implementation** : (1) `TreasureClass` struct : id, entries Vec<(LootEntry, u16 weight)>, no_drop_weight. (2) 8 TCs : TC1 (Fallen, mostly junk) -> TC8 (Andariel, guaranteed drop). (3) `LootEntry` enum : `Gold(range)`, `Item(QualityRoll)`, `Nested(TcId)`. (4) `fn roll_drop(tc, rng) -> Option<LootEntry>` : weighted random, NoDrop = poids specifique. (5) Gold formule : `base * (1 + mlvl/10)`.
- **Tests** : `cargo test -p mge-arpg-loot -- tc1_no_drop_common` -- TC1 NoDrop > 50%. `tc8_guaranteed` -- TC8 NoDrop = 0. `gold_scales_mlvl` -- mlvl 10 > mlvl 1.
- **Ref** : REF-02 Section 9 (loot system D2)
- **SEC** : -- (utilise RNG from_entropy via SEC-01)

### TASK-047: Items Normal/Magic -- generation affixes
- **Crate(s)** : mge-arpg-items
- **Fichier(s)** : `crates/arpg/mge-arpg-items/src/instance.rs`, `crates/arpg/mge-arpg-items/src/quality.rs`
- **Agent** : F | **Modele** : S (items)
- **Deps** : [046] | **Vague** : V1.4
- **Implementation** : (1) `ItemInstance` struct : base_id, quality, affixes Vec<Affix>, sockets, identified. (2) `ItemQuality` enum : Normal, Magic, Rare, Set, Unique. (3) Magic items : 1 prefix + 0-1 suffix. `Affix` struct : id, stat_mod, value_range. (4) `fn generate_magic_item(base, alvl, rng) -> ItemInstance` : roll prefix pool filtre par alvl, roll suffix pool. (5) Pool affixes : ~20 prefixes (stat+, resist, damage), ~15 suffixes (speed, leech, mana).
- **Tests** : `cargo test -p mge-arpg-items -- magic_item_has_prefix` -- au moins 1 prefix. `magic_item_alvl_filter` -- alvl 1 ne genere pas affixes haut level. `normal_item_no_affix` -- Normal = 0 affixes.
- **Ref** : REF-02 Section 6 (item system D2)
- **SEC** : --

---

> Suite dans : [sodomight-plan-S1-part2.md](sodomight-plan-S1-part2.md) (V1.5 a V1.8)
> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md)
