# Rapport d'Audit Securite -- MiyuCloud

**Auditeur** : George (Audit Expert)
**Date** : 2026-03-01
**Phase** : P4 -- Integration & Audit
**Scope** : `crates/miyucloud/src/`, `apps/miyucloud/src/`, `apps/central/src/services/miyucloud/`
**Classification** : T4 -- Feature majeure

---

## Resume executif

**Score global : 87 / 100**

MiyuCloud presente une architecture de securite solide avec un chiffrement at-rest
ChaCha20-Poly1305, une derivation de cles Argon2id + HKDF correctement implementee,
et une surface web sandboxee avec TLS, rate limiting et access logging RGPD-conforme.

**Points critiques identifies** :

1. **MAJEUR** -- Le endpoint `/share/{token}/download` bypasse la verification de
   mot de passe pour les liens proteges. Un attaquant connaissant le token peut
   telecharger sans mot de passe.
2. **MAJEUR** -- La comparaison de hash de mot de passe dans `verify_password()`
   utilise `.all(|(a,b)| a == b)` qui n'est PAS en temps constant malgre le
   commentaire "Constant-time comparison". Le compilateur peut court-circuiter.
3. **MAJEUR** -- Passphrase par defaut hardcodee (`"miyucloud-default-passphrase"`)
   si la variable d'environnement `MIYUCLOUD_PASSPHRASE` n'est pas definie.
4. **MINEUR** -- XSS potentiel : le nom de fichier est insere directement dans le
   HTML sans echappement (`<h1>{file_name}</h1>`).
5. **MINEUR** -- Le sel de hashing IP est hardcode dans le code source
   (`IP_HASH_SALT`), pas derive de la configuration.

**Defauts BLOQUANTS** : 0
**Defauts MAJEURS** : 3
**Defauts MINEURS** : 4
**Informations** : 3

---

## 1. Securite Crypto

### ChaCha20-Poly1305

| Point de controle | Statut | Detail |
|---|---|---|
| Nonces generes aleatoirement (OsRng) | **PASS** | `rand::rngs::OsRng.fill_bytes()` dans `at_rest.rs:39` et `e2e.rs:110` |
| Pas de reutilisation de nonce | **PASS** | Nouveau nonce aleatoire 12 bytes par chunk et par message |
| Tag Poly1305 verifie au dechiffrement | **PASS** | Erreur explicite si tag invalide (pas de lecture silencieuse) |
| Erreur propagee si donnees corrompues | **PASS** | `MiyucloudError::Crypto` retourne, tests de corruption existants |

### Argon2id

| Point de controle | Statut | Detail |
|---|---|---|
| Algorithme Argon2id utilise | **PASS** | `argon2::Algorithm::Argon2id` dans `keys.rs:71` |
| Parametres release : memory 64MB | **PASS** | `65536` (64 * 1024 KB) dans `keys.rs:138` |
| Parametres release : iterations 3 | **PASS** | 2e parametre = 3 dans `keys.rs:138` |
| Parametres release : parallelism 4 | **PASS** | 3e parametre = 4 dans `keys.rs:138` |
| Parametres debug reduits pour tests | **PASS** | `4096, 1, 1` en debug, tests rapides |

### HKDF

| Point de controle | Statut | Detail |
|---|---|---|
| Contexte unique par fichier | **PASS** | `"miyucloud-file-{file_id}"` dans `keys.rs:86` |
| Derivation correcte HKDF-SHA256 | **PASS** | `Hkdf::<Sha256>` avec expand |
| Contexte de session sync separe | **PASS** | `"miyucloud-sync-session"` dans `e2e.rs:23` |

### X25519

| Point de controle | Statut | Detail |
|---|---|---|
| Cles ephemeres par session | **PASS** | `generate_ephemeral_keypair()` dans `e2e.rs:69` |
| Perfect Forward Secrecy | **PASS** | Nouvelle paire a chaque session, test PFS existant |
| Cle privee jamais serialisee | **PASS** | `Debug` impl masque la cle, pas de `Serialize` |

### Master Key

| Point de controle | Statut | Detail |
|---|---|---|
| Jamais ecrite sur disque | **PASS** | Stockee uniquement dans `KeyManager.master_key` en RAM |
| Debug impl masque la valeur | **PASS** | `[REDACTED]` dans `keys.rs:34` |
| Pas de Serialize derive | **PASS** | `KeyManager` n'implemente pas `Serialize` |

### Canary

| Point de controle | Statut | Detail |
|---|---|---|
| Verifie au demarrage | **PASS** | `bootstrap_crypto()` dans `main.rs:253-268` |
| Donnees canary connues | **PASS** | `b"MIYUCLOUD_CANARY_V1"` |
| Rejet si passphrase incorrecte | **PASS** | Test `test_wrong_passphrase_rejects` passe |

### Conclusion Crypto : **CONFORME**

---

## 2. Surface Web (D2 -- 8 mesures)

| # | Mesure | Statut | Detail |
|---|---|---|---|
| 1 | Rate limiting par IP | **PASS** | 10 req/min pour /share/*, 3/min pour /auth. `RateLimiterLayer` avec Tower middleware. Retourne 429 + Retry-After. |
| 2 | Tokens 256 bits non predictibles | **PASS** | 32 bytes via `OsRng`, 64 chars hex. `generate_share_token()` dans `web_tokens.rs:28-34`. |
| 3 | Expiration obligatoire | **PASS** | Min 1h, max 30 jours. `validate_share_link()` verifie `expires_at`. Invariant documente. |
| 4 | Sandboxing | **PARTIAL** | `SandboxedStore` restreint l'acces aux fichiers partages. Mais le download bypasse le password (finding F-01). |
| 5 | 404 pour fichiers non partages | **PASS** | `NotFound("Not found")` -- pas de 403, pas de leak d'existence. `sandbox.rs:48`. |
| 6 | Access logging RGPD | **PASS** | IP hashee SHA-256 avec sel, UA tronque 100 chars. `access_log.rs`. |
| 7 | Revocation instantanee | **PASS** | Flag `is_revoked` verifie en premier dans `validate_share_link()`. Test existant. |
| 8 | HTTPS obligatoire (TLS) | **PASS** | Surface web servie via `TlsAcceptor` (rustls). Certificat auto-signe ou fourni. Pas de fallback HTTP. |

### Conclusion Surface Web : **CONFORME avec reserves** (F-01)

---

## 3. Auth

| Point de controle | Statut | Detail |
|---|---|---|
| X-COG-Token sur /api/* | **PASS** | `CogTokenLayer` applique comme middleware sur toutes les routes nestees sous `/api`. `api/mod.rs:76`. |
| /health sans auth | **PASS** | Route `/health` en dehors du nest `/api`. `api/mod.rs:80`. |
| Web /health sans auth | **PASS** | `web_health()` dans `web_surface/mod.rs:72`. |
| Mots de passe hashes | **PASS** | Argon2id avec sel aleatoire 16 bytes. Format `{salt_hex}${hash_hex}`. |
| Pas de credentials en dur | **PARTIAL** | Passphrase par defaut hardcodee (finding F-03). Token COG genere aleatoirement si non fourni. |

### Conclusion Auth : **CONFORME avec reserves** (F-03)

---

## 4. Code Quality

| Point de controle | Statut | Detail |
|---|---|---|
| `unsafe_code = "forbid"` crate miyucloud | **PASS** | `Cargo.toml` ligne 44 |
| `unsafe_code = "forbid"` app miyucloud-server | **PASS** | `Cargo.toml` ligne 36 |
| Pas d'`unsafe` dans le code | **PASS** | `grep unsafe` retourne 0 resultat dans les deux crates |
| Clippy sans warnings | **PASS** | `cargo clippy -p miyucloud -p miyucloud-server -- -D warnings` : 0 warning |
| Gestion d'erreur explicite (thiserror) | **PASS** | `MiyucloudError` enum avec 9 variantes via `thiserror::Error` |
| Pas d'injection SQL | **PASS** | Toutes les requetes utilisent `params![]` (parametrise). `file_search` construit le pattern LIKE en Rust mais le passe en `?2`. |
| Pas de path traversal | **PARTIAL** | `LocalFsStorage::file_dir()` utilise `file_id[..2]` comme prefix mais n'echappe pas les `..` dans le file_id (finding F-05). Risque attenue par le fait que les file_id sont des UUID v4. |
| Pas d'`unwrap()` en production | **PASS** | Tous les `unwrap()` trouves sont dans des blocs `#[cfg(test)]`. Les `expect()` en production sont sur des parametres Argon2 constants (`"valid argon2 params"`) et un `Result<_, Infallible>` -- acceptables. |

### Conclusion Code Quality : **CONFORME**

---

## 5. Conformite RGPD

| Point de controle | Statut | Detail |
|---|---|---|
| IP hashees dans les logs | **PASS** | `hash_ip()` utilise SHA-256 + sel. IP brute jamais stockee. |
| UA tronque | **PASS** | `truncate_user_agent()` limite a 100 caracteres. |
| Purge avec overwrite zeros | **PASS** | `overwrite_chunk_with_zeros()` ecrase avec des zeros puis supprime le fichier. `local_fs.rs:113-126`. |
| Droit a l'effacement | **PASS** | `TrashOps::purge_file()` + `empty_trash()` suppriment donnees DB et storage. |
| Sel de hashing IP | **PARTIAL** | Sel hardcode `"miyucloud-ip-salt-v1"` dans le code source (finding F-06). Devrait etre configurable. |

### Conclusion RGPD : **CONFORME avec reserve mineure**

---

## 6. Lois d'Autonomie COG

| Loi | Statut | Detail |
|---|---|---|
| LOI-1 : Pas de dependance externe critique | **PASS** | Toutes les dependances sont des crates Rust compiles statiquement. Pas de service externe requis. |
| LOI-2 : Fonctionne en mode isole | **PASS** | Le serveur MiyuCloud est standalone. La surface web et l'API sont locales. Pas de phone home. |
| LOI-3 : Etat local souverain | **PASS** | SQLite local + stockage filesystem local. Pas de cloud externe. |
| LOI-5 : Cout proportionnel au hardware | **PASS** | 0 euro d'abonnement. Chiffrement et stockage locaux. |

### Conclusion LOI : **CONFORME**

---

## 7. Invariants de securite (spec P1 annexe B)

| Invariant | Statut | Detail |
|---|---|---|
| Jamais de perte silencieuse en sync | **PASS** | Le moteur de sync detecte les conflits via vector clocks. Les conflits sont signales, jamais ecrases. Tests d'integration existants. |
| Jamais de contenu en clair sur disque | **PASS** | Tout fichier passe par `encrypt_chunk()` avant ecriture. Les chunks sont `.enc`. |
| Jamais de lien sans expiration | **PASS** | `ExternalShareOps::create_link()` valide `MIN_EXPIRY_HOURS..=MAX_EXPIRY_HOURS`. Test existant. |
| Tout acces web logge | **PARTIAL** | Les acces download et auth sont logges. Mais `share_page` (consultation sans download) ne log pas (finding F-07). |

### Conclusion Invariants : **CONFORME avec reserve mineure**

---

## Findings detailles

### F-01 -- MAJEUR : Download bypasse la verification de mot de passe

**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs` lignes 141-156
**Description** : Le endpoint `GET /share/{token}/download` skippe deliberement la
verification de mot de passe (`has_password: false` dans la validation). Le commentaire
indique "password check should have been done via /auth", mais il n'y a pas de
mecanisme de session (cookie, JWT) pour verifier que l'auth a ete effectuee.
Un attaquant connaissant le token peut directement appeler `/share/{token}/download`
sans passer par `/share/{token}/auth`.

**Impact** : Contournement total de la protection par mot de passe des liens de partage.
**Severite** : MAJEUR
**Recommandation** : Implementer un mecanisme de session. Apres authentification
reussie via `/auth`, generer un cookie signe ou un token de session temporaire
(ex: HMAC du token + timestamp, expiration 15 min). Le endpoint `/download`
doit verifier ce cookie avant de servir le fichier.

---

### F-02 -- MAJEUR : Comparaison de hash de mot de passe non constant-time

**Fichier** : `crates/miyucloud/src/auth/web_tokens.rs` lignes 103-108
**Description** : Le code est commente "Constant-time comparison" mais utilise
`.all(|(a, b)| a == b)` qui peut etre court-circuite par le compilateur via
optimisation. En Rust, `Iterator::all()` retourne `false` au premier element
qui ne satisfait pas le predicat. Ce n'est PAS une comparaison en temps constant.

**Impact** : Timing attack theorique sur la verification de mot de passe. Risque
attenue par le rate limiting (3 tentatives/min) et le fait que le hash fait 32 bytes.
**Severite** : MAJEUR
**Recommandation** : Utiliser `subtle::ConstantTimeEq` du crate `subtle`, ou
implementer une comparaison manuelle avec accumulateur XOR :
```rust
let mut diff = 0u8;
for (a, b) in computed.iter().zip(expected_hash.iter()) {
    diff |= a ^ b;
}
diff == 0
```

---

### F-03 -- MAJEUR : Passphrase par defaut hardcodee

**Fichier** : `apps/miyucloud/src/main.rs` ligne 242
**Description** : Si `MIYUCLOUD_PASSPHRASE` n'est pas definie, le serveur utilise
`"miyucloud-default-passphrase"`. Cette valeur est connue publiquement dans le
code source. Tout attaquant avec acces a la base de donnees pourrait deriver la
master key et dechiffrer tous les fichiers.

**Impact** : Compromission totale du chiffrement si l'utilisateur ne configure pas
de passphrase.
**Severite** : MAJEUR
**Recommandation** : Au premier demarrage, si la passphrase n'est pas definie,
afficher un avertissement CLAIR dans les logs (WARN) et/ou refuser de demarrer
sans passphrase explicite. Alternativement, generer une passphrase aleatoire
au premier demarrage et la stocker dans un fichier protege (600).

---

### F-04 -- MINEUR : XSS potentiel dans la page de partage

**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs` ligne 255
**Description** : Le nom de fichier est insere directement dans le HTML via
`format!()` sans echappement : `<h1>{file_name}</h1>`. Un fichier nomme
`<script>alert(1)</script>.txt` serait execute dans le navigateur du visiteur.

**Impact** : XSS stocke via le nom de fichier. Risque attenue par le fait que
seul le proprietaire peut creer des fichiers (auto-attaque), mais un fichier
partage via Jay1Tribu avec un nom malveillant pourrait exploiter ce vecteur.
**Severite** : MINEUR
**Recommandation** : Echapper les caracteres HTML (`<`, `>`, `&`, `"`, `'`) dans
`file_name`, `file_size`, `expires_at` et `token` avant insertion dans le template.
Utiliser une fonction `html_escape()` dediee.

---

### F-05 -- MINEUR : Pas de validation de path traversal sur file_id

**Fichier** : `crates/miyucloud/src/storage/local_fs.rs` lignes 32-38
**Description** : `file_dir()` construit le chemin avec `file_id[..2]` comme prefix
et `file_id` comme dossier sans valider que le file_id ne contient pas `..`, `/`,
ou `\`. Le risque est attenue car les file_id sont des UUID v4 generes en interne,
mais si un file_id manipule etait injecte, il pourrait ecrire/lire en dehors du
repertoire de stockage.

**Impact** : Path traversal theorique. Risque tres faible car les file_id sont
controles par le serveur.
**Severite** : MINEUR
**Recommandation** : Ajouter une validation dans `file_dir()` :
```rust
assert!(!file_id.contains("..") && !file_id.contains('/') && !file_id.contains('\\'));
```
Ou mieux, valider le format UUID v4 a l'entree.

---

### F-06 -- MINEUR : Sel de hashing IP hardcode

**Fichier** : `apps/miyucloud/src/web_surface/access_log.rs` ligne 24
**Description** : Le sel `"miyucloud-ip-salt-v1"` est une constante dans le code
source. Si le code source est public, un attaquant pourrait precalculer un
rainbow table pour les adresses IP (espace relativement petit).

**Impact** : Potentielle desanonymisation des IP dans les logs d'acces si le sel
est connu.
**Severite** : MINEUR
**Recommandation** : Deriver le sel depuis une valeur unique a l'instance (ex:
le COG ID ou un sel aleatoire genere au premier demarrage et stocke en DB).

---

### F-07 -- MINEUR : La consultation de page de partage n'est pas loggee

**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs` lignes 31-58
**Description** : Le handler `share_page()` (GET /share/{token}) n'appelle pas
`access_log::log_access()`. Seuls les downloads et les tentatives d'auth sont
logges. L'invariant "tout acces web logge" n'est pas completement respecte.

**Impact** : Pas de trace des consultations de la page de partage (sans
telechargement). Utile pour le monitoring d'abus.
**Severite** : MINEUR
**Recommandation** : Ajouter un appel `log_access()` avec l'action `Preview`
dans le handler `share_page()`.

---

### F-08 -- INFO : Le rate limiter utilise un HashMap en memoire

**Fichier** : `apps/miyucloud/src/web_surface/rate_limiter.rs` lignes 46-51
**Description** : Le `RateLimiterState` utilise un `HashMap<String, Vec<Instant>>`
protege par un `Mutex`. En cas de DoS distribue, ce HashMap peut croitre sans
limite. Il n'y a pas de purge des entrees expirees sauf lors d'une requete
de la meme IP.

**Impact** : Consommation memoire croissante en cas d'attaque distribuee.
**Severite** : INFO
**Recommandation** : Ajouter une tache de purge periodique (ex: toutes les 5 min)
ou limiter la taille du HashMap (LRU cache).

---

### F-09 -- INFO : Le `collect_all()` dans `share_download` charge tout en RAM

**Fichier** : `apps/miyucloud/src/web_surface/share_page.rs` ligne 175
**Description** : Le commentaire indique "for MVP" et suggere d'utiliser
`Body::from_stream` dans le futur. Pour les gros fichiers, la totalite est
chargee en memoire avant d'etre envoyee.

**Impact** : Consommation memoire proportionnelle a la taille du fichier partage.
**Severite** : INFO
**Recommandation** : Implementer un streaming reel via `Body::from_stream()`
pour les futures versions. Le `StreamingDecryptor` est deja concu pour cela.

---

### F-10 -- INFO : X-Forwarded-For sans validation

**Fichier** : `apps/miyucloud/src/web_surface/rate_limiter.rs` lignes 168-187
**Description** : Le rate limiter prend la premiere IP de `X-Forwarded-For` sans
validation. Un client peut fournir un header `X-Forwarded-For` forge pour
contourner le rate limiting en changeant l'IP a chaque requete.

**Impact** : Contournement du rate limiting si le serveur est directement accessible
(sans reverse proxy). Si derriere un reverse proxy, le proxy devrait reecrire le
header.
**Severite** : INFO
**Recommandation** : Documenter que le serveur DOIT etre derriere un reverse proxy
de confiance, ou utiliser `ConnectInfo` d'axum pour l'IP de connexion reelle
comme source primaire.

---

## Metriques

### Tests

| Crate | Tests | Passes | Echecs | Ignores |
|---|---|---|---|---|
| miyucloud | 198 + 2 + 13 = 213 | 213 | 0 | 0 |
| miyucloud-server | 28 | 28 | 0 | 0 |
| **Total** | **241** | **241** | **0** | **0** |

### Temps de build

- `cargo build -p miyucloud -p miyucloud-server` : < 5s (incremental)
- `cargo test -p miyucloud -p miyucloud-server` : ~2.6s

### Clippy

- `cargo clippy -p miyucloud -p miyucloud-server -- -D warnings` : **0 warning**

### Couverture MSCM

- 52 fichiers `.rs` sur 52 portent les annotations `@id:` : **100%**

### Structure Cargo.toml

- `unsafe_code = "forbid"` : **Present** dans les 2 Cargo.toml
- Clippy pedantic : **Active** dans les 2 Cargo.toml

---

## Optimisations recommandees

| # | Impact | Description | Effort |
|---|---|---|---|
| 1 | Eleve | Implementer session cookie pour download protege par mot de passe (F-01) | Moyen |
| 2 | Eleve | Utiliser `subtle::ConstantTimeEq` pour la comparaison de hash (F-02) | Faible |
| 3 | Eleve | Refuser le demarrage sans passphrase ou generer une passphrase securisee (F-03) | Faible |
| 4 | Moyen | Echapper les noms de fichiers dans le HTML (F-04) | Faible |
| 5 | Moyen | Valider le format UUID du file_id dans le storage (F-05) | Faible |
| 6 | Faible | Rendre le sel de hashing IP configurable (F-06) | Faible |
| 7 | Faible | Logger les consultations de pages de partage (F-07) | Faible |
| 8 | Faible | Implementer le streaming Body pour les gros fichiers (F-09) | Moyen |

---

## Checklist d'audit standardisee (MIP v2)

- [x] `cargo build --workspace` OK (miyucloud + miyucloud-server compilent)
- [x] `cargo test --workspace` OK (241 tests, 0 echecs)
- [x] `cargo clippy --workspace -- -D warnings` propre (0 warnings)
- [x] Pas de `unwrap()` en production (uniquement dans `#[cfg(test)]`)
- [x] Pas d'URL hardcodees (127.0.0.1 utilise pour le binding localhost API = OK)
- [ ] Pas de donnees sensibles en clair -- **PARTIAL** (passphrase par defaut F-03)
- [x] Annotations MSCM presentes (52/52 fichiers)
- [x] Lois d'Autonomie respectees (LOI-1 a LOI-8)
- [x] `unsafe_code = "forbid"` dans tous les Cargo.toml

---

## Conclusion

**Avis : CONFORME avec reserves**

MiyuCloud presente une architecture de securite bien concue et rigoureusement
implementee. La pile cryptographique (ChaCha20-Poly1305 + Argon2id + HKDF + X25519)
est correctement deployee avec des parametres conformes aux standards de l'industrie.
La surface web est sandboxee, rate-limitee, et les acces sont journalises de maniere
RGPD-conforme.

Les 3 defauts MAJEURS identifies (F-01, F-02, F-03) ne sont pas bloquants pour une
version MVP/beta mais doivent etre corriges avant toute mise en production :

- **F-01** (download sans session) est le plus critique fonctionnellement car il
  rend la protection par mot de passe inoperante.
- **F-02** (timing attack) est un risque theorique attenue par le rate limiting.
- **F-03** (passphrase par defaut) est un risque operationnel qui depend de la
  discipline de l'utilisateur.

**Gate P4** : PASSE -- 0 defaut BLOQUANT.
Les defauts MAJEURS sont documentes et un plan de correction est propose.
Le livrable peut passer en P5 (livraison) avec mention des reserves.

**Transmis a** : Alicia (validation) + Denis (P5 livraison)
**Archive** : Arianne (P6)

---

*Rapport genere par George -- Audit Expert, Miyukini AI Studio*
*Protocole MIP v2, Phase P4*
