# Rapport d'Audit -- Sprint 1 : Correction des 4 bugs P0 + bitmap font

**Date** : 2026-03-01
**Auditeur** : George (P4 Integration & Audit)
**Reference** : BRIEF-sodomight-mvp-delta.md (Maria, P0)
**Spec** : SPEC-sprint1-p0-fixes.md (Denis, P1)
**Plan** : PLAN-sprint1-p0-fixes.md (Denis, P2)
**Classification** : T4

---

## Resume executif

**Score global : 91/100**

Le Sprint 1 livre les corrections des 4 bugs P0 identifies par Maria et l'implementation du bitmap font renderer (DELTA-U01). Les 5 correctifs sont **fonctionnellement complets et conformes** au brief et a la spec technique. Le build compile sans erreur, clippy passe a 0 warning, et les 50 tests du crate `sodomight-client` passent (dont 15 nouveaux). Le code respecte les invariants architecturaux (unsafe_code forbid, annotations MSCM, pas de `unwrap()` en production).

**Points forts** :
- Camera snap immediat : approche pragmatique et correcte pour le MVP
- Bitmap font renderer entierement procedural (aucune dependance fichier externe, conforme LOI-1)
- Hit flash + damage numbers bien integres dans le pipeline de rendu multi-passes
- Couverture de tests solide sur les nouveaux modules
- Annotations MSCM presentes sur tous les fichiers modifies/crees

**Points d'attention** :
- 1 `expect()` hors tests dans `gui.rs` (ligne 659) -- mineur car statique et infaillible
- Skill panel affiche des noms hardcodes au lieu de lire depuis le SkillBook du monde
- Le plan annonce 5 passes de rendu mais le code n'en fait que 4 (incoherence doc, pas fonctionnelle)
- Le `push_text_returns_correct_width` test ne teste pas la fonction reelle mais valide le calcul mathematique

---

## 1. Conformite fonctionnelle (vs brief Maria)

### BUG-01 + BUG-04 : Camera figee / terrain mal centre -- RESOLU

| Critere | Statut |
|---------|--------|
| Camera suit le joueur | OK |
| Terrain centre autour du joueur | OK (consequence directe) |
| Pas de regression sur le rendu | OK |

**Verification code** (`game.rs`, lignes 661-668) :
```rust
// BUG-01 fix: snap camera directly to target instead of using
// interpolation. `game_loop.alpha()` is a render interpolation factor
// (0.0-1.0), NOT a delta-time.
self.camera.world_x = self.camera.target_x;
self.camera.world_y = self.camera.target_y;
```

**Analyse** : Le snap direct est l'approche correcte pour le MVP. La cause racine (alpha utilise comme delta-time) est documentee en commentaire. L'ancien appel `camera.update(alpha)` a ete supprime. La camera est egalement snappee a l'initialisation (lignes 596-597). Conforme a la spec.

**Note** : Pour un futur sprint, il faudra reimplementer le smooth follow avec un vrai delta-time (`Instant::elapsed()`), mais cela n'est pas dans le scope du Sprint 1.

### BUG-02 : Aucun feedback d'attaque -- RESOLU

| Critere | Statut |
|---------|--------|
| Flash blanc sur monstre touche | OK |
| Damage numbers flottants | OK |
| Combat log avec texte | OK |
| HP/Mana text sur barres | OK (bonus) |

**Verification code** :

1. **Hit flash** (`game.rs`, lignes 99-100, 314-315, 508-513) :
   - `HashMap<EntityId, u8>` dans `SodomightApp`
   - Timer a `HIT_FLASH_FRAMES` (4) a l'impact
   - `batch_monsters()` utilise `HIT_FLASH_TINT` (blanc) si timer actif
   - Decay via `retain()` avec `saturating_sub(1)` (lignes 671-674) -- correct, pas d'overflow

2. **Damage numbers** (`game.rs`, lignes 62-74, 317-331, 676-684, 868-911) :
   - `Vec<FloatingText>` avec world-space coords, text, color, ttl
   - Spawn a la position iso du monstre avec offset -20.0 vers le haut
   - Monte de `FLOAT_TEXT_SPEED` (0.8px/frame), fade alpha proportionnel au TTL
   - Rendu dans une passe separee (`float_text_pass`) en world-space avec camera

3. **Combat log textuel** (`game.rs`, lignes 796-813) :
   - Messages rendus via `BitmapFont::push_text()` dans la passe `gui_text_pass`
   - Position coherente avec les rectangles de fond du combat log

4. **HP/Mana overlay** (`game.rs`, lignes 815-839) :
   - Texte "current/max" centre sur les barres via bitmap font
   - Calcul de largeur pour centrage de la mana text

**Analyse** : Implementation complete et conforme a la spec. Le parsing des messages de degats (`extract_damage_text`) est robuste et teste (5 cas de test). Les couleurs sont differenciees : or pour les attaques normales, bleu pour les skills.

### BUG-03 : Panneau skills invisible -- RESOLU

| Critere | Statut |
|---------|--------|
| Toggle K fonctionne | OK |
| Panneau dessine quand ouvert | OK |
| Noms des skills affiches | OK |
| Key bindings visibles | OK |

**Verification code** :

1. **Toggle** (`gui.rs`, lignes 252-254, 316-317) :
   - `toggle_skills()` flippe `skill_panel_open` -- inchange, deja fonctionnel
   - `handle_key_down(KeyCode::K)` retourne `GuiAction::ToggleSkills`

2. **Draw conditionnel** (`gui.rs`, lignes 398-401) :
   ```rust
   if self.skill_panel_open {
       self.draw_skill_panel(batcher);
   }
   ```
   Conforme a la spec. Le commentaire `// BUG-03 fix` est present.

3. **draw_skill_panel** (`gui.rs`, lignes 521-571) :
   - Panneau 220px de large, centre verticalement
   - Fond semi-transparent, barre de titre coloree
   - 6 slots avec bordures, fond interne, indicateur de couleur par slot
   - Couleurs distinctes : rouge, bleu, or, vert, violet, orange

4. **draw_skill_panel_text** (`gui.rs`, lignes 577-608) :
   - Titre "SKILLS (K)" en or
   - Noms des skills : "1: Attack", "2: Fire Bolt", etc.
   - Texte centre verticalement dans chaque slot
   - Utilise `skill_slots[i].as_deref().unwrap_or(name)` comme fallback

**Analyse** : Implementation fonctionnelle et conforme. Le panneau est visuellement complet avec fond, bordures, indicateurs et texte. Le seul point mineur est que les noms de skills sont hardcodes dans un tableau local (`skill_names`) au lieu d'etre lus depuis le `SkillBook` du monde. C'est acceptable pour le MVP mais devra etre connecte au systeme de skills reel dans un sprint ulterieur.

### DELTA-U01 : Aucun rendu de texte (bitmap font) -- RESOLU

| Critere | Statut |
|---------|--------|
| Atlas procedural genere | OK |
| ASCII 32-126 supporte | OK |
| push_text via SpriteBatcher | OK |
| Passe de rendu separee | OK |
| Pas de dependance fichier externe | OK (LOI-1) |

**Verification code** (`bitmap_font.rs`, 353 lignes) :

1. **Atlas** : 128x48 pixels, grille 16x6, cellules 8x8 -- conforme a la spec
2. **Glyphes** : 95 caracteres (32-126), 5x7 bitmap avec padding -- complet
3. **API publique** : `push_text()`, `char_width()`, `line_height()` -- conforme
4. **Generation** : `generate_font_atlas()` cree l'image en memoire sans I/O -- LOI-1 OK
5. **Integration** : La texture est creee dans `on_init()` via `GpuTexture::from_image()`

**Tests** : 6 tests dont :
- `atlas_dimensions_correct` -- verifie 128x48
- `space_glyph_is_blank` -- pixel par pixel
- `letter_a_has_nonzero_pixels` -- verifie les glyphes visibles
- `all_printable_ascii_glyphs_exist` -- valide les 95 caracteres

**Analyse** : Le module est propre, bien documente, et totalement auto-suffisant. L'approche procedurale evite toute dependance sur un fichier de police externe, ce qui est conforme a la LOI-1 (aucune dependance externe critique a l'execution).

---

## 2. Qualite du code (vs CLAUDE.md)

### Checklist standardisee

| Critere | Statut | Detail |
|---------|--------|--------|
| `cargo build --workspace` | PASS | 0 erreurs |
| `cargo clippy --workspace -- -D warnings` | PASS | 0 warnings |
| `cargo test --workspace` | PASS | 50 tests sodomight-client (dont 15 nouveaux), 0 echecs |
| `unsafe_code = "forbid"` dans Cargo.toml | PASS | Workspace-level dans `mge/Cargo.toml` ligne 59 |
| `#![deny(unsafe_code)]` dans fichiers | PASS | Present dans `lib.rs`, `gui.rs`, `bitmap_font.rs` |
| Pas de `unwrap()` en production | PASS | 1 seul `unwrap()` trouve dans `game.rs:1068` -- en bloc `#[cfg(test)]` |
| Pas d'URL hardcodees | PASS | Aucune URL trouvee dans les fichiers modifies |
| Pas de donnees sensibles en clair | PASS | Aucune donnee sensible |
| Annotations MSCM | PASS | `@id`, `@do`, `@role`, `@layer`, `@human` sur tous les fichiers |
| Lois d'Autonomie | PASS | LOI-1 (pas de dependance externe pour la font), LOI-3 (etat local) |

### Detail des `expect()` en production

| Fichier | Ligne | Expression | Risque |
|---------|-------|------------|--------|
| `gui.rs` | 659 | `.expect("white texture image creation must not fail (static size)")` | **NUL** -- `RgbaImage::from_raw(4, 4, data)` avec data de taille exacte 64 octets ne peut pas echouer |

**Verdict** : Cet `expect()` est acceptable car la donnee est statique et la taille calculee. Le message d'erreur est explicite. Ce n'est pas un defaut bloquant.

---

## 3. Couverture de tests

### Tests nouveaux (15)

| Module | Test | Cas couvert |
|--------|------|-------------|
| `bitmap_font` | `atlas_dimensions_correct` | Nominal |
| `bitmap_font` | `space_glyph_is_blank` | Cas limite (char invisible) |
| `bitmap_font` | `letter_a_has_nonzero_pixels` | Nominal |
| `bitmap_font` | `char_width_and_line_height` | Nominal + scale |
| `bitmap_font` | `push_text_returns_correct_width` | Calcul mathematique (indirecte) |
| `bitmap_font` | `all_printable_ascii_glyphs_exist` | Exhaustif 95 chars |
| `game` | `test_extract_damage_text_hit` | Nominal |
| `game` | `test_extract_damage_text_skill` | Variante |
| `game` | `test_extract_damage_text_miss` | Cas negatif |
| `game` | `test_extract_damage_text_death` | Cas negatif |
| `game` | `test_extract_damage_text_critical` | Variante avec suffixe |
| `game` | `test_hit_flash_timers_decay` | Lifecycle complet |
| `game` | `test_floating_text_expires` | Lifecycle complet |
| `gui` | `hp_display_returns_current_values` | Nominal |
| `gui` | `mana_display_returns_current_values` | Nominal |

### Tests existants non casses : 35 tests pre-existants passent toujours.

### Lacunes identifiees

1. **`push_text_returns_correct_width`** ne teste pas la fonction `BitmapFont::push_text()` reelle car il ne peut pas creer un `SpriteBatcher` sans GPU. Le test valide seulement le calcul mathematique equivalent. C'est acceptable mais note.

2. **Pas de test pour `draw_skill_panel`** en termes de rendu (impossible sans GPU), mais le toggle est teste (`skill_panel_toggled_by_k`).

3. **Pas de test pour `extract_damage_text` avec des messages vides ou Unicode** -- cas limite mineur.

---

## 4. Architecture et integration

### Pipeline de rendu

Le plan de Denis annonce 5 passes, mais le code en implemente 4 fonctionnelles + 1 submit :

| # | Passe | Camera | Texture | Code | Conforme |
|---|-------|--------|---------|------|----------|
| 1 | `sprite_pass` | Monde | `grass_texture` | lignes 743-766 | OK |
| 2 | `gui_pass` | Ecran (identity) | `gui_texture` | lignes 768-793 | OK |
| 3 | `gui_text_pass` | Ecran (identity) | `font_texture` | lignes 795-866 | OK |
| 4 | `float_text_pass` | Monde | `font_texture` | lignes 868-911 | OK |
| 5 | submit + present | -- | -- | lignes 913-914 | OK |

**Analyse** : Le pipeline est correct. Chaque passe utilise `LoadOp::Load` (sauf la premiere qui `Clear`) pour accumuler les couches. Le switch texture/camera entre passes est gere par `update_camera()` et `set_bind_group()`. L'incoherence avec le plan (qui annonce 5 passes) est cosmetique : le plan comptait submit comme passe 5, c'est correct.

### Integration bitmap font

- Le `BitmapFont` est stocke dans `GpuResources` et accessible via `res.font.texture.bind_group`
- `push_text()` est une methode statique qui prend un `&mut SpriteBatcher` -- design correct car le batcher est partage
- La texture font est bindee dans les passes 3 et 4 uniquement -- pas de conflit avec les textures monde/GUI

### Integration hit flash

- Le `HashMap<EntityId, u8>` est passe en reference a `batch_monsters()` -- pas de borrow conflict
- Le decay est fait une fois par frame dans `on_frame()` -- correct
- `saturating_sub(1)` evite les underflows sur `u8`

### Integration damage numbers

- Les positions sont calculees en coordonnees iso world-space (pas screen-space)
- La passe `float_text_pass` remet la camera monde avant de rendre -- correct pour le suivi camera
- Le fade alpha est calcule proportionnellement au TTL restant -- smooth

---

## 5. Points d'attention specifiques

### Camera snap

La camera snap a chaque frame avec `world_x = target_x; world_y = target_y`. C'est correct pour le MVP. La methode `camera.follow(px, py)` est appelee juste avant pour mettre a jour les targets. Pas de jitter possible car le snap est immediat.

### Skill panel

Le panneau est dessine quand `skill_panel_open` est `true` -- verifie dans `gui.rs:398-401`. Le rendu est en deux phases : quads de fond dans la passe GUI, texte dans la passe `gui_text_pass`. Les deux phases verifient `is_skill_panel_open()` -- coherent.

### Combat log

Le texte est rendu par-dessus les rectangles noirs existants (qui sont dans la passe GUI). Les positions sont alignees : `log_x = 16.0 + 4.0` (MARGIN + padding), `log_y = 16.0 + 2.0`. La hauteur par entree `18.0 + 2.0` correspond a `LOG_ENTRY_H + gap`. Conforme.

### Damage numbers

Les positions sont calculees en iso world-space : `iso_sx = (mx - my) * (TILE_WIDTH / 2.0)`, ce qui est coherent avec `batch_monsters()`. L'offset `-20.0` sur `world_sy` place le texte au-dessus du monstre. Le rendu en world-space avec camera follow fait que les nombres restent attaches au monstre pendant leur ascension.

---

## 6. Anomalies

| # | Severite | Description | Fichier | Ligne | Recommandation |
|---|----------|-------------|---------|-------|----------------|
| 1 | Mineure | Les noms de skills dans le panneau sont hardcodes (`["1: Attack", "2: Fire Bolt", ...]`) au lieu d'etre lus depuis le SkillBook/Registry du monde | `gui.rs` | 591 | Connecter au `content::act1_skills()` dans un sprint ulterieur |
| 2 | Mineure | `push_text_returns_correct_width` test ne valide pas la fonction reelle mais un calcul equivalent | `bitmap_font.rs` | 322-332 | Ajouter un test d'integration quand un mock SpriteBatcher sera disponible |
| 3 | Informatif | L'`expect()` a la ligne 659 de `gui.rs` est safe (donnee statique) mais viole la convention "pas d'unwrap/expect en prod" au sens strict | `gui.rs` | 659 | Peut etre remplace par un `match` + `tracing::error!` + retour d'un fallback si la convention stricte est appliquee |
| 4 | Informatif | Le plan annonce "50 tests dont 15 nouveaux" ce qui est exact (50 total confirme par le runner), mais le chiffre de "35 existants + 15 nouveaux" n'etait pas explicitement verifie | `PLAN-sprint1-p0-fixes.md` | 114 | Aucune action requise, chiffre confirme par l'audit |

---

## 7. Optimisations recommandees

| # | Impact | Description | Effort | Sprint |
|---|--------|-------------|--------|--------|
| 1 | Moyen | Reimplementer camera smooth follow avec un vrai `delta_time` au lieu du snap | Moyen | Sprint 2+ |
| 2 | Faible | Connecter les noms du skill panel au `SkillBook` reel du joueur | Faible | Sprint 2 |
| 3 | Faible | Ajouter des tests pour `extract_damage_text` avec string vide et Unicode | Faible | Sprint 2 |
| 4 | Faible | Remplacer `Vec::remove(0)` dans `push_combat_message` par un `VecDeque` pour O(1) | Faible | Sprint 2 |
| 5 | Moyen | Ajouter un systeme de batch des damage numbers identiques (ex: 2 monstres touches en meme temps) | Moyen | Sprint 3+ |

---

## 8. Metriques

| Metrique | Valeur |
|----------|--------|
| Tests sodomight-client | 50 (dont 15 nouveaux) |
| Tests workspace complet | 561+ (0 echecs) |
| Clippy warnings | 0 |
| Fichiers modifies | 3 (game.rs, gui.rs, lib.rs) |
| Fichier cree | 1 (bitmap_font.rs) |
| Lignes ajoutees (estimation) | ~500 |
| Annotations MSCM | 8/8 fichiers dans sodomight-client/src/ |
| Defauts bloquants | 0 |
| Defauts majeurs | 0 |
| Defauts mineurs | 2 |
| Defauts informatifs | 2 |
| Temps de build (incremental) | 0.41s |
| Temps de test | 0.50s (workspace complet) |

---

## 9. Checklist d'audit MIP v2

- [x] `cargo build --workspace` OK
- [x] `cargo test --workspace` OK (561+ tests, 0 echecs)
- [x] `cargo clippy --workspace -- -D warnings` propre (0 warnings)
- [x] Pas de `unwrap()` en production (hors `#[cfg(test)]`)
- [x] Pas d'URL hardcodees
- [x] Pas de donnees sensibles en clair
- [x] Annotations MSCM presentes sur tous les fichiers nouveaux/modifies
- [x] Lois d'Autonomie respectees (LOI-1 : font procedurale, LOI-3 : etat local)
- [x] `unsafe_code = "forbid"` dans workspace Cargo.toml
- [x] `#![deny(unsafe_code)]` dans les fichiers source

---

## 10. Conclusion

**Verdict : CONFORME -- GO pour livraison (P5)**

Les 4 bugs P0 et le delta critique DELTA-U01 sont tous resolus de maniere complete et conforme au brief de Maria et a la spec technique de Denis. Le code est propre, bien documente, teste, et respecte les conventions du projet. Les 2 defauts mineurs identifies n'impactent pas le gameplay et peuvent etre adresses dans des sprints ulterieurs.

**0 defaut BLOQUANT -- Gate P4 franchie.**

Le livrable peut etre transmis a Denis pour la phase P5 (livraison) et a Arianne pour archivage (P6).

---

*George -- MIP v2 Phase P4 Integration & Audit*
