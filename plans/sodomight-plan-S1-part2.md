# Sprint 1 -- Boucle de combat (50 taches, 5-8j) -- Partie 2/2
<!-- @id: sodomight-plan-S1-part2 @do: sprint-1-plan @role: chef-dev @layer: 0 @human: miyuk -->

**TL;DR** : Suite Sprint 1 : V1.5 (Quality + Gold + HUD), V1.6 (Tests + Audio + Save), V1.7 (Integration), V1.8 (Gate). 18 taches.

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Partie 1 : [sodomight-plan-S1-part1.md](sodomight-plan-S1-part1.md)

---

### V1.5 -- Quality + Gold + HUD (9 taches, F et L en parallele)

### TASK-048: Quality rolling -- MF diminishing returns
- **Crate(s)** : mge-arpg-loot
- **Fichier(s)** : `crates/arpg/mge-arpg-loot/src/quality.rs`
- **Agent** : F | **Modele** : S (formules)
- **Deps** : [047] | **Vague** : V1.5
- **Implementation** : (1) `fn effective_mf(raw_mf: i32, quality: ItemQuality) -> i32` : Unique = `raw * 250 / (raw + 250)`, Set = `raw * 500 / (raw + 500)`, Rare = `raw * 600 / (raw + 600)`. (2) `fn roll_quality(mlvl, mf, rng) -> ItemQuality` : Unique chance = base_unique * (1 + eff_mf/100), cascade : Unique -> Set -> Rare -> Magic -> Normal. (3) Base chances : Unique=1/400, Set=1/160, Rare=1/16, Magic=1/4.
- **Tests** : `cargo test -p mge-arpg-loot -- mf_diminishing_unique` -- 1000 raw MF -> effective ~200 pour Unique. `quality_cascade` -- si Unique echoue, tente Set, etc.
- **Ref** : REF-02 Section 9.3 (MF D2)
- **SEC** : --

### TASK-049: Item drop au sol -- loot visible + ramassage clic
- **Crate(s)** : sodomight, mge-arpg-entity
- **Fichier(s)** : `games/sodomight/src/world.rs`, `crates/arpg/mge-arpg-entity/src/item_drop.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [048] | **Vague** : V1.5
- **Implementation** : (1) `ItemDrop` composant ECS : item_instance, position, spawn_time. (2) `fn spawn_drop(world, item, position)` : creer entite avec ItemDrop + Sprite (icone par base_id). (3) `fn pickup_item(world, player_id, drop_id) -> Result<()>` : verifier proximite (< 2 tiles), transferer item dans inventaire joueur. (4) Label au sol : nom item colore par qualite (blanc/bleu/jaune/vert/gold).
- **Tests** : `cargo test -p sodomight -- item_drop_spawn` -- entite creee avec ItemDrop. `item_pickup_distance` -- trop loin = Err.
- **Ref** : REF-02 Section 9.4
- **SEC** : --

### TASK-050: Gold system -- wallet, auto-pickup
- **Crate(s)** : mge-arpg-trade
- **Fichier(s)** : `crates/arpg/mge-arpg-trade/src/wallet.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [049] | **Vague** : V1.5
- **Implementation** : (1) `Wallet { gold: i64 }` avec invariant gold >= 0, gold <= 2_500_000_000. (2) `fn add_gold(&mut self, amount: i64) -> Result<()>` : overflow check. (3) `fn remove_gold(&mut self, amount: i64) -> Result<()>` : underflow check. (4) Auto-pickup gold : si ItemDrop est Gold et player dans 1.5 tiles, auto-collect. (5) Gold split en piles si > 5000.
- **Tests** : `cargo test -p mge-arpg-trade -- wallet_add_gold` -- gold augmente. `wallet_overflow` -- > 2.5G = Err. `wallet_underflow` -- negatif = Err.
- **Ref** : REF-02 Section 10, SEC-19 (gold i64)
- **SEC** : SEC-19 (partiel, harmonisation gold)

### TASK-056: HUD orbes vie/mana
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/hud.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V1.5
- **Implementation** : (1) `HudOrb::render(ctx, current, max, color)` : orbe circulaire remplie proportionnellement. (2) HP orbe rouge a gauche, Mana orbe bleue a droite. (3) Texte "current/max" centre dans l'orbe. (4) Animation : remplissage smooth (lerp 0.2s). (5) Gestion div-by-zero : si max=0, afficher orbe vide.
- **Tests** : `cargo test -p mge-ui -- orb_percent_clamp` -- 0-100% clamp. `orb_div_by_zero` -- max=0 ne panic pas.
- **Ref** : REF-02 Section 11 (HUD D2), GAP-04
- **SEC** : --

### TASK-057: HUD belt 4 slots potions
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/hud.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [056] | **Vague** : V1.5 (seq apres 056, meme fichier)
- **Implementation** : (1) `BeltSlots::render(ctx, slots: [Option<PotionType>; 4])`. (2) 4 cases entre les orbes, hotkeys 1-4. (3) PotionType : HpSmall(+70), HpMedium(+140), ManaSmall(+40), ManaMedium(+80), Rejuv(+35%both). (4) Clic ou hotkey : consommer potion, appliquer effet, animation flash. (5) Drag from inventory pour remplir.
- **Tests** : `cargo test -p mge-ui -- belt_use_potion` -- slot vide apres usage. `belt_stack_potions` -- pas de stack (1 par slot).
- **Ref** : REF-02 Section 11.2 (belt)
- **SEC** : --

### TASK-058: HUD skill bar 2 actifs
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/skill_tree.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [040] | **Vague** : V1.5
- **Implementation** : (1) `SkillBar::render(ctx, left_skill, right_skill, cooldowns)`. (2) Left-click = skill gauche, Right-click = skill droite. (3) Icone skill + cooldown overlay (assombrissement progressif). (4) Tooltip au hover : nom, level, mana cost, damage. (5) Clic-droit sur bar pour ouvrir selection skill.
- **Tests** : `cargo test -p mge-ui -- skill_bar_cooldown_display` -- cooldown > 0 = overlay. `skill_bar_none` -- pas de skill = icone vide.
- **Ref** : REF-02 Section 11.3 (skill bar)
- **SEC** : --

### TASK-059: HUD XP bar + level
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/hud.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [034, 057] | **Vague** : V1.5 (seq apres 057, meme fichier)
- **Implementation** : (1) `XpBar::render(ctx, current_xp, level)` : barre horizontale en bas de l'ecran. (2) Largeur proportionnelle a `xp_progress()` (0.0..1.0). (3) Texte "Level X" a gauche. (4) Texte "X% to next" au centre. (5) Flash animation sur level up.
- **Tests** : `cargo test -p mge-ui -- xp_bar_progress` -- 50% XP = moitie barre. `xp_bar_level_99` -- max level = barre pleine.
- **Ref** : REF-02 Section 11.4
- **SEC** : --

### TASK-060: Combat log scrollable
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/dialog.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [039] | **Vague** : V1.5
- **Implementation** : (1) `CombatLog::push(message: String, color: Color)`. (2) Scroll vertical, max 100 messages (FIFO). (3) Couleurs : blanc=hit, rouge=damage recu, vert=heal, jaune=XP, gris=miss. (4) Toggle visibilite (touche L). (5) Timestamp optionnel.
- **Tests** : `cargo test -p mge-ui -- combat_log_fifo` -- >100 messages = premier supprime. `combat_log_color` -- damage = rouge.
- **Ref** : REF-02 Section 11.5
- **SEC** : --

### TASK-061: Minimap basique
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/minimap.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [] | **Vague** : V1.5
- **Implementation** : (1) `Minimap::render(ctx, player_pos, explored_tiles, npcs, monsters)`. (2) Coin haut-droit, 200x200px. (3) Points : blanc=joueur, rouge=monstre, vert=NPC, bleu=waypoint. (4) Tiles exploreres en gris, non-explorees en noir. (5) Toggle plein ecran (Tab).
- **Tests** : `cargo test -p mge-ui -- minimap_player_center` -- joueur toujours centre. `minimap_unexplored` -- tiles non visitees = noir.
- **Ref** : REF-02 Section 11.6
- **SEC** : --

---

### V1.6 -- Tests UI + Audio + Save (4 taches, paralleles)

### TASK-062: Tests mge-ui batch 1 (15 tests, GAP-04)
- **Crate(s)** : mge-ui
- **Fichier(s)** : `crates/engine/mge-ui/src/` (fichier tests a creer)
- **Agent** : L | **Modele** : S (tests)
- **Deps** : [056, 057, 058, 059, 060, 061] | **Vague** : V1.6
- **Implementation** : Creer 15 tests unitaires logique (pas GPU) : orb clamp (2), belt slots (2), skill bar (2), XP bar (2), combat log FIFO (2), minimap coords (2), div-by-zero guards (3). Pas de rendu GPU dans ces tests -- tester la logique metier uniquement.
- **Tests** : `cargo test -p mge-ui` -- 15/15 PASS (GAP-04 moitie atteint)
- **Ref** : GAP-04 tech-spec
- **SEC** : --

### TASK-066: Audio kira -- SFX combat + BGM Act 1
- **Crate(s)** : mge-audio
- **Fichier(s)** : `crates/engine/mge-audio/src/manager.rs`, `crates/engine/mge-audio/src/sfx.rs`, `crates/engine/mge-audio/src/bgm.rs`
- **Agent** : F | **Modele** : S (audio)
- **Deps** : [] | **Vague** : V1.6
- **Implementation** : (1) `AudioManager::new()` : initialiser kira `AudioManager<CpalBackend>`. (2) `play_sfx(SfxId)` : charger + jouer one-shot. SFX : hit_melee, hit_spell, death, pickup, potion. (3) `play_bgm(BgmId)` : jouer en loop, crossfade 1s. BGM : town_tristram, blood_moor, dungeon. (4) Volume master + SFX + BGM separement. (5) Bank : pre-charger les sons frequents.
- **Tests** : `cargo test -p mge-audio -- audio_manager_init` -- pas de panic (test #[ignore] si pas de backend audio). `sfx_bank_load` -- chargement OK.
- **Ref** : mge-audio existant (12 tests), kira 0.9
- **SEC** : --

### TASK-067: Save/Load personnage (stats, level, XP, position)
- **Crate(s)** : mge-save
- **Fichier(s)** : `crates/engine/mge-save/src/characters.rs`
- **Agent** : F | **Modele** : S (persistance)
- **Deps** : [032, 033] | **Vague** : V1.6
- **Implementation** : (1) Table `characters` : id UUID, account_id, class, level, xp, str, dex, vit, ene, hp_current, mana_current, pos_x, pos_y, zone_id, created_at, updated_at. (2) `CharacterDal::save(character)` : INSERT OR REPLACE. (3) `CharacterDal::load(id) -> Character`. (4) `CharacterDal::list(account_id) -> Vec<CharacterSummary>`. (5) Validation SEC-12 avant save : level 1..99, stats 0..1023, gold 0..2.5G.
- **Tests** : `cargo test -p mge-save -- save_load_character_roundtrip` -- save puis load = meme data. `save_invalid_level` -- level 100 = Err.
- **Ref** : mge-save existant, SEC-12
- **SEC** : SEC-12 (validation stats)

### TASK-068: Save/Load inventaire et items (JSON blob)
- **Crate(s)** : mge-save
- **Fichier(s)** : `crates/engine/mge-save/src/items.rs`
- **Agent** : F | **Modele** : S (persistance)
- **Deps** : [067, 047] | **Vague** : V1.6
- **Implementation** : (1) Table `inventories` : character_id, slot_index, item_json TEXT. (2) `item_json` = serde_json::to_string(ItemInstance). (3) `InventoryDal::save_all(character_id, items: &[Option<ItemInstance>])` : transaction, DELETE all puis INSERT batch. (4) `InventoryDal::load_all(character_id) -> Vec<Option<ItemInstance>>`. (5) Migration : CREATE TABLE inventories.
- **Tests** : `cargo test -p mge-save -- inventory_save_load_roundtrip` -- save 40 slots, load = identique. `inventory_empty_slot` -- None serde OK.
- **Ref** : mge-save existant
- **SEC** : --

---

### V1.7 -- Integration Sprint 1 (3 taches, sequentielles)

### TASK-071: Integration combat+loot+HUD+save dans game loop
- **Crate(s)** : sodomight-client
- **Fichier(s)** : `games/sodomight-client/src/game.rs`, `games/sodomight-client/src/gui.rs`
- **Agent** : F+L | **Modele** : S (integration)
- **Deps** : [V1.1 a V1.6 complet] | **Vague** : V1.7
- **Implementation** : (1) Game loop : Input -> SkillActivation -> CombatSystem -> LootSpawn -> HUD update -> Render. (2) Wire EventBus : CombatEvent -> CombatLog + DamageNumbers + SFX. (3) LootEvent -> SpawnDrop. (4) Save/Load : menu pause -> Save, menu principal -> Load. (5) Tester le flux complet : entrer zone, tuer monstre, loot, equiper, sauvegarder.
- **Tests** : `cargo build -p sodomight-client` -- compile. Test visuel : boucle jouable complite.
- **Ref** : Jalon S1
- **SEC** : --

### TASK-072: Damage numbers floating (couleurs par element)
- **Crate(s)** : mge-render
- **Fichier(s)** : `crates/engine/mge-render/src/overhead.rs`
- **Agent** : L | **Modele** : S (UI)
- **Deps** : [039] | **Vague** : V1.7
- **Implementation** : (1) `FloatingText::spawn(value, position, color, shake)` : texte qui monte et fade. (2) Couleurs par DamageType : Physical=blanc, Fire=orange, Cold=bleu, Lightning=jaune, Poison=vert, Magic=violet. (3) Critical : texte plus gros + shake. (4) Duration : 1.5s, vitesse montee : 30px/s. (5) Batch render via TextRenderer existant.
- **Tests** : `cargo test -p mge-render -- floating_text_critical_has_shake` -- (fix du test KO initial). `floating_text_fade` -- alpha=0 apres duration.
- **Ref** : mge-render overhead.rs existant
- **SEC** : --

### TASK-073: Death animation + respawn (penalite XP par difficulte)
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/world.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [045] | **Vague** : V1.7
- **Implementation** : (1) Player death : animation Death, ecran rouge fade 2s, respawn en town. (2) Penalite XP : Normal=0%, Nightmare=5%, Hell=10% du level courant. (3) Corps au sol pendant 30s (permet Corpse Explosion). (4) Gold drop : 0% Normal, 50% Nightmare (capped 20% du total). (5) Respawn : HP/Mana full, position = dernier waypoint OU town.
- **Tests** : `cargo test -p sodomight -- death_xp_penalty_normal` -- 0% loss. `death_xp_penalty_hell` -- 10% loss. `respawn_town` -- position = town coords.
- **Ref** : REF-02 Section 12 (death D2)
- **SEC** : --

---

### V1.8 -- Gate Sprint 1 (2 taches)

### TASK-075: Smoke test e2e Sprint 1
- **Crate(s)** : workspace
- **Fichier(s)** : aucun (validation)
- **Agent** : D | **Modele** : S (integration)
- **Deps** : [071] | **Vague** : V1.8
- **Implementation** : (1) cargo build/clippy/test --workspace 0 erreur. (2) Lancer client : Necro spawne en town, sort, tue Fallen, loot, equipe item, revient en town, sauvegarde. (3) Recharger : load fonctionne, personnage intact. (4) HUD : orbes, belt, skills, XP, minimap, combat log tous fonctionnels.
- **Tests** : Commandes workspace + validation visuelle
- **Ref** : Jalon S1
- **SEC** : Verifier SEC-01/02 resolus (grep DEBUG_SEED, argon2 present)

### TASK-080: Checkpoint Sprint 1
- **Crate(s)** : workspace
- **Fichier(s)** : aucun (gate)
- **Agent** : D | **Modele** : S (coordination)
- **Deps** : [toutes S1] | **Vague** : V1.8
- **Implementation** : (1) Verifier toutes taches S1 completees. (2) MAJ metriques : tests nouveaux, SEC resolus, tokens consommes. (3) `git tag sprint-1-done`. (4) Push. (5) Score securite : 42 -> 52/100.
- **Tests** : `git log --oneline` -- commits S1. `git tag` -- sprint-1-done.
- **Ref** : MIP v2 checkpoints
- **SEC** : Score 52/100 atteint

---

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Sprint precedent : [sodomight-plan-S0.md](sodomight-plan-S0.md) | Sprint suivant : [sodomight-plan-S2.md](sodomight-plan-S2.md)
