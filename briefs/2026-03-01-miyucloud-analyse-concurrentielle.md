# Analyse PR — MiyuCloud (Cloud Prive Auto-Heberge)

**Analyste** : Fabrice (PR Analyst)
**Date** : 2026-03-01 (Mise a jour : 2026-03-03)
**Phase** : P0 — Cadrage
**Classification estimee** : T5 (Chantier strategique)
**Destinataires** : Maria (validation) -> Denis (exploitation technique)
**MAJ 2026-03-03** : Ajout de Tresorit (section 1.5), ajout lignes Self-hosting et Audit securite dans la matrice 3.1, renumerotation sections 1.6-1.8.

---

## Synthese executrice

MiyuCloud vise a offrir un cloud prive ou le COG de l'utilisateur sert de serveur, avec synchronisation P2P entre machines et partage web securise vers l'exterieur. Le marche des solutions auto-hebergees est domine par Nextcloud (ecosysteme riche mais lourd), Syncthing (P2P pur mais sans partage web), et Seafile (performant mais limite). Aucune solution existante ne combine nativement : P2P pur + partage web securise + liberation stockage mobile + chiffrement E2E complet + zero dependance externe. C'est exactement le positionnement unique de MiyuCloud.

---

## 1. Concurrents identifies

### 1.1 Nextcloud — Le leader open-source

| Critere | Detail |
|---------|--------|
| **Stack** | PHP (backend), JavaScript/Vue.js (frontend), MariaDB/MySQL/PostgreSQL (DB), WebDAV (protocole sync) |
| **Licence** | AGPLv3 (open-source) |
| **Prix** | Gratuit (Community) / Enterprise a partir de 36EUR/user/an |
| **Architecture** | Client-serveur classique. Serveur centralise obligatoire (Apache/Nginx + PHP-FPM). Clients desktop/mobile se synchronisent via WebDAV/HTTPS |

**Forces :**
- Ecosysteme d'apps le plus riche du marche (400+ apps : calendrier, contacts, mail, visio, notes, kanban)
- Grande communaute active et documentation abondante
- Interface web complete et moderne
- Partage par lien public avec mot de passe et expiration
- Support federation inter-serveurs
- Clients desktop (Windows/macOS/Linux) et mobile (Android/iOS)
- Integration LDAP/AD, SSO, 2FA
- Certification de securite (BSI en Allemagne)

**Faiblesses :**
- **Performance mediocre** : PHP est le goulot d'etranglement. Sync limitee a ~30 MB/s meme sur hardware puissant. Gros fichiers (>4 GB) echouent regulierement
- **Sync lente avec beaucoup de fichiers** : Le client desktop rame au-dela de 100 000 fichiers. Un utilisateur rapporte un echec initial sur 580 000 fichiers
- **Configuration serveur complexe** : Necessite PHP-FPM bien tune, Redis/Memcached pour le cache, OPcache, reverse proxy. Beaucoup de knobs a regler
- **E2E incompleted** : Le chiffrement E2E existe mais reste instable en 2026. Les fichiers E2E ne sont pas accessibles depuis le navigateur web. Erreurs frequentes (impossible de sauvegarder les cles)
- **Fragilite des mises a jour** : Les apps tierces cassent regulierement lors des montees de version. Aucune garantie de compatibilite
- **App Android peu fiable** : Upload photos instable, sync en arriere-plan capricieuse
- **Consommation ressources** : 80% du serveur pour syncer 11 GB la ou Seafile n'utilise que 30%

**Points de friction UX :**
- La page d'administration est un labyrinthe de parametres
- Les conflits de sync sont mal geres (fichiers dupliques avec suffixe `(conflict)`)
- L'interface se fige lors de l'upload de gros fichiers
- Les previews/thumbnails sont lentes a generer
- Le premier sync peut prendre des heures sans retour visuel clair

**Sources :**
- [Nextcloud Review 2026 - CyberInsider](https://cyberinsider.com/cloud-storage/reviews/nextcloud/)
- [Nextcloud Reviews - Capterra](https://www.capterra.com/p/161572/NextCloud/reviews/)
- [Nextcloud Performance Troubleshooting - Autoize](https://autoize.com/nextcloud-performance-troubleshooting/)
- [Sync extremely slow with large files - Nextcloud Forum](https://help.nextcloud.com/t/sync-extremely-slow-with-large-number-of-files-on-desktop/102564)
- [E2E Encryption Status - Nextcloud Forum](https://help.nextcloud.com/t/end-to-end-encryption-development-status/138185)

---

### 1.2 Syncthing — Sync P2P pure

| Critere | Detail |
|---------|--------|
| **Stack** | Go (backend), JavaScript/Angular (web UI), Block Exchange Protocol (BEP) |
| **Licence** | MPL-2.0 (open-source) |
| **Prix** | 100% gratuit |
| **Architecture** | P2P pur, pas de serveur central. Chaque noeud decouvre les pairs via des serveurs de decouverte globaux (optionnels). Traversee NAT via relais publics quand connexion directe impossible |

**Forces :**
- **Architecture P2P veritable** : Aucun serveur central requis. Les donnees ne transitent jamais par un tiers (sauf relais si NAT bloque)
- **Chiffrement TLS robuste** : Perfect Forward Secrecy, certificats cryptographiques par appareil (Device ID = SHA-256 du certificat)
- **Open-source tres actif** : 64 000+ stars GitHub, 400+ contributeurs
- **Fiable et silencieux** : Une fois configure, fonctionne en arriere-plan sans intervention
- **Leger** : Binaire unique, pas de dependance (DB, cache, serveur web)
- **Versionning de fichiers** integre (configurable par dossier)
- **Delta sync** : Ne transfere que les blocs modifies

**Faiblesses :**
- **Pas de partage web** : Impossible de partager un fichier via un lien vers un tiers sans Syncthing
- **Pas d'interface web de gestion de fichiers** : L'UI web ne sert qu'a la configuration, pas a naviguer/telecharger les fichiers
- **Pas de support iOS** : Apple bloque les apps qui font de la sync P2P en arriere-plan. Un client tiers (Mobius Sync) existe mais est payant et limite
- **Scalabilite limitee** : Performances qui se degradent avec des milliers de fichiers ou des structures de dossiers tres profondes
- **Traversee NAT imparfaite** : Les relais publics sont lents. Derriere un double NAT ou des reseaux d'entreprise, la connexion peut etre impossible
- **Pas de gestion des utilisateurs** : Pas de notion de comptes, permissions, ou quotas
- **Pas de backup mobile** : Pas de fonctionnalite de liberation d'espace telephone

**Points de friction UX :**
- Configuration initiale technique (Device IDs a echanger manuellement)
- L'ajout d'un nouvel appareil necessite une action sur les DEUX appareils
- Pas de vue d'ensemble de "mon cloud" — c'est un outil de sync, pas un gestionnaire de fichiers
- Les conflits generent des fichiers `.sync-conflict-*` que l'utilisateur doit resoudre manuellement
- Pas d'app officielle iOS

**Sources :**
- [Syncthing Reviews - Product Hunt](https://www.producthunt.com/products/syncthing/reviews)
- [Syncthing P2P File Sync - CtrlAltNod](https://www.ctrlaltnod.com/opensource/syncthing-secure-p2p-file-sync-without-the-cloud/)
- [Syncthing Review - ProPrivacy](https://proprivacy.com/cloud/review/syncthing)
- [Relay System - Syncthing DeepWiki](https://deepwiki.com/syncthing/syncthing/3.4-relay-system)
- [BEP v1 Specification - Syncthing Docs](https://docs.syncthing.net/specs/bep-v1.html)

---

### 1.3 Seafile — Cloud prive oriente performance

| Critere | Detail |
|---------|--------|
| **Stack** | C (daemon sync), Python/Django (web), JavaScript/React (frontend), SQLite/MySQL/PostgreSQL (DB) |
| **Licence** | AGPLv3 (Community) / Proprietary (Pro) |
| **Prix** | Gratuit (Community, 3 users) / Pro a partir de ~10EUR/user/an |
| **Architecture** | Client-serveur. Le daemon de sync est ecrit en C pour la performance. Les fichiers sont stockes dans un format interne base sur des blocs de-dupliques (pas en fichiers bruts sur le filesystem) |

**Forces :**
- **Performances exceptionnelles** : Sync d'un dossier de 11 GB en 6 minutes contre bien plus pour Nextcloud. Download LAN a 100 MB/s
- **Leger sur les ressources** : 30% CPU la ou Nextcloud utilise 80%. Tourne sur un Raspberry Pi
- **Chiffrement E2E fonctionnel** : Les "encrypted libraries" offrent un chiffrement cote client avec AES-256-CBC. Le serveur n'a jamais acces aux contenus
- **De-duplication par blocs** : Reduit l'espace disque utilise, surtout pour les photos
- **Versionning robuste** : Historique des modifications par fichier, snapshots de bibliotheques
- **Interface web propre** : Vues table, kanban, galerie, carte (v13, 2025)
- **SeaDoc** : Editeur Markdown collaboratif integre

**Faiblesses :**
- **Format de stockage opaque** : Les fichiers ne sont pas accessibles directement sur le filesystem. Si Seafile casse, les donnees sont difficilement recuperables sans les outils Seafile
- **Pas de P2P** : Architecture client-serveur uniquement. Pas de sync directe entre machines sans passer par le serveur
- **Ecosysteme d'apps limite** : Pas de calendrier, contacts, mail, visio. C'est un cloud de fichiers, pas une suite collaborative
- **Community Edition limitee a 3 utilisateurs** (restriction recente)
- **Les metadonnees ne sont PAS chiffrees** : Meme avec les "encrypted libraries", les noms de fichiers, tailles, et historique des modifications sont visibles sur le serveur
- **Documentation parfois lacunaire** en anglais

**Points de friction UX :**
- Le concept de "libraries" (bibliotheques) est deroutant pour les nouveaux utilisateurs habitues a un arbre de dossiers classique
- Le client desktop est fonctionnel mais l'UI est datee comparee a Nextcloud
- Le partage par lien est possible mais moins flexible que Nextcloud (pas de mot de passe sur la version Community)
- Lenteurs signalees en multi-utilisateurs concurrents

**Sources :**
- [Nextcloud to Seafile Switch - XDA Developers](https://www.xda-developers.com/completely-uprooted-nextcloud-server-switched-seafile-instead/)
- [Seafile Reviews - Capterra](https://www.capterra.com/p/161574/Seafile/reviews/)
- [Seafile Encryption - User Manual](https://help.seafile.com/security_and_encryption/use_encrypted_libraries/)
- [Seafile Security Features - Admin Manual](https://haiwen.github.io/seafile-admin-docs/12.0/administration/security_features/)
- [Encrypted libraries leak metadata - GitHub Issue #350](https://github.com/haiwen/seafile/issues/350)

---

### 1.4 ownCloud — L'historique

| Critere | Detail |
|---------|--------|
| **Stack** | Go (Infinity Scale / OCIS), anciennement PHP. Micro-services. LibreGraph API |
| **Licence** | Apache 2.0 (OCIS) / Proprietary (features entreprise) |
| **Prix** | Gratuit (Community) / Enterprise ~40-50EUR/user/an |
| **Architecture** | OCIS (ownCloud Infinite Scale) est une reecriture complete en Go avec architecture micro-services. Abandonne PHP. Stockage "Spaces" (inspired by MS Teams) |

**Forces :**
- **Performance superieure** : Le backend Go de OCIS est nettement plus rapide que Nextcloud PHP pour le transfert de fichiers et la gestion de charge
- **Scalabilite** : Architecture micro-services, scalable horizontalement. Cible les grandes organisations (10 000+ users)
- **File Firewall** : Regles avancees de controle d'acces aux fichiers (DLP-like)
- **Protection ransomware** integree
- **UI modernisee** avec le concept de "Spaces" pour la collaboration d'equipe
- **WebDAV et LibreGraph API** : Standards ouverts pour l'integration

**Faiblesses :**
- **Identite confuse** : ownCloud a une image de "Nextcloud en moins bien" depuis le fork de 2016, malgre la reecriture en Go
- **Ecosysteme d'apps pauvre** : Beaucoup moins d'apps que Nextcloud
- **Migration OCIS penible** : La migration depuis l'ancien ownCloud PHP est complexe et mal documentee
- **Communaute plus petite** que Nextcloud
- **Orientation enterprise** : Les features les plus interessantes (file firewall, audit, ransomware protection) sont reservees a l'edition payante
- **Pas de P2P** : Client-serveur uniquement

**Points de friction UX :**
- L'interface, bien que modernisee, reste en retard sur Nextcloud en termes de polish
- Le concept de "Spaces" est impose et peut etre confus pour un usage personnel simple
- La documentation est orientee entreprise et peu accessible aux self-hosters individuels

**Sources :**
- [Nextcloud vs ownCloud 2025 - Dicloak](https://dicloak.com/blog-detail/nextcloud-vs-owncloud-in-2025--honest-comparison)
- [Nextcloud vs ownCloud 2026 - QloudHost](https://qloudhost.com/blog/nextcloud-vs-owncloud/)
- [ownCloud vs Nextcloud - ownCloud.com](https://owncloud.com/compare-filesharing/owncloud-vs-nextcloud/)
- [Nextcloud vs ownCloud vs FileCloud 2026 - Contabo](https://contabo.com/blog/nextcloud-vs-owncloud-vs-filecloud/)

---

### 1.5 Tresorit — Reference securite E2E (commercial)

| Critere | Detail |
|---------|--------|
| **Stack** | C++ / .NET (clients natifs), infrastructure cloud proprietaire (Azure-backed), protocole proprietaire |
| **Licence** | Proprietaire (closed-source) |
| **Prix** | Personal Lite 4,75 USD/mois (50 GB, 2 appareils) / Personal Essential 11,99 USD/mois (1 TB, 10 appareils) / Business a partir de 20 EUR/user/mois (1 TB/user) |
| **Architecture** | Client-serveur classique avec serveurs cloud (heberges en Suisse/UE). Chiffrement E2E zero-knowledge cote client avant upload. Le serveur ne voit jamais les donnees en clair |

**Forces :**
- **Chiffrement E2E zero-knowledge certifie** : AES-256 pour les fichiers, RSA-4096 pour l'echange de cles. Verifie par audit independant Ernst & Young (pentest + code review). L'entreprise ne peut techniquement pas acceder aux contenus
- **Certification ISO 27001:2022** validee par TUV Rheinland — le gold standard du management de la securite de l'information
- **Conformite RGPD et HIPAA** native, ce qui en fait la reference pour les entreprises reglementees
- **Juridiction suisse** : Protection forte de la vie privee sous le droit suisse (pas de Cloud Act americain)
- **UX polished** : Interface desktop et web propre, intuitive, comparable a Dropbox en simplicite
- **Versionning et recovery** : Historique des versions et recuperation de fichiers supprimes
- **Partage securise** : Liens de partage avec mot de passe, expiration, et controle d'acces granulaire
- **DRM-like controls** : Possibilite de revoquer l'acces a un fichier partage meme apres telechargement (via le viewer integre)

**Faiblesses :**
- **Pas de self-hosting** : Les donnees sont sur l'infrastructure cloud de Tresorit (Azure). Impossible d'heberger soi-meme. C'est l'antithese du modele COG
- **Prix eleve** : Le plan le moins cher (4,75 USD/mois, 50 GB) offre peu de stockage. Pour une famille de 5, le cout annuel depasse 700 USD en Business
- **Pas de P2P** : Architecture client-serveur uniquement. Pas de sync directe entre appareils
- **Collaboration limitee** : Pas de co-edition en temps reel comparable a Google Docs. Les outils collaboratifs sont fonctionnels mais basiques
- **Closed-source** : Malgre les audits, le code n'est pas verifiable par la communaute
- **Sync plus lente** : Le chiffrement E2E ajoute une etape supplementaire qui ralentit les transferts par rapport aux concurrents non-chiffres
- **Pas de calendrier/contacts/mail** : C'est un cloud de fichiers uniquement, pas une suite

**Points de friction UX :**
- Le plan Personal Lite est limite a 2 appareils, ce qui est contraignant pour une famille multi-devices
- La co-edition de documents est tres limitee comparee a Google Workspace
- Le prix monte vite des qu'on a plusieurs utilisateurs ou besoin de plus de stockage
- Pas de client Linux officiel (uniquement en beta/snap depuis peu)
- Les fichiers ne sont pas accessibles hors-ligne par defaut — il faut marquer explicitement les fichiers pour le mode offline

**Pertinence pour MiyuCloud :**
Tresorit est la reference absolue en matiere de securite E2E et de conformite, mais son modele est l'exact oppose de MiyuCloud : cloud centralise, proprietaire, payant, pas de self-hosting. Son interet pour nous est **pedagogique** : il demontre qu'un chiffrement E2E solide est possible sans sacrifier l'UX, et que les certifications de securite (ISO 27001, audits independants) sont un atout marketing decisif. MiyuCloud doit atteindre le meme niveau de confiance crypto que Tresorit tout en restant self-hosted, open-source et gratuit.

**Sources :**
- [Tresorit Review 2026 - CyberInsider](https://cyberinsider.com/cloud-storage/reviews/tresorit/)
- [Tresorit Review 2025 - SaaStrac](https://hosting.saastrac.com/tresorit-review/)
- [Tresorit Review 2026 - iFeeltech](https://ifeeltech.com/blog/tresorit-review-secure-cloud-storage)
- [Tresorit Security](https://tresorit.com/security)
- [Tresorit Review 2026 - Cloudwards](https://www.cloudwards.net/tresorit-review/)

---

### 1.6 Resilio Sync — P2P commercial

| Critere | Detail |
|---------|--------|
| **Stack** | C++ (core), protocole BitTorrent modifie, clients natifs multi-plateforme |
| **Licence** | Proprietaire (closed-source) |
| **Prix** | Gratuit (basique, 1 dossier) / Personal ~6USD/mois / Business ~15USD/user/mois |
| **Architecture** | P2P base sur le protocole BitTorrent modifie. Pas de serveur central pour les donnees, mais des trackers pour la decouverte des pairs |

**Forces :**
- **Performances P2P excellentes** : 2 a 10x plus rapide que les solutions client-serveur pour les gros transferts. Le protocole BitTorrent est optimise pour la distribution de gros fichiers
- **Selective Sync** : Choisir quels dossiers/fichiers synchroniser sur chaque appareil
- **Transfert de fichiers illimites** en taille
- **Support multi-plateforme complet** : Windows, macOS, Linux, Android, iOS, NAS (Synology, QNAP, WD)
- **Encrypted Folders** : Possibilite de stocker des copies chiffrees sur un noeud intermediaire sans qu'il ait acces au contenu

**Faiblesses :**
- **Closed-source** : Impossible d'auditer le code. Confiance requise envers l'entreprise (basee sur BitTorrent Inc., maintenant Rainberry)
- **Modele payant** : La version gratuite est tres limitee (1 dossier). Le prix a augmente au fil du temps
- **Disparition de fichiers rapportee** : Des utilisateurs signalent la perte de fichiers, ce qui est catastrophique pour un outil de sync
- **Gestion des fichiers temporaires** : Confusion avec les fichiers `.tmp` de Word/CAD qui generent des erreurs de sync
- **Pas d'interface web** pour naviguer les fichiers
- **Support client inconsistant** : Experiences variees rapportees
- **Stagnation du developpement** : Moins de mises a jour recentes, sentiment d'abandon partiel

**Points de friction UX :**
- L'interface est fonctionnelle mais datee
- Les erreurs de sync sont cryptiques et difficiles a diagnostiquer
- La version gratuite est tellement limitee qu'elle sert surtout de demo
- Pas de partage par lien web

**Sources :**
- [Resilio Sync Reviews - Capterra](https://www.capterra.com/p/173194/Resilio-Sync/reviews/)
- [Resilio Sync Reviews - Gartner Peer Insights](https://www.gartner.com/reviews/product/resilio-sync)
- [Syncthing or Resilio Sync - Noted.lol](https://noted.lol/syncthing-or-resilio-sync/)
- [Resilio Sync Reviews - SourceForge](https://sourceforge.net/software/product/Resilio-Sync/)

---

### 1.7 IPFS et solutions decentralisees

| Critere | Detail |
|---------|--------|
| **Stack** | Go (Kubo, implementation de reference), Rust (Iroh), libp2p (reseau), DAG/Merkle tree (stockage) |
| **Licence** | MIT/Apache 2.0 (open-source) |
| **Prix** | Gratuit (le protocole). Pinning services payants (Pinata, Infura, etc.) |
| **Architecture** | Reseau decentralise base sur l'adressage par contenu (CID = hash du contenu). Les noeuds partagent et repliquent les blocs. Pas de serveur central ni de hierarchie |

**Forces :**
- **Adressage par contenu** : L'integrite des donnees est garantie par construction (le hash EST l'adresse)
- **Resilience** : Tant qu'un noeud possede le contenu, il est accessible
- **De-duplication native** : Le meme contenu n'est stocke qu'une fois sur le reseau
- **Pas de censure** : Aucune autorite centrale ne peut supprimer du contenu
- **Interoperabilite** : Protocole standard utilisable par n'importe quelle application
- **Implementation Rust (Iroh)** : Performante et memory-safe

**Faiblesses :**
- **Persistance non garantie** : Si personne ne "pin" un contenu, il disparait du reseau. Necessite un noeud de pinning permanent ou un service de pinning payant
- **Latence elevee** : La decouverte et le routage dans le DHT sont lents. Le premier acces a un contenu peut prendre plusieurs secondes
- **Pas de gestion des utilisateurs** : C'est un protocole de stockage, pas un service complet
- **Pas de versionning natif** : IPNS (InterPlanetary Name System) est la couche de nommage mutable, mais elle est instable et lente
- **Complexite conceptuelle** : L'adressage par contenu, les DAG Merkle, le DHT sont des concepts non triviaux
- **Pas de chiffrement natif** : Le contenu est public par defaut. Le chiffrement doit etre ajoute par l'application
- **Inadapte aux fichiers prives** : Concu pour le partage public, pas pour le stockage prive
- **Consommation reseau** : Le DHT genere du trafic meme sans activite

**Points de friction UX :**
- Aucune interface utilisateur grand public
- L'installation et la configuration d'un noeud IPFS sont reserves aux developpeurs
- Les CIDs sont des chaines incomprehensibles pour un utilisateur final
- Pas de concept de "mes fichiers" ou "mon espace"

**Sources :**
- [IPFS Wikipedia](https://en.wikipedia.org/wiki/InterPlanetary_File_System)
- [IPFS Storage War 2026 - Future](https://future.forem.com/ribhavmodi/where-blockchain-data-actually-lives-ipfs-arweave-the-2026-storage-war-2bka)
- [Mastering IPFS: Speed and Persistence - DEV Community](https://dev.to/vaib/mastering-ipfs-strategies-for-speed-and-data-persistence-h43)
- [IPFS Browsers 2026 - IPFS Forums](https://discuss.ipfs.tech/t/browsers-standards-work-2026-call-for-community-input/19917)

---

### 1.8 Concurrents complementaires (mention rapide)

| Produit | Pertinence pour MiyuCloud | Note |
|---------|---------------------------|------|
| **Immich** | Photo/video backup auto-heberge (Google Photos clone). Mobile-first. AI-powered | Excellent pour le use case "liberation stockage mobile" |
| **ToffeeShare / PairDrop** | Partage P2P via navigateur sans compte | Modele UX interessant pour le partage web |
| **LocalSend** | Transfert LAN direct, zero config | UX tres fluide pour le partage local |
| **Tailscale / ZeroTier** | Overlay VPN P2P pour contourner le NAT | Possible couche reseau sous-jacente |

---

## 2. Cible utilisateur

### 2.1 Profil demographique

| Critere | Detail |
|---------|--------|
| **Age** | 20-45 ans |
| **Profil technique** | Intermediaire a avance. Capable d'installer Miyukini COG, pas forcement admin sys |
| **Motivation principale** | Souverainete numerique, refus du cloud tiers (Google/Microsoft/Apple/Dropbox) |
| **Equipement typique** | 1 PC principal (Windows/Linux), 1 smartphone (Android > iOS), eventuellement 1 laptop ou NAS |
| **Volume de donnees** | 50 GB a 2 TB (photos, documents, projets, musique) |
| **Nombre de machines** | 2 a 5 appareils personnels |

### 2.2 Habitudes d'usage

- Utilise actuellement Google Drive/OneDrive par defaut, ou n'a PAS de solution de backup (le pire cas)
- Photos du telephone jamais sauvegardees systematiquement, stockage telephone plein
- Partage des fichiers avec des proches via WeTransfer, Google Drive, ou messageries (WhatsApp, Telegram)
- Ne veut PAS administrer un serveur Linux avec SSH, Docker, reverse proxy
- Veut que "ca marche" apres l'installation de Miyukini COG

### 2.3 Points de douleur

1. **"Mon telephone est plein"** — Les photos/videos prennent tout l'espace. Pas de solution simple pour les deplacer sur le PC et les supprimer du telephone en securite
2. **"Je ne fais pas confiance a Google/Apple avec mes photos"** — Vie privee, mais pas d'alternative accessible
3. **"Envoyer un gros fichier c'est l'enfer"** — WeTransfer limite a 2 GB, les mails bloquent a 25 MB, Google Drive demande un compte
4. **"Mes fichiers ne sont pas syncronises entre mes appareils"** — Le dossier "Documents" du PC n'est pas sur le laptop
5. **"Nextcloud c'est trop complique a installer"** — PHP, base de donnees, reverse proxy, certificats SSL... abandon
6. **"J'ai peur de perdre mes donnees"** — Pas de backup automatique, disque dur unique

### 2.4 Attentes prioritaires

1. **Zero configuration serveur** : MiyuCloud doit fonctionner immediatement apres l'installation de COG
2. **Backup mobile simple** : Un bouton "sauvegarder mes photos" + liberation automatique de l'espace
3. **Partage facile** : Generer un lien de telechargement pour n'importe qui, sans compte
4. **Sync transparente** : Les fichiers sont automatiquement disponibles sur toutes mes machines COG
5. **Securite par defaut** : Chiffrement sans action de l'utilisateur
6. **Pas de cout recurrent** : "C'est MON disque dur, pourquoi je paierais un abonnement ?"

---

## 3. Fonctionnalites cles du marche

### 3.1 Tableau comparatif des fonctionnalites

| Fonctionnalite | Indispensable | Differenciateur | Nextcloud | Syncthing | Seafile | ownCloud | Tresorit | Resilio | IPFS |
|----------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Sync fichiers entre machines | OUI | NON | OK | OK | OK | OK | OK | OK | -- |
| Chiffrement E2E par defaut | OUI | OUI | Partiel | TLS only | OK (par lib) | NON | OK | Partiel | NON |
| Partage par lien web (sans compte) | OUI | NON | OK | -- | OK | OK | OK | -- | -- |
| Backup photos mobile + liberation espace | OUI | OUI | Partiel | -- | -- | -- | Partiel | -- | -- |
| Sync P2P (sans serveur central tiers) | OUI | OUI | -- | OK | -- | -- | -- | OK | OK |
| Interface web de gestion fichiers | OUI | NON | OK | -- | OK | OK | OK | -- | -- |
| Fonctionne hors-ligne | OUI | OUI | Partiel | OK | Partiel | Partiel | Partiel | OK | Partiel |
| Zero configuration serveur | NON | OUI | -- | Partiel | -- | -- | OK (cloud) | Partiel | -- |
| Delta sync (blocs modifies) | NON | NON | -- | OK | OK | -- | -- | OK | OK |
| Versionning fichiers | NON | NON | OK | OK | OK | OK | OK | -- | Natif |
| Gestion multi-utilisateurs | NON | NON | OK | -- | OK | OK | OK | -- | -- |
| App mobile native | OUI | NON | OK | Android | OK | OK | OK | OK | -- |
| Preview/thumbnails | NON | NON | OK | -- | OK | OK | OK | -- | -- |
| Integration suite bureautique | NON | NON | OK | -- | Partiel | OK | Partiel | -- | -- |
| Surface web pour partage externe | OUI | OUI | OK (tout via web) | -- | OK | OK | OK | -- | -- |
| Chiffrement metadonnees | NON | OUI | -- | N/A | -- | -- | OK | -- | -- |
| Reprise sur interruption (resume) | OUI | NON | Partiel | OK | OK | Partiel | OK | OK | Partiel |
| Self-hosting | OUI | NON | OK | OK | OK | OK | -- | OK | OK |
| Audit securite independant | NON | OUI | Partiel | -- | -- | -- | OK (E&Y) | -- | -- |

**Legende :** OK = present et fonctionnel, Partiel = present mais limite/instable, -- = absent, N/A = non applicable

### 3.2 Fonctionnalites manquantes sur le marche (opportunites)

| Fonctionnalite absente | Impact utilisateur | Concurrent le plus proche |
|------------------------|--------------------|---------------------------|
| Backup mobile + suppression securisee automatique | TRES ELEVE | Immich (mais c'est un outil separe, pas integre) |
| P2P + partage web dans le meme outil | ELEVE | Aucun. Syncthing fait du P2P sans web. Nextcloud fait du web sans P2P |
| Chiffrement E2E transparent (zero config) | ELEVE | Seafile (mais il faut creer des "encrypted libraries" explicitement) |
| Cloud prive integre a un ecosysteme desktop natif | ELEVE | Aucun. Tous sont des services standalone |
| Traversee NAT fiable sans relais tiers | MOYEN | Syncthing (mais ses relais publics sont lents) |

---

## 4. Points de friction concurrents — Synthese croisee

### 4.1 Frictions d'installation et configuration

| Irritant | Concurrents concernes | Severite |
|----------|-----------------------|----------|
| Installer un serveur Linux + stack LAMP/LEMP | Nextcloud, Seafile, ownCloud | CRITIQUE |
| Configurer un reverse proxy + certificats SSL | Nextcloud, Seafile, ownCloud | HAUTE |
| Echanger manuellement des Device IDs | Syncthing | MOYENNE |
| Configurer le port forwarding / NAT | Tous | HAUTE |
| Tuner PHP-FPM, Redis, OPcache pour des perfs correctes | Nextcloud | HAUTE |

### 4.2 Frictions d'utilisation quotidienne

| Irritant | Concurrents concernes | Severite |
|----------|-----------------------|----------|
| Conflits de sync mal geres (fichiers dupliques) | Nextcloud, Syncthing | HAUTE |
| Upload de gros fichiers (>4 GB) qui echoue | Nextcloud | HAUTE |
| Sync en arriere-plan instable sur mobile | Nextcloud, Syncthing | HAUTE |
| Lenteur des previews et thumbnails | Nextcloud | MOYENNE |
| Concept de "bibliotheques" au lieu de dossiers | Seafile | MOYENNE |
| Pas de partage vers des non-utilisateurs | Syncthing, Resilio | CRITIQUE |
| Interface datee et peu intuitive | Syncthing, Resilio, Seafile | MOYENNE |

### 4.3 Frictions de securite et confiance

| Irritant | Concurrents concernes | Severite |
|----------|-----------------------|----------|
| E2E instable, cles perdues | Nextcloud | HAUTE |
| Metadonnees non chiffrees (noms, tailles) | Seafile, Nextcloud | MOYENNE |
| Code ferme, impossible a auditer | Resilio | HAUTE |
| Donnees qui disparaissent silencieusement | Resilio | CRITIQUE |
| Contenu non persiste si pas de pinning | IPFS | CRITIQUE |

---

## 5. Recommandations strategiques pour MiyuCloud

### 5.1 Positionnement unique

MiyuCloud doit etre **le premier cloud prive P2P integre a un ecosysteme desktop natif**, avec cette proposition de valeur :

> "Ton COG est ton cloud. Tes fichiers sont chez toi, synchronises entre tes machines, partageables avec le monde entier — sans serveur, sans abonnement, sans confiance en un tiers."

Aucun concurrent ne combine actuellement :
1. Sync P2P native entre machines COG
2. Partage web securise vers l'exterieur (surface web ephemere)
3. Backup mobile avec liberation d'espace
4. Chiffrement E2E transparent
5. Zero configuration serveur (le COG fait tout)
6. Interface integree a Central (pas un service web separe)

### 5.2 Fonctionnalites a prioriser

#### MUST-HAVE (MVP)

| # | Fonctionnalite | Justification |
|---|----------------|---------------|
| 1 | **Sync P2P entre machines COG** | C'est le coeur du produit. Utiliser un protocole inspire de BEP (Syncthing) mais en Rust natif. Delta sync par blocs |
| 2 | **Gestionnaire de fichiers dans Central** | Naviguer, organiser, previsualiser ses fichiers cloud depuis l'UI Dioxus. Arbre de dossiers classique (pas de "bibliotheques" a la Seafile) |
| 3 | **Partage par lien web** | Surface web minimale (serveur HTTP integre au COG) pour generer un lien de telechargement temporaire. Le destinataire n'a besoin de rien |
| 4 | **Chiffrement E2E automatique** | Tout fichier synchronise est chiffre par defaut. Le COG detient les cles. AES-256-GCM (pas CBC comme Seafile). Cles derivees du master key COG |
| 5 | **Decouverte automatique des pairs LAN** | mDNS/DNS-SD pour detecter les autres COG sur le reseau local sans configuration |
| 6 | **Resume/reprise sur interruption** | Les transferts interrompus reprennent automatiquement |

#### SHOULD-HAVE (v1.1)

| # | Fonctionnalite | Justification |
|---|----------------|---------------|
| 7 | **Backup photos mobile** | App mobile companion ou integration via protocole standard. Sync automatique des photos, puis suppression securisee apres confirmation de backup |
| 8 | **Traversee NAT (hole punching)** | STUN/TURN ou technique de hole-punching UDP pour connecter les COG derriere des NAT sans relais. Possibilite de relais COG volontaire entre pairs de confiance |
| 9 | **Versionning de fichiers** | Garder N versions precedentes de chaque fichier, configurable par dossier |
| 10 | **Notifications de sync** | Informer l'utilisateur de l'etat de la sync (nouveau fichier, conflit, erreur) dans Central |
| 11 | **Selective sync** | Choisir quels dossiers synchroniser sur chaque machine (toutes les machines n'ont pas le meme espace disque) |

#### NICE-TO-HAVE (v2+)

| # | Fonctionnalite | Justification |
|---|----------------|---------------|
| 12 | **Preview et thumbnails** | Generer des apercu pour les images, PDF, videos directement dans Central |
| 13 | **Recherche dans les fichiers** | Indexation full-text locale des documents |
| 14 | **Partage chiffre avec mot de passe** | Liens de partage proteges par mot de passe + expiration automatique |
| 15 | **Federation inter-COG** | Partager un dossier avec un autre utilisateur COG (pas seulement entre ses propres machines) |
| 16 | **Mode "coffre-fort"** | Dossier a chiffrement renforce necessitant une authentification supplementaire (biometrie, mot de passe secondaire) |

### 5.3 Differenciateurs strategiques

| Differenciateur | Pourquoi c'est gagnant |
|-----------------|------------------------|
| **Rust natif** | Performance de Seafile (C) sans les risques memoire. Superieur a Nextcloud (PHP) et ownCloud (Go). Binaire unique, pas de runtime |
| **Integre a Central** | Pas un service web separe a installer et maintenir. C'est une feature du COG, comme les autres services Jay* |
| **Zero config** | Le COG est le serveur. Pas de PHP, pas de base de donnees a configurer, pas de reverse proxy. Installation = installation de COG |
| **P2P + partage web** | Premier outil a combiner la sync P2P entre ses machines ET le partage web vers l'exterieur dans un meme produit |
| **Chiffrement transparent** | E2E par defaut, pas opt-in. Contrairement a Nextcloud (E2E instable) et Seafile (E2E par bibliotheque), tout est chiffre automatiquement |
| **LOI-2 (Isolement = etat normal)** | Fonctionne 100% hors-ligne. La sync se fait quand les machines sont connectees. Pas de dependance a un service externe pour fonctionner |
| **Liberation stockage mobile** | Feature tueuse que ni Syncthing, ni Resilio, ni Seafile ne proposent. Seul Nextcloud a une tentative (instable) |
| **Remplacement Jay1Tribu** | La migration des utilisateurs existants de Jay1Tribu se fait naturellement au sein de l'ecosysteme Miyukini |

### 5.4 Pieges a eviter

| Piege | Qui est tombe dedans | Comment l'eviter |
|-------|----------------------|------------------|
| **Tenter de devenir une suite collaborative** | Nextcloud (qui fait mail, calendrier, visio, tout et rien de bien) | Rester focus sur les fichiers. Le calendrier c'est JayKonta. La visio c'est un autre service. MiyuCloud = fichiers uniquement |
| **Format de stockage opaque** | Seafile (impossible de recuperer les fichiers sans Seafile) | Stocker les fichiers dans leur format original sur le filesystem. Le chiffrement est une couche au-dessus, pas un format de stockage |
| **E2E opt-in et instable** | Nextcloud (6 ans de developpement E2E toujours buggue) | E2E par defaut, teste massivement. Si c'est la fondation, ca doit etre solide des le jour 1 |
| **Ignorer la traversee NAT** | Syncthing (relais publics lents), tous les self-hosted (port forwarding manuel) | Investir dans le hole-punching UDP/TCP. Proposer un relais COG optionnel. Ne pas dependre de services tiers (LOI-1) |
| **Conflits de sync par duplication** | Nextcloud (fichier-conflict.ext), Syncthing (.sync-conflict-*) | Implementer un CRDT-like ou au minimum une resolution de conflits intelligente avec UI dediee dans Central |
| **App mobile custom full-featured** | Nextcloud (app Android mediocre malgre des annees de dev) | Commencer par un protocole standard (WebDAV?) cote mobile pour que les apps existantes fonctionnent. App custom en phase 2 |
| **Closed-source pour les features avancees** | Resilio, Seafile Pro, ownCloud Enterprise | Rester open-source sur le coeur. Les features avancees sont dans le COG, pas derriere un paywall |
| **Dependance a des relais tiers** | Syncthing (serveurs de decouverte et relais publics) | Le COG doit pouvoir fonctionner sans AUCUN serveur tiers (LOI-1). La decouverte LAN fonctionne toujours. La decouverte WAN est un bonus |

### 5.5 Architecture suggeree (high-level, pour Denis)

Sans entrer dans l'implementation technique (c'est le role de Denis), voici les grandes orientations que l'analyse concurrentielle suggere :

1. **Protocole de sync** : S'inspirer du Block Exchange Protocol de Syncthing (delta sync par blocs de 128-256 KB) mais reimplemente en Rust. Ne PAS utiliser WebDAV (goulot de Nextcloud)
2. **Stockage** : Fichiers en clair sur le filesystem + index de metadonnees dans KindMother (SQLite). Pas de format opaque
3. **Chiffrement** : AES-256-GCM pour le transit et le stockage chiffre. Cles derivees via Argon2id. Chiffrer aussi les metadonnees (contrairement a Seafile)
4. **Reseau** : Decouverte LAN via mDNS. Decouverte WAN optionnelle via un "beacon" COG volontaire. Hole-punching UDP pour la traversee NAT
5. **Surface web de partage** : Mini serveur HTTP integre (axum) qui sert une page statique de telechargement pour les liens partages. Token ephemere + expiration
6. **Mobile** : Protocole compatible avec les clients WebDAV existants en phase 1. App companion Miyukini en phase 2 (Kotlin/Swift ou Flutter)
7. **Crate** : `miyucloud` dans `crates/` (toolkit Strate 6) + service dans `apps/` si necessaire

---

## 6. Matrice de risque

| Risque | Probabilite | Impact | Mitigation |
|--------|:-----------:|:------:|------------|
| La traversee NAT est un probleme non trivial | HAUTE | ELEVE | Commencer par le LAN, WAN en v2. Prevoir un mode "relais par ami COG" |
| Le chiffrement E2E ralentit les transferts | MOYENNE | MOYEN | AES-NI est supporte par tous les CPU modernes. Benchmark obligatoire |
| L'app mobile est un gouffre de temps | HAUTE | ELEVE | Phase 1 = protocole standard (WebDAV). Phase 2 = app custom |
| La resolution de conflits est complexe | MOYENNE | MOYEN | Commencer simple (last-writer-wins + notification) avant CRDT |
| Concurrence avec Nextcloud sur le mind-share | HAUTE | MOYEN | Ne pas se comparer a Nextcloud. Communiquer sur "cloud integre a COG", pas "alternative a Nextcloud" |

---

## 7. Conclusion

Le marche du cloud prive auto-heberge est mature mais insatisfaisant. Nextcloud est trop lourd et complexe. Syncthing est trop minimaliste. Seafile est performant mais limite. Aucun ne propose l'experience "mon PC est mon cloud" que MiyuCloud vise.

Les trois axes de differenciation les plus forts sont :
1. **Integration native dans COG/Central** (aucun concurrent n'est integre a un ecosysteme desktop)
2. **P2P + partage web dans le meme outil** (aucun concurrent ne combine les deux)
3. **Zero configuration** (le COG est le serveur, point final)

Le MVP devrait se concentrer sur la sync P2P LAN + gestionnaire de fichiers dans Central + partage par lien web. Le backup mobile et la traversee NAT WAN viendront en v1.1.

---

*Rapport redige par Fabrice (Analyste PR) — Phase P0 Cadrage*
*A transmettre a Maria pour validation, puis Denis pour P1 (specification technique)*
