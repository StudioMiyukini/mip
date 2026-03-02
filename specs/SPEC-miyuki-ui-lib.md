# Specification Technique P1 -- Miyuki UI Lib

**Date** : 2026-03-01
**Auteur** : Denis (P1 Specification technique)
**Classification MIP** : T5 -- Chantier strategique
**Statut** : P1 LIVRE -- Pret pour P2
**Sources** :
- `BRIEF-miyuki-ui-lib.md` (Maria, P0)
- `BRIEF-miyuki-ui-lib-d2-analysis.md` (Fabrice, P0)
- `BRIEF-miyuki-ui-lib-art-direction.md` (Lise, P0)

---

## Table des matieres

1. [Architecture globale](#1-architecture-globale)
2. [Crate miyuki-ui-tokens](#2-crate-miyuki-ui-tokens)
3. [Crate miyuki-ui-dioxus](#3-crate-miyuki-ui-dioxus)
4. [Crate miyuki-ui-egui](#4-crate-miyuki-ui-egui)
5. [Partage entre workspaces](#5-partage-entre-workspaces)
6. [Migration de l'existant](#6-migration-de-lexistant)
7. [Strategie de tests](#7-strategie-de-tests)
8. [Securite et conformite](#8-securite-et-conformite)
9. [Annotations MSCM](#9-annotations-mscm)
10. [Decisions techniques verrouillees](#10-decisions-techniques-verrouillees)

---

## 1. Architecture globale

### 1.1 Vue d'ensemble

Trois crates forment la librairie UI unifiee Miyukini :

```
crates/
  miyuki-ui-tokens/      # Couche 0 -- Design tokens purs, zero dep graphique
  miyuki-ui-dioxus/      # Couche 1 -- Adaptateur Dioxus 0.6 (COG + apps)
  miyuki-ui-egui/        # Couche 1 -- Adaptateur egui 0.28 (MGE)
```

Le flux de dependances est strictement unidirectionnel :

```
miyuki-ui-tokens  <----  miyuki-ui-dioxus  (depend de tokens)
                  <----  miyuki-ui-egui    (depend de tokens)
```

Aucune dependance circulaire. Aucune dependance croisee entre dioxus et egui.

### 1.2 Positionnement dans la pyramide COG

| Crate | Strate COG | Justification |
|-------|-----------|---------------|
| `miyuki-ui-tokens` | Strate 5 (Toolkit) | Outil pur, zero dep framework |
| `miyuki-ui-dioxus` | Strate 6 (Toolkit UI) | Composants reutilisables Dioxus |
| `miyuki-ui-egui` | Strate 6 (Toolkit UI) | Composants reutilisables egui |

### 1.3 Consommateurs

| Consommateur | Crate utilise | Workspace |
|-------------|--------------|-----------|
| `apps/central` | `miyuki-ui-dioxus` | COG |
| `apps/jayxpose`, `apps/jayfestival`, `apps/jaykoa`, `apps/jaykonta`, `apps/miyukiniwatch`, `apps/jay1tribu`, `apps/jaymanga`, `apps/miyuclicker` | `miyuki-ui-dioxus` (via `miyukini-service-ui` en phase transitoire) | COG |
| `mge/crates/engine/mge-ui` | `miyuki-ui-egui` | MGE |
| `mge/games/sodomight-client` | `miyuki-ui-egui` (indirect via mge-ui) | MGE |

---

## 2. Crate `miyuki-ui-tokens`

### 2.1 Cargo.toml

```toml
# @id: MUIT-Cargo @do: build-config @role: infra @layer: 5 @human: miyuk
# miyuki-ui-tokens -- Design tokens agnostiques pour l'ecosysteme UI Miyukini

[package]
name = "miyuki-ui-tokens"
version = "0.1.0"
edition = "2021"
rust-version = "1.75"
description = "Design tokens for the Miyukini UI ecosystem -- colors, spacing, typography, themes"
publish = false

[lints.rust]
unsafe_code = "forbid"

[lints.clippy]
all = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
doc_markdown = "allow"
missing_errors_doc = "allow"
missing_panics_doc = "allow"
must_use_candidate = "allow"

[features]
default = []
serde = ["dep:serde"]

[dependencies]
serde = { version = "1", features = ["derive"], optional = true }
```

### 2.2 Structure des fichiers

```
crates/miyuki-ui-tokens/
  Cargo.toml
  src/
    lib.rs              # Re-exports publics, doc crate
    color.rs            # Struct Rgba, conversions CSS/hex/array
    spacing.rs          # SpacingScale (base 4px, 11 niveaux)
    typography.rs       # FontFamily, FontWeight, FontSize, TextStyle
    radius.rs           # RadiusScale (7 niveaux)
    shadow.rs           # Shadow, ShadowScale (5 niveaux)
    animation.rs        # TransitionDuration, Easing, TransitionScale
    z_index.rs          # ZIndexScale (7 niveaux)
    palette/
      mod.rs            # Struct CogPalette, D2Palette, Palette enum
      cog.rs            # Valeurs palette COG (35+ couleurs)
      d2.rs             # Valeurs palette D2 (40+ couleurs)
    theme.rs            # UiTheme = composition de tous les tokens
    themes/
      mod.rs            # Re-exports COG_THEME, D2_THEME
      cog.rs            # Theme COG "Miyukini Gaming" complet
      d2.rs             # Theme D2 "Sodomight Medieval" complet
```

### 2.3 API publique -- `lib.rs`

```rust
// @id: MUIT-Lib @do: public-api @role: exports @layer: 5

//! Design tokens agnostiques pour l'ecosysteme UI Miyukini.
//!
//! Ce crate ne depend d'aucun framework graphique. Il definit les valeurs
//! de design (couleurs, espacements, typographie, etc.) consommees par les
//! crates adaptateurs (`miyuki-ui-dioxus`, `miyuki-ui-egui`).
//!
//! # Usage
//!
//! ```rust
//! use miyuki_ui_tokens::{COG_THEME, D2_THEME, Rgba};
//!
//! let bg = COG_THEME.palette.bg_base;
//! assert_eq!(bg.to_hex(), "#0e1015");
//!
//! let d2_gold = D2_THEME.palette.accent_primary;
//! let array = d2_gold.to_array(); // [200, 165, 70, 255]
//! ```

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
pub use typography::{FontFamily, FontWeight, FontSize, TextStyle};
pub use radius::RadiusScale;
pub use shadow::{Shadow, ShadowScale};
pub use animation::{TransitionDuration, Easing, TransitionScale};
pub use z_index::ZIndexScale;
pub use palette::Palette;
pub use theme::UiTheme;
pub use themes::{COG_THEME, D2_THEME};
```

### 2.4 Module `color.rs`

```rust
// @id: MUIT-Color @do: color-type @role: token @layer: 5

/// RGBA color with 8 bits per channel.
///
/// All color values in the Miyukini UI ecosystem use this type.
/// Conversions to CSS, hex, and raw arrays are provided for use
/// by framework-specific adaptors.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Rgba {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Rgba {
    /// Create a new fully opaque color.
    pub const fn new(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b, a: 255 }
    }

    /// Create a new color with explicit alpha.
    pub const fn with_alpha(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self { r, g, b, a }
    }

    /// CSS rgba() string: `"rgba(r, g, b, a)"` where a is 0.0-1.0.
    pub fn to_css(&self) -> String {
        if self.a == 255 {
            format!("rgb({}, {}, {})", self.r, self.g, self.b)
        } else {
            let alpha = f64::from(self.a) / 255.0;
            format!("rgba({}, {}, {}, {alpha:.2})", self.r, self.g, self.b)
        }
    }

    /// CSS hex string: `"#rrggbb"` (opaque) or `"#rrggbbaa"` (with alpha).
    pub fn to_hex(&self) -> String {
        if self.a == 255 {
            format!("#{:02x}{:02x}{:02x}", self.r, self.g, self.b)
        } else {
            format!("#{:02x}{:02x}{:02x}{:02x}", self.r, self.g, self.b, self.a)
        }
    }

    /// Raw `[r, g, b, a]` array for use with egui `Color32::from_rgba_premultiplied`.
    pub const fn to_array(self) -> [u8; 4] {
        [self.r, self.g, self.b, self.a]
    }

    /// Apply a different alpha value, returning a new color.
    pub const fn alpha(self, a: u8) -> Self {
        Self { r: self.r, g: self.g, b: self.b, a }
    }
}

impl core::fmt::Display for Rgba {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}
```

### 2.5 Module `spacing.rs`

```rust
// @id: MUIT-Spacing @do: spacing-scale @role: token @layer: 5

/// Spacing scale based on a 4px unit.
///
/// All spacing values in the UI system are multiples of the base unit.
/// This ensures visual consistency and alignment across all components.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct SpacingScale {
    /// Base unit in logical pixels (typically 4.0).
    pub unit: f32,
    /// 0px -- no spacing.
    pub space_0: f32,
    /// 4px (1x) -- micro-gap (icon-text in badge).
    pub space_1: f32,
    /// 8px (2x) -- small gap (group items, badge padding).
    pub space_2: f32,
    /// 12px (3x) -- medium-small (button vertical padding).
    pub space_3: f32,
    /// 16px (4x) -- standard (card padding, grid gap).
    pub space_4: f32,
    /// 20px (5x) -- medium-large.
    pub space_5: f32,
    /// 24px (6x) -- large (section padding, title margin).
    pub space_6: f32,
    /// 32px (8x) -- x-large (section separation).
    pub space_8: f32,
    /// 40px (10x) -- layout (header height).
    pub space_10: f32,
    /// 48px (12x) -- layout large.
    pub space_12: f32,
    /// 64px (16x) -- macro (page margins, hero padding).
    pub space_16: f32,
}

impl SpacingScale {
    /// Standard Miyukini spacing scale (base 4px).
    pub const fn standard() -> Self {
        Self {
            unit: 4.0,
            space_0: 0.0,
            space_1: 4.0,
            space_2: 8.0,
            space_3: 12.0,
            space_4: 16.0,
            space_5: 20.0,
            space_6: 24.0,
            space_8: 32.0,
            space_10: 40.0,
            space_12: 48.0,
            space_16: 64.0,
        }
    }

    /// Convert a spacing value to CSS pixel string (e.g. "16px").
    pub fn to_css_px(value: f32) -> String {
        if value == 0.0 {
            "0".to_string()
        } else {
            format!("{value}px")
        }
    }
}
```

### 2.6 Module `typography.rs`

```rust
// @id: MUIT-Typography @do: font-tokens @role: token @layer: 5

/// Font family specification.
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FontFamily {
    /// Primary font name (e.g. "Inter").
    pub primary: &'static str,
    /// Fallback chain (e.g. "'Segoe UI', -apple-system, sans-serif").
    pub fallback: &'static str,
}

impl FontFamily {
    /// COG UI font (Inter).
    pub const COG_UI: Self = Self {
        primary: "Inter",
        fallback: "'Segoe UI', -apple-system, sans-serif",
    };

    /// COG monospace font.
    pub const COG_MONO: Self = Self {
        primary: "JetBrains Mono",
        fallback: "'Cascadia Code', 'Fira Code', monospace",
    };

    /// D2 title font (Exocet-like).
    pub const D2_TITLE: Self = Self {
        primary: "Cinzel Decorative",
        fallback: "'Cinzel', serif",
    };

    /// D2 body font.
    pub const D2_BODY: Self = Self {
        primary: "Georgia",
        fallback: "'Times New Roman', serif",
    };

    /// D2 monospace for stats.
    pub const D2_MONO: Self = Self {
        primary: "Courier New",
        fallback: "monospace",
    };

    /// Full CSS font-family string.
    pub fn to_css(&self) -> String {
        format!("'{}', {}", self.primary, self.fallback)
    }
}

/// Font weight enum.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
#[repr(u16)]
pub enum FontWeight {
    Regular = 400,
    Medium = 500,
    SemiBold = 600,
    Bold = 700,
    ExtraBold = 800,
}

impl FontWeight {
    /// CSS numeric value.
    pub const fn value(self) -> u16 {
        self as u16
    }
}

/// Font size step in the typographic scale.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FontSize {
    /// Size in logical pixels.
    pub px: f32,
    /// Recommended line-height multiplier.
    pub line_height: f32,
}

impl FontSize {
    pub const fn new(px: f32, line_height: f32) -> Self {
        Self { px, line_height }
    }

    /// CSS font-size string.
    pub fn to_css(&self) -> String {
        format!("{}px", self.px)
    }

    /// CSS line-height string (unitless).
    pub fn line_height_css(&self) -> String {
        format!("{}", self.line_height)
    }
}

/// Complete typographic scale.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TypographyScale {
    /// UI font family.
    pub family_ui: FontFamily,
    /// Display/title font family.
    pub family_display: FontFamily,
    /// Monospace font family.
    pub family_mono: FontFamily,

    /// 10px -- badges, legal, counters.
    pub xs: FontSize,
    /// 12px -- secondary labels, hints.
    pub sm: FontSize,
    /// 14px -- body text (COG base) / 12px (D2 base).
    pub body: FontSize,
    /// 16px -- subtitles, important labels.
    pub lg: FontSize,
    /// 18px -- section titles.
    pub xl: FontSize,
    /// 24px -- page titles.
    pub xxl: FontSize,
    /// 32px -- main titles, hero text.
    pub xxxl: FontSize,
    /// 40-48px -- display, splash.
    pub display: FontSize,
}

/// Pre-built text style combining size, weight, and family.
#[derive(Debug, Clone, PartialEq)]
pub struct TextStyle {
    pub size: FontSize,
    pub weight: FontWeight,
    pub family: FontFamily,
}
```

### 2.7 Module `radius.rs`

```rust
// @id: MUIT-Radius @do: radius-scale @role: token @layer: 5

/// Border radius scale.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct RadiusScale {
    /// 0px -- square edges.
    pub none: f32,
    /// 2px -- subtle (badges, tags, D2 panels).
    pub sm: f32,
    /// 4px -- standard (buttons, inputs, cards).
    pub md: f32,
    /// 8px -- elevated cards, modals.
    pub lg: f32,
    /// 12px -- rounded (tooltips, toasts).
    pub xl: f32,
    /// 16px -- very rounded (avatar squares, chips).
    pub xxl: f32,
    /// 9999px -- full circle (avatars, pills).
    pub full: f32,
}

impl RadiusScale {
    /// COG standard radius scale.
    pub const fn cog() -> Self {
        Self {
            none: 0.0,
            sm: 2.0,
            md: 4.0,
            lg: 8.0,
            xl: 12.0,
            xxl: 16.0,
            full: 9999.0,
        }
    }

    /// D2 medieval radius scale (mostly square).
    pub const fn d2() -> Self {
        Self {
            none: 0.0,
            sm: 1.0,
            md: 2.0,
            lg: 3.0,
            xl: 4.0,
            xxl: 6.0,
            full: 9999.0,
        }
    }

    /// Convert to CSS string.
    pub fn to_css(value: f32) -> String {
        if value == 0.0 {
            "0".to_string()
        } else if value > 9000.0 {
            "9999px".to_string()
        } else {
            format!("{value}px")
        }
    }
}
```

### 2.8 Module `shadow.rs`

```rust
// @id: MUIT-Shadow @do: shadow-scale @role: token @layer: 5

use crate::color::Rgba;

/// A single shadow definition.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Shadow {
    /// Horizontal offset in px.
    pub offset_x: f32,
    /// Vertical offset in px.
    pub offset_y: f32,
    /// Blur radius in px.
    pub blur: f32,
    /// Spread radius in px.
    pub spread: f32,
    /// Shadow color.
    pub color: Rgba,
}

impl Shadow {
    pub const NONE: Self = Self {
        offset_x: 0.0,
        offset_y: 0.0,
        blur: 0.0,
        spread: 0.0,
        color: Rgba::with_alpha(0, 0, 0, 0),
    };

    pub const fn new(offset_x: f32, offset_y: f32, blur: f32, spread: f32, color: Rgba) -> Self {
        Self { offset_x, offset_y, blur, spread, color }
    }

    /// CSS box-shadow string.
    pub fn to_css(&self) -> String {
        if self.blur == 0.0 && self.offset_x == 0.0 && self.offset_y == 0.0 {
            "none".to_string()
        } else {
            format!(
                "{}px {}px {}px {}px {}",
                self.offset_x, self.offset_y, self.blur, self.spread,
                self.color.to_css()
            )
        }
    }
}

/// Shadow elevation scale.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct ShadowScale {
    pub none: Shadow,
    pub sm: Shadow,
    pub md: Shadow,
    pub lg: Shadow,
    pub xl: Shadow,
}

impl ShadowScale {
    /// COG shadow scale (strong shadows on dark backgrounds).
    pub const fn cog() -> Self {
        Self {
            none: Shadow::NONE,
            sm: Shadow::new(0.0, 1.0, 2.0, 0.0, Rgba::with_alpha(0, 0, 0, 77)),
            md: Shadow::new(0.0, 4.0, 12.0, 0.0, Rgba::with_alpha(0, 0, 0, 102)),
            lg: Shadow::new(0.0, 8.0, 24.0, 0.0, Rgba::with_alpha(0, 0, 0, 128)),
            xl: Shadow::new(0.0, 16.0, 48.0, 0.0, Rgba::with_alpha(0, 0, 0, 153)),
        }
    }

    /// D2 minimal shadows (ambiance by color, not elevation).
    pub const fn d2() -> Self {
        Self {
            none: Shadow::NONE,
            sm: Shadow::new(0.0, 1.0, 2.0, 0.0, Rgba::with_alpha(0, 0, 0, 128)),
            md: Shadow::new(0.0, 2.0, 6.0, 0.0, Rgba::with_alpha(0, 0, 0, 153)),
            lg: Shadow::new(0.0, 4.0, 12.0, 0.0, Rgba::with_alpha(0, 0, 0, 179)),
            xl: Shadow::new(0.0, 8.0, 24.0, 0.0, Rgba::with_alpha(0, 0, 0, 204)),
        }
    }
}
```

### 2.9 Module `animation.rs`

```rust
// @id: MUIT-Animation @do: animation-tokens @role: token @layer: 5

/// Transition duration in milliseconds.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TransitionDuration {
    pub ms: u32,
}

impl TransitionDuration {
    pub const fn new(ms: u32) -> Self { Self { ms } }

    /// CSS duration string (e.g. "200ms").
    pub fn to_css(&self) -> String {
        format!("{}ms", self.ms)
    }

    /// Duration as seconds (for egui animations).
    pub fn to_secs(&self) -> f32 {
        self.ms as f32 / 1000.0
    }
}

/// Easing function specification.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Easing {
    pub x1: f32,
    pub y1: f32,
    pub x2: f32,
    pub y2: f32,
}

impl Easing {
    pub const fn new(x1: f32, y1: f32, x2: f32, y2: f32) -> Self {
        Self { x1, y1, x2, y2 }
    }

    /// Standard material motion easing.
    pub const STANDARD: Self = Self::new(0.4, 0.0, 0.2, 1.0);
    /// Entrance easing (deceleration).
    pub const ENTRANCE: Self = Self::new(0.0, 0.0, 0.2, 1.0);
    /// Exit easing (acceleration).
    pub const EXIT: Self = Self::new(0.4, 0.0, 1.0, 1.0);

    /// CSS cubic-bezier string.
    pub fn to_css(&self) -> String {
        format!("cubic-bezier({}, {}, {}, {})", self.x1, self.y1, self.x2, self.y2)
    }
}

/// Transition scale for consistent motion.
#[derive(Debug, Clone, Copy, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TransitionScale {
    /// 100ms -- color change, opacity.
    pub fast: TransitionDuration,
    /// 200ms -- hover, focus, toggle.
    pub normal: TransitionDuration,
    /// 300ms -- panel open, expand.
    pub slow: TransitionDuration,
    /// 400ms -- element appearance (fade-in, slide-in).
    pub entrance: TransitionDuration,
    /// Standard easing.
    pub easing_default: Easing,
    /// Entrance easing.
    pub easing_entrance: Easing,
    /// Exit easing.
    pub easing_exit: Easing,
}

impl TransitionScale {
    pub const fn standard() -> Self {
        Self {
            fast: TransitionDuration::new(100),
            normal: TransitionDuration::new(200),
            slow: TransitionDuration::new(300),
            entrance: TransitionDuration::new(400),
            easing_default: Easing::STANDARD,
            easing_entrance: Easing::ENTRANCE,
            easing_exit: Easing::EXIT,
        }
    }
}
```

### 2.10 Module `z_index.rs`

```rust
// @id: MUIT-ZIndex @do: z-index-scale @role: token @layer: 5

/// Z-index scale for stacking context management.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct ZIndexScale {
    /// 0 -- normal content.
    pub base: i32,
    /// 100 -- dropdowns, popovers.
    pub dropdown: i32,
    /// 200 -- sticky headers, nav bars.
    pub sticky: i32,
    /// 300 -- modal backdrop.
    pub overlay: i32,
    /// 400 -- modal content.
    pub modal: i32,
    /// 500 -- toast notifications.
    pub notification: i32,
    /// 600 -- tooltips (always on top).
    pub tooltip: i32,
}

impl ZIndexScale {
    pub const fn standard() -> Self {
        Self {
            base: 0,
            dropdown: 100,
            sticky: 200,
            overlay: 300,
            modal: 400,
            notification: 500,
            tooltip: 600,
        }
    }
}
```

### 2.11 Module `palette/mod.rs`

```rust
// @id: MUIT-Palette @do: palette-types @role: token @layer: 5

pub mod cog;
pub mod d2;

use crate::color::Rgba;

/// Unified palette structure used by both COG and D2 themes.
///
/// The palette contains all colors organized by semantic role.
/// Framework-specific code reads from this palette to apply colors.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Palette {
    // -- Backgrounds (6 levels) --
    pub bg_base: Rgba,
    pub bg_primary: Rgba,
    pub bg_secondary: Rgba,
    pub bg_surface: Rgba,
    pub bg_elevated: Rgba,
    pub bg_overlay: Rgba,

    // -- Text (4 levels) --
    pub text_high: Rgba,
    pub text_primary: Rgba,
    pub text_secondary: Rgba,
    pub text_muted: Rgba,

    // -- Accent primary --
    pub accent_primary: Rgba,
    pub accent_primary_hover: Rgba,
    pub accent_primary_active: Rgba,
    pub accent_primary_subtle: Rgba,

    // -- Accent secondary --
    pub accent_secondary: Rgba,
    pub accent_secondary_hover: Rgba,
    pub accent_secondary_subtle: Rgba,

    // -- Semantic colors --
    pub success: Rgba,
    pub success_subtle: Rgba,
    pub warning: Rgba,
    pub warning_subtle: Rgba,
    pub error: Rgba,
    pub error_subtle: Rgba,
    pub info: Rgba,
    pub info_subtle: Rgba,

    // -- Borders (4 levels) --
    pub border_subtle: Rgba,
    pub border_default: Rgba,
    pub border_strong: Rgba,
    pub border_accent: Rgba,
}
```

### 2.12 Module `palette/cog.rs`

Contient la palette COG complete (35+ couleurs) avec les valeurs exactes de Lise.
Reference : `BRIEF-miyuki-ui-lib-art-direction.md` section 2.2.

```rust
// @id: MUIT-PaletteCog @do: cog-palette @role: token @layer: 5

use crate::color::Rgba;
use super::Palette;

/// COG "Miyukini Gaming" palette -- dark, modern, blue + sakura accents.
pub const COG_PALETTE: Palette = Palette {
    // Backgrounds
    bg_base:      Rgba::new(14, 16, 21),     // #0e1015
    bg_primary:   Rgba::new(23, 26, 33),     // #171a21
    bg_secondary: Rgba::new(27, 40, 56),     // #1b2838
    bg_surface:   Rgba::new(30, 42, 58),     // #1e2a3a
    bg_elevated:  Rgba::new(36, 52, 71),     // #243447
    bg_overlay:   Rgba::new(42, 63, 95),     // #2a3f5f

    // Text
    text_high:      Rgba::new(255, 255, 255), // #ffffff
    text_primary:   Rgba::new(198, 212, 223), // #c6d4df
    text_secondary: Rgba::new(143, 152, 160), // #8f98a0
    text_muted:     Rgba::new(92, 104, 115),  // #5c6873

    // Accent primary (blue Miyukini)
    accent_primary:        Rgba::new(26, 159, 255),  // #1a9fff
    accent_primary_hover:  Rgba::new(71, 179, 255),  // #47b3ff
    accent_primary_active: Rgba::new(13, 138, 230),  // #0d8ae6
    accent_primary_subtle: Rgba::with_alpha(26, 159, 255, 26), // 10% alpha

    // Accent secondary (sakura Miyukini)
    accent_secondary:        Rgba::new(232, 160, 191), // #e8a0bf
    accent_secondary_hover:  Rgba::new(240, 184, 208), // #f0b8d0
    accent_secondary_subtle: Rgba::with_alpha(232, 160, 191, 26),

    // Semantic
    success:        Rgba::new(91, 163, 43),   // #5ba32b
    success_subtle: Rgba::with_alpha(91, 163, 43, 26),
    warning:        Rgba::new(255, 156, 26),  // #ff9c1a
    warning_subtle: Rgba::with_alpha(255, 156, 26, 26),
    error:          Rgba::new(224, 64, 64),   // #e04040
    error_subtle:   Rgba::with_alpha(224, 64, 64, 26),
    info:           Rgba::new(102, 192, 244), // #66c0f4
    info_subtle:    Rgba::with_alpha(102, 192, 244, 26),

    // Borders
    border_subtle:  Rgba::new(30, 42, 58),   // #1e2a3a
    border_default: Rgba::new(42, 63, 95),   // #2a3f5f
    border_strong:  Rgba::new(61, 90, 128),  // #3d5a80
    border_accent:  Rgba::new(26, 159, 255), // #1a9fff
};
```

### 2.13 Module `palette/d2.rs`

Contient la palette D2 complete (40+ couleurs) avec les valeurs fusionnees de Fabrice et Lise.
References : `BRIEF-miyuki-ui-lib-d2-analysis.md` section 2.1, `BRIEF-miyuki-ui-lib-art-direction.md` section 3.2.

```rust
// @id: MUIT-PaletteD2 @do: d2-palette @role: token @layer: 5

use crate::color::Rgba;
use super::Palette;

/// D2 "Sodomight Medieval" palette -- dark, warm, gold accents.
pub const D2_PALETTE: Palette = Palette {
    // Backgrounds (medieval surfaces)
    bg_base:      Rgba::new(5, 4, 2),        // #050402 -- void black
    bg_primary:   Rgba::new(10, 8, 5),       // #0a0805 -- deep dark
    bg_secondary: Rgba::new(28, 22, 14),     // #1c160e -- panel / wood
    bg_surface:   Rgba::with_alpha(40, 32, 16, 144), // slot empty
    bg_elevated:  Rgba::with_alpha(60, 50, 25, 220), // slot hover
    bg_overlay:   Rgba::new(15, 13, 8),      // #0f0d08 -- input bg

    // Text
    text_high:      Rgba::new(255, 215, 0),   // #ffd700 -- gold bright
    text_primary:   Rgba::new(200, 190, 160), // #c8bea0 -- parchment
    text_secondary: Rgba::new(200, 165, 70),  // #c8a546 -- gold standard
    text_muted:     Rgba::new(96, 90, 70),    // #605a46 -- disabled

    // Accent primary (gold)
    accent_primary:        Rgba::new(200, 165, 70),  // #c8a546 -- gold
    accent_primary_hover:  Rgba::new(255, 215, 0),   // #ffd700 -- bright gold
    accent_primary_active: Rgba::new(132, 100, 48),  // #846430 -- dark gold
    accent_primary_subtle: Rgba::with_alpha(200, 165, 70, 40),

    // Accent secondary (life red)
    accent_secondary:        Rgba::new(180, 20, 20),  // #b41414
    accent_secondary_hover:  Rgba::new(220, 40, 40),  // brighter red
    accent_secondary_subtle: Rgba::with_alpha(180, 20, 20, 40),

    // Semantic (D2 uses elements as semantic colors)
    success:        Rgba::new(0, 180, 0),     // #00b400 -- set green
    success_subtle: Rgba::with_alpha(0, 180, 0, 40),
    warning:        Rgba::new(255, 165, 0),   // #ffa500 -- crafted orange
    warning_subtle: Rgba::with_alpha(255, 165, 0, 40),
    error:          Rgba::new(255, 64, 64),   // #ff4040 -- requirement red
    error_subtle:   Rgba::with_alpha(255, 64, 64, 40),
    info:           Rgba::new(105, 105, 255), // #6969ff -- magic blue
    info_subtle:    Rgba::with_alpha(105, 105, 255, 40),

    // Borders
    border_subtle:  Rgba::new(26, 20, 16),   // #1a1410 -- stone dark
    border_default: Rgba::new(80, 60, 20),   // #503c14 -- panel border
    border_strong:  Rgba::new(132, 100, 48), // #846430 -- gold dark
    border_accent:  Rgba::new(200, 165, 70), // #c8a546 -- gold
};

// -- D2-specific extended colors (not in the unified Palette) --

/// D2 item quality colors (rarity system).
pub struct D2QualityColors;

impl D2QualityColors {
    pub const NORMAL:    Rgba = Rgba::new(200, 190, 160); // white/parchment
    pub const SOCKETED:  Rgba = Rgba::new(132, 132, 132); // gray
    pub const MAGIC:     Rgba = Rgba::new(105, 105, 255); // blue
    pub const RARE:      Rgba = Rgba::new(255, 255, 100); // yellow
    pub const UNIQUE:    Rgba = Rgba::new(165, 110, 0);   // dark gold
    pub const SET:       Rgba = Rgba::new(0, 180, 0);     // green
    pub const CRAFTED:   Rgba = Rgba::new(255, 165, 0);   // orange
    pub const RUNE_WORD: Rgba = Rgba::new(255, 165, 0);   // orange (same as crafted)
}

/// D2 elemental damage/resistance colors.
pub struct D2ElementColors;

impl D2ElementColors {
    pub const FIRE:      Rgba = Rgba::new(255, 69, 0);    // #ff4500
    pub const COLD:      Rgba = Rgba::new(68, 136, 255);  // #4488ff
    pub const LIGHTNING: Rgba = Rgba::new(255, 255, 0);    // #ffff00
    pub const POISON:    Rgba = Rgba::new(0, 255, 0);      // #00ff00
    pub const PHYSICAL:  Rgba = Rgba::new(200, 190, 160);  // parchment
    pub const MAGIC_DMG: Rgba = Rgba::new(105, 105, 255);  // blue
}

/// D2 orb colors.
pub struct D2OrbColors;

impl D2OrbColors {
    pub const LIFE:      Rgba = Rgba::new(180, 20, 20);   // #b41414
    pub const LIFE_DARK: Rgba = Rgba::new(110, 14, 14);   // #6e0e0e
    pub const MANA:      Rgba = Rgba::new(20, 40, 180);   // #1428b4
    pub const MANA_DARK: Rgba = Rgba::new(14, 20, 100);   // #0e1464
}

/// D2 misc game colors.
pub struct D2MiscColors;

impl D2MiscColors {
    pub const SKILL_ACTIVE:   Rgba = Rgba::new(255, 200, 50);  // #ffc832
    pub const STAMINA:        Rgba = Rgba::new(212, 200, 50);  // #d4c832
    pub const XP_BAR:         Rgba = Rgba::new(200, 165, 70);  // #c8a546
    pub const COPPER:         Rgba = Rgba::new(184, 115, 51);  // #b87333
    pub const SILVER:         Rgba = Rgba::new(160, 160, 160); // #a0a0a0
    pub const STONE_LIGHT:    Rgba = Rgba::new(58, 48, 37);    // #3a3025
    pub const STONE_DARK:     Rgba = Rgba::new(26, 20, 16);    // #1a1410
}

/// D2 text system colors (D2 color codes c0-c9).
pub struct D2SystemColors;

impl D2SystemColors {
    pub const C0_LIGHT_GRAY: Rgba = Rgba::new(196, 196, 196); // descriptions
    pub const C1_RED:        Rgba = Rgba::new(255, 64, 64);    // warnings
    pub const C2_GREEN:      Rgba = Rgba::new(0, 255, 0);      // set items
    pub const C3_BLUE:       Rgba = Rgba::new(105, 105, 255);  // magic
    pub const C4_GOLD:       Rgba = Rgba::new(199, 179, 119);  // unique
    pub const C5_DARK_GRAY:  Rgba = Rgba::new(105, 105, 105);  // socketed
    pub const C6_BLACK:      Rgba = Rgba::new(0, 0, 0);        // shadow
    pub const C7_TAN:        Rgba = Rgba::new(208, 192, 144);  // bnet gold
    pub const C8_ORANGE:     Rgba = Rgba::new(255, 168, 0);    // crafted
    pub const C9_YELLOW:     Rgba = Rgba::new(255, 255, 100);  // rare
}
```

### 2.14 Module `theme.rs`

```rust
// @id: MUIT-Theme @do: theme-composition @role: token @layer: 5

use crate::palette::Palette;
use crate::spacing::SpacingScale;
use crate::typography::TypographyScale;
use crate::radius::RadiusScale;
use crate::shadow::ShadowScale;
use crate::animation::TransitionScale;
use crate::z_index::ZIndexScale;

/// Complete UI theme composing all design token categories.
///
/// A `UiTheme` is the single source of truth for all visual decisions
/// in a given context (COG desktop, D2 game, etc.).
#[derive(Debug, Clone, PartialEq)]
pub struct UiTheme {
    /// Human-readable theme name.
    pub name: &'static str,
    /// Color palette.
    pub palette: Palette,
    /// Spacing scale.
    pub spacing: SpacingScale,
    /// Typography scale.
    pub typography: TypographyScale,
    /// Border radius scale.
    pub radius: RadiusScale,
    /// Shadow elevation scale.
    pub shadow: ShadowScale,
    /// Transition/animation scale.
    pub animation: TransitionScale,
    /// Z-index stacking scale.
    pub z_index: ZIndexScale,
}
```

### 2.15 Module `themes/mod.rs`

```rust
// @id: MUIT-Themes @do: theme-catalog @role: exports @layer: 5

mod cog;
mod d2;

pub use cog::COG_THEME;
pub use d2::D2_THEME;
```

### 2.16 Module `themes/cog.rs`

```rust
// @id: MUIT-ThemeCog @do: cog-theme @role: config @layer: 5

use crate::theme::UiTheme;
use crate::palette::cog::COG_PALETTE;
use crate::spacing::SpacingScale;
use crate::typography::*;
use crate::radius::RadiusScale;
use crate::shadow::ShadowScale;
use crate::animation::TransitionScale;
use crate::z_index::ZIndexScale;

/// Complete COG "Miyukini Gaming" theme.
pub const COG_THEME: UiTheme = UiTheme {
    name: "Miyukini Gaming (COG)",
    palette: COG_PALETTE,
    spacing: SpacingScale::standard(),
    typography: TypographyScale {
        family_ui: FontFamily::COG_UI,
        family_display: FontFamily::COG_UI,
        family_mono: FontFamily::COG_MONO,
        xs:      FontSize::new(10.0, 1.4),
        sm:      FontSize::new(12.0, 1.5),
        body:    FontSize::new(14.0, 1.6),
        lg:      FontSize::new(16.0, 1.5),
        xl:      FontSize::new(18.0, 1.4),
        xxl:     FontSize::new(24.0, 1.3),
        xxxl:    FontSize::new(32.0, 1.2),
        display: FontSize::new(40.0, 1.1),
    },
    radius: RadiusScale::cog(),
    shadow: ShadowScale::cog(),
    animation: TransitionScale::standard(),
    z_index: ZIndexScale::standard(),
};
```

### 2.17 Module `themes/d2.rs`

```rust
// @id: MUIT-ThemeD2 @do: d2-theme @role: config @layer: 5

use crate::theme::UiTheme;
use crate::palette::d2::D2_PALETTE;
use crate::spacing::SpacingScale;
use crate::typography::*;
use crate::radius::RadiusScale;
use crate::shadow::ShadowScale;
use crate::animation::TransitionScale;
use crate::z_index::ZIndexScale;

/// Complete D2 "Sodomight Medieval" theme.
pub const D2_THEME: UiTheme = UiTheme {
    name: "Sodomight Medieval (D2)",
    palette: D2_PALETTE,
    spacing: SpacingScale::standard(), // Same 4px grid
    typography: TypographyScale {
        family_ui: FontFamily::D2_BODY,
        family_display: FontFamily::D2_TITLE,
        family_mono: FontFamily::D2_MONO,
        xs:      FontSize::new(8.0, 1.4),   // D2: smaller base
        sm:      FontSize::new(10.0, 1.5),
        body:    FontSize::new(12.0, 1.6),
        lg:      FontSize::new(14.0, 1.5),
        xl:      FontSize::new(16.0, 1.4),
        xxl:     FontSize::new(24.0, 1.3),
        xxxl:    FontSize::new(32.0, 1.2),
        display: FontSize::new(48.0, 1.1),
    },
    radius: RadiusScale::d2(),
    shadow: ShadowScale::d2(),
    animation: TransitionScale::standard(),
    z_index: ZIndexScale::standard(),
};
```

---

## 3. Crate `miyuki-ui-dioxus`

### 3.1 Cargo.toml

```toml
# @id: MUID-Cargo @do: build-config @role: infra @layer: 6 @human: miyuk

[package]
name = "miyuki-ui-dioxus"
version = "0.1.0"
edition = "2021"
rust-version = "1.75"
description = "Dioxus 0.6 UI component library for the Miyukini ecosystem"
publish = false

[lints.rust]
unsafe_code = "forbid"

[lints.clippy]
all = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
doc_markdown = "allow"
missing_errors_doc = "allow"
missing_panics_doc = "allow"
must_use_candidate = "allow"

[dependencies]
miyuki-ui-tokens = { path = "../miyuki-ui-tokens" }
dioxus = { version = "0.6", features = ["desktop"] }
```

### 3.2 Structure des fichiers

```
crates/miyuki-ui-dioxus/
  Cargo.toml
  src/
    lib.rs              # Re-exports, #[component] prelude
    context.rs          # ThemeProvider, use_theme(), use_palette()
    styles.rs           # Token-to-CSS conversion helpers
    atoms/
      mod.rs            # Re-exports all atoms
      button.rs         # A01 Button
      text_input.rs     # A02 TextInput
      text.rs           # A03 Text
      icon.rs           # A04 Icon
      badge.rs          # A05 Badge
      checkbox.rs       # A06 Checkbox
      radio.rs          # A07 Radio
      toggle.rs         # A08 Toggle
      slider.rs         # A09 Slider
      progress_bar.rs   # A10 ProgressBar
      divider.rs        # A11 Divider
      avatar.rs         # A12 Avatar
      tooltip.rs        # A13 Tooltip
      skeleton.rs       # A14 Skeleton
      spinner.rs        # A15 Spinner
      kbd.rs            # A16 Kbd
      select.rs         # A20 Select
      textarea.rs       # A21 Textarea
    molecules/
      mod.rs
      search_bar.rs     # M01 SearchBar
      form_field.rs     # M02 FormField
      card.rs           # M03 Card
      menu_item.rs      # M04 MenuItem
      toast.rs          # M05 Toast
      stat_row.rs       # M06 StatRow
      tab_item.rs       # M07 TabItem
      sidebar_item.rs   # M08 SidebarItem
      sidebar_section.rs # M09 SidebarSection
      user_badge.rs     # M10 UserBadge
      price_badge.rs    # M11 PriceBadge
      breadcrumb.rs     # M12 Breadcrumb
      pagination.rs     # M18 Pagination
      empty_state.rs    # M19 EmptyState
      confirm_dialog.rs # M20 ConfirmDialog
    organisms/
      mod.rs
      app_header.rs     # O01 AppHeader
      app_sidebar.rs    # O02 AppSidebar
      tab_bar.rs        # O03 TabBar
      data_table.rs     # O04 DataTable
      modal.rs          # O05 Modal
      form.rs           # O06 Form
      card_grid.rs      # O07 CardGrid
      service_card_grid.rs # O08 ServiceCardGrid
      settings_panel.rs # O09 SettingsPanel
      command_palette.rs # O10 CommandPalette
      calendar_view.rs  # O19 CalendarView
      notification_center.rs # O20 NotificationCenter
    templates/
      mod.rs
      dashboard_layout.rs  # T01 DashboardLayout
      service_layout.rs    # T02 ServiceLayout
      fullscreen_layout.rs # T03 FullscreenLayout
      form_page_layout.rs  # T04 FormPageLayout
      settings_layout.rs   # T05 SettingsLayout
      detail_layout.rs     # T06 DetailLayout
      split_panel_layout.rs # T09 SplitPanelLayout
```

### 3.3 Context et hooks -- `context.rs`

```rust
// @id: MUID-Context @do: theme-context @role: provider @layer: 6

use dioxus::prelude::*;
use miyuki_ui_tokens::{UiTheme, Palette, COG_THEME};

/// Signal holding the active theme.
///
/// Installed at the app root with `use_context_provider`.
/// All child components access it via `use_theme()`.
#[derive(Clone, Copy)]
pub struct ThemeSignal(pub Signal<UiTheme>);

/// Install the theme provider at the root of the app.
///
/// Call this once in the root component:
/// ```rust,ignore
/// fn App() -> Element {
///     provide_theme(COG_THEME);
///     rsx! { /* ... */ }
/// }
/// ```
pub fn provide_theme(initial: UiTheme) {
    let sig = use_signal(|| initial);
    use_context_provider(|| ThemeSignal(sig));
}

/// Read the current theme from context.
pub fn use_theme() -> UiTheme {
    let ctx = use_context::<ThemeSignal>();
    ctx.0.read().clone()
}

/// Read the current palette from context (shortcut).
pub fn use_palette() -> Palette {
    use_theme().palette
}

/// Update the active theme at runtime.
pub fn set_theme(theme: UiTheme) {
    let ctx = use_context::<ThemeSignal>();
    ctx.0.set(theme);
}
```

### 3.4 Styles helpers -- `styles.rs`

```rust
// @id: MUID-Styles @do: css-conversion @role: util @layer: 6

use miyuki_ui_tokens::{Rgba, SpacingScale, RadiusScale, Shadow, FontFamily, FontSize, FontWeight};

/// Build an inline CSS background-color from an Rgba token.
pub fn bg(color: &Rgba) -> String {
    format!("background: {};", color.to_css())
}

/// Build an inline CSS color from an Rgba token.
pub fn fg(color: &Rgba) -> String {
    format!("color: {};", color.to_css())
}

/// Build border CSS.
pub fn border(width: f32, color: &Rgba) -> String {
    format!("border: {width}px solid {};", color.to_css())
}

/// Build border-radius CSS.
pub fn border_radius(value: f32) -> String {
    format!("border-radius: {};", RadiusScale::to_css(value))
}

/// Build padding CSS (all sides).
pub fn padding(value: f32) -> String {
    format!("padding: {};", SpacingScale::to_css_px(value))
}

/// Build padding CSS (vertical, horizontal).
pub fn padding_vh(v: f32, h: f32) -> String {
    format!("padding: {} {};", SpacingScale::to_css_px(v), SpacingScale::to_css_px(h))
}

/// Build gap CSS.
pub fn gap(value: f32) -> String {
    format!("gap: {};", SpacingScale::to_css_px(value))
}

/// Build font-family CSS.
pub fn font_family(family: &FontFamily) -> String {
    format!("font-family: {};", family.to_css())
}

/// Build font-size CSS.
pub fn font_size(size: &FontSize) -> String {
    format!("font-size: {}; line-height: {};", size.to_css(), size.line_height_css())
}

/// Build font-weight CSS.
pub fn font_weight(weight: FontWeight) -> String {
    format!("font-weight: {};", weight.value())
}

/// Build box-shadow CSS.
pub fn box_shadow(shadow: &Shadow) -> String {
    format!("box-shadow: {};", shadow.to_css())
}

/// Build a transition CSS string.
pub fn transition(property: &str, duration_ms: u32) -> String {
    format!("transition: {property} {duration_ms}ms;")
}

/// Combine multiple CSS inline declarations.
pub fn css(parts: &[&str]) -> String {
    let mut result = String::new();
    for part in parts {
        if !part.is_empty() {
            result.push_str(part);
            if !part.ends_with(';') {
                result.push(';');
            }
            result.push(' ');
        }
    }
    result
}
```

### 3.5 Composants -- Conventions

Chaque composant Dioxus respecte ces conventions :

1. **Props struct** avec `#[derive(Props, Clone, PartialEq)]`
2. **Function component** avec `#[component]`
3. **Lecture du theme** via `use_theme()` en debut de composant
4. **Extraction des variables** avant le bloc `rsx!` (regle Dioxus 0.6)
5. **Pas de nested braces** dans les format strings RSX
6. **Pas de named format args** dans les text nodes RSX
7. **Doc-comment** avec description et exemple d'usage
8. **Annotations MSCM** dans l'en-tete du fichier

### 3.6 Exemple d'atom : Button -- `atoms/button.rs`

```rust
// @id: MUID-Button @do: button-atom @role: component @layer: 6

use dioxus::prelude::*;
use crate::context::use_theme;
use crate::styles;

/// Button visual variant.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonVariant {
    #[default]
    Primary,
    Secondary,
    Ghost,
    Danger,
    IconOnly,
}

/// Button size.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonSize {
    Sm,
    #[default]
    Md,
    Lg,
}

/// Button component with multiple variants and sizes.
///
/// # Example
/// ```rust,ignore
/// rsx! {
///     Button {
///         variant: ButtonVariant::Primary,
///         size: ButtonSize::Md,
///         on_click: move |_| { /* handle click */ },
///         "Click me"
///     }
/// }
/// ```
#[component]
pub fn Button(
    /// Visual variant.
    #[props(default)]
    variant: ButtonVariant,
    /// Size variant.
    #[props(default)]
    size: ButtonSize,
    /// Disabled state.
    #[props(default)]
    disabled: bool,
    /// Loading state (shows spinner).
    #[props(default)]
    loading: bool,
    /// Click handler.
    #[props(default)]
    on_click: EventHandler<MouseEvent>,
    /// Button content (children).
    children: Element,
) -> Element {
    let theme = use_theme();
    let p = &theme.palette;
    let sp = &theme.spacing;
    let rad = &theme.radius;

    // -- Extract all computed values BEFORE rsx! --
    let (bg_color, text_color, border_css) = match variant {
        ButtonVariant::Primary => (p.accent_primary.to_css(), p.text_high.to_css(), "none".to_string()),
        ButtonVariant::Secondary => (p.bg_overlay.to_css(), p.text_primary.to_css(), format!("1px solid {}", p.border_default.to_css())),
        ButtonVariant::Ghost => ("transparent".to_string(), p.text_primary.to_css(), "none".to_string()),
        ButtonVariant::Danger => (p.error.to_css(), p.text_high.to_css(), "none".to_string()),
        ButtonVariant::IconOnly => ("transparent".to_string(), p.text_secondary.to_css(), "none".to_string()),
    };

    let (pad_v, pad_h, font_px) = match size {
        ButtonSize::Sm => (sp.space_1, sp.space_2, theme.typography.sm.px),
        ButtonSize::Md => (sp.space_2, sp.space_4, theme.typography.body.px),
        ButtonSize::Lg => (sp.space_3, sp.space_6, theme.typography.lg.px),
    };

    let opacity = if disabled || loading { "0.5" } else { "1" };
    let cursor = if disabled || loading { "not-allowed" } else { "pointer" };
    let radius_val = rad.md;

    let style_str = format!(
        "display: inline-flex; align-items: center; justify-content: center; \
         gap: {gap}px; padding: {pv}px {ph}px; \
         background: {bg}; color: {fg}; border: {brd}; \
         border-radius: {rad}px; font-size: {fs}px; font-weight: 500; \
         cursor: {cur}; opacity: {op}; transition: all 200ms;",
        gap = sp.space_2,
        pv = pad_v, ph = pad_h,
        bg = bg_color, fg = text_color, brd = border_css,
        rad = radius_val, fs = font_px,
        cur = cursor, op = opacity,
    );

    rsx! {
        button {
            style: "{style_str}",
            disabled: disabled || loading,
            onclick: move |evt| {
                if !disabled && !loading {
                    on_click.call(evt);
                }
            },
            {children}
        }
    }
}
```

### 3.7 Exemple d'atom : Text -- `atoms/text.rs`

```rust
// @id: MUID-Text @do: text-atom @role: component @layer: 6

use dioxus::prelude::*;
use crate::context::use_theme;
use miyuki_ui_tokens::FontWeight;

/// Semantic text level.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TextVariant {
    H1, H2, H3, H4, H5, H6,
    #[default]
    Body,
    Caption,
    Overline,
    Code,
}

/// Composant texte avec variants semantiques.
#[component]
pub fn Text(
    #[props(default)]
    variant: TextVariant,
    #[props(default)]
    weight: Option<FontWeight>,
    children: Element,
) -> Element {
    let theme = use_theme();
    let p = &theme.palette;
    let t = &theme.typography;

    let (size, default_weight, color, tag) = match variant {
        TextVariant::H1 => (t.xxxl.px, FontWeight::Bold, p.text_high.to_css(), "h1"),
        TextVariant::H2 => (t.xxl.px, FontWeight::Bold, p.text_high.to_css(), "h2"),
        TextVariant::H3 => (t.xl.px, FontWeight::SemiBold, p.text_high.to_css(), "h3"),
        TextVariant::H4 => (t.lg.px, FontWeight::SemiBold, p.text_primary.to_css(), "h4"),
        TextVariant::H5 => (t.body.px, FontWeight::SemiBold, p.text_primary.to_css(), "h5"),
        TextVariant::H6 => (t.sm.px, FontWeight::SemiBold, p.text_secondary.to_css(), "h6"),
        TextVariant::Body => (t.body.px, FontWeight::Regular, p.text_primary.to_css(), "p"),
        TextVariant::Caption => (t.sm.px, FontWeight::Regular, p.text_secondary.to_css(), "span"),
        TextVariant::Overline => (t.xs.px, FontWeight::Medium, p.text_muted.to_css(), "span"),
        TextVariant::Code => (t.sm.px, FontWeight::Regular, p.text_primary.to_css(), "code"),
    };

    let w = weight.unwrap_or(default_weight);
    let family = if matches!(variant, TextVariant::Code) {
        t.family_mono.to_css()
    } else {
        t.family_ui.to_css()
    };

    let style_str = format!(
        "font-size: {size}px; font-weight: {weight}; color: {color}; font-family: {family}; margin: 0;",
        weight = w.value(),
    );

    // Dioxus 0.6: dynamic tag not supported, use div with role
    rsx! {
        div {
            style: "{style_str}",
            role: "{tag}",
            {children}
        }
    }
}
```

### 3.8 Composants restants -- specifications de props

Chaque composant ci-dessous est specifie avec ses props. L'implementation RSX suit les memes conventions que Button et Text.

#### Atoms

| ID | Composant | Props | Notes |
|----|-----------|-------|-------|
| A02 | `TextInput` | `input_type: InputType (Text/Password/Number/Search)`, `placeholder: String`, `value: String`, `on_input: EventHandler<FormEvent>`, `disabled: bool`, `error: Option<String>`, `prefix: Option<Element>`, `suffix: Option<Element>` | Etats: normal, focus, error, disabled |
| A04 | `Icon` | `name: String`, `size: IconSize (Xs/Sm/Md/Lg/Xl)`, `color: Option<Rgba>` | Utilise emoji ou SVG inline |
| A05 | `Badge` | `label: String`, `variant: BadgeVariant (Default/Success/Warning/Error/Info/Sakura)`, `size: BadgeSize (Sm/Md)` | COG uniquement |
| A06 | `Checkbox` | `checked: bool`, `on_change: EventHandler<bool>`, `label: Option<String>`, `disabled: bool`, `indeterminate: bool` | |
| A07 | `Radio` | `selected: bool`, `on_select: EventHandler<()>`, `label: String`, `name: String`, `disabled: bool` | P1 |
| A08 | `Toggle` | `checked: bool`, `on_change: EventHandler<bool>`, `label: Option<String>`, `size: ToggleSize (Sm/Md)` | P1 |
| A09 | `Slider` | `value: f64`, `min: f64`, `max: f64`, `step: f64`, `on_change: EventHandler<f64>`, `label: Option<String>` | P1 |
| A10 | `ProgressBar` | `value: f64`, `variant: ProgressVariant (Linear/Circular)`, `mode: ProgressMode (Determinate/Indeterminate)`, `color: Option<Rgba>`, `height: Option<f32>` | |
| A11 | `Divider` | `orientation: Orientation (Horizontal/Vertical)`, `style_variant: DividerStyle (Solid/Dashed)` | |
| A12 | `Avatar` | `src: Option<String>`, `initials: Option<String>`, `shape: AvatarShape (Circle/Square)`, `size: AvatarSize (Xs/Sm/Md/Lg/Xl)` | |
| A13 | `Tooltip` | `content: String`, `position: TooltipPosition (Top/Bottom/Left/Right)`, `delay_ms: u32`, `children: Element` | |
| A14 | `Skeleton` | `shape: SkeletonShape (Rect/Circle/Text)`, `width: Option<String>`, `height: Option<String>` | P1 |
| A15 | `Spinner` | `size: SpinnerSize (Sm/Md/Lg)` | |
| A16 | `Kbd` | `key: String` | P2 |
| A20 | `Select` | `options: Vec<SelectOption>`, `selected: Option<String>`, `on_change: EventHandler<String>`, `placeholder: String` | P1 |
| A21 | `Textarea` | `value: String`, `on_input: EventHandler<FormEvent>`, `placeholder: String`, `rows: u32`, `resize: bool` | P1 |

#### Molecules

| ID | Composant | Props |
|----|-----------|-------|
| M01 | `SearchBar` | `value: String`, `on_change: EventHandler<String>`, `placeholder: String`, `on_clear: Option<EventHandler<()>>` |
| M02 | `FormField` | `label: String`, `error: Option<String>`, `required: bool`, `children: Element` (the input) |
| M03 | `Card` | `title: Option<String>`, `description: Option<String>`, `header_icon: Option<String>`, `on_click: Option<EventHandler<MouseEvent>>`, `footer: Option<Element>`, `children: Element` |
| M04 | `MenuItem` | `icon: Option<String>`, `label: String`, `shortcut: Option<String>`, `has_submenu: bool`, `on_click: EventHandler<MouseEvent>` |
| M05 | `Toast` | `message: String`, `variant: ToastVariant (Success/Warning/Error/Info)`, `on_dismiss: EventHandler<()>`, `duration_ms: Option<u32>` |
| M06 | `StatRow` | `label: String`, `value: String`, `indicator: Option<StatIndicator>` | P1 |
| M07 | `TabItem` | `label: String`, `icon: Option<String>`, `count: Option<u32>`, `closable: bool`, `is_active: bool`, `on_click: EventHandler<MouseEvent>`, `on_close: Option<EventHandler<MouseEvent>>` |
| M08 | `SidebarItem` | `icon: Option<String>`, `label: String`, `badge_count: Option<u32>`, `is_active: bool`, `on_click: EventHandler<MouseEvent>` |
| M09 | `SidebarSection` | `title: String`, `children: Element` (SidebarItems) |
| M10 | `UserBadge` | `name: String`, `subtitle: Option<String>`, `avatar_src: Option<String>`, `compact: bool` | P1 |
| M11 | `PriceBadge` | `label: String`, `variant: PriceBadgeVariant (Free/Installed/Price)` | P1 |
| M12 | `Breadcrumb` | `items: Vec<BreadcrumbItem>`, `on_navigate: EventHandler<usize>` | P2 |
| M18 | `Pagination` | `current_page: usize`, `total_pages: usize`, `on_page: EventHandler<usize>` | P2 |
| M19 | `EmptyState` | `title: String`, `description: Option<String>`, `cta_label: Option<String>`, `on_cta: Option<EventHandler<MouseEvent>>` | P1 |
| M20 | `ConfirmDialog` | `title: String`, `message: String`, `confirm_label: String`, `cancel_label: String`, `on_confirm: EventHandler<()>`, `on_cancel: EventHandler<()>` | P1 |

#### Organisms

| ID | Composant | Props |
|----|-----------|-------|
| O01 | `AppHeader` | `nav_items: Vec<NavItem>`, `active_nav: String`, `on_nav: EventHandler<String>`, `search_value: String`, `on_search: EventHandler<String>`, `user_name: String`, `user_avatar: Option<String>`, `on_profile: EventHandler<MouseEvent>` |
| O02 | `AppSidebar` | `title: String`, `sections: Vec<SidebarSectionData>`, `active_item: String`, `on_item: EventHandler<String>`, `footer: Option<Element>` |
| O03 | `TabBar` | `tabs: Vec<TabData>`, `active_tab: String`, `on_select: EventHandler<String>`, `on_close: EventHandler<String>` |
| O04 | `DataTable` | `columns: Vec<Column>`, `rows: Vec<Row>`, `sortable: bool`, `on_sort: Option<EventHandler<SortEvent>>`, `pagination: Option<PaginationData>` | P1 |
| O05 | `Modal` | `title: String`, `size: ModalSize (Sm/Md/Lg/Fullscreen)`, `on_close: EventHandler<()>`, `actions: Option<Element>`, `children: Element` |
| O06 | `Form` | `title: Option<String>`, `on_submit: EventHandler<()>`, `submit_label: String`, `cancel_label: Option<String>`, `on_cancel: Option<EventHandler<()>>`, `children: Element` |
| O07 | `CardGrid` | `columns: u32`, `gap: Option<f32>`, `children: Element` |
| O08 | `ServiceCardGrid` | `services: Vec<ServiceCardData>`, `on_click: EventHandler<String>`, `filter: Option<String>` | P1 |
| O09 | `SettingsPanel` | `sections: Vec<SettingsSectionData>` | P1 |
| O10 | `CommandPalette` | `query: String`, `on_query: EventHandler<String>`, `actions: Vec<CommandAction>`, `on_select: EventHandler<String>`, `on_close: EventHandler<()>` | P2 |
| O19 | `CalendarView` | `mode: CalendarMode (Day/Week/Month)`, `events: Vec<CalendarEvent>`, `selected_date: String`, `on_date: EventHandler<String>`, `on_mode: EventHandler<CalendarMode>` | P1 |
| O20 | `NotificationCenter` | `notifications: Vec<Notification>`, `on_dismiss: EventHandler<String>`, `on_clear_all: EventHandler<()>` | P2 |

#### Templates

| ID | Composant | Props |
|----|-----------|-------|
| T01 | `DashboardLayout` | `header: Element`, `sidebar: Option<Element>`, `children: Element` |
| T02 | `ServiceLayout` | `header: Element`, `sidebar: Element`, `children: Element` |
| T03 | `FullscreenLayout` | `children: Element` |
| T04 | `FormPageLayout` | `children: Element` (centered card) |
| T05 | `SettingsLayout` | `sidebar: Element`, `children: Element` | P1 |
| T06 | `DetailLayout` | `header: Element`, `side_panel: Option<Element>`, `children: Element` | P1 |
| T09 | `SplitPanelLayout` | `left: Element`, `right: Element`, `default_split: f32` | P2 |

### 3.9 Migration path depuis l'existant

#### 3.9.1 Depuis `apps/central/src/theme.rs`

| Ancien (theme.rs) | Nouveau (miyuki-ui-tokens) |
|-------------------|--------------------------|
| `ThemePalette.bg_main` (`&'static str`) | `COG_THEME.palette.bg_primary` (`Rgba`) |
| `ThemePalette.bg_header` | `COG_THEME.palette.bg_secondary` |
| `ThemePalette.bg_card` | `COG_THEME.palette.bg_surface` |
| `ThemePalette.bg_hover` | `COG_THEME.palette.bg_overlay` |
| `ThemePalette.text_primary` | `COG_THEME.palette.text_primary` |
| `spacing::PADDING` (`&'static str`) | `COG_THEME.spacing.space_4` (`f32`) |
| `styles::btn_primary(theme)` | `Button { variant: ButtonVariant::Primary }` |
| `styles::modal_card(theme)` | `Modal { size: ModalSize::Md }` |

#### 3.9.2 Depuis `miyukini-service-ui`

Phase transitoire : `miyukini-service-ui/src/lib.rs` re-exporte depuis `miyuki-ui-dioxus` avec attribut `#[deprecated]`.

```rust
// Phase de transition -- miyukini-service-ui re-exports
#[deprecated(note = "Use miyuki_ui_dioxus::context::use_theme() directly")]
pub use miyuki_ui_dioxus::context::{use_theme, use_palette};

#[deprecated(note = "Use miyuki_ui_tokens::themes::COG_THEME directly")]
pub use miyuki_ui_tokens::themes::COG_THEME;
```

---

## 4. Crate `miyuki-ui-egui`

### 4.1 Cargo.toml

```toml
# @id: MUIE-Cargo @do: build-config @role: infra @layer: 6 @human: miyuk
# Ce crate vit dans le workspace COG mais est aussi reference depuis MGE.

[package]
name = "miyuki-ui-egui"
version = "0.1.0"
edition = "2021"
rust-version = "1.75"
description = "egui UI component library for the Miyukini Game Engine (D2-style)"
publish = false

[lints.rust]
unsafe_code = "forbid"

[lints.clippy]
all = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
doc_markdown = "allow"
missing_errors_doc = "allow"
missing_panics_doc = "allow"
must_use_candidate = "allow"

[dependencies]
miyuki-ui-tokens = { path = "../miyuki-ui-tokens" }
egui = "0.28"
```

### 4.2 Structure des fichiers

```
crates/miyuki-ui-egui/
  Cargo.toml
  src/
    lib.rs              # Re-exports, apply_theme()
    convert.rs          # Token -> egui Style/Visuals/Color32 conversion
    atoms/
      mod.rs
      d2_button.rs      # D2Button (stone texture, gold text)
      health_orb.rs     # HealthOrb (life/mana, circular fill)
      progress_bar.rs   # ProgressBar (XP, stamina, loading)
      slot_frame.rs     # SlotFrame (inventory/equip/belt/skill)
      item_icon.rs      # ItemIcon (sized item in slot)
      quality_text.rs   # QualityText (rarity-colored text)
      gold_display.rs   # GoldDisplay (gold amount with icon)
      separator_line.rs # SeparatorLine (simple/ornate)
      panel_frame.rs    # PanelFrame (gothic bordered panel)
      tab_button.rs     # TabButton (act tabs, skill tabs)
      stat_label.rs     # StatLabel (label + value pair)
      resistance_bar.rs # ResistanceBar (element-colored)
    molecules/
      mod.rs
      inventory_slot.rs # InventorySlot (slot + item + quality text)
      equip_slot.rs     # EquipSlot (labeled equipment position)
      skill_node.rs     # SkillNode (skill in tree, level, availability)
      stat_row.rs       # StatRow (label + value + "+" button)
      resistance_row.rs # ResistanceRow (element + percentage)
      belt_column.rs    # BeltColumn (1-4 potion slots)
      quest_entry.rs    # QuestEntry (icon + name + state)
      waypoint_entry.rs # WaypointEntry (zone name + discovered state)
      player_entry.rs   # PlayerEntry (name + class + life)
      chat_message.rs   # ChatMessage (styled text line)
      tooltip_line.rs   # TooltipLine (single line in tooltip)
    organisms/
      mod.rs
      hud_bar.rs        # HudBar (full HUD)
      inventory_panel.rs # InventoryPanel (paperdoll + grid + gold)
      character_sheet.rs # CharacterSheet (stats + resistances)
      skill_tree_panel.rs # SkillTreePanel (3 tabs, nodes, prerequisites)
      quest_log.rs      # QuestLog (5 act tabs, 6 quests each)
      waypoint_map.rs   # WaypointMap (5 act tabs, waypoint list)
      trade_window.rs   # TradeWindow (2x 5x5 grids, gold, buttons)
      stash_panel.rs    # StashPanel (multi-tab grid, gold)
      cube_panel.rs     # CubePanel (3x4 grid, transmute button)
      npc_dialog.rs     # NpcDialog (portrait, text, options)
      mercenary_panel.rs # MercenaryPanel (3 slots, stats)
      party_panel.rs    # PartyPanel (player list)
      chat_overlay.rs   # ChatOverlay (message list + input)
      minimap_overlay.rs # MinimapOverlay (map rendering + entities)
      item_tooltip.rs   # ItemTooltip (full item detail)
      skill_tooltip.rs  # SkillTooltip (full skill detail)
      game_menu.rs      # GameMenu (title screen buttons)
    templates/
      mod.rs
      gameplay_layout.rs # GameplayLayout (fullscreen + HUD overlay)
      menu_layout.rs     # MenuLayout (centered panel + background)
      char_select_layout.rs # CharSelectLayout (list + preview)
      loading_layout.rs  # LoadingLayout (art + progress bar)
      trade_layout.rs    # TradeLayout (trade + inventory side)
      npc_layout.rs      # NpcLayout (dialog + shop)
```

### 4.3 Conversion tokens vers egui -- `convert.rs`

```rust
// @id: MUIE-Convert @do: token-egui-conversion @role: util @layer: 6

use egui::{Color32, Rounding, Stroke, Style, Visuals, FontDefinitions, FontFamily as EguiFontFamily};
use miyuki_ui_tokens::{Rgba, UiTheme};

/// Convert an Rgba token to an egui Color32.
pub fn to_color32(rgba: &Rgba) -> Color32 {
    Color32::from_rgba_premultiplied(rgba.r, rgba.g, rgba.b, rgba.a)
}

/// Apply a UiTheme to an egui Context.
///
/// This sets Visuals, Spacing, and font definitions based on the theme tokens.
pub fn apply_theme(ctx: &egui::Context, theme: &UiTheme) {
    let p = &theme.palette;

    let style = Style {
        visuals: Visuals {
            dark_mode: true,
            panel_fill: to_color32(&p.bg_secondary),
            window_fill: to_color32(&p.bg_secondary),
            window_stroke: Stroke::new(2.0, to_color32(&p.border_default)),
            window_rounding: Rounding::same(theme.radius.md),
            override_text_color: Some(to_color32(&p.text_primary)),
            ..Visuals::dark()
        },
        spacing: egui::style::Spacing {
            item_spacing: egui::vec2(theme.spacing.space_1, theme.spacing.space_1),
            window_margin: egui::Margin::same(theme.spacing.space_2),
            button_padding: egui::vec2(theme.spacing.space_2, theme.spacing.space_1),
            ..egui::style::Spacing::default()
        },
        ..Style::default()
    };

    ctx.set_style(style);

    // Font setup -- load theme fonts
    let mut fonts = FontDefinitions::default();
    // Production: load Exocet-like TTF and bitmap fonts here
    // fonts.font_data.insert("d2_title".to_string(), FontData::from_static(EXOCET_BYTES));
    ctx.set_fonts(fonts);
}
```

### 4.4 Integration avec mge-ui existant

Le code existant dans `mge/crates/engine/mge-ui/` sera progressivement migre :

| Fichier existant | Migration |
|-----------------|-----------|
| `theme.rs` (D2Colors, apply_d2_theme) | Remplace par `miyuki_ui_egui::convert::apply_theme(ctx, &D2_THEME)`. `D2Colors` constantes remplacees par `D2_PALETTE` + `D2QualityColors` etc. |
| `hud.rs` (draw_hud) | Refactore pour utiliser les atoms (`HealthOrb`, `SlotFrame`, `ProgressBar`) et l'organisme `HudBar` |
| `inventory.rs` (draw_inventory) | Refactore pour utiliser `InventorySlot`, `EquipSlot`, `InventoryPanel` |
| `character.rs` (draw_character_panel) | Refactore pour utiliser `StatRow`, `ResistanceRow`, `CharacterSheet` |
| `skill_tree.rs` (stub) | Implemente via `SkillNode`, `SkillTreePanel` |
| `tooltip.rs` (draw_tooltip) | Refactore via `TooltipLine`, `ItemTooltip` |
| `minimap.rs` (stub) | Implemente via `MinimapOverlay` |
| `dialog.rs` (draw_npc_dialog) | Refactore via `NpcDialog` |
| `menus/` (4 ecrans) | Refactore via `GameMenu`, `MenuLayout` etc. |

### 4.5 Dependance depuis le workspace MGE

Dans `mge/Cargo.toml`, ajouter :

```toml
[workspace.dependencies]
miyuki-ui-tokens = { path = "../crates/miyuki-ui-tokens" }
miyuki-ui-egui = { path = "../crates/miyuki-ui-egui" }
```

Dans `mge/crates/engine/mge-ui/Cargo.toml`, remplacer les couleurs en dur par :

```toml
[dependencies]
miyuki-ui-tokens = { workspace = true }
miyuki-ui-egui = { workspace = true }
```

---

## 5. Partage entre workspaces

### 5.1 Mecanisme

Le crate `miyuki-ui-tokens` est physiquement situe dans le workspace COG (`crates/miyuki-ui-tokens/`).
Le workspace MGE (`mge/Cargo.toml`) le reference par path relatif :

```toml
# mge/Cargo.toml
[workspace.dependencies]
miyuki-ui-tokens = { path = "../crates/miyuki-ui-tokens" }
miyuki-ui-egui = { path = "../crates/miyuki-ui-egui" }
```

### 5.2 Contraintes

1. **Pas de publish crates.io** : Les deux crates utilisent `publish = false`. Le partage par path est incompatible avec la publication.
2. **Versions lockees** : Les deux workspaces partagent le meme code source. Les versions sont implicitement synchronisees.
3. **Build separes** : `cargo build --workspace` dans le workspace COG ne build PAS les crates MGE, et inversement. Chaque workspace a son propre `Cargo.lock`.
4. **CI** : Les tests doivent runner dans les DEUX workspaces. Le CI doit executer `cargo test --workspace` dans `/` ET dans `mge/`.
5. **Dependencies transitives** : `miyuki-ui-tokens` ne doit JAMAIS dependre de crates specifiques a un workspace (pas de `dioxus`, pas de `egui`). C'est garanti par sa conception zero-dep.
6. **`miyuki-ui-egui`** depend de `egui 0.28`. Il doit etre en workspace dep dans MGE pour eviter les conflits de versions egui.

### 5.3 Verification

Commande de verification cross-workspace :

```bash
# Depuis la racine COG
cargo test -p miyuki-ui-tokens
cargo test -p miyuki-ui-dioxus
cargo test -p miyuki-ui-egui
cargo clippy -p miyuki-ui-tokens -- -D warnings

# Depuis mge/
cd mge && cargo test -p mge-ui && cd ..
```

---

## 6. Migration de l'existant

### 6.1 Plan de migration `apps/central/src/theme.rs`

1. Supprimer `theme.rs` et `colors` module
2. Remplacer tous les appels `theme.palette().bg_main` par le theme via `use_theme()` de `miyuki-ui-dioxus`
3. Remplacer tous les appels `styles::xxx(theme)` par les composants Dioxus correspondants
4. Le fichier `theme.rs` de 398 lignes est entierement remplace par `provide_theme(COG_THEME)` a la racine

### 6.2 Plan de migration `miyukini-service-ui`

1. Modifier `Cargo.toml` pour ajouter `miyuki-ui-dioxus` et `miyuki-ui-tokens` en dependances
2. Remplacer le contenu de `lib.rs`, `theme.rs`, `styles.rs` par des re-exports avec `#[deprecated]`
3. Les 8 apps standalone continuent de compiler sans changement
4. Migration progressive : chaque app passe a `miyuki-ui-dioxus` directement dans un commit dedie

### 6.3 Plan de migration `mge-ui`

1. Ajouter `miyuki-ui-tokens` et `miyuki-ui-egui` dans les deps de mge-ui
2. Remplacer `D2Colors` par les constantes de `miyuki_ui_tokens::palette::d2`
3. Remplacer `apply_d2_theme` par `miyuki_ui_egui::convert::apply_theme(ctx, &D2_THEME)`
4. Progressivement refactorer `draw_*` pour utiliser les composants atomiques egui

---

## 7. Strategie de tests

### 7.1 `miyuki-ui-tokens` -- Tests unitaires exhaustifs

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rgba_to_hex() {
        let c = Rgba::new(26, 159, 255);
        assert_eq!(c.to_hex(), "#1a9fff");
    }

    #[test]
    fn rgba_to_hex_with_alpha() {
        let c = Rgba::with_alpha(26, 159, 255, 128);
        assert_eq!(c.to_hex(), "#1a9fff80");
    }

    #[test]
    fn rgba_to_css_opaque() {
        let c = Rgba::new(26, 159, 255);
        assert_eq!(c.to_css(), "rgb(26, 159, 255)");
    }

    #[test]
    fn rgba_to_css_alpha() {
        let c = Rgba::with_alpha(26, 159, 255, 128);
        assert_eq!(c.to_css(), "rgba(26, 159, 255, 0.50)");
    }

    #[test]
    fn rgba_to_array() {
        let c = Rgba::with_alpha(10, 20, 30, 40);
        assert_eq!(c.to_array(), [10, 20, 30, 40]);
    }

    #[test]
    fn cog_theme_has_correct_name() {
        assert_eq!(COG_THEME.name, "Miyukini Gaming (COG)");
    }

    #[test]
    fn d2_theme_has_correct_name() {
        assert_eq!(D2_THEME.name, "Sodomight Medieval (D2)");
    }

    #[test]
    fn spacing_standard_base() {
        let s = SpacingScale::standard();
        assert_eq!(s.unit, 4.0);
        assert_eq!(s.space_4, 16.0);
    }

    #[test]
    fn cog_palette_bg_base_hex() {
        let bg = COG_THEME.palette.bg_base;
        assert_eq!(bg.to_hex(), "#0e1015");
    }

    #[test]
    fn d2_palette_gold() {
        let gold = D2_THEME.palette.accent_primary;
        assert_eq!(gold.to_hex(), "#c8a546");
    }

    #[test]
    fn d2_quality_colors_unique() {
        use palette::d2::D2QualityColors;
        assert_eq!(D2QualityColors::UNIQUE.to_hex(), "#a56e00");
    }

    #[test]
    fn radius_d2_is_mostly_square() {
        let r = RadiusScale::d2();
        assert!(r.md <= 2.0);
    }

    #[test]
    fn shadow_cog_none_is_zero() {
        let s = ShadowScale::cog();
        assert_eq!(s.none.blur, 0.0);
    }
}
```

**Couverture cible** : 100% des conversions (`to_hex`, `to_css`, `to_array`, `to_css_px`), 100% des themes pre-construits (toutes les valeurs sont non-nulles et coherentes).

### 7.2 `miyuki-ui-dioxus` -- Tests composants

- Tests unitaires sur `styles.rs` (fonctions de conversion CSS)
- Tests d'integration avec `dioxus-testing` si disponible
- Verification manuelle visuelle obligatoire (screenshot review) pour chaque composant
- Chaque composant doit compiler et render sans panic

### 7.3 `miyuki-ui-egui` -- Tests conversion

- Tests unitaires sur `convert.rs` (`to_color32`, `apply_theme`)
- Tests d'integration : `apply_theme` ne panic pas avec `COG_THEME` et `D2_THEME`
- Tests visuels manuels dans le MGE (`sodomight-client`)

### 7.4 Tests cross-workspace

```bash
# Script CI
cargo test -p miyuki-ui-tokens
cargo test -p miyuki-ui-dioxus
cargo test -p miyuki-ui-egui
cargo clippy -p miyuki-ui-tokens -p miyuki-ui-dioxus -p miyuki-ui-egui -- -D warnings
cd mge && cargo build --workspace && cd ..
```

---

## 8. Securite et conformite

### 8.1 Invariants de securite

- **unsafe_code = "forbid"** dans les 3 Cargo.toml -- AUCUN unsafe autorise
- **Pas de `unwrap()` en production** -- tous les `unwrap()` sont dans `#[cfg(test)]` uniquement
- **Pas de donnees sensibles** dans les tokens -- les couleurs et espacements ne sont pas des donnees personnelles
- **Pas de reseau** -- aucun des 3 crates n'effectue d'operation reseau
- **Pas de systeme de fichiers** -- aucune lecture/ecriture de fichiers a runtime (sauf chargement de polices dans `miyuki-ui-egui`, qui utilise des octets embarques via `include_bytes!`)

### 8.2 RGPD

Aucun impact RGPD : les crates UI ne traitent ni ne stockent de donnees personnelles.

### 8.3 Conformite LOI d'Autonomie

| LOI | Conformite |
|-----|-----------|
| LOI-1 (pas de dep externe critique) | Conforme : `miyuki-ui-tokens` a zero dep. `miyuki-ui-dioxus` depend de Dioxus (bundled). `miyuki-ui-egui` depend de egui (bundled). |
| LOI-2 (isolement = normal) | Conforme : les composants fonctionnent sans connexion reseau. |
| LOI-3 (etat local souverain) | Conforme : le theme est un Signal local, pas un etat distant. |
| LOI-5 (cout proportionnel au hardware) | Conforme : les tokens sont resolus a la compilation (const). Zero allocation runtime pour les themes. |
| LOI-7 (strate Cores immuable) | Conforme : les crates UI sont en Strate 5-6, ne modifient pas les Cores. |

---

## 9. Annotations MSCM

Tous les fichiers source des 3 crates portent des annotations MSCM dans l'en-tete :

```
// @id: <MUIT|MUID|MUIE>-<Module> @do: <fonction> @role: <token|component|util|exports|config|infra> @layer: <5|6>
```

Convention des prefixes :
- `MUIT` : miyuki-ui-tokens
- `MUID` : miyuki-ui-dioxus
- `MUIE` : miyuki-ui-egui

Les IDs seront indexes dans `mscm_index/` une fois l'implementation terminee.

---

## 10. Decisions techniques verrouillees

| Decision | Justification | Alternatives rejetees |
|----------|--------------|----------------------|
| **3 crates separes** (pas un mega-crate) | Separation nette tokens/framework, build optimise, maintenance modulaire | Feature flags (complexite, deps tirees) |
| **Rgba(u8) pour les couleurs** | Standard web 0-255, compatible CSS et egui sans conversion | f32 (precision inutile, conversion necessaire), &str hex (pas de calculs) |
| **Palette struct unique** (pas de trait) | Un seul type de palette, pas de polymorphisme necessaire, const-friendly | Trait Theme (overhead, pas const-compatible) |
| **SpacingScale struct** (pas un tableau) | Noms semantiques, IDE autocompletion, const-compatible | Array (pas semantique), HashMap (pas const) |
| **D2 couleurs etendues en structs separees** | Les couleurs D2-specifiques (quality, elements, orbs) ne sont pas dans la Palette commune | Tout dans Palette (pollue le struct commun) |
| **`const` themes** | Resolution a la compilation, zero allocation, performance maximale | Runtime themes (overhead inutile pour themes pre-definis) |
| **CSS inline pour Dioxus** | Dioxus desktop utilise webview, CSS inline est le mecanisme natif | Stylesheets (pas supporte de facon fiable en Dioxus desktop 0.6) |
| **Pas de no_std** | Le crate utilise `String` pour les conversions CSS. `no_std` + `alloc` est possible mais n'apporte rien. | no_std (contrainte inutile) |
| **serde optionnel** | La majorite des usages n'a pas besoin de serialiser les tokens | serde toujours (dep inutile pour 90% des cas) |
| **miyuwidgets reste independant** | Cas d'usage different (generation HTML serveur), pas de lien avec Atomic Design | Absorption (hors scope, ajoute de la complexite) |

---

*Specification technique redigee par Denis -- Chef Dev Senior, Miyukini AI Studio*
*Classification : T5 | Phase P1 | Pret pour P2 (Plan d'execution atomique)*
