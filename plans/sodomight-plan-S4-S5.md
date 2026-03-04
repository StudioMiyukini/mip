# Sprint 4 + 5+ -- Multijoueur + Contenu etendu
<!-- @id: sodomight-plan-S4-S5 @do: sprint-4-5-plan @role: chef-dev @layer: 0 @human: miyuk -->

**TL;DR** : S4 : 2-8 joueurs TCP, serveur autoritatif, GAP-01/02, SEC-06..15 (20 taches). S5+ : 7 classes, 5 actes, 3 difficultes, endgame (projets MIP separes).

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md)

---

# ============================================================
# SPRINT 4 -- Multijoueur (20 taches, 8-12j)
# ============================================================

**Livrable** : 2-8 joueurs TCP, serveur autoritatif, GAP-01 + GAP-02 complets. SEC-06/07/10/11/12/13/14/15.

## MASS Sprint 4

### Vagues d'execution (resume)

| Vague | Taches | Agents | Mode | Duree est. |
|-------|--------|--------|------|------------|
| V4.1 | 166, 167, 168 | F, F, F | sequentiel (GAP-01 chain) | 6h |
| V4.2 | 169, 170, 171, 172, 173, 174, 175 | F (seq chain reseau) | sequentiel | 8h |
| V4.3 | 176, 177 | L, H | worktree swarm | UI / health_check | 3h |
| V4.4 | 185 | D | sequentiel | Gate | 1h |

---

### TASK-166: GAP-01 -- Transport TCP mge-net
- **Crate(s)** : mge-net
- **Fichier(s)** : `crates/engine/mge-net/src/` (NOUVEAUX : server.rs, client.rs, session.rs, rate_limiter.rs, error.rs)
- **Agent** : F | **Modele** : O (reseau critique)
- **Deps** : [118] | **Vague** : V4.1
- **Implementation** : (1) `TcpServer::bind(addr) -> Self` : `TcpListener::bind()`. (2) `accept() -> (TcpStream, SocketAddr)` spawn `handle_client()`. (3) `handle_client()` : `FramedRead<BufReader<TcpStream>, FrameCodec>` + `FramedWrite`. (4) `FrameCodec` : length-prefix u32 + bincode serialize/deserialize + CRC32 (SEC-20). (5) `RateLimiter` : max_connections_per_ip=8, connection_rate_limit=10/s (SEC-10). (6) SEC-06 : `ClientId` genere cote serveur (UUID v4). (7) SEC-07 : sequence number dans chaque paquet.
- **Tests** : `cargo test -p mge-net -- tcp_bind_accept`, `tcp_roundtrip_message`, `rate_limiter_block`, `client_id_server_generated`, `seq_number_increment` (8-12 tests)
- **Ref** : GAP-01, SEC-06/07/10
- **SEC** : SEC-06, SEC-07, SEC-10

### TASK-167: GAP-02 -- Serveur autoritatif 25Hz
- **Crate(s)** : sodomight-server
- **Fichier(s)** : `games/sodomight-server/src/` (NOUVEAUX : server.rs, session.rs, authority.rs, world_host.rs)
- **Agent** : F | **Modele** : O (architecture critique)
- **Deps** : [166] | **Vague** : V4.1
- **Implementation** : (1) `GameServer::bind(addr)` + `run()` : boucle 25Hz. (2) Chaque tick : poll client inputs -> validate (SEC-04) -> run ECS stage -> broadcast deltas. (3) `Authority` module : server-side validation de TOUTES les actions (move, attack, use_skill, pickup, trade). (4) Autosave toutes les 60 ticks (~2.4s). (5) `WorldHost` : ECS world sans rendu. (6) SEC-12 : validation stats avant save (gold, level, stats bounds).
- **Tests** : `cargo test -p sodomight-server -- server_start_accept`, `tick_25hz`, `authority_reject_speed_hack`, `autosave_interval` (6-8 tests)
- **Ref** : GAP-02, SEC-04/12
- **SEC** : SEC-04, SEC-12

### TASK-168: Client connect
- **Crate(s)** : sodomight-client
- **Fichier(s)** : `games/sodomight-client/src/state.rs`
- **Agent** : F | **Modele** : S (reseau)
- **Deps** : [166] | **Vague** : V4.1
- **Implementation** : (1) `Client::connect(addr) -> Result<Self>`. (2) Handshake : envoyer Hello(version, name) -> recevoir Welcome(client_id, session_token). (3) SEC-13 : session token UUID v4, expire 24h. (4) Sync initial : recevoir WorldSnapshot (all entities, positions, stats). (5) Deconnexion propre : envoyer Goodbye, cleanup.
- **Tests** : `cargo test -p sodomight-client -- client_connect_handshake`, `client_session_token` (3-4 tests)
- **Ref** : GAP-01, SEC-13
- **SEC** : SEC-13

### TASK-169: Sync entites (positions, animations, stats, interpolation)
- **Crate(s)** : sodomight-client
- **Fichier(s)** : `games/sodomight-client/src/state.rs`
- **Agent** : F | **Modele** : S (reseau)
- **Deps** : [167] | **Vague** : V4.2
- **Implementation** : (1) Recevoir `ServerMessage::EntityUpdate { id, position, animation, stats }`. (2) Interpolation client-side : lerp positions entre 2 derniers snapshots (buffer 100ms). (3) Prediction client : envoyer Move, appliquer localement, corriger si serveur diverge (reconciliation). (4) Animation sync : etat animation provient du serveur.
- **Tests** : `cargo test -p sodomight-client -- entity_interpolation`, `client_prediction_reconciliation`
- **Ref** : Tech-spec reseau | **SEC** : --

### TASK-170: Loot partage (free-for-all, timer 0.5s)
- **Crate(s)** : sodomight-server
- **Fichier(s)** : `games/sodomight-server/src/authority.rs`
- **Agent** : F | **Modele** : S
- **Deps** : [167] | **Vague** : V4.2
- **Implementation** : (1) Monster drop : item alloue au joueur qui a fait le kill pendant 0.5s, puis free-for-all. (2) Serveur autorite : seul le serveur decide qui pickup. (3) Gold partage equitablement entre joueurs dans 2 ecrans.
- **Tests** : `cargo test -p sodomight-server -- loot_allocation_timer`, `loot_free_for_all_after_timeout`
- **Ref** : REF-02 Section 9.5 | **SEC** : --

### TASK-171: Trade P2P via serveur (atomique)
- **Crate(s)** : sodomight-server
- **Fichier(s)** : `games/sodomight-server/src/authority.rs`
- **Agent** : F | **Modele** : S
- **Deps** : [167, 120] | **Vague** : V4.2
- **Implementation** : (1) Trade request : joueur A invite joueur B. (2) UI trade : chacun place items + gold, confirme. (3) Double confirmation requise. (4) Serveur execute SEC-05 (transaction atomique). (5) SEC-11 : Mutex sur TradeSession pour eviter race condition.
- **Tests** : `cargo test -p sodomight-server -- trade_atomic_p2p`, `trade_double_confirm`
- **Ref** : SEC-05/11 | **SEC** : SEC-05, SEC-11

### TASK-172: Party system + XP sharing
- **Crate(s)** : sodomight-server
- **Fichier(s)** : `games/sodomight-server/src/world_host.rs`
- **Agent** : F | **Modele** : S
- **Deps** : [167] | **Vague** : V4.2
- **Implementation** : (1) Party : invite, accept, leave, max 8 joueurs. (2) XP sharing : XP split entre membres dans 2 ecrans de distance. (3) Formule D2 : `player_xp = total_xp * player_level / sum(party_levels)`. (4) Party leader assigns loot rules optionnel.
- **Tests** : `cargo test -p sodomight-server -- party_xp_share`, `party_max_8`
- **Ref** : REF-02 Section 18 | **SEC** : --

### TASK-173: SEC-12 -- Validation stats serveur
- **Crate(s)** : sodomight-server | **Fichier(s)** : `games/sodomight-server/src/authority.rs`
- **Agent** : F | **Modele** : S | **Deps** : [167] | **Vague** : V4.2
- **Implementation** : Avant chaque save : gold 0..2_500_000_000, level 1..99, stats 0..1023, HP 0..max_hp. Rejeter et logger toute valeur hors bornes.
- **Tests** : `cargo test -p sodomight-server -- validate_gold_overflow`, `validate_level_bounds`
- **Ref** : SEC-12 | **SEC** : SEC-12

### TASK-174: SEC-13 -- Session tokens UUID v4 + expiration 24h
- **Crate(s)** : mge-net | **Fichier(s)** : `crates/engine/mge-net/src/session.rs` (NOUVEAU)
- **Agent** : F | **Modele** : S | **Deps** : [166] | **Vague** : V4.2
- **Implementation** : `SessionToken { id: Uuid, created_at, expires_at }`. Generate via `Uuid::new_v4()`. Validate : not expired, exists in active sessions. Rotation : refresh on activity.
- **Tests** : `cargo test -p mge-net -- session_token_expiry`, `session_token_rotation`
- **Ref** : SEC-13 | **SEC** : SEC-13

### TASK-175: SEC-15 -- TLS tokio-rustls
- **Crate(s)** : mge-net | **Fichier(s)** : `crates/engine/mge-net/Cargo.toml`, `crates/engine/mge-net/src/server.rs`
- **Agent** : F | **Modele** : S | **Deps** : [166] | **Vague** : V4.2
- **Implementation** : Feature flag `tls` dans Cargo.toml. Si active : `tokio-rustls` wrapper autour de TcpStream. Self-signed cert pour dev, proper cert pour prod. `TlsAcceptor` dans server.rs.
- **Tests** : `cargo test -p mge-net --features tls -- tls_handshake` -- connexion TLS OK
- **Ref** : SEC-15 | **SEC** : SEC-15

### TASK-176: Lobby browser UI
- **Crate(s)** : mge-ui | **Fichier(s)** : `crates/engine/mge-ui/src/menus/`
- **Agent** : L | **Modele** : S | **Deps** : [168] | **Vague** : V4.3
- **Implementation** : Liste des serveurs (LAN scan ou IP manuelle). Afficher : nom, joueurs/max, ping, version. Boutons : Join, Create, Refresh.
- **Tests** : `cargo test -p mge-ui -- lobby_display_servers`
- **Ref** : REF-02 Section 15.5 | **SEC** : --

### TASK-177: Health check HTTP
- **Crate(s)** : sodomight-server | **Fichier(s)** : `games/sodomight-server/src/lib.rs`
- **Agent** : H | **Modele** : Ha | **Deps** : [167] | **Vague** : V4.3
- **Implementation** : HTTP GET `http://localhost:7778/health` retourne JSON `{ "status": "ok", "players": N, "uptime": secs, "version": "0.1.0" }`. Axum mini-server ou hyper direct.
- **Tests** : `cargo test -p sodomight-server -- health_check_200`
- **Ref** : Tech-spec health check | **SEC** : --

### TASK-185: Checkpoint Sprint 4
- **Crate(s)** : workspace | **Fichier(s)** : aucun (gate)
- **Agent** : D | **Modele** : S | **Deps** : [toutes S4] | **Vague** : V4.4
- **Implementation** : cargo build/clippy/test --workspace 0 erreur. 2-8 joueurs TCP fonctionnel. SEC-06..15 resolus. `git tag sprint-4-done`. Score securite : 72 -> 85/100.
- **Tests** : Commandes workspace + test multi local
- **Ref** : Jalon S4 | **SEC** : Score 85/100

---

# ============================================================
# SPRINT 5+ -- Contenu etendu (15+ taches, 20+j)
# ============================================================

**Livrable** : Jeu complet D2 equivalent. Projets MIP separes recommandes par sprint.

### 5A -- Classes 2-7 (6 taches, chacune = mini-projet MIP)

### TASK-186: Sorceress (3 arbres : Fire/Cold/Lightning)
- **Crate(s)** : mge-arpg-skills, mge-arpg-stats | **Agent** : F | **Modele** : S
- **Implementation** : 30 skills (10 par arbre), base stats STR=10/DEX=25/VIT=10/ENE=35. Specialite : degats elementaux massifs, faible HP.
- **Ref** : REF-02 Section 4B | **SEC** : --

### TASK-187: Paladin (3 arbres + auras)
- **Crate(s)** : mge-arpg-skills | **Agent** : F | **Modele** : S
- **Implementation** : 30 skills. Combat/Offensive Aura/Defensive Aura. Aura = buff zone autour du joueur, 1 seule active. STR=25/DEX=20/VIT=25/ENE=15.
- **Ref** : REF-02 Section 4C | **SEC** : --

### TASK-188: Amazon (3 arbres + javelins/bows)
- **Crate(s)** : mge-arpg-skills | **Agent** : F | **Modele** : S
- **Implementation** : 30 skills. Javelin&Spear/Passive&Magic/Bow&Crossbow. Dual weapon system (melee+ranged). STR=20/DEX=25/VIT=20/ENE=15.
- **Ref** : REF-02 Section 4D | **SEC** : --

### TASK-189: Barbarian (3 arbres + dual wield)
- **Crate(s)** : mge-arpg-skills | **Agent** : F | **Modele** : S
- **Implementation** : 30 skills. Warcries/Combat Masteries/Combat Skills. Dual wield : 2 weapon slots, alternate swing. STR=30/DEX=20/VIT=25/ENE=10.
- **Ref** : REF-02 Section 4E | **SEC** : --

### TASK-190: Druid (3 arbres + shapeshifting)
- **Crate(s)** : mge-arpg-skills | **Agent** : F | **Modele** : S
- **Implementation** : 30 skills. Elemental/Shape Shifting/Summoning. Transform : Werewolf (speed), Werebear (tank). Different attack animations en forme. STR=15/DEX=20/VIT=25/ENE=20.
- **Ref** : REF-02 Section 4F | **SEC** : --

### TASK-191: Assassin (3 arbres + traps)
- **Crate(s)** : mge-arpg-skills | **Agent** : F | **Modele** : S
- **Implementation** : 30 skills. Martial Arts/Shadow Disciplines/Traps. Charge-up + finisher system. Traps = entites placees au sol. STR=20/DEX=20/VIT=20/ENE=25.
- **Ref** : REF-02 Section 4G | **SEC** : --

### 5B -- Actes 2-5 (4 taches)

Acte 2 (Desert, 22 zones, Duriel) | Acte 3 (Jungle, 24 zones, Mephisto) | Acte 4 (Enfer, 5 zones, Diablo) | Acte 5 (Montagne, 24 zones, Baal). Chaque acte = projet MIP T4 separe.

### 5C -- Systemes avances

Set items (16+) | Horadric Cube (50+ recettes) | 3 difficultes | Hardcore mode | Stash multi-pages | Mercenaires | Ethereal items | Crafting.

### 5D -- Endgame

Uber bosses | DClone | Ladder/saisons | PvP Hostile | Gambling avance.

### SEC-BATCH-LOW (NC-02) -- S5

### TASK-195: SEC-BATCH-LOW -- 3 items securite basse
- **Crate(s)** : multi-crates | **Agent** : F | **Modele** : Ha
- **Implementation** : (1) **SEC-23** : `secrecy::Secret<String>` pour password_hash dans mge-save/accounts.rs + zeroize. (2) **SEC-24** : Documenter `unwrap_or(0)` dans mge-save/schema.rs:28 avec commentaire justificatif. (3) **SEC-25** : Warning log quand `file_stem()` retourne None dans mge-asset/loader.rs.
- **Tests** : 3 tests : `secret_zeroize`, `schema_unwrap_documented`, `loader_file_stem_warning`
- **Ref** : SEC-23/24/25, NC-02 | **SEC** : SEC-23, SEC-24, SEC-25

---

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Sprint precedent : [sodomight-plan-S3-part2.md](sodomight-plan-S3-part2.md)
