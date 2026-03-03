# Plan MiyuCloud v2 -- Detail Vagues 0 a 3

**Index** : `2026-03-03-miyucloud-v2-plan.md`
**Auteur** : Denis (Chef Dev Senior)

---

## Vague 0 : Setup (Denis)

### V0-T01 : Creer feature branch

**Agent** : Denis
**Commandes** :
```bash
git checkout -b feat/miyucloud-v2
git push -u origin feat/miyucloud-v2
```
**Critere** : Branch visible sur remote.

### V0-T02 : Ajouter dependencies Cargo.toml

**Agent** : Denis
**Fichier** : `crates/miyucloud/Cargo.toml`
**Action** : Ajouter apres la ligne `rand = "0.8"` :
```toml
totp-rs = { version = "5", features = ["otpauth", "qr"] }
subtle = "2.6"
zeroize = { version = "1.8", features = ["zeroize_derive"] }
base64 = "0.22"
```
**Critere** : `cargo build -p miyucloud` compile.
**Commit** : `feat(miyucloud): add totp-rs, subtle, zeroize, base64 deps`

### V0-T03 : Creer modules stubs

**Agent** : Denis
**Fichiers a creer** :
1. `crates/miyucloud/src/utils/mod.rs` -- `pub mod sanitize; pub mod constant_time; pub mod base64;`
2. `crates/miyucloud/src/utils/sanitize.rs` -- stubs `pub fn html_escape`, `sanitize_filename`, `validate_uuid` avec `todo!()`
3. `crates/miyucloud/src/utils/constant_time.rs` -- stub `pub fn constant_time_eq` avec `todo!()`
4. `crates/miyucloud/src/utils/base64.rs` -- stubs `pub fn encode`, `decode` avec `todo!()`
5. `crates/miyucloud/src/auth/totp.rs` -- stubs des types + fonctions publiques avec `todo!()`
6. `crates/miyucloud/src/auth/sessions.rs` -- stubs des types + fonctions publiques avec `todo!()`
7. `crates/miyucloud/src/domain/onboarding.rs` -- stubs des types + fonctions publiques avec `todo!()`
8. `crates/miyucloud/src/monitoring/mod.rs` -- stubs des types + fonctions publiques avec `todo!()`

**Fichiers a modifier** :
- `crates/miyucloud/src/lib.rs` : ajouter `pub mod utils; pub mod monitoring;`
- `crates/miyucloud/src/auth/mod.rs` : ajouter `pub mod totp; pub mod sessions;`
- `crates/miyucloud/src/domain/mod.rs` : ajouter `pub mod onboarding;`

**Critere** : `cargo check -p miyucloud` passe (stubs compilent).
**Commit** : `feat(miyucloud): scaffold v2 module stubs (totp, sessions, onboarding, monitoring, utils)`

### V0-T04 : Ajouter tables DB dans init_schema()

**Agent** : Denis
**Fichier** : `crates/miyucloud/src/data/kindmother_db.rs`
**Action** : Ajouter dans `init_schema()` apres les tables existantes :
```sql
CREATE TABLE IF NOT EXISTS cloud_sessions ( ... );  -- voir spec T6 section 8.1
CREATE TABLE IF NOT EXISTS cloud_totp_secrets ( ... );  -- section 8.2
CREATE TABLE IF NOT EXISTS cloud_recovery_codes ( ... );  -- section 8.3
CREATE TABLE IF NOT EXISTS cloud_onboarding ( ... );  -- section 8.4
```
Plus les index associes (cf. spec T6).
**Critere** : `MiyucloudDb::open(tempdir)` cree les 4 tables sans erreur.
**Commit** : `feat(miyucloud): add sessions, totp, recovery, onboarding tables`

### V0-T05 : Smoke test e2e

**Agent** : Denis
**Fichier** : `crates/miyucloud/tests/v2_smoke_test.rs`
**Contenu** : Test qui reference les fonctions publiques des nouveaux modules.
**Critere** : Compile. Le test echoue car les stubs font `todo!()`.
**Commit** : `test(miyucloud): add v2 smoke test (expected failure)`

---

## Vague 1 : Securite critique (Francois)

### V1-T01 : utils/constant_time.rs

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/utils/constant_time.rs`
**MSCM** : `@id: miyucloud_utils_constant_time`, `@do: provide_constant_time_comparison_via_subtle`, `@role: security`
**Implementation** :
- `pub fn constant_time_eq(a: &[u8], b: &[u8]) -> bool` utilisant `subtle::ConstantTimeEq`
- Gestion longueurs differentes (retourne false directement)
**Tests** : `test_constant_time_eq_equal`, `test_constant_time_eq_different`, `test_constant_time_eq_different_length`
**Critere** : 3 tests passent.
**Commit** : `feat(miyucloud): implement constant_time_eq via subtle`

### V1-T02 : utils/sanitize.rs

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/utils/sanitize.rs`
**MSCM** : `@id: miyucloud_utils_sanitize`, `@do: provide_html_escape_filename_sanitize_functions`, `@role: security`
**Implementation** (cf. spec T6 section 7.1) :
- `pub fn html_escape(input: &str) -> String` -- 5 remplacements (`<>&"'`)
- `pub fn sanitize_filename(name: &str) -> String` -- ctrl chars, `..`, `/`, `\`, tronque 255, fallback "unnamed"
- `pub fn validate_uuid(id: &str) -> bool` -- regex pattern UUID v4
**Tests** : 10 tests (cf. spec T6 section 7.5)
**Critere** : 10 tests passent.
**Commit** : `feat(miyucloud): implement html_escape, sanitize_filename, validate_uuid`

### V1-T03 : utils/base64.rs

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/utils/base64.rs`
**MSCM** : `@id: miyucloud_utils_base64`, `@do: provide_base64_encode_decode_via_standard_crate`, `@role: util`
**Implementation** (cf. spec T6 section 7.3) :
- `pub fn encode(data: &[u8]) -> String` via `base64::engine::general_purpose::STANDARD`
- `pub fn decode(input: &str) -> Result<Vec<u8>, MiyucloudError>` avec map_err
**Tests** : `test_base64_roundtrip`, `test_base64_invalid_input`
**Critere** : 2 tests passent.
**Commit** : `feat(miyucloud): implement base64 encode/decode wrapper`

### V1-T04 : F-02 -- Remplacer XOR par subtle dans web_tokens.rs

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/auth/web_tokens.rs` (lignes 103-111)
**Action** : Remplacer le bloc XOR accumulator par `utils::constant_time::constant_time_eq(computed, expected_hash)`
**Critere** : Tests existants passent toujours. Victor valide.
**Commit** : `fix(miyucloud): replace XOR hash comparison with subtle constant-time (F-02)`

### V1-T05 : F-04 -- html_escape dans share_page.rs

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs` (ligne 318)
**Action** : Importer `miyucloud::utils::sanitize::html_escape`, wrapper `file_name`, `file_size`, `expires_at` dans `render_share_page()`
**Test** : Nouveau test `test_share_page_escapes_xss` -- creer un fichier nomme `<script>alert(1)</script>`, verifier que le HTML rendu contient `&lt;script&gt;`
**Critere** : Test XSS passe.
**Commit** : `fix(miyucloud): escape HTML in share page to prevent XSS (F-04)`

### V1-T06 : F-05 -- validate_uuid dans local_fs.rs

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/storage/local_fs.rs` (lignes 32-38)
**Action** : Appeler `utils::sanitize::validate_uuid(file_id)` dans `file_dir()`. Si invalide, retourner `MiyucloudError::InvalidInput`.
**Test** : `test_file_dir_rejects_path_traversal` -- `file_dir("../../../etc/passwd")` retourne Err
**Critere** : Test passe.
**Commit** : `fix(miyucloud): validate file_id as UUID to prevent path traversal (F-05)`

### V1-T07 : F-06 -- Sel derive HKDF dans access_log.rs

**Agent** : Francois
**Fichier** : `apps/miyucloud/src/web_surface/access_log.rs` (ligne 24)
**Action** : Modifier `hash_ip(ip: &str)` en `hash_ip(ip: &str, salt: &[u8])`. Deriver le salt en amont via HKDF-SHA256 depuis le COG token avec context `"miyucloud-ip-salt"`.
**Test** : `test_hash_ip_with_salt_stable` -- meme IP + meme salt = meme hash
**Critere** : Test passe. Appels mis a jour dans les appelants.
**Commit** : `fix(miyucloud): derive IP hashing salt from COG token via HKDF (F-06)`

### V1-T08 : Tests unitaires V1 complets

**Agent** : Francois
**Commande** : `cargo test -p miyucloud -- utils`
**Critere** : Tous les tests utils passent. `cargo clippy -p miyucloud -- -D warnings` clean.
**Pas de commit** (verification seulement).

---

## Vague 2 : Auth TOTP + Sessions

### V2-T01 : auth/totp.rs -- Setup + Encrypt/Decrypt

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/auth/totp.rs`
**Implementation** (cf. spec T6 section 3) :
- Types : `TotpSecret`, `RecoveryCode`, `TotpSetupResult`
- Fonctions internes : `generate_totp_secret()`, `encrypt_totp_secret()`, `decrypt_totp_secret()`, `generate_recovery_code()`, `hash_recovery_code()`, `verify_recovery_code()`
- Fonction publique : `setup_totp()` -- genere secret, chiffre, stocke, genere 8 recovery codes, retourne `TotpSetupResult`
- `is_totp_enabled()`
**Tests** : `test_setup_totp_returns_valid_secret`, `test_secret_encrypted_in_db`, `test_totp_uri_format`, `test_recovery_code_format`
**Critere** : 4 tests passent.
**Commit** : `feat(miyucloud): implement TOTP setup with encrypted secret storage`

### V2-T02 : auth/totp.rs -- Validate + Recovery + Disable

**Agent** : Francois
**Implementation** (cf. spec T6 section 3.2-3.3) :
- `validate_totp()` -- dechiffre secret, genere code, compare en temps constant, skew=1
- `validate_recovery_code()` -- verifie hash Argon2, marque used
- `disable_totp()` -- supprime secret + tous codes
- `regenerate_recovery_codes()` -- supprime anciens, genere 8 nouveaux
**Tests** : `test_validate_totp_correct_code`, `test_validate_totp_wrong_code`, `test_validate_totp_skew`, `test_recovery_code_single_use`, `test_recovery_code_all_used_fails`, `test_disable_totp_cleans_all`
**Critere** : 6 tests supplementaires passent (total 10 pour totp).
**Commit** : `feat(miyucloud): implement TOTP validation, recovery codes, disable`

### V2-T03 : auth/sessions.rs -- Create + Validate + Revoke

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/auth/sessions.rs`
**Implementation** (cf. spec T6 section 4) :
- Types : `Session`, `SessionConfig`
- `create_session()` -- 256 bits token (OsRng), hex, expiration, FIFO eviction
- `validate_session()` -- check token (constant-time), revoked, expired, inactivity, update last_activity
- `revoke_session()`, `revoke_all_sessions()`
**Tests** : `test_create_session_returns_valid_token`, `test_validate_session_valid`, `test_validate_session_expired`, `test_validate_session_revoked`, `test_validate_session_inactive`, `test_max_sessions_evicts_oldest`
**Critere** : 6 tests passent.
**Commit** : `feat(miyucloud): implement server-side sessions with expiration and eviction`

### V2-T04 : auth/sessions.rs -- Purge + TOTP flag + List

**Agent** : Francois
**Implementation** :
- `purge_expired_sessions()` -- DELETE WHERE expires_at < now
- `mark_totp_verified()` -- UPDATE totp_verified = 1
- `list_active_sessions()` -- SELECT WHERE NOT revoked AND NOT expired
**Tests** : `test_purge_expired`, `test_totp_verified_flag`, `test_revoke_all_sessions`, `test_token_constant_time_comparison`
**Critere** : 4 tests supplementaires passent (total 10 pour sessions).
**Commit** : `feat(miyucloud): add session purge, TOTP verification flag, session listing`

### V2-T05 : CRUD DB totp + recovery + sessions

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/data/kindmother_db.rs`
**Action** : Ajouter les methodes CRUD pour les 3 nouvelles tables liees a l'auth :
- `insert_totp_secret()`, `get_totp_secret()`, `delete_totp_secret()`
- `insert_recovery_code()`, `get_recovery_codes()`, `mark_recovery_code_used()`, `delete_recovery_codes()`
- `insert_session()`, `get_session_by_token()`, `get_sessions_by_owner()`, `update_session_activity()`, `revoke_session()`, `purge_expired_sessions()`
**Critere** : Tests CRUD passent.
**Commit** : `feat(miyucloud): add CRUD operations for sessions, TOTP secrets, recovery codes`

### V2-T06 : Composant TotpSetupWizard (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/totp_setup.rs`
**Composant** : Wizard 3 etapes (1. Affiche QR + secret base32, 2. Verification code, 3. Affiche recovery codes)
**API** : Appelle `POST /api/2fa/setup` puis `POST /api/2fa/verify`
**Critere** : Compile, affiche QR mock en developpement.

### V2-T07 : Composant TotpVerifyForm (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/totp_verify.rs`
**Composant** : Input 6 chiffres auto-focus, submit, feedback valid/invalid
**API** : Appelle `POST /api/2fa/verify`
**Critere** : Compile, layout correct.

### V2-T08 : Composant SessionList (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/session_list.rs`
**Composant** : Table sessions actives (IP hashee, UA, date, status TOTP), bouton "Revoquer"
**API** : Appelle `GET /api/sessions`, `DELETE /api/sessions/{id}`
**Critere** : Compile, affiche liste mock.

### V2-T09 : Onglet Securite dans settings (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/settings.rs`
**Action** : Ajouter un onglet "Securite" avec sous-sections 2FA et Sessions.
**Critere** : Compile, onglet visible.
**Commit grouper** : `feat(miyucloud-ui): add 2FA setup wizard, verify form, session list, security tab`

### V2-T10 : Tests V2 complets

**Agent** : Francois
**Commande** : `cargo test -p miyucloud -- auth`
**Critere** : 20+ tests auth passent. Clippy clean. **Denis checkpoint + push**.

---

## Vague 3 : Onboarding + Monitoring

### V3-T01 : domain/onboarding.rs

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/domain/onboarding.rs`
**Implementation** (cf. spec T6 section 5) :
- Types : `OnboardingStatus`, `OnboardingStep`
- `get_status()`, `check_passphrase()`, `check_2fa()`, `verify_storage()`, `complete_onboarding()`, `reset_onboarding()`
- Invariant : completion necessite `passphrase_set && storage_verified`
**Tests** : 8 tests (cf. spec T6 section 5.4)
**Critere** : 8 tests passent.
**Commit** : `feat(miyucloud): implement onboarding wizard logic`

### V3-T02 : monitoring/mod.rs

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/monitoring/mod.rs`
**Implementation** (cf. spec T6 section 6) :
- Types : `HealthReport`, `HealthStatus`, `HealthCheck`, `ServiceMetrics`
- `health_check()` -- 4 checks (DB, storage, crypto, disk_space)
- `collect_metrics()` -- compteurs depuis DB
- `check_disk_space()` -- verifie espace libre
**Tests** : 4 tests (cf. spec T6 section 6.3)
**Critere** : 4 tests passent.
**Commit** : `feat(miyucloud): implement health check and service metrics`

### V3-T03 : CRUD DB onboarding

**Agent** : Francois
**Fichier** : `crates/miyucloud/src/data/kindmother_db.rs`
**Action** : `get_onboarding()`, `upsert_onboarding()`, `delete_onboarding()`
**Critere** : Tests CRUD passent.
**Commit** : `feat(miyucloud): add CRUD operations for onboarding table`

### V3-T04 : Composant OnboardingWizard (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/onboarding.rs`
**Composant** : Stepper 4 etapes (Passphrase, 2FA, Stockage, Confirmation)
**API** : Appelle les 4 endpoints `/api/onboarding/*`
**Critere** : Compile, 4 etapes navigables.

### V3-T05 : Composant HealthDashboard (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/health_dashboard.rs`
**Composant** : Carte sante avec 4 checks (pastilles vert/jaune/rouge) + metriques
**API** : Appelle `GET /api/health`, `GET /api/metrics`
**Critere** : Compile, layout correct.

### V3-T06 : Route onboarding dans mod.rs (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/mod.rs`
**Action** : Ajouter `pub mod onboarding; pub mod health_dashboard;` + logique de redirection si `!completed`
**Critere** : Compile, redirection active.

### V3-T07 : Badge sante sidebar (Lise)

**Agent** : Lise
**Fichier** : `apps/central/src/services/miyucloud/sidebar.rs`
**Action** : Ajouter un badge colore (dot SVG) a cote du nom "MiyuCloud" selon le health status.
**Critere** : Compile, badge visible.
**Commit grouper** : `feat(miyucloud-ui): add onboarding wizard, health dashboard, sidebar badge`

### V3-T08 : Tests V3 complets

**Agent** : Francois
**Commande** : `cargo test -p miyucloud -- domain::onboarding` et `cargo test -p miyucloud -- monitoring`
**Critere** : 12+ tests passent. Clippy clean. **Denis checkpoint + push**.

---

*Detail des vagues 0 a 3 -- Denis, 2026-03-03*
