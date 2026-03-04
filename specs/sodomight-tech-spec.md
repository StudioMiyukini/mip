# Specification Technique Sodomight -- Condense
<!-- Refactorise le 2026-03-03. Original: 1241 lignes -> 203 lignes -->

> **Agent** : Francois | **Phase** : P0 T6 | **Date** : 2026-03-02
> **Moteur** : MGE (34 crates, 42 704 lignes, 611 tests, ~62% completude)

---

## 10 ecarts design/code

| # | Ecart | Severite | Action |
|---|-------|----------|--------|
| E-01 | Nom crate : design dit `sodomight-game`, code dit `sodomight` | MINEUR | Documenter |
| E-02 | mge-arpg-combat self-contained (design prevoit deps stats/entity) | MOYEN | Integrer deps |
| E-03 | mge-arpg-ai self-contained (design prevoit deps pathfinding/combat) | MOYEN | Integrer deps |
| E-04 | mge-arpg-world manque deps render/script (design les prevoit) | MOYEN | Integrer en P3 |
| E-05 | **Content.rs hardcode** (design prevoit TOML data-driven) | **CRITIQUE** | GAP-03 |
| E-06 | **mge-net : codec seul** (design prevoit transport TCP complet) | **CRITIQUE** | GAP-01 |
| E-07 | Feature flags non documentes (instanced, dual-res, legacy-sqlite...) | MINEUR | Documenter |
| E-08 | Design prevoit dedicated server, code a Listen Server seul | HAUT | GAP-02 |
| E-09 | mge-studio : types seuls, Dioxus commente | MOYEN | GAP-06 (basse prio) |
| E-10 | **winit 0.30 pattern deprecie** (`run` au lieu de `run_app`) | **CRITIQUE** | Migrer mge-platform |

---

## Verification Context7 -- Dependances

| Lib | Version | Verdict | Action |
|-----|---------|---------|--------|
| wgpu | 24.0 | STABLE (28.0 dispo, pas de migration urgente) | Rester 24.0 |
| winit | 0.30 | **ECART E-10** : `run` deprecie, `run_app`+`ApplicationHandler` requis | Migrer obligatoire |
| kira | 0.9 | STABLE, API inchangee | Aucune |
| rhai | 1.20 | **Sandbox incomplete** : manque `set_max_map_size` + `set_max_expr_depth` | SEC-08 |
| rusqlite | 0.32 | STABLE, transactions OK, feature `bundled` OK | Activer `sqlcipher` pour SEC-14 |
| egui | 0.28 | STABLE | Aucune |
| bincode | 1.3 | v1 legacy (v2 dispo), stable | Pas de migration |

---

## Checklist securite integree (refs Victor)

### CRITIQUE (5 items)

| Code | Menace | Crate cible | Implementation |
|------|--------|-------------|----------------|
| SEC-01 | RNG seed fixe (9.4) | sodomight | `ChaCha8Rng::from_entropy()`, seed fixe en `#[cfg(test)]` seul |
| SEC-02 | Pas d'auth (9.2) | mge-save | Ajouter `argon2 = "0.5"`, hashing dans `AccountDal::create()` |
| SEC-03 | GameMessage unique (9.0) | mge-net | Separer `ClientMessage` / `ServerMessage` |
| SEC-04 | PlayerMove non valide (9.0) | sodomight-server | Clamper dx/dy a max_speed * dt cote serveur |
| SEC-05 | Trade non atomique (8.0) | mge-arpg-trade | Transaction DB unique dans `execute()` |

### HAUTE (10 items) : SEC-06 a SEC-15

ClientId serveur (06), seq number (07), Rhai limites (08), script SHA-256 (09), rate limiter TCP (10), TradeSession Mutex (11), validation stats save (12), token session (13), chiffrement DB (14), TLS transport (15).

### MOYENNE/BASSE (10 items) : SEC-16 a SEC-25

Max message 64KiB (16), noms 2-24 chars (17), rewards Rhai caps (18), gold i64 partout (19), CRC32 codec (20), prix vente definition (21), backup DB (22), secrecy hash (23), doc unwrap_or (24), warning file_stem (25).

---

## 6 gaps -- Architecture cible compacte

### GAP-01 : Transport TCP (mge-net) -- 2-3j

```
mge-net/src/ + NOUVEAUX : message.rs (ClientMessage/ServerMessage), server.rs,
  client.rs, session.rs, rate_limiter.rs, error.rs
Pattern : TcpListener -> accept -> spawn handle_client(FramedRead/Write + bincode)
Tests : bind, accept, roundtrip, rate limiter, validation, seq number (8-12 tests)
```

### GAP-02 : Serveur autoritatif (sodomight-server) -- 2-3j

```
+ NOUVEAUX : server.rs, session.rs, authority.rs, world_host.rs,
  loot_authority.rs, save_authority.rs, health_check.rs
Pattern : init ECS sans rendu -> GameServer::bind -> boucle 25Hz
  (poll inputs -> validate -> run_stage -> broadcast deltas -> autosave /60 ticks)
Prerequis : GAP-01, SEC-01, SEC-04
Tests : start+accept, tick, authority validation, loot RNG, save bounds, health 200 (6-8 tests)
```

### GAP-03 : Migration TOML data-driven -- 1-2j

```
games/sodomight/data/ : config/, classes/, skills/, items/{bases,affixes,uniques}/,
  monsters/act1/, zones/act1/, loot_tables/, quests/act1/
Pattern : GameDataRegistry::load_all<T>(dir) pour chaque categorie
Fallback : feature flag `hardcoded-content` sur content.rs
Tests : load matches content.rs, IDs uniques, cross-refs valides (8-10 tests)
```

### GAP-04 : Tests mge-ui -- 1j

```
30+ tests logique UI (pas GPU) : HUD orbs (clamp, div-by-zero), belt (slots, stacks),
  inventaire (10x4, place/overlap/remove), character panel (stat alloc),
  skill tree (prereq, max 20), tooltip (colors, affixes), minimap (coords), menus
```

### GAP-05 : Integration collision-rich -- 1j

```
UnifiedCollider enum (Aabb/Circle/Capsule/Obb) dans mge-collision
Broadphase SpatialGrid AABB englobant -> Narrowphase ShapeIntersect
Tests : circle-circle, capsule-aabb, broadphase+narrowphase, dispatch (6-8 tests)
```

### GAP-06 : mge-studio UI -- 5+j (BASSE PRIO, reporter post-Act 1)

```
Dioxus desktop, composants : atlas_viewer, anim_preview, data_editor (TOML), file_browser
N'utilise PAS wgpu MGE -- lit fichiers TOML + images avec `image` crate
```

---

## Targets de performance

| Metrique | Target |
|----------|--------|
| FPS client | >= 60 stable (VSync) |
| Tick serveur | 25 Hz (< 30ms logique + 10ms reserve) |
| Latence reseau | < 200ms RTT |
| Entites simultanees | 500 visibles |
| Memoire client | < 1 Go |
| Memoire serveur (8j) | < 512 Mo |
| A* par requete | < 500 noeuds |
| Draw calls | < 50/frame (batching atlas) |
| Taille client stripped | < 60 Mo |
| Taille distribution | < 700 Mo compresse |
| Chargement zone | < 5s |

---

## Plan de tests

### Etat actuel : 800 tests, objectif +70-80

| Source | Tests a ajouter | Type |
|--------|----------------|------|
| GAP-01 (mge-net) | 8-12 | Integration async |
| GAP-02 (server) | 6-8 | Integration async |
| GAP-03 (TOML) | 8-10 | Unitaire |
| GAP-04 (mge-ui) | 30+ | Unitaire |
| GAP-05 (collision) | 6-8 | Unitaire |
| Securite (SEC-01,03,04,05) | 8-10 | Unit + integration |
| Blockers (fix compile, fix render) | 2 | Fix |

### Techniques de test : Equivalence Partitioning, Boundary Value, Decision Tables, State Transition, Error Guessing

### Tests regression D2 : formules hit chance (CTH clamp 5-95%), MF diminishing returns, XP table level 99

---

## Conformite architecturale

- [x] LOI-1 a LOI-8 : toutes respectees
- [ ] LOI-9 (anti-serial-collapse) : MASS a appliquer en P3
- [x] `unsafe_code = "forbid"`, clippy pedantic, 0 unwrap prod, UUID v4, ISO 8601, MSCM

---

## Risques consolides

| # | Risque | P | I | Mitigation |
|---|--------|---|---|------------|
| R-01 | ECS Any downcasting | Moy | Haut | Type-safe a terme |
| R-02 | Cross-workspace miyuki-ui | Faible | Moy | Freeze version |
| R-03 | Pas de CI/CD | Haute | Haut | Pipeline Hugo |
| R-05 | Data hardcodee | Haute | Haut | GAP-03 |
| R-06 | Client ne compile pas | Haute | Haut | Fix trivial 5 min |
| R-07 | RNG predictible | Haute | CRIT | SEC-01 5 min |
| R-08 | Reseau coquille vide | Haute | Haut | GAP-01 + GAP-02 |
| R-09 | winit pattern deprecie | Moy | Haut | E-10 migration |
| R-10 | Build CI froid > 60 min | Haute | Moy | sccache + cache |
