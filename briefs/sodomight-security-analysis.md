# Analyse de Securite Sodomight/MGE -- Condense
<!-- Refactorise le 2026-03-03. Original: 457 lignes -> 152 lignes -->

> **Agent** : Victor | **Phase** : P0 T5 | **Date** : 2026-03-02
> **Stack** : Rust, wgpu, ECS maison, TCP/bincode, SQLite, Rhai
> **Niveau requis** : RENFORCE (multijoueur, comptes, persistance, trade P2P)
> **Score global** : **42/100** (DEFAUTS BLOQUANTS)

---

## Top 5 menaces DREAD

| # | Menace | DREAD | Composant | Impact |
|---|--------|-------|-----------|--------|
| L-01 | **RNG seed fixe** (`DEBUG_SEED = 0xDEAD_BEEF_CAFE`) | **9.4** | sodomight/world.rs:44,271 | Loot 100% predictible |
| A-01 | **Absence d'authentification** (0 lib crypto dans deps) | **9.2** | mge-save Cargo.toml | Usurpation totale |
| N-07 | **Client peut envoyer messages serveur** (enum unique) | **9.0** | mge-net/packet.rs:33-101 | Spawn entities, triche |
| N-06 | **PlayerMove sans validation** (f32 arbitraires) | **9.0** | mge-net/packet.rs:37-42 | Speed hack |
| T-02 | **Trade transfert non-atomique** (dupe items) | **8.0** | mge-arpg-trade/trade_session.rs:148 | Duplication d'items |

---

## Score par critere (/20)

| Critere | Score | Commentaire |
|---------|-------|-------------|
| Auth & autorisation | 2/20 | Schema prevu, aucune implementation |
| Chiffrement & secrets | 3/20 | TCP clair, DB clair, seed RNG fixe |
| Validation entrees | 6/20 | SQL parametrise OK, mais 0 validation valeurs |
| Architecture anti-triche | 4/20 | Server-authoritative prevu, pas implemente |
| Dependances & supply chain | 14/20 | Stack Rust solide, Cargo.lock commite |
| Sandbox scripting | 12/20 | Rhai OK sauf map_size + expr_depth |
| Trade & economie | 8/20 | State machine OK, transfert non atomique |
| Logging & monitoring | 5/20 | tracing en place, 0 evenement securite |
| **TOTAL** | **42/100** | **Pas pret pour du multijoueur** |

---

## Points forts confirmes

- `unsafe_code = "forbid"` workspace-wide
- 0 `unwrap()` en production (5 crates auditees)
- 0 URL hardcodee, 0 SQL non-parametrise
- `eval()` desactive dans Rhai
- ChaCha8Rng utilise (mais seed fixe)

---

## Scan global patterns dangereux

| Pattern | Resultat |
|---------|----------|
| unwrap() prod | 0 -- OK |
| URL hardcodee | 0 -- OK |
| Secret en clair | 1 : `DEBUG_SEED` -- CRITIQUE |
| SQL non-parametre | 0 -- OK |
| unsafe | Interdit -- OK |

---

## Dependances manquantes (securite)

| Dependance | Usage | Criticite |
|-----------|-------|-----------|
| argon2 ou bcrypt | Hashing mots de passe | CRITIQUE |
| secrecy + zeroize | Secrets en memoire | HAUTE |
| tokio-rustls | TLS transport | HAUTE |
| hmac + sha2 | Integrite paquets | HAUTE |
| ring ou ed25519-dalek | Signature scripts/paquets | MOYENNE |

---

## Checklist securite Francois (25 items)

### CRITIQUE (5 items -- bloquants avant release multijoueur)

- [ ] **SEC-01** : Remplacer `DEBUG_SEED` par `OsRng`. Garder seed fixe uniquement en `#[cfg(test)]` ou `--debug-seed`
- [ ] **SEC-02** : Ajouter `argon2` et implementer hashing dans `AccountDal::create()`
- [ ] **SEC-03** : Separer `GameMessage` en `ClientMessage` + `ServerMessage`. Serveur rejette tout ServerMessage client
- [ ] **SEC-04** : Valider `PlayerMove` serveur-side : clamper dx/dy a max_speed * dt
- [ ] **SEC-05** : Rendre trade `execute()` atomique via transaction DB unique

### HAUTE (10 items -- avant serveur dedie)

- [ ] **SEC-06** : ClientId genere cote serveur (pas client)
- [ ] **SEC-07** : Sequence number dans paquets (anti-replay)
- [ ] **SEC-08** : `set_max_map_size(256)` + `set_max_expr_depth(32)` Rhai
- [ ] **SEC-09** : Manifeste SHA-256 pour scripts Rhai
- [ ] **SEC-10** : Rate limiter TCP (max_connections_per_ip, connection_rate_limit)
- [ ] **SEC-11** : Mutex/RwLock sur TradeSession (concurrence reseau)
- [ ] **SEC-12** : Validation stats avant save (gold 0..2.5G, level 1..99, stats 0..1023)
- [ ] **SEC-13** : Token session UUID v4 + expiration 24h + rotation
- [ ] **SEC-14** : Chiffrer SQLite (sqlcipher) ou signer checksums saves
- [ ] **SEC-15** : TLS (tokio-rustls) pour transport TCP serveur dedie

### MOYENNE (7 items)

- [ ] **SEC-16** : Reduire MAX_MESSAGE_SIZE de 1 MiB a 64 KiB
- [ ] **SEC-17** : Valider noms personnage (2-24 chars, alphanumeriques)
- [ ] **SEC-18** : Plafonner rewards Rhai (xp max 100k, item max qty 100)
- [ ] **SEC-19** : Harmoniser gold u64/i64 -> i64 partout avec validation >= 0
- [ ] **SEC-20** : Checksum CRC32 dans FrameCodec
- [ ] **SEC-21** : Prix vente lu depuis definition item, pas parametre
- [ ] **SEC-22** : Backup DB avant chaque session

### BASSE (3 items)

- [ ] **SEC-23** : `secrecy::Secret<String>` pour password_hash + zeroize
- [ ] **SEC-24** : Documenter `unwrap_or(0)` dans schema.rs:28
- [ ] **SEC-25** : Warning quand `file_stem()` retourne None dans load_directory

---

## Certifications applicables

| Certification | Applicable | Note |
|--------------|-----------|------|
| RGPD/VP2 | **OUI (partiel)** | Si comptes avec email : consentement, droit suppression, retention, notification fuite |
| Autres (ISO 27001, HDS, NF525, NF203, CMMI) | Non | Jeu video hors perimetre |

---

> 8 surfaces d'attaque, 27 menaces STRIDE, 17 deps auditees. Le code est propre et bien structure, mais les mecanismes securite reseau/auth/anti-triche ne sont pas implementes.
