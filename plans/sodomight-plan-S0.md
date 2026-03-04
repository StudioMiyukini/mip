# Sprint 0 -- Fondations moteur (22 taches, 3-5j)
<!-- @id: sodomight-plan-S0 @do: sprint-0-plan @role: chef-dev @layer: 0 @human: miyuk -->

**TL;DR** : Fix blockers, winit 0.30, pipeline rendu, scene test, CI/CD. Livrable : clic sur map iso = entite se deplace.

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md)

**Livrable** : clic sur map iso = entite se deplace, CI/CD vert, workspace compile

## MASS Sprint 0

### DAG de dependances (ASCII)

```
TASK-001 (fix compile) ─────────┐
TASK-002 (fix test) ────────────┤
                                v
TASK-003 (toolchain) ──┐   TASK-005 (valider build) ──> TASK-007 (winit) ──> TASK-008 (fenetre)
TASK-004 (config) ─────┤        │                              │
TASK-018 (ecs) ────────┤        │                              v
TASK-019 (core) ───────┤   TASK-006 (CI/CD)             TASK-009 (rendu) ──────┐
TASK-020 (asset) ──────┤   TASK-016 (release)            TASK-010 (tiles) ─────┤
TASK-021 (collision) ──┘   TASK-017 (tag GPU)            TASK-011 (anim) ──────┤
                                                         TASK-012 (pathfinding)┤
                                                                               v
                                                         TASK-013 (scene) ──> TASK-014 (clic-move) ──> TASK-015 (smoke)
                                                                                                              │
                                                                                                         TASK-022 (gate)
```

### Vagues d'execution

| Vague | Taches | Agents | Mode | Fichiers touches | Conflit potentiel | Duree est. |
|-------|--------|--------|------|-----------------|-------------------|------------|
| V0.1 | 001, 002, 003, 004, 018, 019, 020, 021 | F, F, H, H, F, F, F, F | worktree swarm | game.rs / overhead.rs / rust-toolchain.toml / .cargo/config.toml / ecs/*.rs / core/*.rs / asset/*.rs / collision/*.rs | AUCUN (fichiers disjoints) | 2h |
| V0.2 | 005, 006, 016, 017 | D, H, H, F | subagent burst | workspace / ci.yml / Cargo.toml / tests/*.rs | 016+005 sur Cargo.toml -> seq 005 puis 016 | 1h |
| V0.3 | 007, 008 | F, F | sequentiel | platform/app.rs, window.rs, gpu.rs | meme crate -> seq obligatoire | 3h |
| V0.4 | 009, 010, 011, 012 | F, L, L, F | worktree swarm | render/pipeline.rs,sprite.rs / render/tile.rs,math/iso.rs / render/animation.rs / pathfinding/*.rs | 009+010+011 sur mge-render -> F=pipeline+sprite, L=tile+animation (fichiers diff) | 3h |
| V0.5 | 013, 014 | F+L, F | sequentiel | sodomight-client/game.rs | meme fichier -> seq | 2h |
| V0.6 | 015, 022 | D, D | sequentiel | workspace (tests) | gate | 1h |

### Strategie de merge

- V0.1 : 8 taches //, Denis merge apres completion. Checkpoint build+clippy workspace.
- V0.2 : Denis merge 005 d'abord (gate build), puis 006/016/017 en //.
- V0.3-V0.5 : Sequentiel, commit par tache, push apres V0.4.
- V0.6 : Gate sprint, tag `sprint-0-done`.
- Spot-checks : Victor skip S0 (pas de SEC). Jean spot-check tokens/ligne sur V0.1.

### Metriques cibles

| Metrique | Cible |
|----------|-------|
| Tokens V0.1 | ~80k (8 taches Ha/S) |
| Tokens V0.2-V0.6 | ~60k |
| Tests a valider gate | cargo build + clippy + test --workspace 0 erreur |
| Fichiers nouveaux | 3 (rust-toolchain.toml, .cargo/config.toml, .github/workflows/mge-ci.yml) |

---

### V0.1 -- Deblocage + Validation crates (8 taches, paralleles)

### TASK-001: Fix erreur compilation sodomight-client
- **Crate(s)** : sodomight-client
- **Fichier(s)** : `games/sodomight-client/src/game.rs` (ligne ~843)
- **Agent** : F | **Modele** : Ha (fix trivial)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Corriger l'erreur Display trait a la ligne 843. Probablement un `impl Display` manquant ou un format string incorrect sur un type custom. Verifier que le type implemente `std::fmt::Display` ou utiliser `{:?}` si `Debug` suffit.
- **Tests** : `cargo build -p sodomight-client` -- compile sans erreur
- **Ref** : Inventaire B1
- **SEC** : --

### TASK-002: Fix test mge-render floating_text overhead
- **Crate(s)** : mge-render
- **Fichier(s)** : `crates/engine/mge-render/src/overhead.rs`
- **Agent** : F | **Modele** : Ha (fix trivial)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Le test `floating_text_critical_has_shake` echoue. Verifier l'assertion dans le test : probablement un champ `shake` manquant ou une valeur par defaut incorrecte dans `FloatingText::critical()`. Corriger le constructeur ou le test selon la spec design.
- **Tests** : `cargo test -p mge-render -- floating_text_critical_has_shake` -- PASS
- **Ref** : Inventaire B2
- **SEC** : --

### TASK-003: Creer rust-toolchain.toml
- **Crate(s)** : workspace
- **Fichier(s)** : `rust-toolchain.toml` (NOUVEAU)
- **Agent** : H | **Modele** : Ha (boilerplate)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Creer `mge/rust-toolchain.toml` avec `[toolchain]` channel = "stable", components = ["clippy", "rustfmt"], targets vide (host default). Verrouille la version Rust pour CI reproductible.
- **Tests** : `rustup show` -- affiche la toolchain configuree
- **Ref** : Tech-spec CI/CD
- **SEC** : --

### TASK-004: Creer .cargo/config.toml
- **Crate(s)** : workspace
- **Fichier(s)** : `.cargo/config.toml` (NOUVEAU)
- **Agent** : H | **Modele** : Ha (boilerplate)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Creer `mge/.cargo/config.toml` avec `[build]` jobs = 4 (CI), `[target.x86_64-pc-windows-msvc]` linker par defaut, `[alias]` ci-check = "clippy --workspace -- -D warnings". Optimise le build CI.
- **Tests** : `cargo build -p mge-math` -- compile avec config
- **Ref** : Tech-spec CI/CD
- **SEC** : --

### TASK-018: Validation mge-ecs (55 tests existants)
- **Crate(s)** : mge-ecs
- **Fichier(s)** : `crates/kernel/mge-ecs/src/*.rs` (lecture seule, fix si KO)
- **Agent** : F | **Modele** : Ha (validation)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Executer les 55 tests existants. Si echec, corriger. Verifier archetype SoA, sparse overlay, `Any` downcasting. Aucune modification attendue sauf regression.
- **Tests** : `cargo test -p mge-ecs` -- 55/55 PASS
- **Ref** : Inventaire Couche 1
- **SEC** : --

### TASK-019: Validation mge-core (25 tests existants)
- **Crate(s)** : mge-core
- **Fichier(s)** : `crates/kernel/mge-core/src/*.rs` (lecture seule, fix si KO)
- **Agent** : F | **Modele** : Ha (validation)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Executer les 25 tests existants. Valider game loop fixe, EventBus, SystemScheduler. Aucune modification attendue.
- **Tests** : `cargo test -p mge-core` -- 25/25 PASS
- **Ref** : Inventaire Couche 1
- **SEC** : --

### TASK-020: Validation mge-asset (21 tests existants)
- **Crate(s)** : mge-asset
- **Fichier(s)** : `crates/kernel/mge-asset/src/*.rs` (lecture seule, fix si KO)
- **Agent** : F | **Modele** : Ha (validation)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Executer les 21 tests existants. Valider chargement TOML generique, hot-reload. Noter que 0 fichiers TOML data existent (sera corrige GAP-03 en S2).
- **Tests** : `cargo test -p mge-asset` -- 21/21 PASS
- **Ref** : Inventaire Couche 1
- **SEC** : --

### TASK-021: Validation mge-collision (15 tests existants)
- **Crate(s)** : mge-collision
- **Fichier(s)** : `crates/engine/mge-collision/src/*.rs` (lecture seule, fix si KO)
- **Agent** : F | **Modele** : Ha (validation)
- **Deps** : [] | **Vague** : V0.1
- **Implementation** : Executer les 15 tests existants. Valider AABB broadphase SpatialGrid. Verifier collider.rs, grid.rs, layer.rs, world.rs.
- **Tests** : `cargo test -p mge-collision` -- 15/15 PASS
- **Ref** : Inventaire Couche 2
- **SEC** : --

---

### V0.2 -- Gate build + CI/CD (4 taches)

### TASK-005: Valider build workspace + clippy
- **Crate(s)** : workspace (tous)
- **Fichier(s)** : aucun (validation)
- **Agent** : D | **Modele** : S (coordination)
- **Deps** : [001, 002] | **Vague** : V0.2
- **Implementation** : Executer `cargo build --workspace`, `cargo clippy --workspace -- -D warnings`, `cargo test --workspace`. Valider 0 erreur. Logger les resultats. C'est la GATE qui debloque tout le reste de S0.
- **Tests** : `cargo build --workspace && cargo clippy --workspace -- -D warnings && cargo test --workspace` -- 0 erreur, 0 warning
- **Ref** : Conventions CLAUDE.md
- **SEC** : --

### TASK-006: Pipeline CI/CD GitHub Actions
- **Crate(s)** : workspace
- **Fichier(s)** : `.github/workflows/mge-ci.yml` (NOUVEAU)
- **Agent** : H | **Modele** : S (CI/CD)
- **Deps** : [003, 004] | **Vague** : V0.2
- **Implementation** : Creer pipeline 5 stages : (1) `cargo check --workspace` (2) `cargo clippy --workspace -- -D warnings` (3) `cargo test --workspace` avec tests GPU tagges `#[ignore]` (4) `cargo audit` (5) Build release matrix (linux, windows, macos). Cache : `actions/cache` sur `~/.cargo` et `target/`. sccache si dispo.
- **Tests** : Push sur branche -> pipeline vert en CI
- **Ref** : Tech-spec CI/CD, inventaire R-03
- **SEC** : --

### TASK-016: Profil release optimise Cargo.toml
- **Crate(s)** : workspace
- **Fichier(s)** : `Cargo.toml` (racine workspace)
- **Agent** : H | **Modele** : Ha (config)
- **Deps** : [005] | **Vague** : V0.2
- **Implementation** : Ajouter section `[profile.release]` : `opt-level = 3`, `lto = "thin"`, `codegen-units = 1`, `strip = "symbols"`. Ajouter `[profile.dev]` : `opt-level = 1` pour dev plus rapide. Verifier que le build release produit un binaire <60Mo.
- **Tests** : `cargo build --release -p sodomight-client` -- compile, binaire strip
- **Ref** : Tech-spec targets performance
- **SEC** : --

### TASK-017: Tagger tests GPU #[ignore]
- **Crate(s)** : mge-render, mge-platform
- **Fichier(s)** : `crates/engine/mge-render/src/tests.rs`, `crates/kernel/mge-platform/src/*.rs`
- **Agent** : F | **Modele** : Ha (annotation)
- **Deps** : [005] | **Vague** : V0.2
- **Implementation** : Identifier tous les tests qui necessitent un contexte GPU (wgpu Device/Queue). Ajouter `#[ignore]` avec commentaire `// Requires GPU context, run locally`. Cela permet au CI headless de passer sans GPU.
- **Tests** : `cargo test --workspace` -- 0 test GPU echoue en CI headless
- **Ref** : Risque R-04
- **SEC** : --

---

### V0.3 -- Migration winit 0.30 (2 taches, sequentielles)

### TASK-007: Migration winit 0.30 ApplicationHandler (mge-platform)
- **Crate(s)** : mge-platform
- **Fichier(s)** : `crates/kernel/mge-platform/src/app.rs`, `crates/kernel/mge-platform/src/window.rs`
- **Agent** : F | **Modele** : O (kernel GPU critique)
- **Deps** : [005] | **Vague** : V0.3
- **Implementation** : (1) Remplacer `EventLoop::run()` deprecie par `EventLoop::run_app()`. (2) Implementer le trait `ApplicationHandler` sur la struct App : `fn resumed(&mut self, event_loop)`, `fn window_event(&mut self, event_loop, window_id, event)`, `fn about_to_wait(&mut self, event_loop)`. (3) Deplacer la creation de `Window` dans `resumed()` (pas dans le constructeur). (4) Adapter le pattern input : `WindowEvent::KeyboardInput`, `WindowEvent::CursorMoved`, `WindowEvent::MouseInput`. (5) `RedrawRequested` declenche le rendu.
- **Tests** : `cargo build -p mge-platform` -- compile. Test manuel : fenetre s'ouvre et se ferme proprement.
- **Ref** : Tech-spec E-10, Context7 winit 0.30
- **SEC** : --

### TASK-008: Fenetre wgpu fonctionnelle nouveau pattern
- **Crate(s)** : mge-platform
- **Fichier(s)** : `crates/kernel/mge-platform/src/gpu.rs`, `crates/kernel/mge-platform/src/app.rs`
- **Agent** : F | **Modele** : O (kernel GPU critique)
- **Deps** : [007] | **Vague** : V0.3
- **Implementation** : (1) Dans `resumed()`, creer `wgpu::Surface` depuis la window. (2) `request_adapter()` + `request_device()` pour obtenir Device/Queue. (3) Configurer surface format (Bgra8UnormSrgb prefere). (4) Dans `window_event(RedrawRequested)` : `surface.get_current_texture()` -> `create_view()` -> encoder clear color (cornflower blue) -> `present()`. (5) Appeler `window.request_redraw()` dans `about_to_wait()`.
- **Tests** : `cargo build -p mge-platform` -- compile. Test manuel : fenetre avec clear color bleu.
- **Ref** : Tech-spec E-10, Context7 wgpu 24.0
- **SEC** : --

---

### V0.4 -- Rendu et systemes (4 taches, paralleles F/L)

### TASK-009: Pipeline rendu sprite basique
- **Crate(s)** : mge-render
- **Fichier(s)** : `crates/engine/mge-render/src/pipeline.rs`, `crates/engine/mge-render/src/sprite.rs`
- **Agent** : F | **Modele** : O (GPU pipeline)
- **Deps** : [008] | **Vague** : V0.4
- **Implementation** : (1) Creer `SpritePipeline::new(device, format)` : charger `sprite.wgsl`, creer bind group layout (texture + sampler + camera uniform), creer render pipeline. (2) `SpriteBatcher` : accumule instances `SpriteInstance { position, uv_rect, color }`, flush en 1 draw call instancie. (3) Render dans le pass existant : `set_pipeline()`, `set_bind_group()`, `draw_indexed()` instancie. (4) Tester avec 1 sprite 32x32 blanc.
- **Tests** : `cargo test -p mge-render -- sprite_pipeline` -- pipeline cree sans panic. Test visuel : 1 sprite affiche.
- **Ref** : Inventaire mge-render 128 tests
- **SEC** : --

### TASK-010: TileMap isometrique
- **Crate(s)** : mge-render, mge-math
- **Fichier(s)** : `crates/engine/mge-render/src/tile.rs`, `crates/kernel/mge-math/src/lib.rs` (fn iso)
- **Agent** : L | **Modele** : S (UI/rendu)
- **Deps** : [008] | **Vague** : V0.4
- **Implementation** : (1) `TileMap::new(width, height, tile_size)` : grille 2D de `TileId`. (2) Conversion iso 2:1 : `world_to_screen(x,y) = ((x-y)*tile_w/2, (x+y)*tile_h/2)` et inverse. (3) `Camera2D { position, zoom }` : viewport scroll + zoom. (4) Rendu : iterer les tiles visibles (culling par viewport), generer instances via `SpriteBatcher`. (5) Test : grille 20x20 herbe iso.
- **Tests** : `cargo test -p mge-math -- iso_world_to_screen` + `cargo test -p mge-render -- tilemap_render_visible` -- formules iso correctes, tiles visibles uniquement
- **Ref** : mge-math iso.rs existant
- **SEC** : --

### TASK-011: Sprite anime avec AnimationController
- **Crate(s)** : mge-render
- **Fichier(s)** : `crates/engine/mge-render/src/animation.rs`
- **Agent** : L | **Modele** : S (UI/rendu)
- **Deps** : [008] | **Vague** : V0.4
- **Implementation** : (1) `AnimationDef` : charge depuis TOML (frame_count, fps, loop_mode). (2) `AnimationController` : FSM avec etats `Idle`, `Walk`, `Attack`, `Death`. Transitions declenchees par evenements. (3) `tick(dt)` : avance frame_timer, change frame_index. (4) `current_uv_rect()` : retourne le rect UV dans l'atlas pour le batcher. (5) Support atlas multi-row (1 row = 1 animation).
- **Tests** : `cargo test -p mge-render -- animation_fsm_transition` + `animation_frame_advance` -- transitions correctes, frame avance au bon fps
- **Ref** : mge-render AnimationController existant
- **SEC** : --

### TASK-012: Validation pathfinding A*
- **Crate(s)** : mge-pathfinding
- **Fichier(s)** : `crates/engine/mge-pathfinding/src/*.rs`
- **Agent** : F | **Modele** : S (algo)
- **Deps** : [] | **Vague** : V0.4
- **Implementation** : (1) Valider les 14 tests existants. (2) Ajouter test NavGrid 20x20 avec obstacles : chemin correct autour des obstacles. (3) Ajouter bench A* 200x200 grille : doit completer en <5ms (budget CPU). (4) Verifier heuristique octile : `max(dx,dy) + (sqrt2-1)*min(dx,dy)`. (5) Verifier budget max 500 noeuds.
- **Tests** : `cargo test -p mge-pathfinding` -- 14+2 PASS. `cargo bench -p mge-pathfinding` -- <5ms sur 200x200
- **Ref** : Tech-spec target A* <500 noeuds
- **SEC** : --

---

### V0.5 -- Scene test + integration (2 taches, sequentielles)

### TASK-013: Scene test minimale (tiles + sprite + pathfinding)
- **Crate(s)** : sodomight-client
- **Fichier(s)** : `games/sodomight-client/src/game.rs`
- **Agent** : F+L | **Modele** : S (integration)
- **Deps** : [009, 010, 011, 012] | **Vague** : V0.5
- **Implementation** : (1) Dans `Game::init()` : creer TileMap 20x20 herbe, charger atlas personnage, creer AnimationController en Idle. (2) Spawner 1 entite joueur ECS avec Position, Sprite, Animation composants. (3) Rendu : TileMap puis sprites tries par Y (painter sort iso). (4) Camera centree sur joueur.
- **Tests** : `cargo build -p sodomight-client` -- compile. Test visuel : map iso + 1 sprite idle.
- **Ref** : Tech-spec scene test
- **SEC** : --

### TASK-014: Input clic-move avec pathfinding
- **Crate(s)** : sodomight-client
- **Fichier(s)** : `games/sodomight-client/src/game.rs`, `games/sodomight-client/src/state.rs`
- **Agent** : F | **Modele** : S (gameplay)
- **Deps** : [013] | **Vague** : V0.5
- **Implementation** : (1) Mouse click -> `screen_to_world()` (inverse iso). (2) Position joueur -> position clic : appel A* sur NavGrid. (3) Si chemin trouve : stocker `Vec<GridPos>` dans composant `Path`. (4) System `move_along_path(dt)` : lerp position vers next waypoint, vitesse = 4 tiles/s. (5) Transition animation Idle->Walk pendant mouvement, Walk->Idle a l'arrivee.
- **Tests** : `cargo test -p sodomight-client -- click_move_path` -- test unitaire : path calcule, position avance. Test visuel : clic = entite marche.
- **Ref** : Tech-spec clic-move
- **SEC** : --

---

### V0.6 -- Gate Sprint 0 (2 taches)

### TASK-015: Smoke test e2e Sprint 0
- **Crate(s)** : workspace
- **Fichier(s)** : aucun (validation)
- **Agent** : D | **Modele** : S (integration)
- **Deps** : [014] | **Vague** : V0.6
- **Implementation** : Test e2e : (1) `cargo build --workspace` 0 erreur. (2) `cargo clippy --workspace -- -D warnings` 0 warning. (3) `cargo test --workspace` tous PASS (hors `#[ignore]` GPU). (4) Lancer sodomight-client : fenetre s'ouvre, map iso visible, clic = entite se deplace. (5) Fermer proprement.
- **Tests** : Les 3 commandes ci-dessus + validation visuelle
- **Ref** : Jalon S0
- **SEC** : --

### TASK-022: Checkpoint Sprint 0
- **Crate(s)** : workspace
- **Fichier(s)** : aucun (gate)
- **Agent** : D | **Modele** : S (coordination)
- **Deps** : [toutes S0] | **Vague** : V0.6
- **Implementation** : (1) Verifier toutes les taches S0 completees. (2) MAJ metriques. (3) `git tag sprint-0-done`. (4) Push tag + branche. (5) Annoncer completion dans le chat.
- **Tests** : `git log --oneline` -- tous commits S0 presents. `git tag` -- sprint-0-done existe.
- **Ref** : MIP v2 checkpoints
- **SEC** : --

---

> Retour vers l'index : [sodomight-plan-index.md](sodomight-plan-index.md) | Sprint suivant : [sodomight-plan-S1.md](sodomight-plan-S1.md)
