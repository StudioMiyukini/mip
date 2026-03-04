# Sprint 3 -- Acte 1 complet (50 taches, 8-12j) -- Partie 2/2
<!-- @id: sodomight-plan-S3-part2 @do: sprint-3-plan @role: chef-dev @layer: 0 @human: miyuk -->

**TL;DR** : Suite Sprint 3 : V3.3 (6 quetes, NPC dialogue, SEC-17) + V3.4 (boss Andariel, vendor, SEC batch) + V3.5 (gate). 12 taches.

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Partie 1 : [sodomight-plan-S3-part1.md](sodomight-plan-S3-part1.md)

---

### V3.3 -- Quetes + NPC + SEC-17 (8 taches, paralleles)

### TASK-127: Quete Den of Evil
- **Crate(s)** : mge-arpg-quest
- **Fichier(s)** : `crates/arpg/mge-arpg-quest/src/def.rs`
- **Agent** : F | **Modele** : S (content)
- **Deps** : [] | **Vague** : V3.3
- **Implementation** : (1) `QuestDef` : id="den_of_evil", name, giver=Akara, objectives=[KillAll(zone=Den)], rewards=[1 skill point, Akara reset stats]. (2) `QuestState` : NotStarted -> Active -> Complete. (3) Trigger : parler a Akara. Complete : 0 monstres dans Den.
- **Tests** : `cargo test -p mge-arpg-quest -- den_of_evil_complete` -- kill all = complete.
- **Ref** : REF-02 Section 16.1
- **SEC** : --

### TASK-128: Quete Sisters' Burial Grounds
- **Crate(s)** : mge-arpg-quest | **Fichier(s)** : `crates/arpg/mge-arpg-quest/src/def.rs`
- **Agent** : F | **Modele** : S | **Deps** : [] | **Vague** : V3.3
- **Implementation** : Kill Blood Raven in Burial Grounds. Reward : 1 free rogue mercenary. QuestDef + triggers.
- **Tests** : `cargo test -p mge-arpg-quest -- burial_grounds_complete`
- **Ref** : REF-02 Section 16.2 | **SEC** : --

### TASK-129: Quete Search for Cain
- **Crate(s)** : mge-arpg-quest | **Fichier(s)** : `crates/arpg/mge-arpg-quest/src/def.rs`
- **Agent** : F | **Modele** : S | **Deps** : [] | **Vague** : V3.3
- **Implementation** : Activate Cairn Stones in Stony Field -> Tristram portal -> rescue Cain. Reward : free identify. Multi-step quest.
- **Tests** : `cargo test -p mge-arpg-quest -- search_cain_steps`
- **Ref** : REF-02 Section 16.3 | **SEC** : --

### TASK-130: Quete Forgotten Tower
- **Crate(s)** : mge-arpg-quest | **Fichier(s)** : `crates/arpg/mge-arpg-quest/src/def.rs`
- **Agent** : F | **Modele** : S | **Deps** : [] | **Vague** : V3.3
- **Implementation** : Kill Countess in Tower L5. Reward : rune drops. QuestDef + trigger.
- **Tests** : `cargo test -p mge-arpg-quest -- forgotten_tower_complete`
- **Ref** : REF-02 Section 16.4 | **SEC** : --

### TASK-131: Quete Tools of the Trade
- **Crate(s)** : mge-arpg-quest | **Fichier(s)** : `crates/arpg/mge-arpg-quest/src/def.rs`
- **Agent** : F | **Modele** : S | **Deps** : [] | **Vague** : V3.3
- **Implementation** : Find Horadric Malus in Barracks -> return to Charsi. Reward : imbue item. FetchItem quest type.
- **Tests** : `cargo test -p mge-arpg-quest -- tools_trade_complete`
- **Ref** : REF-02 Section 16.5 | **SEC** : --

### TASK-132: Quete Sisters to the Slaughter
- **Crate(s)** : mge-arpg-quest | **Fichier(s)** : `crates/arpg/mge-arpg-quest/src/def.rs`
- **Agent** : F | **Modele** : S | **Deps** : [] | **Vague** : V3.3
- **Implementation** : Kill Andariel in Catacombs L4. Reward : Act 2 access. Boss quest -> TASK-133.
- **Tests** : `cargo test -p mge-arpg-quest -- sisters_slaughter_complete`
- **Ref** : REF-02 Section 16.6 | **SEC** : --

### TASK-146: NPC dialogue system (Cain, Charsi, Akara)
- **Crate(s)** : mge-arpg-quest
- **Fichier(s)** : `crates/arpg/mge-arpg-quest/src/def.rs`, `crates/engine/mge-script/src/quest.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [] | **Vague** : V3.3
- **Implementation** : (1) `NpcDef` struct : id, name, location, dialogue_tree. (2) `DialogueNode` : text, responses Vec<(String, DialogueAction)>. (3) `DialogueAction` enum : NextNode, GiveQuest, Complete, Shop, Identify, Exit. (4) 3 NPCs Act 1 : Akara (quests+potions), Charsi (imbue+repair), Cain (identify+lore). (5) Dialogue affiche dans UI overlay.
- **Tests** : `cargo test -p mge-arpg-quest -- npc_akara_give_quest` -- dialogue -> quest Active.
- **Ref** : Tech-spec E-04
- **SEC** : --

### TASK-160: SEC-17 -- Validation noms personnage (2-24 chars, no HTML)
- **Crate(s)** : mge-save
- **Fichier(s)** : `crates/engine/mge-save/src/characters.rs`
- **Agent** : F | **Modele** : Ha (validation)
- **Deps** : [] | **Vague** : V3.3
- **Implementation** : (1) `fn validate_name(name: &str) -> Result<()>` : len 2..=24, alphanumeric + espace + tiret, pas de `<>&"'`, pas de double espace, trim. (2) Appele dans `CharacterDal::create()` avant insert. (3) Rejeter noms offensants (liste basique optionnelle).
- **Tests** : `cargo test -p mge-save -- name_valid` -- "Miyuki" OK. `name_too_short` -- "A" = Err. `name_html_inject` -- "<script>" = Err.
- **Ref** : SEC-17, analyse securite Victor
- **SEC** : SEC-17

---

### V3.4 -- Boss + Vendor + SEC batch (3 taches)

### TASK-133: Boss Andariel
- **Crate(s)** : sodomight
- **Fichier(s)** : `games/sodomight/src/content.rs`
- **Agent** : F | **Modele** : O (boss AI complexe)
- **Deps** : [123] | **Vague** : V3.4
- **Implementation** : (1) `AndarielDef` : SuperUnique, HP=~1024, resist(fire=-50, poison=+75), melee_poison, Poison Bolt projectile. (2) IA boss : Phase 1 (>50% HP) : melee + Poison Bolt. Phase 2 (<50% HP) : rage, +speed, +damage, Poison Nova AoE. (3) Drop table : TC85 guaranteed + quest drop. (4) Fire vulnerability D2 canon (-50% resist). (5) Spawn dans Catacombs L4, zone finale.
- **Tests** : `cargo test -p sodomight -- andariel_fire_weak` -- fire resist = -50. `andariel_rage_phase` -- <50% HP = +speed. `andariel_guaranteed_drop` -- TC85 NoDrop=0.
- **Ref** : REF-02 Section 17 (boss Andariel)
- **SEC** : --

### TASK-147: NPC vendor buy/sell + SEC-21
- **Crate(s)** : mge-arpg-trade
- **Fichier(s)** : `crates/arpg/mge-arpg-trade/src/vendor.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [146] | **Vague** : V3.4
- **Implementation** : (1) `Vendor` struct : inventory Vec<ItemInstance>, refresh_timer. (2) `fn buy(player, vendor, item_index) -> Result<()>` : deduire gold joueur, ajouter item inventaire. (3) `fn sell(player, vendor, item) -> Result<()>` : prix = `item_def.base_value / 4` (SEC-21 : prix lu depuis definition, pas parametre client). (4) Vendor refresh : regenerer inventaire toutes les ~30 min game time. (5) Gamble : payer prix Unique, recevoir qualite aleatoire.
- **Tests** : `cargo test -p mge-arpg-trade -- vendor_sell_price_from_def` -- prix = base_value/4, pas client. `vendor_buy_deduct_gold` -- gold deduit.
- **Ref** : REF-02 Section 10.2, SEC-21
- **SEC** : SEC-21

### TASK-154: SEC-BATCH-MED -- 6 items securite moyenne (NC-02)
- **Crate(s)** : multi-crates
- **Fichier(s)** : multi-fichiers
- **Agent** : F | **Modele** : S (securite)
- **Deps** : [] | **Vague** : V3.4
- **Implementation** : Batch de 6 corrections securite moyenne : (1) **SEC-09** : Manifeste SHA-256 scripts Rhai dans `mge-script/src/engine.rs` -- `fn verify_script(path, expected_hash)`. (2) **SEC-16** : `MAX_MESSAGE_SIZE = 65536` dans `mge-net/src/codec.rs` (actuellement 1MiB). (3) **SEC-18** : Plafonner rewards Rhai (xp max 100k, item max qty 100) dans `mge-script/src/quest.rs`. (4) **SEC-19** : Harmoniser gold `u64 -> i64` dans `mge-arpg-trade/src/wallet.rs` + validation >= 0. (5) **SEC-20** : CRC32 dans `mge-net/src/codec.rs` -- `fn encode_with_crc(frame)`, `fn decode_verify_crc(frame)`. (6) **SEC-22** : Backup DB avant session dans `mge-save/src/db.rs` -- `fn backup_before_session(db_path)`.
- **Tests** : 6 tests : `rhai_script_hash_verify`, `net_max_message_64k`, `rhai_reward_cap`, `gold_i64_validation`, `codec_crc32_roundtrip`, `db_backup_creates_file`.
- **Ref** : SEC-09/16/18/19/20/22, NC-02
- **SEC** : SEC-09, SEC-16, SEC-18, SEC-19, SEC-20, SEC-22

---

### V3.5 -- Gate Sprint 3

### TASK-165: Checkpoint Sprint 3
- **Crate(s)** : workspace
- **Fichier(s)** : aucun (gate)
- **Agent** : D | **Modele** : S (coordination)
- **Deps** : [toutes S3] | **Vague** : V3.5
- **Implementation** : (1) cargo build/clippy/test --workspace 0 erreur. (2) Verifier 25+ zones, 6 quetes, Andariel, runewords, audio, GAP-05 collision. (3) SEC-08/17/21 + SEC-BATCH-MED resolus. (4) MAJ metriques. (5) `git tag sprint-3-done`. (6) Score securite : 62 -> 72/100.
- **Tests** : Commandes workspace + verification fonctionnelle
- **Ref** : Jalon S3
- **SEC** : Score 72/100 atteint

---

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Sprint precedent : [sodomight-plan-S2.md](sodomight-plan-S2.md) | Sprint suivant : [sodomight-plan-S4-S5.md](sodomight-plan-S4-S5.md)
