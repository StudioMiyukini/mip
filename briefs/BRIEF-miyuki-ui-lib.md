# Brief P0 — Miyuki UI Lib (Librairie UI Unifiee Miyukini)

**Date** : 2026-03-01
**Classification MIP** : T5 — Chantier strategique
**Auteur** : Maria (P0 Cadrage & Brainstorming)
**Statut** : P0 VALIDE — Reponses utilisateur recues, Fabrice + Lise en cours

---

## 1. Classification et justification

**T5 — Chantier strategique**

Justification :
- Concerne TROIS backends de rendu differents (Dioxus desktop, egui/wgpu pour MGE, potentiel web)
- Impacte l'ensemble du workspace : 8+ apps standalone qui utilisent `miyukini-service-ui`, le MGE qui utilise `mge-ui`, `miyuwidgets`, `apps/central/`, et le futur `ui-builder`
- Necessite une abstraction architecturale profonde (couche de design tokens agnostique + adaptateurs par backend)
- Implique potentiellement 20+ fichiers nouveaux et la refactorisation de fichiers existants dans au moins 10 crates
- Impact structurel sur l'ensemble du projet a long terme

En cas de doute, un cran au-dessus : T4 serait envisageable si le scope se limite au Dioxus uniquement, mais la demande explicite de compatibilite cross-backend (Dioxus + wgpu/egui + web) pousse vers T5.

---

## 2. Brainstorming 4 temps

### Temps 1 — Exploration (Analyse de la demande)

#### Resume de la demande

L'utilisateur souhaite creer une librairie UI reutilisable, ordonnee et categorisee selon l'Atomic Design, compatible avec :
- **COG / Apps desktop** : Dioxus 0.6 (apps/central, jayxpose, jayfestival, jaykoa, jaykonta, miyukiniwatch, jay1tribu, jaymanga, miyuclicker)
- **MGE (Game Engine)** : egui 0.28 + wgpu 24.0 + winit 0.30
- **Web** (potentiel futur) : Dioxus web ou autre

#### Cartographie de l'existant

L'exploration du workspace revele 5 ilots UI distincts, non connectes entre eux :

| Ilot | Localisation | Backend | Contenu | Consommateurs |
|------|-------------|---------|---------|---------------|
| **1. central/theme.rs** | `apps/central/src/theme.rs` | Dioxus 0.6 (CSS inline) | Theme, ThemePalette, spacing, ~40 fonctions de style | `apps/central/` uniquement |
| **2. miyukini-service-ui** | `crates/miyukini-service-ui/` | Dioxus 0.6 (CSS inline) | Theme identique + styles identiques (code duplique de central) | 8 apps standalone (jayfestival, jaykoa, jayxpose, jaykonta, miyukiniwatch, jay1tribu, jaymanga, miyuclicker) |
| **3. central/components** | `apps/central/src/components/` | Dioxus 0.6 RSX | Header, TabBar, ServiceCard, ServiceGrid, ServiceSidebar | `apps/central/` uniquement |
| **4. mge-ui** | `mge/crates/engine/mge-ui/` | egui 0.28 + wgpu | D2Colors, HUD, Inventory, CharacterPanel, SkillTree, Menus, Tooltips, Minimap | Sodomight (MGE) |
| **5. miyuwidgets** | `crates/miyuwidgets/` | HTML pur (strings) | Widgets web (text, image, button, grid, container), templates, layouts | Aucun consommateur visible |

**Constat critique** : `central/theme.rs` et `miyukini-service-ui` sont du **code duplique quasi identique** (~95% identique). Les 40+ fonctions de style sont copiees-collees. C'est le probleme principal que la lib doit resoudre.

**Autre constat** : `mge-ui` vit dans un workspace Cargo completement separe (`mge/Cargo.toml`), avec ses propres dependencies (egui 0.28, wgpu 24.0). Il n'y a aucun lien de dependance entre le workspace COG et le workspace MGE.

**Composants Dioxus existants dans central** :
- `Header` — barre superieure avec navigation, recherche, profil
- `TabBar` — onglets de services ouverts
- `ServiceCard` — carte de service dans la grille
- `ServiceGrid` + `ServiceFilter` — grille filtrable de services
- `ServiceSidebar` — sidebar de navigation interne aux services (371 lignes)

**Composants egui existants dans mge-ui** :
- `draw_hud` — HUD gameplay (vie, mana, belt, skills)
- `draw_inventory` — grille d'inventaire D2-style
- `draw_character_panel` — stats du personnage
- `draw_skill_tree` — arbre de competences
- `draw_npc_dialog` — dialogues NPC
- `draw_tooltip` — tooltips items/skills
- `draw_minimap` — mini-carte
- `draw_main_menu`, `draw_char_select`, `draw_lobby_browser`, `draw_pause_menu` — ecrans de menu

**ui-builder** : existe (`apps/ui-builder/`) mais semble etre un prototype minimal (Dioxus, pas de dependance a service-ui).

**Packs UI dans `ui/`** : Dossiers d'assets visuels (Cursor Pack, Fantasy UI Borders, UI Adventure Pack, game_ui_pack, lucide_icons).

#### Contraintes identifiees

1. **Deux workspaces separes** : COG (`Cargo.toml` racine) et MGE (`mge/Cargo.toml`). Partager un crate entre les deux necessite soit un path relatif croise, soit un mono-workspace, soit un sous-module git.
2. **Deux systemes de rendu incompatibles** : Dioxus RSX genere du HTML/CSS (desktop via webview), egui dessine sur un canvas wgpu. Les "composants" ne peuvent pas etre les memes.
3. **Design tokens vs composants** : Seuls les tokens (couleurs, espacements, typographie, rayons) peuvent etre partages entre backends. Les composants sont specifiques a chaque backend.
4. **Atomic Design en Rust** : Pas de framework standard. Il faut definir la hierarchie (atoms/molecules/organisms/templates/pages) et le mapping vers des modules Rust.
5. **Dioxus 0.6 pieges RSX** : Pas de nested braces dans format strings, pas de named format args, pas de read+set sur meme signal.

#### Questions ouvertes pour l'utilisateur (HARD GATE)

**Q1 — Scope de la compatibilite cross-backend** :
La compatibilite entre Dioxus et egui/wgpu est-elle un objectif ferme de la V1, ou peut-on se concentrer d'abord sur la consolidation Dioxus (COG + apps) et traiter le MGE dans une V2 ?
Implication : Si V1 = Dioxus only, c'est un T4. Si V1 = cross-backend, c'est T5 avec une couche d'abstraction bien plus complexe.

**Q2 — Unification des workspaces** :
Acceptes-tu de fusionner le workspace MGE dans le workspace COG principal (monorepo complet), ou les deux doivent rester separes ? Si separes, comment partager le crate de design tokens ?

**Q3 — Direction artistique** :
Le theme actuel "Gaming (Steam)" est le seul theme implemente. La lib doit-elle supporter le multi-theme des la V1 (light/dark, themes par service), ou le theme Steam reste la reference unique ? Et pour le MGE, le theme D2 (Diablo II dark medieval) est completement different — doit-il cohabiter dans la meme lib de tokens ?

**Q4 — Niveau Atomic Design** :
Jusqu'ou aller dans l'Atomic Design pour la V1 ?
- **Minimum** : Atoms (boutons, inputs, badges) + Molecules (search bar, card)
- **Complet** : Atoms + Molecules + Organisms (header, sidebar, grille) + Templates + Pages
- Le mapping vers les composants egui existants du MGE est-il prevu, ou le MGE garde son propre systeme ?

**Q5 — miyuwidgets** :
Le crate `miyuwidgets` (widgets HTML pur, strings) est-il destine a etre absorbe par la nouvelle lib, ou a rester independant pour un usage web specifique ?

---

### Temps 2 — Ideation (Propositions d'approches)

#### Approche A — "Design Tokens + Adaptateurs" (recommandee)

**Principe** : Un crate central `miyuki-ui-tokens` agnostique (zero dependance graphique) qui definit les design tokens, plus des crates adaptateurs par backend.

```
crates/
  miyuki-ui-tokens/        # T0 — Pur Rust, no_std compatible, zero dep graphique
    src/
      lib.rs
      color.rs             # Couleurs RGBA, palettes nommees
      spacing.rs           # Espacements, marges, paddings
      typography.rs        # Tailles de police, poids, familles
      radius.rs            # Rayons de bordure
      shadow.rs            # Ombres
      theme.rs             # Theme = composition de tous les tokens
      catalog.rs           # Themes pre-construits (Gaming, D2Medieval, etc.)

  miyuki-ui-dioxus/        # Adaptateur Dioxus 0.6
    src/
      lib.rs
      atoms/               # Boutons, inputs, badges, icones
      molecules/           # SearchBar, Card, TabItem, SidebarItem
      organisms/           # Header, Sidebar, TabBar, Grid, Modal
      templates/           # ServiceLayout, FormLayout, FullscreenLayout
      styles.rs            # Convertit tokens -> CSS inline strings
      hooks.rs             # use_theme(), use_palette()

  miyuki-ui-egui/          # Adaptateur egui (pour MGE)
    src/
      lib.rs
      atoms/               # egui widgets styles avec tokens
      styles.rs            # Convertit tokens -> egui Style/Visuals
```

**Pros** :
- Separation nette entre tokens (partageables) et rendu (specifique)
- Le crate tokens peut etre utilise par TOUS les projets sans aucune dependance lourde
- Atomic Design bien structure dans le crate Dioxus
- Migration progressive possible : les apps existantes peuvent commencer a utiliser les tokens tout en gardant leur code actuel
- Respecte LOI-1 (pas de dependance externe critique) et LOI-7 (couche tokens immuable)

**Cons** :
- 3 crates a creer et maintenir
- Le crate egui est dans un workspace separe — necessite de resoudre Q2
- La conversion tokens -> CSS et tokens -> egui Style est du code redondant (mais inevitable)

**Estimation** : 3-5 semaines pour la V1 Dioxus, +1-2 semaines pour l'adaptateur egui

#### Approche B — "Mega-crate avec feature flags"

**Principe** : Un seul crate `miyuki-ui` avec des feature flags (`dioxus`, `egui`, `web`).

```
crates/
  miyuki-ui/
    src/
      lib.rs
      tokens/              # Design tokens (toujours compile)
      dioxus/              # #[cfg(feature = "dioxus")] — composants Dioxus
      egui/                # #[cfg(feature = "egui")] — adaptateur egui
      web/                 # #[cfg(feature = "web")] — widgets HTML
```

**Pros** :
- Un seul crate a versionner
- Plus simple conceptuellement
- Le `Cargo.toml` des consommateurs ne change qu'un feature flag

**Cons** :
- Feature flags complexes a gerer (combinaisons invalides possibles)
- Le crate tire toutes les dependencies meme si certaines ne sont pas utilisees a la compilation
- Moins modulaire, plus difficile a maintenir quand les backends divergent
- Conflits potentiels entre les versions de deps (Dioxus vs egui)
- Monolithique, contraire a l'esprit workspace Miyukini

**Estimation** : 2-4 semaines pour la V1, mais maintenance plus couteuse

#### Approche C — "Extension de miyukini-service-ui" (minimaliste)

**Principe** : Enrichir le crate existant `miyukini-service-ui` en y ajoutant les composants Atomic Design Dioxus, sans toucher au MGE.

```
crates/
  miyukini-service-ui/     # Enrichi
    src/
      lib.rs
      theme.rs             # Existant (conserve)
      styles.rs            # Existant (conserve)
      tokens.rs            # NOUVEAU — design tokens extraits
      atoms/               # NOUVEAU — boutons, inputs, badges
      molecules/           # NOUVEAU — cards, search bar
      organisms/           # NOUVEAU — header, sidebar, grid
```

**Pros** :
- Impact minimal sur le workspace (pas de nouveau crate)
- Migration douce pour les 8 apps qui en dependent deja
- Le plus rapide a implementer
- On resout le probleme de duplication central/service-ui immediatement

**Cons** :
- Ne resout PAS la compatibilite MGE (egui)
- Le crate reste couple a Dioxus
- Pas de couche tokens reutilisable sans Dioxus
- Le nom `miyukini-service-ui` ne reflete plus le scope (c'est une lib, pas juste des fondations service)

**Estimation** : 1-2 semaines

---

### Temps 3 — Risques et dependances

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R1 | Abstraction tokens trop generique, finalement inutilisee par le MGE | Moyen | Moyen | Commencer par les tokens effectivement utilises dans les deux mondes (couleurs, espacements). Ne pas specifier ce qui n'est pas encore necessaire. |
| R2 | Duplication de travail si les deux workspaces restent separes | Eleve | Eleve | Resoudre Q2 en amont. Si separes, publier `miyuki-ui-tokens` comme crate path partage. |
| R3 | Breaking change sur les 8 apps standalone lors de la migration | Moyen | Eleve | Migration progressive : garder `miyukini-service-ui` comme re-export/facade du nouveau crate. Deprecation, pas suppression. |
| R4 | Pieges RSX Dioxus 0.6 dans les composants partages | Moyen | Faible | Appliquer strictement les regles documentees (extraction variables avant RSX). Tests automatises. |
| R5 | Scope creep (le "potentiel web" fait exploser le perimetre) | Eleve | Eleve | Exclure le web de la V1. Concevoir les tokens pour etre web-ready, mais ne pas implementer l'adaptateur web. |
| R6 | Performance egui : les tokens intermediaires ajoutent une indirection | Faible | Faible | Les tokens sont resolus a la compilation ou au demarrage, pas a chaque frame. |
| R7 | Conflit de themes entre Steam (COG) et D2 Medieval (MGE) | Faible | Moyen | Les deux sont des "catalogues" de tokens. Ils cohabitent dans le meme systeme sans conflit. |

#### Dependances existantes a respecter

- `miyukini-service-ui` est utilise par 8 apps standalone. Toute modification doit etre retrocompatible ou accompagnee d'une migration.
- `mge-ui` depend de `egui 0.28`, `egui-wgpu 0.28`, `egui-winit 0.28`, `wgpu 24.0`, `winit 0.30`.
- `apps/central/src/theme.rs` (398 lignes) et `apps/central/src/components/` devront migrer vers la lib.
- Les packs d'assets UI dans `ui/` (Fantasy UI Borders, lucide_icons, etc.) devront etre integres comme ressources.

---

### Temps 4 — Proposition structuree

#### Architecture recommandee (Approche A)

```
Phase 1 (V1) — Consolidation Dioxus :
  crates/miyuki-ui-tokens/    # Design tokens purs (no_std, zero dep)
  crates/miyuki-ui-dioxus/    # Composants Atomic Design Dioxus 0.6

Phase 2 (V2) — Extension MGE :
  mge/crates/engine/mge-ui/   # Refactor pour consommer miyuki-ui-tokens
  OU crates/miyuki-ui-egui/   # Nouvel adaptateur egui

Phase 3 (V3) — Web (si besoin) :
  crates/miyuki-ui-web/       # Adaptateur web
```

#### Plan de projet et jalons

| Phase | Description | Jalon | Dependances | Estimation |
|-------|-------------|-------|-------------|------------|
| 0 | Cadrage (ce brief) + reponses utilisateur | Brief approuve | Aucune | 1 jour |
| 1a | Creer `miyuki-ui-tokens` : couleurs, espacements, typographie, rayons, themes | Crate compile, tests passe | Reponses Q1-Q5 | 3-5 jours |
| 1b | Creer `miyuki-ui-dioxus` : atoms (Button, Input, Badge, Icon) | 4+ atoms utilisables | Phase 1a | 3-5 jours |
| 1c | `miyuki-ui-dioxus` : molecules (Card, SearchBar, TabItem, SidebarItem) | 4+ molecules | Phase 1b | 3-5 jours |
| 1d | `miyuki-ui-dioxus` : organisms (Header, Sidebar, TabBar, Grid, Modal) | 5+ organisms | Phase 1c | 5-7 jours |
| 1e | Migration `apps/central/` pour utiliser `miyuki-ui-dioxus` au lieu du code local | Central fonctionne avec la lib | Phase 1d | 3-5 jours |
| 1f | Migration `miyukini-service-ui` : re-export depuis `miyuki-ui-dioxus` + deprecation | 8 apps compilent sans changement | Phase 1d | 2-3 jours |
| 2 | Extension MGE (V2) — tokens vers egui | `mge-ui` utilise les tokens | Phase 1a | 5-10 jours |

**Estimation totale V1** : 3-5 semaines (optimiste-pessimiste)
**Estimation totale V1+V2** : 5-8 semaines

#### Distribution des taches (agents)

| Agent | Responsabilite | Livrables |
|-------|---------------|-----------|
| **Maria** | Cadrage, suivi, arbitrage scope | Brief (ce document), suivi jalons |
| **Lise** | Direction artistique, Atomic Design, composants Dioxus, parcours UX | Catalogue Atomic Design, composants RSX, tests visuels |
| **Denis** | Spec technique `miyuki-ui-tokens`, architecture crates, integration | Spec technique, API publique, tests d'integration |
| **Francois** | Implementation tokens, migration back-end, adaptateur egui (V2) | Crate tokens, tests unitaires, migration |
| **George** | Audit final : coherence visuelle, accessibilite, performance | Rapport d'audit |
| **Arianne** | Archivage, anti-regression, memoire projet | Archives, mise a jour MEMORY.md |
| **Fabrice** | Analyse concurrentielle : Iced, egui theming, Dioxus component libs | Benchmark alternatives |

#### Artefacts MIP a produire

1. `.mip/briefs/BRIEF-miyuki-ui-lib.md` — Ce document (P0)
2. `.mip/specs/SPEC-miyuki-ui-tokens.md` — Spec technique du crate tokens (P1, Denis)
3. `.mip/specs/SPEC-miyuki-ui-dioxus.md` — Spec technique du crate Dioxus (P1, Denis + Lise)
4. `.mip/plans/PLAN-miyuki-ui-lib.md` — Plan d'execution atomique (P2, Denis)
5. `.mip/audits/AUDIT-miyuki-ui-lib.md` — Rapport d'audit (P4, George)

---

## 3. Proposition d'architecture preliminaire

### Crate `miyuki-ui-tokens` (Phase 1a)

```rust
// Aucune dependance graphique. Optionnel: serde pour serialisation.
// Compatible no_std (pas d'allocation, tout en const).

pub mod color {
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct Rgba { pub r: u8, pub g: u8, pub b: u8, pub a: u8 }

    impl Rgba {
        pub const fn new(r: u8, g: u8, b: u8, a: u8) -> Self { ... }
        pub fn to_css(&self) -> String { ... }      // "rgba(r,g,b,a)"
        pub fn to_hex(&self) -> String { ... }      // "#rrggbb"
        pub fn to_egui_color32(&self) -> [u8; 4] { [self.r, self.g, self.b, self.a] }
    }
}

pub mod spacing {
    pub struct Spacing {
        pub unit: f32,          // base unit (ex: 4.0)
        pub xs: f32, pub sm: f32, pub md: f32, pub lg: f32, pub xl: f32,
    }
}

pub mod typography {
    pub struct FontScale {
        pub xs: f32, pub sm: f32, pub body: f32, pub lg: f32, pub xl: f32, pub h1: f32,
    }
}

pub mod radius {
    pub struct RadiusScale {
        pub none: f32, pub sm: f32, pub md: f32, pub lg: f32, pub full: f32,
    }
}

pub mod theme {
    pub struct UiTheme {
        pub name: &'static str,
        pub palette: Palette,
        pub spacing: Spacing,
        pub typography: FontScale,
        pub radius: RadiusScale,
    }

    pub struct Palette {
        pub bg_primary: Rgba,
        pub bg_secondary: Rgba,
        pub bg_surface: Rgba,
        pub bg_overlay: Rgba,
        pub text_primary: Rgba,
        pub text_secondary: Rgba,
        pub text_muted: Rgba,
        pub accent_primary: Rgba,
        pub accent_secondary: Rgba,
        pub success: Rgba,
        pub warning: Rgba,
        pub error: Rgba,
        pub border_primary: Rgba,
        pub border_secondary: Rgba,
    }
}

pub mod catalog {
    pub const GAMING_STEAM: UiTheme = ...;
    pub const D2_MEDIEVAL: UiTheme = ...;
}
```

### Crate `miyuki-ui-dioxus` (Phase 1b-1d)

```
src/
  lib.rs                 # Re-exports publics
  context.rs             # ThemeProvider, use_theme(), use_palette()
  styles.rs              # token_to_css() + fonctions de style derivees
  atoms/
    mod.rs
    button.rs            # Button { variant, size, disabled, onclick }
    input.rs             # TextInput { placeholder, value, oninput }
    badge.rs             # Badge { label, color_variant }
    icon.rs              # Icon { name, size }
    text.rs              # Text { variant (body/heading/caption), children }
    divider.rs           # Divider { orientation }
    spinner.rs           # Spinner { size }
  molecules/
    mod.rs
    search_bar.rs        # SearchBar { value, onchange, placeholder }
    card.rs              # Card { header, body, footer, onclick }
    tab_item.rs          # TabItem { label, icon, is_active, closable, onclick }
    sidebar_item.rs      # SidebarItem { label, icon, is_active, onclick }
    form_field.rs        # FormField { label, input, error }
  organisms/
    mod.rs
    header.rs            # AppHeader { tabs, search, profile }
    sidebar.rs           # AppSidebar { sections, items }
    tab_bar.rs           # TabBar { tabs, active, on_select, on_close }
    grid.rs              # ResponsiveGrid { columns, gap, children }
    modal.rs             # Modal { title, body, actions, on_close }
    form.rs              # Form { fields, on_submit }
  templates/
    mod.rs
    service_layout.rs    # ServiceLayout { sidebar, content }
    fullscreen_layout.rs # FullscreenLayout { center_content }
    form_layout.rs       # FormLayout { card, title, fields, submit }
```

### Migration de `miyukini-service-ui`

```rust
// Nouveau contenu de miyukini-service-ui/src/lib.rs (phase 1f)
// Re-export complet pour retrocompatibilite

#[deprecated(note = "Utiliser miyuki-ui-dioxus directement")]
pub use miyuki_ui_dioxus::context::{use_theme, use_palette, ThemeContext};
pub use miyuki_ui_tokens::theme::{UiTheme as Theme};
// ... etc
```

---

## 4. Resume et prochaines etapes

### Ce qui est acquis
- Cartographie complete des 5 ilots UI existants
- Identification du probleme central (duplication code entre central/theme.rs et miyukini-service-ui)
- 3 approches proposees avec pros/cons
- Architecture preliminaire de l'approche recommandee (A)

### Reponses utilisateur (2026-03-01)

| Question | Reponse |
|----------|---------|
| **Q1 — Scope cross-backend** | **Pour tout** — V1 inclut Dioxus ET egui. Approche A confirmee (T5). |
| **Q2 — Workspaces** | **Separes** — COG et MGE restent des workspaces distincts. Le crate tokens sera partage par path relatif. |
| **Q3 — Themes** | **Multi-theme** — Theme COG (Steam/Gaming) + Theme D2 Medieval (MGE). L'UI MGE est specifique et optimisee pour le jeu. Le dev MGE est en pause en attendant les elements UI qui doivent etre une **copie fidele de l'interface Diablo 2**. Analyse screenshots D2 requise. |
| **Q4 — Atomic Design** | **Tout** — Atoms + Molecules + Organisms + Templates + Pages. Full Atomic Design. |
| **Q5 — miyuwidgets** | **Le plus pertinent** — Absorber ou laisser selon ce qui fait le plus de sens techniquement. |

### Approche validee : A — Design Tokens + Adaptateurs

### Decision supplementaire : Copie fidele UI Diablo 2

Le theme D2 Medieval ne doit pas etre une "inspiration" mais une **reproduction fidele** de l'interface de Diablo 2. Fabrice produit une analyse exhaustive de chaque ecran D2 (HUD, inventaire, skill tree, character sheet, etc.) dans `BRIEF-miyuki-ui-lib-d2-analysis.md`.

### Prochaines etapes

1. **Fabrice** (en cours) — Analyse exhaustive UI Diablo 2
2. **Lise** (en cours) — Direction artistique + catalogue Atomic Design complet
3. **Denis** — P1 Specification technique (apres Fabrice + Lise)
4. Passage en P1 → P2 → P3

---

*Brief genere par Maria — P0 Cadrage & Brainstorming*
*Classification : T5 | Approche recommandee : A (Design Tokens + Adaptateurs)*
*HARD GATE : En attente de reponses Q1-Q5 avant passage P1*
