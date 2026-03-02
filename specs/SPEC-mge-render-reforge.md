# SPEC Technique -- Reforge Moteur Graphique MGE

<!-- @id: SPEC-MGE-Render-Reforge @do: spec @role: back-end @layer: 2 @human: francois -->

**Auteur** : Francois (Dev Back-End)
**Date** : 2026-03-02
**Phase** : P0 Temps 4 -- Specification technique
**Chantier** : T5 -- Reforge Moteur Graphique MGE
**Statut** : En attente validation Denis (P0-T5) + utilisateur (Gate P0)

---

## Table des matieres

1. [Perimetre](#1-perimetre)
2. [Architecture cible](#2-architecture-cible)
   - 2.8 [World-Space Overhead UI](#28-world-space-overhead-ui)
3. [Nouveaux crates et modules](#3-nouveaux-crates-et-modules)
4. [Modifications crates existants](#4-modifications-crates-existants)
5. [Formats de donnees](#5-formats-de-donnees)
6. [Shader WGSL](#6-shader-wgsl)
7. [Dependances nouvelles](#7-dependances-nouvelles)
8. [Tests requis](#8-tests-requis)
9. [Verification documentaire](#9-verification-documentaire)
10. [Risques techniques](#10-risques-techniques)
11. [Conformite architecturale](#11-conformite-architecturale)
12. [Changelog](#12-changelog)

---

## 1. Perimetre

### 1.1 Ce qui change

| Composant | Etat actuel | Etat cible |
|-----------|-------------|------------|
| Sprite rendering | 1 draw call par texture (`SpriteBatcher` + vertex buffer par frame) | Instanced rendering : 1 quad statique + storage buffer per-instance |
| Texture binding | 1 texture bind par render pass (`group(1)`) | Texture array 2D (`texture_2d_array`) -- une seule bind pour toutes les textures atlas |
| Animation | Aucune (sprites statiques, 1 frame) | FSM `AnimationController` + `AnimationBank` (TOML) + 8 directions |
| Depth sorting | Tri CPU par `z` dans `SpriteBatch::sort_by_depth()` | Z-buffer iso : `z_depth` par instance dans le storage buffer, depth test GPU |
| Frustum culling | Inline dans `batch_tiles()` et `batch_monsters_*()` du game.rs | Formel : `Camera2D::visible_rect()` + `SpatialHashGrid::query()` |
| Spatial partitioning | `SpatialGrid` dans `mge-collision` (cell_size=64, collision uniquement) | `SpatialHashGrid` dans `mge-render` (cell_size=256, rendu + culling) |
| Atlas tooling | `mge-packer` (shelf-first) | Nouveau CLI `mge-anim-pack` (Aseprite + MaxRects + miroir auto) |
| Sprite norms | Aucune convention formelle | Convention de nommage, 5 classes de taille, 8 directions, layer compositing |
| Text rendering | `BitmapFont` procedural ASCII 5x7 (128x48px atlas, chars 32-126) | `TextRenderer` via fontdue : polices TTF/OTF standard, multi-fonts, multi-sizes, glyph cache atlas GPU, latin etendu (accents francais) |
| World-space UI | Aucun (texte bitmap basic, pas de float/emote/progress) | `FloatingTextManager` + `EmoteManager` + `ProgressBarManager` dans overhead.rs. Texte flottant RO-style, emotes sprite, barres de progression overhead |

### 1.2 Ce qui ne change pas

- Coordonnees isometriques dimetriques 2:1 (`TILE_WIDTH=64`, `TILE_HEIGHT=32`)
- `Camera2D` (position, zoom, smooth follow, bounds) -- enrichie, pas remplacee
- `AtlasDescriptor` / `AtlasFrame` / `TextureAtlas` / `AtlasRegistry` (CPU-side) -- enrichies
- `RenderLayer` enum (Ground=0..Hud=5) -- conservee
- `TileRenderer` / `TilePos` -- conserves
- Game loop, ECS, pathfinding, audio, collision (aucune modification)
- Toutes les dependances workspace actuelles (wgpu 24.0, image 0.25, winit 0.30, etc.)

### 1.3 Approche d'implementation

**Sprint 0** (fondations rendering) et **Sprint 1** (animation + normes) en parallele :

- Sprint 0 : Instanced rendering + texture array + frustum culling + spatial hash
- Sprint 1 : Animation FSM + Aseprite loader + sprite norms + `mge-anim-pack` CLI

---

## 2. Architecture cible

### 2.1 Pipeline de rendu refactore

**Etat actuel** : Le `SpriteBatcher` reconstruit un vertex buffer CPU chaque frame (4 `SpriteVertex` par sprite = 128 bytes/sprite) et utilise un index buffer statique. Chaque texture necessite un render pass separe avec changement de bind group. Le sodomight-client cree ~10 render passes par frame (tiles, fire, barrel, akara, cain, fallen, spike, fallback, player, gui, font).

**Etat cible** : `InstancedSpriteBatcher` avec :

1. **Vertex buffer statique** : 1 seul quad unitaire (4 vertices, 6 indices), cree une fois au startup.
2. **Storage buffer per-instance** : un `wgpu::Buffer` de type `STORAGE` contenant N `InstanceData`.
3. **Texture array** : toutes les textures atlas chargees dans un seul `texture_2d_array<f32>`, une seule bind.
4. **1-2 draw calls par frame** : `draw_indexed(6, instance_count, ...)` au lieu de N render passes.

```rust
/// Per-instance data uploaded to the GPU storage buffer.
/// Size: 48 bytes per instance (12 floats).
#[repr(C)]
#[derive(Debug, Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
pub struct InstanceData {
    /// Screen-space position [x, y] in pixels.
    pub position: [f32; 2],
    /// Sprite dimensions [width, height] in pixels.
    pub size: [f32; 2],
    /// UV rectangle [u_min, v_min, u_max, v_max] in normalised coords.
    pub uv_rect: [f32; 4],
    /// RGBA tint colour.
    pub tint: [f32; 4],
    /// Index into the texture array (which atlas layer).
    pub texture_index: u32,
    /// Depth value for Z-sorting (iso depth key).
    /// Higher values = further from camera = drawn behind.
    pub z_depth: f32,
    /// Padding to align to 16 bytes (wgpu requirement for storage buffers).
    pub _pad: [f32; 2],
}
// Total: 2 + 2 + 4 + 4 + 1 + 1 + 2 = 16 floats = 64 bytes
```

**Note** : La taille reelle est 64 bytes (16 x f32) pour respecter l'alignement 16 bytes requis par les storage buffers WGSL. Les 2 floats de padding portent le total a 64 bytes.

**Strategie de migration** : L'ancien `SpriteBatcher` est conserve derriere un feature flag `legacy-batcher` pour permettre un rollback en cas de regression. Le nouveau `InstancedSpriteBatcher` est le chemin par defaut.

### 2.2 Systeme d'animation

#### 2.2.1 AnimationState (enum)

```rust
/// Animation states for entity sprites.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
pub enum AnimationState {
    /// Standing still.
    Idle,
    /// Walking / running.
    Walk,
    /// Melee or ranged attack.
    Attack,
    /// Taking damage.
    Hit,
    /// Death sequence (plays once, then holds last frame).
    Death,
    /// Casting a spell.
    Cast,
    /// Special action (town portal, identifying, etc.).
    Special,
}
```

#### 2.2.2 Direction (8 directions avec miroir)

```rust
/// 8 cardinal/intercardinal directions.
/// S, SW, W, NW are rendered. N, NE, E, SE are horizontal mirrors.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
#[repr(u8)]
pub enum Direction {
    S  = 0,  // Rendered
    SW = 1,  // Rendered
    W  = 2,  // Rendered
    NW = 3,  // Rendered
    N  = 4,  // Mirror of S
    NE = 5,  // Mirror of SW
    E  = 6,  // Mirror of W
    SE = 7,  // Mirror of NW
}

impl Direction {
    /// The 4 directions that have actual sprite data (not mirrored).
    pub const RENDERED: [Self; 4] = [Self::S, Self::SW, Self::W, Self::NW];

    /// Returns the source direction and whether horizontal flip is needed.
    pub fn mirror_source(self) -> (Self, bool) {
        match self {
            Self::S  => (Self::S,  false),
            Self::SW => (Self::SW, false),
            Self::W  => (Self::W,  false),
            Self::NW => (Self::NW, false),
            Self::N  => (Self::S,  false), // N = S sans flip (vue de dos)
            Self::NE => (Self::SW, true),  // NE = miroir de SW
            Self::E  => (Self::W,  true),  // E  = miroir de W
            Self::SE => (Self::NW, true),  // SE = miroir de NW
        }
    }

    /// Compute direction from a velocity vector (dx, dy in world space).
    pub fn from_velocity(dx: f32, dy: f32) -> Self {
        let angle = dy.atan2(dx);
        let octant = ((angle + std::f32::consts::PI) / (std::f32::consts::PI / 4.0))
            .round() as u8 % 8;
        // Map octant to direction enum
        match octant {
            0 => Self::W,
            1 => Self::NW,
            2 => Self::N,
            3 => Self::NE,
            4 => Self::E,
            5 => Self::SE,
            6 => Self::S,
            7 => Self::SW,
            _ => Self::S,
        }
    }
}
```

**Precision sur N** : La direction Nord est le dos du personnage. Dans D2, le sprite de dos n'est PAS un miroir horizontal de S. Il faudrait idealement un 5eme rendu (S, SW, W, NW, N). Cependant, pour la phase placeholder et MVP, on utilise S comme fallback pour N. Les assets finaux devront fournir 5 directions rendues ou un rendu N distinct.

#### 2.2.3 AnimationController (FSM)

```rust
/// Finite State Machine controlling sprite animation playback.
pub struct AnimationController {
    /// Current animation state.
    pub state: AnimationState,
    /// Current direction.
    pub direction: Direction,
    /// Current frame index within the animation clip.
    pub frame_index: u32,
    /// Elapsed time in the current frame (seconds).
    pub frame_timer: f32,
    /// Whether the current animation has finished (for one-shot anims).
    pub finished: bool,
}

impl AnimationController {
    /// Create a new controller starting in Idle facing South.
    pub fn new() -> Self { ... }

    /// Transition to a new state. Resets frame counter.
    /// No-op if already in the requested state.
    pub fn set_state(&mut self, state: AnimationState) { ... }

    /// Set the facing direction.
    pub fn set_direction(&mut self, dir: Direction) { ... }

    /// Advance the animation by `dt` seconds using the given clip metadata.
    /// Returns `true` if the frame changed (for event dispatch).
    pub fn tick(&mut self, dt: f32, clip: &AnimationClip) -> bool { ... }

    /// Get the current frame name for atlas lookup.
    /// Format: `"{entity}_{action}_{dir}_{frame:03d}"`
    pub fn current_frame_name(&self, entity_id: &str) -> String { ... }

    /// Whether the sprite should be horizontally flipped.
    pub fn is_mirrored(&self) -> bool { ... }
}
```

#### 2.2.4 AnimationBank (donnees TOML)

```rust
/// Registry of all animation clips loaded from TOML.
pub struct AnimationBank {
    /// Map: (entity_id, AnimationState, Direction) -> AnimationClip
    clips: HashMap<(String, AnimationState, Direction), AnimationClip>,
}

/// Metadata for a single animation clip (one state + one direction).
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AnimationClip {
    /// Number of frames in this clip.
    pub frame_count: u32,
    /// Duration per frame in seconds.
    pub frame_duration: f32,
    /// Whether the animation loops.
    pub looping: bool,
    /// Frame events (damage window, sfx trigger, vfx spawn).
    #[serde(default)]
    pub events: Vec<FrameEvent>,
}

/// Event triggered at a specific frame during animation playback.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FrameEvent {
    /// Frame index at which this event fires.
    pub frame: u32,
    /// Event type.
    pub kind: FrameEventKind,
}

/// Types of frame events.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum FrameEventKind {
    /// Damage window opens (attack connects).
    Damage,
    /// Play a sound effect.
    Sfx { id: String },
    /// Spawn a visual effect.
    Vfx { id: String },
    /// Spawn a projectile.
    Projectile { id: String },
}
```

### 2.3 Sprite norms

#### 2.3.1 Convention de nommage

```
{entity}_{action}_{dir}_{frame:03d}.png
```

Exemples :
- `necro_idle_s_000.png` -- Necromancer, idle, facing south, frame 0
- `fallen_walk_sw_003.png` -- Fallen, walk, facing south-west, frame 3
- `andariel_attack_w_007.png` -- Andariel, attack, facing west, frame 7

#### 2.3.2 Classes de taille (existantes, enrichies)

```rust
/// Sprite size classes.
/// Dimensions are for a single direction/frame.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum SpriteSize {
    /// 64x64 -- critters, small objects, items on ground.
    Small,
    /// 96x128 -- medium bipeds (fallen, quill rat).
    Medium,
    /// 96x192 -- humanoids (player, NPCs).
    Humanoid,
    /// 128x256 -- large creatures (yeti, unraveler).
    Large,
    /// 192x384 -- act bosses (Andariel, Duriel).
    Boss,
}
```

**Migration depuis l'existant** : Les dimensions actuelles dans `d2_sprites.rs` (128/256/384/768) sont pour les placeholders statiques unidirectionnels. Les nouvelles dimensions sont pour les sprites directionnels animes et correspondent mieux au D2 original. L'ancien `SpriteSize` dans `d2_sprites.rs` est deprecie.

#### 2.3.3 Layer compositing

Les entites complexes (joueur, certains boss) utilisent un compositing multicouche :

```
Layer 0: body (corps de base)
Layer 1: armor (armure equipee)
Layer 2: weapon (arme tenue)
Layer 3: shield (bouclier)
Layer 4: helm (casque)
```

Chaque layer a son propre atlas et ses propres frames. Le compositing est un simple overlay alpha (couches empilees dans l'ordre). Les layers sont optionnels (un PNJ n'a que `body`).

Pour le **MVP Sprint 1**, le compositing multicouche est **hors scope**. Chaque entite a un seul sprite composite. Le layer compositing sera ajoute en Sprint 2+ quand le systeme d'equipement visuel sera implemente.

### 2.4 Spatial partitioning (rendu)

```rust
/// Spatial hash grid pour le frustum culling du renderer.
///
/// Distinct du `SpatialGrid` de mge-collision (qui sert a la broadphase collision).
/// Celui-ci utilise des cellules plus grandes (256px = 4x4 tiles) et stocke
/// des entites rendables, pas des colliders.
pub struct RenderSpatialGrid {
    /// Cell size in world units (screen pixels at zoom=1).
    cell_size: f32,
    /// Map from cell coords to entity render info.
    cells: HashMap<(i32, i32), Vec<RenderEntity>>,
}

/// Lightweight render entity reference stored in the spatial grid.
#[derive(Debug, Clone, Copy)]
pub struct RenderEntity {
    /// ECS entity id.
    pub entity_id: u32,
    /// Screen-space AABB for this entity.
    pub screen_aabb: Aabb,
    /// Layer for sorting.
    pub layer: RenderLayer,
    /// Iso depth key.
    pub z_depth: f32,
}
```

- **Cell size** : 256 pixels (4 tiles de 64px). Ce rapport permet de couvrir le viewport (1280x720) avec environ 5x3 = 15 cellules visibles, soit ~O(15) queries par frame.
- **Rebuild** : La grille est reconstruite chaque frame (clear + insert all) car les entites bougent. Cout : O(N) ou N = nombre d'entites rendables.
- **Deduplication** : Les entites chevauchant plusieurs cellules sont inserees dans chacune. Le query dedup par entity_id avant soumission au batcher.

### 2.5 Frustum culling

```rust
impl Camera2D {
    /// Return the world-space AABB of the visible area.
    ///
    /// Accounts for zoom: when zoomed in, the visible area shrinks.
    /// Returns an AABB in screen-pixel space (iso coordinates).
    pub fn visible_rect(&self) -> Aabb {
        let half_w = (self.screen_w as f32 / self.zoom) / 2.0;
        let half_h = (self.screen_h as f32 / self.zoom) / 2.0;
        Aabb::new(
            Vec2::new(self.world_x - half_w, self.world_y - half_h),
            Vec2::new(self.world_x + half_w, self.world_y + half_h),
        )
    }
}
```

**Pipeline de culling par frame** :

1. `Camera2D::visible_rect()` -- obtenir l'AABB visible
2. Expansion de la marge (+128px de chaque cote pour les sprites larges)
3. `RenderSpatialGrid::query(expanded_aabb)` -- obtenir les entites candidates
4. Deduplication par entity_id
5. Tri par `(layer, z_depth)`
6. Upload des `InstanceData` dans le storage buffer
7. `draw_indexed(6, instance_count, 0, 0, 0)` -- un seul draw call

### 2.6 Outil CLI `mge-anim-pack`

Nouveau crate dans `mge/tools/mge-anim-pack/`.

#### 2.6.1 Commandes

```
mge-anim-pack pack [OPTIONS]
  --input <dir>      Input directory containing .ase files or sprite frames
  --output <dir>     Output directory for atlas + TOML
  --max-size <px>    Max atlas dimension (default: 2048)
  --margin <px>      Margin between frames (default: 1)
  --entity <name>    Entity ID for naming convention

mge-anim-pack validate [OPTIONS]
  --atlas <file>     Atlas TOML descriptor to validate
  --sprites <dir>    Sprite directory to check against norms

mge-anim-pack info <file.ase>
  Print Aseprite file info: layers, tags, frame count, dimensions

mge-anim-pack import-png [OPTIONS]
  --input <dir>      Directory containing individual PNG frames
  --output <dir>     Output directory
  --entity <name>    Entity ID
  --size-class <class>  Preset size class (small|medium|humanoid|large|boss)
  --action <state>   Animation state (idle|walk|attack|hit|death|cast|special)
  --directions <n>   Number of directions provided (4 or 8, default 4)
  --fps <n>          Frames per second (default 12)
  --aseprite         Also generate .ase project file with proper tags
```

La commande `import-png` charge des frames PNG individuelles, applique la convention de nommage, assigne les presets de metadonnees selon la classe de taille (`SpriteSize`), et genere atlas + TOML. Si le flag `--aseprite` est active, elle genere aussi un fichier projet Aseprite (`.ase`) avec les frames comme cels et les etats d'animation comme tags.

#### 2.6.2 Pipeline interne

```
Input (.ase ou PNG frames)
  |
  v
[Aseprite Loader] -- asefile crate, extraction frames + tags + user data
  |                  OU
  |                  [PNG frame loader] -- lecture frames individuelles
  |                     + metadata presets (size-class) + Aseprite export (.ase)
  v
[Frame Namer] -- applique la convention {entity}_{action}_{dir}_{frame:03d}
  |
  v
[Mirror Generator] -- mge-mirror pour generer NE/E/SE/N a partir de SW/W/NW/S
  |
  v
[MaxRects Packer] -- rectangle-pack crate (ou impl maison)
  |
  v
[Atlas Assembler] -- composition PNG finale + TOML descriptor
  |
  v
Output:
  - atlas.png          (mega-texture, max 2048x2048 ou 4096x4096)
  - atlas.toml         (AtlasDescriptor avec frames nommees)
  - animations.toml    (AnimationBank : clips, frame counts, durations, events)
```

#### 2.6.3 Mapping Aseprite tags vers AnimationState

```rust
/// Map Aseprite tag names to AnimationState.
fn map_tag_to_state(tag_name: &str) -> Option<AnimationState> {
    match tag_name.to_lowercase().as_str() {
        "idle" | "stand" => Some(AnimationState::Idle),
        "walk" | "run" | "move" => Some(AnimationState::Walk),
        "attack" | "melee" | "swing" => Some(AnimationState::Attack),
        "hit" | "hurt" | "gethit" => Some(AnimationState::Hit),
        "death" | "die" | "dead" => Some(AnimationState::Death),
        "cast" | "spell" | "magic" => Some(AnimationState::Cast),
        "special" | "skill" => Some(AnimationState::Special),
        _ => None,
    }
}
```

L'artiste structure son fichier Aseprite avec :
- 1 tag par animation state (Idle, Walk, Attack, etc.)
- 1 layer par direction (dir_s, dir_sw, dir_w, dir_nw) ou
- 1 fichier `.ase` par direction

### 2.7 Systeme de polices TTF/OTF

#### 2.7.1 Contexte et motivation

L'etat actuel du rendu texte dans MGE repose sur `BitmapFont` (`sodomight-client/src/bitmap_font.rs`) : un atlas procedural 128x48 pixels contenant 95 glyphes ASCII (codes 32-126) en resolution 5x7 pixels. Ce systeme presente trois limites majeures :

1. **Pas de caracteres accentues** : aucun support du latin etendu (e, a, c, etc.), indispensable pour le francais
2. **Taille fixe** : un seul rendu 5x7 upscale par un facteur `scale`, resultant en pixels visibles
3. **Une seule police** : impossible d'utiliser des polices thematiques (dafont.com, polices medievales Diablo-like)

Le nouveau systeme utilise le crate **fontdue** (v0.9.3) pour rasteriser des polices TTF/OTF standard. Les glyphes rasterises sont caches dans un atlas GPU dynamique (`GlyphCache`) qui s'integre au pipeline instanced : chaque glyphe est un sprite dans la texture array, rendu comme une instance.

**Polices TTF deja presentes** dans `mge/assets/fonts/` :
- `DigitalDisco.ttf` + Thin (fantasy/display)
- `SourceSans3[wght].ttf` + Italic (variable weight, UI text)
- `GentiumBookPlus-Regular.ttf` + Bold + Italic + BoldItalic (serif, lore/dialog)
- `Rooters.ttf` + Italic (display/title)

#### 2.7.2 Architecture : TtfFont (chargement et rasterisation)

```rust
/// A loaded TrueType/OpenType font, backed by fontdue.
///
/// Owns the parsed font data and provides on-demand glyph rasterization.
/// Thread-safe: `fontdue::Font` is `Send + Sync`.
pub struct TtfFont {
    /// The underlying fontdue font.
    inner: fontdue::Font,
    /// Human-readable name for logging.
    name: String,
}

impl TtfFont {
    /// Load a TTF/OTF font from raw bytes.
    ///
    /// # Errors
    /// Returns `RenderError::FontLoadFailed` if the font data is invalid.
    pub fn from_bytes(data: &[u8], name: &str) -> Result<Self, RenderError> {
        let settings = fontdue::FontSettings::default();
        let font = fontdue::Font::from_bytes(data, settings)
            .map_err(|e| RenderError::FontLoadFailed {
                name: name.to_string(),
                reason: e.to_string(),
            })?;
        Ok(Self {
            inner: font,
            name: name.to_string(),
        })
    }

    /// Load a TTF/OTF font from a file path.
    pub fn from_file(path: &std::path::Path) -> Result<Self, RenderError> {
        let data = std::fs::read(path).map_err(|e| RenderError::FontLoadFailed {
            name: path.display().to_string(),
            reason: e.to_string(),
        })?;
        let name = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string();
        Self::from_bytes(&data, &name)
    }

    /// Rasterize a single glyph at the given pixel size.
    ///
    /// Returns the glyph metrics and an alpha-coverage bitmap (1 byte per pixel,
    /// 0 = fully transparent, 255 = fully opaque).
    pub fn rasterize(&self, ch: char, px_size: f32) -> (GlyphMetrics, Vec<u8>) {
        let (metrics, bitmap) = self.inner.rasterize(ch, px_size);
        let glyph_metrics = GlyphMetrics {
            width: metrics.width as u32,
            height: metrics.height as u32,
            xmin: metrics.xmin,
            ymin: metrics.ymin,
            advance_width: metrics.advance_width,
        };
        (glyph_metrics, bitmap)
    }

    /// Get metrics for a glyph without rasterizing.
    pub fn metrics(&self, ch: char, px_size: f32) -> GlyphMetrics {
        let metrics = self.inner.metrics(ch, px_size);
        GlyphMetrics {
            width: metrics.width as u32,
            height: metrics.height as u32,
            xmin: metrics.xmin,
            ymin: metrics.ymin,
            advance_width: metrics.advance_width,
        }
    }
}

/// Positioning and sizing metadata for a rasterized glyph.
#[derive(Debug, Clone, Copy)]
pub struct GlyphMetrics {
    /// Bitmap width in pixels.
    pub width: u32,
    /// Bitmap height in pixels.
    pub height: u32,
    /// Horizontal offset from the origin to the left edge of the bitmap.
    pub xmin: i32,
    /// Vertical offset from the baseline to the bottom edge of the bitmap.
    pub ymin: i32,
    /// Horizontal advance to the next glyph origin.
    pub advance_width: f32,
}
```

**Note** : `fontdue::Font::from_bytes` attend un `&[u8]` (pas un path) et retourne `Result<Font, &'static str>`. Le parsing est infaillible pour les fichiers TTF/OTF valides. La methode `rasterize(char, f32)` retourne un tuple `(Metrics, Vec<u8>)` ou le `Vec<u8>` est un bitmap de couverture alpha (1 byte/pixel, 0=transparent, 255=opaque).

#### 2.7.3 Architecture : GlyphCache (atlas GPU dynamique)

```rust
/// Key for a cached glyph: (font_index, character, quantized_size).
///
/// The size is quantized to avoid an explosion of cache entries when the
/// caller requests fractional sizes. Quantization: round to nearest 0.5px.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct GlyphKey {
    /// Index into the font registry.
    pub font_index: u16,
    /// The Unicode character.
    pub character: char,
    /// Pixel size, quantized: `(px_size * 2.0).round() as u16`.
    pub quantized_size: u16,
}

/// Cached glyph entry with UV coordinates in the glyph atlas.
#[derive(Debug, Clone, Copy)]
pub struct CachedGlyph {
    /// UV rectangle [u_min, v_min, u_max, v_max] in the glyph atlas.
    pub uv_rect: [f32; 4],
    /// Glyph metrics (for positioning).
    pub metrics: GlyphMetrics,
    /// Texture array layer index of the glyph atlas.
    pub texture_layer: u32,
}

/// GPU glyph atlas with on-demand rasterization and caching.
///
/// Architecture: a single RGBA texture (dedicated layer in the TextureArray)
/// with a shelf-first allocator packing glyphs row by row. When the atlas
/// is full, it is rebuilt (all glyphs re-rasterized and re-packed).
///
/// The atlas stores alpha-only glyphs expanded to RGBA (R=G=B=255, A=coverage)
/// so they can be tinted by the instance's `tint` colour at render time.
pub struct GlyphCache {
    /// Cached glyph lookup.
    cache: HashMap<GlyphKey, CachedGlyph>,
    /// Atlas RGBA image (CPU-side staging).
    atlas_image: image::RgbaImage,
    /// Current packing cursor: next free (x, y) in the atlas.
    cursor_x: u32,
    cursor_y: u32,
    /// Current row height (tallest glyph in the current shelf).
    row_height: u32,
    /// Atlas dimensions.
    atlas_width: u32,
    atlas_height: u32,
    /// Texture array layer index for this glyph atlas.
    texture_layer: u32,
    /// Whether the atlas has been modified since last GPU upload.
    dirty: bool,
}

impl GlyphCache {
    /// Create a new glyph cache with the given atlas dimensions.
    ///
    /// Typical: 1024x1024 for ~500 glyphs at 24px, or 2048x2048 for
    /// full Unicode Latin Extended at multiple sizes.
    pub fn new(atlas_width: u32, atlas_height: u32) -> Self { ... }

    /// Get or rasterize a glyph and return its cached entry.
    ///
    /// If the glyph is already cached, returns immediately.
    /// Otherwise, rasterizes it via the given `TtfFont`, packs it
    /// into the atlas, and marks the atlas as dirty for GPU upload.
    ///
    /// # Errors
    /// Returns `RenderError::GlyphAtlasFull` if the atlas cannot fit
    /// the new glyph (even after attempting a new shelf row).
    pub fn get_or_insert(
        &mut self,
        key: GlyphKey,
        font: &TtfFont,
    ) -> Result<CachedGlyph, RenderError> { ... }

    /// Returns true if the atlas has new glyphs since last upload.
    pub fn is_dirty(&self) -> bool { self.dirty }

    /// Return the atlas image for GPU upload, and clear the dirty flag.
    pub fn take_atlas(&mut self) -> &image::RgbaImage {
        self.dirty = false;
        &self.atlas_image
    }

    /// Clear all cached glyphs (e.g. on font hot-reload).
    pub fn clear(&mut self) { ... }

    /// Number of cached glyphs.
    pub fn len(&self) -> usize { self.cache.len() }

    /// Whether the cache is empty.
    pub fn is_empty(&self) -> bool { self.cache.is_empty() }
}
```

**Strategie de packing shelf-first** : Les glyphes sont inseres de gauche a droite dans la rangee courante. Quand la rangee est pleine (cursor_x + glyph.width > atlas_width), on descend d'une rangee (cursor_y += row_height, cursor_x = 0, row_height = 0). Si l'atlas est plein (cursor_y + glyph.height > atlas_height), on retourne une erreur `GlyphAtlasFull`. Ce scenario est rare pour un atlas 1024x1024 avec des polices de jeu (ASCII + latin etendu a 2-3 tailles).

**Format atlas** : Les glyphes fontdue sont des bitmaps alpha mono-canal (`Vec<u8>`). On les convertit en RGBA (`[255, 255, 255, alpha]`) pour etre compatibles avec le pipeline instanced (qui attend du RGBA). Le tint color de l'instance controle la couleur finale du texte.

#### 2.7.4 Architecture : TextRenderer (remplacement de BitmapFont)

```rust
/// Font handle: index into the TextRenderer's font registry.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct FontId(pub u16);

/// High-level text renderer using TTF/OTF fonts via fontdue.
///
/// Replaces `BitmapFont` in sodomight-client. Supports multiple fonts,
/// multiple sizes, and on-demand glyph caching.
///
/// Integration: text quads are pushed as instances into the
/// `InstancedSpriteBatcher`. The glyph atlas is a layer in the
/// `TextureArray`.
pub struct TextRenderer {
    /// Registered fonts, indexed by FontId.
    fonts: Vec<TtfFont>,
    /// Glyph cache (atlas + lookup).
    glyph_cache: GlyphCache,
    /// Default font for convenience methods.
    default_font: FontId,
    /// Default pixel size for convenience methods.
    default_size: f32,
}

impl TextRenderer {
    /// Create a text renderer with a glyph atlas of the given dimensions.
    pub fn new(atlas_width: u32, atlas_height: u32) -> Self { ... }

    /// Register a font and return its handle.
    ///
    /// # Errors
    /// Returns `RenderError::FontLoadFailed` if the font data is invalid.
    pub fn add_font(&mut self, data: &[u8], name: &str) -> Result<FontId, RenderError> { ... }

    /// Register a font from a file path.
    pub fn add_font_file(&mut self, path: &std::path::Path) -> Result<FontId, RenderError> { ... }

    /// Set the default font and size for convenience methods.
    pub fn set_default(&mut self, font: FontId, size: f32) { ... }

    /// Push a text string into the instanced batcher.
    ///
    /// Each character becomes one instance in the batcher, with UV coords
    /// pointing to its glyph in the atlas layer of the TextureArray.
    ///
    /// Returns the total rendered width in pixels.
    ///
    /// # Arguments
    /// * `batcher` - The instanced sprite batcher to push quads into.
    /// * `x`, `y` - Top-left screen position of the first character.
    /// * `text` - The string to render (UTF-8, supports latin extended).
    /// * `font` - Font handle.
    /// * `px_size` - Pixel size for rasterization.
    /// * `color` - RGBA tint colour.
    /// * `z_depth` - Depth value for sorting (typically HUD layer).
    /// * `texture_layer` - The texture array layer of the glyph atlas.
    pub fn push_text(
        &mut self,
        batcher: &mut InstancedSpriteBatcher,
        x: f32,
        y: f32,
        text: &str,
        font: FontId,
        px_size: f32,
        color: [f32; 4],
        z_depth: f32,
        texture_layer: u32,
    ) -> Result<f32, RenderError> {
        let mut cx = x;
        for ch in text.chars() {
            let key = GlyphKey {
                font_index: font.0,
                character: ch,
                quantized_size: (px_size * 2.0).round() as u16,
            };
            let cached = self.glyph_cache.get_or_insert(key, &self.fonts[font.0 as usize])?;

            if cached.metrics.width > 0 && cached.metrics.height > 0 {
                let instance = InstanceData {
                    position: [
                        cx + cached.metrics.xmin as f32,
                        y - cached.metrics.ymin as f32 - cached.metrics.height as f32,
                    ],
                    size: [cached.metrics.width as f32, cached.metrics.height as f32],
                    uv_rect: cached.uv_rect,
                    tint: color,
                    texture_index: texture_layer,
                    z_depth,
                    _pad: [0.0; 2],
                };
                batcher.push(instance)?;
            }

            cx += cached.metrics.advance_width;
        }
        Ok(cx - x)
    }

    /// Convenience: push text with the default font and size.
    pub fn push_text_default(
        &mut self,
        batcher: &mut InstancedSpriteBatcher,
        x: f32,
        y: f32,
        text: &str,
        color: [f32; 4],
        z_depth: f32,
        texture_layer: u32,
    ) -> Result<f32, RenderError> {
        self.push_text(batcher, x, y, text, self.default_font, self.default_size, color, z_depth, texture_layer)
    }

    /// Measure the width of a text string without rendering.
    pub fn measure_width(&self, text: &str, font: FontId, px_size: f32) -> f32 {
        let font_ref = &self.fonts[font.0 as usize];
        text.chars().map(|ch| font_ref.metrics(ch, px_size).advance_width).sum()
    }

    /// Line height for a given pixel size (ascent + descent).
    pub fn line_height(&self, font: FontId, px_size: f32) -> f32 {
        // fontdue does not expose line_height directly.
        // Approximate: use the height of 'M' plus 20% padding.
        let m_metrics = self.fonts[font.0 as usize].metrics('M', px_size);
        m_metrics.height as f32 * 1.2
    }

    /// Whether the glyph cache atlas needs re-uploading to the GPU.
    pub fn needs_upload(&self) -> bool {
        self.glyph_cache.is_dirty()
    }

    /// Get the atlas image for GPU upload. Clears the dirty flag.
    pub fn take_atlas(&mut self) -> &image::RgbaImage {
        self.glyph_cache.take_atlas()
    }

    /// Clear the glyph cache (e.g. on font hot-reload).
    pub fn clear_cache(&mut self) {
        self.glyph_cache.clear();
    }
}
```

#### 2.7.5 Integration avec le pipeline instanced

Le systeme de polices s'integre au pipeline instanced de la facon suivante :

```
Startup:
  1. TextRenderer::new(1024, 1024) -- cree le cache atlas vide
  2. renderer.add_font_file("mge/assets/fonts/DigitalDisco.ttf") -> FontId(0)
  3. renderer.add_font_file("mge/assets/fonts/SourceSans3[wght].ttf") -> FontId(1)
  4. renderer.set_default(FontId(0), 16.0)
  5. TextureArray::add_layer(renderer.take_atlas()) -> layer_index
     (reserve une layer dans la texture array pour l'atlas de glyphes)

Frame loop:
  1. renderer.push_text(batcher, x, y, "HP: 100/100", font, 16.0, RED, HUD_Z, layer)
     -- rasterise les glyphes manquants, pousse les instances dans le batcher
  2. if renderer.needs_upload() {
         queue.write_texture(texture_array, layer, renderer.take_atlas());
     }
  3. Le batcher rend tous les sprites et textes en un seul draw call
```

**Points cles** :
- Le glyph atlas occupe **1 layer** dans la TextureArray (pas une texture separee)
- Les glyphes sont rasterises **a la demande** : seuls les caracteres effectivement affiches sont caches
- Le re-upload GPU n'a lieu que quand de nouveaux glyphes sont rasterises (`dirty` flag)
- En regime stable (meme texte chaque frame), zero rasterisation, zero upload GPU
- Les glyphes sont traites comme des sprites normaux par le shader instanced (meme pipeline, meme draw call)

#### 2.7.6 Hot-reload des polices en dev

En mode developpement, le systeme de polices supporte le hot-reload :

```rust
/// Watch font files for changes and reload on modification.
/// Dev-only: guarded by `#[cfg(debug_assertions)]`.
pub fn check_font_reload(
    renderer: &mut TextRenderer,
    font_paths: &[(FontId, &std::path::Path)],
) -> Result<bool, RenderError> {
    // Compare file modification time with last load time.
    // If changed: reload font bytes, re-create TtfFont, clear glyph cache.
    // Returns true if any font was reloaded.
    ...
}
```

Le workflow dev est :
1. Modifier un fichier `.ttf` dans `mge/assets/fonts/`
2. Le watcher `notify` (deja utilise pour le hot-reload TOML des game data) detecte le changement
3. `check_font_reload()` recharge la police et vide le cache de glyphes
4. Le frame suivant re-rasterise les glyphes necessaires avec la nouvelle police

#### 2.7.7 Couverture caracteres

fontdue supporte nativement toute table `cmap` TrueType/OpenType, ce qui inclut :

| Bloc Unicode | Couverture | Usage |
|-------------|-----------|-------|
| Basic Latin (U+0020-U+007E) | 95 caracteres | Texte anglais, HUD, menus |
| Latin-1 Supplement (U+00A0-U+00FF) | 96 caracteres | Accents francais (e, a, u, i, o, c), symboles |
| Latin Extended-A (U+0100-U+017F) | 128 caracteres | Autres langues europeennes |
| General Punctuation (U+2000-U+206F) | Guillemets, tirets | Typographie |

**Limitation connue** : fontdue ne supporte pas le text shaping complexe (arabe, hindi, thai). Ce n'est pas un probleme pour MGE qui cible uniquement le francais et l'anglais.

### 2.8 World-Space Overhead UI

Elements d'interface rendus en espace monde, au-dessus des entites. Inspire du style Ragnarok Online pour les textes flottants. Tous ces elements s'integrent au pipeline instanced (sprites/quads pushes dans le `InstancedSpriteBatcher`).

#### 2.8.1 Floating Text (style Ragnarok Online)

```rust
/// Type of floating text effect.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FloatingTextKind {
    /// Physical damage dealt (white, large).
    Damage,
    /// Critical hit (yellow/orange, larger, shake effect).
    Critical,
    /// Miss / dodge (grey, italic "MISS").
    Evade,
    /// Blocked damage (blue, "BLOCK").
    Block,
    /// Healing amount (green, "+HP").
    Heal,
    /// Resource gathered (gold, "+3 Iron Ore").
    Gathered,
    /// Action success (green, "SUCCESS").
    Success,
    /// Action failure (red, "FAILED").
    Failure,
    /// Experience gained (purple, "+250 XP").
    Experience,
}

/// A floating text element in world space.
pub struct FloatingText {
    /// World position (above entity head).
    pub world_pos: [f32; 2],
    /// Text content.
    pub text: String,
    /// Kind determines color, size, animation.
    pub kind: FloatingTextKind,
    /// Time alive in seconds.
    pub age: f32,
    /// Maximum lifetime in seconds (default 1.5).
    pub lifetime: f32,
    /// Current vertical offset (floats upward).
    pub y_offset: f32,
    /// Current opacity (1.0 -> 0.0 fade).
    pub opacity: f32,
}

/// Manages all active floating texts.
pub struct FloatingTextManager {
    texts: Vec<FloatingText>,
}
```

**Comportement** :

- `spawn(world_pos, text, kind)` cree un nouveau texte flottant
- `tick(dt)` met a jour tous les textes : `y_offset += rise_speed * dt`, l'opacite diminue lineairement, `age += dt`. Les textes ou `age >= lifetime` sont supprimes.
- `render()` pousse chaque texte vers le `TextRenderer` comme sprites instances (utilise le glyph cache).
- Chaque `FloatingTextKind` a des presets :

| Kind | Couleur | Taille | Rise speed | Lifetime | Effet special |
|------|---------|--------|------------|----------|---------------|
| Damage | blanc #FFFFFF | 18px | 40px/s | 1.2s | -- |
| Critical | orange #FFA500 | 24px | 50px/s | 1.5s | Shake horizontal +/-3px (sinusoidal) |
| Evade | gris #AAAAAA | 14px | 30px/s | 1.0s | -- |
| Block | bleu #4488FF | 16px | 35px/s | 1.0s | -- |
| Heal | vert #44FF44 | 16px | 40px/s | 1.2s | -- |
| Gathered | or #FFD700 | 14px | 30px/s | 2.0s | -- |
| Success | vert #22CC22 | 16px | 35px/s | 1.5s | -- |
| Failure | rouge #FF4444 | 16px | 35px/s | 1.5s | -- |
| Experience | violet #AA66FF | 14px | 30px/s | 2.0s | -- |

- Tous les textes utilisent la meme police (configurable via `FontId`, defaut : police HUD du jeu)
- Critical a une animation de shake horizontal (sinusoidale +/-3px sur la duree de vie)
- Stacking : plusieurs textes sur la meme entite sont decales verticalement pour eviter le chevauchement

#### 2.8.2 Emotes (sprite au-dessus de l'entite)

```rust
/// Predefined emote types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum EmoteKind {
    Happy,
    Angry,
    Sad,
    Confused,
    Exclamation,
    Question,
    Heart,
    Sleep,
    Skull,
    Coin,
}

/// An emote displayed above an entity's head.
pub struct SpriteEmote {
    /// World position (entity head).
    pub world_pos: [f32; 2],
    /// Emote type.
    pub kind: EmoteKind,
    /// Time alive.
    pub age: f32,
    /// Max lifetime (default 3.0s).
    pub lifetime: f32,
    /// Current opacity.
    pub opacity: f32,
    /// Vertical bounce offset.
    pub bounce_offset: f32,
}

/// Manages active emotes.
pub struct EmoteManager {
    emotes: Vec<SpriteEmote>,
}
```

**Comportement** :

- Les emotes sont des petits sprites (32x32px) provenant d'un emote atlas
- `spawn(world_pos, kind)` cree un nouvel emote
- `tick(dt)` met a jour : petite animation de rebond (sinus, amplitude 4px, periode 0.5s), fondu en sortie dans les 0.5 dernieres secondes de lifetime
- `render()` pousse les sprites emotes vers le batcher instance
- 1 seul emote par entite a la fois (un nouvel emote remplace l'ancien)
- Emote atlas : un seul PNG avec tous les emotes dans une grille (10 emotes dans un layout 320x32 ou 160x64)

#### 2.8.3 Overhead Progress Bar (barre de progression au-dessus de l'entite)

```rust
/// A progress bar rendered above an entity.
pub struct OverheadProgressBar {
    /// World position (entity head).
    pub world_pos: [f32; 2],
    /// Progress 0.0 to 1.0.
    pub progress: f32,
    /// Bar width in pixels (default 40).
    pub width: f32,
    /// Bar height in pixels (default 6).
    pub height: f32,
    /// Background color (dark grey).
    pub bg_color: [f32; 4],
    /// Fill color (depends on context).
    pub fill_color: [f32; 4],
    /// Whether to show (visible while gathering/crafting/casting).
    pub visible: bool,
}

/// Manages overhead progress bars.
pub struct ProgressBarManager {
    bars: Vec<OverheadProgressBar>,
}
```

**Comportement** :

- `set(entity_id, progress, fill_color)` cree ou met a jour une barre de progression
- `remove(entity_id)` masque la barre
- `render()` pousse 2 quads par barre (fond + remplissage) dans le batcher instance comme sprites couleur unie
- Cas d'usage : recolte (remplissage vert), artisanat (remplissage bleu), incantation (remplissage violet), chargement (remplissage blanc)
- Pas de texture necessaire -- rendu comme rectangles couleur unie via le pipeline instance (utilise un pixel 1x1 blanc dans la texture array)

---

## 3. Nouveaux crates et modules

### 3.1 Nouveau module : `mge-render/src/animation.rs`

| Element | Description |
|---------|-------------|
| `AnimationState` | Enum des etats d'animation |
| `Direction` | Enum 8 directions avec mirror_source() |
| `AnimationClip` | Metadonnees d'un clip (frame_count, duration, events) |
| `AnimationBank` | Registry de clips, charge depuis TOML |
| `AnimationController` | FSM de lecture d'animation |
| `FrameEvent` | Evenement lie a une frame |
| `FrameEventKind` | Types d'evenements (Damage, Sfx, Vfx, Projectile) |

Fichier cible : `mge/crates/engine/mge-render/src/animation.rs` (~350 lignes)

### 3.2 Nouveau module : `mge-render/src/instanced.rs`

| Element | Description |
|---------|-------------|
| `InstanceData` | Struct GPU per-instance (64 bytes, Pod+Zeroable) |
| `InstancedSpriteBatcher` | Collecteur d'instances + upload storage buffer |
| `InstancedSpritePipeline` | Pipeline wgpu avec storage buffer + texture array |
| `TextureArray` | Gestionnaire de texture_2d_array GPU |

Fichier cible : `mge/crates/engine/mge-render/src/instanced.rs` (~500 lignes)

### 3.3 Nouveau module : `mge-render/src/culling.rs`

| Element | Description |
|---------|-------------|
| `RenderSpatialGrid` | Hash grid spatial pour le culling (cell_size=256) |
| `RenderEntity` | Reference legere d'entite rendable |
| `FrustumCuller` | Orchestre visible_rect + query + dedup + tri |

Fichier cible : `mge/crates/engine/mge-render/src/culling.rs` (~200 lignes)

### 3.4 Nouveau crate : `mge/tools/mge-anim-pack/`

```
mge/tools/mge-anim-pack/
  Cargo.toml
  src/
    lib.rs            -- public API
    main.rs           -- CLI entry point (clap)
    aseprite.rs       -- Aseprite file loading via asefile
    packer.rs         -- MaxRects atlas packing
    naming.rs         -- Sprite naming convention
    mirror.rs         -- Direction mirror generation (uses mge-mirror)
    toml_output.rs    -- Atlas + animation TOML output
    png_import.rs     -- PNG frame import with size-class presets
    aseprite_export.rs -- Aseprite .ase project file generation
    errors.rs         -- Error types
```

**Dependances** :
```toml
[dependencies]
asefile = "0.3"            # Aseprite binary file parser
rectangle-pack = "0.4"    # MaxRects bin packing
image = { workspace = true }
serde = { workspace = true }
toml = { workspace = true }
thiserror = { workspace = true }
clap = { version = "4.5", features = ["derive"] }
mge-mirror = { path = "../mge-mirror" }
mge-packer = { path = "../mge-packer" }
tracing = { workspace = true }
```

### 3.5 Nouveau fichier : `mge-render/src/sprite_instanced.wgsl`

Shader WGSL pour le rendu instance (voir section 6).

### 3.6 Nouveau module : `mge-render/src/text.rs`

| Element | Description |
|---------|-------------|
| `TtfFont` | Chargement TTF/OTF via fontdue, rasterisation a la demande |
| `GlyphMetrics` | Metriques de positionnement d'un glyphe (width, height, xmin, ymin, advance) |
| `GlyphKey` | Cle de cache : (font_index, char, quantized_size) |
| `CachedGlyph` | Entree cache : UV rect + metrics + texture layer |
| `GlyphCache` | Atlas GPU dynamique avec allocateur shelf-first |
| `FontId` | Handle opaque vers une police enregistree |
| `TextRenderer` | Remplacement de BitmapFont : multi-fonts, multi-sizes, glyph cache |

Fichier cible : `mge/crates/engine/mge-render/src/text.rs` (~450 lignes)

### 3.7 Nouveau module : `mge-render/src/overhead.rs`

| Element | Description |
|---------|-------------|
| `FloatingTextKind` | Enum des types de texte flottant (Damage, Critical, Evade, Block, Heal, Gathered, Success, Failure, Experience) |
| `FloatingText` | Element de texte flottant dans le monde (position, texte, kind, age, lifetime, y_offset, opacity) |
| `FloatingTextManager` | Gestionnaire des textes flottants actifs (spawn, tick, render, cap configurable) |
| `EmoteKind` | Enum des types d'emotes (Happy, Angry, Sad, Confused, Exclamation, Question, Heart, Sleep, Skull, Coin) |
| `SpriteEmote` | Emote sprite au-dessus d'une entite (position, kind, age, lifetime, opacity, bounce_offset) |
| `EmoteManager` | Gestionnaire des emotes actifs (spawn, tick, render, 1 emote/entite) |
| `OverheadProgressBar` | Barre de progression au-dessus d'une entite (position, progress, dimensions, couleurs, visibilite) |
| `ProgressBarManager` | Gestionnaire des barres de progression (set, remove, render en 2 quads couleur unie) |

Fichier cible : `mge/crates/engine/mge-render/src/overhead.rs` (~400 lignes)

---

## 4. Modifications crates existants

### 4.1 `mge-render` (mge/crates/engine/mge-render/)

#### 4.1.1 `src/lib.rs`

```
// Lignes a ajouter (apres ligne 23) :
pub mod animation;
pub mod culling;
pub mod instanced;
pub mod overhead;
pub mod text;

// Re-exports a ajouter (apres ligne 33) :
pub use animation::{
    AnimationBank, AnimationClip, AnimationController,
    AnimationState, Direction, FrameEvent, FrameEventKind,
};
pub use culling::{FrustumCuller, RenderEntity, RenderSpatialGrid};
pub use instanced::{
    InstanceData, InstancedSpriteBatcher, InstancedSpritePipeline, TextureArray,
};
pub use overhead::{
    FloatingText, FloatingTextKind, FloatingTextManager,
    EmoteKind, SpriteEmote, EmoteManager,
    OverheadProgressBar, ProgressBarManager,
};
pub use text::{
    FontId, GlyphCache, GlyphKey, GlyphMetrics, CachedGlyph, TextRenderer, TtfFont,
};
```

#### 4.1.2 `src/camera.rs`

Ajout de la methode `visible_rect()` a `Camera2D` (apres ligne 119) :

```rust
/// Return the screen-space AABB of the visible area.
pub fn visible_rect(&self) -> mge_math::Aabb {
    let half_w = (self.screen_w as f32 / self.zoom) / 2.0;
    let half_h = (self.screen_h as f32 / self.zoom) / 2.0;
    mge_math::Aabb::new(
        mge_math::Vec2::new(self.world_x - half_w, self.world_y - half_h),
        mge_math::Vec2::new(self.world_x + half_w, self.world_y + half_h),
    )
}
```

Ajout de la dependance `mge-math` dans `Cargo.toml` de `mge-render`.

#### 4.1.3 `src/atlas.rs`

Ajout d'un champ optionnel `animation_tag` a `AtlasFrame` (pour lier frame -> animation) :

```rust
/// Optional animation tag this frame belongs to.
#[serde(default)]
pub animation_tag: Option<String>,
```

Ajout d'une methode `get_uv_flipped` pour les directions miroir :

```rust
/// Return normalised UV coordinates with horizontal flip.
pub fn get_uv_flipped(&self, frame_name: &str) -> Option<[f32; 4]> {
    self.frames.get(frame_name).map(|f| {
        [
            (f.x + f.w) as f32 / self.width as f32,  // u_min = ancien u_max
            f.y as f32 / self.height as f32,
            f.x as f32 / self.width as f32,           // u_max = ancien u_min
            (f.y + f.h) as f32 / self.height as f32,
        ]
    })
}
```

#### 4.1.4 `src/sprite.rs`

Depreciation de `SpriteInstance` au profit de `InstanceData` (via attribut `#[deprecated]`). Conservation pour retrocompatibilite avec le feature flag `legacy-batcher`.

#### 4.1.5 `src/errors.rs`

Ajout de variantes d'erreur :

```rust
/// An animation clip was requested but not found.
#[error("animation not found: {entity} / {state:?} / {direction:?}")]
AnimationNotFound {
    entity: String,
    state: String,
    direction: String,
},

/// The texture array is full (max layers reached).
#[error("texture array full: max {max_layers} layers")]
TextureArrayFull {
    max_layers: u32,
},

/// The storage buffer is full (max instances reached).
#[error("instance buffer full: max {max_instances} instances")]
InstanceBufferFull {
    max_instances: u32,
},

/// A TTF/OTF font failed to load.
#[error("font load failed: {name}: {reason}")]
FontLoadFailed {
    name: String,
    reason: String,
},

/// The glyph atlas is full (no space for new glyphs).
#[error("glyph atlas full: {width}x{height}, {cached_count} glyphs cached")]
GlyphAtlasFull {
    width: u32,
    height: u32,
    cached_count: usize,
},
```

#### 4.1.6 `Cargo.toml`

```toml
[dependencies]
# Ajout:
mge-math = { path = "../../kernel/mge-math" }

[features]
default = ["dual-res", "instanced"]
dual-res = []
post-process = []
instanced = []               # Nouveau: active le pipeline instanced
legacy-batcher = []           # Nouveau: conserve l'ancien SpriteBatcher
```

### 4.2 `sodomight-client` (mge/games/sodomight-client/)

#### 4.2.1 `src/game.rs`

**Modifications majeures** :

1. Remplacer `GpuResources` pour utiliser `InstancedSpritePipeline` + `InstancedSpriteBatcher` au lieu de `SpritePipeline` + `SpriteBatcher`
2. Remplacer les ~10 render passes par un seul draw call instance
3. Utiliser `FrustumCuller` au lieu du culling inline dans `batch_tiles()`, `batch_monsters_for_texture()`, etc.
4. Ajouter un `AnimationController` par entite dans le monde
5. Ticker les animations dans la boucle de frame

**Fichiers touches** :
- `src/game.rs` : ~500 lignes modifiees (rendering pipeline, on_init, on_frame)
- `src/d2_sprites.rs` : refactore pour utiliser `AnimationController` + `Direction`
- `src/lib.rs` : re-exports mis a jour

#### 4.2.2 `src/d2_sprites.rs`

Refactoring :
- Depreciation de l'enum `SpriteSize` existant au profit de celui dans `mge-render/animation.rs`
- Remplacement du chargement 1-texture-par-entite par le chargement d'atlas via `TextureArray`
- Conservation du mode fallback (placeholder statique) pour les entites sans atlas anime

### 4.3 `mge-math` (mge/crates/kernel/mge-math/)

Aucune modification structurelle. `Aabb` est deja importe par `mge-render` via la nouvelle dependance.

### 4.4 `mge-packer` (mge/tools/mge-packer/)

Enrichissement :
- Ajout d'un mode `MaxRects` en complement du mode `Shelf` existant
- Ajout d'un flag `--algorithm shelf|maxrects` dans le CLI (quand un `main.rs` sera ajoute)
- `mge-anim-pack` reutilise `mge-packer::AtlasPacker` en interne pour l'assemblage final

---

## 5. Formats de donnees

### 5.1 Atlas TOML (enrichi)

```toml
# atlas.toml -- genere par mge-anim-pack
# Compatible avec le format existant AtlasDescriptor

[[frames]]
name = "necro_idle_s_000"
x = 0
y = 0
w = 96
h = 192
animation_tag = "idle"

[[frames]]
name = "necro_idle_s_001"
x = 96
y = 0
w = 96
h = 192
animation_tag = "idle"

[[frames]]
name = "necro_walk_sw_000"
x = 192
y = 0
w = 96
h = 192
animation_tag = "walk"

# ... etc.
```

### 5.2 Animation TOML (nouveau)

```toml
# animations.toml -- genere par mge-anim-pack, consomme par AnimationBank

[meta]
entity = "necro"
sprite_size = "Humanoid"
directions_rendered = ["s", "sw", "w", "nw"]
directions_mirrored = ["n", "ne", "e", "se"]
atlas_id = "necro_atlas"

[[clips]]
state = "Idle"
direction = "S"
frame_count = 8
frame_duration = 0.12
looping = true
events = []

[[clips]]
state = "Walk"
direction = "SW"
frame_count = 12
frame_duration = 0.08
looping = true
events = []

[[clips]]
state = "Attack"
direction = "S"
frame_count = 16
frame_duration = 0.06
looping = false

[[clips.events]]
frame = 8
kind = { Damage = {} }

[[clips.events]]
frame = 8
kind = { Sfx = { id = "melee_swing" } }

[[clips]]
state = "Death"
direction = "S"
frame_count = 20
frame_duration = 0.08
looping = false
events = []
```

### 5.3 Format pivot (nouveau champ optionnel dans AtlasFrame)

Pour le layer compositing (hors scope Sprint 1 mais prevu dans la structure) :

```toml
[[frames]]
name = "necro_idle_s_000"
x = 0
y = 0
w = 96
h = 192
pivot_x = 48.0    # Centre horizontal du sprite
pivot_y = 176.0   # Pieds du personnage (point d'ancrage iso)
```

---

## 6. Shader WGSL

### 6.1 `sprite_instanced.wgsl` (nouveau)

```wgsl
// ---------------------------------------------------------------------------
// sprite_instanced.wgsl -- MGE Instanced Sprite Shader
// ---------------------------------------------------------------------------
//
// @id   sd-shader-sprite-instanced
// @do   render
// @role back-end
// @layer 2
// @human miyuk
//
// Renders textured sprite quads using GPU instancing.
// Each instance is a sprite with its own position, size, UV rect, tint,
// and texture array layer index.
//
// Bind group layout:
//   group(0) binding(0) -- CameraUniform (mat4x4<f32> view_proj)
//   group(0) binding(1) -- InstanceBuffer (storage, array<InstanceData>)
//   group(1) binding(0) -- texture_2d_array (all atlas layers)
//   group(1) binding(1) -- sampler
// ---------------------------------------------------------------------------

struct CameraUniform {
    view_proj: mat4x4<f32>,
};

struct InstanceData {
    position: vec2<f32>,
    size: vec2<f32>,
    uv_rect: vec4<f32>,    // [u_min, v_min, u_max, v_max]
    tint: vec4<f32>,
    texture_index: u32,
    z_depth: f32,
    _pad: vec2<f32>,
};

@group(0) @binding(0)
var<uniform> camera: CameraUniform;

@group(0) @binding(1)
var<storage, read> instances: array<InstanceData>;

@group(1) @binding(0)
var sprite_textures: texture_2d_array<f32>;

@group(1) @binding(1)
var sprite_sampler: sampler;

// Unit quad vertices (2 triangles, CCW):
// 0: (0,0)  1: (1,0)  2: (1,1)  3: (0,1)
// Indices: 0,1,2, 2,3,0

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) tint: vec4<f32>,
    @location(2) @interpolate(flat) tex_index: u32,
};

@vertex
fn vs_main(
    @builtin(vertex_index) vertex_id: u32,
    @builtin(instance_index) instance_id: u32,
) -> VertexOutput {
    // Unit quad corners.
    let corners = array<vec2<f32>, 4>(
        vec2<f32>(0.0, 0.0),  // top-left
        vec2<f32>(1.0, 0.0),  // top-right
        vec2<f32>(1.0, 1.0),  // bottom-right
        vec2<f32>(0.0, 1.0),  // bottom-left
    );

    let inst = instances[instance_id];
    let corner = corners[vertex_id];

    // Scale unit quad by sprite size and offset by position.
    let screen_pos = inst.position + corner * inst.size;

    var out: VertexOutput;
    out.clip_position = camera.view_proj * vec4<f32>(screen_pos, inst.z_depth, 1.0);

    // Interpolate UVs within the instance's UV rect.
    let uv_min = inst.uv_rect.xy;
    let uv_max = inst.uv_rect.zw;
    out.uv = mix(uv_min, uv_max, corner);

    out.tint = inst.tint;
    out.tex_index = inst.texture_index;

    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let tex_color = textureSample(
        sprite_textures,
        sprite_sampler,
        in.uv,
        in.tex_index
    );

    let final_color = tex_color * in.tint;

    if final_color.a < 0.01 {
        discard;
    }

    return final_color;
}
```

### 6.2 Modifications au shader existant `sprite.wgsl`

**Aucune modification.** L'ancien shader est conserve pour le feature flag `legacy-batcher`. Il reste fonctionnel et inchange.

### 6.3 Vertex buffer et index buffer pour le pipeline instanced

Le pipeline instanced n'utilise PAS de vertex buffer lie. Les 4 coins du quad unitaire sont generes dans le vertex shader via `@builtin(vertex_index)`. L'index buffer reste statique (6 indices : 0,1,2, 2,3,0).

---

## 7. Dependances nouvelles

### 7.1 Ajouts au workspace

| Crate | Version | Usage | Justification |
|-------|---------|-------|---------------|
| `fontdue` | `0.9` | Rasterisation TTF/OTF pour le rendu texte in-game | Pur Rust, no_std possible, rasterizer le plus rapide disponible. Support TTF/TTC/OTF. Zero dep graphique, s'integre naturellement au pipeline instanced via alpha bitmaps. Runtime du jeu. [Audite : crate stable, API rasterisation figee, 1.5M+ downloads] |
| `asefile` | `0.3` | Lecture binaire fichiers `.ase` | Parser natif Aseprite sans export JSON. Pas de dep runtime (outil CLI uniquement). [Audite : crate stable, derniere release compatible Aseprite 1.3+] |
| `rectangle-pack` | `0.4` | MaxRects bin packing pour atlas | Algorithme deterministe de reference. Zero dep, pure Rust. [Audite : 280k downloads, no_std compatible] |
| `clap` | `4.5` | CLI argument parsing pour `mge-anim-pack` | Standard Rust CLI. Outil uniquement, pas dans le runtime du jeu. |

### 7.2 Ajouts par crate

- `mge-render/Cargo.toml` : `mge-math = { path = "../../kernel/mge-math" }`, `fontdue = "0.9"`
- `mge-anim-pack/Cargo.toml` : `asefile`, `rectangle-pack`, `clap`, `mge-mirror`, `mge-packer`

### 7.3 Dependances NON ajoutees (decisions explicites)

| Crate rejete | Raison |
|-------------|--------|
| `guillotiere` | Atlas packer alternatif, mais `rectangle-pack` est plus leger et deterministe |
| `bevy_aseprite_reader` | Couple a Bevy, pas pertinent pour notre stack |
| `aseprite-loader` | Zero-copy mais API moins ergonomique que `asefile` |
| `lyon` | Tessellation, hors scope (nous n'avons pas de geometrie vectorielle) |
| `cosmic-text` | Full text layout engine (shaping, BiDi, line breaking). Trop lourd pour du rendu texte de jeu. fontdue suffit pour le latin. |
| `glyphon` | Rendu texte natif wgpu avec cache GPU integre. Couple a wgpu et impose son propre pipeline de rendu. On prefere l'integration manuelle dans notre pipeline instanced. |
| `ab_glyph` | Parsing/positioning TrueType (utilise par egui). API moins directe que fontdue pour la rasterisation brute dont on a besoin. |

---

## 8. Tests requis

### 8.1 Tests unitaires -- `mge-render`

#### `animation.rs` (12 tests)

| Test | Description |
|------|-------------|
| `direction_mirror_source_rendered` | Les 4 directions rendues retournent `(self, false)` |
| `direction_mirror_source_mirrored` | NE retourne (SW, true), E retourne (W, true), SE retourne (NW, true) |
| `direction_from_velocity_cardinals` | Velocity (0,-1) -> N, (1,0) -> E, etc. |
| `direction_from_velocity_diagonals` | Velocity (1,-1) -> NE, (-1,1) -> SW, etc. |
| `animation_controller_init_state` | Nouveau controller : state=Idle, dir=S, frame=0 |
| `animation_controller_set_state_resets_frame` | Changement de state remet frame_index a 0 |
| `animation_controller_tick_advances_frame` | Tick avec dt > frame_duration avance le frame |
| `animation_controller_loop_wraps` | Animation looping revient a frame 0 apres la derniere |
| `animation_controller_oneshot_stops` | Animation non-looping met finished=true apres la derniere |
| `animation_controller_frame_name_format` | Verifie le format "{entity}_{state}_{dir}_{frame:03d}" |
| `animation_bank_load_toml` | Charge un TOML minimal et retrouve un clip |
| `animation_bank_missing_clip` | Retourne None pour un clip inexistant |

#### `instanced.rs` (8 tests)

| Test | Description |
|------|-------------|
| `instance_data_size_is_64_bytes` | `size_of::<InstanceData>() == 64` |
| `instance_data_is_pod` | `bytemuck::cast_slice` fonctionne sur InstanceData |
| `instanced_batcher_push_and_count` | Push 100 instances, count == 100 |
| `instanced_batcher_clear` | Clear remet le count a 0 |
| `instanced_batcher_capacity_limit` | Push au-dela de max_instances est silencieux |
| `instanced_batcher_sort_by_depth` | Les instances sont triees par z_depth |
| `instanced_batcher_sort_by_layer_then_depth` | Layer primaire, z_depth secondaire |
| `texture_array_layer_assignment` | Insertion de 3 textures donne les indices 0, 1, 2 |

#### `culling.rs` (6 tests)

| Test | Description |
|------|-------------|
| `render_spatial_grid_insert_and_query` | Insert entite, query AABB englobant la retrouve |
| `render_spatial_grid_empty_query` | Query sur zone vide retourne vide |
| `render_spatial_grid_clear` | Clear puis query retourne vide |
| `render_spatial_grid_multi_cell_entity` | Entite large inseree dans 4 cellules, query la retrouve |
| `frustum_culler_filters_offscreen` | Entites hors visible_rect exclues |
| `frustum_culler_dedup` | Entite dans 2 cellules n'apparait qu'une fois |

#### `text.rs` (11 tests)

| Test | Description |
|------|-------------|
| `ttf_font_load_valid` | Charge un fichier TTF valide depuis `mge/assets/fonts/DigitalDisco.ttf`, pas d'erreur |
| `ttf_font_load_invalid_bytes` | Passer des bytes invalides retourne `RenderError::FontLoadFailed` |
| `ttf_font_rasterize_ascii` | Rasteriser 'A' a 24px retourne un bitmap non-vide avec width/height > 0 |
| `ttf_font_rasterize_accented` | Rasteriser 'e' (U+00E9) retourne un bitmap valide (test latin etendu) |
| `ttf_font_metrics_advance_positive` | `advance_width` de 'A' a 24px est > 0.0 |
| `glyph_cache_insert_and_retrieve` | Inserer un glyphe puis le retrouver par la meme cle |
| `glyph_cache_dedup` | Inserer le meme glyphe 2 fois ne cree qu'une entree (len == 1) |
| `glyph_cache_dirty_flag` | Cache neuf : not dirty. Apres insert : dirty. Apres take_atlas : not dirty. |
| `glyph_cache_clear` | Clear vide le cache (len == 0) et marque dirty |
| `text_renderer_measure_width` | `measure_width("Hello", font, 24.0)` retourne une largeur > 0.0 et coherente avec 5 * advance |
| `text_renderer_multi_font` | Enregistrer 2 polices, mesurer avec chacune, les largeurs sont differentes |

#### `overhead.rs` (7 tests)

| Test | Description |
|------|-------------|
| `floating_text_spawn_and_tick` | Spawn un texte flottant, tick a la moitie du lifetime, verifier que y_offset > 0 et opacity < 1.0 |
| `floating_text_removal_after_lifetime` | Tick au-dela du lifetime, verifier que le texte est supprime |
| `floating_text_critical_shake` | Verifier que le kind Critical produit un shake horizontal (offset x != 0 durant l'animation) |
| `emote_spawn_and_bounce` | Spawn un emote, verifier que bounce_offset varie au cours du tick |
| `emote_replaces_existing` | Spawn 2 emotes a la meme position, verifier qu'un seul existe |
| `progress_bar_set_and_remove` | Set progress, mettre a jour a 0.5, remove, verifier la suppression |
| `floating_text_stacking` | Spawn 3 textes a la meme position, verifier le decalage vertical (stacking) |

#### `camera.rs` (2 tests additionnels)

| Test | Description |
|------|-------------|
| `camera_visible_rect_at_zoom_1` | visible_rect couvre (cam-hw, cam-hh) a (cam+hw, cam+hh) |
| `camera_visible_rect_at_zoom_2` | visible_rect couvre moitie de la taille a zoom 2 |

### 8.2 Tests unitaires -- `mge-anim-pack`

| Test | Description |
|------|-------------|
| `tag_to_state_mapping` | Verifie tous les mappings connus (idle, walk, attack...) |
| `tag_to_state_unknown` | Tag inconnu retourne None |
| `naming_convention_format` | Verifie le format de sortie pour differents inputs |
| `mirror_generation_ne_from_sw` | Direction NE generee par flip horizontal de SW |
| `toml_output_roundtrip` | Genere TOML, reparse, compare structure |
| `maxrects_pack_basic` | Packe 10 frames 64x64, verifie no-overlap |
| `aseprite_tag_extraction` | Charge un .ase minimal, extrait les tags |
| `validate_atlas_passes` | Atlas conforme aux normes passe la validation |
| `validate_atlas_fails_missing_direction` | Atlas sans direction SW echoue |

### 8.3 Tests d'integration

| Test | Crate | Description |
|------|-------|-------------|
| `integration_animation_pipeline` | `mge-render` | Cree AnimationBank + Controller, tick 10 frames, verifie frames names |
| `integration_culling_pipeline` | `mge-render` | Camera + SpatialGrid + 100 entites, verifie que seules les visibles sont retournees |
| `integration_anim_pack_roundtrip` | `mge-anim-pack` | Frames PNG -> pack -> output TOML -> reparse -> validate |
| `integration_text_renderer_pipeline` | `mge-render` | Charge 2 polices TTF, rasterise "Hello e a c" en 2 tailles (16px, 32px), verifie glyph_cache.len() > 0, verifie atlas non-vide, mesure largeur coherente |

---

## 9. Verification documentaire

### 9.1 wgpu 24.0

**Source** : [wgpu.rs](https://wgpu.rs/), [Learn wgpu - Instancing](https://sotrh.github.io/learn-wgpu/beginner/tutorial7-instancing/), [wgpu Discussion #2577](https://github.com/gfx-rs/wgpu/discussions/2577)

**Points verifies** :
- Storage buffers : `BufferUsages::STORAGE`, bind type `wgpu::BindingType::Buffer { ty: BufferBindingType::Storage { read_only: true } }`. Supporte sur tous les backends.
- Texture 2D array : `wgpu::TextureViewDimension::D2Array`, `texture_2d_array<f32>` en WGSL. Necessite que toutes les layers aient les memes dimensions.
- Instanced draw : `draw_indexed(indices, base_vertex, instances)` ou `instances` est un `Range<u32>`.
- `@builtin(instance_index)` en WGSL pour indexer le storage buffer.
- `@builtin(vertex_index)` en WGSL pour generer les coins du quad.
- Feature `TEXTURE_BINDING_ARRAY` necessaire pour les tableaux de textures (binding array). **Attention** : ce n'est PAS la meme chose que `texture_2d_array` (qui est nativement supporte). `texture_2d_array` est un seul objet texture avec plusieurs layers, pas un array de bindings.

**Breaking changes** : wgpu 24.0 a renomme `ImageCopyTexture` en `TexelCopyTextureInfo` et `ImageDataLayout` en `TexelCopyBufferLayout`. Le code existant dans `pipeline.rs` (lignes 362-375) utilise deja les noms corrects.

**Decision** : Utiliser `texture_2d_array` (pas `TEXTURE_BINDING_ARRAY`) car :
1. Nativement supporte sur tous les backends sans feature flag
2. Toutes nos textures atlas ont la meme dimension (max 2048x2048 ou 4096x4096)
3. Plus simple cote shader (une seule variable, index par layer)

**Contrainte** : Toutes les layers de la texture array doivent avoir les memes dimensions (width, height). Les atlas de tailles differentes seront paddes au maximum commun.

### 9.2 asefile 0.3

**Source** : [docs.rs/asefile](https://docs.rs/asefile/latest/asefile/), [crates.io/asefile](https://crates.io/crates/asefile)

**Points verifies** :
- `AsepriteFile::read_file(path)` ou `::read(reader)` pour charger un `.ase`
- `file.num_frames()`, `file.width()`, `file.height()`
- `file.layer(index)` pour acceder aux layers, `layer.name()` pour le nom
- `file.tags()` pour les tags d'animation, `tag.name()`, `tag.from_frame()`, `tag.to_frame()`
- `file.frame(index).image()` pour obtenir le `RgbaImage` d'une frame composite
- `file.layer(idx).cel(frame_idx)` pour un cel specifique
- Support des user data (`layer.user_data()`, `tag.user_data()`)

**Pas de breaking changes** connus entre 0.3.x.

### 9.3 rectangle-pack 0.4

**Source** : [docs.rs/rectangle-pack](https://lib.rs/crates/rectangle-pack), [crates.io/rectangle-pack](https://crates.io/crates/rectangle-pack)

**Points verifies** :
- API : `pack_rects(bins, rects)` retourne un mapping rect_id -> (bin_id, location)
- Deterministe : meme input = meme output
- No-std compatible
- Supporte plusieurs bins (multi-atlas si un seul atlas ne suffit pas)

### 9.4 fontdue 0.9

**Source** : [docs.rs/fontdue](https://docs.rs/fontdue/latest/fontdue/), [GitHub mooman219/fontdue](https://github.com/mooman219/fontdue), [crates.io/fontdue](https://crates.io/crates/fontdue)

**Points verifies** :
- `Font::from_bytes(data: &[u8], settings: FontSettings) -> Result<Font, &'static str>` pour charger une police
- `font.rasterize(character: char, px: f32) -> (Metrics, Vec<u8>)` pour rasteriser un glyphe
- `font.metrics(character: char, px: f32) -> Metrics` pour les metriques sans rasterisation
- `Metrics` : champs `xmin: i32`, `ymin: i32`, `width: usize`, `height: usize`, `advance_width: f32`, `advance_height: f32`, `bounds: OutlineBounds`
- `FontSettings::default()` pour la configuration standard (pas de scale explicite, units = px/Em)
- `Font` est `Send + Sync` (thread-safe)
- Le bitmap retourne par `rasterize()` est un coverage alpha mono-canal : `Vec<u8>` ou 0 = transparent, 255 = opaque, taille = `width * height`
- Support natif TTF (.ttf/.ttc) et OpenType (.otf) via la dep interne `ttf-parser`
- `no_std` compatible (pas de dep sur `std` sauf pour les allocations)
- Pas de text shaping (pas de support arabe/hindi/thai) -- suffisant pour le latin

**Pas de breaking changes** dans l'API rasterisation entre versions 0.7-0.9. L'API layout est immature mais nous ne l'utilisons pas (nous gerons le layout nous-memes dans `TextRenderer`).

**Decision** : Utiliser uniquement l'API rasterisation (`Font::from_bytes`, `rasterize`, `metrics`). Ne PAS utiliser l'API `Layout` de fontdue (immature, breaking changes possibles). Notre `TextRenderer` gere le layout horizontalement (avance glyphe par glyphe via `advance_width`).

### 9.5 Anti-patterns verifies

**Source** : MEMORY.md (lu en debut d'exploration)

| Anti-pattern | Statut |
|-------------|--------|
| `unwrap()` en production | CONFIRME EVITE : tous les nouveaux types utilisent `Result<>` avec `RenderError` |
| Nested braces RSX | N/A : pas de RSX dans mge-render |
| `spawn_blocking` pour SQLite | N/A : pas de SQLite dans mge-render |
| URL externe en dur | CONFIRME EVITE : aucune URL dans le code |
| Passphrase par defaut | N/A |
| `serde(default)` retrocompat | CONFIRME APPLIQUE : tous les nouveaux champs TOML ont `#[serde(default)]` |

**Fichier `memory/mip-antipatterns.md`** : Non trouve (le fichier n'existe pas encore). Aucun anti-pattern supplementaire a signaler.

---

## 10. Risques techniques

### R-01 : Texture array dimension constraint (MOYEN)

**Risque** : Toutes les layers d'une `texture_2d_array` doivent avoir la meme taille. Si differentes entites ont des atlas de tailles tres differentes (boss 4096x4096 vs critter 512x512), il faut padder au maximum, gaspillant de la VRAM.

**Mitigation** : Regrouper les atlas par classe de taille. 2-3 texture arrays (small=1024x1024, medium=2048x2048, large=4096x4096) au lieu d'une seule. Chaque array a son propre draw call instanced. Resultat : 2-3 draw calls au lieu de ~10 render passes actuels.

### R-02 : Storage buffer alignment (FAIBLE)

**Risque** : Les storage buffers WGSL requierent un alignement de 16 bytes par element. Si `InstanceData` n'est pas aligne correctement, les donnees seront corrompues sur le GPU.

**Mitigation** : `InstanceData` est defini a 64 bytes (16 x f32) avec 2 floats de padding. Teste via `assert_eq!(size_of::<InstanceData>(), 64)`.

### R-03 : Performance regression pendant la migration (MOYEN)

**Risque** : Pendant la phase de transition, le code sodomight-client devra supporter les deux pipelines (legacy et instanced). La complexite temporaire peut introduire des bugs.

**Mitigation** : Feature flags (`instanced` et `legacy-batcher`). Le flag `instanced` est le defaut. Si regression, on bascule sur `legacy-batcher` sans modifier le code.

### R-04 : Aseprite file format changes (FAIBLE)

**Risque** : Aseprite pourrait changer son format binaire dans une future version, cassant `asefile`.

**Mitigation** : `asefile` est uniquement utilise dans l'outil CLI `mge-anim-pack`, pas dans le runtime du jeu. Les fichiers `.ase` sont des inputs de l'outil ; le jeu consomme les outputs (PNG + TOML). Si `asefile` casse, on peut exporter via JSON en fallback.

### R-05 : VRAM budget (MOYEN)

**Risque** : Avec toutes les directions x etats x entites, le volume de textures peut exploser. Un atlas 4096x4096 RGBA = 64 MB. 10 layers = 640 MB.

**Mitigation** :
1. Sprites pixel-art a taille D2 (~96x192 humanoid) compriment bien dans un atlas
2. Compression GPU (BC7/ASTC) envisageable en Sprint 2+ si necessaire
3. Budget cible Sprint 1 : 4 entites animees x 5 states x 4 directions x 16 frames = 1280 frames. A 96x192 = 18 432 bytes/frame, total brut ~23 MB. Compactable dans 2-3 atlas 2048x2048.

### R-06 : Glyph atlas saturation (FAIBLE)

**Risque** : Si le jeu affiche un tres grand nombre de caracteres distincts a de nombreuses tailles differentes (ex: 100 caracteres x 10 tailles = 1000 glyphes), l'atlas de glyphes (1024x1024) pourrait se remplir.

**Mitigation** :
1. La quantification de taille (arrondi a 0.5px) reduit le nombre de variantes
2. En pratique, un jeu D2-like utilise ~3 polices, ~3 tailles, ~200 caracteres = ~1800 glyphes max, ce qui tient aisement dans un atlas 1024x1024 (glyphes moyens ~20x20px = 400 bytes, 1800 glyphes = ~720 000 px, atlas = 1 048 576 px)
3. En cas de saturation, `GlyphCache::clear()` peut vider et reconstruire le cache
4. L'atlas peut etre agrandi a 2048x2048 sans impact de performance

### R-07 : Direction Nord distincte (FAIBLE)

**Risque** : La direction N (dos du personnage) n'est pas un simple miroir de S dans D2. Utiliser S comme fallback pour N donne un rendu incorrect.

**Mitigation** : Documente comme limitation MVP. Les assets finaux devront fournir N comme 5eme direction rendue. La structure `Direction::mirror_source()` est facilement modifiable pour ajouter N comme direction rendue.

### R-08 : Overhead UI performance avec 500+ entites (MOYEN)

**Risque** : Avec 500+ entites dans Allumina, les floating texts + emotes + progress bars pourraient generer beaucoup d'instances supplementaires dans le storage buffer, impactant la performance du draw call instanced.

**Mitigation** :
1. `FloatingTextManager`, `EmoteManager` et `ProgressBarManager` ont un cap configurable (defaut : 100 textes flottants, 50 emotes, 200 progress bars). Au-dela du cap, les plus anciens elements sont supprimes.
2. Le culling frustum s'applique aussi aux overhead elements : seuls ceux dans le `visible_rect()` elargi sont pushes dans le batcher.
3. Animation LOD : les overhead UI sont desactivees pour les entites distantes (LOD Minimal/Static dans la grille spatiale).

---

## 11. Conformite architecturale

### Checklist

- [x] **LOI-1** : Aucune dependance externe critique a l'execution. `asefile` et `rectangle-pack` sont des outils CLI, pas du runtime.
- [x] **LOI-2** : Isolement normal. Le renderer fonctionne sans reseau.
- [x] **LOI-3** : Etat local souverain. Toutes les textures et animations sont des assets locaux.
- [x] **LOI-5** : Cout proportionnel au hardware. Le storage buffer et la texture array s'adaptent a la VRAM disponible.
- [x] **LOI-7** : Strate Cores immuable. Aucune modification des Cores (Strate 4).
- [x] `unsafe_code = "forbid"` dans tout nouveau Cargo.toml
- [x] Strate correcte : `mge-render` = Couche 2 Engine, `mge-anim-pack` = Outil
- [x] Annotations MSCM planifiees :
  - `animation.rs` : `@id: MGE-Render-Animation @do: implement @role: back-end @layer: 2`
  - `instanced.rs` : `@id: MGE-Render-Instanced @do: implement @role: back-end @layer: 2`
  - `culling.rs` : `@id: MGE-Render-Culling @do: implement @role: back-end @layer: 2`
  - `text.rs` : `@id: MGE-Render-Text @do: implement @role: back-end @layer: 2`
  - `overhead.rs` : `@id: MGE-Render-Overhead @do: implement @role: back-end @layer: 2`
  - `mge-anim-pack` : `@id: MGE-AnimPack @do: tool @role: back-end @layer: 6`
- [x] Versions des dependances a jour (wgpu 24.0, image 0.25, bytemuck 1.16)
- [x] Pas de `unwrap()` en production
- [x] Types d'erreur explicites (`RenderError`)
- [x] UUIDs v4 pour les IDs (si applicable)
- [x] `#[serde(default)]` sur tous les nouveaux champs optionnels

### Pyramide COG

```
Strate 1 (Kernel)  : mge-math (Aabb utilise par culling)
Strate 2 (Engine)  : mge-render (animation, instanced, culling) <-- MODIFIE
Strate 4 (Game)    : sodomight-client <-- CONSOMMATEUR
Strate 6 (Outils)  : mge-anim-pack <-- NOUVEAU
                      mge-packer, mge-mirror <-- REUTILISES
```

---

## Annexe A : Estimation de charge

| Module | Fichiers | Lignes estimees | Complexite |
|--------|----------|----------------|------------|
| `animation.rs` | 1 | ~350 | Moyenne |
| `instanced.rs` | 1 | ~500 | Haute |
| `culling.rs` | 1 | ~200 | Faible |
| `text.rs` | 1 | ~450 | Moyenne |
| `overhead.rs` | 1 | ~400 | Moyenne |
| `sprite_instanced.wgsl` | 1 | ~100 | Moyenne |
| Modifications camera.rs | 1 | ~30 | Faible |
| Modifications atlas.rs | 1 | ~40 | Faible |
| Modifications errors.rs | 1 | ~30 | Faible |
| Modifications lib.rs | 1 | ~20 | Faible |
| `mge-anim-pack` complet | 10 | ~1150 | Haute |
| -- dont `png_import.rs` | (1) | (~200) | Moyenne |
| -- dont `aseprite_export.rs` | (1) | (~150) | Moyenne |
| Modifications sodomight-client | 3 | ~500 | Haute |
| Tests unitaires | 7 | ~1000 | Moyenne |
| Tests integration | 4 | ~250 | Moyenne |
| **Total** | **33** | **~4820** | -- |

## Annexe B : Ordre d'implementation recommande

Les taches sont independantes par sprint et peuvent etre executees en parallele entre Sprint 0 et Sprint 1 :

**Sprint 0 (fondations rendering)** :
1. `InstanceData` struct + tests bytemuck
2. `sprite_instanced.wgsl` shader
3. `InstancedSpriteBatcher` (CPU-side staging)
4. `InstancedSpritePipeline` (pipeline wgpu + bind groups)
5. `TextureArray` (texture_2d_array creation + layer management)
6. `Camera2D::visible_rect()`
7. `RenderSpatialGrid` + `FrustumCuller`
8. Integration sodomight-client (remplacer les render passes)
9. Feature flags `instanced` / `legacy-batcher`

**Sprint 1 (animation + normes)** :
1. `AnimationState` + `Direction` enums + tests
2. `AnimationClip` + `FrameEvent` structs
3. `AnimationBank` (chargement TOML)
4. `AnimationController` (FSM tick)
5. `mge-anim-pack` : structure crate + CLI clap
6. `mge-anim-pack` : aseprite loader (asefile)
7. `mge-anim-pack` : MaxRects packer
8. `mge-anim-pack` : mirror generator + naming convention
9. `mge-anim-pack` : TOML output (atlas + animations)
10. Integration sodomight-client (AnimationController par entite)

---

---

## 12. Changelog

| Date | Modification | Auteur |
|------|-------------|--------|
| 2026-03-02 | Version initiale de la spec | Francois |
| 2026-03-02 | Ajout section 2.7 Systeme de polices TTF/OTF (fontdue), module text.rs, struct TtfFont/GlyphCache/TextRenderer, 11 tests, dependance fontdue 0.9, risque R-06, estimation +715 lignes | Francois |
| 2026-03-02 | Ajout commande `import-png` a mge-anim-pack (section 2.6.1, fichiers png_import.rs + aseprite_export.rs). Ajout section 2.8 World-Space Overhead UI : FloatingText RO-style (2.8.1), Emotes sprite (2.8.2), OverheadProgressBar (2.8.3). Nouveau module overhead.rs (section 3.7). 7 tests overhead, risque R-08, estimation +750 lignes | Francois |

---

*Spec redigee par Francois -- P0 Temps 4*
*En attente de review Denis (P0 Temps 5) et approbation utilisateur (Gate P0)*
