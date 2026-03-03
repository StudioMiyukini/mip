# Specification Technique P0-T6 -- MiyuCloud v2 (Securite + Onboarding)

**Auteur** : Francois (Dev Back-End)
**Date** : 2026-03-03
**Classification MIP** : T4 (Feature majeure)
**Phase** : P0 -- Temps 6 (Specification technique + Verification Context7)
**Statut** : REDACTION COMPLETE -- EN ATTENTE VALIDATION DENIS

**Documents de reference** :
- Brainstorming Maria (T1) : Architecture service separe, 2FA TOTP, RGPD, onboarding
- Inventaire Denis (T4) : 18 510 lignes, 226 tests, 27 routes API + 4 web
- Audit Victor (T5) : Score 72/100, 23 defauts, 22 corrections en 5 vagues
- Audit George (P4 v1) : Score 87/100, F-01 a F-10 identifies
- Ideation Lise (T2) : 19 composants nouveaux, 10 a modifier

**TL;DR** : Spec technique des 5 modules back-end a creer (auth/totp, auth/sessions, domain/onboarding, monitoring, utils/securite) + 14 nouveaux endpoints API + 4 tables SQLite + corrections des 10 findings de securite. Score cible : >95/100.

---

## Table des matieres

1. [Verification Context7](#1-verification-context7)
2. [Anti-patterns verifies](#2-anti-patterns-verifies)
3. [Module auth/totp.rs](#3-module-authtotprs)
4. [Module auth/sessions.rs](#4-module-authsessionsrs)
5. [Module domain/onboarding.rs](#5-module-domainonboardingrs)
6. [Module monitoring/mod.rs](#6-module-monitoringmodrs)
7. [Fonctions utilitaires securite](#7-fonctions-utilitaires-securite)
8. [Schema DB nouvelles tables](#8-schema-db-nouvelles-tables)
9. [Schema API nouveaux endpoints](#9-schema-api-nouveaux-endpoints)
10. [Corrections securite (F-01 a F-10)](#10-corrections-securite-f-01-a-f-10)
11. [Conformite architecturale](#11-conformite-architecturale)
12. [Risques techniques](#12-risques-techniques)

---

## 1. Verification Context7

### 1.1 Dependances nouvelles -- Documentation verifiee

| Crate | Version cible | Statut | Notes |
|-------|---------------|--------|-------|
| `totp-rs` | 5.x | VERIFIE | API stable. `TOTP::new()` + `generate_current()` + `check_current()`. Feature `otpauth` pour URI, feature `qr` pour QR base64 PNG. Algorithme SHA1 (standard RFC 6238). |
| `subtle` | 2.6 | VERIFIE | `ConstantTimeEq::ct_eq()` retourne `Choice`. Impl sur `[u8]`. Remplace la comparaison XOR manuelle existante dans `web_tokens.rs:103-111`. |
| `zeroize` | 1.8 | VERIFIE | Trait `Zeroize` + derive macro. `Zeroizing<T>` wrapper pour auto-zeroize au drop. Feature `zeroize_derive` pour `#[derive(Zeroize, ZeroizeOnDrop)]`. |
| `base64` | 0.22 | VERIFIE | `engine::general_purpose::STANDARD.encode/decode`. Remplace les impls manuelles dans `main.rs:308-377`. |

### 1.2 Dependances existantes -- Patterns confirmes

| Crate | Version actuelle | Breaking changes | Notes |
|-------|-----------------|------------------|-------|
| `axum` | 0.8 | Aucun | Route patterns `{param}` confirmes (pas `:param`). `CookieJar` disponible dans `axum-extra`. Mais on ne l'utilise pas -- le cookie de session est deja implemente manuellement via `Set-Cookie` header (share_page.rs:153-155), ce qui evite une dep supplementaire. |
| `argon2` | 0.5 | Aucun | API `hash_password_into()` stable. Parametres `Params::new()` inchanges. |
| `serde` | 1.x | Aucun | `#[serde(default)]` sur tous les nouveaux champs (retrocompatibilite). |
| `chacha20poly1305` | 0.10 | Aucun | API `encrypt_in_place_detached` / `decrypt_in_place_detached` stable. |
| `rand` | 0.8 | Aucun | `OsRng.fill_bytes()` stable. |
| `chrono` | 0.4 | Aucun | `Utc::now().to_rfc3339()` stable. |

### 1.3 Dependance non retenue

| Crate | Raison du rejet |
|-------|-----------------|
| `axum-extra` (CookieJar) | Le mecanisme de session cookie est deja implemente manuellement (HMAC-SHA256 dans `share_page.rs:39-50`). Ajouter `axum-extra` pour un seul usage violerait le principe de dependance minimale. |
| `tower-sessions` | Trop lourd pour le cas d'usage. Necessite un backend de session (Redis, etc.), contraire a LOI-1. |

---

## 2. Anti-patterns verifies

| Anti-pattern | Statut | Action |
|-------------|--------|--------|
| AP-01 : `unwrap()` en production | OK | Aucun `unwrap()` dans le nouveau code. `expect()` uniquement sur des constantes (Argon2 params). |
| AP-02 : URL externe en dur | OK | Aucune URL externe dans les nouveaux modules. |
| AP-03 : Passphrase par defaut | CORRIGE PAR SPEC | F-03 est traite : le serveur refuse de demarrer sans `MIYUCLOUD_PASSPHRASE`. |
| AP-04 : `spawn_blocking` manquant pour SQLite async | N/A | Les appels DB MiyuCloud sont synchrones (pas dans un context async direct). Le middleware axum gere la concurrence via `Mutex<Connection>`. |
| AP-05 : Serde champs sans `#[serde(default)]` | OK | Tous les nouveaux types ont `#[serde(default)]` sur les champs optionnels. |

---

## 3. Module `auth/totp.rs`

**Fichier** : `crates/miyucloud/src/auth/totp.rs`
**Annotations MSCM** :
```
@id: miyucloud_auth_totp
@do: generate_validate_totp_secrets_with_recovery_codes
@role: auth
@layer: domain
```

### 3.1 Types publics

```rust
/// Secret TOTP stocke en DB (chiffre avec la master key).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TotpSecret {
    /// UUID v4.
    pub id: String,
    /// UUID du proprietaire.
    pub owner_id: String,
    /// Secret TOTP chiffre (base64 du ciphertext ChaCha20-Poly1305).
    pub encrypted_secret: String,
    /// Nonce du chiffrement (base64, 12 bytes).
    pub encryption_nonce: String,
    /// Nom de l'emetteur (affiche dans l'app TOTP).
    #[serde(default = "default_issuer")]
    pub issuer: String,
    /// Nom du compte (affiche dans l'app TOTP).
    pub account_name: String,
    /// Algorithme (toujours SHA1 pour compatibilite RFC 6238).
    #[serde(default = "default_algorithm")]
    pub algorithm: String,
    /// Nombre de chiffres (toujours 6).
    #[serde(default = "default_digits")]
    pub digits: u8,
    /// Periode en secondes (toujours 30).
    #[serde(default = "default_period")]
    pub period: u32,
    /// 2FA active.
    #[serde(default)]
    pub is_active: bool,
    /// Date de creation (ISO 8601).
    pub created_at: String,
    /// Date de derniere utilisation (ISO 8601).
    #[serde(default)]
    pub last_used_at: Option<String>,
}

/// Code de recuperation usage unique.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryCode {
    /// UUID v4.
    pub id: String,
    /// UUID du proprietaire.
    pub owner_id: String,
    /// Hash du code de recuperation (Argon2id).
    pub code_hash: String,
    /// Code deja utilise.
    #[serde(default)]
    pub is_used: bool,
    /// Date de creation (ISO 8601).
    pub created_at: String,
    /// Date d'utilisation (ISO 8601).
    #[serde(default)]
    pub used_at: Option<String>,
}

/// Resultat du setup 2FA (retourne au client une seule fois).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TotpSetupResult {
    /// Secret en clair (pour affichage QR code). NE PAS STOCKER.
    pub secret_base32: String,
    /// URI otpauth:// pour QR code.
    pub otpauth_uri: String,
    /// QR code en base64 PNG (si feature "qr" active).
    #[serde(default)]
    pub qr_code_base64: Option<String>,
    /// Codes de recuperation en clair (afficher une seule fois).
    pub recovery_codes: Vec<String>,
}
```

### 3.2 Fonctions publiques

```rust
/// Genere un nouveau secret TOTP + 8 codes de recuperation.
///
/// Le secret est chiffre avec la master key avant stockage.
/// Les codes de recuperation sont hashes individuellement (Argon2id).
///
/// INVARIANT : Le secret en clair n'est JAMAIS stocke en DB.
/// INVARIANT : Les codes de recuperation en clair ne sont retournes qu'une seule fois.
///
/// # Parametres
/// - `db` : reference a la DB
/// - `master_key` : cle maitre pour chiffrement du secret
/// - `owner_id` : UUID du proprietaire
/// - `account_name` : nom du compte (ex: email)
///
/// # Retour
/// `TotpSetupResult` contenant le secret base32, l'URI otpauth, le QR code,
/// et les 8 codes de recuperation en clair.
pub fn setup_totp(
    db: &MiyucloudDb,
    master_key: &[u8; 32],
    owner_id: &str,
    account_name: &str,
) -> Result<TotpSetupResult, MiyucloudError>;

/// Valide un code TOTP a 6 chiffres.
///
/// Dechiffre le secret TOTP depuis la DB, genere le code attendu,
/// et compare en temps constant. Tolerance de +/- 1 periode (skew = 1).
///
/// # Retour
/// `Ok(true)` si le code est valide, `Ok(false)` sinon.
/// `Err` si le secret n'existe pas ou erreur de dechiffrement.
pub fn validate_totp(
    db: &MiyucloudDb,
    master_key: &[u8; 32],
    owner_id: &str,
    code: &str,
) -> Result<bool, MiyucloudError>;

/// Valide un code de recuperation (usage unique).
///
/// Verifie le hash du code contre les codes non utilises en DB.
/// Si valide, marque le code comme utilise (irreversible).
///
/// # Retour
/// `Ok(true)` si un code valide a ete trouve et consomme.
/// `Ok(false)` si aucun code ne correspond.
pub fn validate_recovery_code(
    db: &MiyucloudDb,
    owner_id: &str,
    code: &str,
) -> Result<bool, MiyucloudError>;

/// Desactive le 2FA pour un proprietaire.
///
/// Supprime le secret TOTP et tous les codes de recuperation associes.
/// Necessite un code TOTP valide OU un code de recuperation pour confirmer.
pub fn disable_totp(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<(), MiyucloudError>;

/// Verifie si le 2FA est active pour un proprietaire.
pub fn is_totp_enabled(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<bool, MiyucloudError>;

/// Regenere les codes de recuperation (invalide les anciens).
///
/// Genere 8 nouveaux codes, hash et stocke, supprime les anciens.
/// Retourne les codes en clair (une seule fois).
pub fn regenerate_recovery_codes(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<Vec<String>, MiyucloudError>;
```

### 3.3 Fonctions internes

```rust
/// Genere un secret TOTP aleatoire de 20 bytes (160 bits).
fn generate_totp_secret() -> [u8; 20];

/// Chiffre le secret TOTP avec ChaCha20-Poly1305.
fn encrypt_totp_secret(
    master_key: &[u8; 32],
    secret: &[u8],
) -> Result<(Vec<u8>, [u8; 12]), MiyucloudError>;

/// Dechiffre le secret TOTP.
fn decrypt_totp_secret(
    master_key: &[u8; 32],
    ciphertext: &[u8],
    nonce: &[u8; 12],
) -> Result<Vec<u8>, MiyucloudError>;

/// Genere un code de recuperation aleatoire (format: XXXX-XXXX-XXXX).
fn generate_recovery_code() -> String;

/// Hash un code de recuperation avec Argon2id (params legers).
fn hash_recovery_code(code: &str) -> Result<String, MiyucloudError>;

/// Verifie un code de recuperation contre un hash.
fn verify_recovery_code(code: &str, hash: &str) -> bool;
```

### 3.4 Invariants et contrats

1. Le secret TOTP est **toujours chiffre** en DB (ChaCha20-Poly1305 avec la master key)
2. Le secret en clair est retourne **une seule fois** dans `TotpSetupResult`
3. Les codes de recuperation sont **hashes individuellement** (Argon2id)
4. Les codes de recuperation en clair sont retournes **une seule fois**
5. La validation utilise `subtle::ConstantTimeEq` pour la comparaison
6. Le skew TOTP est de 1 (accepte T-1, T, T+1)
7. Un code de recuperation utilise est **irrecuperable**
8. La desactivation supprime **toutes** les donnees 2FA (secret + codes)
9. Le secret TOTP est zeroize en memoire apres utilisation (`zeroize`)

### 3.5 Interactions avec les modules existants

| Module | Interaction | Direction |
|--------|------------|-----------|
| `crypto::keys::KeyManager` | Derive file_key pour chiffrement du secret TOTP | Lecture |
| `crypto::at_rest` | `encrypt_chunk()` / `decrypt_chunk()` pour le secret | Lecture |
| `data::kindmother_db` | CRUD `cloud_totp_secrets` + `cloud_recovery_codes` | Lecture/Ecriture |
| `auth::web_tokens` | Reutilise `hash_password()` / `verify_password()` pour les codes recovery | Lecture |
| `errors::MiyucloudError` | Variantes existantes suffisantes (`Crypto`, `NotFound`, `InvalidInput`) | Lecture |

### 3.6 Tests critiques

| Test | Type | Description |
|------|------|-------------|
| `test_setup_totp_returns_valid_secret` | Unit | Verifie que le setup retourne un secret base32 valide et 8 codes recovery |
| `test_validate_totp_correct_code` | Unit | Genere un code avec `totp-rs` et le valide |
| `test_validate_totp_wrong_code` | Unit | Verifie que `000000` est rejete |
| `test_validate_totp_skew_minus_one` | Unit | Verifie qu'un code de la periode precedente est accepte |
| `test_recovery_code_single_use` | Unit | Utilise un code, verifie qu'il ne marche plus |
| `test_recovery_code_all_used_fails` | Unit | Utilise les 8 codes, verifie que le 9e echoue |
| `test_disable_totp_cleans_all` | Unit | Desactive, verifie que secret et codes sont supprimes |
| `test_secret_encrypted_in_db` | Unit | Verifie que le secret stocke en DB n'est pas en base32 clair |
| `test_regenerate_codes_invalidates_old` | Unit | Regenere, verifie que les anciens codes ne marchent plus |
| `test_totp_uri_format` | Unit | Verifie le format `otpauth://totp/Issuer:account?secret=...` |

---

## 4. Module `auth/sessions.rs`

**Fichier** : `crates/miyucloud/src/auth/sessions.rs`
**Annotations MSCM** :
```
@id: miyucloud_auth_sessions
@do: manage_server_side_sessions_with_creation_validation_expiration
@role: auth
@layer: domain
```

### 4.1 Types publics

```rust
/// Session serveur stockee en DB.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    /// UUID v4 (ID de session).
    pub id: String,
    /// UUID du proprietaire de la session.
    pub owner_id: String,
    /// Token de session (32 bytes hex, 256 bits).
    pub token: String,
    /// Adresse IP hashee (SHA-256) de creation.
    #[serde(default)]
    pub created_ip_hash: Option<String>,
    /// User-Agent tronque de creation.
    #[serde(default)]
    pub created_ua: Option<String>,
    /// Date de creation (ISO 8601).
    pub created_at: String,
    /// Date d'expiration (ISO 8601).
    pub expires_at: String,
    /// Date de derniere activite (ISO 8601).
    pub last_activity_at: String,
    /// Session revoquee manuellement.
    #[serde(default)]
    pub is_revoked: bool,
    /// 2FA verifie pour cette session.
    #[serde(default)]
    pub totp_verified: bool,
}

/// Configuration des sessions.
pub struct SessionConfig {
    /// Duree de vie d'une session (defaut : 24h).
    pub session_ttl: std::time::Duration,
    /// Duree max d'inactivite (defaut : 2h).
    pub inactivity_timeout: std::time::Duration,
    /// Nombre max de sessions actives par utilisateur (defaut : 5).
    pub max_active_sessions: u32,
}
```

### 4.2 Fonctions publiques

```rust
/// Cree une nouvelle session et retourne le token.
///
/// Si l'utilisateur a deja `max_active_sessions` sessions,
/// la plus ancienne est supprimee (FIFO).
///
/// INVARIANT : Le token est genere avec 256 bits d'entropie (OsRng).
/// INVARIANT : La session a toujours une date d'expiration.
pub fn create_session(
    db: &MiyucloudDb,
    owner_id: &str,
    ip_hash: Option<&str>,
    ua: Option<&str>,
    config: &SessionConfig,
) -> Result<Session, MiyucloudError>;

/// Valide un token de session.
///
/// Verifie dans l'ordre :
/// 1. Le token existe en DB
/// 2. La session n'est pas revoquee
/// 3. La session n'est pas expiree
/// 4. L'inactivite ne depasse pas le timeout
/// 5. Met a jour `last_activity_at`
///
/// # Retour
/// `Ok(Session)` si la session est valide.
/// `Err(PermissionDenied)` sinon.
pub fn validate_session(
    db: &MiyucloudDb,
    token: &str,
    config: &SessionConfig,
) -> Result<Session, MiyucloudError>;

/// Revoque une session specifique.
pub fn revoke_session(
    db: &MiyucloudDb,
    session_id: &str,
) -> Result<(), MiyucloudError>;

/// Revoque toutes les sessions d'un utilisateur.
pub fn revoke_all_sessions(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<u32, MiyucloudError>;

/// Liste les sessions actives d'un utilisateur.
pub fn list_active_sessions(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<Vec<Session>, MiyucloudError>;

/// Marque une session comme ayant passe la verification 2FA.
pub fn mark_totp_verified(
    db: &MiyucloudDb,
    session_id: &str,
) -> Result<(), MiyucloudError>;

/// Purge les sessions expirees (tache de maintenance).
///
/// Supprime toutes les sessions dont `expires_at` < maintenant.
/// Retourne le nombre de sessions purgees.
pub fn purge_expired_sessions(
    db: &MiyucloudDb,
) -> Result<u32, MiyucloudError>;
```

### 4.3 Invariants et contrats

1. Token de session : 256 bits d'entropie (OsRng), hex encode (64 chars)
2. Expiration obligatoire (defaut 24h, configurable)
3. Timeout d'inactivite (defaut 2h, configurable)
4. Max sessions par utilisateur (defaut 5, FIFO si depassement)
5. La revocation est immediate (flag `is_revoked`)
6. `last_activity_at` mis a jour a chaque validation reussie
7. Le champ `totp_verified` est `false` par defaut, passe a `true` apres validation TOTP
8. Les sessions expirees sont purgees periodiquement (pas de retention infinie)
9. La comparaison de token est en temps constant (`subtle::ConstantTimeEq`)

### 4.4 Interactions avec les modules existants

| Module | Interaction | Direction |
|--------|------------|-----------|
| `data::kindmother_db` | CRUD `cloud_sessions` | Lecture/Ecriture |
| `auth::totp` | `validate_totp()` pour marquer `totp_verified` | Lecture |
| `web_surface::access_log` | Reutilise `hash_ip()` pour `created_ip_hash` | Lecture |
| `web_surface::share_page` | Integre la validation de session dans `share_download` | Consommation |
| `errors::MiyucloudError` | `PermissionDenied` pour sessions invalides/expirees | Lecture |

### 4.5 Tests critiques

| Test | Type | Description |
|------|------|-------------|
| `test_create_session_returns_valid_token` | Unit | Verifie token 64 chars hex, expiration dans le futur |
| `test_validate_session_valid` | Unit | Cree puis valide avec succes |
| `test_validate_session_expired` | Unit | Session expiree = `Err` |
| `test_validate_session_revoked` | Unit | Session revoquee = `Err` |
| `test_validate_session_inactive` | Unit | Session inactive > timeout = `Err` |
| `test_max_sessions_evicts_oldest` | Unit | 6e session supprime la 1re |
| `test_revoke_all_sessions` | Unit | Verifie que toutes les sessions sont revoquees |
| `test_purge_expired` | Unit | Cree sessions expirees, purge, verifie compteur |
| `test_totp_verified_flag` | Unit | Cree session, marque totp_verified, valide le flag |
| `test_token_constant_time_comparison` | Unit | Verifie que la validation ne fait pas de short-circuit |

---

## 5. Module `domain/onboarding.rs`

**Fichier** : `crates/miyucloud/src/domain/onboarding.rs`
**Annotations MSCM** :
```
@id: miyucloud_domain_onboarding
@do: manage_first_connection_wizard_and_setup_checks
@role: domain
@layer: domain
```

### 5.1 Types publics

```rust
/// Etat de l'onboarding pour un utilisateur.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OnboardingStatus {
    /// UUID du proprietaire.
    pub owner_id: String,
    /// Etape courante (1 a 4).
    #[serde(default = "default_step")]
    pub current_step: u8,
    /// Passphrase configuree.
    #[serde(default)]
    pub passphrase_set: bool,
    /// 2FA configure.
    #[serde(default)]
    pub totp_set: bool,
    /// Dossier de stockage valide.
    #[serde(default)]
    pub storage_verified: bool,
    /// Onboarding termine.
    #[serde(default)]
    pub completed: bool,
    /// Date de completion (ISO 8601).
    #[serde(default)]
    pub completed_at: Option<String>,
}

/// Etapes de l'onboarding.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OnboardingStep {
    /// Etape 1 : Verification passphrase.
    CheckPassphrase = 1,
    /// Etape 2 : Configuration 2FA (optionnel mais recommande).
    Setup2FA = 2,
    /// Etape 3 : Verification stockage.
    VerifyStorage = 3,
    /// Etape 4 : Resume et confirmation.
    Confirmation = 4,
}
```

### 5.2 Fonctions publiques

```rust
/// Retourne le statut de l'onboarding pour un utilisateur.
///
/// Si aucun statut n'existe, retourne un statut initial (step 1, tout false).
pub fn get_status(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<OnboardingStatus, MiyucloudError>;

/// Verifie si la passphrase est configuree (canary present en DB).
///
/// Met a jour `passphrase_set` dans le statut d'onboarding.
pub fn check_passphrase(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<bool, MiyucloudError>;

/// Verifie si le 2FA est configure.
///
/// Delegue a `auth::totp::is_totp_enabled()`.
/// Met a jour `totp_set` dans le statut d'onboarding.
pub fn check_2fa(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<bool, MiyucloudError>;

/// Verifie si le dossier de stockage est accessible et inscriptible.
///
/// Cree un fichier temporaire dans le dossier de stockage, le supprime.
/// Met a jour `storage_verified` dans le statut d'onboarding.
pub fn verify_storage(
    db: &MiyucloudDb,
    storage_path: &std::path::Path,
    owner_id: &str,
) -> Result<bool, MiyucloudError>;

/// Termine l'onboarding (marque comme complete).
///
/// INVARIANT : Ne peut etre termine que si `passphrase_set` ET `storage_verified`.
/// Le 2FA est recommande mais pas obligatoire.
pub fn complete_onboarding(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<OnboardingStatus, MiyucloudError>;

/// Reinitialise l'onboarding (pour re-configuration).
pub fn reset_onboarding(
    db: &MiyucloudDb,
    owner_id: &str,
) -> Result<(), MiyucloudError>;
```

### 5.3 Invariants et contrats

1. L'onboarding n'est **pas bloquant** : le service fonctionne sans onboarding complet
2. `passphrase_set` et `storage_verified` sont **obligatoires** pour completer
3. `totp_set` est **recommande** mais pas obligatoire (le front affiche un warning)
4. Le statut est persistent en DB (pas de perte si le serveur redemarre)
5. La verification de stockage est un test **reel** (ecriture + lecture + suppression)
6. L'onboarding peut etre reinitialise a tout moment

### 5.4 Tests critiques

| Test | Type | Description |
|------|------|-------------|
| `test_initial_status_all_false` | Unit | Verifie l'etat initial |
| `test_check_passphrase_with_canary` | Unit | Insere un canary, verifie `passphrase_set = true` |
| `test_check_passphrase_without_canary` | Unit | Pas de canary = `passphrase_set = false` |
| `test_verify_storage_valid_path` | Unit | tmpdir inscriptible = true |
| `test_verify_storage_invalid_path` | Unit | Chemin inexistant = false |
| `test_complete_requires_passphrase_and_storage` | Unit | Echoue si l'un manque |
| `test_complete_without_2fa_succeeds` | Unit | 2FA optionnel, completion OK |
| `test_reset_clears_status` | Unit | Reset ramene tout a l'initial |

---

## 6. Module `monitoring/mod.rs`

**Fichier** : `crates/miyucloud/src/monitoring/mod.rs`
**Annotations MSCM** :
```
@id: miyucloud_monitoring
@do: provide_health_check_metrics_and_alerts
@role: monitoring
@layer: infra
```

### 6.1 Types publics

```rust
/// Resultat d'un health check detaille.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthReport {
    /// Statut global.
    pub status: HealthStatus,
    /// Version du serveur.
    pub version: String,
    /// Uptime en secondes.
    pub uptime_seconds: u64,
    /// Checks individuels.
    pub checks: Vec<HealthCheck>,
    /// Date du check (ISO 8601).
    pub checked_at: String,
}

/// Statut global du service.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HealthStatus {
    /// Tout va bien.
    Healthy,
    /// Degradation partielle (certains checks echouent).
    Degraded,
    /// Service non fonctionnel.
    Unhealthy,
}

/// Check individuel.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheck {
    /// Nom du check.
    pub name: String,
    /// Statut du check.
    pub status: HealthStatus,
    /// Message optionnel.
    #[serde(default)]
    pub message: Option<String>,
    /// Duree du check en ms.
    #[serde(default)]
    pub duration_ms: u64,
}

/// Metriques du service.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceMetrics {
    /// Nombre total de fichiers.
    pub total_files: u64,
    /// Espace utilise en octets.
    pub used_bytes: u64,
    /// Nombre de sessions actives.
    pub active_sessions: u32,
    /// Nombre de liens de partage actifs.
    pub active_share_links: u64,
    /// Nombre de pairs sync.
    pub sync_peers: u64,
    /// Requetes servies depuis le demarrage.
    #[serde(default)]
    pub requests_served: u64,
    /// Date du rapport (ISO 8601).
    pub reported_at: String,
}
```

### 6.2 Fonctions publiques

```rust
/// Execute un health check complet.
///
/// Checks effectues :
/// 1. DB accessible (SELECT 1)
/// 2. Stockage accessible (test ecriture tmpfile)
/// 3. Crypto operationnel (derive une cle test)
/// 4. Espace disque suffisant (> 100 MB libres)
pub fn health_check(
    db: &MiyucloudDb,
    storage_path: &std::path::Path,
    master_key: &[u8; 32],
) -> HealthReport;

/// Collecte les metriques du service.
pub fn collect_metrics(
    db: &MiyucloudDb,
) -> Result<ServiceMetrics, MiyucloudError>;

/// Verifie si le stockage a suffisamment d'espace disque.
///
/// Retourne `true` si au moins `min_bytes` sont disponibles.
pub fn check_disk_space(
    storage_path: &std::path::Path,
    min_bytes: u64,
) -> bool;
```

### 6.3 Tests critiques

| Test | Type | Description |
|------|------|-------------|
| `test_health_check_all_healthy` | Unit | DB in-memory + tmpdir = Healthy |
| `test_health_check_db_down` | Unit | DB invalide = Unhealthy |
| `test_collect_metrics` | Unit | Insere fichiers, verifie compteurs |
| `test_disk_space_check` | Unit | tmpdir > 0 bytes = true |

---

## 7. Fonctions utilitaires securite

### 7.1 `utils/sanitize.rs`

**Fichier** : `crates/miyucloud/src/utils/sanitize.rs`
**Annotations MSCM** :
```
@id: miyucloud_utils_sanitize
@do: provide_html_escape_filename_sanitize_functions
@role: security
@layer: infra
```

```rust
/// Echappe les caracteres HTML dangereux.
///
/// Remplace : `<` -> `&lt;`, `>` -> `&gt;`, `&` -> `&amp;`,
/// `"` -> `&quot;`, `'` -> `&#x27;`
///
/// Correction F-04 (XSS dans la page de partage).
pub fn html_escape(input: &str) -> String;

/// Nettoie un nom de fichier pour stockage securise.
///
/// - Supprime les caracteres de controle (0x00-0x1F)
/// - Remplace `..`, `/`, `\` par `_`
/// - Tronque a 255 caracteres
/// - Retourne "unnamed" si le resultat est vide
///
/// Correction F-05 (path traversal sur file_id).
pub fn sanitize_filename(name: &str) -> String;

/// Valide qu'une chaine est un UUID v4 valide.
///
/// Correction F-05 (validation file_id dans le storage).
pub fn validate_uuid(id: &str) -> bool;
```

### 7.2 `utils/constant_time.rs`

**Fichier** : `crates/miyucloud/src/utils/constant_time.rs`
**Annotations MSCM** :
```
@id: miyucloud_utils_constant_time
@do: provide_constant_time_comparison_via_subtle
@role: security
@layer: infra
```

```rust
/// Comparaison en temps constant de deux slices de bytes.
///
/// Utilise `subtle::ConstantTimeEq` pour eviter les timing attacks.
/// Correction F-02 (comparaison de hash non constant-time).
///
/// INVARIANT : Le temps d'execution ne depend PAS du contenu des slices.
pub fn constant_time_eq(a: &[u8], b: &[u8]) -> bool;
```

### 7.3 `utils/base64.rs`

**Fichier** : `crates/miyucloud/src/utils/base64.rs`
**Annotations MSCM** :
```
@id: miyucloud_utils_base64
@do: provide_base64_encode_decode_via_standard_crate
@role: util
@layer: infra
```

```rust
/// Encode des bytes en base64 standard (RFC 4648).
pub fn encode(data: &[u8]) -> String;

/// Decode une chaine base64 en bytes.
pub fn decode(input: &str) -> Result<Vec<u8>, MiyucloudError>;
```

### 7.4 `utils/mod.rs`

```rust
pub mod sanitize;
pub mod constant_time;
pub mod base64;
```

### 7.5 Tests critiques (utils)

| Test | Type | Description |
|------|------|-------------|
| `test_html_escape_angle_brackets` | Unit | `<script>` -> `&lt;script&gt;` |
| `test_html_escape_quotes` | Unit | `"` -> `&quot;`, `'` -> `&#x27;` |
| `test_html_escape_ampersand` | Unit | `&` -> `&amp;` |
| `test_html_escape_safe_string` | Unit | `hello` reste `hello` |
| `test_sanitize_filename_dots` | Unit | `../../../etc/passwd` -> `______etc_passwd` |
| `test_sanitize_filename_backslash` | Unit | `..\\windows` -> `__windows` |
| `test_sanitize_filename_empty` | Unit | `""` -> `"unnamed"` |
| `test_sanitize_filename_truncate` | Unit | 300 chars -> 255 chars |
| `test_validate_uuid_valid` | Unit | UUID v4 standard accepte |
| `test_validate_uuid_invalid` | Unit | `../hack` rejete |
| `test_constant_time_eq_equal` | Unit | Memes bytes = true |
| `test_constant_time_eq_different` | Unit | Bytes differents = false |
| `test_constant_time_eq_different_length` | Unit | Longueurs differentes = false |
| `test_base64_roundtrip` | Unit | encode(data) -> decode -> data |
| `test_base64_invalid_input` | Unit | `!!!` -> Err |

---

## 8. Schema DB nouvelles tables

### 8.1 Table `cloud_sessions`

```sql
CREATE TABLE IF NOT EXISTS cloud_sessions (
    id                TEXT PRIMARY KEY,
    owner_id          TEXT NOT NULL,
    token             TEXT NOT NULL UNIQUE,
    created_ip_hash   TEXT,
    created_ua        TEXT,
    created_at        TEXT NOT NULL,
    expires_at        TEXT NOT NULL,
    last_activity_at  TEXT NOT NULL,
    is_revoked        INTEGER NOT NULL DEFAULT 0,
    totp_verified     INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cloud_sessions_token
    ON cloud_sessions(token);
CREATE INDEX IF NOT EXISTS idx_cloud_sessions_owner
    ON cloud_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_cloud_sessions_expires
    ON cloud_sessions(expires_at);
```

### 8.2 Table `cloud_totp_secrets`

```sql
CREATE TABLE IF NOT EXISTS cloud_totp_secrets (
    id                TEXT PRIMARY KEY,
    owner_id          TEXT NOT NULL UNIQUE,
    encrypted_secret  TEXT NOT NULL,
    encryption_nonce  TEXT NOT NULL,
    issuer            TEXT NOT NULL DEFAULT 'MiyuCloud',
    account_name      TEXT NOT NULL,
    algorithm         TEXT NOT NULL DEFAULT 'SHA1',
    digits            INTEGER NOT NULL DEFAULT 6,
    period            INTEGER NOT NULL DEFAULT 30,
    is_active         INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL,
    last_used_at      TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cloud_totp_owner
    ON cloud_totp_secrets(owner_id);
```

### 8.3 Table `cloud_recovery_codes`

```sql
CREATE TABLE IF NOT EXISTS cloud_recovery_codes (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL,
    code_hash   TEXT NOT NULL,
    is_used     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    used_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_cloud_recovery_codes_owner
    ON cloud_recovery_codes(owner_id);
```

### 8.4 Table `cloud_onboarding`

```sql
CREATE TABLE IF NOT EXISTS cloud_onboarding (
    owner_id          TEXT PRIMARY KEY,
    current_step      INTEGER NOT NULL DEFAULT 1,
    passphrase_set    INTEGER NOT NULL DEFAULT 0,
    totp_set          INTEGER NOT NULL DEFAULT 0,
    storage_verified  INTEGER NOT NULL DEFAULT 0,
    completed         INTEGER NOT NULL DEFAULT 0,
    completed_at      TEXT
);
```

### 8.5 Migration

La migration est **additive uniquement** (ajout de tables, pas de modification des tables existantes). Compatible avec les bases v1 sans perte de donnees.

Schema de migration :
```sql
-- Migration v2: sessions + 2FA + onboarding + monitoring
-- Reversible: DROP TABLE IF EXISTS cloud_sessions, cloud_totp_secrets,
--             cloud_recovery_codes, cloud_onboarding;

BEGIN TRANSACTION;
-- Tables ajoutees dans init_schema() (CREATE IF NOT EXISTS)
COMMIT;
```

---

## 9. Schema API nouveaux endpoints

### 9.1 Onboarding

#### `GET /api/onboarding/status`

Retourne le statut de l'onboarding.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "owner_id": "uuid-v4",
    "current_step": 1,
    "passphrase_set": true,
    "totp_set": false,
    "storage_verified": true,
    "completed": false,
    "completed_at": null
}
```

#### `POST /api/onboarding/check-passphrase`

Verifie que la passphrase est configuree.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "passphrase_set": true
}
```

#### `POST /api/onboarding/verify-storage`

Verifie que le stockage est accessible.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "storage_verified": true,
    "storage_path": "/home/user/.miyucloud/storage"
}
```

#### `POST /api/onboarding/complete`

Termine l'onboarding.

**Auth** : `X-COG-Token`

**Response 200** : `OnboardingStatus` (cf. supra)

**Erreur 400** :
```json
{
    "error": {
        "code": "INCOMPLETE_ONBOARDING",
        "message": "Passphrase and storage must be verified before completing onboarding",
        "details": null
    }
}
```

### 9.2 2FA (TOTP)

#### `POST /api/2fa/setup`

Configure le 2FA pour l'utilisateur courant.

**Auth** : `X-COG-Token`

**Request body** :
```json
{
    "account_name": "user@example.com"
}
```

**Response 201** :
```json
{
    "secret_base32": "JBSWY3DPEHPK3PXP",
    "otpauth_uri": "otpauth://totp/MiyuCloud:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MiyuCloud&algorithm=SHA1&digits=6&period=30",
    "qr_code_base64": "data:image/png;base64,...",
    "recovery_codes": [
        "ABCD-EFGH-IJKL",
        "MNOP-QRST-UVWX",
        "..."
    ]
}
```

**Erreur 409** :
```json
{
    "error": {
        "code": "TOTP_ALREADY_CONFIGURED",
        "message": "2FA is already configured for this account",
        "details": null
    }
}
```

#### `POST /api/2fa/verify`

Valide un code TOTP a 6 chiffres.

**Auth** : `X-COG-Token`

**Request body** :
```json
{
    "code": "123456"
}
```

**Response 200** :
```json
{
    "valid": true
}
```

**Response 200 (echec)** :
```json
{
    "valid": false
}
```

#### `DELETE /api/2fa`

Desactive le 2FA.

**Auth** : `X-COG-Token`

**Request body** :
```json
{
    "code": "123456"
}
```

(Requiert un code TOTP valide ou un code de recuperation pour confirmer.)

**Response 200** :
```json
{
    "disabled": true
}
```

**Erreur 401** :
```json
{
    "error": {
        "code": "INVALID_CODE",
        "message": "A valid TOTP or recovery code is required to disable 2FA",
        "details": null
    }
}
```

#### `POST /api/2fa/recovery/verify`

Valide un code de recuperation (usage unique).

**Auth** : `X-COG-Token`

**Request body** :
```json
{
    "code": "ABCD-EFGH-IJKL"
}
```

**Response 200** :
```json
{
    "valid": true,
    "remaining_codes": 7
}
```

#### `POST /api/2fa/recovery/regenerate`

Regenere les codes de recuperation (invalide les anciens).

**Auth** : `X-COG-Token`

**Request body** :
```json
{
    "code": "123456"
}
```

(Requiert un code TOTP valide pour confirmer.)

**Response 200** :
```json
{
    "recovery_codes": [
        "WXYZ-ABCD-EFGH",
        "..."
    ]
}
```

#### `GET /api/2fa/status`

Verifie si le 2FA est active.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "enabled": true,
    "remaining_recovery_codes": 6
}
```

### 9.3 Sessions

#### `GET /api/sessions`

Liste les sessions actives.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "sessions": [
        {
            "id": "uuid-v4",
            "created_ip_hash": "sha256hex...",
            "created_ua": "Mozilla/5.0...",
            "created_at": "2026-03-03T10:00:00Z",
            "expires_at": "2026-03-04T10:00:00Z",
            "last_activity_at": "2026-03-03T12:00:00Z",
            "is_revoked": false,
            "totp_verified": true
        }
    ]
}
```

#### `DELETE /api/sessions/{id}`

Revoque une session specifique.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "revoked": true
}
```

#### `DELETE /api/sessions`

Revoque toutes les sessions.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "revoked_count": 3
}
```

### 9.4 Monitoring

#### `GET /api/health` (remplace `/health`)

Health check detaille (protege par auth).

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "status": "healthy",
    "version": "0.1.0",
    "uptime_seconds": 3600,
    "checks": [
        {"name": "database", "status": "healthy", "message": null, "duration_ms": 1},
        {"name": "storage", "status": "healthy", "message": null, "duration_ms": 5},
        {"name": "crypto", "status": "healthy", "message": null, "duration_ms": 2},
        {"name": "disk_space", "status": "healthy", "message": "12.5 GB free", "duration_ms": 1}
    ],
    "checked_at": "2026-03-03T14:00:00Z"
}
```

**Note** : L'endpoint non-authentifie `GET /health` existant reste inchange (retourne `"OK"` sans details pour les load balancers).

#### `GET /api/metrics`

Metriques du service.

**Auth** : `X-COG-Token`

**Response 200** :
```json
{
    "total_files": 42,
    "used_bytes": 1073741824,
    "active_sessions": 2,
    "active_share_links": 5,
    "sync_peers": 1,
    "requests_served": 1234,
    "reported_at": "2026-03-03T14:00:00Z"
}
```

### 9.5 Recapitulatif des endpoints

| # | Methode | Route | Auth | Module |
|---|---------|-------|------|--------|
| 1 | GET | `/api/onboarding/status` | X-COG-Token | onboarding |
| 2 | POST | `/api/onboarding/check-passphrase` | X-COG-Token | onboarding |
| 3 | POST | `/api/onboarding/verify-storage` | X-COG-Token | onboarding |
| 4 | POST | `/api/onboarding/complete` | X-COG-Token | onboarding |
| 5 | POST | `/api/2fa/setup` | X-COG-Token | totp |
| 6 | POST | `/api/2fa/verify` | X-COG-Token | totp |
| 7 | DELETE | `/api/2fa` | X-COG-Token | totp |
| 8 | POST | `/api/2fa/recovery/verify` | X-COG-Token | totp |
| 9 | POST | `/api/2fa/recovery/regenerate` | X-COG-Token | totp |
| 10 | GET | `/api/2fa/status` | X-COG-Token | totp |
| 11 | GET | `/api/sessions` | X-COG-Token | sessions |
| 12 | DELETE | `/api/sessions/{id}` | X-COG-Token | sessions |
| 13 | DELETE | `/api/sessions` | X-COG-Token | sessions |
| 14 | GET | `/api/health` | X-COG-Token | monitoring |
| 15 | GET | `/api/metrics` | X-COG-Token | monitoring |

**Total apres ajout** : 27 existants + 15 nouveaux = 42 routes API.

---

## 10. Corrections securite (F-01 a F-10)

### 10.1 F-01 -- Download bypasse la verification de mot de passe

**Statut** : DEJA CORRIGE (share_page.rs:214-219)

Le fix utilise un cookie de session HMAC-SHA256 (voir `share_page.rs:39-81`). Le handler `share_download` verifie `verify_session_cookie()` avant de servir le fichier.

**Verification** : Le code existant dans `share_page.rs:215-219` est correct :
```rust
if link.has_password
    && !verify_session_cookie(&headers, &token, &state.config.cog_token)
{
    return (StatusCode::UNAUTHORIZED, "Authentication required").into_response();
}
```

**Action P3** : Aucune modification necessaire. Ajouter un test d'integration pour cette protection.

### 10.2 F-02 -- Comparaison non constant-time

**Statut** : DEJA CORRIGE (web_tokens.rs:103-111)

Le code utilise deja un accumulateur XOR :
```rust
let mut diff = 0u8;
for (a, b) in computed.iter().zip(expected_hash.iter()) {
    diff |= a ^ b;
}
diff == 0
```

**Action P3** : Remplacer par `subtle::ConstantTimeEq` pour une garantie formelle. Creer `utils/constant_time.rs` et l'utiliser partout (web_tokens, share_page, sessions).

### 10.3 F-03 -- Passphrase par defaut hardcodee

**Statut** : DEJA CORRIGE (main.rs:242-250)

Le serveur refuse de demarrer sans `MIYUCLOUD_PASSPHRASE` :
```rust
Some(p) if !p.is_empty() => p,
_ => {
    return Err(MiyucloudError::Crypto(
        "MIYUCLOUD_PASSPHRASE environment variable is required."
            .into(),
    ));
}
```

**Action P3** : Aucune modification necessaire. Deja conforme.

### 10.4 F-04 -- XSS dans la page de partage

**Statut** : A CORRIGER

**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs:318`

Le `file_name` est insere directement dans le HTML sans echappement.

**Correction specifiee** :
1. Creer `utils/sanitize::html_escape()`
2. Dans `render_share_page()`, echapper `file_name`, `file_size`, `expires_at`, `token`
3. Le `token` est deja un hex string (safe), mais echapper par precaution

**Lignes impactees** : `share_page.rs:318-324`

### 10.5 F-05 -- Path traversal sur file_id

**Statut** : A CORRIGER

**Fichier** : `crates/miyucloud/src/storage/local_fs.rs:32-38`

**Correction specifiee** :
1. Creer `utils/sanitize::validate_uuid()`
2. Dans `LocalFsStorage::file_dir()`, valider que `file_id` est un UUID v4 valide
3. Rejeter avec `MiyucloudError::InvalidInput` si le format est invalide

### 10.6 F-06 -- Sel de hashing IP hardcode

**Statut** : A CORRIGER

**Fichier** : `apps/miyucloud/src/web_surface/access_log.rs:24`

**Correction specifiee** :
1. Deriver le sel depuis le COG token (HKDF-SHA256 avec context `"miyucloud-ip-salt"`)
2. Passer le sel derive en parametre de `hash_ip()`
3. Modifier la signature : `fn hash_ip(ip: &str, salt: &[u8]) -> String`

### 10.7 F-07 -- Consultation de page non loggee

**Statut** : A CORRIGER

**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs:84-112`

**Correction specifiee** :
Ajouter un appel `access_log::log_access()` avec `AccessAction::Preview` dans `share_page()` apres la verification du token reussie.

### 10.8 F-08 -- Rate limiter HashMap sans purge

**Statut** : A CORRIGER (severite INFO)

**Fichier** : `apps/miyucloud/src/web_surface/rate_limiter.rs:46-51`

**Correction specifiee** :
1. Ajouter un compteur de requetes totales dans `RateLimiterState`
2. Toutes les 100 requetes, purger les entrees expirees de toutes les IPs
3. Limiter le HashMap a 10 000 entrees max (eviction LRU de la plus ancienne entree)

### 10.9 F-09 -- Streaming reel pour gros fichiers

**Statut** : DIFFERE (hors scope v2)

Le `collect_all()` actuel est acceptable pour le MVP. Le `StreamingDecryptor` est deja concu pour du streaming. La migration vers `Body::from_stream()` sera faite dans une iteration future.

### 10.10 F-10 -- X-Forwarded-For sans validation

**Statut** : A CORRIGER (severite INFO)

**Fichier** : `apps/miyucloud/src/web_surface/rate_limiter.rs:168-187`

**Correction specifiee** :
1. Ajouter une option `trust_proxy` dans la config
2. Si `trust_proxy = false` (defaut), ignorer `X-Forwarded-For` et `X-Real-IP`
3. Utiliser `ConnectInfo<SocketAddr>` d'axum comme source primaire si disponible
4. Documenter dans la config que `trust_proxy = true` ne doit etre active que derriere un reverse proxy

---

## 11. Conformite architecturale

### 11.1 Checklist

- [x] LOI-1 : Pas de dependance externe critique (`totp-rs`, `subtle`, `zeroize`, `base64` sont des crates Rust compiles statiquement)
- [x] LOI-2 : Le service fonctionne en mode isole (2FA est optionnel, sessions sont locales)
- [x] LOI-3 : Etat local souverain (sessions en SQLite, pas de Redis)
- [x] LOI-5 : Cout proportionnel au hardware (0 euro d'abonnement)
- [x] LOI-7 : Strate Cores immuable (pas de modification des Cores)
- [x] `unsafe_code = "forbid"` dans le Cargo.toml (deja present)
- [x] Strate correcte : service (Strate 7) pour miyucloud
- [x] Annotations MSCM planifiees sur tous les nouveaux fichiers

### 11.2 Fichiers a creer

| Fichier | Module | Lignes estimees |
|---------|--------|-----------------|
| `crates/miyucloud/src/auth/totp.rs` | 2FA TOTP | ~300 |
| `crates/miyucloud/src/auth/sessions.rs` | Sessions | ~250 |
| `crates/miyucloud/src/domain/onboarding.rs` | Onboarding | ~200 |
| `crates/miyucloud/src/monitoring/mod.rs` | Monitoring | ~150 |
| `crates/miyucloud/src/utils/mod.rs` | Utils module | ~10 |
| `crates/miyucloud/src/utils/sanitize.rs` | Sanitize | ~80 |
| `crates/miyucloud/src/utils/constant_time.rs` | Constant time | ~30 |
| `crates/miyucloud/src/utils/base64.rs` | Base64 | ~30 |
| **Total nouveaux fichiers crate** | | **~1 050** |

| Fichier | Module | Lignes estimees |
|---------|--------|-----------------|
| `apps/miyucloud/src/api/onboarding.rs` | Handlers onboarding | ~100 |
| `apps/miyucloud/src/api/totp.rs` | Handlers 2FA | ~200 |
| `apps/miyucloud/src/api/sessions.rs` | Handlers sessions | ~100 |
| `apps/miyucloud/src/api/monitoring.rs` | Handlers monitoring | ~80 |
| **Total nouveaux fichiers app** | | **~480** |

### 11.3 Fichiers a modifier

| Fichier | Modification | Lignes impactees |
|---------|-------------|-----------------|
| `crates/miyucloud/src/lib.rs` | Ajouter `pub mod utils; pub mod monitoring;` | L12 (+2) |
| `crates/miyucloud/src/auth/mod.rs` | Ajouter `pub mod totp; pub mod sessions;` | L8-9 (+2) |
| `crates/miyucloud/src/domain/mod.rs` | Ajouter `pub mod onboarding;` | L16 (+1) |
| `crates/miyucloud/src/data/kindmother_db.rs` | Ajouter CREATE TABLE pour les 4 nouvelles tables + CRUD | L56-211 (+~300) |
| `crates/miyucloud/src/data/types.rs` | Importer les nouveaux types (re-exports) | (+~10) |
| `crates/miyucloud/Cargo.toml` | Ajouter `totp-rs`, `subtle`, `zeroize`, `base64` | L20-25 (+4) |
| `apps/miyucloud/src/api/mod.rs` | Ajouter modules + routes dans `api_router()` | L11-82 (+~30) |
| `apps/miyucloud/src/main.rs` | Remplacer base64 manuelle par `miyucloud::utils::base64` | L308-377 (-70, +2) |
| `apps/miyucloud/src/web_surface/share_page.rs` | F-04 (html_escape) + F-07 (log preview) | L318 (+5), L100 (+10) |
| `apps/miyucloud/src/web_surface/access_log.rs` | F-06 (sel derive) : signature `hash_ip()` | L24-48 (~10 lignes modifiees) |
| `apps/miyucloud/src/web_surface/rate_limiter.rs` | F-08 (purge) + F-10 (trust_proxy) | L46-51 (+30), L168-187 (+15) |
| `apps/miyucloud/src/config.rs` | Ajouter `trust_proxy: bool` | L16-37 (+3) |
| `apps/miyucloud/Cargo.toml` | Aucune modification (deps deja dans le crate) | -- |

### 11.4 Dependances Cargo.toml a ajouter

```toml
# Dans crates/miyucloud/Cargo.toml [dependencies]
totp-rs = { version = "5", features = ["otpauth", "qr"] }
subtle = "2.6"
zeroize = { version = "1.8", features = ["zeroize_derive"] }
base64 = "0.22"
```

---

## 12. Risques techniques

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R-01 | `totp-rs` feature `qr` ajoute une dep lourde (image) | Moyenne | Faible (taille binaire) | Feature-gater derriere un flag `totp-qr` optionnel. Si trop lourd, generer le QR code cote client. |
| R-02 | Le zeroize du secret TOTP en memoire peut etre optimise away | Faible | Moyen | Utiliser `Zeroizing<Vec<u8>>` du crate `zeroize` qui utilise `compiler_fence`. |
| R-03 | Les sessions SQLite sous forte charge (>100 req/s) | Faible | Moyen | Le `Mutex<Connection>` existant est suffisant pour un service mono-utilisateur. Pas de contention attendue. |
| R-04 | La purge des sessions expirees n'est pas automatique | Moyenne | Faible | Implementer un check a chaque `validate_session()` : si >100 sessions, purger les expirees. Pas de tache background (LOI-1). |
| R-05 | Le `base64` crate ajoute une dependance | Faible | Faible | Crate tiny (no_std). Alternative : garder l'impl manuelle existante mais ajouter des tests de fuzzing. Decision : utiliser le crate (fiabilite > taille). |

---

## Verification documentaire (resume P0 Temps 6)

### Libs verifiees
- `totp-rs` 5.x : API `TOTP::new()`, `generate_current()`, `check_current()`, features `otpauth`+`qr`
- `subtle` 2.6 : `ConstantTimeEq::ct_eq()` retourne `Choice`, impl sur `[u8]`
- `zeroize` 1.8 : `Zeroize` trait, `Zeroizing<T>` wrapper, `ZeroizeOnDrop`
- `base64` 0.22 : `engine::general_purpose::STANDARD.encode/decode`
- `axum` 0.8 : Patterns `{param}` confirmes, pas de breaking changes

### Breaking changes detectes
- Aucun

### Anti-patterns evites
- Pas d'`unwrap()` en production
- Pas d'URL externe en dur
- Pas de passphrase par defaut (deja corrige dans v1)
- `#[serde(default)]` sur tous les nouveaux champs
- Pas de spawn_blocking (appels synchrones dans le context Mutex existant)

---

*Specification redigee par Francois -- Dev Back-End, Miyukini AI Studio*
*Protocole MIP v2, P0 Temps 6*
*A transmettre a Denis (Temps 7 - Plan exhaustif) et Maria (Temps 10 - Synthese)*
