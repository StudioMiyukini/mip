# Direction Artistique — Miyuki UI Library

**Date** : 2026-03-01
**Auteur** : Lise (P0 Direction Visuelle)
**Classification MIP** : T5 — Chantier strategique
**Statut** : P0 VALIDE
**Reference** : `BRIEF-miyuki-ui-lib.md` (Maria)

---

## 1. Inventaire de l'existant

### 1.1 Central Theme (`apps/central/src/theme.rs`) — 398 lignes

**Palette actuelle (18 couleurs)** :

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg_main` | `#171a21` | Fond principal (quasi-noir bleu) |
| `bg_header` | `#1b2838` | Fond header (bleu tres sombre) |
| `bg_card` | `#1e2329` | Fond cartes et panneaux |
| `bg_hover` | `#2a3f5f` | Survol, fond interactif |
| `bg_active` | `#1a9fff` | Element actif (bleu vif) |
| `bg_secondary` | `#232f3e` | Fond secondaire (sidebar, sections) |
| `text_primary` | `#c6d4df` | Texte principal (gris clair bleu) |
| `text_secondary` | `#8f98a0` | Texte secondaire (gris moyen) |
| `text_muted` | `#5c6873` | Texte discret (gris sombre) |
| `text_link` | `#66c0f4` | Liens et labels accent |
| `text_white` | `#ffffff` | Titres, texte sur fond sombre |
| `accent_blue` | `#1a9fff` | Accent primaire (CTA, onglet actif) |
| `accent_blue_hover` | `#66c0f4` | Accent primaire au survol |
| `accent_green` | `#5ba32b` | Succes, "installe", gratuit |
| `accent_orange` | `#ff6b00` | Avertissement |
| `accent_red` | `#c83737` | Erreur, danger |
| `border` | `#2a3f5f` | Bordures normales |
| `border_hover` | `#66c0f4` | Bordures au survol |

**Espacements** : `HEADER_HEIGHT: 40px`, `NAV_HEIGHT: 36px`, `PADDING: 16px`, `PADDING_SM: 8px`, `PADDING_LG: 24px`, `RADIUS: 4px`, `RADIUS_LG: 8px`

**Fonctions de style** (40+) : `main_container`, `header`, `nav_tab`, `content_area`, `tab_bar`, `service_tab`, `tab_close_btn`, `content_panel`, `service_card`, `service_icon_large`, `service_card_content`, `service_title`, `price_badge`, `search_input`, `user_profile`, `avatar`, `services_grid`, `section_title`, `type_badge`, `overlay_backdrop`, `modal_card`, `modal_title`, `modal_body_text`, `modal_label`, `modal_muted_small`, `btn_secondary`, `btn_primary`, `fullscreen_container`, `form_card`, `form_title`, `form_hint`, `form_input`, `form_btn_primary`, `form_error`, `link`

**Diagnostic** :
- Palette mono-theme (un seul variant `Gaming`). Pas de structure pour ajouter facilement un theme.
- Tous les tokens sont des `&'static str` (hex CSS). Pas de representation structuree.
- Pas de scale coherente pour les espacements (seulement 3 valeurs : 8, 16, 24).
- Pas d'ombres, pas de z-index, pas de breakpoints, pas d'animations.
- Les fonctions de style sont monolithiques (melangent layout + couleurs + typo).
- **Reutilisable** : La palette de couleurs. Le concept de fonctions `styles::xxx(theme)`.
- **A refaire** : Tout le reste. Structure tokens, scale d'espacements, typo, composants.

### 1.2 miyukini-service-ui (`crates/miyukini-service-ui/`) — Code duplique

**Constat** : Copie quasi identique (95%) de `central/theme.rs`. Ajoute :
- `sidebar()`, `sidebar_item()`, `sidebar_section_title()` — styles de sidebar
- `service_layout()`, `service_content()` — layout sidebar + contenu
- `type_badge_color()` — variant generique de `type_badge`
- `ThemeContext`, `use_theme()`, `use_palette()` — hooks Dioxus

**Reutilisable** : Les hooks `use_theme()` / `use_palette()`. Le pattern `ThemeContext`.
**A refaire** : Tout le code duplique. Les styles sidebar seront des composants Dioxus.

### 1.3 Composants Central (`apps/central/src/components/`) — 5 composants

| Composant | Lignes | Pattern | Reutilisabilite |
|-----------|--------|---------|-----------------|
| `Header` | 101 | Organisme. Navigation + recherche + profil. Specifique a Central. | Faible (trop couple a `AppState`). Le layout est reutilisable, pas le composant. |
| `TabBar` | 52 | Organisme. Onglets de services ouverts. | Moyenne. La logique de tabs est generique, le binding state est specifique. |
| `ServiceCard` | 69 | Molecule. Carte avec icone, titre, description, badges. | Elevee. Pattern generique. Props bien definies. |
| `ServiceGrid` | 126 | Organisme. Grille filtrable + `FilterButton` interne. | Elevee. Pattern generique. |
| `ServiceSidebar` | 371 | Organisme. Sidebar generique avec roles, sections, badges, footer. | Elevee. Bien concu, props completes, plusieurs variants (Logout, Info, Button). |
| `Calendar/*` | 7 fichiers | Organisme. Vues jour/semaine/mois + agenda. | Elevee. Generique, types bien definis. |

**Reutilisable** : `ServiceSidebar` (excellent pattern), `ServiceCard` (bon pattern), `Calendar/*` (composants generiques).
**A refaire** : `Header` et `TabBar` (trop couples). `ServiceGrid` (la grille est generique mais les filtres sont specifiques).

### 1.4 MGE UI (`mge/crates/engine/mge-ui/`) — Theme D2 + 11 ecrans

**Palette D2 (17 couleurs egui `Color32`)** :

| Token | RGB | Usage |
|-------|-----|-------|
| `BG_DARK` | `(10, 8, 5)` | Fond ecran principal (noir chaud) |
| `PANEL_BG` | `(28, 22, 14)` | Fond panneaux/fenetres |
| `PANEL_BORDER` | `(80, 60, 20)` | Bordures panneaux (or sombre) |
| `GOLD` | `(200, 165, 70)` | Labels, highlights, XP bar |
| `GOLD_BRIGHT` | `(255, 215, 0)` | Valeurs importantes, titres |
| `RED_LIFE` | `(180, 20, 20)` | Orbe de vie, danger |
| `BLUE_MANA` | `(20, 40, 180)` | Orbe de mana |
| `TEXT_NORMAL` | `(200, 190, 160)` | Texte standard (parchemin) |
| `TEXT_MAGIC` | `(100, 100, 255)` | Items magiques (bleu) |
| `TEXT_RARE` | `(255, 255, 100)` | Items rares (jaune) |
| `TEXT_UNIQUE` | `(165, 110, 0)` | Items uniques (or brun) |
| `TEXT_SET` | `(0, 180, 0)` | Items set (vert) |
| `TEXT_RUNE_WORD` | `(255, 165, 0)` | Runewords (orange) |
| `SKILL_ACTIVE` | `(255, 200, 50)` | Competence active/selectionnee |
| `SLOT_EMPTY` | `(40, 30, 15, 200)` | Fond slot vide (semi-transparent) |
| `SLOT_HOVER` | `(60, 50, 25, 220)` | Fond slot survol (semi-transparent) |

**Ecrans existants** :
- `draw_hud` : HUD complet (orbes vie/mana, hotbar 8 slots, belt 4 slots, XP bar, gold)
- `draw_inventory` : Grille 10x4 + equipement (silhouette D2, 10 slots)
- `draw_character_panel` : Stats base + derivees + resistances
- `draw_skill_tree` : Stub (a implementer)
- `draw_npc_dialog` : Dialogue NPC (ancre en bas)
- `draw_tooltip` : Tooltip item (qualite coloree, proprietes, affixes)
- `draw_minimap` : Stub (a implementer)
- `draw_main_menu` : Menu titre ("SODOMIGHT")
- `draw_char_select` : Selection de personnage
- `draw_lobby_browser` : Navigateur multijoueur
- `draw_pause_menu` : Menu pause

**Reutilisable** : La palette D2 entiere. Les concepts (orbe, slot, tooltip qualite). Les structs de donnees (HudData, UiItem, CharacterData, ItemTooltipData).
**A refaire** : Rien a "refaire", mais a faire consommer les tokens partages pour la coherence. Les composants restent egui-specifiques.

### 1.5 miyuwidgets (`crates/miyuwidgets/`) — Widgets HTML pur

Cinq rendus HTML pur (strings) : `text_render`, `image_render`, `button_render`, `grid_render`, `container_render`. Plus templates et layouts.

**Diagnostic** : Concu pour un usage web-only (pas Dioxus, pas egui). Tres simple, pas de theming. Sous gouvernance COG (`GovernedContext`).

**Decision** : Laisser independant. Ce crate sert un cas d'usage different (generation HTML cote serveur). Il n'a pas sa place dans la lib UI Atomic Design.

---

## 2. Direction Artistique — Theme COG ("Miyukini Gaming")

### 2.1 Identite visuelle

Le theme COG est l'identite visuelle de toutes les applications desktop et web Miyukini. Il s'inspire du style Steam (dark UI, navigation par onglets, grille de services) mais se distingue par une touche plus vivante, plus coloree, et un accent sur l'identite sakura (cerisier) de Miyukini.

**Mots-cles** : Moderne, sombre, gaming, technologique, vivant, professionnel.
**Inspiration primaire** : Steam, Discord, Spotify (dark UIs reussies).
**Distinction Miyukini** : Accent sakura (rose doux) en complement du bleu, touches de couleur vibrantes, micro-animations subtiles, iconographie personnalisee.

### 2.2 Palette de couleurs

#### 2.2.1 Backgrounds (6 niveaux de profondeur)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `bg_base` | `#0e1015` | `(14, 16, 21)` | Fond de l'application (le plus sombre) |
| `bg_primary` | `#171a21` | `(23, 26, 33)` | Fond principal des zones de contenu |
| `bg_secondary` | `#1b2838` | `(27, 40, 56)` | Header, sidebar, zones structurelles |
| `bg_surface` | `#1e2a3a` | `(30, 42, 58)` | Cartes, panneaux, elements eleves |
| `bg_elevated` | `#243447` | `(36, 52, 71)` | Elements sureleves (dropdowns, popovers) |
| `bg_overlay` | `#2a3f5f` | `(42, 63, 95)` | Overlay de survol, fond interactif |

#### 2.2.2 Texte (4 niveaux de hierarchie)

| Token | Hex | RGB | Contraste sur bg_primary | Usage |
|-------|-----|-----|-------------------------|-------|
| `text_high` | `#ffffff` | `(255, 255, 255)` | 15.3:1 | Titres, texte tres important |
| `text_primary` | `#c6d4df` | `(198, 212, 223)` | 10.8:1 | Texte de lecture principal |
| `text_secondary` | `#8f98a0` | `(143, 152, 160)` | 5.6:1 | Labels, descriptions, texte secondaire |
| `text_muted` | `#5c6873` | `(92, 104, 115)` | 3.3:1 | Placeholders, hints, texte desactive |

Tous les niveaux de texte respectent un ratio de contraste WCAG AA minimum (4.5:1 pour le corps de texte). `text_muted` est reserve aux elements non-essentiels (decoratifs, placeholders).

#### 2.2.3 Accent primaire (bleu Miyukini)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `accent_primary` | `#1a9fff` | `(26, 159, 255)` | CTA principaux, onglets actifs, liens |
| `accent_primary_hover` | `#47b3ff` | `(71, 179, 255)` | Survol de l'accent primaire |
| `accent_primary_active` | `#0d8ae6` | `(13, 138, 230)` | Clic/pression sur l'accent primaire |
| `accent_primary_subtle` | `#1a9fff1a` | alpha 10% | Fond subtil accent (badges, selections) |

#### 2.2.4 Accent secondaire (sakura Miyukini)

Le rose sakura est la signature visuelle Miyukini, utilise avec parcimonie pour distinguer la marque.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `accent_sakura` | `#e8a0bf` | `(232, 160, 191)` | Accent marque, favoris, elements speciaux |
| `accent_sakura_hover` | `#f0b8d0` | `(240, 184, 208)` | Survol sakura |
| `accent_sakura_subtle` | `#e8a0bf1a` | alpha 10% | Fond subtil sakura |

#### 2.2.5 Couleurs semantiques (etats)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `success` | `#5ba32b` | `(91, 163, 43)` | Succes, valide, installe, en ligne |
| `success_subtle` | `#5ba32b1a` | alpha 10% | Fond succes discret |
| `warning` | `#ff9c1a` | `(255, 156, 26)` | Avertissement, attention requise |
| `warning_subtle` | `#ff9c1a1a` | alpha 10% | Fond warning discret |
| `error` | `#e04040` | `(224, 64, 64)` | Erreur, danger, suppression |
| `error_subtle` | `#e040401a` | alpha 10% | Fond erreur discret |
| `info` | `#66c0f4` | `(102, 192, 244)` | Information, aide, note |
| `info_subtle` | `#66c0f41a` | alpha 10% | Fond info discret |

#### 2.2.6 Bordures (3 niveaux)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `border_subtle` | `#1e2a3a` | `(30, 42, 58)` | Separateurs discrets, lignes de grille |
| `border_default` | `#2a3f5f` | `(42, 63, 95)` | Bordures standard (cartes, inputs) |
| `border_strong` | `#3d5a80` | `(61, 90, 128)` | Bordures marquees (survol, focus) |
| `border_accent` | `#1a9fff` | `(26, 159, 255)` | Bordure d'element actif/selectionne |

### 2.3 Typographie

#### 2.3.1 Familles de polices

| Usage | Famille | Fallback |
|-------|---------|----------|
| **Interface (UI)** | `'Inter'` | `'Segoe UI', -apple-system, sans-serif` |
| **Titres (display)** | `'Inter'` (bold/semibold) | meme fallback |
| **Code (monospace)** | `'JetBrains Mono'` | `'Cascadia Code', 'Fira Code', monospace` |

Inter est choisie pour sa lisibilite a petite taille, ses variantes optiques, et son support multi-langues. Elle est open-source (OFL).

#### 2.3.2 Echelle typographique (base 14px)

| Token | Taille | Poids | Line-height | Usage |
|-------|--------|-------|-------------|-------|
| `text_xs` | 10px | 400 | 1.4 | Badges, mentions legales, compteurs |
| `text_sm` | 12px | 400 | 1.5 | Labels secondaires, descriptions, hints |
| `text_body` | 14px | 400 | 1.6 | Texte de lecture principal |
| `text_lg` | 16px | 500 | 1.5 | Sous-titres, labels importants |
| `text_xl` | 18px | 600 | 1.4 | Titres de section |
| `text_2xl` | 24px | 700 | 1.3 | Titres de page |
| `text_3xl` | 32px | 700 | 1.2 | Titres principaux, hero text |
| `text_4xl` | 40px | 800 | 1.1 | Display, splash screen |

#### 2.3.3 Poids de police

| Token | Valeur | Usage |
|-------|--------|-------|
| `weight_regular` | 400 | Texte courant |
| `weight_medium` | 500 | Labels, navigation |
| `weight_semibold` | 600 | Titres de section, headers |
| `weight_bold` | 700 | Titres de page, emphase forte |
| `weight_extrabold` | 800 | Display, titres hero |

### 2.4 Espacements

Base : **4px**. Toutes les valeurs sont des multiples de 4px.

| Token | Valeur | Multiples | Usage |
|-------|--------|-----------|-------|
| `space_0` | 0px | x0 | Aucun espacement |
| `space_1` | 4px | x1 | Micro-espacement (gap entre icone et texte dans un badge) |
| `space_2` | 8px | x2 | Petit espacement (gap dans les groupes, padding de badge) |
| `space_3` | 12px | x3 | Espacement moyen-petit (padding de bouton vertical) |
| `space_4` | 16px | x4 | Espacement standard (padding de carte, gap de grille) |
| `space_5` | 20px | x5 | Espacement moyen-grand |
| `space_6` | 24px | x6 | Grand espacement (padding de section, margin de titre) |
| `space_8` | 32px | x8 | Tres grand espacement (separation de sections) |
| `space_10` | 40px | x10 | Espacement de layout (hauteur de header) |
| `space_12` | 48px | x12 | Espacement de layout large |
| `space_16` | 64px | x16 | Espacement macro (margins de page, padding de hero) |

### 2.5 Coins arrondis

| Token | Valeur | Usage |
|-------|--------|-------|
| `radius_none` | 0px | Elements plein bord (images full-width) |
| `radius_sm` | 2px | Elements tres subtils (badges, tags) |
| `radius_md` | 4px | Elements standard (boutons, inputs, cartes) |
| `radius_lg` | 8px | Cartes elevees, modaux, panneaux |
| `radius_xl` | 12px | Elements arrondis (tooltips, toasts) |
| `radius_2xl` | 16px | Elements tres arrondis (avatars carres, chips) |
| `radius_full` | 9999px | Cercles (avatars ronds, badges ronds, pillules) |

### 2.6 Ombres (elevation)

| Token | Valeur CSS | Usage |
|-------|-----------|-------|
| `shadow_none` | `none` | Elements plats (boutons ghost, texte) |
| `shadow_sm` | `0 1px 2px rgba(0,0,0,0.3)` | Elements legererement eleves (cartes au repos) |
| `shadow_md` | `0 4px 12px rgba(0,0,0,0.4)` | Cartes en survol, dropdowns |
| `shadow_lg` | `0 8px 24px rgba(0,0,0,0.5)` | Modaux, panneaux flottants |
| `shadow_xl` | `0 16px 48px rgba(0,0,0,0.6)` | Overlays principaux, notifications empilees |

Les ombres sont volontairement fortes (opacite elevee) car le fond est sombre. Sur fond sombre, des ombres subtiles sont invisibles.

### 2.7 Animations et transitions

| Token | Valeur | Usage |
|-------|--------|-------|
| `transition_fast` | `100ms` | Changement de couleur, opacite |
| `transition_normal` | `200ms` | Hover, focus, toggle |
| `transition_slow` | `300ms` | Ouverture de panneau, expansion |
| `transition_entrance` | `400ms` | Apparition d'element (fade-in, slide-in) |
| `easing_default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Mouvement standard (Material motion) |
| `easing_entrance` | `cubic-bezier(0, 0, 0.2, 1)` | Entree (deceleration) |
| `easing_exit` | `cubic-bezier(0.4, 0, 1, 1)` | Sortie (acceleration) |

### 2.8 Z-index

| Token | Valeur | Usage |
|-------|--------|-------|
| `z_base` | 0 | Contenu normal |
| `z_dropdown` | 100 | Menus deroulants, popovers |
| `z_sticky` | 200 | Headers, barres de navigation |
| `z_overlay` | 300 | Backdrop modal, dim |
| `z_modal` | 400 | Contenu modal |
| `z_notification` | 500 | Toasts, notifications |
| `z_tooltip` | 600 | Tooltips |

---

## 3. Direction Artistique — Theme D2 Medieval ("Sodomight")

### 3.1 Identite visuelle

Le theme D2 Medieval est une reproduction fidele de l'esthetique de Diablo II. Il vise l'atmosphere sombre, gothique, et immersive du jeu original.

**Mots-cles** : Sombre, medieval, gothique, atmospherique, usure, or terni.
**Inspiration primaire** : Diablo II: Lord of Destruction (2001), Diablo II: Resurrected (2021).
**Principe directeur** : L'interface doit donner l'impression d'etre un objet medieval (parchemin, metal forge, bois use) et non un logiciel moderne.

### 3.2 Palette de couleurs

#### 3.2.1 Fonds (surfaces medievales)

| Token | Hex | RGB | Texture | Usage |
|-------|-----|-----|---------|-------|
| `d2_bg_void` | `#050402` | `(5, 4, 2)` | Noir profond chaud | Fond ecran principal, zones vides |
| `d2_bg_dark` | `#0a0805` | `(10, 8, 5)` | Pierre noire | Fond de l'application |
| `d2_bg_panel` | `#1c160e` | `(28, 22, 14)` | Bois sombre / cuir | Fenetres, panneaux |
| `d2_bg_slot` | `#28201090` | `(40, 32, 16, 144)` | Pierre usee | Slots d'inventaire vides |
| `d2_bg_slot_hover` | `#3c3219dc` | `(60, 50, 25, 220)` | Pierre eclairee | Slot survole |
| `d2_bg_input` | `#0f0d08` | `(15, 13, 8)` | Cuir sombre | Fond de champs de saisie |

#### 3.2.2 Or et metaux (accent primaire)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `d2_gold` | `#c8a546` | `(200, 165, 70)` | Accent principal, labels, XP bar, titres de section |
| `d2_gold_bright` | `#ffd700` | `(255, 215, 0)` | Titres importants, valeurs critiques, nom de personnage |
| `d2_gold_dark` | `#503c14` | `(80, 60, 20)` | Bordures, cadres, ornements |
| `d2_copper` | `#b87333` | `(184, 115, 51)` | Elements de metal cuivre |
| `d2_silver` | `#a0a0a0` | `(160, 160, 160)` | Elements de metal argent |

#### 3.2.3 Couleurs de vie/mana

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `d2_red_life` | `#b41414` | `(180, 20, 20)` | Orbe de vie, degats, danger |
| `d2_red_dark` | `#6e0e0e` | `(110, 14, 14)` | Fond de l'orbe de vie |
| `d2_blue_mana` | `#1428b4` | `(20, 40, 180)` | Orbe de mana |
| `d2_blue_dark` | `#0e1464` | `(14, 20, 100)` | Fond de l'orbe de mana |

#### 3.2.4 Qualite des items (system de rarete D2)

| Token | Hex | RGB | Rarete |
|-------|-----|-----|--------|
| `d2_quality_normal` | `#c8bea0` | `(200, 190, 160)` | Normal (blanc/parchemin) |
| `d2_quality_magic` | `#6464ff` | `(100, 100, 255)` | Magique (bleu) |
| `d2_quality_rare` | `#ffff64` | `(255, 255, 100)` | Rare (jaune) |
| `d2_quality_unique` | `#a56e00` | `(165, 110, 0)` | Unique (or brun) |
| `d2_quality_set` | `#00b400` | `(0, 180, 0)` | Set (vert) |
| `d2_quality_rune` | `#ffa500` | `(255, 165, 0)` | Runeword (orange) |
| `d2_quality_craft` | `#ff8c00` | `(255, 140, 0)` | Crafted (orange sombre) |

#### 3.2.5 Elements divers

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `d2_skill_active` | `#ffc832` | `(255, 200, 50)` | Competence selectionnee |
| `d2_poison_green` | `#00c800` | `(0, 200, 0)` | Degats poison |
| `d2_fire_orange` | `#ff6600` | `(255, 102, 0)` | Degats feu |
| `d2_cold_blue` | `#6699ff` | `(102, 153, 255)` | Degats froid |
| `d2_lightning_yellow` | `#ffff00` | `(255, 255, 0)` | Degats foudre |

#### 3.2.6 Texte

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `d2_text_normal` | `#c8bea0` | `(200, 190, 160)` | Texte courant (ton parchemin) |
| `d2_text_disabled` | `#605a46` | `(96, 90, 70)` | Texte desactive |
| `d2_text_title` | `#ffd700` | `(255, 215, 0)` | Titres principaux |
| `d2_text_label` | `#c8a546` | `(200, 165, 70)` | Labels de sections |

### 3.3 Typographie D2

| Usage | Famille ideale | Fallback | Notes |
|-------|---------------|----------|-------|
| **Titres** | `'Exocet'` ou clone (AvQest, Diablo) | `'Cinzel', serif` | Serif gothique. Police Exocet non open-source, utiliser un clone libre. |
| **Corps** | `'Formal436 BT'` ou equivalent | `'Georgia', serif` | Serif classique pour le texte de jeu |
| **Stats/Valeurs** | Monospace medieval | `'Courier New', monospace` | Pour les valeurs numeriques alignees |

#### Echelle typographique D2

| Token | Taille | Usage |
|-------|--------|-------|
| `d2_text_xs` | 8px | Raccourcis clavier, indicateurs de slot |
| `d2_text_sm` | 10px | Valeurs de stats, tooltips, durabilite |
| `d2_text_body` | 12px | Texte de jeu, descriptions, dialogues |
| `d2_text_lg` | 14px | Titres de panneaux, noms d'items |
| `d2_text_xl` | 16px | Sous-titres menu |
| `d2_text_title` | 24px | Titres de menu |
| `d2_text_display` | 48px | Logo/titre du jeu |

### 3.4 Decorations medievales

#### Bordures et cadres

| Element | Description |
|---------|-------------|
| **Cadre standard** | Bordure or sombre (`d2_gold_dark`, 2px) avec coins legerement arrondis (2px) |
| **Cadre ornemente** | Double bordure : exterieure or sombre, interieure or clair (1px gap) |
| **Separateur** | Ligne horizontale or sombre (1px) avec degradee aux extremites (fade-out) |
| **Coins** | Petits ornements aux 4 coins des panneaux importants (motif fleur-de-lys ou noeud celtique) |

#### Motifs de fond

| Element | Description |
|---------|-------------|
| **Texture pierre** | Bruit Perlin subtil sur les fonds sombres (opacite 3-5%) |
| **Texture cuir** | Gradient radial subtil sur les panneaux (plus clair au centre) |
| **Grille inventaire** | Lignes fines `(40, 30, 15)` a 0.5px |

#### Effets speciaux

| Element | Description |
|---------|-------------|
| **Orbes** | Remplissage progressif du bas vers le haut, reflet circulaire en haut |
| **Cooldown** | Overlay noir semi-transparent (alpha 160) couvrant la portion en cooldown |
| **Hover slot** | Fond legerement eclairci + bordure or au survol |
| **Item drop** | Texte flottant avec couleur de qualite au-dessus de l'item au sol |

### 3.5 Ambiance sonore (pour reference, pas dans le crate tokens)

- Clics de bouton : son metallique sourd (type clic d'armure)
- Ouverture inventaire : son de sac/tissu
- Fermeture panneau : son de bois/porte
- Equiper objet : son metallique (arme) ou son de tissu (armure)
- Potion : son de verre/liquide

---

## 4. Catalogue Atomic Design — Composants

### 4.1 Atoms (elements de base, indivisibles)

| # | Nom | Description | Backend | Priorite |
|---|-----|-------------|---------|----------|
| A01 | `Button` | Bouton avec variants : `primary`, `secondary`, `ghost`, `danger`, `icon-only`. Tailles : `sm`, `md`, `lg`. Etats : normal, hover, active, disabled, loading. | COG + MGE | P0 |
| A02 | `TextInput` | Champ texte. Types : `text`, `password`, `number`, `search`. Etats : normal, focus, error, disabled. Placeholder, prefixe, suffixe. | COG + MGE | P0 |
| A03 | `Text` | Composant texte avec variants semantiques. Niveaux : `h1`-`h6`, `body`, `caption`, `overline`, `code`. Poids et couleur configurables. | COG + MGE | P0 |
| A04 | `Icon` | Conteneur d'icone. Tailles : `xs`(12), `sm`(16), `md`(20), `lg`(24), `xl`(32). Couleur heritee ou explicite. Support emoji et SVG (COG) ou atlas (MGE). | COG + MGE | P0 |
| A05 | `Badge` | Badge/tag avec texte court. Variants : `default`, `success`, `warning`, `error`, `info`, `sakura`. Tailles : `sm`, `md`. | COG | P0 |
| A06 | `Checkbox` | Case a cocher avec label optionnel. Etats : unchecked, checked, indeterminate, disabled. | COG + MGE | P0 |
| A07 | `Radio` | Bouton radio avec label. Groupe par `name`. | COG | P1 |
| A08 | `Toggle` | Interrupteur on/off. Tailles : `sm`, `md`. Label optionnel. | COG | P1 |
| A09 | `Slider` | Curseur horizontal. Min/max/step/value. Label de valeur optionnel. | COG + MGE | P1 |
| A10 | `ProgressBar` | Barre de progression. Variants : `linear`, `circular`. Mode : `determinate` (0-100%), `indeterminate`. | COG + MGE | P0 |
| A11 | `Divider` | Separateur. Orientation : `horizontal`, `vertical`. Style : `solid`, `dashed`, `ornate` (D2). | COG + MGE | P0 |
| A12 | `Avatar` | Avatar utilisateur. Formes : `circle`, `square`. Tailles : `xs`(24), `sm`(32), `md`(40), `lg`(56), `xl`(80). Fallback initiale. | COG | P0 |
| A13 | `Tooltip` | Info-bulle au survol. Positions : `top`, `bottom`, `left`, `right`. Delai d'apparition configurable. | COG + MGE | P0 |
| A14 | `Skeleton` | Placeholder de chargement. Formes : `rect`, `circle`, `text`. Animation pulse. | COG | P1 |
| A15 | `Spinner` | Indicateur de chargement rotatif. Tailles : `sm`, `md`, `lg`. | COG | P0 |
| A16 | `Kbd` | Touche de clavier affichee (raccourci). | COG + MGE | P2 |
| A17 | `Orb` | Orbe de vie/mana (D2-specific). Remplissage proportionnel bas-haut. Couleur, valeur cur/max. | MGE | P0 |
| A18 | `Slot` | Emplacement d'objet/competence. Fond vide/hover/actif. Overlay cooldown. Tailles configurables. | MGE | P0 |
| A19 | `QualityText` | Texte colore par qualite d'item (normal, magic, rare, unique, set, rune). | MGE | P0 |
| A20 | `Select` | Menu deroulant de selection. Options avec labels, icones optionnelles. | COG | P1 |
| A21 | `Textarea` | Zone de texte multi-lignes. Rows configurable, resize optionnel. | COG | P1 |

### 4.2 Molecules (combinaisons d'atoms)

| # | Nom | Description | Backend | Priorite |
|---|-----|-------------|---------|----------|
| M01 | `SearchBar` | Input de recherche + icone loupe + bouton clear optionnel. | COG | P0 |
| M02 | `FormField` | Label + Input + message d'erreur optionnel. Variants : standard, inline. | COG | P0 |
| M03 | `Card` | Conteneur : image/icone header + titre + description + footer actions. Clickable optionnel. | COG | P0 |
| M04 | `MenuItem` | Icone + label + raccourci clavier optionnel + chevron si sous-menu. | COG + MGE | P0 |
| M05 | `Toast` | Notification temporaire. Variants : `success`, `warning`, `error`, `info`. Icone + message + dismiss. | COG | P0 |
| M06 | `StatRow` | Label + valeur + indicateur (fleche haut/bas, barre). Pour dashboards et stats. | COG + MGE | P1 |
| M07 | `TabItem` | Icone + label + compteur optionnel + bouton fermer optionnel. Etat actif/inactif. | COG | P0 |
| M08 | `SidebarItem` | Icone + label + badge compteur + bordure active. | COG | P0 |
| M09 | `SidebarSection` | Titre de section + liste de `SidebarItem`. Separateur automatique. | COG | P0 |
| M10 | `UserBadge` | Avatar + nom + sous-texte (role, statut). Compact ou etendu. | COG | P1 |
| M11 | `PriceBadge` | Badge de prix/statut ("Gratuit", "Installe", prix). Variantes colorees. | COG | P1 |
| M12 | `Breadcrumb` | Fil d'Ariane avec separateurs. Dernier element non-cliquable. | COG | P2 |
| M13 | `EquipSlot` | Slot d'equipement avec label ("Tete", "Corps"). Item optionnel avec nom et couleur de qualite. | MGE | P0 |
| M14 | `SkillSlot` | Slot de competence avec icone, numero de raccourci, cout mana, overlay cooldown. | MGE | P0 |
| M15 | `BeltSlot` | Slot de potion avec icone, quantite, raccourci clavier. | MGE | P0 |
| M16 | `StatRowD2` | Label + valeur + bouton "+" optionnel. Style medieval. | MGE | P0 |
| M17 | `ResistanceRow` | Label resistance + pourcentage colore (rouge si negatif, or si max). | MGE | P0 |
| M18 | `Pagination` | Navigation par pages : precedent, numeros, suivant. | COG | P2 |
| M19 | `EmptyState` | Illustration + titre + description + CTA optionnel. Pour les listes vides. | COG | P1 |
| M20 | `ConfirmDialog` | Question + deux boutons (confirmer/annuler). | COG + MGE | P1 |

### 4.3 Organisms (sections de page)

| # | Nom | Description | Backend | Priorite |
|---|-----|-------------|---------|----------|
| O01 | `AppHeader` | Header complet : logo + navigation principale + recherche + notifications + profil. | COG | P0 |
| O02 | `AppSidebar` | Sidebar avec titre, roles, sections, items, footer. Regroupe SidebarSection + SidebarItem. | COG | P0 |
| O03 | `TabBar` | Barre d'onglets avec ajout, fermeture, reordonnancement. | COG | P0 |
| O04 | `DataTable` | Tableau de donnees avec headers triables, lignes, pagination, actions. | COG | P1 |
| O05 | `Modal` | Fenetre modale : backdrop + carte + titre + contenu + actions. Tailles : `sm`, `md`, `lg`, `fullscreen`. | COG | P0 |
| O06 | `Form` | Formulaire complet : titre + champs + validation + boutons soumettre/annuler. | COG | P0 |
| O07 | `CardGrid` | Grille responsive de cartes avec filtres et tri optionnels. | COG | P0 |
| O08 | `ServiceCardGrid` | CardGrid specialisee : cartes de services avec badges type, statut installation, favoris. | COG | P1 |
| O09 | `SettingsPanel` | Liste de sections de parametres avec labels, descriptions, et controles (toggles, selects, inputs). | COG | P1 |
| O10 | `CommandPalette` | Palette de commandes (style Ctrl+K) : recherche + liste d'actions. | COG | P2 |
| O11 | `HUD` | HUD complet de gameplay : orbes vie/mana, hotbar skills (8 slots), belt (4 slots), XP bar, gold, level. | MGE | P0 |
| O12 | `InventoryPanel` | Panneau inventaire : equipement (silhouette) + grille 10x4 + or. | MGE | P0 |
| O13 | `CharacterPanel` | Panneau stats : infos personnage, stats de base (avec +), stats derivees, resistances. | MGE | P0 |
| O14 | `SkillTreePanel` | Arbre de competences par classe avec 3 colonnes, noeuds interconnectes, prerequis. | MGE | P1 |
| O15 | `NpcDialog` | Fenetre de dialogue NPC ancree en bas. Texte + options de reponse + bouton fermer. | MGE | P0 |
| O16 | `ItemTooltip` | Tooltip item detaille : nom (couleur qualite), type, proprietes magiques, affixes, durabilite, requirements. | MGE | P0 |
| O17 | `Minimap` | Mini-carte en haut a droite. Fond sombre + blips entites + fog of war. Toggle plein ecran. | MGE | P1 |
| O18 | `GameMenu` | Menu de jeu (titre, nouvelle partie, charger, multijoueur, options, quitter). Style D2. | MGE | P0 |
| O19 | `CalendarView` | Vue calendrier avec modes jour/semaine/mois. Navigation et evenements. | COG | P1 |
| O20 | `NotificationCenter` | Centre de notifications : liste de toasts avec historique, groupement, actions. | COG | P2 |

### 4.4 Templates (layouts de page)

| # | Nom | Description | Backend | Priorite |
|---|-----|-------------|---------|----------|
| T01 | `DashboardLayout` | Header + (optionnel: sidebar) + zone de contenu scrollable. Le layout standard COG. | COG | P0 |
| T02 | `ServiceLayout` | Header + sidebar service + contenu scrollable. Pour tous les services (JayFestival, JayKoa, etc.). | COG | P0 |
| T03 | `FullscreenLayout` | Fond plein ecran avec contenu centre. Pour connexion, rite d'entree, splash. | COG | P0 |
| T04 | `FormPageLayout` | FullscreenLayout avec carte centree contenant un formulaire. | COG | P0 |
| T05 | `SettingsLayout` | Sidebar categories + panneau de parametres. | COG | P1 |
| T06 | `DetailLayout` | Header minimal + contenu large + panneau lateral optionnel. Pour pages de detail. | COG | P1 |
| T07 | `GameplayLayout` | Plein ecran sans chrome. HUD en overlay. Pour le jeu en cours. | MGE | P0 |
| T08 | `MenuLayout` | Plein ecran avec fond sombre. Contenu centre. Pour les menus du jeu. | MGE | P0 |
| T09 | `SplitPanelLayout` | Deux panneaux redimensionnables cote a cote. Pour editeurs, comparaisons. | COG | P2 |

### 4.5 Pages (instances de template, specifiques a chaque application)

Les pages ne font pas partie de la lib UI. Elles sont specifiques a chaque application et utilisent les templates + organisms de la lib. Exemples de pages par application :

**Central** :
- Page d'accueil (Salon) : `DashboardLayout` + `CardGrid`
- Page services (Bibliotheque) : `DashboardLayout` + `ServiceCardGrid`
- Page de connexion : `FormPageLayout` + `Form`
- Page de rite d'entree : `FullscreenLayout`
- Page profil : `Modal` (overlay)

**Services (JayFestival, JayKoa, JayKonta, etc.)** :
- Dashboard service : `ServiceLayout` + `CardGrid`/`DataTable`
- Detail entite : `ServiceLayout` + `DetailLayout`
- Parametres service : `ServiceLayout` + `SettingsPanel`

**MGE (Sodomight)** :
- Ecran titre : `MenuLayout` + `GameMenu`
- En jeu : `GameplayLayout` + `HUD` + panneaux overlay
- Selection personnage : `MenuLayout` + grille

---

## 5. Organisation du crate `miyuki-ui-tokens`

### 5.1 Structure des fichiers

```
crates/miyuki-ui-tokens/
  Cargo.toml
  src/
    lib.rs              # Re-exports publics, documentation du crate
    color.rs            # Struct Rgba, conversions (CSS hex, CSS rgba, egui Color32 array)
    spacing.rs          # SpacingScale (4px base, 17 niveaux)
    typography.rs       # FontFamily, FontWeight, FontScale, TextStyle
    radius.rs           # RadiusScale (7 niveaux)
    shadow.rs           # Shadow struct, ShadowScale (5 niveaux)
    animation.rs        # Duration, Easing, TransitionScale
    z_index.rs          # ZIndexScale (7 niveaux)
    palette.rs          # Palette struct (bg, text, accent, semantic, border)
    theme.rs            # UiTheme = composition de tous les tokens. Trait ThemeProvider.
    themes/
      mod.rs            # Re-exports des themes pre-construits
      cog.rs            # Theme COG "Miyukini Gaming" — palette + tokens complets
      d2.rs             # Theme D2 "Sodomight Medieval" — palette + tokens complets
```

### 5.2 API publique ciblee

```rust
// crates/miyuki-ui-tokens/src/lib.rs

//! Design tokens agnostiques pour l'ecosysteme UI Miyukini.
//!
//! Ce crate ne depend d'aucun framework graphique. Il definit les valeurs
//! de design (couleurs, espacements, typographie, etc.) consommees par les
//! crates adaptateurs (`miyuki-ui-dioxus`, `miyuki-ui-egui`).

pub mod color;
pub mod spacing;
pub mod typography;
pub mod radius;
pub mod shadow;
pub mod animation;
pub mod z_index;
pub mod palette;
pub mod theme;
pub mod themes;

// Re-exports principaux
pub use color::Rgba;
pub use spacing::SpacingScale;
pub use typography::{FontFamily, FontWeight, FontScale, TextStyle};
pub use radius::RadiusScale;
pub use shadow::{Shadow, ShadowScale};
pub use animation::{Duration, Easing, TransitionScale};
pub use z_index::ZIndexScale;
pub use palette::Palette;
pub use theme::UiTheme;
pub use themes::{COG_THEME, D2_THEME};
```

### 5.3 Decisions techniques

| Decision | Justification |
|----------|---------------|
| **Pas de `no_std`** | Le crate utilise `String` pour les conversions CSS (`to_hex()`, `to_css()`). `no_std` serait possible avec `alloc` mais n'apporte rien ici. |
| **Pas de `serde` par defaut** | Feature flag `serde` optionnel pour serialisation. La majorite des usages n'a pas besoin de serialiser les tokens. |
| **`const` partout** | Tous les themes pre-construits et toutes les valeurs de tokens sont `const`. Resolution a la compilation, zero allocation runtime. |
| **Conversions explicites** | Pas de `From<Rgba> for egui::Color32`. Le crate tokens ne connait pas egui. Les conversions sont dans les crates adaptateurs. |
| **Couleurs en `Rgba` (u8)** | Coherent avec le standard web (0-255 par canal). Compatible sans conversion avec CSS et egui. |
| **Spacing en `f32`** | Compatible avec les deux mondes : CSS (conversion en `{n}px`) et egui (utilise directement des f32). |

### 5.4 Cargo.toml

```toml
[package]
name = "miyuki-ui-tokens"
version = "0.1.0"
edition = "2021"
description = "Design tokens for the Miyukini UI ecosystem"
publish = false

[lints.rust]
unsafe_code = "forbid"

[lints.clippy]
all = "warn"
pedantic = "warn"

[features]
default = []
serde = ["dep:serde"]

[dependencies]
serde = { version = "1", features = ["derive"], optional = true }
```

---

## 6. Parcours utilisateur et flux

### 6.1 Parcours COG (Central)

```
Lancement Central
  |
  v
[FullscreenLayout] Splash screen Miyukini (logo + loader)
  |
  v
[FormPageLayout] Rite d'Entree (premiere utilisation)
  OU
[FormPageLayout] Connexion (retour utilisateur)
  |
  v
[DashboardLayout] Salon (page d'accueil)
  |- Header : navigation SALON | SERVICES | COMMUNAUTE | PROFIL
  |- Zone de contenu : widgets recents, favoris, news
  |
  +---> [SERVICES] via header
  |       [DashboardLayout] Grille de services filtrable
  |       Click sur un service -->
  |         [ServiceLayout] Vue du service (sidebar + contenu)
  |           |- Sidebar : sections du service
  |           |- Contenu : dashboard, listes, formulaires
  |
  +---> [PROFIL] via avatar header
  |       [Modal] Fenetre profil
  |       OU [SettingsLayout] Parametres complets
  |
  +---> Tab Bar : onglets de services ouverts
          Click = switch entre services
          X = fermer l'onglet
```

### 6.2 Parcours MGE (Sodomight)

```
Lancement Sodomight
  |
  v
[MenuLayout] Menu principal
  |- Nouvelle partie --> [MenuLayout] Selection personnage
  |- Charger partie --> [MenuLayout] Liste de sauvegardes
  |- Multijoueur --> [MenuLayout] Lobby browser
  |- Options --> [MenuLayout] Parametres
  |- Quitter
  |
  v (Nouvelle partie / Charger)
[GameplayLayout] En jeu
  |- HUD (toujours visible) : orbes, hotbar, belt, XP, gold
  |- Overlays (toggles clavier) :
  |    I --> InventoryPanel
  |    C --> CharacterPanel
  |    T --> SkillTreePanel
  |    Q --> QuestLog
  |    Tab --> Minimap grande
  |- Dialogues NPC (contextuels)
  |- Tooltips items (au survol)
  |- Echap --> [MenuLayout] Menu pause
```

---

## 7. Recommandations d'implementation

### 7.1 Ordre de construction recommande

**Sprint 1 — Fondations** (tokens + premiers atoms)
1. `miyuki-ui-tokens` : `color.rs`, `spacing.rs`, `typography.rs`, `radius.rs`
2. `miyuki-ui-tokens` : `palette.rs`, `shadow.rs`, `animation.rs`, `z_index.rs`
3. `miyuki-ui-tokens` : `theme.rs`, `themes/cog.rs`, `themes/d2.rs`
4. `miyuki-ui-dioxus` : `styles.rs` (conversion tokens vers CSS inline)
5. `miyuki-ui-dioxus` : `context.rs` (ThemeProvider, use_theme, use_palette)
6. `miyuki-ui-dioxus` : atoms `Button`, `Text`, `Icon`, `Divider`

**Sprint 2 — Atoms complets + premieres molecules**
7. `miyuki-ui-dioxus` : atoms `TextInput`, `Badge`, `Checkbox`, `Spinner`, `ProgressBar`, `Avatar`, `Tooltip`
8. `miyuki-ui-dioxus` : molecules `SearchBar`, `FormField`, `Card`, `TabItem`, `SidebarItem`

**Sprint 3 — Organisms + templates**
9. `miyuki-ui-dioxus` : molecules `Toast`, `MenuItem`, `SidebarSection`, `EmptyState`
10. `miyuki-ui-dioxus` : organisms `Modal`, `Form`, `AppHeader`, `AppSidebar`, `TabBar`, `CardGrid`
11. `miyuki-ui-dioxus` : templates `DashboardLayout`, `ServiceLayout`, `FullscreenLayout`, `FormPageLayout`

**Sprint 4 — Migration Central**
12. Migrer `apps/central/src/theme.rs` vers `miyuki-ui-tokens`
13. Migrer `apps/central/src/components/` vers `miyuki-ui-dioxus`
14. Deprecer `miyukini-service-ui` (re-export)

**Sprint 5 — Adaptateur egui (MGE)**
15. `miyuki-ui-egui` : conversion tokens vers egui Style/Visuals
16. Migrer `mge/crates/engine/mge-ui/src/theme.rs` vers `miyuki-ui-tokens`

### 7.2 Regles de design

1. **Chaque composant Dioxus a des props typees** : `#[derive(Props, Clone, PartialEq)]`
2. **Chaque composant documente** : doc-comment avec description et exemple d'usage
3. **Pas de style en dur** : tout passe par les tokens ou les fonctions `styles::xxx(theme)`
4. **Extraction avant RSX** : toute expression conditionnelle est dans un `let` avant `rsx!{}`
5. **Accessibilite** : `role`, `aria-label`, contraste minimum WCAG AA sur tous les textes lisibles
6. **Taille minimum interactive** : 44x44px pour tout element cliquable (WCAG 2.5.8)
7. **Focus visible** : bordure `border_accent` sur focus pour la navigation clavier

### 7.3 Coherence entre les deux themes

Les tokens partagent la meme structure (`UiTheme`) mais des valeurs radicalement differentes :

| Aspect | COG | D2 Medieval |
|--------|-----|-------------|
| Temperature | Froide (bleu) | Chaude (or, brun) |
| Luminosite | Sombre mais lisible | Tres sombre, atmospherique |
| Coins | Arrondis (4-8px) | Quasi-carres (2px) |
| Ombres | Elevees, nettes | Minimales, ambiance par couleur |
| Texte | Sans-serif (Inter) | Serif (Exocet/Cinzel, Georgia) |
| Accent | Bleu + sakura | Or + rouge sang |
| Decorations | Aucune | Ornements, cadres, textures |

---

## 8. Resume

Ce document definit la direction visuelle complete de la librairie `miyuki-ui` :

- **Inventaire** de 5 ilots UI existants, avec analyse de reutilisabilite
- **Theme COG** : palette de 35+ couleurs, 10 niveaux d'espacement, echelle typographique 8 tailles, 7 niveaux de radius, 5 niveaux d'ombre, 4 durees d'animation, 7 niveaux de z-index
- **Theme D2 Medieval** : palette fidele Diablo II (25+ couleurs), typographie gothique, decorations medievales
- **Catalogue Atomic Design** : 21 atoms, 20 molecules, 20 organisms, 9 templates
- **Structure du crate tokens** : 12 fichiers source, zero dependance graphique
- **Parcours utilisateur** : flux COG (Central) et flux MGE (Sodomight)
- **Plan d'implementation** : 5 sprints ordonnes

Ce brief sert de reference visuelle pour toute l'equipe. Denis s'en sert pour la specification technique (P1), Francois et Lise pour l'implementation (P3), George pour l'audit (P4).

---

*Direction artistique par Lise — P0 Direction Visuelle*
*Classification : T5 | Librairie miyuki-ui multi-backend*
