# Brief de Cadrage P0 -- Service Cloud Storage Miyukini COG

**Classification MIP : T5 (Chantier strategique)**
**Date : 2026-03-01**
**Responsable P0 : Maria**
**Statut : DECISIONS P0 VERROUILLEES -- EN ATTENTE APPROBATION FINALE**

---

## Decisions verrouillees (P0)

Les 4 questions structurantes ont ete soumises a l'utilisateur. Ses reponses sont verrouillees et non negociables pour la suite du projet.

| # | Question | Decision | Impact |
|---|----------|----------|--------|
| D1 | **Topologie de sync** | **Pair-a-pair** entre les machines de l'utilisateur | Pas de COG "serveur" central. Chaque machine est un noeud egal. Sync via Webway ou reseau local direct. |
| D2 | **Acces web** | **Surface web du COG** pour partage fichiers vers des utilisateurs **hors COG**. Securites et limitations strictes pour proteger le COG host. | L'acces web n'est PAS un navigateur de fichiers complet pour l'utilisateur. C'est une surface de partage restreinte et blindee, exposee uniquement pour les destinataires externes. |
| D3 | **Coexistence Jay1Tribu** | MiyuCloud **remplace** Jay1Tribu pour le partage fichier. Jay1Tribu sera **deprecie puis absorbe**. | Pas d'adaptateur de coexistence a maintenir. Migration directe. Jay1Tribu perd sa fonctionnalite `send_file` au profit de MiyuCloud. |
| D4 | **Chiffrement** | **Chiffrement et securite renforces** : E2E entre pairs, stockage chiffre au repos. | Impact significatif sur la complexite. Le chiffrement n'est plus "souhaite" mais obligatoire. Toute la couche sync et stockage doit integrer le chiffrement des le debut. |

### Consequences architecturales des decisions

**D1 (P2P)** : Le moteur de sync ne repose sur aucun noeud central. Chaque COG maintient son propre etat et le reconcilie avec ses pairs. Les horloges vectorielles sont obligatoires pour l'ordonnancement. La decouverte des pairs se fait via le Webway (MWS) ou mDNS en reseau local.

**D2 (Surface web restreinte)** : La surface web est un **point d'exposition minimal** du COG. Elle ne donne pas acces a l'integralite des fichiers de l'utilisateur, mais uniquement aux fichiers/dossiers explicitement marques comme "partageables en externe". Securites requises :
- Rate limiting agressif
- Authentification par lien unique + mot de passe optionnel + expiration obligatoire
- Sandboxing : la surface web n'a aucun acces au reste du COG
- Taille maximale de telechargement configurable
- Logging complet de tous les acces
- Possibilite de revoquer un partage instantanement
- HTTPS obligatoire
- Aucune enumeration possible (les URLs ne sont pas predictibles)

**D3 (Remplacement Jay1Tribu)** : Un plan de migration sera necessaire. Les fonctionnalites de Jay1Tribu qui ne relevent PAS du partage fichier (chat, presence, etc.) restent a evaluer : soit elles migrent dans un autre service, soit elles sont integrees a MiyuCloud si pertinent. Un avertissement de depreciation sera ajoute a Jay1Tribu des le debut du developpement de MiyuCloud.

**D4 (Chiffrement renforce)** : Le chiffrement impacte TOUTES les couches :
- **Stockage** : fichiers chiffres au repos (AES-256-GCM ou ChaCha20-Poly1305)
- **Sync P2P** : canal chiffre E2E entre pairs (pas de confiance dans le transport)
- **Partage web** : les fichiers partages en externe sont dechiffres uniquement a la livraison (streaming dechiffre cote serveur pour le destinataire authentifie)
- **Cles** : gestion de cles par utilisateur, derivation depuis un secret maitre, rotation possible
- **Impact performance** : surcharge estimee 5-15% sur les operations I/O
- **Impact complexite** : ajoute 3-5 sessions de dev supplementaires

---

## 1. Resume de la demande

L'utilisateur souhaite creer un service de stockage Cloud personnel et familial (comparable a Google Drive) au sein de l'ecosysteme Miyukini COG. Le service doit permettre :

- Acces aux fichiers type explorateur cloud (navigation, apercu, televersement/telechargement)
- Synchronisation multi-postes (un utilisateur retrouve ses fichiers sur tous ses appareils)
- Partage de fichiers et dossiers (au sein d'une Tribu ou avec des contacts)
- Acces web restreint et securise pour le partage de fichiers vers des utilisateurs hors COG
- Liberation du stockage local (ex : sauvegarder photos/videos d'un mobile, puis les supprimer du mobile)
- Chiffrement de bout en bout entre pairs et chiffrement au repos

---

## 2. Classification : T5 -- Chantier strategique

### Justification

Ce service necessite :

1. **Nouveau crate service** : `crates/miyucloud/` (pattern service standard)
2. **Nouvelle app standalone** : `apps/miyucloud/` (serveur de fichiers + API REST)
3. **Integration front-end** dans Central (UI Dioxus 0.6 pour navigation fichiers)
4. **Nouveau module de synchronisation** : moteur de sync bidirectionnel multi-postes
5. **Integration auth** : liaison avec `miyauth` + authentification web autonome
6. **Remplacement Jay1Tribu** : MiyuCloud absorbe le partage fichier de Jay1Tribu (depreciation + migration)
7. **Integration MiyuMedia** : thumbnails, apercu, transformation medias
8. **API web publique** : interface web accessible depuis un navigateur (mobile/desktop)
9. **Client mobile** (futur) : agent de backup photo/video
10. **Couche chiffrement** : E2E entre pairs, stockage chiffre au repos, gestion de cles
11. **Depreciation Jay1Tribu** : plan de migration, avertissement de depreciation, absorption fonctionnalites
12. **Impact transversal** : stockage, reseau, auth, UI, synchro, chiffrement -- bien au-dela de 10 fichiers

T5 car il s'agit d'un **nouveau service complet** avec des sous-systemes multiples (sync engine, file server, web UI, partage tribu). Ce n'est pas un ajout a un service existant mais la creation d'une infrastructure fondamentale.

### Phases requises

P0 (Cadrage) -> P1 (Spec) -> P2 (Plan atomique) -> P3 (Implementation TDD) -> P4 (Audit) -> P5 (Livraison) -> P6 (Archivage)

Toutes les phases du protocole MIP v2 sont declenchees.

---

## 3. Nom du service propose

**MiyuCloud** (`miyucloud`)

- Crate : `crates/miyucloud/`
- App : `apps/miyucloud/`
- Enregistrement Central : `miyucloud` (Miyukini Cloud)

---

## 4. Fonctionnalites cles identifiees

### 4.1 Gestion de fichiers (Core)

| Ref | Fonctionnalite | Priorite |
|-----|---------------|----------|
| F01 | Televersement de fichiers (upload) | P0 - Critique |
| F02 | Telechargement de fichiers (download) | P0 - Critique |
| F03 | Navigation dans l'arborescence (dossiers/fichiers) | P0 - Critique |
| F04 | Creation/renommage/suppression de dossiers | P0 - Critique |
| F05 | Renommage/deplacement/suppression de fichiers | P0 - Critique |
| F06 | Recherche de fichiers (par nom, type, date) | P1 - Important |
| F07 | Apercu inline (images, PDF, texte, video) | P1 - Important |
| F08 | Thumbnails automatiques (images, videos) | P1 - Important |
| F09 | Versionning de fichiers (historique des modifications) | P2 - Souhaite |
| F10 | Corbeille (suppression douce avec restauration) | P1 - Important |

### 4.2 Synchronisation multi-postes (Pair-a-pair -- Decision D1)

| Ref | Fonctionnalite | Priorite |
|-----|---------------|----------|
| F11 | Designation d'un dossier local comme "dossier sync" | P0 - Critique |
| F12 | Synchronisation bidirectionnelle automatique **P2P** entre machines de l'utilisateur | P0 - Critique |
| F13 | Detection de conflits et resolution via **horloges vectorielles** (copie de conflit + notification) | P0 - Critique |
| F14 | Sync selective (choisir quels dossiers synchroniser par poste) | P1 - Important |
| F15 | Indicateur d'etat de sync (icone systray / statut dans Central) | P1 - Important |
| F16 | Mode "fichiers a la demande" (placeholder local, download au clic) | P2 - Souhaite |
| F34 | Decouverte de pairs (mDNS en LAN, Webway en WAN) | P0 - Critique |
| F35 | Canal de sync chiffre E2E entre pairs (Decision D4) | P0 - Critique |

### 4.3 Partage (remplace Jay1Tribu -- Decision D3)

| Ref | Fonctionnalite | Priorite |
|-----|---------------|----------|
| F17 | Partage d'un fichier/dossier avec un membre de la Tribu (absorbe `send_file` de Jay1Tribu) | P0 - Critique |
| F18 | Permissions de partage (lecture seule / lecture-ecriture) | P0 - Critique |
| F19 | Lien de partage externe avec expiration obligatoire et mot de passe optionnel (Decision D2) | P0 - Critique |
| F20 | Dossier partage de Tribu (espace commun) | P1 - Important |
| F21 | Notifications de partage (nouveau fichier partage avec moi) | P2 - Souhaite |
| F36 | Migration des donnees Jay1Tribu existantes vers MiyuCloud (Decision D3) | P1 - Important |
| F37 | Avertissement de depreciation dans Jay1Tribu (redirection vers MiyuCloud) | P1 - Important |

### 4.4 Surface web de partage externe (Decision D2 -- securite renforcee)

> **Attention** : La surface web n'est PAS un explorateur de fichiers complet pour l'utilisateur.
> C'est un point d'acces **minimal, restreint et securise** destine aux utilisateurs **hors COG**
> qui recoivent un lien de partage. L'utilisateur COG gere ses fichiers depuis Central.

| Ref | Fonctionnalite | Priorite |
|-----|---------------|----------|
| F22 | Page de telechargement web pour fichiers/dossiers partages (pas de navigation arborescente) | P0 - Critique |
| F23 | Authentification par lien unique non predictible + mot de passe optionnel + expiration obligatoire | P0 - Critique |
| F24 | Download depuis le navigateur web (upload reserve aux utilisateurs COG via Central) | P0 - Critique |
| F25 | Apercu web minimal (images, PDF) pour le destinataire | P1 - Important |
| F26 | Responsive (mobile-friendly) | P1 - Important |
| F38 | Rate limiting agressif sur tous les endpoints web | P0 - Critique |
| F39 | Logging complet de tous les acces externes | P0 - Critique |
| F40 | Revocation instantanee d'un partage externe | P0 - Critique |
| F41 | Sandboxing : la surface web est isolee du reste du COG (pas d'acces aux fichiers non partages) | P0 - Critique |
| F42 | Taille maximale de telechargement configurable | P1 - Important |
| F43 | HTTPS obligatoire (refus des connexions HTTP) | P0 - Critique |

### 4.5 Liberation du stockage mobile

| Ref | Fonctionnalite | Priorite |
|-----|---------------|----------|
| F27 | Upload batch depuis mobile (photos/videos) | P1 - Important |
| F28 | Verification de l'integrite post-upload (checksum) | P0 - Critique |
| F29 | Confirmation de sauvegarde (le mobile peut supprimer en securite) | P1 - Important |
| F30 | Organisation automatique par date (structure dossier annee/mois) | P2 - Souhaite |

### 4.6 Chiffrement et securite (Decision D4)

| Ref | Fonctionnalite | Priorite |
|-----|---------------|----------|
| F44 | Chiffrement au repos des fichiers stockes (AES-256-GCM ou ChaCha20-Poly1305) | P0 - Critique |
| F45 | Chiffrement E2E du canal de sync entre pairs | P0 - Critique |
| F46 | Gestion de cles par utilisateur (derivation depuis secret maitre) | P0 - Critique |
| F47 | Rotation des cles de chiffrement | P1 - Important |
| F48 | Dechiffrement streaming pour les partages web externes (cote serveur, pour le destinataire authentifie) | P0 - Critique |
| F49 | Verification d'integrite post-dechiffrement (HMAC) | P0 - Critique |
| F50 | Zero-knowledge : le COG ne stocke jamais de cles en clair sur disque (derivation a la volee depuis passphrase) | P2 - Souhaite |

### 4.7 Administration

| Ref | Fonctionnalite | Priorite |
|-----|---------------|----------|
| F31 | Quotas de stockage par utilisateur/tribu | P1 - Important |
| F32 | Tableau de bord (espace utilise, fichiers partages, activite) | P1 - Important |
| F33 | Journal d'activite (qui a accede a quoi, quand) | P2 - Souhaite |

---

## 5. Cibles utilisateurs

| Cible | Description | Cas d'usage principal |
|-------|-------------|----------------------|
| Utilisateur solo | Possesseur d'un COG unique | Stockage personnel, backup mobile, acces web distant |
| Utilisateur multi-postes | Possesseur de plusieurs machines | Synchronisation bureau/laptop, acces unifie |
| Tribu familiale | Famille partageant un COG | Photos partagees, documents communs, backup familial |
| Tribu collaborative | Groupe de travail | Dossiers projet partages, documents editables |

---

## 6. Contraintes COG -- Lois d'Autonomie

Chaque Loi d'Autonomie s'applique avec des implications specifiques pour un service de Cloud :

| Loi | Enonce | Implication pour MiyuCloud |
|-----|--------|---------------------------|
| **LOI-1** | Aucune dependance externe critique a l'execution | Le stockage est local (disque de la machine). Pas de S3, pas de cloud tiers. Le service DOIT fonctionner sans Internet. |
| **LOI-2** | Isolement = etat normal | Le service fonctionne en mode deconnecte. La sync et le partage sont des fonctionnalites "connectees" mais non requises. L'acces web n'est accessible que quand le COG est en ligne. |
| **LOI-3** | Etat local souverain | Les fichiers sont stockes sur le stockage local du COG. Les metadonnees sont dans KindMother (SQLite). L'utilisateur a un controle total sur ses donnees. |
| **LOI-4** | Pas de temps global requis | Le systeme de sync utilise des horloges vectorielles ou des timestamps locaux. Resolution de conflits sans serveur de temps central. |
| **LOI-5** | Cout proportionnel au hardware | Pas de frais d'abonnement cloud. Le stockage est limite par le disque physique de l'utilisateur. |
| **LOI-6** | Autonomie n'empeche pas la federation | Partage Tribu et sync multi-postes via le Webway (MWS) quand disponible. |
| **LOI-7** | Strate Cores immuable | MiyuCloud ne modifie pas les Cores. Il s'integre comme un Operateur (Strate 7). |
| **LOI-8** | Migration = diplomatie entre environnements | Import/export de fichiers avec metadonnees portables. Format standard (ZIP + manifest JSON). |

### Consequence architecturale majeure

MiyuCloud est fondamentalement un **Cloud prive auto-heberge, chiffre et pair-a-pair**. Chaque machine de l'utilisateur est un noeud egal dans un reseau de sync P2P. Il n'y a pas de "serveur central" : la sync se fait directement entre les machines via le Webway ou le reseau local.

L'acces web est une **surface de partage restreinte et blindee** destinee exclusivement aux destinataires externes (hors COG). Elle n'expose qu'un sous-ensemble explicitement partage des fichiers, avec des protections strictes (rate limiting, sandboxing, expiration, HTTPS, logging).

Le chiffrement est integre a toutes les couches : fichiers chiffres au repos, canal E2E entre pairs, dechiffrement streaming pour les partages web.

MiyuCloud **remplace Jay1Tribu** pour tout ce qui concerne le partage de fichiers. Jay1Tribu sera deprecie puis absorbe.

Ce n'est **PAS** un service cloud centralise -- c'est un **service de fichiers chiffre, federe et pair-a-pair** ou chaque COG est souverain sur ses donnees.

---

## 7. Architecture technique previsionnelle

### 7.1 Couche crate (`crates/miyucloud/`)

```
crates/miyucloud/
  Cargo.toml
  src/
    lib.rs                    # Point d'entree, expose modules
    data/
      mod.rs                  # Feature flags (legacy-sqlite / kindmother-only)
      types.rs                # FileEntry, Folder, ShareLink, SyncState, etc.
      kindmother_db.rs        # Persistance metadonnees fichiers
      kindmother_client_db.rs # Client KindMother
    auth/
      mod.rs                  # Auth locale + session web
      permissions.rs          # Permissions fichiers/dossiers (owner, shared_read, shared_write)
      web_auth.rs             # Auth HTTP (JWT/session tokens pour acces web)
    services/
      mod.rs
      miyumedia/              # Adaptateur thumbnails/apercu
        adapter.rs
        contract.rs
    sync/
      mod.rs                  # Moteur de synchronisation P2P
      engine.rs               # Boucle de sync (watch + diff + transfer P2P)
      conflict.rs             # Detection et resolution de conflits (horloges vectorielles)
      manifest.rs             # Manifest de sync (etat des fichiers par noeud)
      transport.rs            # Transport des fichiers (MWS / mDNS LAN)
      peer_discovery.rs       # Decouverte de pairs (mDNS + Webway)
      vector_clock.rs         # Horloges vectorielles pour ordonnancement P2P
    crypto/
      mod.rs                  # Couche chiffrement (Decision D4)
      at_rest.rs              # Chiffrement au repos (AES-256-GCM / ChaCha20-Poly1305)
      e2e.rs                  # Chiffrement E2E pour sync P2P
      keys.rs                 # Gestion de cles (derivation, rotation, stockage securise)
      streaming.rs            # Dechiffrement streaming pour partage web
    storage/
      mod.rs                  # Abstraction stockage fichier
      local_fs.rs             # Backend stockage local (filesystem)
      chunking.rs             # Decoupe en chunks pour gros fichiers
      integrity.rs            # Checksums (SHA-256) et verification HMAC
      encrypted_fs.rs         # Surcouche chiffree sur local_fs
    domain/
      mod.rs                  # Logique metier
      sharing.rs              # Logique de partage (interne Tribu + externe web)
      external_share.rs       # Partage web restreint (liens, expiration, revocation)
      quota.rs                # Logique de quotas
      jay1tribu_migration.rs  # Migration des donnees Jay1Tribu (Decision D3)
    export/
      mod.rs
      archive.rs              # Export ZIP + manifest
```

### 7.2 Couche app (`apps/miyucloud/`)

```
apps/miyucloud/
  Cargo.toml
  src/
    main.rs                   # Serveur axum (API REST interne + surface web restreinte)
    api/
      mod.rs
      files.rs                # CRUD fichiers (/api/files/*) -- acces interne (Central) uniquement
      folders.rs              # CRUD dossiers (/api/folders/*) -- acces interne uniquement
      shares.rs               # Gestion partages (/api/shares/*) -- interne + liens externes
      sync.rs                 # Endpoints sync P2P (/api/sync/*) -- entre pairs authentifies
      auth.rs                 # Auth interne (/api/auth/*)
    web_surface/
      mod.rs                  # Surface web de partage externe (Decision D2)
      share_page.rs           # Page de telechargement pour liens de partage
      rate_limiter.rs         # Rate limiting agressif
      access_log.rs           # Logging complet des acces externes
      sandbox.rs              # Isolation : aucun acces aux fichiers non partages
      tls.rs                  # HTTPS obligatoire, refus HTTP
      static/                 # Assets web minimaux (HTML/CSS/JS)
```

### 7.3 Integration Central

- Nouveau module UI dans `apps/central/src/` pour l'explorateur de fichiers
- Enregistrement dans le catalogue de services (ServiceManager)
- Lancement/arret via Central

### 7.4 Dependances internes

| Crate dependance | Usage |
|------------------|-------|
| `kindmother` | Persistance metadonnees |
| `miyauth` | Identite et verification |
| `miyumedia` | Thumbnails et apercu medias |
| `miyunotify` | Notifications de partage |
| `strongfather` | Validation acces et politiques |
| `miyuwebway_tracker` | Transport sync P2P via Webway (MWS) |

### 7.5 Dependances externes (crates Rust)

| Crate | Usage |
|-------|-------|
| `ring` ou `chacha20poly1305` | Chiffrement symetrique (Decision D4) |
| `x25519-dalek` | Echange de cles Diffie-Hellman pour E2E |
| `argon2` | Derivation de cles depuis passphrase |
| `mdns-sd` ou equivalent | Decouverte de pairs en reseau local (Decision D1) |
| `rustls` | TLS pour HTTPS obligatoire (Decision D2) |
| `tower-http` | Rate limiting, CORS, compression (Decision D2) |

### 7.6 Plan de depreciation Jay1Tribu (Decision D3)

| Etape | Action | Declencheur |
|-------|--------|-------------|
| 1 | Ajouter avertissement de depreciation dans Jay1Tribu (`send_file` marque deprecated) | Debut dev MiyuCloud |
| 2 | Implementer outil de migration Jay1Tribu -> MiyuCloud (`jay1tribu_migration.rs`) | Phase A MVP |
| 3 | Rediriger les appels `send_file` de Jay1Tribu vers MiyuCloud (proxy transparent) | Phase B |
| 4 | Supprimer la fonctionnalite `send_file` de Jay1Tribu | Phase C |
| 5 | Evaluer les fonctionnalites restantes de Jay1Tribu (chat, presence) : migrer ou conserver | Post-MiyuCloud |

---

## 8. Agents impliques et roles

| Agent | Phase(s) | Responsabilite | Livrables |
|-------|----------|---------------|-----------|
| **Maria** | P0 | Cadrage, classification, brief, questions | Ce document |
| **Fabrice** | P0 | Analyse concurrentielle (Nextcloud, Syncthing, Google Drive, Seafile) | Section integree au brief |
| **Denis** | P1, P2, P4, P5 | Spec technique, plan atomique, integration, livraison | Spec, plan, commit final |
| **Francois** | P3 | Implementation back-end : crate miyucloud, API REST, sync engine, storage | Code back-end, tests |
| **Lise** | P3 | Implementation front-end : UI Central, interface web | Composants Dioxus, HTML/CSS/JS web |
| **George** | P4 | Audit conformite (Lois, securite, UX) | Rapport d'audit |
| **Arianne** | P6 | Archivage, capitalisation, mise a jour memoire | Archives, MEMORY.md |

---

## 9. Risques identifies

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R1 | **Complexite du moteur de sync P2P** : la synchronisation bidirectionnelle pair-a-pair avec horloges vectorielles et chiffrement E2E est un probleme algorithmiquement difficile (Decision D1 + D4) | Elevee | Eleve | Commencer par sync unidirectionnelle (upload only), ajouter bidi en phase 2. S'inspirer de Syncthing (open source, P2P, Go). Prototyper les horloges vectorielles en isolation. |
| R2 | **Securite surface web** : exposer une surface du COG sur le reseau cree une surface d'attaque meme restreinte (Decision D2) | Elevee | Eleve | Surface minimale (download only pour externes), rate limiting agressif, sandboxing strict, HTTPS obligatoire, expiration obligatoire, logging complet, audit George dedie a la securite web. |
| R3 | **Performance gros fichiers chiffres** : le chiffrement/dechiffrement ajoute une surcharge aux operations I/O, aggravee par le chunking (Decision D4) | Moyenne | Moyen | Chiffrement streaming (pas de chargement complet en memoire), chunked upload/download, benchmarks de performance des le prototype. |
| R4 | **Conflits de sync P2P** : modifications simultanees du meme fichier sur deux noeuds pairs sans arbitre central (Decision D1) | Moyenne | Moyen | Horloges vectorielles pour detection. Strategie explicite : copie de conflit (comme Syncthing), notification utilisateur, jamais de perte silencieuse. |
| R5 | **Exposition Internet** : l'utilisateur veut partager des fichiers vers l'exterieur mais le COG est derriere un NAT (Decision D2) | Moyenne | Moyen | Documentation : reverse proxy, tunnel Cloudflare (optionnel, LOI-1 compatible car non critique). La surface web restreinte limite l'exposition. |
| R6 | **Scope creep** : la demande couvre un perimetre tres large (sync P2P, surface web, chiffrement, migration Jay1Tribu, partage) | Elevee | Moyen | Phasage strict en 3 phases. Le chiffrement est integre des le debut (pas en retrofit). |
| R7 | **Migration Jay1Tribu** : la depreciation de Jay1Tribu peut impacter les utilisateurs existants si la migration est incomplete (Decision D3) | Moyenne | Moyen | Migration par etapes avec periode de coexistence (proxy transparent). Jamais de suppression sans confirmation que toutes les donnees sont migrees. |
| R8 | **Client mobile** : Rust sur mobile necessite FFI ou client HTTP separe | Moyenne | Faible | Reporter le client mobile natif. Phase 1 = surface web responsive suffit pour mobile. |
| R9 | **Complexite du chiffrement** : gestion de cles, derivation, rotation, recovery en cas de perte de passphrase (Decision D4) | Elevee | Eleve | Commencer avec un schema simple (1 cle maitre derivee par Argon2, pas de rotation en MVP). Prevoir un mecanisme de recovery (cles de secours). Audit crypto par George obligatoire. |
| R10 | **Decouverte de pairs** : mDNS peut etre bloque par certains reseaux (firewalls, reseaux d'entreprise) (Decision D1) | Moyenne | Faible | Fallback sur Webway (MWS) si mDNS echoue. Possibilite de saisie manuelle d'adresse IP du pair. |

---

## 10. Budget et ressources (estimation)

### 10.1 Effort de developpement (en sessions de travail agent)

> **Note** : Estimations revisees suite aux decisions D1-D4. Le chiffrement E2E (D4),
> le P2P (D1) et la securisation de la surface web (D2) augmentent significativement l'effort.

| Poste | Optimiste | Pessimiste | Notes |
|-------|-----------|------------|-------|
| P0 Cadrage + P0 Analyse PR | 1 session | 2 sessions | Ce brief + analyse Fabrice |
| P1 Specification technique | 3 sessions | 5 sessions | Denis, spec complete incluant crypto + P2P + surface web |
| P2 Plan atomique | 2 sessions | 4 sessions | Denis, decomposition taches (plus de modules) |
| P3 Back-end (crate + API + sync P2P) | 10 sessions | 18 sessions | Francois, sync P2P + horloges vectorielles |
| P3 Couche chiffrement (crypto) | 4 sessions | 8 sessions | Francois, E2E + at-rest + gestion cles |
| P3 Surface web securisee | 3 sessions | 6 sessions | Francois, sandboxing + rate limiting + TLS |
| P3 Front-end (Central UI) | 4 sessions | 8 sessions | Lise, UI explorateur (plus de surface web complete) |
| P3 Migration Jay1Tribu | 2 sessions | 4 sessions | Francois, outil de migration + proxy |
| P4 Audit (incluant audit crypto) | 2 sessions | 4 sessions | Denis + George, audit securite renforce |
| P5 Livraison | 1 session | 1 session | Denis |
| P6 Archivage | 1 session | 1 session | Arianne |
| **TOTAL** | **33 sessions** | **61 sessions** | +65% vs estimation initiale |

### 10.2 Ressources techniques

| Ressource | Besoin |
|-----------|--------|
| Espace disque serveur | Variable (stockage utilisateur, pas de surcout fixe -- LOI-5) |
| Port reseau | 1 port HTTP/HTTPS pour l'acces web (configurable) |
| CPU | Faible en idle, pics lors de sync et thumbnails |
| RAM | Faible (<100 Mo base), proportionnel aux uploads concurrents |

---

## 11. Proposition de phasage MVP

Compte tenu de l'ampleur du projet (T5), un phasage en **3 livraisons incrementales** est recommande :

### Phase A -- MVP Stockage local chiffre (T4 equivalent)

**Objectif** : Naviguer, uploader, downloader des fichiers chiffres via Central et API REST.

- F01-F05 : CRUD fichiers/dossiers
- F10 : Corbeille
- F28 : Checksum integrite
- **F44 : Chiffrement au repos des le depart (Decision D4)**
- **F46 : Gestion de cles basique (1 cle maitre, derivation Argon2)**
- F49 : Verification integrite post-dechiffrement
- Crate `miyucloud` de base (incluant module `crypto/`)
- App `miyucloud` serveur axum minimal
- UI Central : explorateur de fichiers basique
- **F37 : Avertissement de depreciation dans Jay1Tribu (Decision D3)**

### Phase B -- Surface web + Partage (T4 equivalent)

**Objectif** : Partager des fichiers avec des utilisateurs hors COG via surface web securisee. Partage interne Tribu.

- F17-F18 : Partage fichiers/dossiers au sein de la Tribu
- **F19 : Liens de partage externes avec expiration obligatoire (Decision D2)**
- F20 : Dossier partage de Tribu
- **F22-F24 : Surface web restreinte de partage (download only pour externes) (Decision D2)**
- **F38-F43 : Securites surface web (rate limiting, sandboxing, logging, HTTPS, revocation) (Decision D2)**
- **F48 : Dechiffrement streaming pour partage web (Decision D4)**
- F25-F26 : Apercu web minimal + responsive
- F31-F32 : Quotas et dashboard
- **F36 : Migration donnees Jay1Tribu (Decision D3)**

### Phase C -- Synchronisation P2P multi-postes (T4 equivalent)

**Objectif** : Sync automatique chiffree E2E entre les machines de l'utilisateur en pair-a-pair.

- **F11-F13 : Sync P2P bidirectionnelle avec horloges vectorielles (Decision D1)**
- **F34 : Decouverte de pairs mDNS/Webway (Decision D1)**
- **F35 : Canal sync chiffre E2E (Decision D1 + D4)**
- **F45 : Chiffrement E2E du transport (Decision D4)**
- F14-F16 : Sync selective, indicateur statut, fichiers a la demande
- F47 : Rotation des cles
- F27, F29-F30 : Workflow mobile (backup photos via surface web responsive)
- F06-F09 : Recherche, apercu, versionning
- F33 : Journal d'activite

---

## 12. Questions ouvertes pour l'utilisateur

### Questions RESOLUES (decisions verrouillees)

| # | Question | Reponse | Decision |
|---|----------|---------|----------|
| Q4 | **Topologie de sync** | Pair-a-pair entre les machines de l'utilisateur | **D1** |
| Q7 | **Accessibilite web** | Surface web du COG pour partage vers utilisateurs hors COG, avec securites strictes | **D2** |
| Q11 | **Jay1Tribu** | MiyuCloud remplace Jay1Tribu pour le partage fichier. Depreciation puis absorption. | **D3** |
| Q13 | **Chiffrement E2E** | Oui, chiffrement et securite renforces (E2E + stockage chiffre) | **D4** |

### Questions ENCORE OUVERTES

Avant de passer en P1 (specification technique par Denis), les points suivants restent a clarifier :

#### Architecture et priorites

1. **Phasage MVP** : Le phasage A/B/C revise ci-dessus convient-il ? (A = stockage chiffre, B = surface web + partage, C = sync P2P)

2. **Nom du service** : `MiyuCloud` convient-il ? Alternatives envisageables : `JayCloud`, `MiyuDrive`, `MiyuVault`.

3. **Stockage physique** : Les fichiers seront sur le filesystem local du COG. Faut-il supporter des volumes externes (disque USB, NAS monte) ?

#### Synchronisation

5. **Taille maximale de fichier** : Y a-t-il une limite a prevoir ? (impact sur le chunking et le transport P2P)

6. **Sync selective** : L'utilisateur doit-il pouvoir choisir quels dossiers synchroniser sur chaque poste, ou tout est synchronise par defaut ?

#### Acces web

8. **2FA** : L'authentification web pour la gestion des partages (cote proprietaire COG) doit-elle inclure un second facteur (TOTP) des le debut ?

#### Partage et Tribu

9. **Partage public** : Les liens de partage externes (Decision D2) supportent-ils des mots de passe ou uniquement l'expiration ? Faut-il limiter le nombre de telechargements par lien ?

10. **Quotas** : Y a-t-il des quotas par defaut a prevoir (ex : 50 Go par membre de Tribu) ou c'est libre/configurable ?

#### Integration

12. **MiyuMedia** : Les thumbnails doivent-ils etre generes a l'upload (eager) ou a la demande (lazy) ?

#### Securite

14. **Historique de versions** : Besoin reel de versionning (historique complet des modifications d'un fichier) ou la corbeille suffit ?

15. **Recovery de cles** : En cas de perte de la passphrase de chiffrement, quel mecanisme de recovery ? (cles de secours papier, question secrete, aucun recovery = zero-knowledge strict ?)

---

## 13. Analyse concurrentielle (a completer par Fabrice)

> **Note Maria** : Fabrice doit etre lance en parallele pour analyser les solutions existantes :
> - **Nextcloud** (self-hosted, PHP, reference du marche)
> - **Syncthing** (P2P, Go, sync sans serveur central)
> - **Seafile** (self-hosted, Python/C, orientee performance)
> - **Google Drive / OneDrive / Dropbox** (references commerciales)
>
> Points a couvrir : qualites, defauts, fonctionnalites differenciantes,
> points de friction utilisateur, et recommandations pour MiyuCloud.
>
> **Statut : EN ATTENTE lancement Fabrice**

---

## 14. Suivi d'avancement

| Date | Action | Statut |
|------|--------|--------|
| 2026-03-01 | Brief P0 redige par Maria | Fait |
| 2026-03-01 | Questions structurantes posees a l'utilisateur (Q4, Q7, Q11, Q13) | Fait |
| 2026-03-01 | Decisions D1-D4 verrouillees par l'utilisateur | Fait |
| 2026-03-01 | Brief P0 mis a jour avec decisions et consequences architecturales | Fait |
| - | Reponses aux questions ouvertes restantes (Q1-3, Q5-6, Q8-10, Q12, Q14-15) | EN ATTENTE |
| - | Approbation utilisateur du brief final | EN ATTENTE |
| - | Analyse PR Fabrice | A LANCER |
| - | Lancement P1 (Denis) | Bloque par approbation P0 |

---

**Quality Gate P0** : Ce brief doit etre approuve par l'utilisateur avant passage en P1.

**Prochain jalon** : Reponses aux questions ouvertes restantes -> Approbation finale -> Lancement Fabrice + Denis en parallele.

**Note depreciation** : Des l'approbation de ce brief, un avertissement de depreciation sera ajoute a Jay1Tribu. Les utilisateurs de `send_file` seront informes que cette fonctionnalite sera remplacee par MiyuCloud.
