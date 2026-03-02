# SPEC -- Sprint 1 : Correction des 4 bugs P0 + bitmap font

**Date** : 2026-03-01
**Auteur** : Denis (P1 Specification)
**Classification** : T4
**Statut** : Valide

---

## 1. Contexte

Le MVP Sodomight presente 4 bugs P0 bloquants + 1 delta critique (aucun rendu
de texte) qui rendent le jeu injouable. Ce document specifie l'approche
technique pour chacun des 5 correctifs.

## 2. Analyse technique detaillee

### 2.1 BUG-01 + BUG-04 : Camera figee / terrain mal centre

**Cause racine confirmee** :

Dans `game.rs:569-570` :
```rust
let alpha = self.game_loop.alpha();
self.camera.update(alpha);
```

`GameLoop::alpha()` retourne le ratio `accumulator / tick_duration`, soit une
valeur entre 0.0 et 1.0 representant la fraction du prochain tick. C'est un
parametre d'INTERPOLATION pour le rendu, PAS un delta-time.

`Camera2D::update(dt)` utilise `dt` comme un delta-time normalise :
```rust
let factor = 1.0 - (1.0 - self.smooth_speed).powf(dt * 60.0);
```

Avec `smooth_speed = 0.1` et `dt = alpha` souvent proche de 0 :
- `factor = 1.0 - 0.9^(0.0 * 60) = 1.0 - 0.9^0 = 1.0 - 1.0 = 0.0`
- La camera ne bouge jamais.

**Fix retenu (MVP)** : Snap direct, pas d'interpolation. Remplacer
`camera.update(alpha)` par un snap immediat :
```rust
self.camera.world_x = self.camera.target_x;
self.camera.world_y = self.camera.target_y;
```

Cela fixe egalement BUG-04 car le terrain apparaitra centre autour du joueur.

**Fichiers modifies** : `mge/games/sodomight-client/src/game.rs`

### 2.2 BUG-02 : Aucun feedback d'attaque visible

**Cause racine confirmee** :

1. `player_attack()` retourne des messages, mais ceux-ci sont envoyes dans
   `tracing::debug!` uniquement (game.rs:272-274).
2. Le combat_log GUI dessine des rectangles noirs sans texte (gui.rs:520-523) :
   seuls des quads `COL_LOG_BG` sont pousses, aucun texte.
3. Aucun systeme de hit flash n'existe.

**Fix retenu** :

A. **Hit flash** : Ajouter un champ `hit_flash_timers: HashMap<EntityId, u8>`
   dans `SodomightApp`. Quand un monstre est touche, mettre le timer a 4
   frames. Dans `batch_monsters()`, si le timer est actif, utiliser un tint
   blanc `[1.0, 1.0, 1.0, 1.0]` au lieu du rouge.

B. **Damage numbers** : Ajouter un systeme de `FloatingText` dans le GUI.
   Chaque entree contient (x_screen, y_screen, text, color, ttl_frames).
   A chaque frame, les y diminuent (les textes montent) et les ttl decrementent.
   Le rendu se fait via le bitmap font (voir DELTA-U01).

C. **Combat log textuel** : Le rendu du combat log utilisera le bitmap font
   pour afficher les messages textuels au lieu de rectangles noirs.

**Fichiers modifies** : `game.rs`, `gui.rs`

### 2.3 BUG-03 : Panneau skills invisible

**Cause racine confirmee** :

- `toggle_skills()` flippe `skill_panel_open` (gui.rs:253-254).
- `draw()` (gui.rs:387-397) ne teste jamais `skill_panel_open`.
- `draw_skill_panel()` n'existe pas.

**Fix retenu** :

1. Implementer `draw_skill_panel()` dans `gui.rs`, similaire a
   `draw_inventory_panel()`. Le panneau affiche les 6 skills avec leur nom
   via bitmap font, position a gauche de l'ecran.

2. Ajouter dans `draw()` :
   ```rust
   if self.skill_panel_open {
       self.draw_skill_panel(batcher);
   }
   ```

**Fichiers modifies** : `gui.rs`

### 2.4 DELTA-U01 : Aucun rendu de texte (bitmap font)

**Cause racine** : Le `SpriteBatcher` ne gere que des quads textures. Aucun
systeme de texte n'existe dans tout le pipeline de rendu.

**Fix retenu** : Creer un module `bitmap_font.rs` dans `sodomight-client/src/`.

Architecture :
- Generer une texture atlas bitmap monospace 128x48 pixels en memoire (pas de
  fichier externe) contenant les caracteres ASCII 32-126 (95 caracteres).
- Grille de 16 colonnes x 6 lignes, chaque cellule de 8x8 pixels.
- Chaque caractere est dessine pixel par pixel dans l'atlas selon une table
  de donnees embarquee (font 5x7 pixels avec 1px padding).
- API publique :
  ```rust
  pub struct BitmapFont { ... }
  impl BitmapFont {
      pub fn new(device, queue, pipeline) -> Self;
      pub fn push_text(batcher, x, y, text, color, scale) -> f32;
      pub fn char_width(scale) -> f32;
      pub fn line_height(scale) -> f32;
  }
  ```
- Le texte est rendu via le meme `SpriteBatcher` avec la texture font bindee
  (pass separee ou meme pass si on gere le texture switch).

**Approche de rendu** : La GUI fait deja une passe separee avec `gui_texture`.
On ajoutera une troisieme passe pour le texte avec `font_texture`.

**Fichiers crees** : `bitmap_font.rs`
**Fichiers modifies** : `game.rs`, `gui.rs`, `lib.rs`

## 3. Invariants de securite

- Aucun `unsafe` code.
- Aucun `unwrap()` en production (uniquement tests).
- Clippy pedantic propre.
- Annotations MSCM sur tous les nouveaux fichiers.

## 4. Risques identifies

| Risque | Mitigation |
|--------|------------|
| Font illisible a 8x8 | Echelle x2 par defaut (16x16 pixels affiche) |
| Performance 3 passes de rendu | Les passes sont legeres, pas de risque a <1000 sprites |
| Texture switch dans une passe | Passes separees, pas de switch en cours de pass |

## 5. Tests requis

- `cargo test --workspace` dans `mge/` doit passer a 0 failures.
- `cargo clippy --workspace -- -D warnings` dans `mge/` doit passer a 0 warnings.
- Test unitaire pour `BitmapFont::push_text` (verification du nombre de quads).
- Test unitaire pour `draw_skill_panel` (verification que le flag fonctionne).
- Test unitaire pour le hit flash timer.

---

*Denis -- MIP v2 Phase P1 Specification*
