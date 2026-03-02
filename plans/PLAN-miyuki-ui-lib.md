# Plan d'Execution Atomique P2 -- Miyuki UI Lib

**Date** : 2026-03-01
**Auteur** : Denis (P2 Plan d'execution)
**Classification MIP** : T5 -- Chantier strategique
**Statut** : P2 LIVRE -- Pret pour P3
**Reference** : `SPEC-miyuki-ui-lib.md` (P1 Denis)
**Estimation totale** : 7 sprints, ~5-7 semaines

---

## Table des matieres

1. [Sprint 1 -- miyuki-ui-tokens (Francois)](#sprint-1)
2. [Sprint 2 -- miyuki-ui-dioxus atoms (Lise)](#sprint-2)
3. [Sprint 3 -- miyuki-ui-dioxus molecules + organisms (Lise)](#sprint-3)
4. [Sprint 4 -- miyuki-ui-egui base + atoms D2 (Francois)](#sprint-4)
5. [Sprint 5 -- miyuki-ui-egui organisms D2 (Francois + Lise)](#sprint-5)
6. [Sprint 6 -- Migration apps existantes (Francois + Lise)](#sprint-6)
7. [Sprint 7 -- Integration, audit, polish](#sprint-7)

---

## Conventions

- **Chaque tache** est atomique (2-5 minutes d'implementation)
- **ID** : `UI-XXX` (numero sequentiel global)
- **Agent** : `F` = Francois (back/tokens), `L` = Lise (front/composants)
- **Deps** : taches prerequises (doivent etre terminees avant)
- **Critere** : test ou verification qui confirme la completion
- **Fichiers** : chemins exacts a creer ou modifier
- **Cycle TDD** : RED (ecrire le test) -> GREEN (implementer) -> REFACTOR -> clippy -> commit

---

## Sprint 1 -- miyuki-ui-tokens complet (Francois) {#sprint-1}

**Objectif** : Le crate `miyuki-ui-tokens` compile, tous les tests passent, clippy clean.
**Estimation** : 3-5 jours

### UI-001 : Creer le crate et le Cargo.toml

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | Aucune |
| Fichiers | `crates/miyuki-ui-tokens/Cargo.toml` |
| Action | Creer le repertoire et le Cargo.toml complet (voir spec 2.1) |
| Critere | `cargo check -p miyuki-ui-tokens` passe |
| Commit | `feat(ui-tokens): scaffold crate with Cargo.toml` |

### UI-002 : Implementer `color.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-001 |
| Fichiers | `crates/miyuki-ui-tokens/src/color.rs`, `crates/miyuki-ui-tokens/src/lib.rs` |
| Action | Implementer `Rgba` struct avec `new()`, `with_alpha()`, `to_css()`, `to_hex()`, `to_array()`, `alpha()`, `Display`. Ajouter `pub mod color;` et `pub use color::Rgba;` dans lib.rs |
| Tests | `to_hex` opaque, `to_hex` alpha, `to_css` opaque, `to_css` alpha, `to_array`, `alpha()` modification, `Display` trait |
| Critere | `cargo test -p miyuki-ui-tokens -- color` -- 7+ tests passent |
| Commit | `feat(ui-tokens): implement Rgba color type with CSS/hex/array conversions` |

### UI-003 : Implementer `spacing.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-001 |
| Fichiers | `crates/miyuki-ui-tokens/src/spacing.rs` |
| Action | Implementer `SpacingScale` struct avec `standard()` et `to_css_px()`. 11 niveaux (space_0 a space_16). |
| Tests | `standard().unit == 4.0`, `standard().space_4 == 16.0`, `to_css_px(16.0) == "16px"`, `to_css_px(0.0) == "0"` |
| Critere | `cargo test -p miyuki-ui-tokens -- spacing` -- 4+ tests passent |
| Commit | `feat(ui-tokens): implement SpacingScale (4px base, 11 levels)` |

### UI-004 : Implementer `typography.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-001 |
| Fichiers | `crates/miyuki-ui-tokens/src/typography.rs` |
| Action | Implementer `FontFamily` (5 const : COG_UI, COG_MONO, D2_TITLE, D2_BODY, D2_MONO), `FontWeight` (enum 5 variants), `FontSize` (struct px + line_height), `TypographyScale` (struct 8 tailles). |
| Tests | `FontFamily::COG_UI.to_css()` contient "Inter", `FontWeight::Bold.value() == 700`, `FontSize::new(14.0, 1.6).to_css() == "14px"` |
| Critere | `cargo test -p miyuki-ui-tokens -- typography` -- 3+ tests passent |
| Commit | `feat(ui-tokens): implement typography tokens (families, weights, sizes)` |

### UI-005 : Implementer `radius.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-001 |
| Fichiers | `crates/miyuki-ui-tokens/src/radius.rs` |
| Action | Implementer `RadiusScale` avec `cog()`, `d2()`, `to_css()`. 7 niveaux. |
| Tests | `cog().md == 4.0`, `d2().md == 2.0`, `to_css(9999.0) == "9999px"`, `to_css(0.0) == "0"` |
| Critere | `cargo test -p miyuki-ui-tokens -- radius` -- 4+ tests passent |
| Commit | `feat(ui-tokens): implement RadiusScale (COG + D2 variants)` |

### UI-006 : Implementer `shadow.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-002 (depend de Rgba) |
| Fichiers | `crates/miyuki-ui-tokens/src/shadow.rs` |
| Action | Implementer `Shadow` struct et `ShadowScale` avec `cog()` et `d2()`. |
| Tests | `Shadow::NONE.to_css() == "none"`, `ShadowScale::cog().sm.blur > 0.0`, `ShadowScale::d2().sm` existe |
| Critere | `cargo test -p miyuki-ui-tokens -- shadow` -- 3+ tests passent |
| Commit | `feat(ui-tokens): implement Shadow and ShadowScale` |

### UI-007 : Implementer `animation.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-001 |
| Fichiers | `crates/miyuki-ui-tokens/src/animation.rs` |
| Action | Implementer `TransitionDuration`, `Easing` (3 const), `TransitionScale`. |
| Tests | `TransitionDuration::new(200).to_css() == "200ms"`, `TransitionDuration::new(200).to_secs() == 0.2`, `Easing::STANDARD.to_css()` contient "cubic-bezier" |
| Critere | `cargo test -p miyuki-ui-tokens -- animation` -- 3+ tests passent |
| Commit | `feat(ui-tokens): implement animation tokens (durations, easings)` |

### UI-008 : Implementer `z_index.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-001 |
| Fichiers | `crates/miyuki-ui-tokens/src/z_index.rs` |
| Action | Implementer `ZIndexScale` avec `standard()`. 7 niveaux. |
| Tests | `standard().base == 0`, `standard().tooltip == 600`, `standard().modal > standard().overlay` |
| Critere | `cargo test -p miyuki-ui-tokens -- z_index` -- 3+ tests passent |
| Commit | `feat(ui-tokens): implement ZIndexScale` |

### UI-009 : Implementer `palette/mod.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-002 |
| Fichiers | `crates/miyuki-ui-tokens/src/palette/mod.rs` |
| Action | Creer le repertoire `palette/` et le struct `Palette` avec tous les champs (bg x6, text x4, accent x7, semantic x8, border x4 = 29 champs). |
| Critere | `cargo check -p miyuki-ui-tokens` passe |
| Commit | `feat(ui-tokens): define unified Palette struct` |

### UI-010 : Implementer `palette/cog.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-009 |
| Fichiers | `crates/miyuki-ui-tokens/src/palette/cog.rs` |
| Action | Implementer `COG_PALETTE` const avec toutes les valeurs COG (35+ couleurs). Reference : BRIEF Lise section 2.2. |
| Tests | `COG_PALETTE.bg_base.to_hex() == "#0e1015"`, `COG_PALETTE.accent_primary.to_hex() == "#1a9fff"`, `COG_PALETTE.text_high.r == 255` |
| Critere | `cargo test -p miyuki-ui-tokens -- cog` -- 3+ tests passent |
| Commit | `feat(ui-tokens): implement COG palette (35+ colors)` |

### UI-011 : Implementer `palette/d2.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-009 |
| Fichiers | `crates/miyuki-ui-tokens/src/palette/d2.rs` |
| Action | Implementer `D2_PALETTE` const + `D2QualityColors`, `D2ElementColors`, `D2OrbColors`, `D2MiscColors`, `D2SystemColors`. Reference : BRIEF Fabrice sections 2.1, BRIEF Lise section 3.2. |
| Tests | `D2_PALETTE.bg_primary.to_hex() == "#0a0805"`, `D2QualityColors::MAGIC.to_hex() == "#6969ff"`, `D2ElementColors::FIRE.r == 255`, `D2OrbColors::LIFE.to_hex() == "#b41414"`, `D2SystemColors::C4_GOLD.to_hex()` est correct |
| Critere | `cargo test -p miyuki-ui-tokens -- d2` -- 5+ tests passent |
| Commit | `feat(ui-tokens): implement D2 palette (40+ colors, quality/element/orb/system)` |

### UI-012 : Implementer `theme.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-009, UI-003, UI-004, UI-005, UI-006, UI-007, UI-008 |
| Fichiers | `crates/miyuki-ui-tokens/src/theme.rs` |
| Action | Implementer `UiTheme` struct composant Palette + SpacingScale + TypographyScale + RadiusScale + ShadowScale + TransitionScale + ZIndexScale. |
| Critere | `cargo check -p miyuki-ui-tokens` passe |
| Commit | `feat(ui-tokens): implement UiTheme composition struct` |

### UI-013 : Implementer `themes/cog.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-012, UI-010 |
| Fichiers | `crates/miyuki-ui-tokens/src/themes/mod.rs`, `crates/miyuki-ui-tokens/src/themes/cog.rs` |
| Action | Implementer `COG_THEME` const (UiTheme complet). Reference : BRIEF Lise sections 2.2-2.8. |
| Tests | `COG_THEME.name == "Miyukini Gaming (COG)"`, `COG_THEME.spacing.space_4 == 16.0`, `COG_THEME.typography.body.px == 14.0`, `COG_THEME.radius.md == 4.0` |
| Critere | `cargo test -p miyuki-ui-tokens -- cog_theme` -- 4+ tests passent |
| Commit | `feat(ui-tokens): implement COG theme (complete)` |

### UI-014 : Implementer `themes/d2.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-012, UI-011 |
| Fichiers | `crates/miyuki-ui-tokens/src/themes/d2.rs` |
| Action | Implementer `D2_THEME` const (UiTheme complet). Reference : BRIEF Lise section 3, BRIEF Fabrice section 2. |
| Tests | `D2_THEME.name == "Sodomight Medieval (D2)"`, `D2_THEME.typography.body.px == 12.0`, `D2_THEME.radius.md == 2.0` |
| Critere | `cargo test -p miyuki-ui-tokens -- d2_theme` -- 3+ tests passent |
| Commit | `feat(ui-tokens): implement D2 Medieval theme (complete)` |

### UI-015 : Finaliser `lib.rs` et re-exports

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-013, UI-014 |
| Fichiers | `crates/miyuki-ui-tokens/src/lib.rs` |
| Action | Completer lib.rs avec tous les `pub mod`, `pub use`, et la doc crate. Ajouter le crate au workspace COG `Cargo.toml`. |
| Critere | `cargo test -p miyuki-ui-tokens` -- TOUS les tests passent. `cargo clippy -p miyuki-ui-tokens -- -D warnings` clean. |
| Commit | `feat(ui-tokens): finalize public API and add to workspace` |

### UI-016 : Ajouter au workspace COG

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-015 |
| Fichiers | `Cargo.toml` (racine) |
| Action | Ajouter `"crates/miyuki-ui-tokens"` dans `[workspace] members`. |
| Critere | `cargo build -p miyuki-ui-tokens` depuis la racine passe |
| Commit | `chore: add miyuki-ui-tokens to COG workspace` |

**Gate Sprint 1** : `cargo test -p miyuki-ui-tokens` -- 30+ tests, 0 failure. `cargo clippy -p miyuki-ui-tokens -- -D warnings` -- 0 warning.

---

## Sprint 2 -- miyuki-ui-dioxus atoms (Lise) {#sprint-2}

**Objectif** : Le crate `miyuki-ui-dioxus` compile avec 10 atoms P0 fonctionnels.
**Estimation** : 3-5 jours
**Prerequis** : Sprint 1 complet

### UI-017 : Creer le crate miyuki-ui-dioxus

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-016 |
| Fichiers | `crates/miyuki-ui-dioxus/Cargo.toml`, `crates/miyuki-ui-dioxus/src/lib.rs` |
| Action | Creer le crate avec deps sur `miyuki-ui-tokens` et `dioxus 0.6`. Lib.rs minimal avec `pub mod context;` et `pub mod styles;`. Ajouter au workspace COG. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): scaffold crate` |

### UI-018 : Implementer `context.rs`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-017 |
| Fichiers | `crates/miyuki-ui-dioxus/src/context.rs` |
| Action | Implementer `ThemeSignal`, `provide_theme()`, `use_theme()`, `use_palette()`, `set_theme()`. Voir spec 3.3. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement ThemeProvider and use_theme hooks` |

### UI-019 : Implementer `styles.rs`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-017 |
| Fichiers | `crates/miyuki-ui-dioxus/src/styles.rs` |
| Action | Implementer les helpers CSS : `bg()`, `fg()`, `border()`, `border_radius()`, `padding()`, `padding_vh()`, `gap()`, `font_family()`, `font_size()`, `font_weight()`, `box_shadow()`, `transition()`, `css()`. Voir spec 3.4. |
| Tests | `bg(&Rgba::new(10, 20, 30))` contient "background", `css(&["color: red", "padding: 4px"])` concatene correctement |
| Critere | `cargo test -p miyuki-ui-dioxus -- styles` -- 2+ tests |
| Commit | `feat(ui-dioxus): implement CSS inline style helpers` |

### UI-020 : Implementer atom `Button`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018, UI-019 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/mod.rs`, `crates/miyuki-ui-dioxus/src/atoms/button.rs` |
| Action | Implementer `Button` composant avec `ButtonVariant` (Primary/Secondary/Ghost/Danger/IconOnly), `ButtonSize` (Sm/Md/Lg), props disabled/loading/on_click/children. Extraire TOUTES les variables avant `rsx!`. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe. Pas de nested braces dans RSX. |
| Commit | `feat(ui-dioxus): implement Button atom (5 variants, 3 sizes)` |

### UI-021 : Implementer atom `Text`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/text.rs` |
| Action | Implementer `Text` composant avec `TextVariant` (H1-H6/Body/Caption/Overline/Code), weight optionnel. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Text atom (10 variants)` |

### UI-022 : Implementer atom `TextInput`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018, UI-019 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/text_input.rs` |
| Action | Implementer `TextInput` avec `InputType` (Text/Password/Number/Search), placeholder, value, on_input, disabled, error, prefix, suffix. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement TextInput atom` |

### UI-023 : Implementer atom `Icon`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/icon.rs` |
| Action | Implementer `Icon` avec `IconSize` (Xs 12/Sm 16/Md 20/Lg 24/Xl 32), name, color optionnel. Utilise emoji ou SVG inline. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Icon atom (5 sizes)` |

### UI-024 : Implementer atom `Badge`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/badge.rs` |
| Action | Implementer `Badge` avec `BadgeVariant` (Default/Success/Warning/Error/Info/Sakura), `BadgeSize` (Sm/Md). |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Badge atom (6 variants)` |

### UI-025 : Implementer atom `Divider`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/divider.rs` |
| Action | Implementer `Divider` avec `Orientation` (Horizontal/Vertical), `DividerStyle` (Solid/Dashed). |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Divider atom` |

### UI-026 : Implementer atom `Spinner`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/spinner.rs` |
| Action | Implementer `Spinner` avec `SpinnerSize` (Sm/Md/Lg). Animation CSS rotate. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Spinner atom` |

### UI-027 : Implementer atom `ProgressBar`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018, UI-019 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/progress_bar.rs` |
| Action | Implementer `ProgressBar` avec value (0.0-1.0), `ProgressVariant` (Linear/Circular), color optionnel. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement ProgressBar atom` |

### UI-028 : Implementer atom `Avatar`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/avatar.rs` |
| Action | Implementer `Avatar` avec `AvatarShape` (Circle/Square), `AvatarSize` (Xs 24/Sm 32/Md 40/Lg 56/Xl 80), src/initials fallback. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Avatar atom` |

### UI-029 : Implementer atom `Tooltip`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018, UI-019 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/tooltip.rs` |
| Action | Implementer `Tooltip` avec content, `TooltipPosition` (Top/Bottom/Left/Right), delay_ms, children. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Tooltip atom` |

### UI-030 : Implementer atom `Checkbox`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/checkbox.rs` |
| Action | Implementer `Checkbox` avec checked, on_change, label, disabled, indeterminate. |
| Critere | `cargo check -p miyuki-ui-dioxus` passe |
| Commit | `feat(ui-dioxus): implement Checkbox atom` |

### UI-031 : Finaliser atoms mod.rs et lib.rs Sprint 2

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-020 a UI-030 |
| Fichiers | `crates/miyuki-ui-dioxus/src/atoms/mod.rs`, `crates/miyuki-ui-dioxus/src/lib.rs` |
| Action | Re-exporter tous les atoms dans `atoms/mod.rs`. Re-exporter `atoms`, `context`, `styles` dans `lib.rs`. |
| Critere | `cargo build -p miyuki-ui-dioxus` passe. `cargo clippy -p miyuki-ui-dioxus -- -D warnings` clean. |
| Commit | `feat(ui-dioxus): finalize atoms module with 12 P0 atoms` |

**Gate Sprint 2** : `cargo build -p miyuki-ui-dioxus` -- success. `cargo clippy -p miyuki-ui-dioxus -- -D warnings` -- 0 warning. 12 atoms compilent.

---

## Sprint 3 -- miyuki-ui-dioxus molecules + organisms + templates (Lise) {#sprint-3}

**Objectif** : molecules P0 + organisms P0 + templates P0 fonctionnels.
**Estimation** : 5-7 jours
**Prerequis** : Sprint 2 complet

### UI-032 : Implementer molecule `SearchBar`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-022, UI-023 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/mod.rs`, `crates/miyuki-ui-dioxus/src/molecules/search_bar.rs` |
| Action | Composer `TextInput` + `Icon` (loupe) + bouton clear optionnel. |
| Commit | `feat(ui-dioxus): implement SearchBar molecule` |

### UI-033 : Implementer molecule `FormField`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-021, UI-022 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/form_field.rs` |
| Action | Label + children (input) + message d'erreur optionnel. |
| Commit | `feat(ui-dioxus): implement FormField molecule` |

### UI-034 : Implementer molecule `Card`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-021, UI-023 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/card.rs` |
| Action | Conteneur avec header (icon+titre), body (children), footer optionnel, clickable. |
| Commit | `feat(ui-dioxus): implement Card molecule` |

### UI-035 : Implementer molecule `MenuItem`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-023 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/menu_item.rs` |
| Action | Icon + label + raccourci clavier + chevron si sous-menu. |
| Commit | `feat(ui-dioxus): implement MenuItem molecule` |

### UI-036 : Implementer molecule `Toast`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-023, UI-020 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/toast.rs` |
| Action | Icon + message + bouton dismiss. Variants Success/Warning/Error/Info. |
| Commit | `feat(ui-dioxus): implement Toast molecule` |

### UI-037 : Implementer molecule `TabItem`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-023, UI-024 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/tab_item.rs` |
| Action | Icon + label + count badge optionnel + close button optionnel. Etat actif/inactif. |
| Commit | `feat(ui-dioxus): implement TabItem molecule` |

### UI-038 : Implementer molecule `SidebarItem`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-023, UI-024 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/sidebar_item.rs` |
| Action | Icon + label + badge count + bordure active. |
| Commit | `feat(ui-dioxus): implement SidebarItem molecule` |

### UI-039 : Implementer molecule `SidebarSection`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-038 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/sidebar_section.rs` |
| Action | Titre de section + children (SidebarItems). Separateur automatique. |
| Commit | `feat(ui-dioxus): implement SidebarSection molecule` |

### UI-040 : Implementer molecule `ConfirmDialog`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-020, UI-021 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/confirm_dialog.rs` |
| Action | Question + bouton confirmer + bouton annuler. |
| Commit | `feat(ui-dioxus): implement ConfirmDialog molecule` |

### UI-041 : Implementer organisme `Modal`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-020, UI-021 |
| Fichiers | `crates/miyuki-ui-dioxus/src/organisms/mod.rs`, `crates/miyuki-ui-dioxus/src/organisms/modal.rs` |
| Action | Backdrop + carte + titre + contenu + actions. `ModalSize` (Sm/Md/Lg/Fullscreen). z-index correct. |
| Commit | `feat(ui-dioxus): implement Modal organism` |

### UI-042 : Implementer organisme `Form`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-033, UI-020 |
| Fichiers | `crates/miyuki-ui-dioxus/src/organisms/form.rs` |
| Action | Titre + children (FormFields) + boutons submit/cancel. |
| Commit | `feat(ui-dioxus): implement Form organism` |

### UI-043 : Implementer organisme `AppHeader`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-032, UI-028 |
| Fichiers | `crates/miyuki-ui-dioxus/src/organisms/app_header.rs` |
| Action | Logo + nav items + search bar + notifications + user profile. Sticky z-index. |
| Commit | `feat(ui-dioxus): implement AppHeader organism` |

### UI-044 : Implementer organisme `AppSidebar`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-039 |
| Fichiers | `crates/miyuki-ui-dioxus/src/organisms/app_sidebar.rs` |
| Action | Titre + sections + items + footer. Scrollable. |
| Commit | `feat(ui-dioxus): implement AppSidebar organism` |

### UI-045 : Implementer organisme `TabBar`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-037 |
| Fichiers | `crates/miyuki-ui-dioxus/src/organisms/tab_bar.rs` |
| Action | Liste de TabItems + gestion active + fermeture. |
| Commit | `feat(ui-dioxus): implement TabBar organism` |

### UI-046 : Implementer organisme `CardGrid`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-034 |
| Fichiers | `crates/miyuki-ui-dioxus/src/organisms/card_grid.rs` |
| Action | CSS grid responsive avec columns et gap configurables. |
| Commit | `feat(ui-dioxus): implement CardGrid organism` |

### UI-047 : Implementer template `DashboardLayout`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-043 |
| Fichiers | `crates/miyuki-ui-dioxus/src/templates/mod.rs`, `crates/miyuki-ui-dioxus/src/templates/dashboard_layout.rs` |
| Action | Header + sidebar optionnel + zone de contenu scrollable. Layout flex. |
| Commit | `feat(ui-dioxus): implement DashboardLayout template` |

### UI-048 : Implementer template `ServiceLayout`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-043, UI-044 |
| Fichiers | `crates/miyuki-ui-dioxus/src/templates/service_layout.rs` |
| Action | Header + sidebar service + contenu scrollable. |
| Commit | `feat(ui-dioxus): implement ServiceLayout template` |

### UI-049 : Implementer template `FullscreenLayout`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-018 |
| Fichiers | `crates/miyuki-ui-dioxus/src/templates/fullscreen_layout.rs` |
| Action | Fond plein ecran avec contenu centre. |
| Commit | `feat(ui-dioxus): implement FullscreenLayout template` |

### UI-050 : Implementer template `FormPageLayout`

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-049, UI-042 |
| Fichiers | `crates/miyuki-ui-dioxus/src/templates/form_page_layout.rs` |
| Action | FullscreenLayout + carte centree contenant un formulaire. |
| Commit | `feat(ui-dioxus): implement FormPageLayout template` |

### UI-051 : Finaliser molecules/organisms/templates + re-exports

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-032 a UI-050 |
| Fichiers | `crates/miyuki-ui-dioxus/src/molecules/mod.rs`, `crates/miyuki-ui-dioxus/src/organisms/mod.rs`, `crates/miyuki-ui-dioxus/src/templates/mod.rs`, `crates/miyuki-ui-dioxus/src/lib.rs` |
| Action | Re-exporter tous les modules. Mettre a jour lib.rs. |
| Critere | `cargo build -p miyuki-ui-dioxus` -- success. `cargo clippy -p miyuki-ui-dioxus -- -D warnings` -- 0 warning. |
| Commit | `feat(ui-dioxus): finalize molecules, organisms, templates` |

**Gate Sprint 3** : `cargo build -p miyuki-ui-dioxus` -- success. 9 molecules, 6 organisms, 4 templates compilent. clippy clean.

---

## Sprint 4 -- miyuki-ui-egui base + atoms D2 (Francois) {#sprint-4}

**Objectif** : Le crate `miyuki-ui-egui` compile avec les conversions et les atoms D2.
**Estimation** : 3-5 jours
**Prerequis** : Sprint 1 complet (tokens). Sprints 2-3 peuvent etre paralleles.

### UI-052 : Creer le crate miyuki-ui-egui

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-016 |
| Fichiers | `crates/miyuki-ui-egui/Cargo.toml`, `crates/miyuki-ui-egui/src/lib.rs` |
| Action | Creer le crate avec deps `miyuki-ui-tokens` et `egui 0.28`. Ajouter au workspace COG. |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): scaffold crate` |

### UI-053 : Implementer `convert.rs`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-052 |
| Fichiers | `crates/miyuki-ui-egui/src/convert.rs` |
| Action | Implementer `to_color32()`, `apply_theme()`. Configurer Visuals, Spacing depuis UiTheme. |
| Tests | `to_color32(&Rgba::new(255, 0, 0))` == `Color32::from_rgb(255, 0, 0)`, `apply_theme` ne panic pas avec COG_THEME et D2_THEME |
| Critere | `cargo test -p miyuki-ui-egui -- convert` -- 2+ tests |
| Commit | `feat(ui-egui): implement token-to-egui conversion and apply_theme` |

### UI-054 : Implementer atom `D2Button`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/mod.rs`, `crates/miyuki-ui-egui/src/atoms/d2_button.rs` |
| Action | Bouton D2 avec fond pierre, texte dore, variants Primary/Secondary/Menu. Utilise `ui.button()` avec style custom. |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement D2Button atom` |

### UI-055 : Implementer atom `HealthOrb`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/health_orb.rs` |
| Action | Orbe circulaire avec remplissage proportionnel bas-haut. Props: current, maximum, color (Life/Mana). Utilise `egui::Painter::circle_filled`. Reference : BRIEF Fabrice 1.1 (80x80px, orbe rouge/bleu). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement HealthOrb atom (life/mana circular fill)` |

### UI-056 : Implementer atom `SlotFrame`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/slot_frame.rs` |
| Action | Cadre de slot vide avec etats (normal/hovered/selected). Variants : Inventory (28x28), Equipment (38x38), Belt (36x36), Skill (40x40). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement SlotFrame atom (4 size variants)` |

### UI-057 : Implementer atom `QualityText`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/quality_text.rs` |
| Action | Texte colore par qualite d'item. Utilise `D2QualityColors`. Remplace `item_quality_color()` existant. |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement QualityText atom (7 rarity colors)` |

### UI-058 : Implementer atom `ProgressBar` egui

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/progress_bar.rs` |
| Action | Barre de progression horizontale. Variants XP (or, 5px), Stamina (jaune, 6px), Loading (or, 10px). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement ProgressBar atom (XP/Stamina/Loading)` |

### UI-059 : Implementer atom `GoldDisplay`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/gold_display.rs` |
| Action | Affichage de l'or avec icone. Variants HUD (compact) et Inventory (complet). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement GoldDisplay atom` |

### UI-060 : Implementer atom `PanelFrame`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/panel_frame.rs` |
| Action | Cadre gothique de panneau avec bordure or et fond pierre. Variants Standard/Ornate. Titre optionnel. |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement PanelFrame atom (gothic bordered panel)` |

### UI-061 : Implementer atom `TabButton`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/tab_button.rs` |
| Action | Onglet cliquable D2-style. Etats Active (lumineux) / Inactive (terne). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement TabButton atom` |

### UI-062 : Implementer atom `StatLabel`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/stat_label.rs` |
| Action | Label + valeur paire. Variants Standard/Bonus (vert)/Penalty (rouge). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement StatLabel atom` |

### UI-063 : Implementer atom `SeparatorLine`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/separator_line.rs` |
| Action | Separateur D2 horizontal. Variants Simple (ligne) / Ornate (losange central). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement SeparatorLine atom` |

### UI-064 : Implementer atom `ResistanceBar`

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-053 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/resistance_bar.rs` |
| Action | Barre de resistance coloree par element (Fire/Cold/Lightning/Poison). |
| Critere | `cargo check -p miyuki-ui-egui` passe |
| Commit | `feat(ui-egui): implement ResistanceBar atom` |

### UI-065 : Finaliser atoms egui + re-exports

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-054 a UI-064 |
| Fichiers | `crates/miyuki-ui-egui/src/atoms/mod.rs`, `crates/miyuki-ui-egui/src/lib.rs` |
| Action | Re-exporter tous les atoms. Mettre a jour lib.rs. |
| Critere | `cargo build -p miyuki-ui-egui` -- success. clippy clean. |
| Commit | `feat(ui-egui): finalize 12 D2 atoms` |

**Gate Sprint 4** : `cargo build -p miyuki-ui-egui` -- success. 12 atoms D2 compilent. clippy clean.

---

## Sprint 5 -- miyuki-ui-egui molecules + organisms D2 (Francois + Lise) {#sprint-5}

**Objectif** : Les molecules et organisms D2 sont implementes. Le HUD, l'inventaire, et les ecrans principaux sont fonctionnels.
**Estimation** : 5-7 jours
**Prerequis** : Sprint 4 complet

### UI-066 : Implementer molecule `InventorySlot`
| Agent | F | Deps | UI-056 | Commit | `feat(ui-egui): implement InventorySlot molecule` |

### UI-067 : Implementer molecule `EquipSlot`
| Agent | F | Deps | UI-056 | Commit | `feat(ui-egui): implement EquipSlot molecule` |

### UI-068 : Implementer molecule `SkillNode`
| Agent | F | Deps | UI-056, UI-062 | Commit | `feat(ui-egui): implement SkillNode molecule` |

### UI-069 : Implementer molecule `StatRow` (D2)
| Agent | F | Deps | UI-062, UI-054 | Commit | `feat(ui-egui): implement StatRow D2 molecule` |

### UI-070 : Implementer molecule `ResistanceRow`
| Agent | F | Deps | UI-064, UI-062 | Commit | `feat(ui-egui): implement ResistanceRow molecule` |

### UI-071 : Implementer molecule `BeltColumn`
| Agent | F | Deps | UI-056 | Commit | `feat(ui-egui): implement BeltColumn molecule` |

### UI-072 : Implementer molecule `TooltipLine`
| Agent | F | Deps | UI-057, UI-062 | Commit | `feat(ui-egui): implement TooltipLine molecule` |

### UI-073 : Implementer organisme `HudBar`
| Agent | F | Deps | UI-055, UI-056, UI-058, UI-059, UI-071 | Commit | `feat(ui-egui): implement HudBar organism (orbs, skills, belt, XP)` |

### UI-074 : Implementer organisme `InventoryPanel`
| Agent | F | Deps | UI-066, UI-067, UI-059 | Commit | `feat(ui-egui): implement InventoryPanel organism (paperdoll + grid)` |

### UI-075 : Implementer organisme `CharacterSheet`
| Agent | F | Deps | UI-069, UI-070 | Commit | `feat(ui-egui): implement CharacterSheet organism` |

### UI-076 : Implementer organisme `SkillTreePanel`
| Agent | L | Deps | UI-068, UI-061 | Commit | `feat(ui-egui): implement SkillTreePanel organism (3 tabs, nodes)` |

### UI-077 : Implementer organisme `ItemTooltip`
| Agent | F | Deps | UI-072, UI-063, UI-060 | Commit | `feat(ui-egui): implement ItemTooltip organism` |

### UI-078 : Implementer organisme `NpcDialog`
| Agent | L | Deps | UI-054, UI-060, UI-021 | Commit | `feat(ui-egui): implement NpcDialog organism` |

### UI-079 : Implementer organisme `GameMenu`
| Agent | L | Deps | UI-054, UI-060 | Commit | `feat(ui-egui): implement GameMenu organism` |

### UI-080 : Implementer templates `GameplayLayout` et `MenuLayout`
| Agent | L | Deps | UI-073 | Commit | `feat(ui-egui): implement GameplayLayout and MenuLayout templates` |

### UI-081 : Finaliser molecules/organisms/templates egui + re-exports

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-066 a UI-080 |
| Fichiers | Tous les `mod.rs` egui |
| Action | Re-exporter tous les modules. |
| Critere | `cargo build -p miyuki-ui-egui` -- success. clippy clean. |
| Commit | `feat(ui-egui): finalize D2 molecules, organisms, templates` |

**Gate Sprint 5** : `cargo build -p miyuki-ui-egui` -- success. HudBar, InventoryPanel, CharacterSheet, SkillTreePanel, ItemTooltip, NpcDialog, GameMenu compilent.

---

## Sprint 6 -- Migration apps existantes (Francois + Lise en parallele) {#sprint-6}

**Objectif** : Les apps existantes utilisent les nouveaux crates. L'ancien code est deprece.
**Estimation** : 3-5 jours
**Prerequis** : Sprints 3 et 5 complets

### UI-082 : Ajouter miyuki-ui-tokens et miyuki-ui-egui dans le workspace MGE

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-081 |
| Fichiers | `mge/Cargo.toml`, `mge/crates/engine/mge-ui/Cargo.toml` |
| Action | Ajouter les deps path relatif dans workspace et dans mge-ui. |
| Critere | `cd mge && cargo check -p mge-ui` passe |
| Commit | `feat(mge): add miyuki-ui-tokens and miyuki-ui-egui dependencies` |

### UI-083 : Migrer mge-ui theme.rs vers tokens

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-082 |
| Fichiers | `mge/crates/engine/mge-ui/src/theme.rs` |
| Action | Remplacer `D2Colors` par des re-exports depuis `miyuki_ui_tokens::palette::d2`. Remplacer `apply_d2_theme` par `miyuki_ui_egui::convert::apply_theme`. Garder `item_quality_color` comme wrapper. |
| Critere | `cd mge && cargo build --workspace` passe |
| Commit | `refactor(mge-ui): migrate theme to miyuki-ui-tokens` |

### UI-084 : Migrer apps/central vers miyuki-ui-dioxus (theme)

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-051 |
| Fichiers | `apps/central/Cargo.toml`, `apps/central/src/theme.rs`, `apps/central/src/main.rs` |
| Action | Ajouter dep `miyuki-ui-dioxus`. Remplacer `provide_theme` par le nouveau. Remplacer les appels `styles::xxx(theme)` par les composants. Supprimer ou deprecer `theme.rs`. |
| Critere | `cargo build -p miyukini-central-app` passe. L'app se lance et s'affiche. |
| Commit | `refactor(central): migrate to miyuki-ui-dioxus theme system` |

### UI-085 : Migrer apps/central composants vers miyuki-ui-dioxus

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-084 |
| Fichiers | `apps/central/src/components/header.rs`, `apps/central/src/components/tab_bar.rs`, `apps/central/src/components/service_card.rs`, etc. |
| Action | Remplacer les composants locaux par les organisms/molecules de `miyuki-ui-dioxus` (AppHeader, TabBar, Card, etc.). Migration progressive fichier par fichier. |
| Critere | `cargo build -p miyukini-central-app` passe. L'app se lance. |
| Commit | `refactor(central): migrate components to miyuki-ui-dioxus` |

### UI-086 : Deprecer miyukini-service-ui

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-051 |
| Fichiers | `crates/miyukini-service-ui/Cargo.toml`, `crates/miyukini-service-ui/src/lib.rs`, `crates/miyukini-service-ui/src/theme.rs`, `crates/miyukini-service-ui/src/styles.rs` |
| Action | Ajouter `miyuki-ui-dioxus` et `miyuki-ui-tokens` en deps. Remplacer tout le contenu par des re-exports `#[deprecated]`. Les 8 apps standalone continuent de compiler. |
| Critere | `cargo build --workspace` passe. Les 8 apps standalone compilent sans changement. |
| Commit | `deprecate(service-ui): re-export from miyuki-ui-dioxus with deprecation warnings` |

### UI-087 : Verifier compilation des 8 apps standalone

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-086 |
| Fichiers | Aucun changement (verification) |
| Action | `cargo build -p jayxpose -p jayfestival -p jaykoa -p jaykonta -p miyukiniwatch -p jay1tribu -p jaymanga -p miyuclicker` |
| Critere | Toutes les 8 apps compilent sans erreur |
| Commit | (pas de commit, verification seulement) |

**Gate Sprint 6** : `cargo build --workspace` passe. `cd mge && cargo build --workspace` passe. Les 8 apps standalone compilent. Les composants `central` utilisent `miyuki-ui-dioxus`.

---

## Sprint 7 -- Integration, audit, polish {#sprint-7}

**Objectif** : Tous les tests passent, clippy clean, documentation a jour, audit securite.
**Estimation** : 2-3 jours
**Prerequis** : Sprints 1-6 complets

### UI-088 : Tests d'integration cross-workspace

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-087 |
| Action | Executer la suite de tests complete dans les deux workspaces. Corriger les echecs. |
| Critere | `cargo test --workspace` et `cd mge && cargo test --workspace` -- 0 failure |
| Commit | `fix: resolve integration test failures` |

### UI-089 : Clippy clean complet

| Champ | Valeur |
|-------|--------|
| Agent | F |
| Deps | UI-088 |
| Action | `cargo clippy --workspace -- -D warnings` et `cd mge && cargo clippy --workspace -- -D warnings`. Corriger tous les warnings. |
| Critere | 0 warning dans les deux workspaces |
| Commit | `fix: resolve all clippy warnings` |

### UI-090 : Annotations MSCM sur tous les fichiers

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-088 |
| Action | Verifier que TOUS les fichiers source des 3 crates portent les annotations `@id`, `@do`, `@role`, `@layer`. Ajouter les manquantes. |
| Critere | 100% des fichiers annotes |
| Commit | `chore: add MSCM annotations to all miyuki-ui files` |

### UI-091 : Audit securite (Denis)

| Champ | Valeur |
|-------|--------|
| Agent | Denis |
| Deps | UI-089 |
| Action | Verifier : `unsafe_code = "forbid"` dans les 3 Cargo.toml. Aucun `unwrap()` en production. Aucune donnee sensible. Aucune dep reseau. Conformite LOI 1-8. |
| Critere | Audit passe -- rapport `.mip/audits/AUDIT-miyuki-ui-lib.md` produit |

### UI-092 : Test visuel manuel (Lise)

| Champ | Valeur |
|-------|--------|
| Agent | L |
| Deps | UI-088 |
| Action | Lancer `apps/central`, verifier tous les composants visuellement. Lancer `sodomight-client` (si compilable), verifier le HUD et les panneaux. |
| Critere | Aucun defaut visuel bloquant. Les couleurs, espacements, rayons correspondent aux specs. |

### UI-093 : Mise a jour MEMORY.md

| Champ | Valeur |
|-------|--------|
| Agent | Denis |
| Deps | UI-091 |
| Action | Ajouter dans MEMORY.md : les 3 nouveaux crates, les decisions techniques, la deprecation de miyukini-service-ui, le partage cross-workspace. |
| Commit | `docs: update MEMORY.md with miyuki-ui-lib decisions` |

### UI-094 : Livraison P5

| Champ | Valeur |
|-------|--------|
| Agent | Denis |
| Deps | UI-091, UI-092, UI-093 |
| Action | Presenter la librairie a l'utilisateur. Confirmer que les objectifs sont atteints. |
| Critere | Utilisateur confirme la livraison |

**Gate Sprint 7** : 0 test en echec, 0 clippy warning, 100% MSCM, audit securite passe, test visuel passe. LIVRAISON.

---

## Recapitulatif

| Sprint | Taches | Agent principal | Estimation | Gate |
|--------|--------|----------------|------------|------|
| 1 | UI-001 a UI-016 | Francois | 3-5j | tokens compile, 30+ tests, clippy clean |
| 2 | UI-017 a UI-031 | Lise | 3-5j | dioxus compile, 12 atoms |
| 3 | UI-032 a UI-051 | Lise | 5-7j | 9 molecules, 6 organisms, 4 templates |
| 4 | UI-052 a UI-065 | Francois | 3-5j | egui compile, 12 D2 atoms |
| 5 | UI-066 a UI-081 | Francois + Lise | 5-7j | D2 organisms fonctionnels |
| 6 | UI-082 a UI-087 | Francois + Lise | 3-5j | Migration complete, 8 apps compilent |
| 7 | UI-088 a UI-094 | Denis + tous | 2-3j | Audit, tests finaux, livraison |

**Total** : 94 taches, 24-37 jours ouvres (~5-7 semaines)

### Parallelisme possible

- Sprints 2+3 (Lise, Dioxus) et Sprint 4 (Francois, egui) peuvent etre executes en **parallele** car ils dependent uniquement du Sprint 1 (tokens).
- Sprint 5 necessite Sprint 4. Sprint 6 necessite Sprints 3+5.

```
                    Sprint 1 (F)
                    /           \
          Sprint 2 (L)       Sprint 4 (F)
              |                   |
          Sprint 3 (L)       Sprint 5 (F+L)
                    \           /
                    Sprint 6 (F+L)
                        |
                    Sprint 7 (Denis+tous)
```

Avec parallelisme, l'estimation passe a **4-5 semaines**.

---

## Dependances externes a verifier

1. **Dioxus 0.6** : Version exacte compatible avec le workspace COG. Verifier que `cargo build -p miyuki-ui-dioxus` ne conflit pas avec la version utilisee par `apps/central`.
2. **egui 0.28** : Version exacte du workspace MGE. Verifier compatibilite.
3. **Polices** : Trouver et integrer une police TTF libre style Exocet (Cinzel Decorative recommandee). Integrer Inter pour COG.

---

*Plan d'execution redige par Denis -- Chef Dev Senior, Miyukini AI Studio*
*Classification : T5 | Phase P2 | 94 taches atomiques | 7 sprints | Pret pour P3*
