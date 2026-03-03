# Plan d'implementation MiyuCloud v2 -- Securite + Onboarding

**Auteur** : Denis (Chef Dev Senior)
**Date** : 2026-03-03
**Classification MIP** : T4 (Feature majeure)
**Phase** : P0 -- Temps 7 (Plan exhaustif + Guide d'implementation)
**Statut** : REDACTION COMPLETE

**Documents source** :
- Spec technique Francois (T6) : `specs/2026-03-03-miyucloud-v2-spec-technique.md`
- Audit securite Victor (T5) : Score 72/100, 23 defauts, cible >95/100
- Ideation Lise (T2) : 19 composants nouveaux, 10 a modifier
- CI/CD Hugo (T9) : Pipeline GitHub Actions + systemd + Caddy

**TL;DR** : 67 taches en 10 vagues, 8 fichiers crate a creer, 4 fichiers app API a creer, 13 fichiers a modifier, 4 nouvelles deps Cargo, 15 nouveaux endpoints API, 4 tables SQLite. Agents : Francois (back), Lise (front), Hugo (infra), Victor (spot-checks), Denis (coordination + merge).

**Modules annexes** (detail tache par tache) :
- `2026-03-03-miyucloud-v2-plan-V0-V3.md` -- Vagues 0 a 3
- `2026-03-03-miyucloud-v2-plan-V4-V7.md` -- Vagues 4 a 7
- `2026-03-03-miyucloud-v2-plan-V8-V9.md` -- Vagues 8 a 9

---

## Vue d'ensemble des vagues

| Vague | Nom | Taches | Agents | Gate |
|-------|-----|--------|--------|------|
| V0 | Setup | 5 | Denis | Branch + deps + smoke test OK |
| V1 | Securite critique | 8 | Francois + Victor | F-02,F-04,F-05,F-06 corriges + tests |
| V2 | Auth (TOTP + Sessions) | 10 | Francois (back) + Lise (front) | 20 tests TOTP + 10 tests sessions |
| V3 | Onboarding + Monitoring | 8 | Francois (back) + Lise (front) | Onboarding e2e + health OK |
| V4 | API Handlers + Routes | 8 | Francois | 15 endpoints fonctionnels |
| V5 | Securite hardening | 7 | Francois + Victor | F-07,F-08,F-10 + headers HTTP |
| V6 | UX Polish front-end | 8 | Lise | Composants 2FA, sessions, onboarding |
| V7 | Infrastructure | 6 | Hugo | CI/CD + systemd + Caddy |
| V8 | Documentation + MSCM | 3 | Denis + Francois | Annotations 100% nouveaux fichiers |
| V9 | Integration finale | 4 | Denis + George + Victor | cargo test/clippy clean, audit >95 |
| **Total** | | **67** | | |

---

## DAG de dependances

```
V0 (Setup) ──────────┬─────────────────────┐
                      v                     v
               V1 (Securite)          V6 (UX front) [partiel]
                      |                     |
                      v                     |
               V2 (Auth TOTP+Sessions)      |
                      |                     |
                      v                     |
               V3 (Onboarding+Monitoring)   |
                      |                     |
                      v                     v
               V4 (API Handlers) ──> V6 (UX front) [reste]
                      |                     |
                      v                     v
               V5 (Hardening)         V7 (Infra)
                      |                     |
                      v                     v
               V8 (Doc+MSCM) ────> V9 (Integration)
```

**Parallelisme Loi 9** :
- V1 + V6 (partiel) en parallele (fichiers distincts)
- V2 back + V2 front en parallele (Francois: crate, Lise: Central UI)
- V3 back + V3 front en parallele
- V5 + V7 en parallele (securite back vs infra)

---

## Smoke test (V0-T05)

**Fichier** : `crates/miyucloud/tests/v2_smoke_test.rs`

```rust
#[test]
fn smoke_test_v2_modules_exist() {
    // Verifie que les modules sont declares et accessibles
    // Compile mais echoue car les fonctions ne sont pas implementees
    let _totp_enabled = miyucloud::auth::totp::is_totp_enabled;
    let _create_session = miyucloud::auth::sessions::create_session;
    let _onboarding = miyucloud::domain::onboarding::get_status;
    let _health = miyucloud::monitoring::health_check;
    let _html_escape = miyucloud::utils::sanitize::html_escape;
    let _ct_eq = miyucloud::utils::constant_time::constant_time_eq;
    let _b64_encode = miyucloud::utils::base64::encode;
}
```

**Critere** : Compile avec `cargo build -p miyucloud` mais le test echoue (fonctions stubs retournent `todo!()`).

---

## Vague 0 : Setup (Denis)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V0-T01 | Creer feature branch `feat/miyucloud-v2` + push | -- | -- | Branch existe sur remote |
| V0-T02 | Ajouter deps Cargo.toml | `crates/miyucloud/Cargo.toml` | -- | `cargo build -p miyucloud` OK |
| V0-T03 | Creer modules stubs (utils, monitoring, totp, sessions, onboarding) | 8 fichiers .rs + 3 mod.rs | V0-T02 | `cargo check -p miyucloud` OK |
| V0-T04 | Ajouter CREATE TABLE 4 nouvelles tables dans `init_schema()` | `kindmother_db.rs` | V0-T02 | Schema cree sans erreur |
| V0-T05 | Ecrire smoke test e2e | `tests/v2_smoke_test.rs` | V0-T03 | Compile, test echoue (expected) |

**Gate V0** : `cargo check -p miyucloud` passe. Smoke test compile.

---

## Vague 1 : Securite critique (Francois + Victor spot-check)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V1-T01 | Impl `utils/constant_time.rs` (subtle) | `utils/constant_time.rs` | V0-T03 | 3 tests passent |
| V1-T02 | Impl `utils/sanitize.rs` (html_escape, sanitize_filename, validate_uuid) | `utils/sanitize.rs` | V0-T03 | 10 tests passent |
| V1-T03 | Impl `utils/base64.rs` (encode/decode) | `utils/base64.rs` | V0-T03 | 2 tests passent |
| V1-T04 | F-02 : Remplacer XOR par subtle dans `web_tokens.rs` | `auth/web_tokens.rs` | V1-T01 | Tests existants passent |
| V1-T05 | F-04 : html_escape dans `share_page.rs` | `share_page.rs` | V1-T02 | Test XSS passe |
| V1-T06 | F-05 : validate_uuid dans `local_fs.rs` | `storage/local_fs.rs` | V1-T02 | Test path traversal passe |
| V1-T07 | F-06 : Sel derive HKDF dans `access_log.rs` | `access_log.rs` | V0-T02 | Test hash_ip stable passe |
| V1-T08 | Tests unitaires V1 complets | -- | V1-T01..T07 | `cargo test -p miyucloud -- utils` clean |

**Gate V1** : `cargo test -p miyucloud` passe. Victor spot-check sur F-02 et F-04.
**Parallelisme** : V1-T01, V1-T02, V1-T03 sont independants (Loi 9 : 3 taches -> parallele).

---

## Vague 2 : Auth TOTP + Sessions (Francois back + Lise front)

### Back-end (Francois)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V2-T01 | Impl `auth/totp.rs` -- setup_totp + encrypt/decrypt secret | `auth/totp.rs` | V1-T01,V1-T03 | 4 tests passent |
| V2-T02 | Impl `auth/totp.rs` -- validate_totp + recovery codes | `auth/totp.rs` | V2-T01 | 6 tests supplementaires |
| V2-T03 | Impl `auth/sessions.rs` -- create + validate + revoke | `auth/sessions.rs` | V1-T01 | 6 tests passent |
| V2-T04 | Impl `auth/sessions.rs` -- purge + totp_verified + list | `auth/sessions.rs` | V2-T03 | 4 tests supplementaires |
| V2-T05 | CRUD DB totp_secrets + recovery_codes + sessions | `data/kindmother_db.rs` | V0-T04 | Tests CRUD passent |

### Front-end (Lise) -- en parallele

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V2-T06 | Composant TotpSetupWizard (QR + codes recovery) | `services/miyucloud/totp_setup.rs` | V0-T03 | Compile, affiche QR mock |
| V2-T07 | Composant TotpVerifyForm (input 6 chiffres) | `services/miyucloud/totp_verify.rs` | V0-T03 | Compile, layout OK |
| V2-T08 | Composant SessionList (liste + revoke) | `services/miyucloud/session_list.rs` | V0-T03 | Compile, affiche mock |
| V2-T09 | Modifier `settings.rs` pour onglet Securite (2FA + Sessions) | `services/miyucloud/settings.rs` | V2-T06,T07,T08 | Compile, onglet visible |
| V2-T10 | Tests V2 complets | -- | V2-T01..T09 | `cargo test -p miyucloud -- auth` clean |

**Gate V2** : 20 tests auth passent. Composants front compilent. Denis checkpoint.

---

## Vague 3 : Onboarding + Monitoring (Francois back + Lise front)

### Back-end (Francois)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V3-T01 | Impl `domain/onboarding.rs` (get_status, check_*, complete, reset) | `domain/onboarding.rs` | V2-T01 | 8 tests passent |
| V3-T02 | Impl `monitoring/mod.rs` (health_check, collect_metrics, disk_space) | `monitoring/mod.rs` | V0-T04 | 4 tests passent |
| V3-T03 | CRUD DB cloud_onboarding dans kindmother_db | `data/kindmother_db.rs` | V0-T04 | Tests CRUD passent |

### Front-end (Lise) -- en parallele

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V3-T04 | Composant OnboardingWizard (4 etapes, stepper) | `services/miyucloud/onboarding.rs` | V0-T03 | Compile, 4 etapes visibles |
| V3-T05 | Composant HealthDashboard (statuts, metriques) | `services/miyucloud/health_dashboard.rs` | V0-T03 | Compile, layout OK |
| V3-T06 | Modifier `mod.rs` pour route onboarding au premier lancement | `services/miyucloud/mod.rs` | V3-T04 | Redirection si pas onboarde |
| V3-T07 | Modifier `sidebar.rs` pour badge sante (vert/jaune/rouge) | `services/miyucloud/sidebar.rs` | V3-T05 | Badge visible |
| V3-T08 | Tests V3 complets | -- | V3-T01..T07 | `cargo test -p miyucloud -- domain::onboarding` clean |

**Gate V3** : Onboarding e2e fonctionne. Health check retourne JSON valide. Denis checkpoint.

---

## Vague 4 : API Handlers + Routes (Francois)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V4-T01 | Creer `api/onboarding.rs` (4 handlers) | `apps/miyucloud/src/api/onboarding.rs` | V3-T01 | Compile |
| V4-T02 | Creer `api/totp.rs` (6 handlers) | `apps/miyucloud/src/api/totp.rs` | V2-T01,T02 | Compile |
| V4-T03 | Creer `api/sessions.rs` (3 handlers) | `apps/miyucloud/src/api/sessions.rs` | V2-T03,T04 | Compile |
| V4-T04 | Creer `api/monitoring.rs` (2 handlers) | `apps/miyucloud/src/api/monitoring.rs` | V3-T02 | Compile |
| V4-T05 | Modifier `api/mod.rs` : ajouter 15 routes | `apps/miyucloud/src/api/mod.rs` | V4-T01..T04 | `cargo build` OK |
| V4-T06 | Remplacer base64 manuelle dans `main.rs` | `apps/miyucloud/src/main.rs` | V1-T03 | Tests existants passent |
| V4-T07 | Tests integration API (curl-like) | `apps/miyucloud/tests/` | V4-T05 | 15 endpoints repondent |
| V4-T08 | Tests V4 complets | -- | V4-T01..T07 | `cargo test -p miyucloud-server` clean |

**Gate V4** : 42 routes API totales fonctionnelles. Denis checkpoint + push.

---

## Vague 5 : Securite hardening (Francois + Victor)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V5-T01 | F-07 : Logger Preview dans `share_page.rs` | `share_page.rs` | V4-T05 | Test log preview passe |
| V5-T02 | F-08 : Purge HashMap rate_limiter toutes les 100 req | `rate_limiter.rs` | V0 | Test purge passe |
| V5-T03 | F-10 : trust_proxy dans config + rate_limiter | `config.rs`, `rate_limiter.rs` | V0 | Test trust_proxy passe |
| V5-T04 | Headers HTTP securite (X-Content-Type-Options, etc.) | `apps/miyucloud/src/main.rs` | V4-T05 | Headers presents dans response |
| V5-T05 | Zeroize secrets TOTP en memoire | `auth/totp.rs` | V2-T02 | `Zeroizing<>` wrapper en place |
| V5-T06 | Test d'integration F-01 (download bypass) | `tests/` | V4-T05 | Test confirme protection active |
| V5-T07 | Victor audit securite spot-check complet | -- | V5-T01..T06 | Score >90/100 |

**Gate V5** : Toutes les corrections F-xx appliquees. Victor valide score >90.

---

## Vague 6 : UX Polish front-end (Lise)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V6-T01 | RecoveryCodesModal (affichage + copie + PDF) | `services/miyucloud/recovery_codes.rs` | V2-T06 | Compile, modal affiche codes |
| V6-T02 | Toast notifications (success/error/warning) | `services/miyucloud/components.rs` | V0 | Toast visible 3s puis disparait |
| V6-T03 | Icones SVG securite (lock, shield, key) | `services/miyucloud/components.rs` | V0 | Icones rendues |
| V6-T04 | Drag & drop upload ameliore (progress bar) | `services/miyucloud/upload.rs` | V4-T05 | Progress visible |
| V6-T05 | File preview inline (images, texte, PDF) | `services/miyucloud/file_detail.rs` | V4-T05 | Preview image inline |
| V6-T06 | Palette couleurs MiyuCloud dans theme | `apps/central/src/theme.rs` | V0 | Couleurs appliquees |
| V6-T07 | Responsive layout explorer (grille/liste) | `services/miyucloud/explorer.rs` | V0 | Toggle grille/liste |
| V6-T08 | Tests front compilation complete | -- | V6-T01..T07 | `cargo build -p central` OK |

**Gate V6** : Tous les composants compilent. Layout coherent.

---

## Vague 7 : Infrastructure (Hugo)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V7-T01 | GitHub Actions workflow (lint + test + build) | `.github/workflows/miyucloud.yml` | V5 | Workflow syntax valide |
| V7-T02 | systemd service sandboxe | `deploy/miyucloud.service` | V4-T05 | Fichier service valide |
| V7-T03 | Caddyfile reverse proxy + Let's Encrypt | `deploy/Caddyfile` | V4-T05 | Syntax valide |
| V7-T04 | Script deploy.sh (build + install + restart) | `deploy/deploy.sh` | V7-T02 | Script executable |
| V7-T05 | Script backup.sh (DB + storage) | `deploy/backup.sh` | V4-T05 | Script executable |
| V7-T06 | Healthcheck script pour monitoring externe | `deploy/healthcheck.sh` | V3-T02 | Retourne 0 si healthy |

**Gate V7** : Tous les fichiers deploy/ valides. Hugo verifie.

---

## Vague 8 : Documentation + MSCM (Denis + Francois)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V8-T01 | Annotations MSCM sur tous les nouveaux fichiers (12 fichiers) | 12 fichiers .rs | V5,V6 | `@id`, `@do`, `@role` presents |
| V8-T02 | Mise a jour `data/mod.rs` et `data/types.rs` re-exports | `data/mod.rs`, `data/types.rs` | V5 | Imports propres |
| V8-T03 | Mise a jour mscm_index/ pour nouveaux modules | `mscm_index/` | V8-T01 | Index a jour |

**Gate V8** : 100% MSCM sur les nouveaux fichiers.

---

## Vague 9 : Integration finale (Denis + George + Victor)

| ID | Description | Fichiers | Deps | Critere |
|----|------------|----------|------|---------|
| V9-T01 | `cargo build --workspace` clean | -- | V8 | 0 erreur |
| V9-T02 | `cargo test --workspace` clean | -- | V9-T01 | 0 echec |
| V9-T03 | `cargo clippy --workspace -- -D warnings` clean | -- | V9-T01 | 0 warning |
| V9-T04 | Audit George (conformite, UX, securite) + Audit Victor (score >95) | -- | V9-T03 | CONFORME |

**Gate V9 (Gate finale)** : Build + test + clippy = 0 defaut. Audit score >95/100.

---

## Recapitulatif fichiers

### A creer (12 fichiers crate + 4 fichiers app + 1 test)

| Fichier | Vague | Agent | Lignes est. |
|---------|-------|-------|-------------|
| `crates/miyucloud/src/utils/mod.rs` | V0 | Denis | ~10 |
| `crates/miyucloud/src/utils/constant_time.rs` | V1 | Francois | ~30 |
| `crates/miyucloud/src/utils/sanitize.rs` | V1 | Francois | ~80 |
| `crates/miyucloud/src/utils/base64.rs` | V1 | Francois | ~30 |
| `crates/miyucloud/src/auth/totp.rs` | V2 | Francois | ~300 |
| `crates/miyucloud/src/auth/sessions.rs` | V2 | Francois | ~250 |
| `crates/miyucloud/src/domain/onboarding.rs` | V3 | Francois | ~200 |
| `crates/miyucloud/src/monitoring/mod.rs` | V3 | Francois | ~150 |
| `apps/miyucloud/src/api/onboarding.rs` | V4 | Francois | ~100 |
| `apps/miyucloud/src/api/totp.rs` | V4 | Francois | ~200 |
| `apps/miyucloud/src/api/sessions.rs` | V4 | Francois | ~100 |
| `apps/miyucloud/src/api/monitoring.rs` | V4 | Francois | ~80 |
| `crates/miyucloud/tests/v2_smoke_test.rs` | V0 | Denis | ~20 |
| `apps/central/.../miyucloud/totp_setup.rs` | V2 | Lise | ~150 |
| `apps/central/.../miyucloud/totp_verify.rs` | V2 | Lise | ~80 |
| `apps/central/.../miyucloud/session_list.rs` | V2 | Lise | ~120 |
| `apps/central/.../miyucloud/onboarding.rs` | V3 | Lise | ~200 |
| `apps/central/.../miyucloud/health_dashboard.rs` | V3 | Lise | ~100 |
| `apps/central/.../miyucloud/recovery_codes.rs` | V6 | Lise | ~100 |
| **Total** | | | **~2 300** |

### A modifier (13 fichiers)

| Fichier | Vague | Agent | Impact |
|---------|-------|-------|--------|
| `crates/miyucloud/Cargo.toml` | V0 | Denis | +4 deps |
| `crates/miyucloud/src/lib.rs` | V0 | Denis | +2 lignes mod |
| `crates/miyucloud/src/auth/mod.rs` | V0 | Denis | +2 lignes mod |
| `crates/miyucloud/src/domain/mod.rs` | V0 | Denis | +1 ligne mod |
| `crates/miyucloud/src/data/kindmother_db.rs` | V0,V2,V3 | Francois | +~300 lignes CRUD |
| `crates/miyucloud/src/data/types.rs` | V2,V3 | Francois | +~10 lignes re-export |
| `crates/miyucloud/src/auth/web_tokens.rs` | V1 | Francois | ~5 lignes remplacees |
| `crates/miyucloud/src/storage/local_fs.rs` | V1 | Francois | +~5 lignes validation |
| `apps/miyucloud/src/api/mod.rs` | V4 | Francois | +~30 lignes routes |
| `apps/miyucloud/src/main.rs` | V4,V5 | Francois | -70+20 lignes |
| `apps/miyucloud/src/web_surface/share_page.rs` | V1,V5 | Francois | +~15 lignes |
| `apps/miyucloud/src/web_surface/access_log.rs` | V1 | Francois | ~10 lignes modifiees |
| `apps/miyucloud/src/web_surface/rate_limiter.rs` | V5 | Francois | +~45 lignes |
| `apps/miyucloud/src/config.rs` | V5 | Francois | +3 lignes |
| `apps/central/.../miyucloud/settings.rs` | V2 | Lise | +~30 lignes |
| `apps/central/.../miyucloud/mod.rs` | V3 | Lise | +~10 lignes |
| `apps/central/.../miyucloud/sidebar.rs` | V3 | Lise | +~10 lignes |
| `apps/central/.../miyucloud/upload.rs` | V6 | Lise | +~30 lignes |
| `apps/central/.../miyucloud/file_detail.rs` | V6 | Lise | +~40 lignes |
| `apps/central/.../miyucloud/explorer.rs` | V6 | Lise | +~20 lignes |
| `apps/central/.../miyucloud/components.rs` | V6 | Lise | +~60 lignes |
| `apps/central/src/theme.rs` | V6 | Lise | +~10 lignes |

---

## Checkpoints Denis (P3)

| Apres | Taches completees | Actions |
|-------|-------------------|---------|
| V1-T08 | 13 taches | cargo test + clippy -p miyucloud, push, maj metriques |
| V2-T10 | 23 taches | cargo test + clippy -p miyucloud, push, maj metriques |
| V3-T08 | 31 taches | cargo test + clippy -p miyucloud, push, maj metriques |
| V4-T08 | 39 taches | cargo build + test --workspace, push, maj metriques |
| V5-T07 | 46 taches | cargo test + Victor spot-check, push, maj metriques |
| V6-T08 | 54 taches | cargo build -p central, push, maj metriques |
| V9-T04 | 67 taches | Integration finale, audit, push tag |

---

## Metriques cibles

| Metrique | Valeur cible |
|----------|-------------|
| Lignes nouvelles | ~2 300 |
| Fichiers crees | ~19 |
| Fichiers modifies | ~22 |
| Tests nouveaux | ~75 |
| Endpoints API nouveaux | 15 (total 42) |
| Tables DB nouvelles | 4 |
| Score securite Victor | >95/100 |
| Score audit George | >90/100 |
| Vagues | 10 (V0-V9) |
| Taches totales | 67 |
| Buffer corrections (20%) | ~13 taches reservees |

---

*Plan redige par Denis -- Chef Dev Senior, Miyukini AI Studio*
*2026-03-03 -- P0 Temps 7*
