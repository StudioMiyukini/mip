# PLAN -- Sprint 1 : Correction des 4 bugs P0 + bitmap font

**Date** : 2026-03-01
**Auteur** : Denis (P2 Plan d'execution)
**Classification** : T4
**Statut** : Execute et valide

---

## Resume

4 bugs P0 + 1 delta critique resolus. 3 fichiers modifies, 1 fichier cree.
Tous les tests passent, clippy propre, 0 warnings.

## Taches realisees

### T01 -- BUG-01 + BUG-04 : Camera snap (2 min)

**Fichier** : `mge/games/sodomight-client/src/game.rs` (lignes 650-657)

**Changement** : Remplacement de `camera.update(alpha)` par un snap direct :
```rust
self.camera.world_x = self.camera.target_x;
self.camera.world_y = self.camera.target_y;
```

**Cause racine** : `game_loop.alpha()` retourne un ratio d'interpolation
(0.0-1.0), pas un delta-time. `Camera2D::update(dt)` l'utilisait comme dt,
produisant un facteur de smoothing quasi-nul qui figeait la camera.

**Tests** : Tests existants passent. Pas de nouveau test necessaire (logique
triviale).

### T02 -- DELTA-U01 : Bitmap font renderer (15 min)

**Fichier cree** : `mge/games/sodomight-client/src/bitmap_font.rs` (295 lignes)

**Module** enregistre dans `lib.rs`.

**Architecture** :
- Atlas procedural 128x48 pixels, grille 16x6, cellules 8x8
- 95 caracteres ASCII (32-126) avec glyphes 5x7 bitmap
- `BitmapFont::push_text()` pousse des quads dans le `SpriteBatcher`
- Passe de rendu separee avec la texture font bindee

**Tests ajoutes** (5) :
- `atlas_dimensions_correct`
- `space_glyph_is_blank`
- `letter_a_has_nonzero_pixels`
- `char_width_and_line_height`
- `all_printable_ascii_glyphs_exist`

### T03 -- BUG-02 : Feedback d'attaque (10 min)

**Fichiers** : `game.rs`

**Changements** :
1. Hit flash : `HashMap<EntityId, u8>` dans `SodomightApp`. Timer a 4 frames
   quand un monstre est touche. `batch_monsters()` utilise un tint blanc
   au lieu du rouge pendant le flash.
2. Damage numbers flottants : `Vec<FloatingText>` dans `SodomightApp`. Chaque
   entree monte de 0.8 px/frame et fade out sur 45 frames. Rendu via bitmap
   font dans une passe separee en world-space.
3. Combat log textuel : Les messages du combat log sont rendus via bitmap font
   au-dessus des rectangles noirs existants.
4. HP/Mana text : Valeurs numeriques affichees sur les barres HP et mana.

**Tests ajoutes** (7) :
- `test_extract_damage_text_hit`
- `test_extract_damage_text_skill`
- `test_extract_damage_text_miss`
- `test_extract_damage_text_death`
- `test_extract_damage_text_critical`
- `test_hit_flash_timers_decay`
- `test_floating_text_expires`

### T04 -- BUG-03 : Panneau skills visible (8 min)

**Fichier** : `gui.rs`

**Changements** :
1. Ajout de `if self.skill_panel_open { self.draw_skill_panel(batcher); }`
   dans `draw()`.
2. Implementation de `draw_skill_panel()` : panneau avec fond, bordures,
   indicateurs de couleur par slot, barre de titre.
3. Implementation de `draw_skill_panel_text()` : rendu des noms de skills
   via bitmap font (passe texte separee dans `game.rs`).
4. Ajout de `hp_display()` et `mana_display()` pour l'affichage textuel.

**Tests ajoutes** (3) :
- `hp_display_returns_current_values`
- `mana_display_returns_current_values`
- `skill_panel_toggled_by_k`

## Integration au rendu

Le pipeline de rendu comporte maintenant 5 passes :

| # | Passe | Camera | Texture | Contenu |
|---|-------|--------|---------|---------|
| 1 | `sprite_pass` | Monde | `grass_texture` | Tiles + entites |
| 2 | `gui_pass` | Ecran | `gui_texture` (blanc) | Barres, slots, panneaux |
| 3 | `gui_text_pass` | Ecran | `font_texture` | Texte combat log, HP, mana, skills |
| 4 | `float_text_pass` | Monde | `font_texture` | Damage numbers flottants |
| 5 | (submit) | -- | -- | GPU submit + present |

## Validation finale

```
cargo clippy --workspace -- -D warnings  =>  0 warnings, 0 errors
cargo test --workspace                    =>  0 failures
```

**sodomight-client** : 50 tests (dont 15 nouveaux)

## Fichiers modifies/crees

| Fichier | Action | Lignes |
|---------|--------|--------|
| `mge/games/sodomight-client/src/bitmap_font.rs` | Cree | ~295 |
| `mge/games/sodomight-client/src/game.rs` | Modifie | ~1140 (etait 811) |
| `mge/games/sodomight-client/src/gui.rs` | Modifie | ~990 (etait 834) |
| `mge/games/sodomight-client/src/lib.rs` | Modifie | +1 ligne |
| `.mip/specs/SPEC-sprint1-p0-fixes.md` | Cree | ~100 |
| `.mip/plans/PLAN-sprint1-p0-fixes.md` | Cree | ce fichier |

---

*Denis -- MIP v2 Phase P2 Plan d'execution*
