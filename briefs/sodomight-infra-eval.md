# Evaluation Infrastructure Sodomight/MGE -- Condense
<!-- Refactorise le 2026-03-03. Original: 759 lignes -> 99 lignes -->

> **Agent** : Hugo | **Phase** : P0 T4 + T9 | **Date** : 2026-03-02
> **Etat CI/CD** : ABSENT (ni workflows, ni Dockerfile, ni rust-toolchain.toml, ni cargo-audit)

---

## Metriques build

| Metrique | Valeur |
|----------|--------|
| Rust installe | 1.93.1 (MSRV declare 1.75) |
| Crates workspace | 34 |
| Deps dans Cargo.lock | 545 (120 avec build scripts) |
| target/ (debug) | 15 Go |
| assets/ | 874 Mo |
| Build a froid (CI, 2 vCPU) | 25-45 min |
| Build incremental (cache chaud) | 2-8 min |

### Binaires debug (Windows)

| Binaire | Debug | Release estime (stripped) |
|---------|-------|--------------------------|
| sodomight.exe | 776 Ko | 2-4 Mo |
| sodomight-server.exe | 775 Ko | 1-3 Mo |
| sodomight-client.exe | 16.4 Mo | 30-60 Mo |

---

## Setup contributeur

```bash
# 1. Installer rustup + cloner repo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
git clone <url> Miyukini-COG && cd Miyukini-COG/mge

# 2. Linux seulement : deps systeme
sudo apt install -y libvulkan-dev vulkan-tools libasound2-dev \
    libxkbcommon-dev libwayland-dev libx11-dev pkg-config build-essential

# 3. Outils dev
cargo install cargo-nextest sccache

# 4. Build + tests
cargo build --workspace && cargo nextest run --workspace
```

**Windows** : VS Build Tools 2022 + DX12/Vulkan GPU drivers
**macOS** : Xcode CLT (Metal natif)

---

## Pipeline CI/CD recommande

**Plateforme** : GitHub Actions (repo deja sur Git, `working-directory: mge/`)

| Stage | Job | Gate |
|-------|-----|------|
| 1 | `cargo check --workspace` | Syntaxe OK |
| 2 | `cargo clippy --workspace -- -D warnings` | 0 warnings |
| 3 | `cargo nextest run --workspace` | 100% pass |
| 4 | `cargo audit` | 0 CVE critique |
| 5 | `cargo build --release` (matrix Linux/Windows/macOS) | Artifacts uploades |

**Fichier** : `.github/workflows/mge-ci.yml` (a creer)
**Optimisations** : sccache + cache Cargo + nextest

---

## Serveur de jeu

| Config | Valeur |
|--------|--------|
| Port | 7777/TCP |
| Max clients | 200 (configurable) |
| Tick rate | 25 tps |
| Protocol | tokio async TCP + framing codec |

### Besoins serveur (8 joueurs)

| Ressource | Besoin | Recommande |
|-----------|--------|------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 256-512 Mo | 1-2 Go |
| Reseau | 1-5 Mbps | 10 Mbps |
| Stockage | 5-20 Go | 50 Go SSD |

**MVP** : VPS COG existant (46.202.x.x) -- serveur headless coexiste facilement.
**Post-MVP** : VPS dedie Hetzner CX22 (~5-6 EUR/mois).

---

## Actions immediates

| Prio | Action | Effort |
|------|--------|--------|
| P0 | Creer `mge/rust-toolchain.toml` (epingler 1.85.0) | 15 min |
| P0 | Creer `.github/workflows/mge-ci.yml` | 1h |
| P1 | Profil release dans `mge/Cargo.toml` (lto=thin, strip=symbols, panic=abort) | 30 min |
| P1 | Tagger tests GPU avec `#[ignore]` | 1-2h |
| P2 | `mge/.cargo/config.toml` (linker lld) | 30 min |
| P2 | `cargo audit --fix` | 1h |
| P3 | Health check HTTP serveur (port 7778) | 2-4h |
| P3 | Script deploiement systemd | 1h |
