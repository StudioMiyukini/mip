# PLAN -- Reforge Moteur Graphique MGE

<!-- @id: PLAN-MGE-Render-Reforge @do: plan @role: lead-dev @layer: 2 @human: denis -->

**Auteur** : Denis (Chef Dev Senior)
**Date** : 2026-03-02
**Phase** : P0 Temps 5 -- Plan exhaustif
**Chantier** : T5 -- Reforge Moteur Graphique MGE
**Statut** : En attente approbation utilisateur (Gate P0)
**Feature branch** : `feat/mge-render-reforge`

---

## Resume executif

Ce plan couvre la reforge complete du pipeline de rendu MGE, decomposee en 7 sprints et 58 taches atomiques. Le chantier transforme un prototype fonctionnel mais non scalable (13 render passes par frame, 0 animation, sprites statiques individuels, rendu texte bitmap ASCII 5x7) en un moteur instanced moderne (1-3 draw calls, animation FSM 8 directions, texture array, frustum culling formel, rendu texte TTF/OTF via fontdue, overhead UI world-space). Sprint 0 (fondations pipeline instanced) et Sprint 1 (animation + normes sprites) sont parallelisables. Sprint 1b (systeme de polices TTF/OTF) s'execute apres Sprint 0 (depend du pipeline instanced). Sprint 1c (overhead UI world-space) est parallelisable avec S0, S1, S1b et S2 : floating text style Ragnarok Online (degats, critiques, esquives flottant vers le haut), emotes sprite (icones 32x32 avec bounce sinusoidal), barres de progression overhead (gathering, crafting, casting). Sprint 2 livre l'outil CLI `mge-anim-pack` avec import PNG presets et export Aseprite optionnel. Sprint 3 migre le client Sodomight vers le nouveau pipeline, incluant la migration de BitmapFont vers TextRenderer et l'integration de l'overhead UI. Sprint 4 prepare les fondations de scalabilite Allumina (marque FUTURE pour les taches non essentielles au MVP). Estimation totale : ~4800 lignes de code, ~34 fichiers touches, 58 taches dont 53 taches actives et 5 taches FUTURE.

---

## Artefacts d'entree

| Artefact | Agent | Fichier |
|----------|-------|---------|
| Exploration | Maria | `.mip/briefs/BRIEF-mge-render-reforge-exploration.md` |
| Analyse concurrentielle | Fabrice | `.mip/briefs/BRIEF-mge-render-reforge-concurrence.md` |
| Specification technique | Francois | `.mip/specs/SPEC-mge-render-reforge.md` |

---

## Sprints et taches

### Sprint 0 -- Fondations Pipeline Instanced (12 taches)

Ce sprint construit le nouveau pipeline de rendu instanced dans `mge-render`. Aucune modification du client Sodomight -- tout reste dans le crate engine. Le feature flag `instanced` est cree pour activer le nouveau pipeline.

---

#### S0-T01 : Feature flags et dependance mge-math

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/Cargo.toml`
- **Description** : Ajouter les feature flags `instanced` (defaut) et `legacy-batcher` dans le Cargo.toml de mge-render. Ajouter la dependance `mge-math = { path = "../../kernel/mge-math" }` necessaire pour le type `Aabb` utilise par le culling. Mettre a jour la section `[features]` : `default = ["dual-res", "instanced"]`.
- **Tests** : `cargo build -p mge-render` compile sans erreur. `cargo build -p mge-render --no-default-features --features legacy-batcher` compile aussi.
- **Dependances** : Aucune
- **Effort** : Faible

---

#### S0-T02 : Struct InstanceData + tests bytemuck

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/instanced.rs` (creation)
- **Description** : Creer le module `instanced.rs` avec la struct `InstanceData` (64 bytes, `#[repr(C)]`, derive Pod + Zeroable). Champs : position [f32;2], size [f32;2], uv_rect [f32;4], tint [f32;4], texture_index u32, z_depth f32, _pad [f32;2]. Conditionner le module entier sous `#[cfg(feature = "instanced")]`. Ajouter l'annotation MSCM `@id: MGE-Render-Instanced`.
- **Tests** :
  - `instance_data_size_is_64_bytes` : `assert_eq!(size_of::<InstanceData>(), 64)`
  - `instance_data_is_pod` : `bytemuck::cast_slice::<InstanceData, u8>` ne panique pas
- **Dependances** : Aucune
- **Effort** : Faible

---

#### S0-T03 : InstancedSpriteBatcher (CPU-side staging)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/instanced.rs`
- **Description** : Ajouter la struct `InstancedSpriteBatcher` dans le meme module. Methodes : `new(max_instances: u32)`, `clear()`, `push(instance: InstanceData) -> Result<(), RenderError>`, `sort_by_depth()`, `count() -> u32`, `as_bytes() -> &[u8]` (via bytemuck). Le batcher stocke un `Vec<InstanceData>` CPU-side. Le push retourne `Err(InstanceBufferFull)` si la capacite est depassee.
- **Tests** :
  - `instanced_batcher_push_and_count` : Push 100 instances, count == 100
  - `instanced_batcher_clear` : Clear remet le count a 0
  - `instanced_batcher_capacity_limit` : Push au-dela de max retourne Err
  - `instanced_batcher_sort_by_depth` : Les instances sont triees par z_depth croissant
  - `instanced_batcher_sort_by_layer_then_depth` : Tri primaire par texture_index (proxy layer), secondaire par z_depth
- **Dependances** : S0-T02
- **Effort** : Moyen

---

#### S0-T04 : Shader sprite_instanced.wgsl

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/sprite_instanced.wgsl` (creation)
- **Description** : Creer le shader WGSL tel que specifie dans la section 6 de la SPEC. Le vertex shader genere les 4 coins du quad unitaire via `@builtin(vertex_index)`, indexe le storage buffer par `@builtin(instance_index)`. Le fragment shader sample la `texture_2d_array` par `texture_index` de l'instance. Alpha discard a 0.01. Ajouter les annotations MSCM en commentaire WGSL.
- **Tests** : Validation syntaxique via `naga` (le validateur wgpu). Test : charger le shader comme string, parser avec `naga::front::wgsl::parse_str()` sans erreur.
- **Dependances** : Aucune
- **Effort** : Moyen

---

#### S0-T05 : TextureArray (gestion texture_2d_array)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/instanced.rs`
- **Description** : Ajouter la struct `TextureArray` au module instanced. Methodes : `new(device, width, height, max_layers, format)` cree la `wgpu::Texture` de type `Dimension::D2`, `size.depth_or_array_layers = max_layers`. `add_layer(queue, image: &RgbaImage) -> Result<u32, RenderError>` ecrit dans la layer suivante via `queue.write_texture()` et retourne l'index de la layer. `view()` retourne la `TextureView` avec `dimension: D2Array`. `bind_group()` retourne le bind group pre-construit (texture array + sampler).
- **Tests** :
  - `texture_array_layer_assignment` : Insertion de 3 images donne les indices 0, 1, 2 (test CPU-only, sans device GPU -- utiliser un compteur mock)
- **Dependances** : S0-T02
- **Effort** : Eleve

---

#### S0-T06 : InstancedSpritePipeline (pipeline wgpu)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/instanced.rs`
- **Description** : Ajouter la struct `InstancedSpritePipeline`. Le constructeur `new(device, format, shader_source)` cree le `RenderPipeline` avec le bind group layout a deux groups : group(0) = camera uniform + storage buffer instances, group(1) = texture_2d_array + sampler. Le vertex buffer est un index buffer statique (6 indices u16 : 0,1,2,2,3,0). Methode `render(pass, camera_bind_group, texture_bind_group, instance_count)` effectue le draw call instanced. Alpha blending `SrcAlpha / OneMinusSrcAlpha`. Depth test avec `DepthStencilState` (format `Depth32Float`, `less`).
- **Tests** : Test CPU-only de la construction des bind group layouts (verifier que les entries correspondent au shader).
- **Dependances** : S0-T04, S0-T05
- **Effort** : Eleve

---

#### S0-T07 : Nouvelles variantes RenderError

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/errors.rs`
- **Description** : Ajouter trois variantes a l'enum `RenderError` : `AnimationNotFound { entity, state, direction }`, `TextureArrayFull { max_layers }`, `InstanceBufferFull { max_instances }`. Conserver toutes les variantes existantes.
- **Tests** :
  - `error_display_animation_not_found` : Verifie le message Display
  - `error_display_texture_array_full` : Verifie le message Display
  - `error_display_instance_buffer_full` : Verifie le message Display
- **Dependances** : Aucune
- **Effort** : Faible

---

#### S0-T08 : Camera2D::visible_rect()

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/camera.rs`
- **Description** : Ajouter la methode `pub fn visible_rect(&self) -> mge_math::Aabb` a `Camera2D`. Calcul : `half_w = (screen_w as f32 / zoom) / 2.0`, `half_h = (screen_h as f32 / zoom) / 2.0`. Retourne `Aabb::new(Vec2::new(world_x - half_w, world_y - half_h), Vec2::new(world_x + half_w, world_y + half_h))`. Necessite `use mge_math::{Aabb, Vec2};` en haut du fichier.
- **Tests** :
  - `camera_visible_rect_at_zoom_1` : Camera 800x600 centree a (0,0) retourne (-400,-300)-(400,300)
  - `camera_visible_rect_at_zoom_2` : Meme camera a zoom 2.0 retourne (-200,-150)-(200,150)
- **Dependances** : S0-T01 (dependance mge-math)
- **Effort** : Faible

---

#### S0-T09 : RenderSpatialGrid (hash grid)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/culling.rs` (creation)
- **Description** : Creer le module `culling.rs` avec annotation MSCM `@id: MGE-Render-Culling`. Struct `RenderSpatialGrid` avec `cell_size: f32` (defaut 256.0), `cells: HashMap<(i32,i32), Vec<RenderEntity>>`. Struct `RenderEntity` : `entity_id: u32, screen_aabb: Aabb, layer: RenderLayer, z_depth: f32`. Methodes : `new(cell_size)`, `clear()`, `insert(entity: RenderEntity)` (insere dans toutes les cellules couvertes par l'AABB), `query(aabb: Aabb) -> Vec<RenderEntity>` (retourne les entites dans les cellules qui intersectent l'AABB, deduplique par entity_id).
- **Tests** :
  - `render_spatial_grid_insert_and_query` : Insert 1 entite, query AABB englobant la retrouve
  - `render_spatial_grid_empty_query` : Query sur zone vide retourne vide
  - `render_spatial_grid_clear` : Clear puis query retourne vide
  - `render_spatial_grid_multi_cell_entity` : Entite large (couvre 4 cellules), query la retrouve exactement 1 fois
- **Dependances** : S0-T01 (mge-math pour Aabb), S0-T07 (RenderLayer via sprite.rs)
- **Effort** : Moyen

---

#### S0-T10 : FrustumCuller (orchestrateur)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/culling.rs`
- **Description** : Ajouter la struct `FrustumCuller` dans culling.rs. Methode `cull(camera: &Camera2D, grid: &RenderSpatialGrid, margin: f32) -> Vec<RenderEntity>`. Pipeline : (1) `camera.visible_rect()`, (2) expansion de la marge (+margin px chaque cote), (3) `grid.query(expanded)`, (4) tri par `(layer, z_depth)`. Retourne les entites visibles triees prete pour le batcher.
- **Tests** :
  - `frustum_culler_filters_offscreen` : 10 entites, 3 dans le viewport, 7 hors -- retourne 3
  - `frustum_culler_dedup` : Entite dans 2 cellules n'apparait qu'une fois dans le resultat
- **Dependances** : S0-T08, S0-T09
- **Effort** : Moyen

---

#### S0-T11 : Re-exports lib.rs + atlas.rs enrichi

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/lib.rs`
  - `mge/crates/engine/mge-render/src/atlas.rs`
- **Description** : Dans `lib.rs`, ajouter les declarations de modules (conditionnees par feature `instanced`) et les re-exports publics des types animation, instanced, culling. Dans `atlas.rs`, ajouter le champ optionnel `animation_tag: Option<String>` avec `#[serde(default)]` a `AtlasFrame`. Ajouter la methode `get_uv_flipped(&self, frame_name: &str) -> Option<[f32;4]>` a `TextureAtlas` pour les directions miroir.
- **Tests** :
  - `atlas_frame_animation_tag_default` : Deserialise un TOML sans `animation_tag`, obtient None
  - `atlas_get_uv_flipped_reverses_u` : Les u_min et u_max sont echanges par rapport a `get_uv`
- **Dependances** : S0-T02, S0-T07, S0-T09
- **Effort** : Faible

---

#### S0-T12 : Tests d'integration pipeline instanced

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/tests.rs`
- **Description** : Ajouter les tests d'integration CPU-only dans le module tests existant. Test `integration_culling_pipeline` : cree une Camera2D 800x600, un RenderSpatialGrid avec 100 entites reparties, verifie que `FrustumCuller::cull()` retourne uniquement les entites dans le viewport. Test `instanced_batcher_roundtrip` : cree un InstancedSpriteBatcher, push 50 instances, sort, verifie l'ordre et le count.
- **Tests** : Ce sont les tests eux-memes.
- **Dependances** : S0-T03, S0-T08, S0-T09, S0-T10
- **Effort** : Moyen

---

### Sprint 1 -- Animation & Normes Sprites (11 taches)

Ce sprint construit le systeme d'animation (FSM, AnimationBank, Direction) et formalise les normes de sprites. Parallelisable avec Sprint 0 sauf pour la tache d'integration finale.

---

#### S1-T01 : Enums AnimationState et Direction

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/animation.rs` (creation)
- **Description** : Creer le module `animation.rs` avec annotation MSCM `@id: MGE-Render-Animation`. Definir l'enum `AnimationState` (Idle, Walk, Attack, Hit, Death, Cast, Special) avec derives Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize. Definir l'enum `Direction` (S=0, SW=1, W=2, NW=3, N=4, NE=5, E=6, SE=7) avec `#[repr(u8)]` et memes derives. Implementer `Direction::RENDERED`, `Direction::mirror_source()`, `Direction::from_velocity(dx, dy)`.
- **Tests** :
  - `direction_mirror_source_rendered` : Les 4 directions rendues retournent `(self, false)`
  - `direction_mirror_source_mirrored` : NE->(SW,true), E->(W,true), SE->(NW,true), N->(S,false)
  - `direction_from_velocity_cardinals` : (0,-1)->N, (1,0)->E, (0,1)->S, (-1,0)->W
  - `direction_from_velocity_diagonals` : (1,-1)->NE, (1,1)->SE, (-1,1)->SW, (-1,-1)->NW
- **Dependances** : Aucune
- **Effort** : Faible

---

#### S1-T02 : AnimationClip et FrameEvent structs

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/animation.rs`
- **Description** : Ajouter les structs `AnimationClip` (frame_count u32, frame_duration f32, looping bool, events Vec<FrameEvent>), `FrameEvent` (frame u32, kind FrameEventKind), et l'enum `FrameEventKind` (Damage, Sfx{id}, Vfx{id}, Projectile{id}). Tout avec derives Serialize/Deserialize. Le champ `events` porte `#[serde(default)]`.
- **Tests** :
  - `animation_clip_default_events_empty` : Deserialise TOML sans events, obtient vec vide
  - `frame_event_kind_serialization_roundtrip` : Serialize puis deserialise chaque variante
- **Dependances** : S1-T01
- **Effort** : Faible

---

#### S1-T03 : AnimationBank (chargement TOML)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/animation.rs`
- **Description** : Ajouter la struct `AnimationBank` avec `clips: HashMap<(String, AnimationState, Direction), AnimationClip>`. Methodes : `new()` (vide), `load_toml(toml_str: &str) -> Result<Self, RenderError>` (parse le format defini en section 5.2 de la SPEC), `get_clip(entity: &str, state: AnimationState, dir: Direction) -> Option<&AnimationClip>`, `clip_count() -> usize`. Pour les directions miroir, `get_clip` recherche d'abord la direction exacte, puis la source miroir.
- **Tests** :
  - `animation_bank_load_toml` : Charge un TOML minimal valide et retrouve un clip
  - `animation_bank_missing_clip` : Retourne None pour un clip inexistant
  - `animation_bank_mirror_fallback` : Demande direction E, trouve le clip de W
- **Dependances** : S1-T01, S1-T02, S0-T07
- **Effort** : Moyen

---

#### S1-T04 : AnimationController (FSM)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/animation.rs`
- **Description** : Ajouter la struct `AnimationController` avec champs state, direction, frame_index, frame_timer, finished. Methodes : `new()` (Idle, S, 0, 0.0, false), `set_state(state)` (no-op si deja dans cet etat, sinon reset frame), `set_direction(dir)`, `tick(dt, clip) -> bool` (avance le timer, change de frame, gere loop/oneshot, retourne true si frame a change), `current_frame_name(entity_id) -> String` (format `{entity}_{state}_{dir}_{frame:03d}`), `is_mirrored() -> bool`.
- **Tests** :
  - `animation_controller_init_state` : Etat initial = Idle, S, frame 0
  - `animation_controller_set_state_resets_frame` : Changement state remet frame_index a 0
  - `animation_controller_tick_advances_frame` : dt > frame_duration avance la frame
  - `animation_controller_loop_wraps` : Looping revient a frame 0 apres la derniere
  - `animation_controller_oneshot_stops` : Non-looping met finished=true
  - `animation_controller_frame_name_format` : Verifie le format de sortie exact
- **Dependances** : S1-T01, S1-T02
- **Effort** : Moyen

---

#### S1-T05 : SpriteSize refactore (normes de taille)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/animation.rs`
- **Description** : Ajouter l'enum `SpriteSize` dans animation.rs avec les nouvelles dimensions pour sprites animes directionnels : Small(64x64), Medium(96x128), Humanoid(96x192), Large(128x256), Boss(192x384). Derives Serialize/Deserialize. Methode `dimensions() -> (u32, u32)`. Cette enum est distincte de celle dans `sodomight-client/d2_sprites.rs` qui sera deprecie lors de la migration Sprint 3.
- **Tests** :
  - `sprite_size_dimensions_correct` : Verifie les 5 paires (w,h)
  - `sprite_size_serialization_roundtrip` : Chaque variante survit un roundtrip serde
- **Dependances** : Aucune
- **Effort** : Faible

---

#### S1-T06 : Tests d'integration animation pipeline

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/tests.rs`
- **Description** : Ajouter le test `integration_animation_pipeline` : cree un AnimationBank avec un TOML de test contenant 2 clips (idle 8 frames looping, attack 16 frames oneshot avec event Damage a frame 8), cree un AnimationController, tick 10 fois avec dt = clip.frame_duration, verifie que les frame_names correspondent au format attendu, verifie que le passage idle->attack remet frame a 0, verifie que l'event Damage est sur la bonne frame.
- **Tests** : Ce sont les tests eux-memes.
- **Dependances** : S1-T01, S1-T02, S1-T03, S1-T04
- **Effort** : Faible

---

#### S1-T07 : Re-exports animation dans lib.rs

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/lib.rs`
- **Description** : Ajouter `pub mod animation;` et les re-exports : `AnimationBank, AnimationClip, AnimationController, AnimationState, Direction, FrameEvent, FrameEventKind, SpriteSize as AnimSpriteSize` (alias pour eviter conflit avec l'ancien SpriteSize du client). Ceci est conditionne par le feature flag `instanced`.
- **Tests** : `cargo build -p mge-render` compile sans erreur. Les types sont accessibles depuis l'exterieur.
- **Dependances** : S1-T01 a S1-T05, S0-T11
- **Effort** : Faible

---

#### S1-T08 : Documentation des normes de sprites (TOML)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/docs/sprite-norms.toml` (creation)
  - `mge/docs/SPRITE-NORMS.md` (creation)
- **Description** : Creer le fichier TOML de reference des normes de sprites : convention de nommage `{entity}_{action}_{dir}_{frame:03d}.png`, 5 classes de taille, 8 directions (4 rendues + 4 miroir), etats d'animation standard (idle, walk, attack, hit, death, cast, special). Creer la doc markdown associee avec exemples visuels (ASCII art des directions). Ce sont les artefacts de reference pour les artistes et pour l'outil `mge-anim-pack`.
- **Tests** : Le TOML est valide (parsable par `toml::from_str`). Validation manuelle du contenu.
- **Dependances** : Aucune
- **Effort** : Faible

---

#### S1-T09 : Depreciation SpriteInstance (ancien systeme)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/sprite.rs`
- **Description** : Ajouter l'attribut `#[deprecated(since = "0.2.0", note = "Use InstanceData with the instanced pipeline")]` sur `SpriteInstance`. Ajouter un commentaire de module expliquant que le systeme de batching par SpriteInstance est conserve sous le feature flag `legacy-batcher` pour retrocompatibilite. Aucune suppression de code.
- **Tests** : `cargo build -p mge-render` compile sans erreur, avec un warning de depreciation si `SpriteInstance` est utilise.
- **Dependances** : S0-T02
- **Effort** : Faible

---

#### S1-T10 : Checkpoint Sprint 0+1 -- Build + Clippy mge-render

- **Agent** : Denis (checkpoint)
- **Fichiers touches** : Aucun (verification)
- **Description** : Checkpoint Denis apres les 10 taches precedentes de Sprint 0+1. Executer `cargo build -p mge-render`, `cargo clippy -p mge-render -- -D warnings`, `cargo test -p mge-render`. Verifier que tous les tests passent, zero warning clippy, les re-exports sont corrects. Pousser l'etat courant : `git push`.
- **Tests** : Build + clippy + tests du crate mge-render.
- **Dependances** : S0-T01 a S0-T12, S1-T01 a S1-T09
- **Effort** : Faible

---

#### S1-T11 : Format TOML animation enrichi (validation)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/animation.rs`
- **Description** : Ajouter un validateur `AnimationBank::validate() -> Vec<String>` qui verifie : (1) chaque clip a frame_count > 0, (2) frame_duration > 0.0, (3) les events ont un frame < frame_count, (4) les 4 directions rendues (S,SW,W,NW) existent pour chaque (entity, state). Retourne la liste des avertissements (pas d'erreur fatale pour permettre les assets incomplets en dev).
- **Tests** :
  - `animation_bank_validate_passes_valid` : Bank complete passe sans avertissement
  - `animation_bank_validate_warns_missing_direction` : Bank sans SW pour walk genere un warning
  - `animation_bank_validate_warns_zero_frames` : Clip avec frame_count=0 genere un warning
- **Dependances** : S1-T03
- **Effort** : Faible

---

### Sprint 1b -- Systeme de polices TTF/OTF (7 taches)

Ce sprint construit le systeme de rendu texte TTF/OTF dans `mge-render`, remplacant le bitmap font procedural ASCII. Utilise le crate `fontdue` (v0.9) pour la rasterisation. S'execute apres Sprint 0 (depend du pipeline instanced pour l'integration glyph atlas dans TextureArray et InstancedSpriteBatcher). Parallelisable avec Sprint 1 et Sprint 2.

---

#### S1b-T01 : Dependance fontdue + variantes RenderError texte

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/Cargo.toml`
  - `mge/crates/engine/mge-render/src/errors.rs`
- **Description** : Ajouter la dependance `fontdue = "0.9"` dans le Cargo.toml de mge-render (dep runtime, pas optionnelle). Ajouter deux variantes a l'enum `RenderError` : `FontLoadFailed { name: String, reason: String }` et `GlyphAtlasFull { width: u32, height: u32, cached_count: usize }`. Ces erreurs couvrent les echecs de chargement de police et la saturation de l'atlas de glyphes.
- **Tests** :
  - `error_display_font_load_failed` : Verifie le message Display
  - `error_display_glyph_atlas_full` : Verifie le message Display
- **Dependances** : S0-T07 (variantes RenderError existantes)
- **Effort** : Faible

---

#### S1b-T02 : Struct TtfFont (chargement + rasterisation)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/text.rs` (creation)
- **Description** : Creer le module `text.rs` avec annotation MSCM `@id: MGE-Render-Text`. Definir la struct `TtfFont` qui encapsule `fontdue::Font`. Methodes : `from_bytes(data: &[u8], name: &str) -> Result<Self, RenderError>` charge une police depuis des bytes bruts, `from_file(path: &Path) -> Result<Self, RenderError>` charge depuis un fichier, `rasterize(ch: char, px_size: f32) -> (GlyphMetrics, Vec<u8>)` rasterise un glyphe en bitmap alpha, `metrics(ch: char, px_size: f32) -> GlyphMetrics` retourne les metriques sans rasteriser. Definir `GlyphMetrics` : width, height, xmin, ymin, advance_width.
- **Tests** :
  - `ttf_font_load_valid` : Charge `mge/assets/fonts/DigitalDisco.ttf`, pas d'erreur
  - `ttf_font_load_invalid_bytes` : Bytes invalides retournent `RenderError::FontLoadFailed`
  - `ttf_font_rasterize_ascii` : 'A' a 24px retourne bitmap non-vide (width > 0, height > 0)
  - `ttf_font_rasterize_accented` : 'e' (U+00E9) retourne bitmap valide
  - `ttf_font_metrics_advance_positive` : `advance_width` de 'A' a 24px > 0.0
- **Dependances** : S1b-T01
- **Effort** : Moyen

---

#### S1b-T03 : GlyphCache (atlas dynamique shelf-first)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/text.rs`
- **Description** : Ajouter les structs `GlyphKey` (font_index u16, character char, quantized_size u16) et `CachedGlyph` (uv_rect [f32;4], metrics GlyphMetrics, texture_layer u32) au module text.rs. Ajouter la struct `GlyphCache` avec un allocateur shelf-first. Methodes : `new(atlas_width, atlas_height)`, `get_or_insert(key, font) -> Result<CachedGlyph, RenderError>` rasterise si absent et insere dans l'atlas RGBA (glyphe alpha converti en [255,255,255,alpha]), `is_dirty()`, `take_atlas()`, `clear()`, `len()`, `is_empty()`. La quantification de taille `(px_size * 2.0).round() as u16` evite l'explosion du cache.
- **Tests** :
  - `glyph_cache_insert_and_retrieve` : Insert puis retrouve par meme cle
  - `glyph_cache_dedup` : Meme glyphe 2 fois, len == 1
  - `glyph_cache_dirty_flag` : Neuf = not dirty, apres insert = dirty, apres take_atlas = not dirty
  - `glyph_cache_clear` : Clear vide le cache et marque dirty
- **Dependances** : S1b-T02
- **Effort** : Moyen

---

#### S1b-T04 : TextRenderer (API haut niveau)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/text.rs`
- **Description** : Ajouter les structs `FontId(u16)` et `TextRenderer` dans text.rs. Le `TextRenderer` contient un `Vec<TtfFont>` (registre de polices), un `GlyphCache`, et un `default_font`/`default_size`. Methodes : `new(atlas_width, atlas_height)`, `add_font(data, name) -> Result<FontId, RenderError>`, `add_font_file(path) -> Result<FontId, RenderError>`, `set_default(font, size)`, `push_text(batcher, x, y, text, font, px_size, color, z_depth, texture_layer) -> Result<f32, RenderError>` (pousse les glyphes comme instances dans le batcher, retourne la largeur), `push_text_default(...)`, `measure_width(text, font, px_size) -> f32`, `line_height(font, px_size) -> f32`, `needs_upload() -> bool`, `take_atlas()`, `clear_cache()`.
- **Tests** :
  - `text_renderer_measure_width` : `measure_width("Hello", font, 24.0)` > 0.0
  - `text_renderer_multi_font` : 2 polices, mesurer avec chacune, largeurs differentes
- **Dependances** : S1b-T03, S0-T03 (InstancedSpriteBatcher pour push_text)
- **Effort** : Eleve

---

#### S1b-T05 : Re-exports text dans lib.rs

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/lib.rs`
- **Description** : Ajouter `pub mod text;` et les re-exports : `FontId, GlyphCache, GlyphKey, GlyphMetrics, CachedGlyph, TextRenderer, TtfFont`. Conditionne par le feature flag `instanced` (comme animation et culling).
- **Tests** : `cargo build -p mge-render` compile. Les types sont accessibles depuis l'exterieur.
- **Dependances** : S1b-T04, S0-T11 (re-exports existants)
- **Effort** : Faible

---

#### S1b-T06 : Tests d'integration TextRenderer

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/tests.rs`
- **Description** : Ajouter le test `integration_text_renderer_pipeline` : charge 2 polices TTF depuis `mge/assets/fonts/` (DigitalDisco + GentiumBookPlus), cree un TextRenderer 1024x1024, rasterise "Hello e a c" en 2 tailles (16px et 32px) via measure_width (pas de batcher GPU necessaire pour le test CPU), verifie que glyph_cache.len() > 0, verifie que les largeurs mesurees sont positives et coherentes (32px > 16px pour le meme texte), verifie que l'atlas est dirty apres rasterisation.
- **Tests** : Ce sont les tests eux-memes.
- **Dependances** : S1b-T02, S1b-T03, S1b-T04
- **Effort** : Faible

---

#### S1b-T07 : Checkpoint Sprint 1b -- Build + Clippy + Tests text

- **Agent** : Denis (checkpoint)
- **Fichiers touches** : Aucun (verification)
- **Description** : Checkpoint Denis apres les 6 taches text de Sprint 1b. Executer `cargo build -p mge-render`, `cargo clippy -p mge-render -- -D warnings`, `cargo test -p mge-render`. Verifier que les 11 tests text passent, zero warning clippy, les re-exports sont corrects. Verifier que `fontdue` compile correctement sur Windows et que les polices TTF dans `mge/assets/fonts/` se chargent. Pousser : `git push`.
- **Tests** : Build + clippy + tests du crate mge-render (tous modules).
- **Dependances** : S1b-T01 a S1b-T06
- **Effort** : Faible

---

### Sprint 1c -- World-Space Overhead UI (6 taches)

Ce sprint ajoute le systeme d'UI overhead world-space : textes flottants style Ragnarok Online (degats, critiques, esquives), emotes sprite avec bounce sinusoidal, et barres de progression overhead (gathering, crafting, casting). Parallelisable avec S0, S1, S1b, S2. Depend de S1b-T04 (TextRenderer) pour le rendu texte flottant et de S0-T03 (InstancedSpriteBatcher) pour le rendu sprite.

---

#### S1c-T01 : Enum FloatingTextKind + struct FloatingText

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/overhead.rs` (creation)
- **Description** : Creer le module `overhead.rs`. Definir l'enum `FloatingTextKind` (Damage, Critical, Evade, Block, Heal, Gathered, Success, Failure, Experience) et la struct `FloatingText` (world_pos, text, kind, age, lifetime, y_offset, opacity). Chaque `FloatingTextKind` a des presets (couleur, taille police, vitesse de montee, duree de vie). Style inspire de Ragnarok Online : texte flotte vers le haut et disparait. Critical = orange plus gros avec shake horizontal.
- **Tests** :
  - `floating_text_kind_presets` : Chaque kind a une couleur, taille et lifetime distinctes
  - `floating_text_default_values` : FloatingText::new() initialise age=0, opacity=1.0, y_offset=0
- **Dependances** : Aucune
- **Effort** : Faible

---

#### S1c-T02 : FloatingTextManager (spawn, tick, render)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/overhead.rs`
- **Description** : Implementer `FloatingTextManager` avec : `spawn(world_pos, text, kind)` pour creer un texte flottant, `tick(dt)` pour mettre a jour (y_offset += rise_speed * dt, opacity diminue lineairement, age += dt, remove si age >= lifetime), methode `render()` qui pousse chaque texte au TextRenderer. Gestion du stacking : plusieurs textes sur la meme entite sont decales verticalement. Cap configurable (defaut 100 textes max). Critical a un shake horizontal sinusoidal +/-3px.
- **Tests** :
  - `floating_text_spawn_and_tick` : Spawn, tick a mi-vie, verifier y_offset > 0 et opacity < 1.0
  - `floating_text_removal_after_lifetime` : Tick au-dela de la lifetime, verifier suppression
  - `floating_text_stacking` : 3 textes au meme point, verifier decalage vertical
  - `floating_text_cap` : Spawn 101 textes, verifier que seuls 100 existent (le plus ancien est supprime)
- **Dependances** : S1c-T01, S1b-T04 (TextRenderer)
- **Effort** : Moyen

---

#### S1c-T03 : Emote System (EmoteKind, SpriteEmote, EmoteManager)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/overhead.rs`
- **Description** : Ajouter dans overhead.rs : enum `EmoteKind` (Happy, Angry, Sad, Confused, Exclamation, Question, Heart, Sleep, Skull, Coin), struct `SpriteEmote` (world_pos, kind, age, lifetime=3s, opacity, bounce_offset), `EmoteManager` avec spawn/tick/render. Les emotes sont des sprites 32x32px d'un atlas emotes. Animation bounce sinusoidal (amplitude 4px, periode 0.5s). Fade out dans les derniers 0.5s. 1 seul emote par entite (le nouveau remplace l'ancien).
- **Tests** :
  - `emote_spawn_and_bounce` : Spawn emote, tick, verifier que bounce_offset varie
  - `emote_replaces_existing` : 2 emotes meme position, verifier qu'un seul existe
  - `emote_fade_out` : Tick a lifetime - 0.3s, verifier opacity < 1.0
- **Dependances** : S1c-T01, S0-T03 (InstancedSpriteBatcher)
- **Effort** : Moyen

---

#### S1c-T04 : Overhead Progress Bar (OverheadProgressBar, ProgressBarManager)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/overhead.rs`
- **Description** : Ajouter : struct `OverheadProgressBar` (world_pos, progress 0-1, width=40px, height=6px, bg_color, fill_color, visible). `ProgressBarManager` avec set(entity_id, progress, fill_color), remove(entity_id), render(). Rendu : 2 quads instanced (background gris + fill couleur) sans texture (pixel blanc 1x1 dans le texture array). Cas d'usage : gathering (vert), crafting (bleu), casting (violet), chargement (blanc).
- **Tests** :
  - `progress_bar_set_and_update` : Set progress=0.3, update a 0.7, verifier valeur
  - `progress_bar_remove` : Remove, verifier visible=false
  - `progress_bar_clamp` : Set progress=1.5, verifier clamp a 1.0
- **Dependances** : S1c-T01, S0-T03 (InstancedSpriteBatcher)
- **Effort** : Moyen

---

#### S1c-T05 : Re-exports overhead dans lib.rs

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/lib.rs`
- **Description** : Ajouter `pub mod overhead;` dans lib.rs (sous feature `instanced`). Re-exporter : `FloatingTextKind`, `FloatingText`, `FloatingTextManager`, `EmoteKind`, `SpriteEmote`, `EmoteManager`, `OverheadProgressBar`, `ProgressBarManager`.
- **Tests** : Build compile sans erreur.
- **Dependances** : S1c-T01 a S1c-T04
- **Effort** : Faible

---

#### S1c-T06 : Checkpoint Sprint 1c -- Build + Clippy + Tests overhead

- **Agent** : Denis (checkpoint)
- **Fichiers touches** : Aucun (verification)
- **Description** : Checkpoint Denis apres Sprint 1c. Executer `cargo build -p mge-render`, `cargo clippy -p mge-render -- -D warnings`, `cargo test -p mge-render`. Verifier les annotations MSCM sur overhead.rs. Verifier que les 12 tests overhead passent, zero warning clippy, les re-exports sont corrects. Pousser : `git push`.
- **Tests** : Build + clippy + tests du crate mge-render (tous modules).
- **Dependances** : S1c-T01 a S1c-T05
- **Effort** : Faible

---

### Sprint 2 -- Outil CLI mge-anim-pack (11 taches)

Ce sprint cree le crate outil `mge-anim-pack` qui transforme des fichiers Aseprite ou des frames PNG en atlas + TOML prets pour le moteur. Inclut l'import PNG avec presets de metadata et l'export Aseprite optionnel.

---

#### S2-T01 : Scaffold crate mge-anim-pack

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/Cargo.toml` (creation)
  - `mge/tools/mge-anim-pack/src/lib.rs` (creation)
  - `mge/tools/mge-anim-pack/src/main.rs` (creation)
  - `mge/tools/mge-anim-pack/src/errors.rs` (creation)
  - `mge/Cargo.toml` (ajout membre workspace)
- **Description** : Creer la structure du crate avec Cargo.toml (dependances : asefile 0.3, rectangle-pack 0.4, clap 4.5, image, serde, toml, thiserror, tracing, mge-mirror, mge-packer). Le main.rs definit le CLI clap avec trois sous-commandes : `pack`, `validate`, `info`. Le lib.rs re-exporte les modules. Le errors.rs definit `AnimPackError` via thiserror. Ajouter le crate au workspace `mge/Cargo.toml`. Annotation MSCM `@id: MGE-AnimPack`.
- **Tests** : `cargo build -p mge-anim-pack` compile. `mge-anim-pack --help` affiche l'aide.
- **Dependances** : Aucune (independant des sprints 0-1)
- **Effort** : Moyen

---

#### S2-T02 : Module naming.rs (convention de nommage)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/naming.rs` (creation)
- **Description** : Implementer les fonctions de convention de nommage : `format_frame_name(entity: &str, action: &str, dir: &str, frame: u32) -> String` retourne `{entity}_{action}_{dir}_{frame:03d}`. `parse_frame_name(name: &str) -> Option<(String, String, String, u32)>` fait l'inverse. Validation : entity et action en lowercase, dir dans {s,sw,w,nw,n,ne,e,se}, frame en u32.
- **Tests** :
  - `naming_convention_format` : Verifie plusieurs combinaisons
  - `naming_convention_parse_roundtrip` : format puis parse retourne l'original
  - `naming_convention_parse_invalid` : Noms invalides retournent None
- **Dependances** : S2-T01
- **Effort** : Faible

---

#### S2-T03 : Module aseprite.rs (loader Aseprite natif)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/aseprite.rs` (creation)
- **Description** : Implementer le chargement de fichiers `.ase` via le crate `asefile`. Struct `AsepriteData` contenant : `frames: Vec<(String, RgbaImage)>` (nom genere + image), `animations: Vec<AnimationInfo>` (tag_name, from_frame, to_frame, direction). Fonction `load_aseprite(path: &Path, entity: &str) -> Result<AsepriteData, AnimPackError>`. Pour chaque tag, extraire les frames avec `file.frame(i).image()`, nommer selon la convention. Mapper les tags vers AnimationState via `map_tag_to_state()`.
- **Tests** :
  - `tag_to_state_mapping` : Verifie idle, walk, attack, hit, death, cast, special + synonymes
  - `tag_to_state_unknown` : Tag "random_string" retourne None
  - `aseprite_tag_extraction` : Test avec un `.ase` minimal embarque ou mock
- **Dependances** : S2-T01, S2-T02
- **Effort** : Eleve

---

#### S2-T04 : Module mirror.rs (generation miroir)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/mirror.rs` (creation)
- **Description** : Implementer la generation automatique des 4 directions miroir. Fonction `generate_mirrors(frames: &[(String, RgbaImage)]) -> Vec<(String, RgbaImage)>`. Pour chaque frame de direction SW, generer la frame SE par flip horizontal (via `image::imageops::flip_horizontal`). Idem W->E, NW->NE, S->N (fallback S sans flip pour N en MVP). Le nom de sortie suit la convention de nommage. Reutilise `mge-mirror` si possible, sinon implementation locale.
- **Tests** :
  - `mirror_generation_ne_from_sw` : Frame "necro_walk_sw_000" genere "necro_walk_ne_000" en flip
  - `mirror_generation_preserves_dimensions` : Memes dimensions apres flip
  - `mirror_generation_count` : 4 frames d'entree (S,SW,W,NW) generent 4 frames miroir (N,NE,E,SE)
- **Dependances** : S2-T01, S2-T02
- **Effort** : Moyen

---

#### S2-T05 : Module packer.rs (MaxRects atlas packing)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/packer.rs` (creation)
- **Description** : Implementer le packing de frames en atlas via `rectangle-pack`. Struct `PackResult` : `atlas_image: RgbaImage, frame_rects: HashMap<String, (u32, u32, u32, u32)>` (nom -> x, y, w, h). Fonction `pack_frames(frames: &[(String, RgbaImage)], max_size: u32, margin: u32) -> Result<PackResult, AnimPackError>`. Utilise `rectangle_pack::pack_rects()` avec `RectToInsert` pour chaque frame. Copie les images dans l'atlas final aux positions calculees. Erreur si les frames ne tiennent pas dans un atlas de `max_size`.
- **Tests** :
  - `maxrects_pack_basic` : Pack 10 frames 64x64 dans un atlas 512x512, verifie no-overlap
  - `maxrects_pack_various_sizes` : Frames de tailles differentes (64x64, 96x192, 128x256), verifie all-fit
  - `maxrects_pack_overflow` : 100 frames 512x512 dans un atlas 1024x1024, retourne Err
- **Dependances** : S2-T01
- **Effort** : Moyen

---

#### S2-T06 : Module toml_output.rs (generation TOML)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/toml_output.rs` (creation)
- **Description** : Implementer la generation des fichiers TOML de sortie. Deux fonctions : `generate_atlas_toml(pack_result: &PackResult) -> String` (format AtlasDescriptor compatible mge-render, avec animation_tag optionnel), `generate_animations_toml(entity: &str, sprite_size: &str, animations: &[AnimationInfo]) -> String` (format AnimationBank compatible mge-render, section `[meta]` + `[[clips]]`). Les deux suivent les formats definis en sections 5.1 et 5.2 de la SPEC.
- **Tests** :
  - `toml_output_atlas_roundtrip` : Genere TOML, reparse avec `toml::from_str`, compare structure
  - `toml_output_animations_roundtrip` : Genere TOML, reparse, compare
  - `toml_output_atlas_contains_all_frames` : Chaque frame du PackResult est dans le TOML
- **Dependances** : S2-T01, S2-T05
- **Effort** : Moyen

---

#### S2-T07 : Commande `pack` complete (integration pipeline)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/main.rs`
  - `mge/tools/mge-anim-pack/src/lib.rs`
- **Description** : Connecter tous les modules dans la commande `pack`. Pipeline : (1) detecter les fichiers .ase ou frames PNG dans `--input`, (2) charger via aseprite.rs ou lecture directe PNG, (3) generer les miroirs via mirror.rs, (4) packer via packer.rs, (5) generer les TOML via toml_output.rs, (6) ecrire atlas.png + atlas.toml + animations.toml dans `--output`. Afficher un resume (nombre de frames, taille atlas, animations detectees).
- **Tests** : Test d'integration `integration_anim_pack_roundtrip` : frames PNG de test -> pack -> output TOML -> reparse -> validate (test dans `tests/` du crate).
- **Dependances** : S2-T02, S2-T03, S2-T04, S2-T05, S2-T06
- **Effort** : Moyen

---

#### S2-T08 : Commandes `validate` et `info`

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/main.rs`
- **Description** : Implementer la commande `validate` : charge un atlas TOML et un dossier de sprites, verifie que toutes les frames referencees existent, que les directions sont completes, que les tailles sont conformes aux normes. Affiche les warnings/erreurs. Implementer la commande `info` : charge un fichier `.ase`, affiche les informations (layers, tags, frames, dimensions, user data).
- **Tests** :
  - `validate_atlas_passes` : Atlas conforme passe sans erreur
  - `validate_atlas_fails_missing_direction` : Atlas sans direction SW pour une entite echoue
- **Dependances** : S2-T01, S2-T02, S2-T03
- **Effort** : Faible

---

#### S2-T08b : Module png_import.rs (import PNG frames avec presets)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/png_import.rs` (creation)
- **Description** : Nouveau module pour importer des frames PNG individuelles avec presets de metadata. Commande `import-png` avec options : --input (dossier PNG), --output, --entity, --size-class (small|medium|humanoid|large|boss), --action (idle|walk|attack|...), --directions (4 ou 8), --fps (defaut 12). Applique automatiquement la convention de nommage, assigne les dimensions selon la size class, genere atlas + TOML. Les presets de taille viennent de SpriteSize (128x128 small, 128x256 medium, etc.).
- **Tests** :
  - `png_import_applies_naming` : Verifier que les frames importees suivent la convention
  - `png_import_size_class_preset` : Verifier que --size-class humanoid assigne 128x384
  - `png_import_generates_toml` : Verifier la sortie TOML avec metadata
- **Dependances** : S2-T01, S2-T02, S2-T05
- **Effort** : Moyen

---

#### S2-T08c : Module aseprite_export.rs (generation fichier .ase)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/tools/mge-anim-pack/src/aseprite_export.rs` (creation)
- **Description** : Optionnel flag `--aseprite` sur la commande import-png. Genere un fichier .ase a partir des PNG importees avec : chaque frame comme cel, tags Aseprite correspondant aux animation states, layers par direction si multiples directions. Permet de re-editer les animations dans Aseprite apres import. Utilise le format binaire Aseprite (spec publique).
- **Tests** :
  - `aseprite_export_creates_valid_file` : Verifier que le .ase genere est lisible par asefile
  - `aseprite_export_has_tags` : Verifier que les tags correspondent aux animation states
- **Dependances** : S2-T08b, S2-T03
- **Effort** : Eleve

---

#### S2-T09 : Checkpoint Sprint 2 -- Build + Clippy mge-anim-pack

- **Agent** : Denis (checkpoint)
- **Fichiers touches** : Aucun (verification)
- **Description** : Checkpoint Denis apres Sprint 2. Executer `cargo build -p mge-anim-pack`, `cargo clippy -p mge-anim-pack -- -D warnings`, `cargo test -p mge-anim-pack`. Verifier que toutes les commandes fonctionnent, zero warning clippy. Pousser : `git push`.
- **Tests** : Build + clippy + tests du crate mge-anim-pack.
- **Dependances** : S2-T01 a S2-T08c
- **Effort** : Faible

---

### Sprint 3 -- Migration Client Sodomight (8 taches)

Ce sprint migre le client Sodomight du pipeline legacy (multi-pass) vers le nouveau pipeline instanced. C'est le sprint le plus delicat : il touche directement le code de jeu fonctionnel.

---

#### S3-T01 : Chargement atlas dans sodomight-client

- **Agent** : Lise
- **Fichiers touches** :
  - `mge/games/sodomight-client/src/d2_sprites.rs`
  - `mge/games/sodomight-client/Cargo.toml`
- **Description** : Refactorer `EntitySprites` pour supporter le chargement d'atlas via `TextureArray` en plus des textures individuelles. Ajouter un mode dual : si un fichier `atlas.toml` existe pour une entite, charger via TextureArray ; sinon, fallback sur le chargement individuel actuel (placeholder). Ajouter la dependance `mge-render` avec feature `instanced`. Le Cargo.toml de sodomight-client doit activer le feature flag.
- **Tests** : `cargo build -p sodomight-client` compile. Le fallback placeholder fonctionne (puisqu'aucun atlas n'existe encore pour les placeholders).
- **Dependances** : S0-T05 (TextureArray), S1-T10 (checkpoint mge-render OK)
- **Effort** : Moyen

---

#### S3-T02 : AnimationController par entite

- **Agent** : Lise
- **Fichiers touches** :
  - `mge/games/sodomight-client/src/game.rs`
- **Description** : Ajouter un `AnimationController` a chaque entite du monde (joueur, monstres, NPCs). Dans la struct qui gere les entites, ajouter un champ `anim: AnimationController`. Initialiser en Idle/S. Dans la boucle de frame (`on_frame`), ticker chaque controller : `anim.tick(dt, clip)`. Mapper le mouvement vers `set_direction(Direction::from_velocity(dx, dy))` et l'etat de jeu vers `set_state()` (ex: si l'entite marche -> Walk, si elle attaque -> Attack).
- **Tests** : `cargo build -p sodomight-client` compile. Le controller tick sans crash meme sans atlas (car le controller est purement CPU).
- **Dependances** : S1-T04, S1-T03, S3-T01
- **Effort** : Moyen

---

#### S3-T03 : Remplacement des render passes par instanced draw

- **Agent** : Lise
- **Fichiers touches** :
  - `mge/games/sodomight-client/src/game.rs`
- **Description** : C'est la tache principale de migration. Remplacer la section de `on_frame` qui cree ~10 render passes (tile pass, fire pass, barrel pass, ..., GUI pass, text pass, float text pass) par une boucle unique : (1) remplir le `InstancedSpriteBatcher` avec toutes les instances (tiles + entites + GUI), (2) trier par depth, (3) upload vers le storage buffer, (4) 1 draw call instanced. Conserver le GUI et le text dans le meme pipeline (les quads colores deviennent des instances avec la white texture dans la texture array). Le code legacy est mis sous `#[cfg(feature = "legacy-batcher")]`.
- **Tests** : Le jeu demarre et affiche les tiles + entites sans crash. Test visuel : les entites sont a peu pres aux bons endroits (comparaison avec screenshots avant migration).
- **Dependances** : S0-T06, S0-T10, S3-T01, S3-T02
- **Effort** : Eleve

---

#### S3-T04 : Integration frustum culling dans le client

- **Agent** : Lise
- **Fichiers touches** :
  - `mge/games/sodomight-client/src/game.rs`
- **Description** : Remplacer le culling inline ad-hoc (dans `batch_tiles`, `batch_monsters_for_texture`, etc.) par l'utilisation de `FrustumCuller`. Au debut de chaque frame : (1) `RenderSpatialGrid::clear()`, (2) inserer toutes les entites rendables dans la grille, (3) `FrustumCuller::cull(camera, grid, 128.0)`, (4) pousser uniquement les entites retournees dans le batcher.
- **Tests** : Le jeu ne rend pas les entites hors ecran. Test : deplacer la camera loin du camp, verifier que le nombre d'instances dans le batcher diminue.
- **Dependances** : S0-T10, S3-T03
- **Effort** : Moyen

---

#### S3-T05 : Depth sorting iso global

- **Agent** : Lise
- **Fichiers touches** :
  - `mge/games/sodomight-client/src/game.rs`
- **Description** : Calculer le `z_depth` iso pour chaque instance : `z_depth = iso_y + iso_x * 0.01` (profondeur isometrique). Passer cette valeur dans `InstanceData.z_depth`. Le tri est fait par `InstancedSpriteBatcher::sort_by_depth()` avant l'upload. Activer le depth test dans la pipeline (deja configure en S0-T06). Les entites proches de la camera masquent correctement les entites lointaines.
- **Tests** : Test visuel : quand deux monstres sont proches, celui au premier plan masque partiellement celui a l'arriere-plan (au lieu de l'inverse avec le painter's algorithm actuel).
- **Dependances** : S3-T03
- **Effort** : Faible

---

#### S3-T06 : Migration BitmapFont vers TextRenderer (TTF/OTF)

- **Agent** : Lise
- **Fichiers touches** :
  - `mge/games/sodomight-client/src/bitmap_font.rs` (depreciation, conservation sous feature flag `legacy-batcher`)
  - `mge/games/sodomight-client/src/game.rs`
- **Description** : Remplacer le systeme `BitmapFont` (procedural ASCII 5x7, 128x48px) par le `TextRenderer` TTF/OTF de mge-render. Au startup : creer `TextRenderer::new(1024, 1024)`, charger les polices depuis `mge/assets/fonts/` (`DigitalDisco.ttf` pour le HUD, `GentiumBookPlus-Regular.ttf` pour le lore/dialog), reserver une layer dans la TextureArray pour l'atlas de glyphes. Dans on_frame : remplacer les appels `BitmapFont::push_text()` par `TextRenderer::push_text()` avec le batcher instanced. Le z_depth des textes reste fixe au layer HUD (toujours au premier plan). L'ancien `bitmap_font.rs` est conserve sous `#[cfg(feature = "legacy-batcher")]` pour rollback. Verifier que les caracteres accentues francais s'affichent correctement (e, a, c). Si `TextRenderer::needs_upload()`, uploader l'atlas vers la TextureArray.
- **Tests** : Les textes (combat log, HP/Mana, labels) s'affichent correctement avec les polices TTF. Les accents francais apparaissent. Comparaison visuelle avec l'ancien rendu bitmap.
- **Dependances** : S3-T03, S0-T05, S1b-T07 (Sprint 1b complet)
- **Effort** : Eleve

---

#### S3-T06b : Integration Overhead UI dans sodomight-client

- **Agent** : Lise
- **Fichiers touches** :
  - `mge/games/sodomight-client/src/game.rs`
  - `mge/games/sodomight-client/src/gui.rs`
- **Description** : Integrer FloatingTextManager, EmoteManager et ProgressBarManager dans le client Sodomight. Spawn des floating texts lors des combats (degats, critiques, esquives). Spawn d'emotes sur les NPC (Akara = Exclamation quand quete dispo). Barre de progression pour le gathering futur (preparee mais pas activee). Render dans la boucle on_frame apres les sprites et avant le HUD.
- **Tests** :
  - `overhead_ui_renders_without_panic` : Spawn texte + emote + progress bar, render un frame
- **Dependances** : S3-T03, S1c-T06 (Sprint 1c complet)
- **Effort** : Moyen

---

#### S3-T07 : Checkpoint Sprint 3 -- Build + Test sodomight-client

- **Agent** : Denis (checkpoint)
- **Fichiers touches** : Aucun (verification)
- **Description** : Checkpoint Denis apres Sprint 3. Executer `cargo build -p sodomight-client`, `cargo clippy -p sodomight-client -- -D warnings`, `cargo test -p sodomight-client`. Verifier que le jeu demarre correctement. Test visuel : tiles, entites, GUI, texte affiche. Verifier le fonctionnement du fallback placeholder pour les entites sans atlas anime. Pousser : `git push`.
- **Tests** : Build + clippy + tests du crate sodomight-client + test visuel.
- **Dependances** : S3-T01 a S3-T06b
- **Effort** : Moyen

---

### Sprint 4 -- Scalabilite Allumina (3 taches actives + 5 FUTURE)

Ce sprint prepare les fondations de scalabilite. Seules les 3 premieres taches sont dans le scope de ce chantier. Les 5 taches FUTURE sont documentees pour reference.

---

#### S4-T01 : Index buffer u32 (feature flag)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/instanced.rs`
  - `mge/crates/engine/mge-render/src/pipeline.rs`
- **Description** : Ajouter un feature flag `index-u32` dans mge-render. Quand actif, l'index buffer utilise `u32` au lieu de `u16`, portant la limite de 16 384 a 262 144 sprites par batch. La pipeline instanced utilise deja le storage buffer (pas d'index buffer sprite), mais le legacy pipeline en a besoin. Ajouter aussi `RenderConfig.max_sprites` configurable jusqu'a 262 144 avec u32.
- **Tests** :
  - `index_u32_allows_large_batches` : Avec feature `index-u32`, pousser 100 000 sprites ne panic pas
- **Dependances** : S3-T07 (Sprint 3 termine)
- **Effort** : Faible

---

#### S4-T02 : Animation LOD (3 niveaux)

- **Agent** : Francois
- **Fichiers touches** :
  - `mge/crates/engine/mge-render/src/animation.rs`
- **Description** : Ajouter une enum `AnimationLod` (Full, Reduced, Minimal, Static) et une fonction `compute_lod(distance_tiles: f32) -> AnimationLod`. Seuils : < 10 tiles = Full (8 dirs, tous frames), 10-20 = Reduced (4 dirs, 50% frames), 20-40 = Minimal (4 dirs, idle only), > 40 = Static (1 frame, 1 dir). Le `AnimationController::tick()` prend un parametre `lod` optionnel pour sauter des frames en Reduced et figer en Static.
- **Tests** :
  - `animation_lod_thresholds` : Verifie les seuils de distance
  - `animation_lod_reduced_skips_frames` : En LOD Reduced, tick 2x plus lentement
  - `animation_lod_static_freezes` : En LOD Static, tick ne fait rien
- **Dependances** : S1-T04
- **Effort** : Moyen

---

#### S4-T03 : Checkpoint final Sprint 4 + integration workspace

- **Agent** : Denis (checkpoint)
- **Fichiers touches** : Aucun (verification)
- **Description** : Checkpoint final. Executer `cargo build --workspace` (workspace MGE complet), `cargo clippy --workspace -- -D warnings`, `cargo test --workspace`. Verifier que TOUTES les crates compilent, que les tests passent, zero warning clippy. Verifier les annotations MSCM sur tous les nouveaux fichiers. Pousser : `git push`.
- **Tests** : Build + clippy + tests du workspace complet.
- **Dependances** : S4-T01, S4-T02
- **Effort** : Moyen

---

#### S4-T04 : Texture compression GPU (BC7/ASTC) -- FUTURE

- **Agent** : Francois
- **Fichiers touches** : `mge/crates/engine/mge-render/src/instanced.rs`
- **Description** : Ajouter le support de formats compresses (BC7 sur desktop, ASTC sur mobile) pour les textures atlas. Reduit la VRAM de 64 MB/atlas a 8-16 MB/atlas. Necessite un outil de conversion externe (texconv ou basis_universal).
- **Tests** : A definir.
- **Dependances** : S0-T05
- **Effort** : Eleve
- **Statut** : FUTURE -- Sprint 4+ ou Sprint 5

---

#### S4-T05 : Entity chunking (32x32 tiles) -- FUTURE

- **Agent** : Francois
- **Fichiers touches** : Nouveau module dans mge-arpg-world ou mge-render
- **Description** : Systeme de chunks pour le monde ouvert Allumina. Etats : Unloaded, Loading, Active, Dormant, Unloading. Rayon de chargement configurable. Chargement async via tokio::spawn_blocking.
- **Tests** : A definir.
- **Dependances** : S4-T03
- **Effort** : Eleve
- **Statut** : FUTURE -- Allumina seulement

---

#### S4-T06 : Compute shader frustum culling GPU -- FUTURE

- **Agent** : Francois
- **Fichiers touches** : Nouveau shader + modifications instanced.rs
- **Description** : Deplacer le frustum culling du CPU vers un compute shader. Le shader prend en entree les positions monde des sprites et la frustum camera, ecrit les indices des sprites visibles dans un output buffer, et met a jour les arguments de draw indirect.
- **Tests** : A definir.
- **Dependances** : S4-T03
- **Effort** : Eleve
- **Statut** : FUTURE -- Allumina endgame

---

#### S4-T07 : Indirect draw calls -- FUTURE

- **Agent** : Francois
- **Fichiers touches** : Modifications instanced.rs
- **Description** : Remplacer `draw_indexed(6, instance_count, ...)` par `draw_indirect(&indirect_buffer, 0)`. Le GPU determine le nombre d'instances a dessiner apres le compute culling.
- **Tests** : A definir.
- **Dependances** : S4-T06
- **Effort** : Moyen
- **Statut** : FUTURE -- Prerequis du compute culling

---

#### S4-T08 : Layer compositing D2 (equipement visuel) -- FUTURE

- **Agent** : Francois + Lise
- **Fichiers touches** : animation.rs + d2_sprites.rs + game.rs
- **Description** : Systeme de compositing multicouche (body, armor, weapon, shield, helm). Chaque layer a son propre jeu de frames dans l'atlas. Le rendu empile les layers dans l'ordre z avec le meme ancrage.
- **Tests** : A definir.
- **Dependances** : S3-T07
- **Effort** : Eleve
- **Statut** : FUTURE -- Quand le systeme d'equipement visuel sera implemente

---

## Ordre d'execution (graphe de dependances)

```
LEGENDE : [Tache] --> dependance vers
          // = parallelisable

Sprint 0 (Francois)                     Sprint 1 (Francois)
=====================                   =====================
S0-T01 (Cargo.toml)                     S1-T01 (AnimState/Dir)
  |                                       |
  +---> S0-T08 (visible_rect)            S1-T02 (Clip/Event)
  |       |                                |
  |     S0-T09 (SpatialGrid)             S1-T03 (AnimBank)     // S1-T05 (SpriteSize)
  |       |                                |                        |
  |     S0-T10 (FrustumCuller)           S1-T04 (AnimCtrl)    S1-T11 (validate)
  |       |                                |
  |     S0-T11 (lib.rs + atlas.rs) <------+
  |       |                              S1-T07 (re-exports)
S0-T02 (InstanceData)                     |
  |                                      S1-T08 (docs normes)
  +---> S0-T03 (Batcher CPU)            S1-T09 (depreciate)
  |       |
S0-T04 (Shader WGSL)                    S1-T06 (integration tests anim)
  |       |
S0-T05 (TextureArray)
  |
S0-T06 (Pipeline wgpu)
  |
S0-T07 (RenderError)
  |
S0-T12 (integration tests pipeline)
         |
         +----- S1-T10 (CHECKPOINT Denis) -----+
                                                |
Sprint 1b (Francois)   // parallelisable        |
======================  // avec S1 et S2         |
S1b-T01 (fontdue dep + errors)                  |
  |                                             |
S1b-T02 (TtfFont struct)                        |
  |                                             |
S1b-T03 (GlyphCache atlas)                      |
  |                                             |
S1b-T04 (TextRenderer) <-- S0-T03               |
  |                                             |
S1b-T05 (re-exports text)                       |
  |                                             |
S1b-T06 (integration tests text)                |
  |                                             |
S1b-T07 (CHECKPOINT Denis text)                 |
                                                |
Sprint 1c (Francois)   // parallelisable        |
======================  // avec S1, S1b, S2      |
S1c-T01 (FloatingTextKind/FloatingText)          |
  |                                             |
S1c-T02 (FloatingTextManager) <-- S1b-T04       |
  |                                             |
  +---> S1c-T03 (EmoteManager) <-- S0-T03       |
  |                                             |
  +---> S1c-T04 (ProgressBarManager) <-- S0-T03 |
         |                                      |
S1c-T05 (re-exports overhead)                   |
  |                                             |
S1c-T06 (CHECKPOINT Denis overhead)              |
                                                |
Sprint 2 (Francois)                             |
=====================                           |
S2-T01 (scaffold)                               |
  |                                             |
  +---> S2-T02 (naming)                         |
  |       |                                     |
  +---> S2-T03 (aseprite loader)                |
  |       |                                     |
  +---> S2-T04 (mirror)                         |
  |       |                                     |
  +---> S2-T05 (packer MaxRects)                |
  |       |                                     |
  +---> S2-T06 (TOML output)                    |
          |                                     |
        S2-T07 (commande pack)                  |
          |                                     |
        S2-T08 (validate + info)                |
          |                                     |
        S2-T08b (PNG import presets)             |
          |                                     |
        S2-T08c (Aseprite export .ase)           |
          |                                     |
        S2-T09 (CHECKPOINT Denis)               |
                                                |
Sprint 3 (Lise)  <-----------------------------+
=====================                    <-- S1b-T07
S3-T01 (chargement atlas client)          <-- S1c-T06
  |
S3-T02 (AnimController/entite)
  |
S3-T03 (instanced draw remplacement)
  |
  +---> S3-T04 (frustum culling client)
  |
  +---> S3-T05 (depth sorting iso)
  |
  +---> S3-T06 (BitmapFont -> TextRenderer TTF) <-- S1b-T07
  |
  +---> S3-T06b (Overhead UI client) <-- S1c-T06
         |
       S3-T07 (CHECKPOINT Denis)
                |
Sprint 4 (Francois)
=====================
S4-T01 (u32 index)
  |
S4-T02 (animation LOD)
  |
S4-T03 (CHECKPOINT final Denis)
```

**Taches parallelisables** :

- Sprint 0 et Sprint 1 sont entierement parallelisables (sauf le checkpoint S1-T10 qui attend les deux).
- Sprint 1b est parallelisable avec Sprint 1 et Sprint 2 (depend uniquement de S0-T03 et S0-T07 du Sprint 0).
- Sprint 1c est parallelisable avec S0, S1, S1b, S2. Depend de S1b-T04 (TextRenderer) pour S1c-T02 et de S0-T03 (InstancedSpriteBatcher) pour S1c-T03 et S1c-T04. S1c-T03 et S1c-T04 sont parallelisables entre eux.
- Sprint 2 est parallelisable avec Sprint 0+1+1b+1c (mais le checkpoint S2-T09 est independant de S1-T10).
- S2-T02, S2-T03, S2-T04, S2-T05 sont parallelisables entre eux (modules independants).
- S3-T04, S3-T05, S3-T06, S3-T06b sont parallelisables entre eux (modifications independantes apres S3-T03). S3-T06 attend S1b-T07. S3-T06b attend S1c-T06.
- S4-T01 et S4-T02 sont parallelisables.

**Chemin critique** : S0-T01 -> S0-T02 -> S0-T06 -> S0-T12 -> S1-T10 -> S3-T01 -> S3-T03 -> S3-T06 (attend S1b-T07) / S3-T06b (attend S1c-T06) -> S3-T07 -> S4-T03. Note : S3-T06b (overhead UI) est en parallele de S3-T06 (text migration) ; le chemin critique passe par celui qui finit en dernier.

---

## Checkpoints Denis (/5 taches)

| Checkpoint | Apres taches | Contenu | Sprint |
|------------|-------------|---------|--------|
| CP-01 | S0-T05 | `cargo build -p mge-render`, verif compilation feature flags, push | Sprint 0 |
| CP-02 | S1-T10 | Full build + clippy + tests mge-render (Sprint 0+1 complet), push | Sprint 0+1 |
| CP-02b | S1b-T07 | Build + clippy + tests text.rs, verif chargement TTF, push | Sprint 1b |
| CP-02c | S1c-T06 | Build + clippy + tests overhead.rs, verif MSCM, 12 tests overhead, push | Sprint 1c |
| CP-03 | S2-T05 | `cargo build -p mge-anim-pack`, verif compilation, push | Sprint 2 |
| CP-04 | S2-T09 | Full build + clippy + tests mge-anim-pack, push | Sprint 2 |
| CP-05 | S3-T03 | `cargo build -p sodomight-client`, test visuel demarrage, push | Sprint 3 |
| CP-06 | S3-T07 | Full build + clippy + tests sodomight-client, test visuel complet (TTF + accents), push | Sprint 3 |
| CP-07 | S4-T03 | `cargo build/test/clippy --workspace` (workspace MGE complet), push final | Sprint 4 |

Les checkpoints CP-01, CP-02b, CP-02c et CP-03 sont des mini-audits intermediaires (toutes les 5-7 taches environ). Les checkpoints CP-02, CP-04, CP-06, CP-07 sont les audits de fin de sprint.

---

## Risques et mitigations

| ID | Risque | Probabilite | Impact | Mitigation |
|----|--------|-------------|--------|------------|
| R-01 | Texture array dimension constraint (toutes layers meme taille) | Moyenne | Moyen | Grouper les atlas par classe de taille (1024, 2048, 4096). 2-3 draw calls au lieu de 1. Padding au max commun. |
| R-02 | Regression visuelle pendant migration Sprint 3 | Elevee | Moyen | Feature flags instanced/legacy-batcher. Screenshots de reference avant migration. Rollback rapide possible. |
| R-03 | Performance du storage buffer upload a chaque frame | Faible | Moyen | Budget : 65 536 instances x 64 bytes = 4 MB/frame. Largement dans le budget GPU. Tester sur GPU integre Intel. |
| R-04 | `asefile` ne supporte pas certains fichiers Aseprite recents | Faible | Faible | Le crate suit la spec Aseprite 1.3+. Fallback : export JSON depuis Aseprite + loader TexturePacker. |
| R-05 | VRAM budget explose avec trop d'atlas layers | Moyenne (Allumina) | Moyen | Sprint 1 : max 4 entites animees = 23 MB. Compression BC7 en S4-T04 (FUTURE). Budget : 512 MB VRAM cible. |
| R-06 | Scope creep vers particules/post-process/lighting | Elevee | Eleve | Strictement hors scope. Documenter en taches FUTURE. Refuser tout ajout non planifie. |
| R-07 | Direction Nord (dos) = fallback S incorrect visuellement | Faible | Faible | Documente comme limitation MVP. 5eme direction rendue dans un sprint futur. `Direction::mirror_source()` facilement modifiable. |
| R-08 | Shader WGSL ne compile pas sur certains backends GPU | Faible | Eleve | Validation syntaxique `naga` dans les tests (S0-T04). Test CI sur Vulkan + DX12 + Metal. |
| R-09 | Glyph atlas saturation (trop de combinaisons char/font/size) | Faible | Faible | Quantification taille 0.5px, atlas 1024x1024 suffit pour ~1800 glyphes. Fallback : `GlyphCache::clear()` + rebuild, ou agrandir a 2048x2048. |
| R-10 | fontdue ne supporte pas certains fichiers OTF | Faible | Faible | fontdue s'appuie sur ttf-parser (tres mature). Outil uniquement pour runtime, pas critique. Fallback : convertir OTF en TTF via outil externe. |
| R-11 | Overhead UI performance avec 500+ entites | Moyenne | Moyen | Cap configurable (defaut 100 textes max). FloatingTextManager supprime les plus anciens au-dela du cap. Les emotes sont 1 par entite max. Budget : 100 textes + 50 emotes + 50 barres = 200 instances overhead, negligeable vs 65 536 max. Profiler si necessaire. |
| R-12 | Complexite du format binaire Aseprite pour l'export .ase | Elevee | Faible | S2-T08c est marque Eleve en effort. Le format binaire Aseprite est documente mais complexe (chunks, color depth, cel types). Mitigation : generer uniquement RGBA cels (pas de linked cels ni compressed tiles). Tester avec asefile en roundtrip. Tache non bloquante (optionnelle via --aseprite). |

---

## Criteres de succes

### Metriques mesurables

| Critere | Seuil | Mesure |
|---------|-------|--------|
| Draw calls par frame | <= 3 (au lieu de ~13) | Compteur dans le pipeline instanced |
| Nombre de render passes | 1 (au lieu de ~13) | Compteur dans on_frame |
| Sprites max par frame | >= 65 536 (au lieu de 16 384) | Config RenderConfig.max_sprites |
| Etats d'animation | >= 7 (idle, walk, attack, hit, death, cast, special) | Enum AnimationState |
| Directions supportees | 8 (4 rendues + 4 miroir) | Enum Direction |
| Polices TTF supportees | >= 4 familles (10 fichiers) | Chargement sans erreur dans TextRenderer |
| Caracteres accentues francais | e, a, u, i, o, c | Rasterisation via fontdue, affichage visuel |
| Tests unitaires nouveaux | >= 68 (40 existants + 11 text + 12 overhead + 5 png_import/ase_export) | `cargo test -p mge-render`, `cargo test -p mge-anim-pack` |
| Warnings clippy workspace | 0 | `cargo clippy --workspace -- -D warnings` |
| Build workspace | OK | `cargo build --workspace` |
| Annotations MSCM | 100% des nouveaux fichiers | Verification manuelle |
| `unsafe_code = "forbid"` | Tous les Cargo.toml | Verification `Cargo.toml` |
| `unwrap()` en production | 0 | `grep -r "unwrap()" --include="*.rs"` (hors tests) |

### Criteres qualitatifs

- Le jeu Sodomight demarre et affiche correctement tiles, entites, GUI, texte avec polices TTF
- Les caracteres accentues francais (e, a, u, c, etc.) s'affichent correctement dans le texte de jeu
- Le fallback placeholder fonctionne pour les entites sans atlas anime
- Floating text style Ragnarok Online affiche degats/critique/esquive avec animation float+fade (montee verticale, disparition progressive, critical orange avec shake)
- Emote system affiche au moins 5 types d'emotes (Happy, Angry, Exclamation, Question, Heart) avec animation bounce sinusoidal
- Progress bar overhead fonctionne pour gathering/crafting/casting (2 quads instanced, fill proportionnel)
- L'outil `mge-anim-pack` transforme des frames PNG en atlas + TOML exploitables
- `mge-anim-pack import-png` importe des PNG avec presets de size class et genere atlas + TOML automatiquement
- Les normes de sprites sont documentees et validables par l'outil
- Le code legacy est conserve sous feature flag pour rollback
- Toutes les Lois d'Autonomie (LOI-1 a LOI-8) sont respectees

---

## Recapitulatif des taches

| Sprint | Taches actives | Taches FUTURE | Agent principal | Fichiers | Lignes estimees |
|--------|---------------|---------------|-----------------|----------|----------------|
| Sprint 0 -- Fondations Pipeline | 12 | 0 | Francois | 8 | ~1200 |
| Sprint 1 -- Animation & Normes | 11 | 0 | Francois | 7 | ~700 |
| Sprint 1b -- Polices TTF/OTF | 7 | 0 | Francois | 3 | ~500 |
| Sprint 1c -- Overhead UI World-Space | 6 | 0 | Francois | 1 | ~400 |
| Sprint 2 -- CLI mge-anim-pack | 11 | 0 | Francois | 11 | ~1150 |
| Sprint 3 -- Migration Client | 8 | 0 | Lise | 5 | ~600 |
| Sprint 4 -- Scalabilite | 3 actives | 5 FUTURE | Francois + Denis | 3 | ~200 |
| **Total** | **58** (53+5) | **5** | -- | **~34** | **~4750** |

---

---

## Changelog

| Date | Modification | Auteur |
|------|-------------|--------|
| 2026-03-02 | Version initiale du plan (42 taches, 5 sprints) | Denis |
| 2026-03-02 | Ajout Sprint 1b Polices TTF/OTF (7 taches), migration S3-T06 enrichie (BitmapFont -> TextRenderer), total 49 taches, 6 sprints | Francois |
| 2026-03-02 | Ajout Sprint 1c Overhead UI World-Space (6 taches : floating text RO-style, emotes sprite, progress bars), ajout S2-T08b/S2-T08c (PNG import presets + Aseprite export), ajout S3-T06b (integration overhead client), total 58 taches, 7 sprints | Denis |

---

*Plan redige par Denis (Chef Dev Senior) -- P0 Temps 5*
*Mis a jour par Francois (Dev Back-End) -- Ajout systeme polices TTF/OTF*
*Mis a jour par Denis (Chef Dev Senior) -- Ajout Sprint 1c Overhead UI, PNG import, Aseprite export, integration overhead client*
*En attente approbation utilisateur (Gate P0) puis transmission a Maria (P0 Temps 6)*
