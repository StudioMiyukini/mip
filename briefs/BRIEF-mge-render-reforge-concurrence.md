# P0-T3 : Analyse Concurrentielle -- Moteurs 2D & Sprite Systems

**Agent** : Fabrice (Analyste PR)
**Date** : 2026-03-02
**Chantier** : T5 -- Reforge moteur graphique MGE
**Cibles** : Sodomight (D2 clone, 8 joueurs) + Allumina (MMO-ARPG, 500+ entites)

---

## Contexte : Etat actuel du renderer MGE

Avant de plonger dans l'analyse concurrentielle, voici un diagnostic de l'existant pour mesurer le delta.

**Ce qui existe (mge-render) :**
- `SpriteInstance` : struct CPU-side avec position, UV, tint, layer (6 layers : Ground/Shadow/Unit/Effect/Overlay/Hud)
- `SpriteBatch` / `SpriteRenderer` : batching par layer, tri par profondeur (painter's algorithm)
- `SpriteBatcher` : pipeline wgpu fonctionnel avec vertex buffer dynamique, index buffer statique, quads (4 vertices, 6 indices par sprite)
- `SpritePipeline` : shader WGSL, bind group camera (mat4 ortho) + bind group texture + sampler
- `GpuTexture` : upload image RGBA vers GPU, bind group pre-construit
- `Camera2D` : projection isometrique dimetric 2:1 (64x32), smooth follow, bounds clamping
- `TextureAtlas` / `AtlasRegistry` : descripteur TOML, lookup par nom de frame, UV normalises
- `RenderConfig` : max_sprites = 16 384

**Ce qui manque (identifie) :**
- Pas de systeme d'animation (state machine, transitions, frame timing)
- Pas de support Aseprite natif (tags, layers, cels)
- Pas de support TexturePacker JSON
- Pas d'instanced rendering (chaque sprite = 4 vertices reconstruits par frame)
- Pas de texture array (1 bind group = 1 texture, 1 draw call par atlas)
- Pas de spatial partitioning / culling
- Pas de LOD / entity streaming
- 16 384 sprites max (insuffisant pour 500+ entites avec effets)
- Pas de skeleton animation

---

## 1. Systemes d'animation sprite (etat de l'art)

### 1.1 Formats d'animation

#### Aseprite (.ase / .aseprite) -- Standard industrie pixel art

Le format binaire Aseprite (spec v1.3) est le standard de facto pour le pixel art anime. Structure :

| Donnee | Description | Interet MGE |
|--------|-------------|-------------|
| Frames | Duree individuelle par frame (ms), override du header | Timing precis par animation |
| Layers | Hierarchie parent/enfant, blend modes, opacite | Compositing D2 (corps/arme/bouclier) |
| Cels | Image par frame+layer, position, compression ZLIB | Acces direct aux sprites individuels |
| Tags | Sequences nommees (idle, walk, attack), direction de boucle, repeat count | State machine directe |
| Slices | Regions decoupees, pivot points, 9-patch | Hitboxes, points d'ancrage |
| User Data | Proprietes custom par cel/layer/tag | Metadata jeu (damage frames, SFX triggers) |
| Tilesets | Definitions de tileset avec dimensions | Support natif maps |

**Crates Rust disponibles :**

| Crate | Type | Features | Maintenance |
|-------|------|----------|-------------|
| `asefile` | Parser binaire natif | Layers, frames, cels, tags, tilesets, slices, user data. Retourne `RgbaImage`. | Active, complet |
| `aseprite-loader` | Parser zero-copy | Spec-compliant, pas de dep `image` | Active |
| `mabel-aseprite` | Parser binaire | Similaire a asefile | Moins populaire |
| `ggez/aseprite` | Parser JSON export | Necessite export prealable | Legacy |

**Recommandation** : `asefile` est le choix optimal. Lecture directe du binaire, pas besoin d'exporter en JSON depuis Aseprite. Donne acces a toute la metadata (tags = animations nommees, cels = frames composites, user data = triggers de jeu).

#### TexturePacker JSON (Array / Hash)

TexturePacker exporte en deux formats JSON :
- **JSON Array** : frames dans un tableau ordonne
- **JSON Hash** : frames dans un objet (lookup par nom)

Les deux contiennent : nom de frame, rectangle source (x, y, w, h), trim info (offset, taille originale), pivot, rotation optionnelle.

**Animation automatique** : TexturePacker detecte les sprites avec le meme nom de base + suffixe numerique (ex: `walk_001`, `walk_002`, `walk_003`) et les regroupe en animation nommee `walk` dans le fichier de donnees.

**Interet MGE** : Beaucoup de packs d'assets itch.io sont au format TexturePacker JSON. Le support est necessaire pour le pipeline d'import. Cependant, pour la production interne, Aseprite natif est superieur (plus de metadata).

#### Spine 2D (skeletal animation)

Spine est le leader de l'animation squelettique 2D. Il utilise des bones, meshes, IK constraints, et animations par keyframe.

**Runtimes Rust :**
- `spine2d` (crates.io) : Runtime pur Rust non-officiel pour Spine 4.3
- `spine-c` : Runtime C officiel avec FFI Rust possible

**Licensing** : Les utilisateurs du jeu n'ont PAS besoin d'une licence Spine, mais le dev oui (69$/an Essential, 339$/an Professional). Le runtime est gratuit.

**Pertinence pour MGE** : Faible pour Sodomight (D2 est 100% sprite-based, pas de skeletal), mais potentiellement utile pour Allumina si le style artistique evolue. **Ne pas integrer maintenant.**

#### DragonBones (open source alternative)

DragonBones est une alternative open-source a Spine. Support de mesh deformation, animation squelettique, compatible Cocos2d-x, Unity, LayaAir. Le runtime est open-source, mais l'editeur n'est pas veritablement open-source.

**Pertinence pour MGE** : Comme Spine, peu pertinent pour le style D2 sprite-based. A reclasser si Allumina adopte un style anime different.

### 1.2 State machines d'animation

L'etat de l'art converge sur un **FSM (Finite State Machine)** pour gerer les transitions :

```
Idle <-> Walk <-> Run
  |        |
  v        v
Attack   Attack
  |        |
  v        v
Idle     Walk

+ Hit -> HitRecover -> Idle/Walk
+ Death (terminal)
+ Cast -> CastRecover -> Idle
+ Block -> BlockRecover -> Idle
```

**Principes cles (consensus industrie) :**

1. **Etats discrets** : Chaque entite est dans exactement un etat d'animation a la fois
2. **Transitions explicites** : Conditions de transition definies (input, timer, evenement)
3. **Pas de blending 2D** : Contrairement a la 3D, le blending n'a pas de sens en 2D sprite -- on switche immediatement d'une frame a l'autre
4. **Exit Time** : Les animations d'attaque/cast jouent jusqu'au bout avant de transitionner (pas d'interruption sauf hit/death)
5. **Directions** : L'etat combine action + direction (walk_north, walk_ne, etc.)
6. **Events** : Certaines frames declenchent des evenements (frame 5 de l'attaque = damage, frame 3 = son)

**Reference D2 specifique :**

Diablo 2 utilise 16 directions pour les entites, avec 3 movesets par classe :
- 1H weapon (avec/sans bouclier)
- Dual wield
- 2H weapon

Le systeme de sprites D2 est compose en **layers** (corps, bras gauche, bras droit, tete, jambes) -- quand un bouclier est equipe, seul le layer du bras gauche change. Ceci reduit massivement le nombre de sprites a pre-render.

**Palette swapping** est utilise pour les variantes (armes de froid = bleu, feu = rouge).

### 1.3 Approches des moteurs concurrents

#### Bevy (Rust)

Bevy 0.17 offre un systeme d'animation sprite via composants ECS :
- `AnimationIndices` (start/end frame)
- `AnimationTimer` (duree par frame, timer)
- System qui avance les frames a chaque tick

Limitations : pas de state machine integree, pas de tags Aseprite natifs. La communaute a cree des plugins :
- `bevy_spritesheet_animation` : duree, repetitions, direction, easing
- `bevy_asepritesheet` : charge les JSON exports Aseprite, supporte loop/pause/stop/transition

#### Godot 4

Deux systemes complementaires :
- **AnimatedSprite2D** : Simple, specialise sprites. Charge des SpriteFrames (collection de textures par animation). Pas de blending, switch immediat.
- **AnimationPlayer** : Generique, anime n'importe quelle propriete. Plus puissant mais plus complexe.

Godot recommande AnimatedSprite2D pour les cas simples et AnimationPlayer quand on anime aussi des proprietes (particules, sons, scripts).

### 1.4 Recommandations pour MGE

| Priorite | Recommandation | Justification |
|----------|---------------|---------------|
| **P0** | Loader Aseprite natif via `asefile` | Standard pixel art, metadata riche (tags = animations, user data = triggers) |
| **P0** | Loader TexturePacker JSON | Compatibilite assets itch.io, pipeline existant |
| **P1** | Animation State Machine (FSM) | 16 directions D2, transitions explicites, exit time |
| **P1** | Systeme de layers composites | Reproduction fidele D2 : corps + equipement en layers separes |
| **P1** | Frame events (damage, SFX, VFX) | Synchronisation gameplay/animation |
| **P2** | Palette swapping GPU (shader) | Variantes d'entites sans duplication d'assets |
| **P3** | Skeleton animation optionnel | Allumina seulement, si style artistique le justifie |

---

## 2. Optimisation rendu (batching, atlas, instancing)

### 2.1 Techniques de batching

L'industrie utilise trois niveaux d'optimisation progressifs :

**Niveau 1 : Batched Quads (approche actuelle MGE)**
- Chaque sprite = 4 vertices + 6 indices reconstruits cote CPU chaque frame
- 1 draw call par changement de texture (bind group swap)
- Simple a implementer, suffisant pour < 5 000 sprites
- **Limitation** : CPU-bound pour la construction du vertex buffer ; N textures = N draw calls

**Niveau 2 : Instanced Rendering**
- Chaque sprite = 1 instance (pas 4 vertices) ; le quad est un mesh statique partage
- Les donnees par-instance (position, UV, tint, texture_id) sont dans un storage buffer ou instance buffer
- 1 draw call par texture (ou par batch si meme shader)
- **Avantage** : Reduction massive du trafic CPU->GPU. Le vertex buffer est statique (4 vertices), seul l'instance buffer change.

**Niveau 3 : Bindless / Texture Array (etat de l'art)**

Architecture documentee par Gabriel Sassone (Vulkan bindless sprite batch) :

```
GPU Pipeline:
  - 1 vertex buffer statique (quad 4 vertices)
  - 1 storage buffer (SpriteGPUData[] : position, uv, size, texture_id)
  - 1 bind group texture array (toutes les textures en un seul binding)
  - 1 draw call instancie pour TOUS les sprites de la frame
```

Le fragment shader indexe dans le texture array avec `nonuniformEXT` :
```wgsl
@group(1) @binding(0) var textures: binding_array<texture_2d<f32>>;
// ...
let color = textureSample(textures[sprite.texture_id], sampler, uv);
```

**Performance** : 1 seul draw call pour des milliers de sprites, meme avec des textures differentes. Elimine completement le bottleneck du bind group swap.

**Prerequis wgpu** : Feature `TEXTURE_BINDING_ARRAY` (disponible sur la plupart des GPU modernes, Vulkan 1.2+, Metal, DX12). Fallback possible vers le Niveau 2 sur hardware ancien.

**Reference : frenderer (Rust/wgpu)**

Le crate `frenderer` implemente exactement cette approche pour wgpu :
- Instanced rendering avec storage buffers
- Array textures pour consolider les spritesheets
- Sprite groups comme layers independants
- Mode retained (setup une fois, modifie incrementalement)

### 2.2 Texture atlas

#### Algorithmes de packing

| Algorithme | Principe | Efficacite | Complexite | Usage |
|------------|----------|------------|------------|-------|
| **MaxRects** | Divise l'espace en rectangles maximaux, place dans le meilleur fit | 90-95% | O(n^2) | Standard industrie (TexturePacker default) |
| **Guillotine** | Decoupe recursive en 2 sous-rectangles | 85-90% | O(n log n) | Bon pour tailles variees |
| **Skyline** | Maintient une "ligne de ciel" du remplissage | 88-93% | O(n log n) | Bon compromis vitesse/efficacite |
| **Shelf** | Lignes horizontales d'elements tries par hauteur | 80-85% | O(n log n) | Simple, bon pour tailles uniformes |

**Recommandation MGE** : MaxRects avec heuristique Best-Short-Side-Fit (BSSF) pour `mge-packer`. C'est le standard de TexturePacker et le plus efficace pour les sprites de tailles variees (64x64 personnages + 64x32 tiles + 16x16 icones).

#### Taille d'atlas recommandee

| Plateforme cible | Taille max recommandee | Note |
|-----------------|----------------------|------|
| Desktop (modern) | 4096x4096 | Supporte par tous les GPU recents |
| Desktop (safe) | 2048x2048 | Compatibilite maximale |
| Mobile | 2048x2048 ou 1024x1024 | Non pertinent pour MGE |

Pour MGE : **4096x4096** comme taille standard, avec fallback 2048x2048 configurable. Un atlas 4096x4096 en RGBA = 64 Mo VRAM. Avec 4-6 atlas (tiles, personnages, monstres, effets, UI, items), le budget total est de 256-384 Mo -- raisonnable sur desktop.

#### Organisation des atlas par usage

```
Atlas 0: tiles_ground.png     (herbe, pierre, eau, sable)
Atlas 1: tiles_overlay.png    (arbres, murs, toits)
Atlas 2: characters.png       (joueur, NPC, layers equipement)
Atlas 3: monsters_act1.png    (monstres Act 1)
Atlas 4: effects.png          (sorts, AoE, auras, particules)
Atlas 5: ui.png               (icones, boutons, frames, orbes)
Atlas 6: items.png            (items au sol, icones inventaire)
```

Ceci minimise les changements d'atlas dans le rendu : le ground passe n'utilise que atlas 0, le unit passe utilise atlas 2-3, etc.

### 2.3 GPU-driven rendering

Pour Allumina (500+ entites), l'approche GPU-driven est pertinente :

**Indirect Draw Calls**

```rust
// Au lieu de: pass.draw_instanced(0..6, 0..sprite_count)
// On utilise: pass.draw_indirect(&indirect_buffer, 0)
// Le GPU decide combien de sprites dessiner
```

`wgpu` supporte `draw_indirect` et `multi_draw_indirect` (avec feature `MULTI_DRAW_INDIRECT`). Le CPU prepare un buffer d'arguments de draw, le GPU les execute. Avantage : le GPU peut modifier le count (apres culling compute).

**Compute Shader Culling**

```
Compute pass:
  Input:  sprite_data[] (positions monde)
  Input:  camera_frustum
  Output: visible_sprite_indices[]
  Output: indirect_draw_args (count = nombre de sprites visibles)

Render pass:
  draw_indirect(indirect_draw_args)
```

Le culling est fait sur GPU, pas sur CPU. Elimine le round-trip CPU->GPU pour le frustum culling. Pour 500+ entites avec effets, c'est un gain significatif.

### 2.4 Recommandations pour MGE

| Priorite | Recommandation | Impact | Effort |
|----------|---------------|--------|--------|
| **P0** | Migrer vers instanced rendering | -80% trafic CPU, -60% draw calls | Moyen (refactor `SpriteBatcher`) |
| **P0** | Augmenter max_sprites a 65 536 (u16 index) ou 262 144 (u32) | Support 500+ entites + effets | Faible |
| **P1** | Texture array binding (TEXTURE_BINDING_ARRAY) | 1 draw call total | Moyen (nouveau bind group layout) |
| **P1** | MaxRects packer dans `mge-packer` | Meilleur taux de remplissage | Moyen |
| **P2** | Organisation atlas par usage (7 atlas) | Minimise bind group swaps | Faible (convention, pas code) |
| **P3** | Compute shader frustum culling | GPU-driven pour Allumina | Eleve |
| **P3** | Indirect draw calls | Prerequis pour culling GPU | Moyen |

---

## 3. Scalabilite MMO 2D (500+ entites)

### 3.1 Spatial partitioning

Le choix de la structure spatiale est critique pour Allumina. Analyse des options :

#### Grid (grille fixe)

```
Principe : Divise le monde en cellules de taille fixe (ex: 8x8 tiles).
           Chaque entite est dans exactement une cellule.
           Lookup O(1) par hash de coordonnee.

Avantages :
  - Add/Remove/Move : O(1)
  - Query voisinage : O(1) (9 cellules adjacentes)
  - Implementation triviale (HashMap<(i32,i32), Vec<EntityId>>)
  - Zero allocation pour les cellules vides

Inconvenients :
  - Taille de cellule fixe : si mal choisie, soit trop d'entites par cellule, soit trop de cellules vides
  - Clustering degrade les performances (100 monstres au meme endroit)
```

#### Quadtree

```
Principe : Subdivision recursive en 4 quadrants.
           Subdivise quand une cellule depasse un seuil.

Avantages :
  - Adaptatif : plus de precision la ou les entites sont denses
  - Query O(log n) garanti meme avec clustering
  - Standard de l'industrie pour le 2D

Inconvenients :
  - Move = remove + add = O(log n) a chaque frame pour chaque entite mobile
  - Allocation dynamique (noeuds de l'arbre)
  - Plus complexe a implementer
```

#### Spatial Hash Grid (recommande pour MGE)

```
Principe : Hybride grid/hash. Grille conceptuelle infinie,
           seules les cellules occupees existent (HashMap).
           Taille de cellule = environ 2x le rayon de query le plus frequent.

Avantages :
  - O(1) insert/remove/move (comme grid fixe)
  - Pas de memoire pour les cellules vides (comme quadtree)
  - Implementation simple et performante
  - Previsible : pas de worst-case O(n)
  - Rebuild rapide par frame (clear + re-insert tous les mobiles)

Pour 500 entites a 60 FPS :
  - 500 inserts/frame = ~500 hash lookups = negligeable
  - Query frustum = quelques dizaines de cellules = < 1 ms
```

**Benchmarks de reference (source: gameprogrammingpatterns.com + GameDev.net) :**
- Grid simple : 100k agents a 60+ FPS (i7)
- Spatial hash grid : ~1M agents (i3 ancien hardware)
- Quadtree dynamique : 10 000+ objets performant, mais overhead d'allocation

### 3.2 Culling avance

#### View Frustum Culling

Pour une camera isometrique, le frustum est un rectangle en coordonnees monde. Le culling consiste a ne soumettre au GPU que les sprites dont la bounding box intersecte ce rectangle.

```
Algorithme :
  1. Calculer le rectangle visible en coordonnees monde
     (inverse de la projection camera, avec marge pour sprites grands)
  2. Query le spatial hash grid pour les cellules qui intersectent
  3. Pour chaque entite dans ces cellules, test AABB
  4. Soumettre uniquement les entites visibles au SpriteBatcher

Performance attendue :
  - 500 entites dans le monde, 50-100 visibles a l'ecran
  - Reduction de 80-90% des sprites soumis
  - Cout du culling : < 0.5 ms (CPU) ou < 0.1 ms (GPU compute)
```

#### Hierarchical Culling (pour Allumina open world)

```
Niveau 1 : Chunk culling (32x32 tiles par chunk)
            - Seuls les chunks dans/adjacents au viewport sont actifs
            - Les chunks hors-viewport ont leurs entites "endormies"

Niveau 2 : Cell culling (spatial hash grid)
            - Dans les chunks actifs, query par cellules

Niveau 3 : Sprite culling (AABB individuel)
            - Test final par entite
```

### 3.3 LOD pour sprites 2D

Le LOD classique (reduction de polygones) ne s'applique pas directement aux sprites 2D. Voici les adaptations :

#### Animation LOD

| Distance | Detail | Cout |
|----------|--------|------|
| Proche (< 10 tiles) | Animation complete (16 directions, tous les frames) | 100% |
| Moyen (10-20 tiles) | Animation reduite (8 directions, 50% frames) | 40% |
| Loin (20-40 tiles) | Animation minimale (4 directions, idle seulement) | 15% |
| Tres loin (> 40 tiles) | Sprite statique (1 frame, 1 direction) | 2% |
| Hors ecran (+ marge) | Pas de rendu, simulation seulement | 0% |

#### Taille LOD

Pour les entites lointaines, utiliser des sprites plus petits (pre-scales dans l'atlas) :
- LOD 0 : 64x64 (pleine taille)
- LOD 1 : 32x32 (demi-taille, pre-genere par `mge-rescale`)
- LOD 2 : 16x16 (quart, icone)

Ceci reduit le fillrate GPU et le bandwidth texture.

### 3.4 Entity streaming / chunking

Pour Allumina (monde ouvert MMO), le monde ne tient pas en memoire. Systeme de chunks :

```
Chunk = zone de 32x32 tiles
Etat d'un chunk :
  - Unloaded  : pas en memoire
  - Loading   : chargement async (IO thread)
  - Active    : simule + rendu
  - Dormant   : simule reduit (pas de rendu, pas d'IA complexe)
  - Unloading : sauvegarde + liberation memoire

Rayon de chargement :
  - Active : 3x3 chunks autour du joueur (9 chunks)
  - Dormant : 5x5 chunks (16 chunks dormants)
  - Unloaded : au-dela

Chargement async :
  - tokio::spawn_blocking pour IO fichier
  - Channel pour notifier le game loop quand un chunk est pret
  - Double-buffering : le chunk est prepare dans un buffer secondaire,
    puis swappe dans le monde actif en une frame
```

**Reference Minecraft/Terraria** : Le chunking 2D est un pattern eprouve. Terraria utilise des chunks de 200x150 tiles avec chargement streaming. Minecraft utilise 16x16 chunks.

### 3.5 Benchmarks de reference

| Jeu | Type | Entites simultanees | Technique cle | Moteur |
|-----|------|-------------------|---------------|--------|
| Path of Exile 1 | ARPG iso | 200-500+ (endgame) | Batching agressif, pooling VFX, culling | Custom C++ |
| Path of Exile 2 | ARPG iso | 300-800+ | Radiance Cascades, indirect rendering, Vulkan/DX12 | Custom C++ |
| Albion Online | MMO iso | 100-300+ (GvG) | Unity, 1 mesh bake par personnage, 1 draw call/char | Unity |
| Last Epoch | ARPG iso | 100-300+ | Unity 6, VFX pooling, benchmark scenes internes | Unity |
| Diablo 2 original | ARPG iso | 50-100 | Layer sprites, palette swap, 256 couleurs | Custom C |
| Diablo 2 Resurrected | ARPG iso | 50-100 (legacy) | Layer 3D par-dessus le moteur D2 original | Custom |

**Observations cles :**
- PoE est la reference haute en nombre d'entites. Ils ont investi massivement dans le GPU-driven rendering.
- Albion bake un mesh unique par personnage (1 draw call) -- equivalent de notre systeme de layers composites bakes en un sprite final.
- Last Epoch souffrait de problemes de performance avant les optimisations VFX pooling. La lecon : les effets visuels sont le premier bottleneck, pas les entites elles-memes.

### 3.6 Recommandations pour MGE

| Priorite | Recommandation | Cible | Impact |
|----------|---------------|-------|--------|
| **P0** | Spatial hash grid pour broad-phase | Sodomight + Allumina | Culling O(1), trivial a implementer |
| **P0** | View frustum culling (CPU, rect intersect) | Sodomight | -80% sprites soumis |
| **P1** | Animation LOD (3 niveaux) | Allumina | -60% cout d'animation pour entites distantes |
| **P1** | Chunking monde (32x32 tiles) | Allumina | Memoire bornee, streaming async |
| **P2** | Sprite LOD (tailles pre-scalees) | Allumina | Reduction fillrate |
| **P2** | VFX pooling (pre-allocation effets) | Sodomight + Allumina | Evite les allocations en combat |
| **P3** | GPU compute culling | Allumina endgame | Culling 100% GPU |

---

## 4. Normes de sprites standardisees

### 4.1 Conventions de nommage

Le consensus industrie pour le nommage d'assets de sprites :

```
Format : {entity}_{action}_{direction}_{frame:03d}.png

Exemples :
  necro_idle_s_000.png
  necro_idle_s_001.png
  necro_walk_ne_000.png
  necro_walk_ne_001.png
  fallen_attack_sw_003.png
  fireball_travel_e_002.png

Regles :
  - lowercase uniquement (compatibilite cross-platform)
  - underscores comme separateurs (pas d'espaces, pas de tirets)
  - prefixe d'entite en premier (facilite le tri par repertoire)
  - direction en notation cardinale : n, ne, e, se, s, sw, w, nw
  - frame sur 3 chiffres zero-padded (supporte 999 frames)
  - extension .png uniquement (pas de .jpg pour sprites)
```

**Directions standard pour ARPG isometrique :**

```
Diablo 2 : 16 directions (0-15, partant du sud, sens horaire)
  Mapping : 0=S, 1=SSW, 2=SW, 3=WSW, 4=W, 5=WNW, 6=NW, 7=NNW,
            8=N, 9=NNE, 10=NE, 11=ENE, 12=E, 13=ESE, 14=SE, 15=SSE

MGE recommande : 8 directions (S, SW, W, NW, N, NE, E, SE)
  + generation miroir horizontal pour economiser 50% des assets
  (walk_e = flip horizontal de walk_w)

  Directions rendues : S, SW, W, NW (4 directions artistiques)
  Directions generees : N = miroir de S, NE = miroir de NW, E = miroir de W, SE = miroir de SW

  Exception : entites asymetriques (bouclier) necessitent les 8 directions rendues
```

### 4.2 Tailles standard par classe d'entite

| Classe | Taille frame (px) | Taille tile iso | Note |
|--------|-------------------|-----------------|------|
| Tile sol | 64x32 | 1x1 | Standard dimetric 2:1 |
| Tile mur | 64x64 | 1x1 (+ hauteur) | 32px de base + 32px de mur |
| Personnage joueur | 64x96 | 1x1 (centrage vertical) | Plus grand que le tile, centre en bas |
| Monstre small (fallen) | 48x48 | 1x1 | Ajuste au tile |
| Monstre medium (zombie) | 64x80 | 1x1 | Comme joueur, un peu plus court |
| Monstre large (golem) | 96x128 | 2x2 | Occupe plusieurs tiles |
| Boss (Andariel) | 128x160 | 3x3 | Tres grand, occlusion speciale |
| Projectile | 32x32 | - | Petit, haute vitesse |
| Effet AoE small | 64x64 | 1x1 | Taille d'un tile |
| Effet AoE large | 192x128 | 3x3 iso | Zone multi-tiles |
| Item au sol | 32x32 | < 1x1 | Petit, au-dessus du sol |
| Icone inventaire | 28x28 (1 slot) | - | Multiple de 28 pour grille D2 |

### 4.3 Format de metadata (TOML MGE)

L'existant MGE utilise deja TOML pour le registry. Extension recommandee pour les animations :

```toml
# registry/characters/necromancer.toml

[sprite]
id = "necro"
atlas = "characters"           # reference a l'atlas
base_size = [64, 96]           # taille d'une frame
anchor = [32, 88]              # point d'ancrage (pieds du personnage)
directions = 8                 # nombre de directions
mirror_pairs = [               # paires miroir (source -> generee)
  ["s", "n"],                  # n est flip vertical de s (rare)
  ["sw", "se"],                # se est flip horizontal de sw
  ["w", "e"],
  ["nw", "ne"],
]

# Animations definies par tags (compatible Aseprite tags)
[[animation]]
name = "idle"
frames = [0, 1, 2, 3]         # indices dans le spritesheet
fps = 6
loop_mode = "loop"             # loop | once | ping_pong

[[animation]]
name = "walk"
frames = [4, 5, 6, 7, 8, 9, 10, 11]
fps = 12
loop_mode = "loop"

[[animation]]
name = "attack_1h"
frames = [12, 13, 14, 15, 16, 17, 18, 19]
fps = 15
loop_mode = "once"
events = [
  { frame = 5, type = "damage" },
  { frame = 3, type = "sfx", value = "swing_1h" },
  { frame = 5, type = "sfx", value = "hit_melee" },
]

[[animation]]
name = "hit"
frames = [20, 21, 22, 23]
fps = 12
loop_mode = "once"

[[animation]]
name = "death"
frames = [24, 25, 26, 27, 28, 29, 30, 31, 32, 33]
fps = 10
loop_mode = "once"

[[animation]]
name = "cast"
frames = [34, 35, 36, 37, 38, 39, 40]
fps = 14
loop_mode = "once"
events = [
  { frame = 4, type = "spawn_projectile" },
  { frame = 2, type = "sfx", value = "cast_bone" },
  { frame = 4, type = "vfx", value = "bone_spear_origin" },
]

# Layer compositing (D2-style equipment layers)
[[layer]]
name = "body"
z_offset = 0
required = true

[[layer]]
name = "left_arm"
z_offset = 1
equipment_slot = "shield"      # change selon l'equipement

[[layer]]
name = "right_arm"
z_offset = 2
equipment_slot = "weapon"

[[layer]]
name = "head"
z_offset = 3
equipment_slot = "helm"
```

### 4.4 Pipeline d'assets

```
Workflow artiste :
  Aseprite (.ase)
    |
    v
  Export automatique (CI/build script)
    |
    +---> mge-slicer (si spritesheet uniforme externe)
    +---> mge-rescale (normalisation tailles)
    +---> mge-mirror (generation directions miroir)
    +---> mge-remap (uniformisation palette)
    |
    v
  mge-packer (MaxRects)
    |
    v
  Atlas PNG + TOML descriptor
    |
    v
  registry.toml (enregistrement ID symbolique)

Workflow runtime :
  Game boot :
    1. Charger registry.toml
    2. Charger atlas PNG -> GpuTexture (upload GPU)
    3. Charger atlas TOML -> TextureAtlas (frame lookup)
    4. Charger animation TOML -> AnimationBank (FSM data)
    5. Hot-reload : notify surveille .toml + .png
       -> Swap GPU texture sans redemarrer
       -> Reload animation data sans redemarrer
```

**Hot-reload (dev uniquement) :**

Le pattern eprouve pour le hot-reload d'assets en Rust :

```rust
// mge-asset hot-reload via notify crate
// 1. Watcher surveille les repertoires d'assets
// 2. Sur modification fichier .png :
//    - Recharger l'image
//    - Re-upload vers le GPU (queue.write_texture)
//    - Mettre a jour le TextureAtlas
// 3. Sur modification fichier .toml :
//    - Recharger le fichier
//    - Mettre a jour le registry / animation data
//    - Pas de restart necessaire
```

References : Bevy supporte le hot-reload via `watch_for_changes` dans le AssetPlugin. Fyrox recharge automatiquement les textures modifiees. Le pattern est standard dans l'industrie.

### 4.5 Recommandations pour MGE

| Priorite | Recommandation | Impact |
|----------|---------------|--------|
| **P0** | Convention de nommage formalisee (entity_action_dir_frame) | Coherence pipeline, automatisation packer |
| **P0** | Tailles standard par classe d'entite documentees | Guide les artistes, evite les rescale manuels |
| **P0** | Format TOML animation enrichi (events, layers, mirror) | Data-driven animations, pas de hardcode |
| **P1** | Loader Aseprite natif (tags -> animations automatiques) | Zero friction artiste : save .ase -> reload in-game |
| **P1** | Loader TexturePacker JSON (compat packs itch.io) | Import rapide assets existants |
| **P1** | Hot-reload .png et .toml en dev | Iteration rapide artiste |
| **P2** | Pipeline CI : .ase -> atlas automatique (pre-commit hook) | Automatisation build assets |

---

## 5. Synthese : Top 10 recommandations prioritaires

Classees par rapport impact/effort et criticite pour Sodomight (P1) puis Allumina (P2).

### Sprint 0 -- Fondations (bloquant tout le reste)

| # | Recommandation | Effort | Impact | Cible |
|---|---------------|--------|--------|-------|
| **1** | **Instanced rendering** : Migrer `SpriteBatcher` de quads reconstruits vers instanced draw. Quad statique (4 vertices), storage buffer par-instance (position, uv, size, tint, texture_id). | Moyen | Critique | Sodomight+Allumina |
| **2** | **Spatial hash grid** : Implementer dans `mge-collision` ou nouveau `mge-spatial`. Taille de cellule configurable (8x8 tiles par defaut). Rebuild complet par frame (clear + insert). | Faible | Critique | Sodomight+Allumina |
| **3** | **View frustum culling** : Calculer le rectangle visible en monde, query le spatial hash, soumettre uniquement les sprites visibles. | Faible | Eleve | Sodomight+Allumina |

### Sprint 1 -- Animation & Assets

| # | Recommandation | Effort | Impact | Cible |
|---|---------------|--------|--------|-------|
| **4** | **Loader Aseprite natif** (`asefile`) : Charger .ase direct, extraire tags comme animations, cels comme frames, user data comme events de gameplay. | Moyen | Eleve | Sodomight |
| **5** | **Animation State Machine (FSM)** : Composant ECS `AnimState` avec etats (Idle, Walk, Attack, Hit, Death, Cast), transitions explicites, support 8 directions, frame events. | Moyen | Eleve | Sodomight |
| **6** | **Layer compositing D2** : Systeme de layers (corps, bras, tete) combines en runtime. Chaque layer reference un sprite dans l'atlas. Le layer change quand l'equipement change. | Eleve | Eleve | Sodomight |

### Sprint 2 -- Scalabilite

| # | Recommandation | Effort | Impact | Cible |
|---|---------------|--------|--------|-------|
| **7** | **Texture array binding** (TEXTURE_BINDING_ARRAY) : Remplacer les bind groups individuels par un texture array. 1 draw call pour tout le rendu. Fallback multi-draw pour hardware ancien. | Moyen | Eleve | Allumina |
| **8** | **Animation LOD** (3 niveaux) : Reduire le nombre de directions et de frames pour les entites lointaines. Seuil configurable par classe d'entite. | Faible | Moyen | Allumina |
| **9** | **Entity chunking** (32x32 tiles) : Load/unload async, etats chunk (Active/Dormant/Unloaded), double-buffering. | Eleve | Critique | Allumina |

### Transversal

| # | Recommandation | Effort | Impact | Cible |
|---|---------------|--------|--------|-------|
| **10** | **Convention de nommage + TOML animation enrichi** : Formaliser les normes (entity_action_dir_frame), enrichir le format TOML avec events, layers, mirror_pairs. Documenter les tailles standard par classe. | Faible | Eleve | Sodomight+Allumina |

---

## Annexes

### A. Risques identifies

| Risque | Probabilite | Impact | Mitigation |
|--------|------------|--------|------------|
| TEXTURE_BINDING_ARRAY non supporte sur certains GPU | Faible (DX12/Vulkan 1.2+) | Moyen | Fallback multi-draw par atlas |
| 16 directions D2 = explosion combinatoire des assets | Haute | Eleve | Miroir horizontal (4 -> 8 directions), limite a 8 directions |
| Hot-reload cause des race conditions | Moyenne | Faible | Mutex sur registry, double-buffering texture |
| Max sprites 65536 (u16 index) insuffisant pour Allumina | Faible | Moyen | Passer a u32 index des le depart |
| Aseprite file format evolue (v1.4+) | Faible | Faible | `asefile` crate suit les specs |

### B. Delta avec l'existant MGE

| Composant existant | Etat | Action |
|-------------------|------|--------|
| `SpriteBatcher` (pipeline.rs) | Fonctionnel, quads CPU | **Refactorer** vers instanced rendering |
| `SpriteRenderer` (sprite.rs) | Batching par layer | **Enrichir** avec frustum culling |
| `TextureAtlas` (atlas.rs) | TOML basique | **Etendre** format TOML avec animations et events |
| `AtlasRegistry` (atlas.rs) | Lookup par nom | **OK**, ajouter lookup par ID numerique pour GPU |
| `Camera2D` (camera.rs) | Iso 2:1, smooth follow | **OK**, ajouter methode `visible_rect()` pour culling |
| `RenderConfig.max_sprites` | 16 384 | **Augmenter** a 65 536+ (u32 index) |
| `RenderLayer` (sprite.rs) | 6 layers | **OK**, suffisant |
| `SpritePipeline` (pipeline.rs) | 1 texture bind group | **Refactorer** vers texture array bind group |
| Animation system | **Inexistant** | **Creer** FSM + loader Aseprite + TOML animations |
| Spatial partitioning | **Inexistant** | **Creer** spatial hash grid |
| Frustum culling | **Inexistant** | **Creer** dans `SpriteRenderer` ou `Camera2D` |

### C. Sources

**Moteurs et frameworks analyses :**
- Bevy 0.17 sprite animation : https://bevy.org/examples/2d-rendering/sprite-animation/
- bevy_spritesheet_animation : https://github.com/merwaaan/bevy_spritesheet_animation
- bevy_asepritesheet : https://crates.io/crates/bevy_asepritesheet
- Godot AnimatedSprite2D : https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html
- Spine 2D runtimes : https://github.com/EsotericSoftware/spine-runtimes
- spine2d Rust crate : https://crates.io/crates/spine2d
- DragonBones : https://dragonbones.github.io/en/animation.html
- frenderer (Rust/wgpu) : https://docs.rs/frenderer/latest/frenderer/

**Aseprite :**
- Spec officielle : https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md
- asefile Rust crate : https://docs.rs/asefile
- aseprite-loader : https://crates.io/crates/aseprite-loader

**Texture atlas et batching :**
- Modern Bindless Sprite Batch (Vulkan) : https://jorenjoestar.github.io/post/modern_sprite_batch/
- TexturePacker documentation : https://www.codeandweb.com/texturepacker/documentation
- MaxRects packer : https://github.com/soimy/maxrects-packer

**Spatial partitioning :**
- Game Programming Patterns - Spatial Partition : https://gameprogrammingpatterns.com/spatial-partition.html
- Quadtree tutorial : https://peerdh.com/blogs/programming-insights/implementing-quadtrees-for-spatial-partitioning-in-2d-games-3

**Rendu GPU :**
- wgpu texture arrays : https://github.com/gfx-rs/wgpu/discussions/2577
- wgpu indirect draw : https://github.com/gfx-rs/wgpu/issues/742
- Learn Wgpu : https://sotrh.github.io/learn-wgpu/beginner/tutorial5-textures/

**Jeux de reference :**
- PoE 2 rendering : https://store.steampowered.com/news/app/238960/view/3802787074179045346
- Albion Online architecture : https://www.slideshare.net/slideshow/albion-online-software-architecture-of-an-mmo-talk-at-quo-vadis-2016-berlin/62724504
- Last Epoch performance : https://forum.lastepoch.com/t/performance-optimization-coming-in-convergence/52263

**Conventions et pipeline :**
- Animation naming conventions : https://medium.com/@nicholasRodgers/animation-naming-conventions-and-folder-structures-for-game-development-2e87f3d0668f
- Asset naming best practices : https://pressstartleadership.com/game-on-the-ultimate-guide-to-asset-naming-conventions-in-video-game-development/
- Bevy hot-reload : https://bevy-cheatbook.github.io/assets/hot-reload.html

---

**Rapport redige par Fabrice (Analyste PR) -- Miyukini AI Studio**
**A transmettre a Maria (validation P0) puis Denis (exploitation technique P0-T5)**
