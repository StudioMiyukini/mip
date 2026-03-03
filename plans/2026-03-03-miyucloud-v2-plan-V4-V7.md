# Plan MiyuCloud v2 -- Detail Vagues 4 a 7

**Index** : `2026-03-03-miyucloud-v2-plan.md`
**Auteur** : Denis (Chef Dev Senior)

---

## Vague 4 : API Handlers + Routes (Francois)

### V4-T01 : api/onboarding.rs (4 handlers)

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/api/onboarding.rs`
**MSCM** : `@id: miyucloud_api_onboarding`, `@do: handle_onboarding_endpoints`, `@role: api`
**Handlers** :
1. `async fn get_onboarding_status(State(state))` -- GET `/api/onboarding/status`
2. `async fn check_passphrase(State(state))` -- POST `/api/onboarding/check-passphrase`
3. `async fn verify_storage(State(state))` -- POST `/api/onboarding/verify-storage`
4. `async fn complete_onboarding(State(state))` -- POST `/api/onboarding/complete`

Chaque handler : extraire owner_id du token, appeler le domaine, retourner JSON.
**Critere** : Compile. Reponses JSON conformes a la spec T6 section 9.1.
**Commit** : `feat(miyucloud): add onboarding API handlers`

### V4-T02 : api/totp.rs (6 handlers)

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/api/totp.rs`
**MSCM** : `@id: miyucloud_api_totp`, `@do: handle_2fa_endpoints`, `@role: api`
**Handlers** :
1. `async fn setup_2fa(State(state), Json(body))` -- POST `/api/2fa/setup`
2. `async fn verify_2fa(State(state), Json(body))` -- POST `/api/2fa/verify`
3. `async fn disable_2fa(State(state), Json(body))` -- DELETE `/api/2fa`
4. `async fn verify_recovery(State(state), Json(body))` -- POST `/api/2fa/recovery/verify`
5. `async fn regenerate_recovery(State(state), Json(body))` -- POST `/api/2fa/recovery/regenerate`
6. `async fn get_2fa_status(State(state))` -- GET `/api/2fa/status`

Erreurs : 409 si deja configure, 401 si code invalide (cf. spec T6 section 9.2).
**Critere** : Compile. Codes HTTP conformes.
**Commit** : `feat(miyucloud): add 2FA API handlers (setup, verify, disable, recovery)`

### V4-T03 : api/sessions.rs (3 handlers)

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/api/sessions.rs`
**MSCM** : `@id: miyucloud_api_sessions`, `@do: handle_session_management_endpoints`, `@role: api`
**Handlers** :
1. `async fn list_sessions(State(state))` -- GET `/api/sessions`
2. `async fn revoke_session(State(state), Path(id))` -- DELETE `/api/sessions/{id}`
3. `async fn revoke_all_sessions(State(state))` -- DELETE `/api/sessions`
**Critere** : Compile. JSON conforme spec T6 section 9.3.
**Commit** : `feat(miyucloud): add session management API handlers`

### V4-T04 : api/monitoring.rs (2 handlers)

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/api/monitoring.rs`
**MSCM** : `@id: miyucloud_api_monitoring`, `@do: handle_health_and_metrics_endpoints`, `@role: api`
**Handlers** :
1. `async fn health_check(State(state))` -- GET `/api/health`
2. `async fn metrics(State(state))` -- GET `/api/metrics`

Note : Le `/health` non-authentifie existant reste inchange.
**Critere** : Compile. JSON conforme spec T6 section 9.4.
**Commit** : `feat(miyucloud): add monitoring API handlers (health, metrics)`

### V4-T05 : Modifier api/mod.rs -- 15 nouvelles routes

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/api/mod.rs`
**Action** : Ajouter `pub mod onboarding; pub mod totp; pub mod sessions; pub mod monitoring;` et les 15 routes dans `api_router()` :
```rust
// Onboarding
.route("/onboarding/status", get(onboarding::get_onboarding_status))
.route("/onboarding/check-passphrase", post(onboarding::check_passphrase))
.route("/onboarding/verify-storage", post(onboarding::verify_storage))
.route("/onboarding/complete", post(onboarding::complete_onboarding))
// 2FA
.route("/2fa/setup", post(totp::setup_2fa))
.route("/2fa/verify", post(totp::verify_2fa))
.route("/2fa", delete(totp::disable_2fa))
.route("/2fa/recovery/verify", post(totp::verify_recovery))
.route("/2fa/recovery/regenerate", post(totp::regenerate_recovery))
.route("/2fa/status", get(totp::get_2fa_status))
// Sessions
.route("/sessions", get(sessions::list_sessions))
.route("/sessions/{id}", delete(sessions::revoke_session))
.route("/sessions", delete(sessions::revoke_all_sessions))
// Monitoring
.route("/health", get(monitoring::health_check))
.route("/metrics", get(monitoring::metrics))
```
**Critere** : `cargo build` OK. Total 42 routes.
**Commit** : `feat(miyucloud): register 15 new API routes (total 42)`

### V4-T06 : Remplacer base64 manuelle dans main.rs

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/main.rs` (lignes 308-377)
**Action** : Supprimer les fonctions `encode_base64()` et `decode_base64()` manuelles. Remplacer par `miyucloud::utils::base64::{encode, decode}`.
**Critere** : Tests existants passent. Pas de regression.
**Commit** : `refactor(miyucloud): replace manual base64 with standard crate wrapper`

### V4-T07 : Tests integration API

**Agent** : Francois
**Fichier** : `apps/miyucloud/tests/api_v2_integration.rs`
**Tests** :
- Test chaque endpoint retourne le code HTTP attendu (200/201/400/401/409)
- Test onboarding flow complet (status -> check-passphrase -> verify-storage -> complete)
- Test 2FA flow complet (setup -> verify -> status -> disable)
- Test sessions flow (create -> list -> revoke)
- Test monitoring (health -> metrics)
**Critere** : Tous les tests d'integration passent.
**Commit** : `test(miyucloud): add API v2 integration tests`

### V4-T08 : Tests V4 complets

**Agent** : Francois
**Commande** : `cargo test --workspace` (premier test workspace complet)
**Critere** : 0 echec. **Denis checkpoint + push**.

---

## Vague 5 : Securite hardening (Francois + Victor)

### V5-T01 : F-07 -- Logger Preview dans share_page.rs

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs` (ligne ~100)
**Action** : Apres verification reussie du token dans `share_page()`, appeler :
```rust
access_log::log_access(&state.db, &access_log::AccessLogEntry {
    action: AccessAction::Preview,
    file_id: Some(link.file_id.clone()),
    ip_hash: access_log::hash_ip(&ip, &ip_salt),
    user_agent: ua.clone(),
    ...
});
```
**Test** : `test_share_page_logs_preview` -- verifier qu'un entry Preview est insere en DB.
**Critere** : Test passe.
**Commit** : `fix(miyucloud): log share page preview access (F-07)`

### V5-T02 : F-08 -- Purge HashMap rate_limiter

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/web_surface/rate_limiter.rs` (lignes 46-51)
**Action** :
1. Ajouter `total_requests: u64` dans `RateLimiterState`
2. Incrementer a chaque `check_rate()`
3. Si `total_requests % 100 == 0`, purger les entrees dont le dernier acces > window
4. Si `map.len() > 10_000`, eviction de l'entree la plus ancienne
**Test** : `test_rate_limiter_purge` -- simuler 101 requetes, verifier taille map reduite.
**Critere** : Test passe.
**Commit** : `fix(miyucloud): add periodic purge to rate limiter HashMap (F-08)`

### V5-T03 : F-10 -- trust_proxy config

**Agent** : Francois
**Fichiers** : `apps/miyucloud/src/config.rs`, `apps/miyucloud/src/web_surface/rate_limiter.rs`
**Action** :
1. Ajouter `pub trust_proxy: bool` (default false) dans `MiyucloudConfig`
2. Dans `extract_client_ip()`, si `!trust_proxy`, ignorer `X-Forwarded-For` et `X-Real-IP`
3. Documenter dans la config
**Test** : `test_trust_proxy_false_ignores_xff` -- avec header XFF mais trust_proxy=false, IP = socket addr
**Critere** : Test passe.
**Commit** : `fix(miyucloud): add trust_proxy config to control X-Forwarded-For handling (F-10)`

### V5-T04 : Headers HTTP securite

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/main.rs`
**Action** : Ajouter un middleware (tower layer) qui injecte les headers :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (desactive, car CSP est prefere)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (si TLS actif)
**Test** : `test_security_headers_present` -- verifier la presence des headers dans une reponse.
**Critere** : Test passe.
**Commit** : `feat(miyucloud): add security response headers middleware`

### V5-T05 : Zeroize secrets TOTP en memoire

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/auth/totp.rs`
**Action** : Wrapper le secret dechiffre dans `zeroize::Zeroizing<Vec<u8>>` dans `validate_totp()` et `setup_totp()`. Ajouter `#[derive(Zeroize, ZeroizeOnDrop)]` sur les structs internes contenant des secrets.
**Critere** : Compile. Pattern `Zeroizing<>` visible dans le code. Victor valide.
**Commit** : `fix(miyucloud): wrap TOTP secrets in Zeroizing<> for memory cleanup`

### V5-T06 : Test integration F-01 (download bypass)

**Agent** : Francois
**Fichier** : `apps/miyucloud/tests/security_integration.rs`
**Test** : Creer un share link avec password, tenter un download SANS cookie de session, verifier 401 Unauthorized.
**Critere** : Test passe (confirme que F-01 est deja corrige).
**Commit** : `test(miyucloud): add integration test confirming download auth protection (F-01)`

### V5-T07 : Victor audit spot-check complet

**Agent** : Victor
**Action** : Revue des corrections F-02, F-04, F-05, F-06, F-07, F-08, F-10. Verification subtle/zeroize/html_escape. Score securite >90/100.
**Critere** : Victor valide. Score documente dans les metriques.

---

## Vague 6 : UX Polish front-end (Lise)

### V6-T01 : RecoveryCodesModal

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/recovery_codes.rs`
**Composant** : Modal affichant les 8 codes recovery en grille 2x4. Bouton "Copier tout". Option "Generer PDF". Warning "Ces codes ne seront plus affiches".
**Critere** : Compile, modal ouvre/ferme, copie fonctionne.

### V6-T02 : Toast notifications

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/components.rs`
**Composant** : `Toast { message, level, duration }` -- affiche en haut a droite pendant 3s puis fade out. Niveaux : success (vert), error (rouge), warning (orange), info (bleu).
**Critere** : Toast visible 3s.

### V6-T03 : Icones SVG securite

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/components.rs`
**Action** : Ajouter fonctions SVG inline : `icon_lock()`, `icon_shield()`, `icon_key()`, `icon_check_circle()`, `icon_warning()`.
**Critere** : Icones rendues correctement.

### V6-T04 : Drag & drop upload avec progress bar

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/upload.rs`
**Action** : Ajouter un signal `upload_progress: Signal<Option<f32>>` (0.0 a 1.0). Afficher une barre de progression animee pendant l'upload. Zone de drop avec highlight on dragover.
**Critere** : Progress bar visible pendant upload mock.

### V6-T05 : File preview inline

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/file_detail.rs`
**Action** : Ajouter un panel preview selon le mime_type :
- `image/*` : affiche l'image (base64 data URI)
- `text/*` : affiche le contenu dans un `<pre>`
- Autres : affiche icone + "Apercu non disponible"
**Critere** : Image preview fonctionne.

### V6-T06 : Palette couleurs MiyuCloud dans theme

**Agent** : Lise
**Fichier** : `apps/central/src/theme.rs`
**Action** : Ajouter les constantes couleur MiyuCloud (cf. Ideation Lise T2) :
- `MIYUCLOUD_PRIMARY`, `MIYUCLOUD_SECONDARY`, `MIYUCLOUD_ACCENT`
- `MIYUCLOUD_BG_CARD`, `MIYUCLOUD_TEXT`
**Critere** : Constantes compilent et sont utilisables.

### V6-T07 : Toggle grille/liste dans explorer

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/explorer.rs`
**Action** : Ajouter un signal `view_mode: Signal<ViewMode>` (Grid/List). Bouton toggle. Grid = cartes 3 colonnes. List = lignes avec colonnes (nom, taille, date, actions).
**Critere** : Toggle fonctionne, deux modes rendus.

### V6-T08 : Tests front compilation

**Agent** : Lise
**Commande** : `cargo build -p central`
**Critere** : 0 erreur. **Denis checkpoint + push**.
**Commit grouper** : `feat(miyucloud-ui): add recovery modal, toasts, icons, upload progress, preview, theme, grid/list toggle`

---

## Vague 7 : Infrastructure (Hugo)

### V7-T01 : GitHub Actions workflow

**Agent** : Hugo
**Fichier** : `.github/workflows/miyucloud.yml`
**Contenu** :
```yaml
name: MiyuCloud CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo clippy -p miyucloud -- -D warnings
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test -p miyucloud
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo build -p miyucloud-server --release
```
**Critere** : YAML valide.
**Commit** : `ci(miyucloud): add GitHub Actions workflow (lint, test, build)`

### V7-T02 : systemd service

**Agent** : Hugo
**Fichier** : `deploy/miyucloud.service`
**Contenu** : Unit sandboxe (ProtectSystem, PrivateTmp, NoNewPrivileges, etc.). Cf. spec T9.
**Critere** : Syntax valide (`systemd-analyze verify`).

### V7-T03 : Caddyfile

**Agent** : Hugo
**Fichier** : `deploy/Caddyfile`
**Contenu** : Reverse proxy vers `localhost:3456` avec TLS auto (Let's Encrypt). Headers securite supplementaires.
**Critere** : Syntax valide.

### V7-T04 : deploy.sh

**Agent** : Hugo
**Fichier** : `deploy/deploy.sh`
**Contenu** : Script bash (build release, copy binaire, restart systemd, verify health).
**Critere** : Script executable, commentaires clairs.

### V7-T05 : backup.sh

**Agent** : Hugo
**Fichier** : `deploy/backup.sh`
**Contenu** : Sauvegarde DB SQLite (`.backup`) + rsync storage. Rotation 7 jours.
**Critere** : Script executable.

### V7-T06 : healthcheck.sh

**Agent** : Hugo
**Fichier** : `deploy/healthcheck.sh`
**Contenu** : `curl -sf http://localhost:3456/health` -> exit code 0 si OK.
**Critere** : Script executable.
**Commit grouper** : `infra(miyucloud): add deploy scripts, systemd service, Caddyfile, CI workflow`

---

*Detail des vagues 4 a 7 -- Denis, 2026-03-03*
