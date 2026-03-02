# Plan d'Execution Atomique P2 -- MiyuCloud

**Auteur** : Denis (Chef Dev Senior)
**Date** : 2026-03-01
**Classification MIP** : T5 (Chantier strategique)
**Phase** : P2 -- Plan d'execution atomique
**Statut** : EN ATTENTE VALIDATION

**Documents de reference** :
- `.mip/specs/2026-03-01-miyucloud-spec-technique.md` (Spec P1, Denis)
- `.mip/briefs/2026-03-01-cloud-storage-service.md` (Brief P0, Maria)
- Decisions verrouillees : D1 (P2P), D2 (Surface web restreinte), D3 (Remplacement Jay1Tribu), D4 (Chiffrement renforce)

---

## Table des matieres

1. [Conventions du plan](#1-conventions-du-plan)
2. [Phase A -- MVP Stockage local chiffre](#2-phase-a----mvp-stockage-local-chiffre)
3. [Phase B -- Surface web + Partage](#3-phase-b----surface-web--partage)
4. [Phase C -- Synchronisation P2P](#4-phase-c----synchronisation-p2p)
5. [Diagramme de Gantt global](#5-diagramme-de-gantt-global)
6. [Regles pour Francois et Lise](#6-regles-pour-francois-et-lise)

---

## 1. Conventions du plan

### 1.1 Assignation

| Sigle | Agent | Domaine |
|-------|-------|---------|
| **F** | Francois | Back-end : crate miyucloud, app miyucloud-server, API, DB, crypto, storage, sync |
| **L** | Lise | Front-end : UI Central Dioxus 0.6, assets web statiques |
| **D** | Denis | Integration, revue, tests finaux, gates de validation |

### 1.2 Estimation

| Taille | Duree | Description |
|--------|-------|-------------|
| **S** | < 1 session | Fichier unique, < 100 lignes, logique simple |
| **M** | 1 session | 2-4 fichiers, logique moderee |
| **L** | 2+ sessions | 5+ fichiers ou logique complexe (crypto, sync) |

### 1.3 Cycle TDD par WP

Chaque Work Package suit le cycle :
1. **RED** : ecrire le(s) test(s) qui echouent
2. **GREEN** : implementer le code minimal pour que les tests passent
3. **REFACTOR** : nettoyer, ajouter les annotations MSCM
4. **VERIFY** : `cargo test -p {crate}` + `cargo clippy -p {crate} -- -D warnings`
5. **COMMIT** : un commit atomique par WP

### 1.4 Chemins absolus

Tous les chemins sont relatifs a la racine du workspace : `c:\Users\miyuk\Cursor\Miyukini-COG\`

### 1.5 Pattern de reference

- Structure crate service : cf. `crates/miyumarket/src/` (lib.rs, protocol.rs, manifest.rs, package.rs)
- Enregistrement dans Central : cf. `apps/central/src/state.rs` (OFFICIAL_CATALOG)
- Routage UI service : cf. `apps/central/src/services/mod.rs` (ActiveServiceView)
- Vue service existante : cf. `apps/central/src/services/jay1tribu/mod.rs` (pattern complet)
- Connexion service : Central communique via HTTP localhost (pattern `apps/central/src/llm_client.rs`)

---

## 2. Phase A -- MVP Stockage local chiffre

**Objectif** : L'utilisateur peut naviguer, uploader, downloader des fichiers chiffres via Central et l'API REST.

**Fonctionnalites couvertes** : F01-F05, F10, F28, F37, F44, F46, F49

### Lot A1 -- Fondations crate miyucloud

---

#### WP-A01 : Scaffolding Cargo.toml du crate miyucloud

**Assigne a** : Francois
**Dependances** : Aucune (premier WP)
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/Cargo.toml`

**Fichier a modifier** :
- `Cargo.toml` (workspace root) -- ajouter `"crates/miyucloud"` dans `members`

**Cycle TDD** :
- RED : `cargo check -p miyucloud` doit echouer (crate inexistant)
- GREEN : creer le Cargo.toml avec les dependances specifiees dans la spec P1 section 2.4, creer un `src/lib.rs` vide
- VERIFY : `cargo check -p miyucloud` passe

**Criteres d'acceptation** :
- Le workspace compile avec le nouveau crate
- `unsafe_code = "forbid"` present
- Clippy pedantic configure
- Features `legacy-sqlite` et `kindmother-only` declarees

**Commit** : `feat(miyucloud): scaffold crate miyucloud with Cargo.toml`

---

#### WP-A02 : Types d'erreur + admin_cell + context

**Assigne a** : Francois
**Dependances** : WP-A01
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/src/errors.rs`
- `crates/miyucloud/src/admin_cell.rs`
- `crates/miyucloud/src/context.rs`

**Fichier a modifier** :
- `crates/miyucloud/src/lib.rs` -- declarer les modules publics

**Cycle TDD** :
- RED : ecrire `#[test] fn error_display()` dans errors.rs, test la conversion des variantes en message lisible
- GREEN : implementer `MiyucloudError` avec variantes `Io`, `Db`, `Crypto`, `NotFound`, `PermissionDenied`, `QuotaExceeded`, `InvalidInput`, `Integrity`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- `MiyucloudError` implemente `thiserror::Error` + `Debug` + `Display`
- `MiyucloudAdminCell` suit le pattern `admin_cell.rs` du workspace
- `GovernedContext` struct minimale
- Annotations MSCM presentes dans chaque fichier

**Commit** : `feat(miyucloud): add error types, admin_cell, and context`

---

#### WP-A03 : Types domaine (data/types.rs)

**Assigne a** : Francois
**Dependances** : WP-A02
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/src/data/mod.rs`
- `crates/miyucloud/src/data/types.rs`

**Cycle TDD** :
- RED : ecrire `#[test] fn file_entry_serialize_roundtrip()` et `#[test] fn folder_entry_serialize_roundtrip()` -- tester serialisation/deserialisation JSON de chaque struct
- GREEN : implementer toutes les structs de la spec P1 section 3.2 : `FileEntry`, `FolderEntry`, `ShareLink`, `SharePermission`, `GranteeType`, `PermissionLevel`, `SyncPeer`, `VectorClockEntry`, `SyncConflict`, `ConflictStatus`, `AccessLogEntry`, `AccessAction`, `UserQuota`, `SyncFolder`, `FolderContents`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Tous les types implementent `Debug`, `Clone`, `Serialize`, `Deserialize`
- Les enums ont `#[serde(rename_all = "snake_case")]`
- Types supplementaires de la spec : `SyncStatus`, `StorageStats`, `UploadProgress`, `BreadcrumbItem`, `ViewMode`, `SortField`
- Annotations MSCM

**Commit** : `feat(miyucloud): add domain types`

---

#### WP-A04 : Couche persistance KindMother (kindmother_db.rs)

**Assigne a** : Francois
**Dependances** : WP-A03
**Estimation** : L

**Fichiers a creer** :
- `crates/miyucloud/src/data/kindmother_db.rs`
- `crates/miyucloud/src/data/kindmother_client_db.rs` (stub vide, feature kindmother-only)

**Cycle TDD** :
- RED : ecrire les tests suivants (base in-memory `":memory:"`) :
  - `test_file_create_and_get`
  - `test_file_list_by_parent`
  - `test_file_trash_and_restore`
  - `test_folder_create_and_contents`
  - `test_share_link_create_and_revoke`
  - `test_quota_update`
- GREEN : implementer `MiyucloudDb` avec toutes les methodes CRUD listees dans la spec P1 section 3.3
  - Schema SQLite cree via `CREATE TABLE IF NOT EXISTS` dans un `fn init_schema(&self)`
  - Le schema complet est dans la spec P1 section 3.1
- VERIFY : `cargo test -p miyucloud -- --nocapture`

**Criteres d'acceptation** :
- Toutes les tables de la spec sont creees : `cloud_files`, `cloud_folders`, `cloud_share_links`, `cloud_share_permissions`, `cloud_sync_peers`, `cloud_vector_clocks`, `cloud_sync_conflicts`, `cloud_access_log`, `cloud_quotas`, `cloud_sync_folders`, `cloud_jay1tribu_migrations`, `cloud_crypto_config`
- Index crees sur les colonnes specifiees
- Toutes les methodes CRUD de la section 3.3 implementees
- Pas de `unwrap()` en dehors des tests
- `DbError` integre dans `MiyucloudError`

**Commit** : `feat(miyucloud): implement KindMother persistence layer`

---

### Lot A2 -- Stockage et chiffrement

---

#### WP-A05 : Module storage -- trait + local_fs

**Assigne a** : Francois
**Dependances** : WP-A02
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/storage/mod.rs`
- `crates/miyucloud/src/storage/local_fs.rs`

**Cycle TDD** :
- RED :
  - `test_write_and_read_file` -- ecrire un fichier via `StorageBackend`, le relire, verifier le contenu
  - `test_delete_file` -- ecrire puis supprimer, verifier que la lecture echoue
  - `test_file_exists` -- tester la methode `exists`
- GREEN : implementer `StorageBackend` trait avec methodes `write`, `read`, `delete`, `exists`, `list_chunks`, et `LocalFsStorage` qui implemente ce trait
  - Structure de stockage : `{storage_root}/chunks/{file_id_prefix_2chars}/{file_id}/chunk_NNNN.enc`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Trait `StorageBackend` avec methodes async-compatible (ou sync pour MVP)
- `LocalFsStorage::new(root_path: PathBuf)` cree l'arborescence si necessaire
- Les tests utilisent un repertoire temporaire (`tempdir`)
- Gestion des erreurs IO propagee via `MiyucloudError::Io`

**Commit** : `feat(miyucloud): add storage trait and local filesystem backend`

---

#### WP-A06 : Module storage -- chunking

**Assigne a** : Francois
**Dependances** : WP-A05
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/storage/chunking.rs`

**Cycle TDD** :
- RED :
  - `test_chunk_small_file` -- un fichier de 100 bytes produit 1 chunk
  - `test_chunk_large_file` -- un fichier de 600 KB (> 256 KB) produit 3 chunks
  - `test_reassemble_chunks` -- chunker puis reassembler, verifier identique a l'original
- GREEN : implementer `Chunker` avec `chunk_size: usize` (defaut 256 * 1024), methodes `split(data: &[u8]) -> Vec<Vec<u8>>` et `reassemble(chunks: &[Vec<u8>]) -> Vec<u8>`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Chunk size configurable (defaut 256 KB)
- Le dernier chunk peut etre plus petit
- Round-trip : split puis reassemble retourne les donnees originales bit pour bit

**Commit** : `feat(miyucloud): add file chunking`

---

#### WP-A07 : Module storage -- integrity (checksums SHA-256)

**Assigne a** : Francois
**Dependances** : WP-A05
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/src/storage/integrity.rs`

**Cycle TDD** :
- RED :
  - `test_sha256_known_value` -- hash d'une chaine connue, comparer au hash attendu
  - `test_verify_integrity_pass` -- hash puis verifier, doit passer
  - `test_verify_integrity_fail` -- hash puis modifier les donnees, verifier echoue
- GREEN : implementer `compute_sha256(data: &[u8]) -> String` (hex), `verify_sha256(data: &[u8], expected: &str) -> Result<(), MiyucloudError>`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Utilise `sha2::Sha256`
- Hash retourne en hexadecimal lowercase
- Erreur `MiyucloudError::Integrity` si la verification echoue

**Commit** : `feat(miyucloud): add SHA-256 integrity verification`

---

#### WP-A08 : Module crypto -- gestion des cles (keys.rs)

**Assigne a** : Francois
**Dependances** : WP-A02
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/crypto/mod.rs`
- `crates/miyucloud/src/crypto/keys.rs`

**Cycle TDD** :
- RED :
  - `test_derive_master_key_deterministic` -- meme passphrase + meme sel = meme cle
  - `test_derive_master_key_different_passphrase` -- passphrases differentes = cles differentes
  - `test_derive_file_key` -- deriver une cle fichier depuis la master key + file_id, verifier deterministe
  - `test_generate_salt` -- le sel est de 16 bytes
- GREEN : implementer `KeyManager` avec :
  - `generate_salt() -> [u8; 16]` (via `rand::OsRng`)
  - `derive_master_key(passphrase: &str, salt: &[u8]) -> [u8; 32]` (Argon2id, memory=64MB, iterations=3, parallelism=4)
  - `derive_file_key(master_key: &[u8; 32], file_id: &str) -> [u8; 32]` (HKDF-SHA256)
  - `verify_passphrase(master_key: &[u8; 32], canary_ciphertext: &[u8]) -> bool`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- La master key n'est JAMAIS ecrite sur disque (invariant documente)
- Les parametres Argon2id sont ceux de la spec P1 section 6.2
- Le contexte HKDF est `"miyucloud-file-{file_id}"`
- Tests passent sur la CI (attention : Argon2 avec 64MB peut etre lent en mode debug, prevoir un flag `#[cfg(not(debug_assertions))]` pour les parametres complets, parametres reduits en debug)

**Commit** : `feat(miyucloud): add key derivation with Argon2id + HKDF`

---

#### WP-A09 : Module crypto -- chiffrement at-rest (at_rest.rs)

**Assigne a** : Francois
**Dependances** : WP-A08
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/crypto/at_rest.rs`

**Cycle TDD** :
- RED :
  - `test_encrypt_decrypt_roundtrip` -- chiffrer des donnees, dechiffrer, verifier identiques
  - `test_encrypt_produces_different_ciphertext` -- deux chiffrements du meme plaintext avec nonces differents produisent des ciphertexts differents
  - `test_decrypt_wrong_key_fails` -- dechiffrer avec une mauvaise cle retourne une erreur
  - `test_decrypt_corrupted_data_fails` -- modifier le ciphertext, dechiffrer echoue
- GREEN : implementer :
  - `encrypt_chunk(key: &[u8; 32], plaintext: &[u8]) -> Result<EncryptedChunk, MiyucloudError>`
  - `decrypt_chunk(key: &[u8; 32], encrypted: &EncryptedChunk) -> Result<Vec<u8>, MiyucloudError>`
  - `EncryptedChunk { nonce: [u8; 12], ciphertext: Vec<u8> }` (le tag est inclus dans le ciphertext par chacha20poly1305)
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Utilise `chacha20poly1305::ChaCha20Poly1305`
- Nonce genere via `rand::OsRng` (12 bytes)
- Erreur `MiyucloudError::Crypto` en cas d'echec
- Pas de donnees corrompues lues silencieusement (invariant)

**Commit** : `feat(miyucloud): add ChaCha20-Poly1305 at-rest encryption`

---

#### WP-A10 : Module lib.rs -- re-exports + integration storage+crypto

**Assigne a** : Francois
**Dependances** : WP-A04, WP-A06, WP-A07, WP-A09
**Estimation** : S

**Fichier a modifier** :
- `crates/miyucloud/src/lib.rs` -- declarer et re-exporter tous les modules publics

**Cycle TDD** :
- RED : ecrire un test d'integration dans `crates/miyucloud/tests/integration_storage_crypto.rs` :
  - `test_full_write_flow` : prendre des donnees brutes, chunker, chiffrer chaque chunk, ecrire via storage, lire, dechiffrer, reassembler, verifier SHA-256 identique
- GREEN : s'assurer que tous les modules sont correctement exportes et que le flux complet fonctionne
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Le test d'integration couvre le flux complet upload : `donnees -> chunk -> chiffrer -> ecrire -> lire -> dechiffrer -> reassembler -> verifier`
- `lib.rs` re-exporte proprement : `pub mod data`, `pub mod storage`, `pub mod crypto`, `pub mod auth`, `pub mod domain`, `pub mod errors`, `pub mod admin_cell`, `pub mod context`

**Commit** : `feat(miyucloud): wire lib.rs re-exports and add integration test`

---

### Lot A3 -- Logique domaine + auth

---

#### WP-A11 : Module auth -- permissions

**Assigne a** : Francois
**Dependances** : WP-A03
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/src/auth/mod.rs`
- `crates/miyucloud/src/auth/permissions.rs`

**Cycle TDD** :
- RED :
  - `test_owner_has_full_access` -- un owner peut lire/ecrire/supprimer
  - `test_shared_read_cannot_write` -- un grantee read-only ne peut pas ecrire
  - `test_no_permission_denied` -- un utilisateur sans permission recoit PermissionDenied
- GREEN : implementer `verify_access(owner_id: &str, requester_id: &str, permissions: &[SharePermission], action: AccessAction) -> Result<(), MiyucloudError>`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Le proprietaire a toujours tous les droits
- Les permissions sont verifiees hierarchiquement (dossier parent -> fichier)
- Erreur `MiyucloudError::PermissionDenied` explicite

**Commit** : `feat(miyucloud): add permission verification`

---

#### WP-A12 : Module domain -- file_ops (CRUD fichiers/dossiers)

**Assigne a** : Francois
**Dependances** : WP-A04, WP-A10, WP-A11
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/domain/mod.rs`
- `crates/miyucloud/src/domain/file_ops.rs`

**Cycle TDD** :
- RED (tests sur base in-memory + stockage temporaire) :
  - `test_upload_file_creates_entry_and_stores_chunks`
  - `test_download_file_returns_original_data`
  - `test_create_folder`
  - `test_rename_file`
  - `test_move_file_to_folder`
  - `test_delete_file_trashes_it`
  - `test_list_folder_contents`
- GREEN : implementer `FileOps` struct avec methodes :
  - `upload_file(db, storage, crypto, owner_id, parent_id, name, data) -> Result<FileEntry>`
  - `download_file(db, storage, crypto, file_id) -> Result<Vec<u8>>`
  - `create_folder(db, owner_id, parent_id, name) -> Result<FolderEntry>`
  - `rename(db, id, new_name) -> Result<()>`
  - `move_to(db, id, new_parent_id) -> Result<()>`
  - `delete(db, storage, id) -> Result<()>` (soft delete -> corbeille)
  - `list_contents(db, folder_id, owner_id) -> Result<FolderContents>`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Upload : chunking -> chiffrement at-rest -> ecriture storage -> insertion DB -> verification SHA-256
- Download : lecture DB -> lecture storage -> dechiffrement -> reassemblage -> verification SHA-256
- Tous les timestamps en ISO 8601
- Tous les IDs en UUID v4
- Le chiffrement est TOUJOURS applique (pas de bypass)

**Commit** : `feat(miyucloud): implement file operations (upload, download, CRUD)`

---

#### WP-A13 : Module domain -- trash (corbeille)

**Assigne a** : Francois
**Dependances** : WP-A12
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/src/domain/trash.rs`

**Cycle TDD** :
- RED :
  - `test_trash_file_sets_is_trashed`
  - `test_restore_file_clears_is_trashed`
  - `test_purge_file_deletes_permanently`
  - `test_purge_deletes_storage_chunks`
  - `test_list_trashed_files`
- GREEN : implementer `TrashOps` avec :
  - `trash(db, id)` -- met `is_trashed = 1`, `trashed_at = now()`
  - `restore(db, id)` -- met `is_trashed = 0`, `trashed_at = NULL`
  - `purge(db, storage, id)` -- supprime de la DB et du storage (overwrite chunks avec zeros puis delete)
  - `list_trashed(db, owner_id) -> Result<FolderContents>` -- fichiers et dossiers en corbeille
  - `empty_trash(db, storage, owner_id)` -- purge tous les elements en corbeille
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- La purge ecrase les chunks avec des zeros avant suppression (securite RGPD)
- Les dossiers en corbeille cachent recursivement leur contenu des listings normaux

**Commit** : `feat(miyucloud): implement trash with secure purge`

---

### Lot A4 -- App miyucloud-server (API REST)

---

#### WP-A14 : Scaffolding app miyucloud-server

**Assigne a** : Francois
**Dependances** : WP-A01
**Estimation** : S

**Fichiers a creer** :
- `apps/miyucloud/Cargo.toml`
- `apps/miyucloud/src/main.rs`
- `apps/miyucloud/src/config.rs`

**Fichier a modifier** :
- `Cargo.toml` (workspace root) -- ajouter `"apps/miyucloud"` dans `members`

**Cycle TDD** :
- RED : `cargo check -p miyucloud-server` doit echouer
- GREEN : creer le Cargo.toml (spec P1 section 2.5), `main.rs` minimal (parse config, lancement axum avec une route `/health`), `config.rs` (struct `MiyucloudConfig` avec port, storage_path, etc.)
- VERIFY : `cargo check -p miyucloud-server`

**Criteres d'acceptation** :
- Le serveur demarre et repond `200` sur `GET /health`
- La configuration est lue depuis des variables d'environnement ou des valeurs par defaut
- Port API interne par defaut : 11440
- `unsafe_code = "forbid"` present
- Clippy pedantic configure

**Commit** : `feat(miyucloud-server): scaffold app with health endpoint`

---

#### WP-A15 : API auth interne

**Assigne a** : Francois
**Dependances** : WP-A14
**Estimation** : S

**Fichiers a creer** :
- `apps/miyucloud/src/api/mod.rs`
- `apps/miyucloud/src/api/auth.rs`

**Cycle TDD** :
- RED :
  - `test_request_without_token_returns_401`
  - `test_request_with_valid_token_passes`
  - `test_request_with_invalid_token_returns_401`
- GREEN : implementer middleware axum `verify_cog_token` qui verifie le header `X-COG-Token` contre un token configure. Implementer `api_router()` qui inclut le middleware.
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Le token est genere au premier lancement et stocke dans le repertoire de configuration
- Toutes les routes `/api/*` exigent le token (sauf `/health`)
- Format d'erreur JSON standard (spec P1 section 4.2)

**Commit** : `feat(miyucloud-server): add internal API auth middleware`

---

#### WP-A16 : API fichiers (CRUD)

**Assigne a** : Francois
**Dependances** : WP-A12, WP-A15
**Estimation** : M

**Fichiers a creer** :
- `apps/miyucloud/src/api/files.rs`
- `apps/miyucloud/src/api/folders.rs`

**Fichier a modifier** :
- `apps/miyucloud/src/api/mod.rs` -- ajouter les routes
- `apps/miyucloud/src/main.rs` -- brancher le router complet

**Cycle TDD** :
- RED (tests d'integration HTTP avec `axum::test`) :
  - `test_upload_file_returns_201`
  - `test_list_files_returns_folder_contents`
  - `test_download_file_returns_stream`
  - `test_create_folder_returns_201`
  - `test_rename_file_returns_200`
  - `test_delete_file_returns_trashed`
- GREEN : implementer les handlers axum pour toutes les routes de la spec P1 section 4.1.1 et 4.1.2
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Upload via `multipart/form-data` (axum `Multipart` extractor)
- Download via streaming (axum `Body::from_stream` ou chunked response)
- Codes HTTP conformes a la spec P1 section 4.2
- Erreurs au format JSON standard

**Commit** : `feat(miyucloud-server): implement file and folder REST API`

---

#### WP-A17 : API corbeille

**Assigne a** : Francois
**Dependances** : WP-A13, WP-A16
**Estimation** : S

**Fichiers a creer** :
- `apps/miyucloud/src/api/trash.rs`

**Fichier a modifier** :
- `apps/miyucloud/src/api/mod.rs` -- ajouter les routes trash

**Cycle TDD** :
- RED :
  - `test_list_trash_returns_trashed_items`
  - `test_restore_from_trash`
  - `test_purge_from_trash`
  - `test_empty_trash`
- GREEN : implementer les handlers pour les routes de la spec P1 section 4.1.4
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- `GET /api/trash` retourne les fichiers et dossiers en corbeille
- `POST /api/trash/{id}/restore` restaure l'element
- `DELETE /api/trash/{id}` purge definitivement (avec overwrite zeros)
- `DELETE /api/trash` vide la corbeille

**Commit** : `feat(miyucloud-server): implement trash API endpoints`

---

#### WP-A18 : Initialisation passphrase et demarrage serveur complet

**Assigne a** : Francois
**Dependances** : WP-A08, WP-A16
**Estimation** : M

**Fichier a modifier** :
- `apps/miyucloud/src/main.rs` -- integrer l'initialisation crypto au demarrage
- `apps/miyucloud/src/config.rs` -- ajouter les champs crypto

**Cycle TDD** :
- RED :
  - `test_first_start_generates_salt_and_stores_in_db`
  - `test_subsequent_start_reads_salt_from_db`
  - `test_wrong_passphrase_rejects`
- GREEN : au demarrage du serveur :
  1. Ouvrir la DB (init schema si necessaire)
  2. Verifier si un sel Argon2 existe dans `cloud_crypto_config`
  3. Si non : generer le sel, demander la passphrase (variable d'env `MIYUCLOUD_PASSPHRASE` pour le MVP), creer le canary
  4. Si oui : demander la passphrase, deriver la master key, verifier le canary
  5. Stocker la master key en memoire dans un `Arc<KeyManager>` partage avec les handlers
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- La passphrase est lue depuis `MIYUCLOUD_PASSPHRASE` (variable d'env) pour le MVP
- Le canary est un petit bloc de donnees connues chiffre avec la master key
- Si le canary echoue, le serveur refuse de demarrer
- La master key est dans un `Arc` et jamais serialisee

**Commit** : `feat(miyucloud-server): add passphrase initialization and crypto bootstrap`

---

### Lot A5 -- Integration Central (UI)

---

#### WP-A19 : Enregistrement MiyuCloud dans le catalogue Central

**Assigne a** : Lise
**Dependances** : WP-A14 (le serveur existe)
**Estimation** : S

**Fichier a modifier** :
- `apps/central/src/state.rs` -- ajouter `miyucloud` dans `OFFICIAL_CATALOG`

**Cycle TDD** :
- RED : verifier que `ServiceRegistry::all_services` ne contient pas `miyucloud`
- GREEN : ajouter l'entree `ServiceMeta { id: "miyucloud", name: "MiyuCloud", description: "Cloud prive -- fichiers, sync, partage securise", icon: "\u{2601}", service_type: ServiceType::InterCog, is_favorite: true }`
- VERIFY : `cargo build -p miyukini-central`

**Criteres d'acceptation** :
- MiyuCloud apparait dans le Salon et la Bibliotheque de Central
- Le type est `InterCog` (P2P + surface web)
- Marque comme favori

**Commit** : `feat(central): register MiyuCloud in service catalog`

---

#### WP-A20 : State management MiyuCloud (state.rs)

**Assigne a** : Lise
**Dependances** : WP-A03 (types disponibles)
**Estimation** : S

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/state.rs`

**Cycle TDD** :
- RED : `cargo check` doit echouer sur le module inexistant
- GREEN : implementer `MiyuCloudState` tel que decrit dans la spec P1 section 9.3, avec `ViewMode`, `SortField`, `UploadProgress`, `BreadcrumbItem`. Implementer `MiyuCloudState::default()`.
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- State complet avec tous les champs de la spec
- `Default` implemente (racine, pas de fichier selectionne, mode grille, tri par nom)
- Extraire les styles conditionnels dans des variables avant RSX (piege Dioxus)

**Commit** : `feat(central/miyucloud): add MiyuCloudState`

---

#### WP-A21 : Client HTTP MiyuCloud

**Assigne a** : Lise
**Dependances** : WP-A16 (API disponible)
**Estimation** : M

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/client.rs`

**Cycle TDD** :
- RED : ecrire des tests unitaires avec un mock HTTP (ou tests ignores annotes `#[ignore]` car necessitent le serveur)
  - `test_list_files_parses_response`
  - `test_upload_sends_multipart`
- GREEN : implementer `MiyuCloudClient` (spec P1 section 9.5) avec :
  - `new(port: u16, cog_token: &str)`
  - `list_files(parent_id: Option<&str>) -> Result<FolderContents>`
  - `upload_file(parent_id: Option<&str>, file_path: &Path) -> Result<FileEntry>`
  - `download_file(file_id: &str) -> Result<Vec<u8>>`
  - `create_folder(name: &str, parent_id: Option<&str>) -> Result<FolderEntry>`
  - `rename_file(id: &str, new_name: &str) -> Result<FileEntry>`
  - `delete_file(id: &str) -> Result<()>`
  - `list_trash() -> Result<FolderContents>`
  - `restore_from_trash(id: &str) -> Result<()>`
  - `purge_from_trash(id: &str) -> Result<()>`
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Utilise `reqwest::Client`
- Ajoute le header `X-COG-Token` a chaque requete
- Gestion des erreurs : parse le JSON d'erreur du serveur
- Base URL configurable (defaut `http://127.0.0.1:11440`)

**Commit** : `feat(central/miyucloud): add HTTP client for miyucloud-server`

---

#### WP-A22 : Composants reutilisables (components.rs)

**Assigne a** : Lise
**Dependances** : WP-A20
**Estimation** : S

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/components.rs`

**Cycle TDD** :
- Pas de test unitaire pour les composants RSX (verification visuelle)
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Composant `Breadcrumb` : affiche le chemin du dossier courant (Racine > Photos > 2026)
- Composant `FileIcon` : icone en fonction du mime_type (dossier, image, pdf, video, audio, texte, generique)
- Composant `SizeLabel` : affiche la taille formatee (KB, MB, GB)
- Tous les styles extraits en variables avant RSX

**Commit** : `feat(central/miyucloud): add reusable UI components`

---

#### WP-A23 : Sidebar (arborescence dossiers)

**Assigne a** : Lise
**Dependances** : WP-A21, WP-A22
**Estimation** : M

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/sidebar.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Arborescence des dossiers avec expansion/reduction
- Section "Partages" (vide en Phase A, placeholder)
- Section "Corbeille"
- Clic sur un dossier change `current_folder_id` dans le state
- Style coherent avec les autres sidebars (cf. JayKonta, JayKoa)

**Commit** : `feat(central/miyucloud): add folder tree sidebar`

---

#### WP-A24 : Explorer (vue principale fichiers)

**Assigne a** : Lise
**Dependances** : WP-A21, WP-A22, WP-A23
**Estimation** : M

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/explorer.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Mode grille et mode liste (toggle)
- Tri par nom, taille, date, type
- Affiche les fichiers et sous-dossiers du dossier courant
- Double-clic sur un dossier pour naviguer dedans
- Clic sur un fichier le selectionne (affiche le panel detail)
- Breadcrumb en haut avec navigation
- Boutons "Nouveau dossier" et "Upload"

**Commit** : `feat(central/miyucloud): add file explorer view`

---

#### WP-A25 : Upload (composant televersement)

**Assigne a** : Lise
**Dependances** : WP-A21, WP-A24
**Estimation** : M

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/upload.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Bouton "Upload" ouvre un selecteur de fichiers natif (Dioxus `use_file_dialog` ou equivalent)
- Barre de progression pendant l'upload
- Notification de succes/erreur
- Rafraichissement automatique de l'explorateur apres upload

**Commit** : `feat(central/miyucloud): add file upload component`

---

#### WP-A26 : File detail (panel detail fichier)

**Assigne a** : Lise
**Dependances** : WP-A21, WP-A22
**Estimation** : S

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/file_detail.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Affiche : nom, taille, type MIME, date creation, date modification
- Boutons : Telecharger, Supprimer, Renommer
- Placeholder pour le bouton "Partager" (Phase B)
- S'affiche a droite de l'explorateur quand un fichier est selectionne

**Commit** : `feat(central/miyucloud): add file detail panel`

---

#### WP-A27 : MiyuCloudView (point d'entree + routage)

**Assigne a** : Lise
**Dependances** : WP-A23, WP-A24, WP-A25, WP-A26
**Estimation** : M

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/mod.rs`

**Fichier a modifier** :
- `apps/central/src/services/mod.rs` -- ajouter `pub mod miyucloud;` et la route dans `ActiveServiceView`

**Cycle TDD** :
- Verification visuelle : lancer Central, ouvrir MiyuCloud depuis le Salon
- VERIFY : `cargo build -p miyukini-central`

**Criteres d'acceptation** :
- Layout 2 panneaux : sidebar (gauche, 220px) + zone principale (droite, flex)
- Initialise `MiyuCloudState` en context Dioxus Signal
- Instancie le `MiyuCloudClient` au montage
- Charge le contenu du dossier racine au demarrage
- Le routage dans `ActiveServiceView` dirige `Some("miyucloud")` vers `miyucloud::MiyuCloudView`

**Commit** : `feat(central/miyucloud): add MiyuCloudView entry point and routing`

---

### Lot A6 -- Depreciation Jay1Tribu + Finition

---

#### WP-A28 : Avertissement depreciation Jay1Tribu

**Assigne a** : Francois
**Dependances** : Aucune (peut commencer en parallele)
**Estimation** : S

**Fichier a modifier** :
- `crates/jay1tribu/src/` -- ajouter `#[deprecated(note = "send_file sera remplace par MiyuCloud. Utilisez MiyuCloud pour le partage de fichiers.")]` sur la fonction `send_file` (ou equivalent dans le crate)

**Cycle TDD** :
- RED : `cargo test -p jay1tribu` doit montrer un warning depreciation
- GREEN : ajouter l'annotation `#[deprecated]`
- VERIFY : `cargo test -p jay1tribu` + verification que le warning apparait

**Criteres d'acceptation** :
- La fonction `send_file` (et `check_can_transfer_file` si elle existe) portent l'annotation deprecated
- Le message de depreciation mentionne MiyuCloud
- Aucune fonctionnalite cassee dans Jay1Tribu

**Commit** : `chore(jay1tribu): deprecate send_file in favor of MiyuCloud`

---

### Gate Phase A -- Validation Denis

**Commande** :
```bash
cargo test --workspace
cargo clippy --workspace -- -D warnings
cargo build --workspace
```

**Verification fonctionnelle** :
1. Lancer `miyucloud-server` avec une passphrase de test
2. Via curl ou l'API : creer un dossier, uploader un fichier, le telecharger, le mettre en corbeille, le restaurer
3. Lancer Central, ouvrir MiyuCloud, naviguer, uploader, telecharger

**Criteres de passage** :
- [ ] `cargo test --workspace` : 0 echec
- [ ] `cargo clippy --workspace -- -D warnings` : 0 warning
- [ ] Upload + download via API : le fichier retourne est bit-a-bit identique a l'original
- [ ] Le fichier sur disque est chiffre (pas lisible directement)
- [ ] L'UI Central affiche correctement les fichiers et dossiers
- [ ] Les annotations MSCM sont presentes dans tous les fichiers du crate miyucloud
- [ ] Jay1Tribu compile avec le warning de depreciation sur `send_file`

---

### Diagramme Gantt Phase A

```
Semaine 1-2 : Fondations (Francois seul)
================================================================

F: WP-A01 ─> WP-A02 ─> WP-A03 ─┐
                                  ├─> WP-A04 (DB, L)
F: WP-A01 ─> WP-A02 ─> WP-A05 ─> WP-A06 ─> WP-A07
F: WP-A01 ─> WP-A02 ─> WP-A08 ─> WP-A09
F: WP-A28 (depreciation Jay1Tribu, independant)

Point de sync : WP-A10 (necessite A04 + A06 + A07 + A09)

Semaine 2-3 : Domaine + API (Francois) || UI (Lise, debut)
================================================================

F: WP-A11 ─> WP-A12 ─> WP-A13
F: WP-A14 ─> WP-A15 ─> WP-A16 ─> WP-A17 ─> WP-A18

L: WP-A19 (catalogue, des que A14 pret)
L: WP-A20 (state, des que A03 pret)
L: WP-A21 (client HTTP, des que A16 pret)

Semaine 3-4 : UI (Lise) + Corrections (Francois)
================================================================

L: WP-A22 ─> WP-A23 ─> WP-A24 ─> WP-A25 ─> WP-A26 ─> WP-A27

D: Gate Phase A (apres WP-A27)

Parallelisme effectif :
  F travaille sur lots A1-A4 pendant que L prepare les types UI (A20)
  Des que F livre l'API (WP-A16), L peut commencer le client (WP-A21)
  L rattrape avec les composants UI (A22-A27) pendant que F finit A17-A18
```

---

## 3. Phase B -- Surface web + Partage

**Objectif** : Partager des fichiers avec des utilisateurs hors COG via surface web securisee. Partage interne Tribu.

**Fonctionnalites couvertes** : F17-F20, F22-F26, F31-F32, F36, F38-F43, F48

**Pre-requis** : Gate Phase A validee.

### Lot B1 -- Extensions crate (partage + web tokens)

---

#### WP-B01 : Module auth -- web_tokens (tokens temporaires partage)

**Assigne a** : Francois
**Dependances** : Phase A completee
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/auth/web_tokens.rs`

**Cycle TDD** :
- RED :
  - `test_generate_token_is_32_bytes_hex` -- le token fait 64 caracteres hex
  - `test_validate_token_valid` -- token valide, non expire, non revoque
  - `test_validate_token_expired` -- token expire retourne erreur
  - `test_validate_token_revoked` -- token revoque retourne erreur
  - `test_validate_password_correct`
  - `test_validate_password_incorrect`
  - `test_validate_max_downloads_exceeded`
- GREEN : implementer :
  - `generate_share_token() -> String` (32 bytes via `rand::OsRng`, encode hex)
  - `hash_password(password: &str) -> String` (bcrypt ou argon2)
  - `verify_password(password: &str, hash: &str) -> bool`
  - `validate_share_link(link: &ShareLink, password: Option<&str>) -> Result<(), MiyucloudError>` -- verifie expiration, revocation, max downloads, mot de passe
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Tokens non predictibles (256 bits d'entropie)
- Expiration toujours verifiee (JAMAIS de lien sans expiration)
- Les mots de passe sont hashes, jamais stockes en clair

**Commit** : `feat(miyucloud): add web share tokens with expiration and password`

---

#### WP-B02 : Module domain -- external_share (liens de partage web)

**Assigne a** : Francois
**Dependances** : WP-B01
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/domain/external_share.rs`

**Cycle TDD** :
- RED :
  - `test_create_share_link_with_expiration`
  - `test_create_share_link_with_password`
  - `test_revoke_share_link`
  - `test_access_share_link_increments_counter`
  - `test_access_revoked_link_fails`
  - `test_access_expired_link_fails`
- GREEN : implementer `ExternalShareOps` :
  - `create_link(db, file_id?, folder_id?, creator_id, password?, expires_in_hours, max_downloads?) -> Result<ShareLink>`
  - `revoke_link(db, link_id) -> Result<()>`
  - `access_link(db, token, password?) -> Result<(ShareLink, FileEntry)>` -- validation complete + increment download_count
  - `list_links(db, creator_id) -> Result<Vec<ShareLink>>`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- L'expiration est obligatoire (min 1h, max 30 jours configurable)
- La revocation est instantanee (un flag, pas de suppression)
- Le compteur de telechargements est incremente atomiquement

**Commit** : `feat(miyucloud): implement external share link management`

---

#### WP-B03 : Module domain -- sharing (partage interne Tribu)

**Assigne a** : Francois
**Dependances** : WP-A11
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/domain/sharing.rs`

**Cycle TDD** :
- RED :
  - `test_share_file_with_profile`
  - `test_share_folder_with_tribe`
  - `test_shared_user_can_read`
  - `test_shared_user_cannot_write_if_read_only`
  - `test_unshare_removes_permission`
- GREEN : implementer `SharingOps` :
  - `share(db, file_or_folder_id, grantee_id, grantee_type, permission) -> Result<SharePermission>`
  - `unshare(db, permission_id) -> Result<()>`
  - `list_shared_with_me(db, profile_id) -> Result<Vec<(SharePermission, FileEntry or FolderEntry)>>`
  - `list_shares_for_resource(db, resource_id) -> Result<Vec<SharePermission>>`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Partage avec un profil ou une tribu entiere
- Permissions read-only ou read-write
- Le partage d'un dossier donne acces a tout son contenu recursivement

**Commit** : `feat(miyucloud): implement internal sharing (tribe + profile)`

---

#### WP-B04 : Module domain -- quota

**Assigne a** : Francois
**Dependances** : WP-A04
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/src/domain/quota.rs`

**Cycle TDD** :
- RED :
  - `test_quota_check_within_limit`
  - `test_quota_check_exceeds_limit`
  - `test_quota_unlimited_always_passes`
  - `test_update_used_bytes`
- GREEN : implementer `QuotaOps` :
  - `check_quota(db, owner_id, additional_bytes) -> Result<(), MiyucloudError>` -- retourne `QuotaExceeded` si depasse
  - `get_usage(db, owner_id) -> Result<UserQuota>`
  - `set_max(db, owner_id, max_bytes) -> Result<()>`
  - Integrer `check_quota` dans `FileOps::upload_file` (bloquer l'upload si quota depasse)
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Quota 0 = illimite
- Le quota est verifie AVANT l'upload (pas apres)
- `used_bytes` est mis a jour apres chaque upload et chaque purge

**Commit** : `feat(miyucloud): add quota management`

---

#### WP-B05 : Module crypto -- streaming (dechiffrement streaming)

**Assigne a** : Francois
**Dependances** : WP-A09
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/crypto/streaming.rs`

**Cycle TDD** :
- RED :
  - `test_streaming_decrypt_matches_bulk_decrypt` -- le resultat streaming est identique au dechiffrement complet
  - `test_streaming_decrypt_chunk_by_chunk` -- chaque chunk est dechiffre independamment
  - `test_streaming_decrypt_corrupted_chunk_fails`
- GREEN : implementer `StreamingDecryptor` :
  - Lit les chunks un par un depuis le storage
  - Dechiffre chaque chunk individuellement
  - Retourne un iterateur/stream de `Vec<u8>` (chunks clairs)
  - Ne charge JAMAIS le fichier entier en memoire
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Memory footprint constant quel que soit la taille du fichier (un seul chunk en memoire a la fois)
- Si un chunk est corrompu, l'erreur est signalee immediatement (pas de continuation silencieuse)

**Commit** : `feat(miyucloud): add streaming decryption for web sharing`

---

#### WP-B06 : Module domain -- jay1tribu_migration

**Assigne a** : Francois
**Dependances** : WP-A12
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/domain/jay1tribu_migration.rs`

**Fichier a modifier** :
- `crates/miyucloud/Cargo.toml` -- ajouter dependance optionnelle vers `jay1tribu`

**Cycle TDD** :
- RED :
  - `test_migrate_attachment_creates_file_entry`
  - `test_migrate_already_migrated_skips`
  - `test_migrate_missing_source_reports_error`
  - `test_migration_report_counts`
- GREEN : implementer `migrate_jay1tribu_attachments` tel que decrit dans la spec P1 section 8.2
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Migration non-destructive (les originaux dans Jay1Tribu ne sont PAS supprimes)
- La correspondance est enregistree dans `cloud_jay1tribu_migrations` (idempotence)
- Les fichiers migres sont chiffres at-rest dans MiyuCloud
- Le rapport de migration liste les fichiers migres, ignores et en erreur

**Commit** : `feat(miyucloud): implement Jay1Tribu attachment migration`

---

### Lot B2 -- Surface web (app miyucloud-server)

---

#### WP-B07 : API shares (endpoints partage)

**Assigne a** : Francois
**Dependances** : WP-B02, WP-B03
**Estimation** : M

**Fichiers a creer** :
- `apps/miyucloud/src/api/shares.rs`

**Fichier a modifier** :
- `apps/miyucloud/src/api/mod.rs` -- ajouter les routes

**Cycle TDD** :
- RED :
  - `test_create_share_link_returns_201`
  - `test_list_share_links`
  - `test_revoke_share_link`
  - `test_create_share_permission`
  - `test_list_permissions`
  - `test_delete_permission`
- GREEN : implementer les handlers pour les routes de la spec P1 section 4.1.3
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Routes conformes a la spec P1 section 4.1.3
- La creation de lien retourne le token complet (une seule fois, jamais reliste en clair)

**Commit** : `feat(miyucloud-server): implement share API endpoints`

---

#### WP-B08 : Surface web -- sandbox middleware

**Assigne a** : Francois
**Dependances** : WP-B07
**Estimation** : M

**Fichiers a creer** :
- `apps/miyucloud/src/web_surface/mod.rs`
- `apps/miyucloud/src/web_surface/sandbox.rs`

**Cycle TDD** :
- RED :
  - `test_sandbox_blocks_access_to_non_shared_file`
  - `test_sandbox_allows_access_to_shared_file`
  - `test_sandbox_blocks_api_routes`
- GREEN : implementer `SandboxedStore` -- un wrapper autour du storage et de la DB qui ne peut acceder qu'aux fichiers explicitement partages (via `cloud_share_links`). Aucune route `/api/*` n'est accessible depuis la surface web.
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Le `SandboxedStore` ne peut lire QUE les fichiers references par un `ShareLink` actif
- Tentative d'acces a un fichier non partage retourne 404 (pas 403, pour ne rien reveler)
- Aucun listing de fichiers possible

**Commit** : `feat(miyucloud-server): add sandboxed store for web surface`

---

#### WP-B09 : Surface web -- rate limiter

**Assigne a** : Francois
**Dependances** : WP-B08
**Estimation** : S

**Fichiers a creer** :
- `apps/miyucloud/src/web_surface/rate_limiter.rs`

**Cycle TDD** :
- RED :
  - `test_rate_limit_allows_under_threshold`
  - `test_rate_limit_blocks_over_threshold`
- GREEN : configurer `tower_governor` avec :
  - 10 requetes/minute par IP pour `/share/*`
  - 3 tentatives de mot de passe/minute par IP
  - Retourner `429 Too Many Requests` avec header `Retry-After`
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Rate limiting par IP
- Parametres configurables

**Commit** : `feat(miyucloud-server): add rate limiting for web surface`

---

#### WP-B10 : Surface web -- access log

**Assigne a** : Francois
**Dependances** : WP-B08
**Estimation** : S

**Fichiers a creer** :
- `apps/miyucloud/src/web_surface/access_log.rs`

**Cycle TDD** :
- RED :
  - `test_log_access_creates_entry`
  - `test_ip_is_hashed` -- l'IP stockee n'est pas l'IP brute
  - `test_user_agent_is_truncated` -- UA tronque a 100 chars
- GREEN : implementer middleware axum qui log chaque acces dans `cloud_access_log` :
  - IP hashee (SHA-256 avec sel)
  - User-Agent tronque a 100 chars
  - Action : download, preview, auth_attempt, auth_fail
  - Succes/echec
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Conformite RGPD : IP hashee, UA tronque
- Chaque acces est enregistre, meme les echecs

**Commit** : `feat(miyucloud-server): add GDPR-compliant access logging`

---

#### WP-B11 : Surface web -- TLS (HTTPS)

**Assigne a** : Francois
**Dependances** : WP-B08
**Estimation** : M

**Fichiers a creer** :
- `apps/miyucloud/src/web_surface/tls.rs`

**Cycle TDD** :
- RED :
  - `test_generate_self_signed_cert` -- generer un cert, verifier qu'il est valide
  - `test_load_existing_cert` -- charger un cert depuis le disque
- GREEN : implementer `TlsConfig` (spec P1 section 7.5) :
  - Au premier demarrage : generer RSA 2048 + cert auto-signe via `rcgen` (valide 365 jours)
  - Stocker dans `{cog_data}/miyucloud/tls/`
  - Charger le cert existant aux demarrages suivants
  - Supporter le chargement d'un cert Let's Encrypt fourni par l'utilisateur
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Le cert auto-signe est genere automatiquement
- La connexion HTTP est refusee (pas de redirection, juste un refus)
- Le chemin du cert est configurable

**Commit** : `feat(miyucloud-server): add TLS with self-signed certificate generation`

---

#### WP-B12 : Surface web -- share_page (page de telechargement)

**Assigne a** : Francois
**Dependances** : WP-B08, WP-B09, WP-B10, WP-B11, WP-B05
**Estimation** : M

**Fichiers a creer** :
- `apps/miyucloud/src/web_surface/share_page.rs`

**Cycle TDD** :
- RED :
  - `test_share_page_valid_token_returns_200`
  - `test_share_page_invalid_token_returns_404`
  - `test_share_page_expired_token_returns_410`
  - `test_download_valid_token_streams_file`
  - `test_download_with_password_required`
  - `test_download_increments_counter`
- GREEN : implementer les handlers pour les routes de la spec P1 section 7.2 :
  - `GET /share/{token}` : page HTML avec nom du fichier, taille, bouton telecharger
  - `POST /share/{token}/auth` : verification mot de passe, creation session cookie
  - `GET /share/{token}/download` : streaming du fichier dechiffre (utilise `StreamingDecryptor`)
  - Toute route invalide : 404
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Le fichier est dechiffre en streaming (pas charge entierement en memoire)
- Le download utilise `chunked transfer encoding`
- Les tokens expirs retournent `410 Gone`
- Les tokens revoques retournent `410 Gone`

**Commit** : `feat(miyucloud-server): implement share download page with streaming decrypt`

---

#### WP-B13 : Surface web -- assets statiques

**Assigne a** : Lise
**Dependances** : WP-B12
**Estimation** : M

**Fichiers a creer** :
- `apps/miyucloud/src/web_surface/static_assets/index.html`
- `apps/miyucloud/src/web_surface/static_assets/style.css`
- `apps/miyucloud/src/web_surface/static_assets/download.js`

**Cycle TDD** :
- Verification visuelle dans un navigateur
- VERIFY : les fichiers sont corrects HTML5, CSS3, JS vanilla

**Criteres d'acceptation** :
- Page HTML minimale : nom du fichier, taille, bouton Telecharger, champ mot de passe (si requis), message expiration
- Pas de framework JS, pas de CDN (LOI-1)
- Design : fond sombre (#1a1a2e), typographie lisible, responsive mobile
- Logo Miyukini (petit, SVG inline)
- Accessible (ARIA labels sur les boutons et champs)
- La page s'adapte a 3 etats : telechargement disponible, mot de passe requis, lien expire/revoque

**Commit** : `feat(miyucloud-server): add static web assets for share page`

---

#### WP-B14 : Demarrage surface web (serveur dual)

**Assigne a** : Francois
**Dependances** : WP-B12, WP-B13
**Estimation** : M

**Fichier a modifier** :
- `apps/miyucloud/src/main.rs` -- ajouter le second serveur (surface web HTTPS)
- `apps/miyucloud/src/config.rs` -- ajouter les champs surface web (port, enable, cert_path)

**Cycle TDD** :
- RED :
  - `test_api_server_starts_on_localhost`
  - `test_web_surface_starts_on_all_interfaces` (si enabled)
  - `test_web_surface_disabled_by_config`
- GREEN : modifier `main.rs` pour lancer deux serveurs axum :
  - Serveur 1 (API interne) : `127.0.0.1:11440` (HTTP, localhost uniquement)
  - Serveur 2 (Surface web) : `0.0.0.0:11442` (HTTPS, expose au reseau, optionnel)
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Le serveur API interne ecoute uniquement sur localhost
- Le serveur web ecoute sur toutes les interfaces (0.0.0.0) uniquement si active dans la config
- Le serveur web utilise TLS (rustls)
- La configuration permet de desactiver la surface web

**Commit** : `feat(miyucloud-server): add dual server startup (API + web surface)`

---

### Lot B3 -- Integration Central (UI partage)

---

#### WP-B15 : Client HTTP -- methodes partage

**Assigne a** : Lise
**Dependances** : WP-B07
**Estimation** : S

**Fichier a modifier** :
- `apps/central/src/services/miyucloud/client.rs` -- ajouter les methodes partage

**Cycle TDD** :
- Tests ignores (necessitent le serveur)
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- `create_share_link(file_id?, folder_id?, password?, expires_in_hours, max_downloads?) -> Result<ShareLink>`
- `list_share_links() -> Result<Vec<ShareLink>>`
- `revoke_share_link(id: &str) -> Result<()>`
- `share_with(file_or_folder_id, grantee_id, grantee_type, permission) -> Result<SharePermission>`
- `list_shared_with_me() -> Result<Vec<...>>`

**Commit** : `feat(central/miyucloud): add share methods to HTTP client`

---

#### WP-B16 : ShareDialog (dialog creation partage)

**Assigne a** : Lise
**Dependances** : WP-B15
**Estimation** : M

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/share_dialog.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Dialog modal avec :
  - Type de partage : lien externe / partage Tribu
  - Duree d'expiration (selecteur : 1h, 6h, 24h, 7j, 30j)
  - Mot de passe optionnel
  - Nombre max de telechargements optionnel
  - Bouton "Creer le lien"
  - Affichage du lien genere (copier dans le presse-papier)
- Pour le partage Tribu : selecteur de profil/tribu + niveau de permission

**Commit** : `feat(central/miyucloud): add share dialog component`

---

#### WP-B17 : TrashView amelioree

**Assigne a** : Lise
**Dependances** : WP-A27
**Estimation** : S

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/trash_view.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Liste les fichiers et dossiers en corbeille
- Date de mise en corbeille affichee
- Boutons : Restaurer, Supprimer definitivement, Vider la corbeille
- Confirmation avant suppression definitive

**Commit** : `feat(central/miyucloud): add trash view`

---

#### WP-B18 : Settings (parametres MiyuCloud)

**Assigne a** : Lise
**Dependances** : WP-A27
**Estimation** : S

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/settings.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Affiche : chemin de stockage, espace utilise/disponible, quota
- Surface web : activer/desactiver, port, certificat TLS
- Passphrase : bouton "Changer la passphrase" (placeholder Phase C)
- Style coherent avec les settings des autres services

**Commit** : `feat(central/miyucloud): add settings view`

---

#### WP-B19 : API admin (quota, stats, access log)

**Assigne a** : Francois
**Dependances** : WP-B04, WP-B10
**Estimation** : S

**Fichier a modifier** :
- `apps/miyucloud/src/api/mod.rs` -- ajouter les routes admin

**Fichiers a creer (si non existants)** :
- Les routes admin peuvent etre ajoutees dans `apps/miyucloud/src/api/files.rs` ou un nouveau `admin.rs`

**Cycle TDD** :
- RED :
  - `test_get_quota`
  - `test_get_stats`
  - `test_get_access_log`
- GREEN : implementer les routes de la spec P1 section 4.1.6
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- `GET /api/admin/quota` retourne le quota de l'utilisateur
- `GET /api/admin/stats` retourne les statistiques de stockage
- `GET /api/admin/access-log?limit=N` retourne les N dernieres entrees du journal

**Commit** : `feat(miyucloud-server): add admin API endpoints`

---

### Gate Phase B -- Validation Denis

**Commande** :
```bash
cargo test --workspace
cargo clippy --workspace -- -D warnings
```

**Verification fonctionnelle** :
1. Creer un lien de partage via l'API
2. Acceder au lien depuis un navigateur (HTTPS, cert auto-signe -> accepter)
3. Telecharger le fichier
4. Verifier le rate limiting (11 requetes rapides -> 429)
5. Creer un lien avec mot de passe, verifier que le mot de passe est requis
6. Revoquer un lien, verifier que l'acces retourne 410
7. Verifier le journal d'acces (IP hashee)
8. Partager un fichier avec un profil Tribu
9. Lancer la migration Jay1Tribu (si des attachments existent)

**Criteres de passage** :
- [ ] `cargo test --workspace` : 0 echec
- [ ] `cargo clippy --workspace -- -D warnings` : 0 warning
- [ ] Lien de partage fonctionnel dans un navigateur
- [ ] Rate limiting effectif
- [ ] HTTPS fonctionnel (cert auto-signe)
- [ ] Sandboxing : impossible d'acceder a un fichier non partage
- [ ] Journal d'acces conforme RGPD
- [ ] UI Central : dialog de partage fonctionnel
- [ ] Migration Jay1Tribu testee

---

### Diagramme Gantt Phase B

```
Semaine 1 : Back-end extensions (Francois) || UI prep (Lise)
================================================================

F: WP-B01 ─> WP-B02
F: WP-B03
F: WP-B04
F: WP-B05
F: WP-B06

L: WP-B15 (des que B07 pret)
L: WP-B17
L: WP-B18

Semaine 2 : Surface web (Francois) || UI partage (Lise)
================================================================

F: WP-B07 ─> WP-B08 ─> WP-B09
                       ─> WP-B10
                       ─> WP-B11
                       ─> WP-B12 ─> WP-B14

L: WP-B13 (assets statiques, des que B12 pret)
L: WP-B16 (share dialog)

Semaine 3 : Finition + Gate
================================================================

F: WP-B19 (admin API)
L: Integration finale
D: Gate Phase B

Parallelisme effectif :
  F et L travaillent en parallele sur lots B1/B2 et B3
  Le point de sync principal est WP-B12 (share_page) dont L depend pour B13
  Les WP B01-B06 du crate sont independants entre eux (parallelisables par F)
```

---

## 4. Phase C -- Synchronisation P2P

**Objectif** : Sync automatique chiffree E2E entre les machines de l'utilisateur en pair-a-pair.

**Fonctionnalites couvertes** : F06-F09, F11-F16, F27, F29-F30, F33-F35, F45, F47

**Pre-requis** : Gate Phase B validee.

### Lot C1 -- Horloges vectorielles + resolution conflits

---

#### WP-C01 : Module sync -- vector_clock

**Assigne a** : Francois
**Dependances** : Phase B completee
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/sync/mod.rs`
- `crates/miyucloud/src/sync/vector_clock.rs`

**Cycle TDD** :
- RED :
  - `test_new_clock_is_empty`
  - `test_increment_increases_counter`
  - `test_compare_equal`
  - `test_compare_before` -- clock A < clock B
  - `test_compare_after` -- clock A > clock B
  - `test_compare_concurrent` -- ni avant ni apres -> conflit
  - `test_merge_takes_max`
  - `test_merge_symmetric` -- merge(A, B) donne le meme resultat que merge(B, A)
- GREEN : implementer `VectorClock` et `ClockOrder` tels que decrits dans la spec P1 section 5.3
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- `VectorClock` est un `HashMap<String, u64>` (NodeId -> compteur logique)
- `compare` retourne `ClockOrder::{Before, After, Equal, Concurrent}`
- `merge` prend le max par composante
- Tests exhaustifs couvrant tous les cas de comparaison

**Commit** : `feat(miyucloud): implement vector clocks for P2P sync`

---

#### WP-C02 : Module sync -- conflict

**Assigne a** : Francois
**Dependances** : WP-C01
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/sync/conflict.rs`

**Cycle TDD** :
- RED :
  - `test_detect_conflict` -- deux clocks concurrentes -> conflit detecte
  - `test_no_conflict_when_ordered` -- clock A < clock B -> pas de conflit
  - `test_create_conflict_copy` -- le fichier conflit est nomme `filename.conflict-{node}-{ts}.ext`
  - `test_resolve_conflict_local` -- resolution garde la version locale
  - `test_resolve_conflict_remote` -- resolution garde la version distante
- GREEN : implementer `ConflictResolver` :
  - `detect(local_clock, remote_clock) -> Option<ConflictType>`
  - `create_conflict_copy(storage, file_entry, remote_node_id) -> Result<SyncConflict>`
  - `resolve(db, conflict_id, resolution: ConflictResolution) -> Result<()>`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- INVARIANT : jamais de perte silencieuse de donnees
- La copie de conflit est un fichier separe (pas d'ecrasement)
- Le conflit est enregistre dans `cloud_sync_conflicts`

**Commit** : `feat(miyucloud): implement conflict detection and resolution`

---

### Lot C2 -- Protocole sync + transport

---

#### WP-C03 : Module sync -- protocol (messages)

**Assigne a** : Francois
**Dependances** : WP-C01
**Estimation** : S

**Fichiers a creer** :
- `crates/miyucloud/src/sync/protocol.rs`

**Cycle TDD** :
- RED :
  - `test_sync_message_serialize_roundtrip` -- chaque variante de `SyncMessage` se serialise et deserialise
  - `test_manifest_entry_serialize`
- GREEN : implementer `SyncMessage`, `ManifestEntry` tels que decrits dans la spec P1 section 5.5.1
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Toutes les variantes de `SyncMessage` : ManifestRequest, ManifestResponse, ChunkRequest, ChunkData, FileChanged, Ack
- `ManifestEntry` contient le `VectorClock` du fichier

**Commit** : `feat(miyucloud): define sync protocol messages`

---

#### WP-C04 : Module sync -- manifest

**Assigne a** : Francois
**Dependances** : WP-C03
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/sync/manifest.rs`

**Cycle TDD** :
- RED :
  - `test_build_manifest_from_db`
  - `test_compute_diff_new_files` -- fichiers presents chez le pair mais pas localement
  - `test_compute_diff_updated_files` -- fichiers plus recents chez le pair
  - `test_compute_diff_no_changes`
  - `test_compute_diff_conflicts`
- GREEN : implementer `SyncManifest` :
  - `build(db, folder_ids) -> Result<Vec<ManifestEntry>>` -- construire le manifeste local
  - `compute_diff(local: &[ManifestEntry], remote: &[ManifestEntry]) -> SyncDiff` -- calculer les differences
  - `SyncDiff { to_download: Vec<...>, to_upload: Vec<...>, conflicts: Vec<...> }`
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Le manifeste est construit depuis la DB (pas du filesystem)
- Le diff est bidirectionnel (fichiers a envoyer ET a recevoir)
- Les conflits sont isoles dans une liste separee

**Commit** : `feat(miyucloud): implement sync manifest and diff computation`

---

#### WP-C05 : Module sync -- peer_discovery

**Assigne a** : Francois
**Dependances** : WP-C03
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/sync/peer_discovery.rs`

**Cycle TDD** :
- RED :
  - `test_parse_mdns_txt_record` -- parser un enregistrement TXT mDNS
  - `test_build_mdns_txt_record` -- construire un enregistrement TXT
  - `test_peer_already_known_updates_last_seen`
  - `test_new_peer_is_not_trusted` -- un nouveau pair decouvre n'est pas de confiance par defaut
- GREEN : implementer `PeerDiscovery` :
  - `announce(cog_id, port, public_key)` -- annoncer via mDNS
  - `scan() -> Vec<DiscoveredPeer>` -- scanner les pairs mDNS
  - `register_peer(db, peer) -> Result<SyncPeer>` -- enregistrer un pair dans la DB (is_trusted = false)
  - `trust_peer(db, peer_id) -> Result<()>` -- marquer un pair comme de confiance (action utilisateur)
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Service mDNS : `_miyucloud._tcp.local.`
- Les pairs decouverts sont enregistres avec `is_trusted = false`
- L'utilisateur doit approuver manuellement un nouveau pair avant la premiere sync
- Scan toutes les 30 secondes (configurable)

**Commit** : `feat(miyucloud): implement P2P peer discovery via mDNS`

---

#### WP-C06 : Module crypto -- e2e (chiffrement E2E sync)

**Assigne a** : Francois
**Dependances** : WP-A08
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/crypto/e2e.rs`

**Cycle TDD** :
- RED :
  - `test_key_exchange_produces_shared_secret` -- les deux parties derivent le meme secret
  - `test_encrypt_decrypt_session` -- chiffrer avec la cle de session, dechiffrer de l'autre cote
  - `test_different_sessions_different_keys` -- chaque session a une cle differente (PFS)
  - `test_fingerprint_from_public_key` -- le fingerprint est reproductible
- GREEN : implementer :
  - `generate_ephemeral_keypair() -> (StaticSecret, PublicKey)` (X25519)
  - `derive_session_key(local_secret, remote_public) -> [u8; 32]` (X25519 DH + HKDF)
  - `encrypt_message(session_key, message) -> EncryptedMessage`
  - `decrypt_message(session_key, encrypted) -> Vec<u8>`
  - `compute_fingerprint(public_key) -> String` (SHA-256 tronque a 16 chars hex)
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Perfect Forward Secrecy : nouvelle paire ephemere a chaque session
- Contexte HKDF : `"miyucloud-sync-session"`
- Le fingerprint est affichable pour verification manuelle par l'utilisateur

**Commit** : `feat(miyucloud): implement X25519 E2E encryption for P2P sync`

---

#### WP-C07 : Module sync -- transport

**Assigne a** : Francois
**Dependances** : WP-C06, WP-C03
**Estimation** : L

**Fichiers a creer** :
- `crates/miyucloud/src/sync/transport.rs`

**Cycle TDD** :
- RED :
  - `test_send_and_receive_chunk` -- envoyer un chunk chiffre, recevoir, dechiffrer, verifier
  - `test_send_message_roundtrip` -- envoyer un SyncMessage, le recevoir
  - `test_connection_timeout`
- GREEN : implementer `SyncTransport` :
  - `connect(peer_addr, session_key) -> Result<SyncConnection>`
  - `listen(port, session_key) -> Result<SyncListener>`
  - `SyncConnection::send_message(msg: SyncMessage) -> Result<()>`
  - `SyncConnection::receive_message() -> Result<SyncMessage>`
  - TCP + TLS mutuel via rustls
  - Tous les messages chiffres avec la cle de session E2E
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Transport TCP avec TLS mutuel
- Timeout 30 secondes par chunk
- Max 4 chunks en vol simultanement
- Reprise possible (etat de transfert persiste dans un fichier temporaire)

**Commit** : `feat(miyucloud): implement encrypted P2P transport`

---

### Lot C3 -- Moteur de sync

---

#### WP-C08 : Module sync -- engine (boucle de sync)

**Assigne a** : Francois
**Dependances** : WP-C02, WP-C04, WP-C05, WP-C07
**Estimation** : L

**Fichiers a creer** :
- `crates/miyucloud/src/sync/engine.rs`

**Cycle TDD** :
- RED :
  - `test_sync_engine_detects_new_file_on_peer`
  - `test_sync_engine_downloads_from_peer`
  - `test_sync_engine_uploads_to_peer`
  - `test_sync_engine_handles_conflict`
  - `test_sync_engine_skips_untrusted_peer`
- GREEN : implementer `SyncEngine` (spec P1 section 5.6) :
  - Boucle principale : decouverte pairs -> echange manifestes -> diff -> transfert -> resolution conflits
  - Watcher filesystem (`notify` crate) pour detecter les modifications locales
  - Mise a jour des horloges vectorielles apres chaque modification
  - Intervalle configurable (defaut 10 secondes)
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- La boucle ne sync qu'avec les pairs de confiance (`is_trusted = true`)
- Les modifications locales sont detectees en quasi-temps-reel (watcher)
- Les conflits sont detectes et signales (jamais de perte silencieuse)
- L'engine est arretable proprement (token de cancellation)

**Commit** : `feat(miyucloud): implement P2P sync engine`

---

### Lot C4 -- API sync + UI

---

#### WP-C09 : API sync P2P (endpoints serveur)

**Assigne a** : Francois
**Dependances** : WP-C08
**Estimation** : M

**Fichiers a creer** :
- `apps/miyucloud/src/api/sync_api.rs`

**Fichier a modifier** :
- `apps/miyucloud/src/api/mod.rs` -- ajouter les routes sync
- `apps/miyucloud/src/main.rs` -- demarrer le SyncEngine en arriere-plan

**Cycle TDD** :
- RED :
  - `test_list_peers`
  - `test_register_peer`
  - `test_get_sync_status`
  - `test_list_conflicts`
  - `test_resolve_conflict`
- GREEN : implementer les routes de la spec P1 section 4.1.5
- VERIFY : `cargo test -p miyucloud-server`

**Criteres d'acceptation** :
- Le SyncEngine est lance comme une tache Tokio en arriere-plan au demarrage du serveur
- Les endpoints permettent de gerer les pairs et les conflits
- `GET /api/sync/status` retourne l'etat temps-reel de la sync

**Commit** : `feat(miyucloud-server): implement sync P2P API endpoints`

---

#### WP-C10 : Client HTTP -- methodes sync

**Assigne a** : Lise
**Dependances** : WP-C09
**Estimation** : S

**Fichier a modifier** :
- `apps/central/src/services/miyucloud/client.rs` -- ajouter les methodes sync

**Cycle TDD** :
- Tests ignores
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- `list_peers() -> Result<Vec<SyncPeer>>`
- `register_peer(cog_id, public_key, name?) -> Result<SyncPeer>`
- `trust_peer(peer_id) -> Result<()>`
- `get_sync_status() -> Result<SyncStatus>`
- `list_conflicts() -> Result<Vec<SyncConflict>>`
- `resolve_conflict(id, resolution) -> Result<()>`

**Commit** : `feat(central/miyucloud): add sync methods to HTTP client`

---

#### WP-C11 : SyncStatus (indicateur sync dans Central)

**Assigne a** : Lise
**Dependances** : WP-C10
**Estimation** : M

**Fichiers a creer** :
- `apps/central/src/services/miyucloud/sync_status.rs`

**Cycle TDD** :
- Verification visuelle
- VERIFY : `cargo check -p miyukini-central`

**Criteres d'acceptation** :
- Badge dans le header MiyuCloud : nombre de pairs en ligne, etat sync
- Indicateur rouge si des conflits sont en attente
- Clic sur le badge ouvre un panel : liste des pairs, statut de chaque pair, conflits a resoudre
- Bouton "Ajouter un pair" (saisie manuelle IP)
- Bouton "Approuver" pour les pairs non de confiance (affiche le fingerprint)

**Commit** : `feat(central/miyucloud): add sync status indicator`

---

### Lot C5 -- Export + finitions

---

#### WP-C12 : Module export -- archive (ZIP + manifest)

**Assigne a** : Francois
**Dependances** : WP-A12
**Estimation** : M

**Fichiers a creer** :
- `crates/miyucloud/src/export/mod.rs`
- `crates/miyucloud/src/export/archive.rs`

**Cycle TDD** :
- RED :
  - `test_export_folder_creates_zip`
  - `test_export_includes_manifest_json`
  - `test_import_zip_creates_files`
- GREEN : implementer :
  - `export_folder(db, storage, crypto, folder_id, output_path) -> Result<PathBuf>` -- cree un ZIP contenant les fichiers dechiffres + un `manifest.json` avec les metadonnees
  - `import_archive(db, storage, crypto, zip_path, parent_id) -> Result<Vec<FileEntry>>` -- importe un ZIP
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Le manifest JSON contient : nom, taille, checksum, arborescence
- L'export dechiffre les fichiers (le ZIP est en clair, pour portabilite LOI-8)
- L'import chiffre les fichiers at-rest

**Commit** : `feat(miyucloud): implement ZIP export/import with manifest`

---

#### WP-C13 : Integration finale lib.rs Phase C

**Assigne a** : Francois
**Dependances** : WP-C08, WP-C12
**Estimation** : S

**Fichier a modifier** :
- `crates/miyucloud/src/lib.rs` -- ajouter `pub mod sync` et `pub mod export`

**Cycle TDD** :
- RED : test d'integration `tests/integration_sync.rs` -- simuler une sync entre deux instances en memoire
- GREEN : wiring complet
- VERIFY : `cargo test -p miyucloud`

**Criteres d'acceptation** :
- Tous les modules sont exportes
- Le test d'integration sync fonctionne

**Commit** : `feat(miyucloud): wire sync and export modules`

---

### Gate Phase C -- Validation Denis + George

**Commande** :
```bash
cargo test --workspace
cargo clippy --workspace -- -D warnings
cargo build --workspace
```

**Verification fonctionnelle** :
1. Lancer deux instances de miyucloud-server sur des ports differents
2. Enregistrer chaque instance comme pair de l'autre
3. Uploader un fichier sur l'instance A
4. Verifier que le fichier apparait sur l'instance B apres la sync
5. Modifier le fichier sur les deux instances simultanement -> conflit detecte
6. Resoudre le conflit via l'API
7. Exporter un dossier en ZIP, l'importer sur l'autre instance

**Criteres de passage** :
- [ ] `cargo test --workspace` : 0 echec
- [ ] `cargo clippy --workspace -- -D warnings` : 0 warning
- [ ] Sync bidirectionnelle fonctionnelle entre 2 instances
- [ ] Conflit detecte et signale quand 2 pairs modifient le meme fichier
- [ ] Chiffrement E2E verifie (le trafic entre pairs est illisible sans la cle)
- [ ] Decouverte mDNS fonctionnelle en LAN
- [ ] Export/import ZIP fonctionnel
- [ ] Indicateur sync dans Central affiche le statut correct
- [ ] Annotations MSCM presentes dans tous les nouveaux fichiers
- [ ] Audit securite George : crypto, surface web, permissions

---

### Diagramme Gantt Phase C

```
Semaine 1 : Fondations sync (Francois seul)
================================================================

F: WP-C01 ─> WP-C02
F: WP-C01 ─> WP-C03 ─> WP-C04
F: WP-C01 ─> WP-C03 ─> WP-C05
F: WP-C06

Semaine 2 : Transport + Engine (Francois) || UI sync (Lise)
================================================================

F: WP-C07 ─> WP-C08 (point de sync : necessite C02 + C04 + C05 + C07)

Semaine 3 : API + UI (Francois + Lise parallele)
================================================================

F: WP-C09
F: WP-C12 ─> WP-C13

L: WP-C10 (des que C09 pret) ─> WP-C11

D + G : Gate Phase C
```

---

## 5. Diagramme de Gantt global

```
PHASE A -- MVP Stockage local chiffre (~4 semaines)
================================================================

Sem 1   F: A01 A02 A03 A04(debut) A28
        L: ---

Sem 2   F: A04(fin) A05 A06 A07 A08 A09 A10
        L: A19 A20

Sem 3   F: A11 A12 A13 A14 A15 A16 A17 A18
        L: A21 A22 A23

Sem 4   F: corrections / support Lise
        L: A24 A25 A26 A27
        D: Gate A

PHASE B -- Surface web + Partage (~3 semaines)
================================================================

Sem 5   F: B01 B02 B03 B04 B05 B06
        L: B17 B18

Sem 6   F: B07 B08 B09 B10 B11 B12
        L: B15 B13 B16

Sem 7   F: B14 B19
        L: integration
        D: Gate B

PHASE C -- Sync P2P (~3 semaines)
================================================================

Sem 8   F: C01 C02 C03 C04 C05 C06
        L: ---

Sem 9   F: C07 C08
        L: ---

Sem 10  F: C09 C12 C13
        L: C10 C11
        D + G: Gate C

TOTAL : ~10 semaines (estimation optimiste)
================================================================
```

---

## 6. Regles pour Francois et Lise

### 6.1 Regles communes

1. **Un WP = un commit**. Ne jamais combiner plusieurs WP dans un commit.
2. **TDD obligatoire** : ecrire le test AVANT le code. Le test doit echouer (RED) avant de coder (GREEN).
3. **Pas de `unwrap()`** en dehors des tests. Utiliser `?`, `map_err`, ou les types d'erreur du module.
4. **Annotations MSCM** dans le header de chaque fichier : `@id`, `@do`, `@role`, `@layer`, `@human`.
5. **`cargo clippy -p {crate} -- -D warnings`** apres chaque WP. Zero warning accepte.
6. **UUIDs v4** pour les IDs, **ISO 8601** pour les timestamps.
7. **Ne jamais ajouter de dependance** non listee dans la spec sans validation Denis.

### 6.2 Regles specifiques Francois (back-end)

1. **Chiffrement toujours actif** : il n'y a pas de mode "sans chiffrement". Les fichiers sont TOUJOURS chiffres at-rest.
2. **Invariant zero-knowledge** : la master key n'est JAMAIS ecrite sur disque.
3. **Invariant integrite** : si un chunk dechiffre ne passe pas la verification du tag, erreur IMMEDIATE. Jamais de lecture silencieuse de donnees corrompues.
4. **RGPD** : les IP sont hashees, les UA tronques, les fichiers purges sont ecrases avec des zeros.
5. **Tests DB** : toujours utiliser `":memory:"` pour les tests SQLite.
6. **Pas de temps global** (LOI-4) : utiliser des horloges vectorielles, pas des timestamps pour l'ordonnancement sync.

### 6.3 Regles specifiques Lise (front-end)

1. **Extraire les variables avant RSX** : tous les styles conditionnels, labels dynamiques, couleurs doivent etre dans des `let` AVANT le bloc `rsx!{}`.
2. **Pas de nested braces** dans les format strings RSX.
3. **Pas de named format args** dans les text nodes RSX.
4. **Pas de read+set** sur le meme signal dans une expression.
5. **Pattern UI** : suivre le style des services existants (JayKonta sidebar, JayKoa calendar, Jay1Tribu chat).
6. **Composants atomiques** : chaque composant dans son propre fichier. Le `mod.rs` est le point d'entree.
7. **Le client HTTP est async** : utiliser `use_future` ou `spawn` pour les appels reseau, jamais de blocage dans le thread UI.

### 6.4 Points de synchronisation

Les seuls moments ou Francois et Lise doivent se coordonner :

| Moment | Declencheur | Action |
|--------|-------------|--------|
| Debut Lise (WP-A21) | Francois livre WP-A16 (API files) | Lise peut commencer le client HTTP |
| Debut Lise B (WP-B15) | Francois livre WP-B07 (API shares) | Lise peut ajouter les methodes partage au client |
| Assets web (WP-B13) | Francois livre WP-B12 (share_page) | Lise cree les assets HTML/CSS/JS |
| Debut Lise C (WP-C10) | Francois livre WP-C09 (API sync) | Lise peut ajouter les methodes sync au client |

En dehors de ces points, Francois et Lise travaillent de maniere **autonome**.

---

## Recapitulatif des Work Packages

### Phase A (28 WP)

| WP | Titre | Assigne | Taille | Dependances |
|----|-------|---------|--------|-------------|
| A01 | Scaffolding Cargo.toml miyucloud | F | S | - |
| A02 | Erreurs + admin_cell + context | F | S | A01 |
| A03 | Types domaine | F | S | A02 |
| A04 | Persistance KindMother | F | L | A03 |
| A05 | Storage trait + local_fs | F | M | A02 |
| A06 | Storage chunking | F | M | A05 |
| A07 | Storage integrity (SHA-256) | F | S | A05 |
| A08 | Crypto keys (Argon2id + HKDF) | F | M | A02 |
| A09 | Crypto at-rest (ChaCha20-Poly1305) | F | M | A08 |
| A10 | lib.rs re-exports + integration test | F | S | A04, A06, A07, A09 |
| A11 | Auth permissions | F | S | A03 |
| A12 | Domain file_ops (CRUD) | F | M | A04, A10, A11 |
| A13 | Domain trash | F | S | A12 |
| A14 | Scaffolding app miyucloud-server | F | S | A01 |
| A15 | API auth interne | F | S | A14 |
| A16 | API fichiers (CRUD) | F | M | A12, A15 |
| A17 | API corbeille | F | S | A13, A16 |
| A18 | Init passphrase + demarrage complet | F | M | A08, A16 |
| A19 | Enregistrement catalogue Central | L | S | A14 |
| A20 | MiyuCloudState | L | S | A03 |
| A21 | Client HTTP MiyuCloud | L | M | A16 |
| A22 | Composants reutilisables | L | S | A20 |
| A23 | Sidebar | L | M | A21, A22 |
| A24 | Explorer | L | M | A21, A22, A23 |
| A25 | Upload | L | M | A21, A24 |
| A26 | File detail | L | S | A21, A22 |
| A27 | MiyuCloudView entry point | L | M | A23, A24, A25, A26 |
| A28 | Depreciation Jay1Tribu | F | S | - |

### Phase B (19 WP)

| WP | Titre | Assigne | Taille | Dependances |
|----|-------|---------|--------|-------------|
| B01 | Auth web_tokens | F | M | Phase A |
| B02 | Domain external_share | F | M | B01 |
| B03 | Domain sharing (Tribu) | F | M | A11 |
| B04 | Domain quota | F | S | A04 |
| B05 | Crypto streaming decrypt | F | M | A09 |
| B06 | Domain jay1tribu_migration | F | M | A12 |
| B07 | API shares | F | M | B02, B03 |
| B08 | Surface web sandbox | F | M | B07 |
| B09 | Surface web rate limiter | F | S | B08 |
| B10 | Surface web access log | F | S | B08 |
| B11 | Surface web TLS | F | M | B08 |
| B12 | Surface web share_page | F | M | B08, B09, B10, B11, B05 |
| B13 | Surface web assets statiques | L | M | B12 |
| B14 | Demarrage serveur dual | F | M | B12, B13 |
| B15 | Client HTTP methodes partage | L | S | B07 |
| B16 | ShareDialog | L | M | B15 |
| B17 | TrashView amelioree | L | S | A27 |
| B18 | Settings | L | S | A27 |
| B19 | API admin | F | S | B04, B10 |

### Phase C (13 WP)

| WP | Titre | Assigne | Taille | Dependances |
|----|-------|---------|--------|-------------|
| C01 | Sync vector_clock | F | M | Phase B |
| C02 | Sync conflict | F | M | C01 |
| C03 | Sync protocol | F | S | C01 |
| C04 | Sync manifest | F | M | C03 |
| C05 | Sync peer_discovery | F | M | C03 |
| C06 | Crypto e2e (X25519) | F | M | A08 |
| C07 | Sync transport | F | L | C06, C03 |
| C08 | Sync engine | F | L | C02, C04, C05, C07 |
| C09 | API sync P2P | F | M | C08 |
| C10 | Client HTTP methodes sync | L | S | C09 |
| C11 | SyncStatus UI | L | M | C10 |
| C12 | Export archive | F | M | A12 |
| C13 | Integration finale | F | S | C08, C12 |

### Totaux

| Phase | WP Francois | WP Lise | WP Denis | Total |
|-------|-------------|---------|----------|-------|
| A | 18 | 9 | 1 (gate) | 28 |
| B | 13 | 6 | 1 (gate) | 19 (+ gate) |
| C | 10 | 2 | 1 (gate) | 13 (+ gate) |
| **Total** | **41** | **17** | **3** | **60 + 3 gates** |

---

**Quality Gate P2** : Ce plan doit etre valide par Denis avant passage en P3.

**Prochain jalon** : Validation du plan -> Lancement P3 (Francois + Lise en parallele).
