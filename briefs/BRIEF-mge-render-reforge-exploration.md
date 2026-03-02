# P0-T1 : Exploration -- Reforge Moteur Graphique MGE

**Classification** : T5 -- Chantier strategique
**Date** : 2026-03-02
**Agent** : Maria (Chef de Projet)

---

## 1. Fichiers analyses

### 1.1 mge-render (Couche 2 Engine -- crate principal de rendu)

| Fichier | Role | Lignes |
|---------|------|--------|
| `mge/crates/engine/mge-render/src/lib.rs` | Point d'entree, re-exports publics | 33 |
| `mge/crates/engine/mge-render/src/renderer.rs` | Struct Renderer (STUB -- config only, pas de GPU) | 84 |
| `mge/crates/engine/mge-render/src/pipeline.rs` | SpritePipeline, GpuTexture, SpriteBatcher, SpriteVertex | 825 |
| `mge/crates/engine/mge-render/src/sprite.rs` | SpriteInstance, SpriteBatch, SpriteRenderer, RenderLayer | 186 |
| `mge/crates/engine/mge-render/src/camera.rs` | Camera2D (iso 2:1, smooth follow, bounds) | 142 |
| `mge/crates/engine/mge-render/src/atlas.rs` | AtlasFrame, AtlasEntry, TextureAtlas, AtlasRegistry (CPU-side TOML) | 192 |
| `mge/crates/engine/mge-render/src/tile.rs` | TilePos, TileRenderArgs, TileRenderer | 109 |
| `mge/crates/engine/mge-render/src/errors.rs` | RenderError (thiserror) | 52 |
| `mge/crates/engine/mge-render/src/tests.rs` | 15 tests unitaires (CPU-only) | 349 |
| `mge/crates/engine/mge-render/src/sprite.wgsl` | Shader WGSL : vertex + fragment, camera uniform, texture sampler | 135 |
| **Total mge-render** | | **2107** |

### 1.2 sodomight-client (Couche 4 Game -- consommateur principal)

| Fichier | Role | Lignes |
|---------|------|--------|
| `mge/games/sodomight-client/src/game.rs` | SodomightApp (GameApp impl), boucle de rendu complete | 1899 |
| `mge/games/sodomight-client/src/gui.rs` | GameGui (HUD D2 complet : orbes, barres, inventaire, minimap) | 2842 |
| `mge/games/sodomight-client/src/d2_sprites.rs` | SpriteSize, EntitySprites, chargement placeholders PNG | 221 |
| `mge/games/sodomight-client/src/bitmap_font.rs` | BitmapFont procedural (ASCII 5x7, atlas 128x48) | 352 |
| `mge/games/sodomight-client/src/lib.rs` | Re-exports modules | 16 |
| `mge/games/sodomight-client/src/main.rs` | Point d'entree binaire | 15 |
| `mge/games/sodomight-client/src/state.rs` | ClientState (machine d'etats connexion) | 54 |
| `mge/games/sodomight-client/src/config.rs` | ClientConfig (fenetre, son, FPS) | 58 |
| `mge/games/sodomight-client/src/error.rs` | ClientError (thiserror) | 27 |
| **Total sodomight-client** | | **5484** |

### 1.3 mge-platform (Couche 1 Kernel -- GPU context + event loop)

| Fichier | Role | Lignes |
|---------|------|--------|
| `mge/crates/kernel/mge-platform/src/gpu.rs` | GpuContext (wgpu device/queue/surface), GpuFrame | 235 |
| `mge/crates/kernel/mge-platform/src/app.rs` | GameApp trait, AppRunner (winit ApplicationHandler) | 176 |
| `mge/crates/kernel/mge-platform/src/input.rs` | InputEvent, KeyCode, MouseButton enums | 242 |
| `mge/crates/kernel/mge-platform/src/input_map.rs` | Mapping winit KeyCode/MouseButton vers types MGE | 190 |
| `mge/crates/kernel/mge-platform/src/config.rs` | PlatformConfig (taille fenetre, vsync, titre) | 91 |
| `mge/crates/kernel/mge-platform/src/window.rs` | WindowConfig | 106 |
| `mge/crates/kernel/mge-platform/src/error.rs` | PlatformError | 66 |
| `mge/crates/kernel/mge-platform/src/lib.rs` | Re-exports | 19 |
| **Total mge-platform** | | **1125** |

### 1.4 mge-core (Couche 1 Kernel -- game loop)

| Fichier | Role | Lignes |
|---------|------|--------|
| `mge/crates/kernel/mge-core/src/game_loop.rs` | GameLoop (fixed timestep, spiral-of-death guard) | 120 |
| `mge/crates/kernel/mge-core/src/time.rs` | GameTime, TickRate | 101 |
| `mge/crates/kernel/mge-core/src/scheduler.rs` | System scheduler | 126 |
| `mge/crates/kernel/mge-core/src/event.rs` | Event types | 90 |
| `mge/crates/kernel/mge-core/src/tests.rs` | Tests unitaires | 260 |
| `mge/crates/kernel/mge-core/src/lib.rs` | Re-exports | 24 |
| **Total mge-core** | | **721** |

### 1.5 mge-ui (Couche 2 Engine -- UI egui D2-style)

| Fichier | Role | Lignes |
|---------|------|--------|
| `mge/crates/engine/mge-ui/src/lib.rs` | UiState, UiScreen, OpenPanels, re-exports | 186 |
| `mge/crates/engine/mge-ui/src/hud.rs` | HUD egui (orbes, XP, skill bar) | 300 |
| `mge/crates/engine/mge-ui/src/inventory.rs` | Inventaire egui (grille, equipement) | 264 |
| `mge/crates/engine/mge-ui/src/character.rs` | Panneau personnage egui | 205 |
| `mge/crates/engine/mge-ui/src/theme.rs` | D2Colors, apply_d2_theme | 90 |
| `mge/crates/engine/mge-ui/src/tooltip.rs` | Tooltips items | 116 |
| `mge/crates/engine/mge-ui/src/minimap.rs` | Minimap egui | 50 |
| `mge/crates/engine/mge-ui/src/skill_tree.rs` | Skill tree egui | 40 |
| `mge/crates/engine/mge-ui/src/dialog.rs` | NPC dialog egui | 46 |
| `mge/crates/engine/mge-ui/src/menus/*.rs` | Menus (main, char_select, lobby, pause) | 247 |
| **Total mge-ui** | | **1544** |

### 1.6 mge-asset (Couche 1 Kernel -- chargement donnees)

| Fichier | Role | Lignes |
|---------|------|--------|
| `mge/crates/kernel/mge-asset/src/lib.rs` | DataLoadError, re-exports | 102 |
| `mge/crates/kernel/mge-asset/src/loader.rs` | Chargement generique TOML | 163 |
| `mge/crates/kernel/mge-asset/src/registry.rs` | GameDataRegistry central | 582 |
| `mge/crates/kernel/mge-asset/src/validation.rs` | Validation croisee | 160 |
| `mge/crates/kernel/mge-asset/src/hot_reload.rs` | Hot-reload dev (notify) | 116 |
| `mge/crates/kernel/mge-asset/src/types/*.rs` | Types TOML (items, monstres, skills, zones, etc.) | 1535 |
| `mge/crates/kernel/mge-asset/src/tests.rs` | Tests | 907 |
| **Total mge-asset** | | **3565** |

### 1.7 Shader

| Fichier | Role | Lignes |
|---------|------|--------|
| `mge/crates/engine/mge-render/src/sprite.wgsl` | Unique shader WGSL (vertex + fragment) | 135 |

### Resume des volumes

| Zone | Fichiers | Lignes |
|------|----------|--------|
| mge-render | 10 | 2107 |
| sodomight-client | 9 | 5484 |
| mge-platform | 8 | 1125 |
| mge-core | 6 | 721 |
| mge-ui | 14 | 1544 |
| mge-asset | 15 | 3565 |
| **Total rendu+client** | **62** | **14546** |

---

## 2. Architecture actuelle du pipeline de rendu

### 2.1 Vue d'ensemble

Le pipeline de rendu est un systeme 2D isometrique dimetrique 2:1 construit sur wgpu.
L'architecture est **entierement basee sur le CPU-side sorting et le batching mono-texture**.

```
[Game World]
    |
    v
[Camera2D] -- conversion world(tile) -> screen(iso pixels)
    |
    v
[SpriteRenderer] -- tri CPU par RenderLayer (6 couches) puis par z
    |
    v
[SpriteBatcher] -- collecte quads (4 vertices/sprite), flush vers GPU
    |
    v
[SpritePipeline] -- shader WGSL, ortho proj, alpha blend
    |
    v
[wgpu RenderPass] -- 1 pass par texture (bind group 1 change)
    |
    v
[Present]
```

### 2.2 Composants cles

**SpritePipeline** (pipeline.rs)
- Un unique `wgpu::RenderPipeline` avec alpha blending (SrcAlpha/OneMinusSrcAlpha)
- Bind group 0 : matrice camera orthographique (mat4x4, vertex stage)
- Bind group 1 : texture 2D + sampler (fragment stage) -- change a CHAQUE passe
- Pas de depth buffer (painter's algorithm CPU)
- Filtre bilineaire (Linear/Linear/Linear) + ClampToEdge

**SpriteBatcher** (pipeline.rs)
- Vertex buffer dynamique pre-alloue (max_sprites * 4 vertices)
- Index buffer STATIQUE (pattern 0,1,2,2,3,0 repete, u16)
- `begin() -> push() -> flush() -> draw()` par passe de rendu
- Le flush ecrit a un offset croissant dans le vertex buffer pour supporter
  plusieurs passes par frame
- Limite actuelle : `max_sprites = 8192` (configurable, defaut `16_384`)

**SpriteVertex** (pipeline.rs)
- 32 octets : position(f32x2) + uv(f32x2) + tint(f32x4)
- Pas de rotation, pas de scale dans le vertex -- tout est pre-calcule CPU-side

**Camera2D** (camera.rs)
- Conversion iso dimetric 2:1 : `sx = (wx-wy) * 32`, `sy = (wx+wy) * 16`
- Tiles 64x32 pixels
- Smooth follow avec factor exponentiel
- Bounds clamping optionnel
- La camera n'est PAS utilisee pour le rendu actuel (approche "OpenD2") :
  le code client calcule `iso_to_screen()` manuellement et passe une matrice
  ortho identite au pipeline

**GpuTexture** (pipeline.rs)
- Upload RGBA via `queue.write_texture()` (synchrone)
- Chaque texture a son propre bind group pre-construit
- Format fixe `Rgba8UnormSrgb`
- Pas de mipmaps (mip_level_count = 1)

**TextureAtlas** (atlas.rs)
- Descripteur TOML parse cote CPU
- HashMap<String, AtlasFrame> pour lookup par nom
- Calcul UV normalise
- Support trim/offset (mge-packer)
- AtlasRegistry pour gerer plusieurs atlas
- NOTE : le systeme d'atlas existe dans mge-render mais n'est PAS utilise
  par sodomight-client actuellement (les sprites sont charges comme textures
  individuelles)

### 2.3 Flow de rendu dans sodomight-client/game.rs (on_frame)

Le rendu suit un ordre strict de passes (painter's algorithm) :

1. **Reset** : `batcher.reset_frame()`, mise a jour camera ortho identite (0,0,screen_w,screen_h)
2. **Tile pass** : batch 64x64 tiles iso avec frustum culling, flush, render pass (clear, grass_texture)
3. **Fire pass** : 1 sprite statique (campfire)
4. **Barrel pass** : 3 sprites statiques
5. **Akara pass** : 1 sprite NPC
6. **Deckard Cain pass** : 1 sprite NPC
7. **Fallen pass** : tous les monstres "fallen" avec la meme texture
8. **Spike pass** : tous les monstres "spike/quill/rat" avec la meme texture
9. **Fallback pass** : quads colores pour monstres sans sprite
10. **Player pass** : 1 sprite (ou fallback quad)
11. **GUI pass** : HUD complet (orbes, barres, slots, panels) -- white texture
12. **Text pass** : bitmap font (combat log, HP/Mana, level, labels)
13. **Float text pass** : damage numbers flottants

**Total : 13 render passes par frame**

Chaque pass = `begin() -> push_quads() -> flush() -> begin_render_pass() -> set_pipeline() -> set_bind_group(0) -> set_bind_group(1) -> draw() -> end_pass()`

### 2.4 Approche "OpenD2"

Le code actuel utilise une approche inspiree d'OpenDiablo 2 :
- Toutes les positions sont calculees en screen-space cote CPU via `iso_to_screen()`
- La camera ortho est un mapping identite (0,0)-(screen_w,screen_h) vers clip space
- La Camera2D du crate mge-render n'est utilisee QUE pour le follow target, pas pour la projection
- Avantage : simple a debugger, pas de subtilite de coordonnees
- Inconvenient : pas de zoom GPU-side, tout le travail est CPU

---

## 3. Limitations identifiees

### L-01 : Pas de batching multi-texture (CRITIQUE)

**Impact** : Chaque type d'entite necessite son propre render pass car chaque texture
a son propre bind group. Avec 8 types de sprites = 8 passes supplementaires. Le cout de
`begin_render_pass()` + `set_pipeline()` + `set_bind_group()` est non negligeable.

Pour Allumina avec 50+ types d'entites = 50+ render passes par frame. Intenable.

**Solution** : Texture atlas GPU-side. Packer tous les sprites dans quelques mega-textures
(2048x2048 ou 4096x4096), un seul bind group par atlas, un seul draw call par atlas.

### L-02 : Pas de sprite atlas GPU en utilisation (CRITIQUE)

Le systeme d'atlas (atlas.rs) existe avec parsing TOML et lookup UV, mais le
sodomight-client charge chaque sprite comme une texture GPU independante
(`GpuTexture::from_image` par sprite). L'atlas n'est connecte a rien cote rendu.

### L-03 : Pas de systeme d'animation (CRITIQUE)

Aucun systeme d'animation n'existe :
- Pas de frame sequence / keyframe
- Pas de notion de direction (8 directions D2)
- Pas de state machine d'animation (idle, walk, attack, hit, death)
- Pas d'interpolation entre frames
- Tous les sprites sont STATIQUES (1 seule pose par entite)

C'est la lacune la plus visible pour le joueur.

### L-04 : Index buffer en u16 (LIMITE)

L'index buffer utilise `u16`, limitant a 65536/4 = 16384 sprites par batch.
Pour un MMO avec tiles + entites + effets, cette limite sera atteinte.

**Solution** : Passer a `u32` pour les index buffers.

### L-05 : Pas d'instancing GPU

Chaque sprite genere 4 vertices (128 octets) cote CPU. Avec 500 entites +
4096 tiles visibles + GUI = ~5000 sprites = 640 KB de vertices ecrits par frame.

L'instancing GPU permettrait d'envoyer une seule quad et des per-instance data
(position, UV, tint), reduisant le CPU overhead et la bande passante.

### L-06 : Pas de frustum culling formalise

Le frustum culling est fait ad-hoc dans chaque fonction de batch (batch_tiles,
batch_monsters_for_texture, etc.) avec des comparaisons screen-space repetees.
Pas de structure spatiale (quadtree, grille) pour les entites.

### L-07 : Pas de tri par profondeur formalise (depth sorting)

Le tri est fait par l'ORDRE des render passes (painter's algorithm manuel).
Au sein d'une meme passe (ex: tous les "fallen"), les sprites ne sont PAS tries
par profondeur iso. Les monstres proches de la camera peuvent etre masques par
des monstres lointains.

Le SpriteRenderer avec ses RenderLayer et sort_by_depth() existe dans mge-render
mais n'est PAS utilise par le client.

### L-08 : Pas de mipmaps

Les textures sont chargees sans mipmaps (`mip_level_count = 1`). En cas de zoom
arriere ou de minimap, la qualite sera degradee avec des artefacts de sous-echantillonnage.

### L-09 : Renderer stub non connecte

La struct `Renderer` dans renderer.rs est un stub vide (config only). Les champs
device, queue, surface, pipeline, batcher sont commentes. Toute la logique de rendu
vit dans sodomight-client/game.rs directement, pas dans le crate engine.

### L-10 : GUI entierement en quads colores

Le HUD (2842 lignes) dessine tout avec des quads colores (white texture + tint).
Pas de textures d'UI, pas d'icones, pas d'images. Fonctionnel mais visuellement brut.

### L-11 : Duplication du systeme d'UI

Deux systemes d'UI coexistent :
- `mge-ui` (egui-based, 1544 lignes) -- non connecte au client actuel
- `sodomight-client/gui.rs` (SpriteBatcher-based, 2842 lignes) -- active

Le client n'utilise PAS egui. Les deux systemes ne communiquent pas.

### L-12 : Chargement d'assets par chemins relatifs fragiles

Les fonctions `load_placeholder()` et `load_grass_image()` essaient 4-5 chemins
relatifs differents. Pas de systeme de chargement centralise. Le crate mge-asset
existe mais n'est pas utilise pour les sprites.

### L-13 : Pas de systeme de particules

Aucun systeme de particules pour effets visuels (sort, impact, environnement).

### L-14 : Bitmap font procedural limite

Le systeme de texte est un bitmap font 5x7 pixels genere proceduralement.
Fonctionnel mais tres basique. Pas de support Unicode, pas de gestion de taille
variable, pas de rendu vectoriel.

### L-15 : Pas de post-processing

Le feature flag `post-process` existe dans Cargo.toml mais n'est pas implemente.
Pas de bloom, color grading, vignette, etc.

---

## 4. Points de scalabilite critiques (Allumina -- 500+ entites)

### S-01 : Render passes par texture (BLOQUANT)

**Situation actuelle** : 13 passes pour ~30 entites (8 sprites distincts)
**Projection Allumina** : 100+ types d'entites = 100+ passes
**Seuil de douleur** : ~20 passes sur GPU integre, ~50 sur discrete
**Solution** : Texture atlas obligatoire. 1-3 mega-atlas = 1-3 passes pour TOUTES les entites.

### S-02 : CPU vertex generation (GOULOT)

**Situation actuelle** : 5000 sprites = 20000 vertices = 640 KB/frame CPU->GPU
**Projection Allumina** : 500 entites + 10000 tiles + 200 effets + GUI = ~15000 sprites = 1.9 MB/frame
**Solution** : GPU instancing (1 quad shared + per-instance buffer) reduit a ~60 bytes/instance = 900 KB max

### S-03 : Depth sorting (VISUEL)

**Situation actuelle** : Ordre fixe par type d'entite
**Projection Allumina** : Monstres, joueurs, PNJs, objets melanges = z-fighting constant
**Solution** : Tri global par profondeur iso (y_iso + x_iso * 0.01) avant batching

### S-04 : Frustum culling (PERF)

**Situation actuelle** : Test screen-space ad-hoc dans chaque batch function
**Projection Allumina** : 10000+ entites sur la carte, ~500 visibles
**Solution** : Spatial hash grid (cellules de 4x4 tiles), query par viewport

### S-05 : Animation system (CONTENU)

**Situation actuelle** : 0 animation
**Projection Allumina** : 8 directions * 6 etats * 100 types = 4800 animations
**Solution** : `AnimationController` + `SpriteSheet` + state machine, frame blending

### S-06 : Memory texture (VRAM)

**Situation actuelle** : 8 textures PNG individuelles (~1 MB VRAM total)
**Projection Allumina** : 100+ types * 8 dirs * 6 etats * 10 frames = milliers de frames
**Solution** : Texture arrays ou mega-atlas 4096x4096 (64 MB max par atlas)

### S-07 : Entity culling (CPU)

**Situation actuelle** : Iteration lineaire sur tous les ai_agents pour chaque pass
**Projection Allumina** : 500 entites * 13 passes = 6500 iterations/frame
**Solution** : Pre-filtrage des entites visibles UNE FOIS, puis dispatch vers passes

---

## 5. Dependances externes

### Crate mge-render

| Dependance | Version | Usage |
|------------|---------|-------|
| wgpu | workspace | GPU abstraction, pipeline, buffers, textures |
| image | workspace | Decodage PNG (RgbaImage) |
| serde | workspace | Serialisation atlas descriptors |
| toml | workspace | Parsing TOML atlas descriptors |
| tracing | workspace | Logging |
| thiserror | workspace | Error types |
| bytemuck | 1.16 | Pod/Zeroable pour vertex data |

### Crate mge-platform

| Dependance | Version | Usage |
|------------|---------|-------|
| wgpu | workspace | GPU context |
| winit | workspace | Fenetre + event loop |
| pollster | workspace | Block on async wgpu init |

### Crate sodomight-client

| Dependance | Version | Usage |
|------------|---------|-------|
| mge-render | path | Pipeline, batcher, camera, atlas |
| mge-platform | path | GameApp trait, GpuContext, input |
| mge-core | path | GameLoop, fixed timestep |
| mge-ecs | path | EntityId |
| mge-asset | path | (declare mais sous-utilise) |
| mge-ui | path | (declare mais non connecte au rendu) |
| image | workspace | Chargement sprites |
| wgpu | workspace | Acces direct device/queue |

---

## 6. Risques identifies

### R-01 : Complexite de la migration atlas (Probabilite: ELEVEE, Impact: ELEVE)

Migrer de textures individuelles a un systeme d'atlas GPU requiert de toucher
TOUS les chemins de rendu (13 passes). L'AtlasRegistry CPU existe mais n'a
jamais ete teste en production.

**Mitigation** : Approche incrementale. Commencer par les tiles (1 atlas),
puis les entites (1-2 atlas), puis la GUI.

### R-02 : Regression visuelle (Probabilite: MOYENNE, Impact: MOYEN)

Le changement de pipeline (instancing, atlas, depth sort) peut introduire des
artefacts visuels subtils (z-ordering incorrect, UV bleeding, alpha bugs).

**Mitigation** : Screenshots de reference avant/apres. Tests visuels automatises
si possible.

### R-03 : Capacite du batcher u16 (Probabilite: ELEVEE pour Allumina)

Le passage a u32 est simple techniquement mais casse la compatibilite GPU avec
certains backends (WebGL2 ne supporte que u16).

**Mitigation** : Feature flag pour u16/u32. Allumina n'a pas besoin de WebGL2.

### R-04 : Performance du systeme d'animation (Probabilite: MOYENNE)

Un systeme d'animation mal concu avec 500 entites peut consommer plus de CPU
que le rendu lui-meme (state machine ticks, frame lookup, direction calculation).

**Mitigation** : Profiling des le prototype. Cache de frame courant par entite.

### R-05 : VRAM (Probabilite: FAIBLE court terme, ELEVEE Allumina)

Les mega-atlas 4096x4096 consomment 64 MB chacun en RGBA. Avec 4 atlas =
256 MB VRAM juste pour les sprites.

**Mitigation** : Compression BC7/BC3 (8-16 bytes/4x4 block vs 64 bytes RGBA).
Chargement on-demand par acte. Streaming d'atlas.

### R-06 : Scope creep (Probabilite: ELEVEE, Impact: ELEVE)

Le chantier "reforge moteur graphique" peut facilement exploser en scope :
animation, particules, post-process, lighting, shadow, netcode render prediction...

**Mitigation** : Decouper en phases strictes. Phase 1 = fondations (atlas +
instancing + animation). Phase 2 = optimisations (particules, post-process).
Phase 3 = Allumina-specific (netcode render, LOD).

### R-07 : Renderer stub non resolu

Le `Renderer` dans mge-render est un stub. Toute la logique vit dans le client.
Faut-il finaliser le Renderer comme point d'entree unifie ou garder le pattern
actuel (chaque jeu gere son propre rendu) ?

**Mitigation** : Decision architecturale a prendre en Temps 2 (Ideation).

---

## 7. Assets existants

### Sprites placeholders (PNG individuels, 8 fichiers)

| Fichier | Entite | Taille classe |
|---------|--------|---------------|
| `player.png` | Joueur | Humanoid (128x384) |
| `fallen_shaman.png` | Fallen Shaman | Medium (128x256) |
| `spike_fiend.png` | Quill Rat | Small (128x128) |
| `andariel.png` | Andariel (boss) | Boss (256x768) |
| `akara.png` | Akara (NPC) | Humanoid (128x384) |
| `deckard_cain.png` | Deckard Cain (NPC) | Humanoid (128x384) |
| `fire.png` | Campfire | Small (128x128) |
| `barrel.png` | Barrel | Small (128x128) |

### Autres assets disponibles

- `mge/assets/Dev_assets/` : Tiles herbe (Grass_a.png), arbres, sprites dev
- `mge/assets/Knight_1/` : Sprites chevalier (potentiellement animes)
- `mge/assets/RP_MMO_Sliced/` : Sprites MMO slices
- `mge/assets/d2_sprites/` : Sprites style D2
- `mge/assets/tiles/` : Tilesets
- `mge/assets/fonts/` : Polices
- `mge/assets/icons/` : Icones UI
- `mge/assets/npc/` : Sprites PNJ
- `mge/assets/medieval_sfx/` : Effets sonores
- `mge/assets/ACT1_SPRITE_CATALOG.md` : Catalogue de sprites Acte 1

### Normes de sprites actuelles (SpriteSize dans d2_sprites.rs)

| Classe | Largeur | Hauteur | Ratio | Usage |
|--------|---------|---------|-------|-------|
| Small | 128 | 128 | 1:1 | Critters, objets |
| Medium | 128 | 256 | 1:2 | Bipedes moyens |
| Humanoid | 128 | 384 | 1:3 | Joueur, PNJs |
| Large | 192 | 384 | 1:2 | Grandes creatures |
| Boss | 256 | 768 | 1:3 | Boss d'acte |

**Echelle de rendu** : `SPRITE_SCALE = 0.5` (les sprites 128px sont reduits a 64px pour
correspondre aux tiles 64x32 iso).

---

## 8. Questions ciblees pour l'utilisateur (Hard Gate)

Avant de passer au Temps 2 (Ideation), j'ai besoin de clarifications :

**Q1 -- Priorite animation vs optimisation** :
Le systeme d'animation (L-03) est la lacune la plus visible pour le joueur, mais le
batching multi-texture (L-01) est le goulot technique le plus critique pour la scalabilite.
Quelle est la priorite ?
- (A) Animation d'abord (visible immediatement, gameplay)
- (B) Atlas/batching d'abord (fondation technique pour tout le reste)
- (C) Les deux en parallele (plus risque mais plus rapide)

**Q2 -- Perimetre de l'outil d'animation** :
Tu mentionnes "un outil pour unifier les animations compatible avec le moteur".
S'agit-il de :
- (A) Un outil CLI type `mge-anim-pack` qui prend des sprite sheets Aseprite/PNG
  et genere des atlas TOML + PNG prets pour le moteur
- (B) Un editeur visuel dans `mge-studio` (Dioxus) pour definir/previewer les animations
- (C) Les deux

**Q3 -- Format d'animation cible** :
Pour les sprites D2-style, le standard est 8 directions * N frames par etat.
Confirmes-tu ce format ? Ou veux-tu un systeme plus generique (rotations libres,
blend trees, etc.) ?

---

## 9. Synthese de l'etat actuel

Le moteur graphique MGE est dans un etat **fonctionnel mais non scalable**.
Les fondations sont saines (wgpu, shader WGSL, batcher, camera iso) mais le
pipeline de rendu actuel est un prototype qui ne passera pas a l'echelle pour
Allumina (500+ entites).

Les 5 chantiers prioritaires identifies sont :
1. **Texture atlas GPU** -- eliminer les render passes multiples (L-01, L-02)
2. **Systeme d'animation** -- donner vie aux entites (L-03)
3. **GPU instancing** -- reduire le CPU overhead (L-05)
4. **Depth sorting global** -- corriger le z-fighting (L-07)
5. **Outil de sprite pipeline** -- industrialiser la production d'assets

Le Renderer stub (L-09) et la duplication GUI/mge-ui (L-11) sont des decisions
architecturales a trancher en Temps 2.
