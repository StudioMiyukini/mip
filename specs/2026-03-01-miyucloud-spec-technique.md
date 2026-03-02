# Specification Technique P1 -- MiyuCloud

**Auteur** : Denis (Chef Dev Senior)
**Date** : 2026-03-01
**Classification MIP** : T5 (Chantier strategique)
**Phase** : P1 -- Specification technique
**Statut** : REDACTION COMPLETE -- EN ATTENTE VALIDATION

**Documents de reference** :
- `.mip/briefs/2026-03-01-cloud-storage-service.md` (Brief P0, Maria)
- `.mip/briefs/2026-03-01-miyucloud-analyse-concurrentielle.md` (Analyse PR, Fabrice)
- Decisions verrouillees : D1 (P2P), D2 (Surface web restreinte), D3 (Remplacement Jay1Tribu), D4 (Chiffrement renforce)

---

## Table des matieres

1. [Architecture detaillee](#1-architecture-detaillee)
2. [Structure des crates](#2-structure-des-crates)
3. [Modele de donnees](#3-modele-de-donnees)
4. [API REST](#4-api-rest)
5. [Protocole de synchronisation P2P](#5-protocole-de-synchronisation-p2p)
6. [Securite et chiffrement](#6-securite-et-chiffrement)
7. [Surface web de partage](#7-surface-web-de-partage)
8. [Migration Jay1Tribu](#8-migration-jay1tribu)
9. [Integration Central (Dioxus 0.6)](#9-integration-central-dioxus-06)
10. [Dependances Rust](#10-dependances-rust)
11. [Phasage technique detaille](#11-phasage-technique-detaille)

---

## 1. Architecture detaillee

### 1.1 Diagramme des composants

```
                            UTILISATEUR
                               |
                 +-------------+-------------+
                 |                           |
          [Central UI]              [Navigateur Web]
          (Dioxus 0.6)              (destinataire externe)
                 |                           |
                 |  HTTP localhost            |  HTTPS port configurable
                 v                           v
         +---------------+          +------------------+
         |  miyucloud    |          |  miyucloud       |
         |  API interne  |          |  Surface Web     |
         |  (axum)       |          |  (axum)          |
         |  /api/*       |          |  /share/*        |
         +-------+-------+          +--------+---------+
                 |                           |
                 +-------------+-------------+
                               |
                    +----------+----------+
                    |   crates/miyucloud   |
                    |   (bibliotheque)     |
                    +----------+----------+
                               |
          +--------+-----------+-----------+--------+
          |        |           |           |        |
      [storage] [crypto]   [domain]    [sync]   [data]
          |        |           |           |        |
          v        v           v           v        v
      Filesystem  Cles     Logique     Pairs    KindMother
      local       derivees metier      P2P      (SQLite)
                                         |
                              +----------+----------+
                              |                     |
                         [mDNS LAN]           [Webway WAN]
                              |                     |
                         Autres COG            Autres COG
```

### 1.2 Couches et responsabilites

| Couche | Responsabilite | Localisation |
|--------|---------------|--------------|
| **Presentation** | UI explorateur fichiers dans Central + surface web partage | `apps/central/src/services/miyucloud/` + `apps/miyucloud/src/web_surface/` |
| **API** | Endpoints REST internes (Central) + endpoints web publics (partage) | `apps/miyucloud/src/api/` + `apps/miyucloud/src/web_surface/` |
| **Domaine** | Logique metier : partage, quotas, migration, corbeille | `crates/miyucloud/src/domain/` |
| **Synchronisation** | Moteur P2P, horloges vectorielles, decouverte pairs | `crates/miyucloud/src/sync/` |
| **Chiffrement** | E2E, at-rest, gestion cles, streaming | `crates/miyucloud/src/crypto/` |
| **Stockage** | Abstraction filesystem, chunking, integrite | `crates/miyucloud/src/storage/` |
| **Persistance** | Metadonnees fichiers, index, etat sync dans KindMother | `crates/miyucloud/src/data/` |
| **Auth** | Authentification locale + sessions web temporaires | `crates/miyucloud/src/auth/` |

### 1.3 Flux de donnees principaux

**Flux 1 -- Upload fichier (Central)** :
```
Central UI -> POST /api/files/upload -> domain::validate_quota
-> storage::write_chunks -> crypto::encrypt_at_rest
-> data::file_entry_create -> Response 201
```

**Flux 2 -- Download fichier (Central)** :
```
Central UI -> GET /api/files/{id}/download -> auth::verify_owner
-> data::file_entry_by_id -> crypto::decrypt_at_rest
-> storage::read_chunks -> Response stream
```

**Flux 3 -- Partage web externe** :
```
Navigateur -> GET /share/{token} -> web_surface::verify_share_token
-> rate_limiter::check -> access_log::log_access
-> data::share_link_by_token -> crypto::decrypt_streaming
-> Response stream fichier
```

**Flux 4 -- Sync P2P** :
```
sync::engine::tick -> sync::peer_discovery::scan_peers
-> sync::manifest::compute_diff(local, remote)
-> sync::vector_clock::merge_clocks
-> crypto::e2e::encrypt_chunk -> sync::transport::send_chunk
-> Pair distant: transport::receive -> e2e::decrypt -> storage::write
```

### 1.4 Positionnement dans la pyramide COG

MiyuCloud est un **Operateur** (Strate 7) compose de :
- `crates/miyucloud/` : Toolkit (Strate 6) -- capacites executables
- `apps/miyucloud/` : App service (Strate 7) -- entite fonctionnelle gouvernee

Dependances Cores (Strate 4) :
- **KindMother** : persistance metadonnees
- **StrongFather** : validation acces et politiques

---

## 2. Structure des crates

### 2.1 Crate bibliotheque : `crates/miyucloud/`

```
crates/miyucloud/
  Cargo.toml
  src/
    lib.rs                        # Point d'entree, re-exports publics
    admin_cell.rs                 # Metadonnees gouvernance (MiyucloudAdminCell)
    context.rs                    # GovernedContext
    errors.rs                     # MiyucloudError (enum central)

    data/
      mod.rs                      # Feature flags (legacy-sqlite / kindmother-only)
      types.rs                    # FileEntry, FolderEntry, ShareLink, SyncPeer, etc.
      kindmother_db.rs            # SQLite direct (feature legacy-sqlite)
      kindmother_client_db.rs     # Client KindMother (feature kindmother-only)

    auth/
      mod.rs                      # Re-exports
      permissions.rs              # FilePermission, SharePermission, verify_access
      web_tokens.rs               # Tokens temporaires pour surface web (generation, validation, expiration)

    storage/
      mod.rs                      # Trait StorageBackend
      local_fs.rs                 # Implementation filesystem local
      chunking.rs                 # Decoupe/reassemblage en chunks (256 KB)
      integrity.rs                # SHA-256 checksums, verification HMAC

    crypto/
      mod.rs                      # Re-exports, CryptoProvider trait
      at_rest.rs                  # Chiffrement au repos (ChaCha20-Poly1305)
      e2e.rs                      # Chiffrement E2E pour sync (X25519 + ChaCha20-Poly1305)
      keys.rs                     # KeyManager : derivation Argon2id, stockage cles derivees en memoire
      streaming.rs                # Dechiffrement streaming pour partage web

    sync/
      mod.rs                      # Re-exports, SyncEngine trait
      engine.rs                   # Boucle de sync (watch, diff, transfer)
      vector_clock.rs             # Horloges vectorielles (HashMap<NodeId, u64>)
      conflict.rs                 # Detection et resolution conflits
      manifest.rs                 # SyncManifest (etat fichiers par noeud)
      peer_discovery.rs           # Decouverte pairs (mDNS LAN + Webway WAN)
      transport.rs                # Transport chunks entre pairs (TCP + TLS)
      protocol.rs                 # Messages protocole sync (SyncRequest, SyncResponse, etc.)

    domain/
      mod.rs                      # Re-exports
      file_ops.rs                 # CRUD fichiers/dossiers, deplacement, renommage
      sharing.rs                  # Partage interne Tribu (permissions lecture/ecriture)
      external_share.rs           # Liens de partage web (creation, expiration, revocation)
      trash.rs                    # Corbeille (suppression douce, restauration, purge)
      quota.rs                    # Gestion quotas par utilisateur/tribu
      jay1tribu_migration.rs      # Migration donnees depuis Jay1Tribu

    export/
      mod.rs                      # Re-exports
      archive.rs                  # Export ZIP + manifest JSON (LOI-8)
```

### 2.2 App service : `apps/miyucloud/`

```
apps/miyucloud/
  Cargo.toml
  src/
    main.rs                       # Point d'entree : lancement axum (API + surface web)
    config.rs                     # Configuration (ports, chemins stockage, limites)

    api/
      mod.rs                      # Router axum API interne
      files.rs                    # CRUD fichiers : upload, download, list, move, rename, delete
      folders.rs                  # CRUD dossiers : create, list, rename, move, delete
      shares.rs                   # Gestion partages : create_share, revoke, list_shares
      trash.rs                    # Corbeille : list_trash, restore, purge
      sync_api.rs                 # Endpoints sync P2P : announce, request_manifest, push_chunk
      auth.rs                     # Auth interne : verify_cog_token

    web_surface/
      mod.rs                      # Router axum surface web restreinte
      share_page.rs               # Page de telechargement pour liens partage
      rate_limiter.rs             # Rate limiting (tower-governor)
      access_log.rs               # Logging complet acces externes
      sandbox.rs                  # Middleware isolation : aucun acces fichiers non partages
      tls.rs                      # Configuration HTTPS (rustls)
      static_assets/              # HTML/CSS/JS minimaux pour la page de partage
        index.html
        style.css
        download.js
```

### 2.3 Integration Central : `apps/central/src/services/miyucloud/`

```
apps/central/src/services/miyucloud/
  mod.rs                          # Point d'entree, MiyuCloudView component
  sidebar.rs                      # Navigation laterale (arborescence dossiers)
  explorer.rs                     # Vue principale explorateur (grille/liste)
  upload.rs                       # Composant upload (drag & drop, progress)
  file_detail.rs                  # Detail fichier (metadonnees, apercu, partage)
  share_dialog.rs                 # Dialog creation/gestion partage
  trash_view.rs                   # Vue corbeille
  sync_status.rs                  # Indicateur etat sync P2P
  settings.rs                     # Parametres MiyuCloud (stockage, quotas, cles)
  state.rs                        # MiyuCloudState (Signal Dioxus)
  components.rs                   # Composants reutilisables (breadcrumb, file_icon, etc.)
```

### 2.4 Cargo.toml : `crates/miyucloud/Cargo.toml`

```toml
[package]
name = "miyucloud"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true
repository.workspace = true
description = "MiyuCloud — Cloud prive auto-heberge, chiffre et pair-a-pair"

[dependencies]
miyukini-kernel = { path = "../miyukini-kernel" }
kindmother = { path = "../kindmother" }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "2"
sha2 = "0.10"
# Chiffrement (Decision D4)
chacha20poly1305 = "0.10"
x25519-dalek = { version = "2", features = ["static_secrets"] }
argon2 = "0.5"
rand = "0.8"
# SQLite direct (feature legacy-sqlite)
rusqlite = { version = "0.32", features = ["bundled"], optional = true }
# KindMother client (feature kindmother-only)
kindmother-client = { path = "../kindmother-client", optional = true }
kindmother-db-key = { path = "../kindmother-db-key", optional = true }
tokio = { version = "1", features = ["rt-multi-thread", "fs", "io-util"], optional = true }
tracing = "0.1"

[features]
default = ["legacy-sqlite"]
legacy-sqlite = ["rusqlite"]
kindmother-only = ["dep:kindmother-client", "dep:tokio"]
db-encryption = ["dep:kindmother-db-key", "rusqlite/bundled-sqlcipher"]

[lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"

[lints.clippy]
all = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
doc_markdown = "allow"
```

### 2.5 Cargo.toml : `apps/miyucloud/Cargo.toml`

```toml
[package]
name = "miyucloud-server"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true
repository.workspace = true
description = "MiyuCloud Server — API REST + Surface web de partage securise"

[dependencies]
miyucloud = { path = "../../crates/miyucloud", features = ["legacy-sqlite"] }
miyukini-kernel = { path = "../../crates/miyukini-kernel" }
axum = { version = "0.8", features = ["multipart"] }
tokio = { version = "1", features = ["full"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["cors", "limit", "trace", "fs"] }
tower_governor = "0.4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
rustls = "0.23"
tokio-rustls = "0.26"
rcgen = "0.13"
uuid = { version = "1", features = ["v4"] }
chrono = "0.4"
# Decouverte pairs (Decision D1)
mdns-sd = "0.11"

[lints.rust]
unsafe_code = "forbid"

[lints.clippy]
all = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
```

---

## 3. Modele de donnees

### 3.1 Schema KindMother (SQLite)

```sql
-- ============================================================
-- MiyuCloud -- Schema KindMother
-- Base de donnees : miyucloud.db (Instance Daughter)
-- ============================================================

-- Table principale des fichiers
CREATE TABLE IF NOT EXISTS cloud_files (
    id              TEXT PRIMARY KEY,           -- UUID v4
    parent_id       TEXT,                       -- UUID du dossier parent (NULL = racine)
    owner_id        TEXT NOT NULL,              -- UUID du profil proprietaire
    name            TEXT NOT NULL,              -- Nom du fichier (chiffre en base si zero-knowledge)
    mime_type       TEXT NOT NULL DEFAULT 'application/octet-stream',
    size_bytes      INTEGER NOT NULL DEFAULT 0, -- Taille originale en octets
    checksum_sha256 TEXT NOT NULL,              -- SHA-256 du contenu original
    encryption_iv   TEXT,                       -- IV/Nonce du chiffrement at-rest (base64)
    chunk_count     INTEGER NOT NULL DEFAULT 1, -- Nombre de chunks
    is_trashed      INTEGER NOT NULL DEFAULT 0, -- 1 = dans la corbeille
    trashed_at      TEXT,                       -- ISO 8601, date de mise en corbeille
    created_at      TEXT NOT NULL,              -- ISO 8601
    updated_at      TEXT NOT NULL,              -- ISO 8601
    FOREIGN KEY (parent_id) REFERENCES cloud_folders(id)
);

CREATE INDEX idx_cloud_files_parent ON cloud_files(parent_id);
CREATE INDEX idx_cloud_files_owner ON cloud_files(owner_id);
CREATE INDEX idx_cloud_files_trashed ON cloud_files(is_trashed);

-- Table des dossiers
CREATE TABLE IF NOT EXISTS cloud_folders (
    id              TEXT PRIMARY KEY,           -- UUID v4
    parent_id       TEXT,                       -- UUID du dossier parent (NULL = racine)
    owner_id        TEXT NOT NULL,              -- UUID du profil proprietaire
    name            TEXT NOT NULL,              -- Nom du dossier
    is_trashed      INTEGER NOT NULL DEFAULT 0,
    trashed_at      TEXT,
    created_at      TEXT NOT NULL,              -- ISO 8601
    updated_at      TEXT NOT NULL,              -- ISO 8601
    FOREIGN KEY (parent_id) REFERENCES cloud_folders(id)
);

CREATE INDEX idx_cloud_folders_parent ON cloud_folders(parent_id);
CREATE INDEX idx_cloud_folders_owner ON cloud_folders(owner_id);

-- Table des liens de partage (Decision D2)
CREATE TABLE IF NOT EXISTS cloud_share_links (
    id              TEXT PRIMARY KEY,           -- UUID v4
    file_id         TEXT,                       -- UUID du fichier partage (exclusif avec folder_id)
    folder_id       TEXT,                       -- UUID du dossier partage (exclusif avec file_id)
    creator_id      TEXT NOT NULL,              -- UUID du profil createur
    token           TEXT NOT NULL UNIQUE,       -- Token aleatoire non predictible (32 bytes hex)
    password_hash   TEXT,                       -- Hash bcrypt du mot de passe optionnel
    expires_at      TEXT NOT NULL,              -- ISO 8601, expiration OBLIGATOIRE
    max_downloads   INTEGER,                    -- Nombre max de telechargements (NULL = illimite)
    download_count  INTEGER NOT NULL DEFAULT 0, -- Compteur telechargements effectues
    is_revoked      INTEGER NOT NULL DEFAULT 0, -- 1 = revoque
    created_at      TEXT NOT NULL,              -- ISO 8601
    FOREIGN KEY (file_id) REFERENCES cloud_files(id),
    FOREIGN KEY (folder_id) REFERENCES cloud_folders(id),
    CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL)
        OR (file_id IS NULL AND folder_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_cloud_share_links_token ON cloud_share_links(token);

-- Table des permissions de partage interne (Tribu)
CREATE TABLE IF NOT EXISTS cloud_share_permissions (
    id              TEXT PRIMARY KEY,           -- UUID v4
    file_id         TEXT,                       -- Fichier concerne
    folder_id       TEXT,                       -- Dossier concerne
    grantee_id      TEXT NOT NULL,              -- UUID du profil ou tribu beneficiaire
    grantee_type    TEXT NOT NULL DEFAULT 'profile', -- 'profile' ou 'tribe'
    permission      TEXT NOT NULL DEFAULT 'read',    -- 'read' ou 'read_write'
    created_at      TEXT NOT NULL,              -- ISO 8601
    FOREIGN KEY (file_id) REFERENCES cloud_files(id),
    FOREIGN KEY (folder_id) REFERENCES cloud_folders(id),
    CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL)
        OR (file_id IS NULL AND folder_id IS NOT NULL)
    )
);

-- Table des pairs sync (Decision D1)
CREATE TABLE IF NOT EXISTS cloud_sync_peers (
    id              TEXT PRIMARY KEY,           -- UUID v4
    cog_id          TEXT NOT NULL UNIQUE,       -- COG ID du pair
    display_name    TEXT,                       -- Nom affiche du pair
    public_key      TEXT NOT NULL,              -- Cle publique X25519 (base64)
    last_seen_at    TEXT,                       -- ISO 8601, derniere connexion
    last_sync_at    TEXT,                       -- ISO 8601, derniere sync reussie
    is_trusted      INTEGER NOT NULL DEFAULT 0, -- 1 = pair de confiance
    created_at      TEXT NOT NULL               -- ISO 8601
);

-- Table des horloges vectorielles (Decision D1)
CREATE TABLE IF NOT EXISTS cloud_vector_clocks (
    file_id         TEXT NOT NULL,              -- UUID du fichier
    node_id         TEXT NOT NULL,              -- COG ID du noeud
    counter         INTEGER NOT NULL DEFAULT 0, -- Compteur logique
    updated_at      TEXT NOT NULL,              -- ISO 8601
    PRIMARY KEY (file_id, node_id),
    FOREIGN KEY (file_id) REFERENCES cloud_files(id)
);

-- Table des conflits de sync
CREATE TABLE IF NOT EXISTS cloud_sync_conflicts (
    id              TEXT PRIMARY KEY,           -- UUID v4
    file_id         TEXT NOT NULL,              -- Fichier en conflit
    local_version   TEXT NOT NULL,              -- Chemin de la version locale
    remote_version  TEXT NOT NULL,              -- Chemin de la version distante
    remote_node_id  TEXT NOT NULL,              -- COG ID du noeud distant
    status          TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved_local', 'resolved_remote', 'resolved_both'
    created_at      TEXT NOT NULL,              -- ISO 8601
    resolved_at     TEXT,                       -- ISO 8601
    FOREIGN KEY (file_id) REFERENCES cloud_files(id)
);

-- Journal d'acces (Decision D2 -- logging complet)
CREATE TABLE IF NOT EXISTS cloud_access_log (
    id              TEXT PRIMARY KEY,           -- UUID v4
    share_link_id   TEXT,                       -- Lien de partage concerne (NULL si acces interne)
    accessor_ip     TEXT,                       -- IP de l'accedant (hashee pour RGPD)
    accessor_ua     TEXT,                       -- User-Agent (tronque)
    action          TEXT NOT NULL,              -- 'download', 'preview', 'auth_attempt', 'auth_fail'
    file_id         TEXT,                       -- Fichier concerne
    success         INTEGER NOT NULL DEFAULT 1, -- 1 = reussi, 0 = echoue
    created_at      TEXT NOT NULL               -- ISO 8601
);

CREATE INDEX idx_cloud_access_log_share ON cloud_access_log(share_link_id);
CREATE INDEX idx_cloud_access_log_date ON cloud_access_log(created_at);

-- Quotas utilisateur
CREATE TABLE IF NOT EXISTS cloud_quotas (
    owner_id        TEXT PRIMARY KEY,           -- UUID du profil
    max_bytes       INTEGER NOT NULL DEFAULT 0, -- 0 = illimite
    used_bytes      INTEGER NOT NULL DEFAULT 0, -- Espace utilise
    updated_at      TEXT NOT NULL               -- ISO 8601
);

-- Dossiers synchronises (sync selective)
CREATE TABLE IF NOT EXISTS cloud_sync_folders (
    id              TEXT PRIMARY KEY,           -- UUID v4
    folder_id       TEXT NOT NULL,              -- Dossier a synchroniser
    local_path      TEXT NOT NULL,              -- Chemin local sur cette machine
    is_active       INTEGER NOT NULL DEFAULT 1, -- 1 = sync active
    created_at      TEXT NOT NULL,              -- ISO 8601
    FOREIGN KEY (folder_id) REFERENCES cloud_folders(id)
);

-- Donnees migrees depuis Jay1Tribu (Decision D3)
CREATE TABLE IF NOT EXISTS cloud_jay1tribu_migrations (
    id              TEXT PRIMARY KEY,           -- UUID v4
    jay1tribu_msg_id TEXT NOT NULL,             -- ID du message original dans Jay1Tribu
    file_id         TEXT NOT NULL,              -- ID du fichier migre dans MiyuCloud
    migrated_at     TEXT NOT NULL,              -- ISO 8601
    FOREIGN KEY (file_id) REFERENCES cloud_files(id)
);
```

### 3.2 Types Rust (`crates/miyucloud/src/data/types.rs`)

```rust
//! Types domaine MiyuCloud.
//!
//! @id: miyucloud_domain_types
//! @do: define_miyucloud_domain_model
//! @role: data
//! @layer: domain

use serde::{Deserialize, Serialize};

/// Entree fichier dans le cloud.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FileEntry {
    pub id: String,
    pub parent_id: Option<String>,
    pub owner_id: String,
    pub name: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub checksum_sha256: String,
    pub encryption_iv: Option<String>,
    pub chunk_count: u32,
    pub is_trashed: bool,
    pub trashed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Entree dossier dans le cloud.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FolderEntry {
    pub id: String,
    pub parent_id: Option<String>,
    pub owner_id: String,
    pub name: String,
    pub is_trashed: bool,
    pub trashed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Lien de partage externe (Decision D2).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ShareLink {
    pub id: String,
    pub file_id: Option<String>,
    pub folder_id: Option<String>,
    pub creator_id: String,
    pub token: String,
    pub has_password: bool,
    pub expires_at: String,
    pub max_downloads: Option<u32>,
    pub download_count: u32,
    pub is_revoked: bool,
    pub created_at: String,
}

/// Permission de partage interne (Tribu).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SharePermission {
    pub id: String,
    pub file_id: Option<String>,
    pub folder_id: Option<String>,
    pub grantee_id: String,
    pub grantee_type: GranteeType,
    pub permission: PermissionLevel,
    pub created_at: String,
}

/// Type de beneficiaire d'un partage.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GranteeType {
    Profile,
    Tribe,
}

/// Niveau de permission.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PermissionLevel {
    Read,
    ReadWrite,
}

/// Pair de synchronisation (Decision D1).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SyncPeer {
    pub id: String,
    pub cog_id: String,
    pub display_name: Option<String>,
    pub public_key: String,
    pub last_seen_at: Option<String>,
    pub last_sync_at: Option<String>,
    pub is_trusted: bool,
    pub created_at: String,
}

/// Etat d'un fichier dans l'horloge vectorielle.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VectorClockEntry {
    pub file_id: String,
    pub node_id: String,
    pub counter: u64,
    pub updated_at: String,
}

/// Conflit de synchronisation.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SyncConflict {
    pub id: String,
    pub file_id: String,
    pub local_version: String,
    pub remote_version: String,
    pub remote_node_id: String,
    pub status: ConflictStatus,
    pub created_at: String,
    pub resolved_at: Option<String>,
}

/// Statut de resolution d'un conflit.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConflictStatus {
    Pending,
    ResolvedLocal,
    ResolvedRemote,
    ResolvedBoth,
}

/// Entree du journal d'acces.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AccessLogEntry {
    pub id: String,
    pub share_link_id: Option<String>,
    pub accessor_ip: Option<String>,
    pub accessor_ua: Option<String>,
    pub action: AccessAction,
    pub file_id: Option<String>,
    pub success: bool,
    pub created_at: String,
}

/// Type d'action dans le journal d'acces.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccessAction {
    Download,
    Preview,
    AuthAttempt,
    AuthFail,
}

/// Quota utilisateur.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct UserQuota {
    pub owner_id: String,
    pub max_bytes: u64,
    pub used_bytes: u64,
    pub updated_at: String,
}

/// Dossier synchronise (sync selective).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SyncFolder {
    pub id: String,
    pub folder_id: String,
    pub local_path: String,
    pub is_active: bool,
    pub created_at: String,
}

/// Contenu d'un dossier (fichiers + sous-dossiers).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FolderContents {
    pub folder: Option<FolderEntry>,
    pub subfolders: Vec<FolderEntry>,
    pub files: Vec<FileEntry>,
}
```

### 3.3 Methodes CRUD standard (`MiyucloudDb`)

Convention de nommage alignee sur le pattern service (cf. `.cursor/skills/miyukini-services/SKILL.md`) :

| Methode | Signature |
|---------|-----------|
| `file_list(parent_id, owner_id)` | `-> Result<Vec<FileEntry>, DbError>` |
| `file_by_id(id)` | `-> Result<Option<FileEntry>, DbError>` |
| `file_create(data)` | `-> Result<FileEntry, DbError>` |
| `file_update(data)` | `-> Result<FileEntry, DbError>` |
| `file_delete(id)` | `-> Result<(), DbError>` |
| `file_trash(id)` | `-> Result<(), DbError>` |
| `file_restore(id)` | `-> Result<(), DbError>` |
| `file_search(owner_id, query)` | `-> Result<Vec<FileEntry>, DbError>` |
| `folder_list(parent_id, owner_id)` | `-> Result<Vec<FolderEntry>, DbError>` |
| `folder_by_id(id)` | `-> Result<Option<FolderEntry>, DbError>` |
| `folder_create(data)` | `-> Result<FolderEntry, DbError>` |
| `folder_update(data)` | `-> Result<FolderEntry, DbError>` |
| `folder_delete(id)` | `-> Result<(), DbError>` |
| `folder_contents(folder_id, owner_id)` | `-> Result<FolderContents, DbError>` |
| `share_link_create(data)` | `-> Result<ShareLink, DbError>` |
| `share_link_by_token(token)` | `-> Result<Option<ShareLink>, DbError>` |
| `share_link_revoke(id)` | `-> Result<(), DbError>` |
| `share_link_list(creator_id)` | `-> Result<Vec<ShareLink>, DbError>` |
| `share_link_increment_downloads(id)` | `-> Result<(), DbError>` |
| `share_permission_create(data)` | `-> Result<SharePermission, DbError>` |
| `share_permission_list(file_or_folder_id)` | `-> Result<Vec<SharePermission>, DbError>` |
| `share_permission_delete(id)` | `-> Result<(), DbError>` |
| `sync_peer_upsert(data)` | `-> Result<SyncPeer, DbError>` |
| `sync_peer_list()` | `-> Result<Vec<SyncPeer>, DbError>` |
| `sync_peer_by_cog_id(cog_id)` | `-> Result<Option<SyncPeer>, DbError>` |
| `vector_clock_get(file_id)` | `-> Result<Vec<VectorClockEntry>, DbError>` |
| `vector_clock_update(file_id, node_id, counter)` | `-> Result<(), DbError>` |
| `sync_conflict_create(data)` | `-> Result<SyncConflict, DbError>` |
| `sync_conflict_list_pending()` | `-> Result<Vec<SyncConflict>, DbError>` |
| `sync_conflict_resolve(id, status)` | `-> Result<(), DbError>` |
| `access_log_create(data)` | `-> Result<(), DbError>` |
| `access_log_list(share_link_id, limit)` | `-> Result<Vec<AccessLogEntry>, DbError>` |
| `quota_get(owner_id)` | `-> Result<UserQuota, DbError>` |
| `quota_update_used(owner_id, delta)` | `-> Result<(), DbError>` |

---

## 4. API REST

### 4.1 API interne (Central <-> miyucloud-server)

Base URL : `http://127.0.0.1:{port}/api` (port configurable, par defaut 11440)

Toutes les requetes internes portent le header `X-COG-Token` pour l'authentification locale.

#### 4.1.1 Fichiers

| Methode | Path | Body | Response | Description |
|---------|------|------|----------|-------------|
| `GET` | `/api/files?parent_id={id}` | - | `200 FolderContents` | Lister le contenu d'un dossier |
| `GET` | `/api/files/{id}` | - | `200 FileEntry` | Metadonnees d'un fichier |
| `GET` | `/api/files/{id}/download` | - | `200 stream` | Telecharger un fichier (dechiffre) |
| `POST` | `/api/files/upload` | `multipart/form-data` (file + parent_id) | `201 FileEntry` | Televerse un fichier |
| `PUT` | `/api/files/{id}` | `{ name?, parent_id? }` | `200 FileEntry` | Renommer/deplacer |
| `DELETE` | `/api/files/{id}` | - | `200 { trashed: true }` | Mettre en corbeille |
| `POST` | `/api/files/{id}/restore` | - | `200 FileEntry` | Restaurer depuis la corbeille |
| `GET` | `/api/files/search?q={query}` | - | `200 Vec<FileEntry>` | Rechercher des fichiers |

#### 4.1.2 Dossiers

| Methode | Path | Body | Response | Description |
|---------|------|------|----------|-------------|
| `POST` | `/api/folders` | `{ name, parent_id? }` | `201 FolderEntry` | Creer un dossier |
| `PUT` | `/api/folders/{id}` | `{ name?, parent_id? }` | `200 FolderEntry` | Renommer/deplacer |
| `DELETE` | `/api/folders/{id}` | - | `200` | Mettre en corbeille (recursif) |

#### 4.1.3 Partage

| Methode | Path | Body | Response | Description |
|---------|------|------|----------|-------------|
| `POST` | `/api/shares/link` | `{ file_id?, folder_id?, password?, expires_in_hours, max_downloads? }` | `201 ShareLink` | Creer un lien de partage externe |
| `GET` | `/api/shares/links` | - | `200 Vec<ShareLink>` | Lister mes liens de partage |
| `DELETE` | `/api/shares/links/{id}` | - | `200` | Revoquer un lien |
| `POST` | `/api/shares/permission` | `{ file_id?, folder_id?, grantee_id, grantee_type, permission }` | `201 SharePermission` | Partager avec un profil/tribu |
| `GET` | `/api/shares/permissions/{resource_id}` | - | `200 Vec<SharePermission>` | Lister les permissions d'une ressource |
| `DELETE` | `/api/shares/permissions/{id}` | - | `200` | Supprimer une permission |

#### 4.1.4 Corbeille

| Methode | Path | Body | Response | Description |
|---------|------|------|----------|-------------|
| `GET` | `/api/trash` | - | `200 { files, folders }` | Contenu de la corbeille |
| `POST` | `/api/trash/{id}/restore` | - | `200` | Restaurer un element |
| `DELETE` | `/api/trash/{id}` | - | `200` | Supprimer definitivement |
| `DELETE` | `/api/trash` | - | `200` | Vider la corbeille |

#### 4.1.5 Sync P2P

| Methode | Path | Body | Response | Description |
|---------|------|------|----------|-------------|
| `GET` | `/api/sync/peers` | - | `200 Vec<SyncPeer>` | Lister les pairs connus |
| `POST` | `/api/sync/peers` | `{ cog_id, public_key, display_name? }` | `201 SyncPeer` | Enregistrer/MAJ un pair |
| `GET` | `/api/sync/status` | - | `200 SyncStatus` | Etat general de la sync |
| `GET` | `/api/sync/conflicts` | - | `200 Vec<SyncConflict>` | Conflits en attente |
| `POST` | `/api/sync/conflicts/{id}/resolve` | `{ resolution: "local" / "remote" / "both" }` | `200` | Resoudre un conflit |
| `POST` | `/api/sync/manifest` | `{ peer_cog_id }` | `200 SyncManifest` | Demander le manifeste local pour diff |
| `POST` | `/api/sync/push` | `multipart (chunk_data + metadata)` | `200` | Recevoir un chunk d'un pair |

#### 4.1.6 Administration

| Methode | Path | Body | Response | Description |
|---------|------|------|----------|-------------|
| `GET` | `/api/admin/quota` | - | `200 UserQuota` | Mon quota |
| `GET` | `/api/admin/stats` | - | `200 StorageStats` | Statistiques stockage |
| `GET` | `/api/admin/access-log?limit={n}` | - | `200 Vec<AccessLogEntry>` | Journal d'acces |

### 4.2 Reponses d'erreur

Format standard JSON pour toutes les erreurs :

```json
{
    "error": {
        "code": "FILE_NOT_FOUND",
        "message": "Le fichier demande n'existe pas.",
        "details": null
    }
}
```

Codes HTTP utilises :
- `400` : Requete invalide (validation echouee)
- `401` : Non authentifie
- `403` : Acces refuse (permissions)
- `404` : Ressource introuvable
- `409` : Conflit (fichier deja existant, quota depasse)
- `413` : Fichier trop volumineux
- `429` : Rate limit depasse (surface web)
- `500` : Erreur interne

### 4.3 Types de reponse supplementaires

```rust
/// Etat global de la synchronisation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub is_syncing: bool,
    pub peers_online: u32,
    pub peers_total: u32,
    pub pending_uploads: u32,
    pub pending_downloads: u32,
    pub conflicts_pending: u32,
    pub last_sync_at: Option<String>,
}

/// Statistiques de stockage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_files: u64,
    pub total_folders: u64,
    pub total_size_bytes: u64,
    pub trashed_files: u64,
    pub trashed_size_bytes: u64,
    pub active_shares: u64,
    pub sync_peers: u64,
}
```

---

## 5. Protocole de synchronisation P2P

### 5.1 Principes fondamentaux (Decision D1)

- **Aucun noeud central** : chaque COG est un pair egal.
- **Horloges vectorielles** pour l'ordonnancement causal.
- **Delta sync par blocs** : seuls les blocs modifies sont transferes (chunks de 256 KB).
- **Chiffrement E2E** : le canal entre pairs est toujours chiffre (Decision D4).
- **Resilience aux interruptions** : reprise automatique des transferts interrompus.

### 5.2 Decouverte de pairs

#### 5.2.1 mDNS (LAN)

Service annonce : `_miyucloud._tcp.local.`

Enregistrement TXT :
```
cog_id=<UUID>
version=<semver>
port=<port_sync>
pubkey=<X25519_base64_tronque_8_chars>
```

Implementation via crate `mdns-sd`. Scan toutes les 30 secondes. Les pairs decouverts sont enregistres dans `cloud_sync_peers` avec `is_trusted = 0` jusqu'a approbation manuelle.

#### 5.2.2 Webway (WAN)

Fallback si mDNS ne trouve pas de pairs. Utilise le systeme MWS existant (`miyuwebway_tracker`) pour annoncer la presence et decouvrir les pairs distants. Le Webway sert uniquement de canal de signalisation -- les donnees transitent en direct entre pairs via TCP.

#### 5.2.3 Saisie manuelle

L'utilisateur peut saisir manuellement l'adresse IP et le port d'un pair. Utile en cas de mDNS bloque (reseaux d'entreprise).

### 5.3 Horloges vectorielles

```rust
/// Horloge vectorielle : HashMap<NodeId, compteur_logique>.
/// Chaque modification d'un fichier incremente le compteur du noeud local.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VectorClock {
    pub clocks: HashMap<String, u64>,
}

impl VectorClock {
    /// Cree une horloge vide.
    pub fn new() -> Self { ... }

    /// Incremente le compteur du noeud local.
    pub fn increment(&mut self, node_id: &str) { ... }

    /// Compare deux horloges. Retourne l'ordre causal.
    pub fn compare(&self, other: &VectorClock) -> ClockOrder { ... }

    /// Fusionne avec une horloge distante (max par composante).
    pub fn merge(&mut self, other: &VectorClock) { ... }
}

/// Resultat de la comparaison de deux horloges vectorielles.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClockOrder {
    /// self < other (other est plus recent)
    Before,
    /// self > other (self est plus recent)
    After,
    /// self == other (identiques)
    Equal,
    /// Ni avant ni apres -> CONFLIT
    Concurrent,
}
```

### 5.4 Resolution de conflits

Quand `VectorClock::compare` retourne `Concurrent` :

1. **Jamais de perte silencieuse** (invariant absolu).
2. Creer une copie de conflit : `filename.conflict-{node_id_court}-{timestamp}.ext`.
3. Enregistrer le conflit dans `cloud_sync_conflicts` avec status `Pending`.
4. Notifier l'utilisateur dans Central (indicateur visuel rouge).
5. L'utilisateur resout manuellement : garder local, garder distant, ou garder les deux.

### 5.5 Protocole de transfert

#### 5.5.1 Messages du protocole

```rust
/// Messages echanges entre pairs sync.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncMessage {
    /// Demande : "envoie-moi ton manifeste de l'etat de tes fichiers"
    ManifestRequest {
        sender_cog_id: String,
        folder_ids: Vec<String>,
    },
    /// Reponse : voici mon manifeste
    ManifestResponse {
        entries: Vec<ManifestEntry>,
    },
    /// Demande : "envoie-moi ces chunks"
    ChunkRequest {
        file_id: String,
        chunk_indices: Vec<u32>,
    },
    /// Reponse : voici un chunk (chiffre E2E)
    ChunkData {
        file_id: String,
        chunk_index: u32,
        data: Vec<u8>,       // Chiffre E2E
        checksum: String,    // SHA-256 du chunk clair
    },
    /// Notification : "j'ai modifie ce fichier"
    FileChanged {
        file_id: String,
        clock: VectorClock,
        checksum: String,
        size_bytes: u64,
    },
    /// Ack : "j'ai bien recu"
    Ack {
        message_id: String,
    },
}

/// Entree du manifeste sync : etat d'un fichier vu par un noeud.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestEntry {
    pub file_id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub checksum_sha256: String,
    pub size_bytes: u64,
    pub clock: VectorClock,
    pub updated_at: String,
}
```

#### 5.5.2 Flux de sync

```
1. Pair A decouvre Pair B (mDNS ou Webway)
2. A envoie ManifestRequest a B
3. B repond ManifestResponse
4. A compare les ManifestEntry avec son etat local :
   - Fichier absent localement -> ChunkRequest a B
   - Fichier plus recent chez B (clock B > clock A) -> ChunkRequest a B
   - Fichier plus recent chez A (clock A > clock B) -> A envoie FileChanged + ChunkData a B
   - Horloges concurrentes -> creation conflit
5. Les chunks sont transferes un par un avec Ack
6. Apres reception complete -> mise a jour horloge locale, mise a jour fichier
7. Si interruption -> reprise au dernier chunk non-acquitte
```

#### 5.5.3 Transport

- **Protocole** : TCP avec TLS mutuel (certificats auto-signes par COG).
- **Port** : configurable, par defaut 11441.
- **Taille chunk** : 256 KB (configurable).
- **Parallelisme** : max 4 chunks en vol simultanement.
- **Timeout** : 30 secondes par chunk, 5 minutes par fichier.
- **Reprise** : l'etat de transfert est persiste dans un fichier temporaire `.miyucloud_transfer_{file_id}.tmp`.

### 5.6 Boucle de sync (`sync::engine`)

```
loop {
    1. Decouverte pairs (scan mDNS toutes les 30s)
    2. Pour chaque pair en ligne et de confiance :
       a. Echanger les manifestes
       b. Calculer le diff
       c. Transferer les fichiers modifies (dans les deux sens)
       d. Resoudre ou signaler les conflits
    3. Watcher filesystem : detecter les modifications locales (notify crate)
    4. Mettre a jour les horloges vectorielles
    5. Dormir 10 secondes
}
```

---

## 6. Securite et chiffrement

### 6.1 Chiffrement at-rest (Decision D4)

**Algorithme** : ChaCha20-Poly1305 (AEAD).
**Justification** : Performant sur toutes les architectures (pas de dependance AES-NI), authentifie (detecte les corruptions), recommande par le NIST.

**Processus d'ecriture** :
```
1. Generer un nonce aleatoire de 12 bytes (via rand::OsRng)
2. Deriver la cle de fichier : HKDF-SHA256(master_key, file_id)
3. Chiffrer chaque chunk individuellement : ChaCha20-Poly1305(chunk, key, nonce)
4. Stocker : [nonce_12bytes | ciphertext | tag_16bytes] par chunk
5. Enregistrer le nonce dans cloud_files.encryption_iv (base64)
```

**Processus de lecture** :
```
1. Lire le nonce depuis cloud_files.encryption_iv
2. Deriver la cle : HKDF-SHA256(master_key, file_id)
3. Pour chaque chunk : dechiffrer et verifier le tag
4. Si tag invalide -> erreur IntegrityError (jamais de lecture silencieuse de donnees corrompues)
```

**Stockage physique des chunks** :
```
{storage_root}/
  chunks/
    {file_id_prefix_2chars}/
      {file_id}/
        chunk_0000.enc
        chunk_0001.enc
        ...
        meta.json          # Nonce, nombre de chunks, checksum original
```

### 6.2 Gestion des cles (Decision D4)

**Hierarchie des cles** :
```
Passphrase utilisateur (jamais stockee)
    |
    v  Argon2id (memory=64MB, iterations=3, parallelism=4)
    |
Master Key (256 bits, en memoire uniquement, jamais sur disque)
    |
    v  HKDF-SHA256(master_key, context="miyucloud-file-{file_id}")
    |
File Key (256 bits, derivee a la volee par fichier)
```

**Invariant zero-knowledge (P2 souhaite)** : La master key n'est JAMAIS ecrite sur disque. Elle est derivee de la passphrase a chaque demarrage du service. Si le service redemarrage, l'utilisateur doit re-saisir sa passphrase.

**Stockage du sel Argon2** : Le sel (16 bytes) est stocke dans KindMother (`cloud_crypto_salt` table). Il n'est PAS secret mais doit etre unique par utilisateur.

```sql
CREATE TABLE IF NOT EXISTS cloud_crypto_config (
    owner_id        TEXT PRIMARY KEY,
    argon2_salt     TEXT NOT NULL,              -- Base64, 16 bytes
    key_version     INTEGER NOT NULL DEFAULT 1, -- Pour rotation future
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);
```

**Verification de la passphrase** : A la saisie, deriver la master key, puis verifier un "canary" chiffre (petite valeur connue chiffree avec la master key et stockee dans `cloud_crypto_config`). Si le dechiffrement echoue, la passphrase est incorrecte.

### 6.3 Chiffrement E2E pour sync P2P (Decision D4)

**Echange de cles** : X25519 Diffie-Hellman ephemere.

**Processus d'etablissement de session** :
```
1. Pair A genere une paire ephemere X25519 (sk_a, pk_a)
2. Pair A envoie pk_a a Pair B
3. Pair B genere une paire ephemere X25519 (sk_b, pk_b)
4. Pair B envoie pk_b a Pair A
5. Les deux derivent : shared_secret = X25519(sk_local, pk_remote)
6. Deriver la cle de session : HKDF-SHA256(shared_secret, "miyucloud-sync-session")
7. Tous les messages de la session sont chiffres avec ChaCha20-Poly1305(session_key)
```

**Rotation** : Nouvelle paire ephemere a chaque session de sync (Perfect Forward Secrecy).

**Verification d'identite** : Le COG ID du pair est derive du hash SHA-256 de sa cle publique statique (stockee dans `cloud_sync_peers.public_key`). L'utilisateur doit approuver manuellement un nouveau pair (affichage du fingerprint dans Central).

### 6.4 Dechiffrement streaming pour partage web (Decision D4)

Quand un destinataire externe telecharge un fichier partage via la surface web :

```
1. Verifier le token de partage (valide, non expire, non revoque)
2. Verifier le mot de passe si requis
3. Deriver la cle du fichier : HKDF-SHA256(master_key, file_id)
4. Lire les chunks un par un depuis le stockage
5. Dechiffrer chaque chunk en streaming (sans charger tout le fichier en memoire)
6. Envoyer le chunk dechiffre dans la reponse HTTP (chunked transfer encoding)
```

**Securite** : Le fichier est dechiffre cote serveur (le COG). Le destinataire externe recoit le fichier en clair via HTTPS. C'est un compromis necessaire car le destinataire n'a pas de cle de chiffrement.

### 6.5 Modele de menaces simplifie

| Menace | Severite | Mitigation |
|--------|----------|------------|
| **Acces physique au disque** | HAUTE | Chiffrement at-rest (ChaCha20-Poly1305). Sans la passphrase, les fichiers sont illisibles. |
| **Interception reseau (LAN)** | HAUTE | TLS mutuel entre pairs. E2E ChaCha20-Poly1305 pour les donnees sync. |
| **Interception reseau (WAN)** | HAUTE | Meme E2E que LAN. Le Webway ne voit que du trafic chiffre. |
| **Brute force passphrase** | MOYENNE | Argon2id avec parametres elevees (64 MB, 3 iter). Rate limiting sur les tentatives. |
| **Lien de partage compromis** | MOYENNE | Expiration obligatoire. Mot de passe optionnel. Revocation instantanee. Rate limiting. |
| **Surface web : enumeration** | MOYENNE | Tokens aleatoires 32 bytes (256 bits d'entropie). Pas de listing. Pas d'URL predictibles. |
| **Surface web : DDoS** | MOYENNE | Rate limiting agressif (tower-governor). Taille max configurable. |
| **Pair malveillant (sync)** | FAIBLE | Approbation manuelle des pairs. Verification fingerprint. Horloges vectorielles detectent les incoherences. |
| **Perte de passphrase** | HAUTE | Phase C : mecanisme de recovery (cles de secours papier). MVP : aucun recovery (documenter clairement). |

### 6.6 Conformite RGPD

- Les IP des accedants externes sont **hashees** (SHA-256 avec sel) avant stockage dans le journal d'acces.
- Les User-Agent sont **tronques** a 100 caracteres.
- Le journal d'acces est purgeable par l'utilisateur (droit a l'effacement).
- Les fichiers supprimes definitivement sont **ecrases** sur le filesystem (overwrite avec zeros avant suppression).
- Aucune donnee n'est transmise a un tiers (LOI-1).

---

## 7. Surface web de partage

### 7.1 Architecture du serveur web embarque

Le serveur web est un sous-module d'`apps/miyucloud/` utilisant axum. Il ecoute sur un port separe de l'API interne (par defaut 11442) et ne sert que les routes de partage externe.

```
apps/miyucloud/src/main.rs :
  - Serveur 1 (API interne) : 127.0.0.1:11440 (HTTP, localhost uniquement)
  - Serveur 2 (Surface web) : 0.0.0.0:11442 (HTTPS, expose au reseau)
```

Le serveur 2 est optionnel : si l'utilisateur ne souhaite pas exposer de surface web, il peut le desactiver dans la configuration.

### 7.2 Routes surface web

| Methode | Path | Description | Auth |
|---------|------|-------------|------|
| `GET` | `/share/{token}` | Page de telechargement (HTML) | Token valide |
| `POST` | `/share/{token}/auth` | Verification mot de passe | Token + password |
| `GET` | `/share/{token}/download` | Telechargement fichier (stream) | Token + session cookie |
| `GET` | `/share/{token}/preview` | Apercu image/PDF (inline) | Token + session cookie |
| `GET` | `/health` | Health check (pas d'info sensible) | Aucune |

Toute autre route retourne `404 Not Found` (pas de listing, pas de redirection).

### 7.3 Middleware et securites (8 mesures du brief D2)

| # | Mesure | Implementation |
|---|--------|---------------|
| 1 | **Rate limiting agressif** | `tower_governor` : 10 requetes/minute par IP pour `/share/*`, 3 tentatives de mot de passe/minute |
| 2 | **Auth par lien unique** | Token 32 bytes hex (64 chars), genere via `rand::OsRng`, non predictible |
| 3 | **Expiration obligatoire** | Champ `expires_at` NOT NULL. Verification a chaque requete. Minimum 1h, maximum 30 jours (configurable) |
| 4 | **Sandboxing** | Le router web n'a acces qu'a la table `cloud_share_links` et aux fichiers explicitement partages. Aucun acces au reste du COG. Implementation : le handler recoit un `SandboxedStore` qui ne peut lire que les fichiers partages. |
| 5 | **Taille max configurable** | Header `Content-Length` verifie. Defaut : 4 GB max par telechargement. |
| 6 | **Logging complet** | Chaque acces est enregistre dans `cloud_access_log` (IP hashee, UA, action, succes/echec). |
| 7 | **Revocation instantanee** | `DELETE /api/shares/links/{id}` met `is_revoked = 1`. Tout acces subsequent retourne 410 Gone. |
| 8 | **HTTPS obligatoire** | Certificat auto-signe genere au premier demarrage (rcgen). Toute connexion HTTP est refusee (pas de redirection, juste un refus). L'utilisateur peut fournir son propre certificat Let's Encrypt. |

### 7.4 UI web statique

La page de partage est une page HTML/CSS/JS **statique et minimale** servie depuis `static_assets/`. Pas de framework JS. Pas de dependance CDN (LOI-1).

Contenu de la page :
- Nom du fichier/dossier partage
- Taille du fichier
- Bouton "Telecharger"
- Champ mot de passe (si requis)
- Message d'expiration ("Ce lien expire le...")
- Logo Miyukini (petit, discret)
- Pas de navigation, pas de listing d'autres fichiers

Design : fond sombre, typographie lisible, responsive (mobile-friendly), accessible (ARIA labels).

### 7.5 Configuration TLS

```rust
/// Configuration TLS pour la surface web.
pub struct TlsConfig {
    /// Chemin vers le certificat PEM (auto-genere si absent)
    pub cert_path: PathBuf,
    /// Chemin vers la cle privee PEM
    pub key_path: PathBuf,
    /// true = generer un certificat auto-signe au premier demarrage
    pub auto_generate: bool,
}
```

Au premier demarrage, si aucun certificat n'est fourni :
1. Generer une paire RSA 2048 avec `rcgen`.
2. Creer un certificat auto-signe valide 365 jours.
3. Stocker dans `{cog_data}/miyucloud/tls/cert.pem` et `key.pem`.
4. Avertir l'utilisateur que le certificat est auto-signe (les navigateurs afficheront un warning).

---

## 8. Migration Jay1Tribu

### 8.1 Fonctionnalites a absorber (Decision D3)

Jay1Tribu expose les fonctionnalites suivantes (analyse de `crates/jay1tribu/src/`) :

| Fonctionnalite | Migre vers MiyuCloud ? | Notes |
|---------------|------------------------|-------|
| `send_file` (envoi fichier dans un salon) | **OUI** | Remplace par le partage MiyuCloud |
| `send_message` (envoi message texte) | **NON** | Reste dans Jay1Tribu ou futur service chat |
| `create_tribe` / `invite_to_tribe` | **NON** | Reste dans Jay1Tribu |
| `create_salon` (salons de discussion) | **NON** | Reste dans Jay1Tribu |
| `get_friends_list` / presence | **NON** | Reste dans Jay1Tribu |
| `check_can_transfer_file` (verification amis) | **OUI** | Absorbe dans la logique de permissions MiyuCloud |
| `message_attachment_create` (pieces jointes) | **OUI** | Les attachments fichiers migrent vers MiyuCloud |

**Resume** : MiyuCloud absorbe uniquement la fonctionnalite de **transfert de fichiers** de Jay1Tribu. Le chat, les tribus, les salons, la presence et la liste d'amis **restent dans Jay1Tribu**.

### 8.2 Plan de migration donnees

```rust
/// Module de migration Jay1Tribu -> MiyuCloud.
///
/// @id: miyucloud_jay1tribu_migration
/// @do: migrate_file_transfers_from_jay1tribu
/// @role: domain
/// @layer: domain

/// Migre les pieces jointes de Jay1Tribu vers le stockage MiyuCloud.
/// Pour chaque message avec attachment dans Jay1Tribu :
/// 1. Lire le fichier local reference par l'attachment
/// 2. Creer un FileEntry dans MiyuCloud (chiffre at-rest)
/// 3. Enregistrer la correspondance dans cloud_jay1tribu_migrations
/// 4. NE PAS supprimer l'original dans Jay1Tribu (migration non-destructive)
pub fn migrate_jay1tribu_attachments(
    jay1tribu_db: &Jay1TribuDb,
    miyucloud_db: &MiyucloudDb,
    storage: &dyn StorageBackend,
    crypto: &CryptoProvider,
    owner_id: &str,
) -> Result<MigrationReport, MiyucloudError> { ... }

/// Rapport de migration.
pub struct MigrationReport {
    pub files_migrated: u32,
    pub files_skipped: u32,      // Fichier source introuvable
    pub files_already_migrated: u32,
    pub errors: Vec<String>,
}
```

### 8.3 Depreciation progressive

| Etape | Action | Declencheur | Fichier concerne |
|-------|--------|-------------|------------------|
| 1 | Ajouter `#[deprecated]` sur `send_file` dans `crates/jay1tribu/src/domain.rs` | Debut dev MiyuCloud (Phase A) | `crates/jay1tribu/src/domain.rs` |
| 2 | Ajouter un warning dans l'UI Jay1Tribu de Central | Phase A | `apps/central/src/services/jay1tribu/mod.rs` |
| 3 | Implementer `jay1tribu_migration.rs` dans MiyuCloud | Phase B | `crates/miyucloud/src/domain/jay1tribu_migration.rs` |
| 4 | Rediriger `send_file` vers MiyuCloud (proxy transparent) | Phase B | `crates/jay1tribu/src/domain.rs` |
| 5 | Supprimer `send_file` et `check_can_transfer_file` de Jay1Tribu | Phase C | `crates/jay1tribu/src/domain.rs`, `crates/jay1tribu/src/lib.rs` |

---

## 9. Integration Central (Dioxus 0.6)

### 9.1 Enregistrement dans le catalogue

Ajouter MiyuCloud dans `OFFICIAL_CATALOG` dans `apps/central/src/state.rs` :

```rust
ServiceMeta {
    id: "miyucloud",
    name: "MiyuCloud",
    description: "Cloud prive — fichiers, sync, partage securise",
    icon: "\u{2601}",  // Cloud emoji
    service_type: ServiceType::InterCog,  // P2P + surface web
    is_favorite: true,
},
```

### 9.2 Pages et composants UI

#### 9.2.1 `MiyuCloudView` (point d'entree)

Layout 2 panneaux : sidebar (arborescence) + zone principale (explorateur).

```
+------------------------------------------+
| MiyuCloud - Mon Cloud                     |
| [Sync: 2 pairs en ligne] [Parametres]    |
+----------+-------------------------------+
|          |                               |
| DOSSIERS | FICHIERS                      |
|          |                               |
| > Photos | [icon] photo1.jpg  2.3 MB     |
|   > 2026 | [icon] photo2.jpg  1.8 MB     |
| > Docs   | [icon] document.pdf 500 KB    |
| > Projets|                               |
|          | [Upload] [Nouveau dossier]     |
| PARTAGES |                               |
| > Actifs | Lien 1 (expire dans 2j)       |
|          | Lien 2 (expire dans 5h)       |
| CORBEILLE|                               |
|          |                               |
+----------+-------------------------------+
```

#### 9.2.2 Composants

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `MiyuCloudView` | `mod.rs` | Layout principal 2 panneaux |
| `CloudSidebar` | `sidebar.rs` | Arborescence dossiers + sections Partages/Corbeille |
| `FileExplorer` | `explorer.rs` | Grille/liste de fichiers avec tri, selection multiple |
| `FileUpload` | `upload.rs` | Zone drag & drop + bouton upload, barre de progression |
| `FileDetail` | `file_detail.rs` | Panel detail : metadonnees, apercu, actions (partager, supprimer, telecharger) |
| `ShareDialog` | `share_dialog.rs` | Dialog de creation de lien de partage (expiration, password, permissions) |
| `TrashView` | `trash_view.rs` | Liste des elements en corbeille avec restauration/purge |
| `SyncStatus` | `sync_status.rs` | Badge dans le header : nombre de pairs, etat sync, conflits |
| `CloudSettings` | `settings.rs` | Parametres : chemin stockage, quota, passphrase, certificat TLS |
| `CloudState` | `state.rs` | `MiyuCloudState` : Signal Dioxus pour l'etat local de l'UI |
| `CloudComponents` | `components.rs` | Composants reutilisables : Breadcrumb, FileIcon, SizeLabel |

### 9.3 State management

```rust
/// Etat local de l'UI MiyuCloud dans Central.
#[derive(Debug, Clone)]
pub struct MiyuCloudState {
    /// Dossier actuellement affiche (None = racine)
    pub current_folder_id: Option<String>,
    /// Contenu du dossier courant
    pub current_contents: FolderContents,
    /// Fichier selectionne (pour le panel detail)
    pub selected_file: Option<FileEntry>,
    /// Mode d'affichage (grille ou liste)
    pub view_mode: ViewMode,
    /// Tri actif
    pub sort_by: SortField,
    pub sort_asc: bool,
    /// Upload en cours
    pub upload_progress: Option<UploadProgress>,
    /// Etat de la sync
    pub sync_status: SyncStatus,
    /// Dialog de partage ouvert
    pub share_dialog_open: bool,
    /// Breadcrumb (chemin du dossier courant)
    pub breadcrumb: Vec<BreadcrumbItem>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ViewMode { Grid, List }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SortField { Name, Size, Date, Type }

#[derive(Debug, Clone)]
pub struct UploadProgress {
    pub file_name: String,
    pub bytes_sent: u64,
    pub bytes_total: u64,
}

#[derive(Debug, Clone)]
pub struct BreadcrumbItem {
    pub id: Option<String>,
    pub name: String,
}
```

### 9.4 Navigation

MiyuCloud est accessible depuis Central comme tout service : clic sur l'icone dans le Salon ou la Bibliotheque ouvre un onglet `OpenTab { service_id: Some("miyucloud"), ... }`. Le rendu est delegue a `MiyuCloudView` dans `apps/central/src/services/miyucloud/mod.rs`.

Pattern identique a JayKonta, JayKoa, JayFestival : un `mod.rs` qui exporte le composant racine, reference dans `apps/central/src/services/service_view.rs`.

### 9.5 Communication Central <-> miyucloud-server

Central communique avec le serveur MiyuCloud via HTTP localhost (`http://127.0.0.1:11440/api/`). Pattern identique a la communication avec le LLM bridge (`apps/central/src/llm_client.rs`).

```rust
/// Client HTTP pour communiquer avec miyucloud-server.
pub struct MiyuCloudClient {
    base_url: String,         // "http://127.0.0.1:11440"
    cog_token: String,        // Token d'authentification locale
    http: reqwest::Client,
}

impl MiyuCloudClient {
    pub fn new(port: u16, cog_token: &str) -> Self { ... }
    pub async fn list_files(&self, parent_id: Option<&str>) -> Result<FolderContents> { ... }
    pub async fn upload_file(&self, parent_id: Option<&str>, file_path: &Path) -> Result<FileEntry> { ... }
    pub async fn download_file(&self, file_id: &str) -> Result<Vec<u8>> { ... }
    pub async fn create_share_link(&self, req: CreateShareRequest) -> Result<ShareLink> { ... }
    // ... etc.
}
```

---

## 10. Dependances Rust

### 10.1 Crates externes avec justification

| Crate | Version | Usage | Justification LOI-1 |
|-------|---------|-------|---------------------|
| `chacha20poly1305` | 0.10 | Chiffrement at-rest et E2E | Pur Rust, pas de binding C. Fonctionne offline. |
| `x25519-dalek` | 2 | Echange de cles Diffie-Hellman | Pur Rust, reference crypto. |
| `argon2` | 0.5 | Derivation cle depuis passphrase | Pur Rust, recommande OWASP. |
| `sha2` | 0.10 | Checksums SHA-256 | Pur Rust, standard. |
| `rand` | 0.8 | Generation aleatoire (nonces, tokens) | Pur Rust, utilise OsRng. |
| `axum` | 0.8 | Serveur HTTP (API + surface web) | Ecosysteme tokio, deja utilise dans le projet (origin). |
| `tower-http` | 0.6 | Middleware HTTP (CORS, trace, limit) | Companion de axum. |
| `tower_governor` | 0.4 | Rate limiting | Basee sur governor, in-memory, pas de dependance externe. |
| `rustls` | 0.23 | TLS pour HTTPS surface web | Pur Rust, pas de OpenSSL. LOI-1 compatible. |
| `tokio-rustls` | 0.26 | Async TLS | Bridge tokio + rustls. |
| `rcgen` | 0.13 | Generation certificat auto-signe | Pur Rust, utilise ring. |
| `mdns-sd` | 0.11 | Decouverte pairs mDNS | Pur Rust, zero dependance externe runtime. |
| `notify` | 6 | Watcher filesystem (sync engine) | Pur Rust, multi-plateforme. Phase C. |
| `reqwest` | 0.12 | Client HTTP (Central -> miyucloud-server) | Deja utilise dans le projet. |
| `rusqlite` | 0.32 | SQLite direct | Deja utilise dans tous les services. Feature flag. |
| `serde` / `serde_json` | 1 | Serialisation | Standard du projet. |
| `uuid` | 1 | Generation UUIDs v4 | Standard du projet. |
| `chrono` | 0.4 | Timestamps ISO 8601 | Standard du projet. |
| `thiserror` | 2 | Types d'erreur | Standard du projet. |
| `tracing` | 0.1 | Logging | Standard du projet. |

### 10.2 Dependances internes (crates workspace)

| Crate | Usage |
|-------|-------|
| `miyukini-kernel` | Substrat technique (IDs, configuration) |
| `kindmother` | Persistance KindMother |
| `kindmother-client` | Client KindMother (feature kindmother-only) |
| `kindmother-db-key` | Chiffrement DB (feature db-encryption) |
| `jay1tribu` | Migration (lecture des donnees Jay1Tribu) -- dependance de `miyucloud` uniquement pour la migration |

### 10.3 Conformite LOI-1

Aucune des dependances listees ne necessite un service externe a l'execution :
- Pas de serveur de base de donnees externe (SQLite embarque)
- Pas de serveur de cache externe
- Pas de CDN (assets web statiques embarques)
- Pas de service de certificat externe (auto-generation)
- Pas de serveur mDNS externe (protocole multicast local)

Le service fonctionne integralement en mode deconnecte. La sync P2P et la surface web sont des fonctionnalites "connectees" mais non requises (LOI-2).

---

## 11. Phasage technique detaille

### 11.1 Phase A -- MVP Stockage local chiffre

**Objectif** : L'utilisateur peut naviguer, uploader, downloader des fichiers chiffres via Central.

**Scope exact** :

| Module | Fichiers | Description |
|--------|----------|-------------|
| `crates/miyucloud/src/lib.rs` | 1 | Point d'entree, re-exports |
| `crates/miyucloud/src/admin_cell.rs` | 1 | Metadonnees gouvernance |
| `crates/miyucloud/src/context.rs` | 1 | GovernedContext |
| `crates/miyucloud/src/errors.rs` | 1 | MiyucloudError |
| `crates/miyucloud/src/data/` | 4 | mod.rs, types.rs, kindmother_db.rs, kindmother_client_db.rs |
| `crates/miyucloud/src/storage/` | 4 | mod.rs, local_fs.rs, chunking.rs, integrity.rs |
| `crates/miyucloud/src/crypto/` | 3 | mod.rs, at_rest.rs, keys.rs |
| `crates/miyucloud/src/domain/` | 3 | mod.rs, file_ops.rs, trash.rs |
| `crates/miyucloud/src/auth/` | 2 | mod.rs, permissions.rs |
| `crates/miyucloud/Cargo.toml` | 1 | Configuration crate |
| `apps/miyucloud/src/` | 4 | main.rs, config.rs, api/mod.rs, api/files.rs, api/folders.rs, api/trash.rs, api/auth.rs |
| `apps/miyucloud/Cargo.toml` | 1 | Configuration app |
| `apps/central/src/services/miyucloud/` | 7 | mod.rs, sidebar.rs, explorer.rs, upload.rs, file_detail.rs, state.rs, components.rs |
| `apps/central/src/state.rs` | 1 | Ajout MiyuCloud dans OFFICIAL_CATALOG |
| `crates/jay1tribu/src/domain.rs` | 1 | Ajout `#[deprecated]` sur `send_file` |

**Total Phase A** : ~34 fichiers

**Fonctionnalites couvertes** : F01-F05, F10, F28, F37, F44, F46, F49

**Tests Phase A** :
- `cargo test -p miyucloud` : Tests unitaires data, storage, crypto, domain
- `cargo test -p miyucloud-server` : Tests integration API (upload, download, list, delete, trash)
- `cargo clippy --workspace -- -D warnings` : Zero warning
- Tests manuels : upload/download via Central UI

### 11.2 Phase B -- Surface web + Partage

**Objectif** : Partager des fichiers avec des utilisateurs hors COG via surface web securisee. Partage interne Tribu.

**Scope exact** :

| Module | Fichiers | Description |
|--------|----------|-------------|
| `crates/miyucloud/src/auth/web_tokens.rs` | 1 | Tokens temporaires partage web |
| `crates/miyucloud/src/crypto/streaming.rs` | 1 | Dechiffrement streaming |
| `crates/miyucloud/src/domain/sharing.rs` | 1 | Partage interne Tribu |
| `crates/miyucloud/src/domain/external_share.rs` | 1 | Liens partage web |
| `crates/miyucloud/src/domain/quota.rs` | 1 | Gestion quotas |
| `crates/miyucloud/src/domain/jay1tribu_migration.rs` | 1 | Migration Jay1Tribu |
| `apps/miyucloud/src/api/shares.rs` | 1 | API partages |
| `apps/miyucloud/src/web_surface/` | 6 | mod.rs, share_page.rs, rate_limiter.rs, access_log.rs, sandbox.rs, tls.rs |
| `apps/miyucloud/src/web_surface/static_assets/` | 3 | index.html, style.css, download.js |
| `apps/central/src/services/miyucloud/share_dialog.rs` | 1 | Dialog partage |
| `apps/central/src/services/miyucloud/trash_view.rs` | 1 | Vue corbeille amelioree |
| `apps/central/src/services/miyucloud/settings.rs` | 1 | Parametres (quota, TLS) |

**Total Phase B** : ~19 fichiers supplementaires

**Fonctionnalites couvertes** : F17-F20, F22-F26, F31-F32, F36, F38-F43, F48

**Tests Phase B** :
- Tests unitaires : tokens, rate limiting, sandboxing
- Tests integration : creation lien partage, telechargement via token, expiration, revocation
- Tests securite : tentative d'acces sans token, brute force mot de passe, enumeration
- Test migration Jay1Tribu : migration des attachments existants
- `cargo clippy --workspace -- -D warnings`

### 11.3 Phase C -- Synchronisation P2P

**Objectif** : Sync automatique chiffree E2E entre les machines de l'utilisateur en pair-a-pair.

**Scope exact** :

| Module | Fichiers | Description |
|--------|----------|-------------|
| `crates/miyucloud/src/sync/` | 7 | mod.rs, engine.rs, vector_clock.rs, conflict.rs, manifest.rs, peer_discovery.rs, transport.rs, protocol.rs |
| `crates/miyucloud/src/crypto/e2e.rs` | 1 | Chiffrement E2E sync |
| `apps/miyucloud/src/api/sync_api.rs` | 1 | Endpoints sync P2P |
| `apps/central/src/services/miyucloud/sync_status.rs` | 1 | Indicateur sync dans Central |
| `crates/miyucloud/src/export/` | 2 | mod.rs, archive.rs |

**Total Phase C** : ~12 fichiers supplementaires

**Fonctionnalites couvertes** : F06-F09, F11-F16, F27, F29-F30, F33-F35, F45, F47

**Tests Phase C** :
- Tests unitaires : horloges vectorielles (comparaison, merge, conflit)
- Tests unitaires : decouverte pairs (mock mDNS)
- Tests integration : sync bidirectionnelle entre 2 instances de test
- Tests integration : creation et resolution de conflit
- Tests E2E : echange de cles X25519, chiffrement/dechiffrement session
- `cargo test --workspace` complet
- `cargo clippy --workspace -- -D warnings`

### 11.4 Recapitulatif phasage

| Phase | Fichiers | Fonctionnalites | Sessions estimees |
|-------|----------|-----------------|-------------------|
| **A** | ~34 | F01-F05, F10, F28, F37, F44, F46, F49 | 12-20 |
| **B** | ~19 | F17-F26, F31-F32, F36, F38-F43, F48 | 8-14 |
| **C** | ~12 | F06-F16, F27, F29-F30, F33-F35, F45, F47 | 10-18 |
| **Total** | ~65 | F01-F50 | 30-52 |

---

## Annexe A -- Annotations MSCM

Tous les fichiers du crate `miyucloud` doivent porter les annotations MSCM suivantes dans le header :

```rust
//! @id: miyucloud_{module_name}
//! @do: {description_action}
//! @role: {data|domain|crypto|sync|storage|auth|api|web}
//! @layer: {domain|infra|presentation}
//! @human: {description_lisible}
```

Index MIP a generer dans `mscm_index/miyucloud/` apres implementation.

## Annexe B -- Invariants de securite

Les invariants suivants DOIVENT etre verifies a chaque commit et dans les tests :

| # | Invariant | Verification |
|---|-----------|-------------|
| INV-1 | Aucun fichier n'est stocke en clair sur le filesystem | Test : lire un chunk .enc, verifier qu'il n'est pas du contenu lisible |
| INV-2 | La master key n'est jamais ecrite sur disque | Grep : aucune ecriture de `master_key` dans un fichier/DB |
| INV-3 | Les tokens de partage sont cryptographiquement aleatoires | Test : generer 1000 tokens, verifier l'unicite et l'entropie |
| INV-4 | Expiration obligatoire sur les liens de partage | Test : tenter de creer un ShareLink sans expires_at -> erreur |
| INV-5 | La surface web ne peut acceder qu'aux fichiers partages | Test : SandboxedStore refuse l'acces a un fichier non partage |
| INV-6 | Les IP sont hashees dans le journal d'acces | Test : lire access_log, verifier que accessor_ip est un hash |
| INV-7 | Jamais de perte silencieuse en cas de conflit sync | Test : creer un conflit concurrent, verifier qu'il genere une entree SyncConflict |
| INV-8 | `unsafe_code = "forbid"` dans tous les Cargo.toml | Verification automatique dans CI |
| INV-9 | Pas de `unwrap()` en production | `cargo clippy` + grep |
| INV-10 | Verification d'integrite apres dechiffrement | Test : corrompre un chunk chiffre, verifier que le dechiffrement echoue |

## Annexe C -- Erreurs du module (`errors.rs`)

```rust
//! Types d'erreur MiyuCloud.
//!
//! @id: miyucloud_errors
//! @do: define_miyucloud_error_types
//! @role: errors
//! @layer: domain

use thiserror::Error;

#[derive(Debug, Error)]
pub enum MiyucloudError {
    #[error("Erreur de base de donnees: {0}")]
    Database(#[from] DbError),

    #[error("Fichier introuvable: {0}")]
    FileNotFound(String),

    #[error("Dossier introuvable: {0}")]
    FolderNotFound(String),

    #[error("Quota depasse: {used} / {max} octets")]
    QuotaExceeded { used: u64, max: u64 },

    #[error("Erreur de chiffrement: {0}")]
    Encryption(String),

    #[error("Erreur de dechiffrement: {0}")]
    Decryption(String),

    #[error("Integrite compromise: checksum attendu {expected}, obtenu {actual}")]
    IntegrityError { expected: String, actual: String },

    #[error("Passphrase invalide")]
    InvalidPassphrase,

    #[error("Lien de partage invalide ou expire")]
    ShareLinkInvalid,

    #[error("Lien de partage revoque")]
    ShareLinkRevoked,

    #[error("Mot de passe de partage incorrect")]
    SharePasswordIncorrect,

    #[error("Acces refuse: {0}")]
    AccessDenied(String),

    #[error("Pair de synchronisation inconnu: {0}")]
    UnknownPeer(String),

    #[error("Conflit de synchronisation: {0}")]
    SyncConflict(String),

    #[error("Erreur de transport: {0}")]
    Transport(String),

    #[error("Erreur d'entree/sortie: {0}")]
    Io(#[from] std::io::Error),

    #[error("Erreur de serialisation: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Configuration invalide: {0}")]
    Config(String),

    #[error("Fonctionnalite non implementee: {0}")]
    Unimplemented(String),
}

/// Alias de resultat pour MiyuCloud.
pub type MiyucloudResult<T> = Result<T, MiyucloudError>;
```

---

**Fin de la specification technique P1.**

**Quality Gate P1** : Ce document doit etre valide par l'utilisateur et George (audit) avant passage en P2 (plan atomique).

**Prochain jalon** : Denis redige le plan d'execution atomique P2 avec taches de 2-5 minutes, assignees a Francois (back-end) et Lise (front-end).
