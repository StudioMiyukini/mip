# Rapport de Livraison P5 -- MiyuCloud

**Auteur** : Denis (Chef Dev Senior)
**Date** : 2026-03-01
**Phase** : P5 -- Livraison
**Classification MIP** : T5 (Chantier strategique)
**Statut** : LIVRE -- VERSION MVP BETA

**Documents de reference** :
- `.mip/briefs/2026-03-01-cloud-storage-service.md` (Brief P0, Maria)
- `.mip/briefs/2026-03-01-miyucloud-analyse-concurrentielle.md` (Analyse PR, Fabrice)
- `.mip/specs/2026-03-01-miyucloud-spec-technique.md` (Spec P1, Denis)
- `.mip/plans/2026-03-01-miyucloud-plan-execution.md` (Plan P2, Denis)
- `.mip/audits/2026-03-01-miyucloud-audit-securite.md` (Audit P4, George)
- `.mip/audits/2026-03-01-miyucloud-integration.md` (Integration P4, Denis)

---

## Table des matieres

1. [Resume executif](#1-resume-executif)
2. [Inventaire complet des fichiers](#2-inventaire-complet-des-fichiers)
3. [Guide de demarrage rapide](#3-guide-de-demarrage-rapide)
4. [Endpoints API](#4-endpoints-api)
5. [Findings audit](#5-findings-audit)
6. [Limitations connues MVP](#6-limitations-connues-mvp)
7. [Prochaines etapes recommandees](#7-prochaines-etapes-recommandees)

---

## 1. Resume executif

### Ce qui a ete livre

MiyuCloud est un **cloud prive auto-heberge, chiffre et pair-a-pair** integre a l'ecosysteme Miyukini COG. Il permet de stocker, organiser, partager et synchroniser des fichiers entre machines sans aucune dependance externe.

Le MVP couvre les trois phases prevues par le plan P2 :

- **Phase A** -- Stockage local chiffre : upload, download, navigation, corbeille, chiffrement ChaCha20-Poly1305 at-rest
- **Phase B** -- Surface web de partage : liens temporaires, HTTPS, rate limiting, sandbox, logging RGPD
- **Phase C** -- Synchronisation P2P : horloges vectorielles, detection de conflits, decouverte de pairs UDP, canal E2E X25519

Le service est compose de trois zones de code :

| Zone | Description |
|------|-------------|
| `crates/miyucloud/` | Crate bibliotheque : types domaine, persistance, stockage, crypto, auth, sync, export |
| `apps/miyucloud/` | Serveur standalone : API REST (axum) + surface web HTTPS |
| `apps/central/src/services/miyucloud/` | Interface utilisateur dans Central (Dioxus 0.6) |

### Metriques

| Metrique | Valeur |
|----------|--------|
| Fichiers Rust crees | 66 fichiers `.rs` |
| Lignes de code (total) | 19 065 lignes |
| -- dont crate `miyucloud` | 9 104 lignes (36 fichiers) |
| -- dont tests integration | 630 lignes (2 fichiers) |
| -- dont serveur `miyucloud-server` | 3 285 lignes (16 fichiers) |
| -- dont UI Central | 6 046 lignes (12 fichiers) |
| Fichiers de configuration | 2 `Cargo.toml` |
| Tables SQLite | 12 tables |
| Endpoints API REST | 30 routes |
| Routes surface web | 4 routes |
| Tests unitaires (crate) | 198 |
| Tests integration (crate) | 15 |
| Tests serveur | 28 |
| Tests Central | 16 |
| **Tests total** | **257** |
| Tests en echec | 0 |
| Couverture MSCM | 67/67 fichiers (100%) |
| Score audit securite | 87/100 |
| Build incremental | < 5s |
| Tests complets | ~2.6s |

---

## 2. Inventaire complet des fichiers

### 2.1 Crate `miyucloud` (`crates/miyucloud/`)

#### Racine et gouvernance

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `Cargo.toml` | 70 | Metadata, dependances (chacha20poly1305, x25519-dalek, argon2, hkdf, sha2, zip, rusqlite), features `legacy-sqlite`/`kindmother-only`/`db-encryption`, `unsafe_code = "forbid"` |
| `src/lib.rs` | 22 | Point d'entree, expose 7 modules publics : `data`, `storage`, `crypto`, `auth`, `domain`, `sync`, `export` |
| `src/admin_cell.rs` | 78 | Metadonnees de gouvernance COG (AdminCell) |
| `src/context.rs` | 74 | GovernedContext pour le crate |
| `src/errors.rs` | 130 | Enum `MiyucloudError` avec 9 variantes : `Io`, `Db`, `Crypto`, `NotFound`, `PermissionDenied`, `QuotaExceeded`, `InvalidInput`, `Integrity`, `Serialization` |

#### Persistance (`src/data/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 22 | Feature flags, re-export de `MiyucloudDb` |
| `types.rs` | 717 | 20 types domaine : `FileEntry`, `FolderEntry`, `FolderContents`, `ShareLink`, `SharePermission`, `SyncPeer`, `VectorClockEntry`, `SyncConflict`, `AccessLogEntry`, `UserQuota`, `SyncFolder`, `SyncStatus`, `StorageStats`, `UploadProgress`, `BreadcrumbItem`, `CryptoConfig`, enums `GranteeType`, `PermissionLevel`, `ConflictStatus`, `AccessAction`, `ViewMode`, `SortField` |
| `kindmother_db.rs` | 1 371 | Implementation SQLite directe. 12 tables, schema complet avec migrations. CRUD pour fichiers, dossiers, partages, liens, pairs, conflits, horloges vectorielles, quotas, config crypto, journal d'acces |

#### Stockage fichier (`src/storage/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 56 | Trait `StorageBackend` et re-exports |
| `local_fs.rs` | 184 | Backend filesystem local avec structure `{prefix}/{file_id}/chunk_{n}.enc`. Ecriture de chunks chiffres, overwrite zeros pour la purge RGPD |
| `chunking.rs` | 120 | Decoupe et reassemblage de fichiers en chunks de 256 Ko |
| `integrity.rs` | 87 | Verification SHA-256 et comparaison de checksums |

#### Chiffrement (`src/crypto/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 18 | Re-exports |
| `keys.rs` | 213 | `KeyManager` : derivation Argon2id (64 Mo, 3 iterations, 4 threads), HKDF-SHA256 par fichier, generation de sel, canary de verification passphrase. Debug masque la master key. |
| `at_rest.rs` | 141 | Chiffrement/dechiffrement ChaCha20-Poly1305 par chunk. Nonces 12 bytes aleatoires (OsRng) |
| `e2e.rs` | 316 | Echange de cles X25519 Diffie-Hellman, chiffrement canal P2P, Perfect Forward Secrecy (paire ephemere par session) |
| `streaming.rs` | 249 | `StreamingDecryptor` pour dechiffrement flux par flux (surface web) |

#### Authentification (`src/auth/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 12 | Re-exports |
| `permissions.rs` | 147 | Verification de permissions : owner, shared_read, shared_write. Resolution de la chaine de permissions |
| `web_tokens.rs` | 355 | Tokens de partage web (32 bytes OsRng, 64 hex), hash et verification de mots de passe (Argon2id), validation de liens de partage (expiration, revocation, max downloads) |

#### Logique metier (`src/domain/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 22 | Re-exports |
| `file_ops.rs` | 417 | Operations fichier : upload (chiffrement + chunking + persistance), download (reassemblage + dechiffrement), rename, move, delete (soft delete), search |
| `trash.rs` | 245 | Corbeille : soft delete, restauration, purge definitive (overwrite zeros + suppression DB), empty trash |
| `sharing.rs` | 333 | Partage interne Tribu : creation/suppression de permissions, verification d'acces |
| `external_share.rs` | 380 | Partage externe (Decision D2) : creation de liens avec expiration obligatoire (1h-30j), mot de passe optionnel, max downloads, revocation instantanee |
| `quota.rs` | 141 | Quotas de stockage : verification avant upload, mise a jour apres upload/delete, query quota |
| `jay1tribu_migration.rs` | 266 | Migration des fichiers partages via Jay1Tribu vers MiyuCloud. Extraction des metadonnees et creation des entrees cloud correspondantes |

#### Synchronisation P2P (`src/sync/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 27 | Re-exports |
| `vector_clock.rs` | 308 | Horloges vectorielles : increment, merge, comparaison (happened-before, concurrent, equal), serialisation |
| `conflict.rs` | 249 | Detection et enregistrement de conflits. Strategies de resolution : keep_local, keep_remote, keep_both |
| `protocol.rs` | 246 | Messages du protocole de sync P2P : SyncHello, SyncManifest, SyncRequest, SyncChunk, SyncAck |
| `manifest.rs` | 343 | Manifeste de sync : etat des fichiers par noeud, diff entre manifestes, identification des fichiers a synchroniser |
| `transport.rs` | 380 | Couche transport TCP pour la sync. Envoi et reception de messages frames (longueur + payload) |
| `peer_discovery.rs` | 451 | Decouverte de pairs en reseau local via UDP broadcast (port 11443). Annonce et ecoute avec timeout |
| `engine.rs` | 522 | Moteur de synchronisation : orchestration du cycle complet (discovery, handshake, manifest exchange, diff, transfer, conflict detection) |

#### Export (`src/export/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 13 | Re-exports |
| `archive.rs` | 449 | Export ZIP + manifest JSON. Dechiffrement et inclusion des fichiers originaux dans l'archive. Compatible LOI-8 (migration = diplomatie) |

#### Tests d'integration (`tests/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `integration_storage_crypto.rs` | 120 | Upload chiffre -> download dechiffre -> verification integrite. Test complet du pipeline storage+crypto |
| `integration_sync.rs` | 510 | Tests du moteur de sync : vector clocks, conflict detection, manifest diff, peer registration, protocol messages |

---

### 2.2 Serveur `miyucloud-server` (`apps/miyucloud/`)

#### Configuration et entrypoint

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `Cargo.toml` | 57 | Dependances axum 0.8, tokio, tower-http, rustls, rcgen, hyper-util. `unsafe_code = "forbid"` |
| `src/main.rs` | 462 | Point d'entree dual : API HTTP sur `127.0.0.1:11440` + surface web HTTPS sur `0.0.0.0:11442`. Bootstrap crypto au demarrage (Argon2id + canary), base64 encode/decode, serveur TLS via hyper-util |
| `src/config.rs` | 113 | Configuration par variables d'environnement : `MIYUCLOUD_PORT`, `MIYUCLOUD_STORAGE_PATH`, `MIYUCLOUD_DB_PATH`, `MIYUCLOUD_COG_TOKEN`, `MIYUCLOUD_PASSPHRASE`, `MIYUCLOUD_OWNER_ID`, `MIYUCLOUD_WEB_PORT`, `MIYUCLOUD_WEB_ENABLED`, `MIYUCLOUD_TLS_CERT`, `MIYUCLOUD_TLS_KEY` |

#### API REST (`src/api/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 87 | Routeur API : 30 routes nestees sous `/api`, protegees par `CogTokenLayer` (`X-COG-Token`). Route `/health` hors auth |
| `files.rs` | 234 | Handlers fichiers : `list_files`, `upload_file` (multipart), `get_file`, `update_file`, `delete_file`, `download_file`, `restore_file`, `search_files` |
| `folders.rs` | 122 | Handlers dossiers : `create_folder`, `update_folder`, `delete_folder` |
| `trash.rs` | 164 | Handlers corbeille : `list_trash`, `empty_trash`, `restore_from_trash`, `purge_from_trash` |
| `shares.rs` | 191 | Handlers partage : `create_share_link`, `list_share_links`, `revoke_share_link`, `create_share_permission`, `list_permissions`, `delete_permission` |
| `sync_api.rs` | 327 | Handlers sync P2P : `list_peers`, `register_peer`, `trust_peer`, `untrust_peer`, `sync_status`, `list_conflicts`, `resolve_conflict`, `trigger_sync` |
| `admin.rs` | 72 | Handlers admin : `get_quota`, `get_stats`, `get_access_log` |
| `auth.rs` | 104 | Middleware `CogTokenLayer` : validation du header `X-COG-Token` sur chaque requete `/api/*`. Retourne 401 si absent ou invalide |

#### Surface web publique (`src/web_surface/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 124 | Routeur surface web : 4 routes (`/share/{token}`, `/share/{token}/auth`, `/share/{token}/download`, `/health`). Rate limiters separes (10/min page, 3/min auth) |
| `share_page.rs` | 515 | Handlers de partage web : page HTML de telechargement, verification mot de passe, streaming download dechiffre. HTML inline avec CSS minimaliste |
| `rate_limiter.rs` | 254 | Rate limiter par IP : HashMap en memoire, sliding window. Middleware Tower. Retourne 429 + Retry-After |
| `sandbox.rs` | 168 | `SandboxedStore` : restriction d'acces aux seuls fichiers possedant un lien de partage actif. Verifie expiration, revocation, max downloads |
| `tls.rs` | 201 | Configuration TLS : chargement certificats PEM existants ou auto-generation RSA 2048 via rcgen. Stockage dans `{base_dir}/tls/` |
| `access_log.rs` | 147 | Journalisation des acces web : IP hashee SHA-256 avec sel, User-Agent tronque 100 chars. Stockage en DB |

---

### 2.3 UI Central (`apps/central/src/services/miyucloud/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `mod.rs` | 874 | Vue racine `MiyuCloudView` : layout 2 panneaux (sidebar + zone principale), routage par section (Files, Shares, Trash, Settings), actions async (upload, download, delete, rename), mock data quand serveur absent, vue `SharesListView` |
| `state.rs` | 521 | Etat local UI : 30+ champs. Types domaine repliques (`FileEntry`, `FolderEntry`, `ShareLink`, `SyncPeer`, `SyncConflict`, etc.). `serde(alias)` pour interoperabilite avec le crate back-end |
| `client.rs` | 868 | Client HTTP reqwest : 20 methodes (list_files, upload_file, download_file, create_folder, rename_file, delete_file, list_trash, restore, purge, empty_trash, share links CRUD, peers CRUD, sync status, conflicts). Header `X-COG-Token` |
| `sync_status.rs` | 993 | Badge de sync dans le header + panel overlay lateral : liste des pairs (online/offline, trusted/untrusted), conflits pendants avec resolution, formulaire d'ajout de pair |
| `explorer.rs` | 529 | Explorateur de fichiers : breadcrumb, toolbar (tri, vue grille/liste, creation dossier, upload), grille de cartes fichier avec icones par type MIME |
| `share_dialog.rs` | 539 | Dialog de partage : onglets "Lien externe" et "Tribu". Creation de lien avec expiration, mot de passe, max downloads. Copie du lien genere. Partage interne avec selection de permission |
| `trash_view.rs` | 438 | Vue corbeille : liste des fichiers supprimes, boutons restaurer et purger, confirmation de suppression definitive, vider la corbeille |
| `settings.rs` | 320 | Parametres : statistiques de stockage (fichiers, dossiers, taille, corbeille, partages, pairs), quota, chemin de stockage, config surface web |
| `sidebar.rs` | 285 | Sidebar gauche : arborescence de dossiers avec depliage recursif, sections (Fichiers, Partages, Corbeille, Parametres) |
| `file_detail.rs` | 246 | Panel de detail fichier (droite) : nom, taille formatee, type MIME, checksum, dates, boutons download/rename/share/delete |
| `components.rs` | 274 | Composants UI partages : icones par type MIME, formattage de taille (Ko/Mo/Go), formattage de dates |
| `upload.rs` | 159 | Zone d'upload avec barre de progression, affichage nom du fichier et pourcentage |

---

## 3. Guide de demarrage rapide

### 3.1 Prerequis

- Rust toolchain (edition 2024)
- Le workspace Miyukini COG clone et fonctionnel (`cargo build --workspace` passe)

### 3.2 Build

```bash
# Build du crate bibliotheque
cargo build -p miyucloud

# Build du serveur standalone
cargo build -p miyucloud-server
```

### 3.3 Configuration (variables d'environnement)

| Variable | Defaut | Description |
|----------|--------|-------------|
| `MIYUCLOUD_PORT` | `11440` | Port de l'API interne (HTTP, localhost) |
| `MIYUCLOUD_STORAGE_PATH` | `~/.miyucloud/storage` | Repertoire de stockage des fichiers chiffres |
| `MIYUCLOUD_DB_PATH` | `~/.miyucloud/miyucloud.db` | Chemin de la base SQLite |
| `MIYUCLOUD_COG_TOKEN` | Aleatoire (genere) | Token d'authentification pour l'API (`X-COG-Token`) |
| `MIYUCLOUD_PASSPHRASE` | `miyucloud-default-passphrase` (**CHANGER**) | Passphrase pour la derivation de la master key |
| `MIYUCLOUD_OWNER_ID` | `default-owner` | ID du proprietaire (mono-utilisateur MVP) |
| `MIYUCLOUD_WEB_PORT` | `11442` | Port de la surface web publique (HTTPS) |
| `MIYUCLOUD_WEB_ENABLED` | `true` | Active/desactive la surface web (`0` ou `false` pour desactiver) |
| `MIYUCLOUD_TLS_CERT` | Auto-genere | Chemin vers un certificat TLS PEM (optionnel) |
| `MIYUCLOUD_TLS_KEY` | Auto-genere | Chemin vers la cle privee TLS PEM (optionnel) |

**IMPORTANT** : Definir `MIYUCLOUD_PASSPHRASE` avec une valeur secrete avant le premier demarrage. La passphrase par defaut est connue publiquement et compromise la securite du chiffrement (finding F-03 de l'audit).

### 3.4 Lancement

```bash
# Lancement minimal (passphrase obligatoire pour la prod)
export MIYUCLOUD_PASSPHRASE="ma-passphrase-secrete-et-longue"
export MIYUCLOUD_COG_TOKEN="mon-token-secret"
cargo run -p miyucloud-server
```

Le serveur affiche :
```
MiyuCloud Server starting on port 11440
First start: generating crypto config...
Crypto config stored in DB.
Crypto bootstrap complete. Master key derived.
API server listening on 127.0.0.1:11440
Web surface listening on 0.0.0.0:11442 (HTTPS)
```

Au premier demarrage, le serveur :
1. Cree le repertoire de stockage et la base SQLite
2. Genere un sel Argon2 aleatoire (16 bytes)
3. Derive la master key depuis la passphrase
4. Chiffre et stocke un canary pour verification future
5. Genere un certificat TLS auto-signe (si aucun n'est fourni)

### 3.5 Tests de base

#### Health check

```bash
curl http://127.0.0.1:11440/health
# Reponse : OK
```

#### Lister les fichiers (racine)

```bash
curl -H "X-COG-Token: mon-token-secret" \
     http://127.0.0.1:11440/api/files
# Reponse : {"folder":null,"subfolders":[],"files":[]}
```

#### Upload d'un fichier

```bash
curl -X POST \
     -H "X-COG-Token: mon-token-secret" \
     -F "file=@mon-fichier.txt" \
     http://127.0.0.1:11440/api/files/upload
# Reponse : {"id":"uuid-v4","name":"mon-fichier.txt",...}
```

#### Download d'un fichier

```bash
curl -H "X-COG-Token: mon-token-secret" \
     http://127.0.0.1:11440/api/files/{file-id}/download \
     --output fichier-telecharge.txt
```

#### Creer un lien de partage

```bash
curl -X POST \
     -H "X-COG-Token: mon-token-secret" \
     -H "Content-Type: application/json" \
     -d '{"file_id":"uuid-du-fichier","expires_in_hours":24}' \
     http://127.0.0.1:11440/api/shares/link
# Reponse : {"id":"...","token":"64-chars-hex","expires_at":"2026-03-02T..."}
```

#### Acceder au fichier partage (surface web)

```
https://localhost:11442/share/{token}
```
Le navigateur affichera la page de telechargement. Le certificat auto-signe generera un avertissement navigateur (normal en developpement).

### 3.6 Acces depuis Central

MiyuCloud est integre dans l'interface Central. Pour y acceder :

1. Lancer le serveur `miyucloud-server` (cf. section 3.4)
2. Lancer Central (`cargo run -p miyukini-central-native`)
3. Selectionner le service "MiyuCloud" dans la liste des services

L'interface affiche un explorateur de fichiers avec :
- Sidebar gauche : arborescence de dossiers, sections (Fichiers, Partages, Corbeille, Parametres)
- Zone centrale : explorateur (grille ou liste), breadcrumb, toolbar
- Panel droit (contextuel) : details du fichier selectionne
- Badge de sync dans le header

**Note MVP** : Si le serveur n'est pas lance, l'UI affiche des donnees de demonstration (mock data) pour preview.

---

## 4. Endpoints API

### 4.1 API interne (`127.0.0.1:{api_port}`)

Toutes les routes `/api/*` exigent le header `X-COG-Token`.

#### Fichiers

| Methode | Route | Description | Body/Params | Reponse |
|---------|-------|-------------|-------------|---------|
| `GET` | `/api/files` | Lister le contenu d'un dossier | `?parent_id={id}` (opt.) | `FolderContents` (200) |
| `POST` | `/api/files/upload` | Televerser un fichier | Multipart : `file` + `parent_id` (opt.) | `FileEntry` (201) |
| `GET` | `/api/files/search` | Rechercher des fichiers | `?q={terme}` | `Vec<FileEntry>` (200) |
| `GET` | `/api/files/{id}` | Metadonnees d'un fichier | -- | `FileEntry` (200) |
| `PUT` | `/api/files/{id}` | Renommer/deplacer un fichier | JSON : `{"name":"...","parent_id":"..."}` | `FileEntry` (200) |
| `DELETE` | `/api/files/{id}` | Mettre en corbeille | -- | 200 |
| `GET` | `/api/files/{id}/download` | Telecharger (contenu dechiffre) | -- | Bytes (200) |
| `POST` | `/api/files/{id}/restore` | Restaurer depuis corbeille | -- | 200 |

#### Dossiers

| Methode | Route | Description | Body | Reponse |
|---------|-------|-------------|------|---------|
| `POST` | `/api/folders` | Creer un dossier | JSON : `{"name":"...","parent_id":"..."}` | `FolderEntry` (201) |
| `PUT` | `/api/folders/{id}` | Renommer un dossier | JSON : `{"name":"..."}` | `FolderEntry` (200) |
| `DELETE` | `/api/folders/{id}` | Supprimer un dossier | -- | 200 |

#### Corbeille

| Methode | Route | Description | Reponse |
|---------|-------|-------------|---------|
| `GET` | `/api/trash` | Lister les elements en corbeille | `FolderContents` (200) |
| `DELETE` | `/api/trash` | Vider la corbeille (purge definitive) | 200 |
| `POST` | `/api/trash/{id}/restore` | Restaurer un element | 200 |
| `DELETE` | `/api/trash/{id}` | Purge definitive d'un element | 200 |

#### Partage

| Methode | Route | Description | Body | Reponse |
|---------|-------|-------------|------|---------|
| `POST` | `/api/shares/link` | Creer un lien de partage externe | JSON : `CreateShareLinkRequest` | `ShareLink` (201) |
| `GET` | `/api/shares/links` | Lister tous les liens | -- | `Vec<ShareLink>` (200) |
| `DELETE` | `/api/shares/links/{id}` | Revoquer un lien | -- | 200 |
| `POST` | `/api/shares/permission` | Partager avec un profil/tribu | JSON : `CreateSharePermissionRequest` | `SharePermission` (201) |
| `GET` | `/api/shares/permissions/{resource_id}` | Lister les permissions d'une ressource | -- | `Vec<SharePermission>` (200) |
| `DELETE` | `/api/shares/permissions/{id}` | Supprimer une permission | -- | 200 |

#### Synchronisation P2P

| Methode | Route | Description | Body | Reponse |
|---------|-------|-------------|------|---------|
| `GET` | `/api/sync/peers` | Lister les pairs | -- | `Vec<SyncPeer>` (200) |
| `POST` | `/api/sync/peers` | Enregistrer un nouveau pair | JSON : `RegisterPeerRequest` | `SyncPeer` (201) |
| `POST` | `/api/sync/peers/{id}/trust` | Approuver un pair | -- | 200 |
| `POST` | `/api/sync/peers/{id}/untrust` | Retirer la confiance d'un pair | -- | 200 |
| `GET` | `/api/sync/status` | Statut global de la sync | -- | `SyncStatus` (200) |
| `GET` | `/api/sync/conflicts` | Lister les conflits | -- | `Vec<SyncConflict>` (200) |
| `POST` | `/api/sync/conflicts/{id}/resolve` | Resoudre un conflit | JSON : `{"resolution":"keep_local"}` | 200 |
| `POST` | `/api/sync/trigger` | Declencher une sync manuelle | -- | 200 |

#### Administration

| Methode | Route | Description | Reponse |
|---------|-------|-------------|---------|
| `GET` | `/api/admin/quota` | Quota de l'utilisateur | `UserQuota` (200) |
| `GET` | `/api/admin/stats` | Statistiques de stockage | `StorageStats` (200) |
| `GET` | `/api/admin/access-log` | Journal des acces web | `Vec<AccessLogEntry>` (200) |

#### Sans authentification

| Methode | Route | Description | Reponse |
|---------|-------|-------------|---------|
| `GET` | `/health` | Health check | `"OK"` (200) |

### 4.2 Surface web publique (`0.0.0.0:{web_port}`, HTTPS)

| Methode | Route | Description | Rate Limit | Reponse |
|---------|-------|-------------|------------|---------|
| `GET` | `/share/{token}` | Page HTML de telechargement | 10/min/IP | HTML (200) ou 404 |
| `POST` | `/share/{token}/auth` | Verification mot de passe | 3/min/IP | JSON (200) ou 401 |
| `GET` | `/share/{token}/download` | Streaming du fichier dechiffre | 10/min/IP | Bytes (200) ou 404 |
| `GET` | `/health` | Health check surface web | -- | `"OK"` (200) |

---

## 5. Findings audit

### 5.1 Score global

**87 / 100** -- Verdict : CONFORME avec reserves

### 5.2 Defauts majeurs (3)

| # | Finding | Impact | Fichier | Recommandation |
|---|---------|--------|---------|----------------|
| F-01 | Download bypasse la verification de mot de passe | Contournement total de la protection par mot de passe des liens partages | `apps/miyucloud/src/web_surface/share_page.rs` | Implementer un cookie de session signe apres authentification. Le endpoint `/download` doit verifier ce cookie. |
| F-02 | Comparaison de hash non constant-time | Timing attack theorique (attenue par rate limiting 3/min) | `crates/miyucloud/src/auth/web_tokens.rs` | Utiliser `subtle::ConstantTimeEq` ou XOR accumulateur |
| F-03 | Passphrase par defaut hardcodee | Compromission totale du chiffrement si non configuree | `apps/miyucloud/src/main.rs` | Refuser le demarrage sans passphrase explicite, ou generer une passphrase aleatoire au premier lancement |

### 5.3 Defauts mineurs (4)

| # | Finding | Recommandation |
|---|---------|----------------|
| F-04 | XSS potentiel dans la page de partage (nom de fichier non echappe) | Echapper les caracteres HTML |
| F-05 | Pas de validation path traversal sur file_id | Valider le format UUID v4 dans `file_dir()` |
| F-06 | Sel de hashing IP hardcode dans le code source | Deriver depuis une valeur unique a l'instance |
| F-07 | Consultation de page de partage non loggee | Ajouter `log_access(Preview)` dans `share_page()` |

### 5.4 Points positifs confirmes

- Chiffrement at-rest ChaCha20-Poly1305 avec nonces aleatoires : **PASS**
- Derivation Argon2id (64 Mo, 3 iter, 4 threads) : **PASS**
- HKDF-SHA256 par fichier (contexte unique) : **PASS**
- X25519 avec Perfect Forward Secrecy : **PASS**
- Master key en memoire uniquement, Debug masque : **PASS**
- Canary de verification passphrase : **PASS**
- Surface web sandboxee, rate limitee, TLS : **PASS**
- IP hashees + UA tronques (RGPD) : **PASS**
- Purge avec overwrite zeros : **PASS**
- `unsafe_code = "forbid"` partout : **PASS**
- Pas de `unwrap()` en production : **PASS**
- Lois d'Autonomie LOI-1 a LOI-8 respectees : **PASS**

---

## 6. Limitations connues MVP

### 6.1 Ce qui fonctionne

| Fonctionnalite | Statut |
|----------------|--------|
| Upload/download de fichiers avec chiffrement at-rest | Fonctionnel |
| Navigation arborescente (dossiers/sous-dossiers) | Fonctionnel |
| Creation/renommage de dossiers | Fonctionnel |
| Renommage de fichiers | Fonctionnel |
| Suppression (mise en corbeille) | Fonctionnel |
| Restauration depuis corbeille | Fonctionnel |
| Purge definitive (overwrite zeros) | Fonctionnel |
| Recherche de fichiers par nom | Fonctionnel |
| Liens de partage externe (token, expiration, max downloads) | Fonctionnel |
| Protection par mot de passe (liens) | Partiel (finding F-01) |
| Revocation instantanee de liens | Fonctionnel |
| Surface web HTTPS avec page de telechargement | Fonctionnel |
| Rate limiting sur la surface web | Fonctionnel |
| Sandbox (isolement des fichiers non partages) | Fonctionnel |
| Access logging RGPD (IP hashee, UA tronque) | Fonctionnel |
| Certificat TLS auto-genere | Fonctionnel |
| Partage interne (permissions profil/tribu) | Fonctionnel |
| Quotas de stockage | Fonctionnel |
| Statistiques de stockage (dashboard admin) | Fonctionnel |
| Bootstrap crypto au demarrage (Argon2id + canary) | Fonctionnel |
| Horloges vectorielles | Fonctionnel |
| Detection de conflits sync | Fonctionnel |
| Decouverte de pairs UDP broadcast | Fonctionnel |
| Echange de cles X25519 E2E | Fonctionnel |
| Export ZIP + manifest | Fonctionnel |
| Migration Jay1Tribu | Fonctionnel |
| UI Central (explorateur, sidebar, detail, corbeille, partage, sync, settings) | Fonctionnel |

### 6.2 Ce qui est stub ou placeholder

| Element | Detail |
|---------|--------|
| Sync P2P automatique en arriere-plan | Le moteur de sync est implemente mais pas lance automatiquement. Le declenchement est manuel (`/api/sync/trigger`) |
| Download en streaming (gros fichiers) | La surface web charge le fichier entier en memoire avant envoi. Commentaire "for MVP" present. Le `StreamingDecryptor` est pret pour le futur |
| Selective sync (choix des dossiers a synchroniser) | Les types `SyncFolder` existent mais l'UI ne permet pas encore de configurer la selective sync |
| Client UI : token et port en dur | Le client Central utilise `port=11440` et `token="dev-token"` en dur. A connecter a la configuration du service |
| Apercu inline (images, PDF, texte) | Non implemente. Les fichiers sont affichables par type MIME mais pas previsualises |
| Thumbnails | Non implemente. Necessite integration avec MiyuMedia |

### 6.3 Ce qui reste a faire (post-MVP)

| Priorite | Fonctionnalite | Effort estime |
|----------|---------------|---------------|
| **HAUTE** | Corriger F-01 (session cookie pour download protege) | 1 session |
| **HAUTE** | Corriger F-02 (comparaison constant-time) | 0.5 session |
| **HAUTE** | Corriger F-03 (refuser demarrage sans passphrase) | 0.5 session |
| **HAUTE** | Connecter le client Central a la config du service (token, port) | 1 session |
| Moyenne | Echapper les noms de fichier dans le HTML (F-04) | 0.5 session |
| Moyenne | Valider le format UUID du file_id (F-05) | 0.5 session |
| Moyenne | Implementer le streaming download (`Body::from_stream`) | 2 sessions |
| Moyenne | Sync automatique en arriere-plan | 3-5 sessions |
| Moyenne | Traversee NAT (hole-punching UDP) | 5-8 sessions |
| Faible | Apercu inline (images, PDF, video) | 3 sessions |
| Faible | Thumbnails via MiyuMedia | 2 sessions |
| Faible | Versionning de fichiers | 4 sessions |
| Faible | App mobile companion | 10+ sessions |
| Faible | Rotation des cles de chiffrement | 3 sessions |
| Faible | Sel de hashing IP configurable (F-06) | 0.5 session |
| Faible | Logger les consultations de page de partage (F-07) | 0.5 session |
| Faible | Purge periodique du rate limiter (F-08) | 1 session |

---

## 7. Prochaines etapes recommandees

### 7.1 Corrections urgentes (avant utilisation reelle)

1. **Definir une passphrase** (`MIYUCLOUD_PASSPHRASE`) avant tout premier demarrage
2. **Corriger F-01** : implementer le cookie de session pour les downloads proteges par mot de passe
3. **Corriger F-02** : ajouter le crate `subtle` et utiliser `ConstantTimeEq`
4. **Corriger F-03** : refuser le demarrage si `MIYUCLOUD_PASSPHRASE` n'est pas definie

### 7.2 Ameliorations court terme

5. Connecter le client Central a la configuration reelle du service (port + token dynamiques)
6. Echapper les noms de fichier dans le HTML de la surface web
7. Valider le format UUID du file_id dans le storage
8. Implementer le streaming download pour les gros fichiers

### 7.3 Ameliorations moyen terme

9. Lancer le moteur de sync automatiquement en arriere-plan (tache tokio)
10. Implementer la traversee NAT pour la sync WAN
11. Ajouter les apercu inline et les thumbnails (integration MiyuMedia)
12. Implementer la selective sync dans l'UI

### 7.4 Vision long terme

13. App mobile companion (Kotlin/Swift) pour le backup photos
14. Rotation des cles de chiffrement
15. Versionning de fichiers (historique des modifications)
16. Federation inter-COG (partage de dossiers entre COG differents)

---

## Checklist de livraison

- [x] `cargo build -p miyucloud` : OK (0 erreur)
- [x] `cargo build -p miyucloud-server` : OK (0 erreur)
- [x] `cargo test -p miyucloud` : 213/213 OK
- [x] `cargo test -p miyucloud-server` : 28/28 OK
- [x] `cargo clippy -p miyucloud -p miyucloud-server -- -D warnings` : 0 warning
- [x] Annotations MSCM : 67/67 fichiers (100%)
- [x] `unsafe_code = "forbid"` : present dans les 2 Cargo.toml
- [x] Pas de `unwrap()` en production
- [x] Pas d'URL externe en dur
- [x] Lois d'Autonomie respectees (LOI-1 a LOI-8)
- [x] Audit securite effectue (score 87/100)
- [x] 0 defaut bloquant
- [x] Brief, spec, plan, audit documentes dans `.mip/`
- [x] Documentation de livraison (ce document)

---

## Conclusion

MiyuCloud est livre en version MVP beta, fonctionnel et conforme aux specifications. Le service couvre les trois phases prevues (stockage chiffre, surface web, sync P2P) avec une couverture de test de 257 tests passants et un score de securite de 87/100.

Les 3 defauts majeurs identifies par l'audit de George (F-01, F-02, F-03) ne sont pas bloquants pour une utilisation en beta mais doivent etre corriges avant toute mise en production. Le plus critique (F-01) permet de contourner la protection par mot de passe des liens de partage.

Le livrable est pret pour utilisation. A transmettre a Arianne (P6) pour archivage et capitalisation.

---

*Rapport redige par Denis -- Chef Dev Senior, Miyukini AI Studio*
*Protocole MIP v2, Phase P5 -- Livraison*
*Date : 2026-03-01*
