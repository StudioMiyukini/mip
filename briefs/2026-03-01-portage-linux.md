# Brief de Cadrage P0 -- Portage Linux de Miyukini COG

**Classification MIP : T4 (Feature majeure, 10+ fichiers)**
**Date : 2026-03-01**
**Responsable P0 : Maria**
**Statut : EN ATTENTE APPROBATION**

---

## 1. Contexte

Miyukini COG est actuellement developpe et execute exclusivement sur Windows. L'objectif est de porter l'ensemble de l'ecosysteme (workspace COG + workspace MGE) pour compilation et execution sur Linux (Debian/Ubuntu en priorite, Fedora et Arch en secondaire).

Un guide de portage preliminaire existe deja dans `docs/implementation/Miyukini COG - Portage Linux Guide.md` (v0.1, 2026-02-15). Ce brief approfondit l'analyse technique et fournit un plan d'execution structure.

### Pourquoi T4 et pas T5

Le code Rust est deja largement cross-platform par nature. Plusieurs adaptations conditionnelles (`#[cfg(windows)]` / `#[cfg(not(windows))]`) sont deja en place dans les fichiers critiques. Le portage releve d'une feature majeure (10+ fichiers a toucher, CI a creer, tests a valider sur Linux) mais pas d'un chantier strategique car il n'y a pas de redesign architectural.

---

## 2. Objectifs

### Objectif principal
Permettre la compilation et l'execution de Miyukini COG et de ses services sur Linux x86_64 (Ubuntu 22.04+).

### Objectifs secondaires
- Mettre en place une CI GitHub Actions avec build Linux
- Creer des packages de distribution Linux (.deb, AppImage)
- Documenter les differences de comportement Windows/Linux
- Porter egalement le workspace MGE pour Linux

### Criteres de succes mesurables
1. `cargo build --workspace` passe sans erreur sur Ubuntu 22.04
2. `cargo test --workspace` passe sans erreur sur Linux
3. `cargo clippy --workspace -- -D warnings` passe sur Linux
4. Central se lance et affiche l'UI (Dioxus Desktop via WebKitGTK)
5. Origin se lance et accepte des connexions
6. Les 9 apps standalone se lancent sur Linux
7. miou-llm-bridge compile et infere sur Linux (CPU au minimum)

---

## 3. Perimetre (Scope)

### 3.1 INCLUS

#### Workspace COG (1369 fichiers .rs)
- **apps/central** (322 fichiers .rs dans apps/) -- Hub Dioxus Desktop
- **apps/origin** -- Serveur web MWS
- **apps/miou-llm-bridge** -- Service IA local (llama-cpp-2 + proxy)
- **9 apps standalone** : jayxpose, jayfestival, jaykoa, jaykonta, miyukiniwatch, jay1tribu, jaymanga, miyuclicker, lord_of_the_castle
- **~90 crates** dans crates/ (804 fichiers .rs)
- **tools/** : build-service-packages, mip-generator, toolkit-skeleton, toolkit-registry-export

#### Workspace MGE (221 fichiers .rs)
- Couche 1 Kernel : mge-core, mge-ecs, mge-math, mge-asset, mge-platform
- Couche 2 Engine : mge-render, mge-audio, mge-ui, mge-pathfinding, mge-collision, mge-collision-rich, mge-script, mge-net, mge-save
- Couche 3 Pack ARPG : 10 crates mge-arpg-*
- Couche 4 Game : sodomight, sodomight-server, sodomight-client
- Outils : mge-studio, mge-packer, mge-slicer, mge-rescale, mge-mirror, mge-remap

### 3.2 EXCLUS
- Cross-compilation Windows-vers-Linux (on compile nativement sur chaque OS)
- Portage macOS (hors scope, mais les `#[cfg]` existants le preparent)
- Portage ARM/aarch64 (uniquement x86_64 pour le moment)
- Distributions exotiques ou embarquees (Alpine, NixOS)
- CI pour le workspace MGE (separe, a planifier plus tard)

---

## 4. Analyse des besoins

### 4.1 Etat actuel de la compatibilite

Le projet est en **bon etat** pour le portage. Voici l'inventaire des adaptations deja presentes :

| Fichier | Adaptation existante | Statut |
|---------|---------------------|--------|
| `crates/kindmother-db-key/src/key_derivation.rs` | `#[cfg(windows)]` winreg + `#[cfg(not(windows))]` /etc/machine-id | FAIT |
| `crates/kindmother-db-key/Cargo.toml` | `[target.'cfg(windows)'.dependencies] winreg` | FAIT |
| `crates/kindmother-service/src/database.rs` | `#[cfg(unix)]` permissions 0o700 | FAIT |
| `apps/central/src/main.rs` | `#[cfg(windows)]` WebView2 + `#[cfg(not(windows))]` error dialog | FAIT |
| `apps/central/src/audio.rs` | `#[cfg(windows)]` fallback shell + `#[cfg(not(windows))]` rodio only | FAIT |
| `apps/central/src/kindmother_launcher.rs` | `cfg!(windows)` pour .exe vs pas d'extension + `where` vs `which` | FAIT |
| `apps/central/src/service_manager/installer.rs` | `cfg!(windows)` pour .exe dans les noms de binaires | FAIT |
| `apps/miou-llm-bridge/src/hardware.rs` | `#[cfg(target_os = "windows")]` wmic + `#[cfg(not(...))]` fallback None | FAIT (partiel) |
| `apps/miou-llm-bridge/src/skills/shell_exec.rs` | `#[cfg(target_os = "windows")]` cmd + `#[cfg(not(...))]` sh | FAIT |
| `crates/miyuwebway_participant/src/relay_client.rs` | `#[cfg(target_os)]` pour OS type detection | FAIT |
| `apps/origin/src/protocol/types.rs` | Detection OS complete (Win/Linux/macOS/Android/iOS) | FAIT |
| `tools/build-service-packages/build-services.sh` | Detection `.exe` via `$OSTYPE` | FAIT |

### 4.2 Points necessitant du travail

#### A. Repertoires de donnees (PRIORITE HAUTE)

Le pattern actuel dans les apps standalone utilise `LOCALAPPDATA` (Windows) avec un fallback sur `"."` :

```rust
let base = std::env::var("LOCALAPPDATA")
    .unwrap_or_else(|_| ".".to_string());
```

**Fichiers concernes :**
- `apps/miyukiniwatch/src/main.rs` (ligne 39)
- `apps/jaykoa/src/main.rs` (ligne 39)
- `apps/jayxpose/src/main.rs` (ligne 41)
- `apps/jayfestival/src/main.rs`
- `apps/jaymanga/src/main.rs`
- `apps/jay1tribu/src/main.rs`
- `apps/jaykonta/src/main.rs`
- `apps/miyuclicker/src/main.rs`
- `apps/central/src/service_manager/registry.rs` (lignes 12-19)

**Action requise :** Creer une fonction utilitaire partagee `miyukini_data_dir()` qui retourne :
- Windows : `%LOCALAPPDATA%/Miyukini-COG/`
- Linux : `$XDG_DATA_HOME/miyukini-cog/` ou `~/.local/share/miyukini-cog/`

Possibilite d'utiliser le crate `dirs` (multiplateforme) ou d'implementer manuellement via `$HOME`.

#### B. Detection GPU sur Linux (PRIORITE MOYENNE)

**Fichier :** `apps/miou-llm-bridge/src/hardware.rs` (lignes 168-172)

Le fallback non-Windows retourne `None` pour le GPU. Sur Linux, on peut detecter le GPU via :
- `lspci | grep VGA`
- `/sys/class/drm/card*/device/vendor` + `/sys/class/drm/card*/device/device`
- NVIDIA : `nvidia-smi --query-gpu=name,memory.total --format=csv`

**Action requise :** Implementer `detect_gpu()` pour Linux.

#### C. Service registry path (PRIORITE HAUTE)

**Fichier :** `apps/central/src/service_manager/registry.rs`

La fonction `services_root_dir()` utilise uniquement `LOCALAPPDATA`. Meme pattern que A, necessiterait le meme fix XDG.

#### D. llama-cpp-2 sur Linux (PRIORITE HAUTE)

**Crate :** `apps/miou-llm-bridge/Cargo.toml` - `llama-cpp-2 = { version = "0.1", features = ["sampler"] }`

Le crate `llama-cpp-2` compile llama.cpp nativement. Sur Linux :
- Necessite `cmake` et `g++` (ou `clang++`)
- Feature `cuda` necessite le CUDA toolkit
- La compilation est standard sur Linux, pas de blocker identifie

#### E. Audio (cpal + rodio + kira) (PRIORITE MOYENNE)

- **rodio** (Central) : Utilise CPAL en backend. CPAL utilise ALSA sur Linux. Necessite `libasound2-dev`.
- **cpal** (miyuvoicecapture) : Meme prerequis ALSA.
- **kira** (MGE mge-audio) : Utilise CPAL. Meme prerequis.

Pas de blocker technique, mais `libasound2-dev` est un prerequis obligatoire.

#### F. Dioxus Desktop WebView (PRIORITE HAUTE)

12 binaires utilisent `dioxus = { features = ["desktop"] }` :
- Central, jayxpose, jayfestival, jaykoa, jaykonta, miyukiniwatch, jay1tribu, jaymanga, miyuclicker, lord_of_the_castle, miyukini-service-ui, ui-builder

Dioxus Desktop utilise :
- **Windows** : WebView2 (Edge Chromium)
- **Linux** : WebKitGTK 4.1

Prerequisites Linux : `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

**Risque :** WebKitGTK peut avoir un comportement de rendu legerement different de WebView2. Les styles CSS/HTML generes par Dioxus doivent etre valides pour les deux moteurs.

#### G. wgpu (MGE) (PRIORITE MOYENNE)

**Crates MGE :** mge-platform, mge-render

wgpu utilise :
- **Windows** : Direct3D 12 (ou Vulkan)
- **Linux** : Vulkan (via `libvulkan-dev` + driver GPU)

Prerequisites Linux : `libvulkan-dev`, mesa (Vulkan drivers pour Intel/AMD) ou pilotes proprietaires NVIDIA.

#### H. CI/CD (PRIORITE HAUTE)

Aucune CI GitHub Actions n'existe actuellement (pas de `.github/` ni de `Dockerfile`).

**Action requise :** Creer un workflow GitHub Actions avec :
- Matrix : windows-latest + ubuntu-22.04
- Steps : installer deps systeme, `cargo build --workspace`, `cargo test --workspace`, `cargo clippy`

### 4.3 Besoins en ressources

| Besoin | Detail |
|--------|--------|
| Machine Linux | VM Ubuntu 22.04 ou WSL2 pour les tests locaux |
| CI | GitHub Actions (gratuit pour repos publics) |
| Crate `dirs` | Optionnel, pour la resolution multiplateforme des repertoires |
| Dependances systeme Linux | build-essential, pkg-config, libssl-dev, libsqlite3-dev, libgtk-3-dev, libwebkit2gtk-4.1-dev, libasound2-dev, cmake, libvulkan-dev |

---

## 5. Plan de projet

### 5.1 Phases et jalons

| Phase | Description | Jalon | Effort estime | Dependances |
|-------|-------------|-------|---------------|-------------|
| **Ph.1** | Fonction utilitaire `miyukini_data_dir()` | Build compile sur Linux | 2-4h | Aucune |
| **Ph.2** | Fix des 10+ apps standalone (data_dir) | Toutes les apps utilisent XDG | 3-5h | Ph.1 |
| **Ph.3** | GPU detection Linux (miou-llm-bridge) | `detect_gpu()` fonctionne | 2-3h | Aucune |
| **Ph.4** | CI GitHub Actions (Linux + Windows) | CI verte sur les 2 OS | 3-5h | Aucune |
| **Ph.5** | Test compilation complete Linux | `cargo build --workspace` OK | 2-4h | Ph.1-2 |
| **Ph.6** | Test execution (Central + Origin + services) | Smoke test OK | 4-8h | Ph.5 |
| **Ph.7** | MGE build Linux | Workspace MGE compile | 2-4h | Aucune |
| **Ph.8** | Packaging (.deb, AppImage) | Packages distribues | 4-8h | Ph.5-6 |
| **Ph.9** | Mise a jour documentation | Guide portage v1.0 | 2-3h | Ph.1-8 |

**Estimation totale : 24-44 heures (fourchette)**

### 5.2 Distribution des taches

| Agent | Responsabilite | Livrables |
|-------|---------------|-----------|
| **Denis** | Spec technique du module `miyukini_data_dir`, specs CI, plan atomique | Spec, plan P2 |
| **Francois** | `miyukini_data_dir()`, fix apps standalone, GPU detection Linux, build system | Code, tests unitaires |
| **Lise** | Validation UI Dioxus sur WebKitGTK, differences rendu | Rapport UI, fixes CSS si besoin |
| **George** | Audit compilation + execution Linux, smoke tests | Rapport d'audit P4 |
| **Arianne** | Mise a jour doc portage, archivage decisions | Doc v1.0, memoire |

---

## 6. Inventaire detaille des fichiers a modifier

### Categorie A : Data directories (HAUTE PRIORITE)

| Fichier | Modification | Complexite |
|---------|-------------|------------|
| **NOUVEAU** `crates/miyukini-kernel/src/platform.rs` (ou crate dedie) | Fonction `miyukini_data_dir()` + `miyukini_config_dir()` + `miyukini_cache_dir()` | Moyenne |
| `apps/central/src/service_manager/registry.rs` | Utiliser `miyukini_data_dir()` | Faible |
| `apps/central/src/kindmother_launcher.rs` | Utiliser `miyukini_data_dir()` pour `kindmother_data_dir()` | Faible |
| `apps/miyukiniwatch/src/main.rs` | Utiliser `miyukini_data_dir()` au lieu de LOCALAPPDATA | Faible |
| `apps/jaykoa/src/main.rs` | Idem | Faible |
| `apps/jayxpose/src/main.rs` | Idem | Faible |
| `apps/jayfestival/src/main.rs` | Idem |Faible |
| `apps/jaymanga/src/main.rs` | Idem | Faible |
| `apps/jay1tribu/src/main.rs` | Idem | Faible |
| `apps/jaykonta/src/main.rs` | Idem | Faible |
| `apps/miyuclicker/src/main.rs` | Idem | Faible |

### Categorie B : Hardware/GPU detection

| Fichier | Modification | Complexite |
|---------|-------------|------------|
| `apps/miou-llm-bridge/src/hardware.rs` | Implementer `detect_gpu()` pour Linux (lspci/nvidia-smi) | Moyenne |

### Categorie C : CI/CD

| Fichier | Modification | Complexite |
|---------|-------------|------------|
| **NOUVEAU** `.github/workflows/ci.yml` | Workflow CI multi-OS | Moyenne |
| **NOUVEAU** `Dockerfile` (optionnel) | Build reproductible | Faible |

### Categorie D : Documentation

| Fichier | Modification | Complexite |
|---------|-------------|------------|
| `docs/implementation/Miyukini COG - Portage Linux Guide.md` | Mise a jour v1.0 avec les XDG, CI, packages | Faible |

---

## 7. Risques et mitigations

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R1 | WebKitGTK rendu different de WebView2 (CSS/layout) | Moyen | Moyen | Tests UI sur les 2 plateformes, Lise verifie chaque ecran |
| R2 | llama-cpp-2 ne compile pas sur Linux (binding C++) | Faible | Eleve | Le crate est multi-OS; tester la compilation early |
| R3 | ALSA non dispo sur certains Linux (Wayland sans PulseAudio bridge) | Faible | Moyen | Documenter le prerequis, proposer PipeWire comme alternative |
| R4 | Vulkan drivers manquants pour MGE (wgpu) | Moyen | Moyen | Fallback software renderer; documenter les drivers requis |
| R5 | patch-crates/libsql-ffi utilise `cp` et des commandes Unix dans build.rs | Faible | Eleve | Deja un `#[cfg(not(target_os = "macos"))]` dans le build.rs, verifier pour Linux |
| R6 | Differences de permissions fichiers (database, secrets) | Faible | Moyen | Deja gere via `#[cfg(unix)]` dans kindmother-service et kindmother-db-key |
| R7 | Performance UI WebKitGTK vs WebView2 | Moyen | Faible | Acceptable pour v1.0, optimiser plus tard si besoin |

---

## 8. Budget et ressources

### 8.1 Couts estimes (fourchette heures-homme)

| Poste | Optimiste | Pessimiste | Notes |
|-------|-----------|------------|-------|
| Module platform/data_dir | 2h | 4h | Si on utilise `dirs` crate = plus rapide |
| Fix apps standalone (x10) | 3h | 5h | Repetitif, meme pattern |
| GPU detection Linux | 2h | 3h | Parsing lspci + nvidia-smi |
| CI GitHub Actions | 3h | 5h | Matrix multi-OS |
| Test compilation complete | 2h | 4h | Depend de l'acces a une machine Linux |
| Test execution + smoke tests | 4h | 8h | Depend des corrections de rendu UI |
| MGE build Linux | 2h | 4h | wgpu + kira devraient compiler |
| Packaging (.deb, AppImage) | 4h | 8h | AppImage plus simple que .deb |
| Documentation | 2h | 3h | Mise a jour guide existant |
| **TOTAL** | **24h** | **44h** | |

### 8.2 Dependances externes

| Dependance | Cout | Justification |
|------------|------|---------------|
| Crate `dirs` (optionnel) | 0 | Resolution XDG cross-platform |
| GitHub Actions runner | 0 | Gratuit pour repos publics, inclus dans plan prive |
| VM Linux ou WSL2 | 0 | Deja disponible via WSL2 |

---

## 9. Constats positifs

Le projet est **bien prepare** pour le portage Linux :

1. **Aucun chemin Windows hardcode** dans le code Rust (pas de `C:\Users\...` en dur)
2. **Toutes les APIs Windows critiques ont deja un `#[cfg]` Linux** :
   - winreg -> /etc/machine-id
   - LOCALAPPDATA -> fallback (a ameliorer vers XDG)
   - .exe -> pas d'extension
   - cmd /C -> sh -c
   - wmic -> (a implementer)
3. **Pas de crate Windows-only** bloquant (winreg est conditionnel via `[target.'cfg(windows)'.dependencies]`)
4. **rusqlite bundled** : Compile SQLite en embedded, pas de dependance systeme
5. **reqwest avec rustls-tls** : Pas de dependance OpenSSL native (sauf Origin qui utilise tokio-rustls)
6. **Le guide de portage existe deja** (docs/implementation/)
7. **Les scripts de build gerent deja** les extensions .exe conditionnellement

---

## 10. Decision de classification

### Classification : **T4 -- Feature majeure**

**Justification :**
- 10+ fichiers a modifier directement
- Creation de nouveaux fichiers (CI, module platform)
- Tests sur un OS different
- Impact transversal (toutes les apps)
- Mais PAS de redesign architectural, PAS de nouveau crate majeur, PAS de refactoring fondamental

### Phases MIP declenchees : Toutes (P0 -> P1 -> P2 -> P3 -> P4 -> P5 -> P6)

### Fabrice : Non requis en parallele
L'analyse concurrentielle n'est pas pertinente pour un portage OS. Pas de PR externe a analyser.

---

## 11. Prochaines etapes

1. **GATE P0** : Approbation de ce brief par l'utilisateur
2. Denis prend la main pour P1 (spec technique du module platform + CI)
3. Denis produit le plan atomique P2
4. Francois et Lise executent P3 en parallele :
   - Francois : module platform, fix apps, GPU detection, CI
   - Lise : validation UI WebKitGTK, corrections CSS si besoin
5. Denis + George : P4 integration et audit
6. Denis : P5 livraison
7. Arianne : P6 archivage et capitalisation

---

**Redige par : Maria (Chef de Projet)**
**Classification : T4**
**Prochaine action : Approbation utilisateur**
