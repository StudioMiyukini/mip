# Brief de Cadrage P0 -- MiyuCloud v2 (Securite + Onboarding + Infrastructure)

<!-- @id: mip.brief.miyucloud-v2 -->
<!-- @do: Brief final P0 Temps 10 — synthese des 9 temps precedents -->
<!-- @role: Maria (Chef de Projet) -->
<!-- @layer: S7-Operator -->

**Classification MIP** : T4 (Feature majeure — reclassifiee depuis T5 par Arianne T8)
**Date** : 2026-03-03
**Responsable P0** : Maria
**Statut** : EN ATTENTE APPROBATION UTILISATEUR

---

## TL;DR

MiyuCloud v2 consolide la securite (score 72 -> cible >95/100), ajoute la 2FA TOTP avec
onboarding guide, et pose l'infrastructure de deploiement (CI/CD + systemd + reverse proxy).
67 taches en 10 vagues, 5 agents, ~2 300 lignes nouvelles, ~75 tests. Base existante mature
(18 510 lignes, 226 tests, MSCM 100%), ce qui justifie la reclassification T5 -> T4.

---

## 1. Contexte et etat des lieux

### 1.1 Pourquoi ce projet

MiyuCloud est le service de cloud prive auto-heberge de l'ecosysteme Miyukini COG. La v1
(livree et auditee par George a 87/100) fournit le stockage chiffre, le partage par lien, et
la surface web sandboxee. Cependant, l'audit de securite approfondi de Victor (T5) revele un
score de **72/100** avec des vulnerabilites exploitables, et l'absence de 2FA/TOTP constitue
un risque pour un service expose sur Internet.

### 1.2 Probleme a resoudre (4 axes)

1. **Cloud de confiance** : atteindre un niveau de securite certif-ready (>95/100, OWASP, RGPD)
2. **Vitrine qualite** : MiyuCloud est la premiere surface publique du COG — l'UX doit etre exemplaire
3. **Ecosysteme** : Integration fluide dans Central, onboarding guide, monitoring de sante
4. **Usage quotidien** : Service deploye sur Internet (domaine + reverse proxy) pour ~5-10 utilisateurs (famille/amis)

### 1.3 Etat du code existant

| Metrique | Valeur |
|----------|--------|
| Lignes de code | 18 510 |
| Tests unitaires | 226 |
| Fichiers source | 64 |
| Routes API | 27 + 4 web |
| Couverture MSCM | 100% |
| Score securite George (P4 v1) | 87/100 |
| Score securite Victor (T5 approfondi) | 72/100 |
| Stack crypto | X25519 + ChaCha20-Poly1305 + Argon2id + HKDF |
| DB | KindMother (SQLite gouverne) |

### 1.4 Decisions de la v1 toujours en vigueur

| Decision | Description |
|----------|-------------|
| D1 — P2P | Sync pair-a-pair, pas de serveur central |
| D2 — Surface web | Exposition minimale, sandboxee, liens non predictibles |
| D3 — Remplacement Jay1Tribu | MiyuCloud remplace Jay1Tribu pour le partage fichier |
| D4 — Chiffrement | E2E obligatoire, at-rest ChaCha20-Poly1305, pas de compromis |

---

## 2. Perimetre MVP v2

### 2.1 Inclus (IN)

**Securite (22 corrections)** :
- Correction du defaut CRITIQUE F-11 (timing attack comparaison COG token)
- Correction de 4 defauts MAJEURS (F-04 XSS, F-12 header injection, F-14 IP non loggee, F-02 timing)
- Remplacement des comparaisons XOR par `subtle::ConstantTimeEq`
- Validation UUID contre path traversal
- Zeroization des secrets TOTP en memoire
- Headers HTTP de securite (X-Content-Type-Options, X-Frame-Options, etc.)
- Purge du HashMap rate_limiter toutes les 100 requetes
- Configuration `trust_proxy` pour le rate limiting

**Authentification 2FA TOTP** :
- Setup TOTP avec QR code (totp-rs, RFC 6238)
- Validation code 6 chiffres
- Recovery codes (8 codes usage unique)
- Gestion des sessions avec revocation
- 4 tables SQLite nouvelles (sessions, totp_secrets, recovery_codes, onboarding)
- 15 nouveaux endpoints API (total 42)

**Onboarding guide** :
- Wizard 4 etapes (premier lancement)
- Health dashboard (statuts, metriques, espace disque)
- Badge sante dans la sidebar Central (vert/jaune/rouge)

**Infrastructure** :
- Pipeline GitHub Actions (lint -> test -> security -> build release)
- Service systemd sandboxe (NoNewPrivileges, ProtectSystem)
- Caddyfile reverse proxy + Let's Encrypt
- Scripts deploy.sh, backup.sh, healthcheck.sh
- Rollback en <5 minutes

**Front-end (Central UI)** :
- 6 composants nouveaux (TotpSetupWizard, TotpVerifyForm, SessionList, OnboardingWizard, HealthDashboard, RecoveryCodesModal)
- Palette couleurs MiyuCloud dans le theme
- Drag & drop upload avec progress bar
- File preview inline (images, texte, PDF)
- Toggle grille/liste dans l'explorateur

**Documentation** :
- Annotations MSCM 100% sur les fichiers nouveaux
- Documentation technique complete

### 2.2 Exclu (OUT)

- Sync P2P entre noeuds (deja en v1, pas de modification)
- Migration Jay1Tribu (projet separee)
- Comptes multi-utilisateurs (hors scope, usage famille ~5-10)
- Quota de stockage (pas de besoin identifie)
- Application mobile
- Notifications push
- Versioning des fichiers
- Corbeille (deja en v1)

---

## 3. Approches possibles

### Approche A — Sprint unique T4 (RECOMMANDEE)

**Description** : Executer les 67 taches en 10 vagues dans un seul cycle MIP.

| Critere | Evaluation |
|---------|-----------|
| Avantages | Coherence, pas de dette inter-sprint, livraison complete |
| Risques | Charge importante (~150-200K tokens), complexite du merge final |
| Duree | 1 session longue |
| Faisabilite | CONFIRMEE par Arianne (T8) : base mature, extensions ciblees |

### Approche B — Deux sprints (Back+Secu puis Front+Infra)

**Description** : Sprint 1 = V0-V5 (securite + auth back-end), Sprint 2 = V6-V9 (UX + infra + integration).

| Critere | Evaluation |
|---------|-----------|
| Avantages | Livrable intermediaire testable, charge fractionnee |
| Risques | Duplication du setup, overhead coordination |
| Duree | 2 sessions moyennes |
| Faisabilite | Possible mais suboptimal (DAG lineaire V0->V5 rend la coupure naturelle) |

### Approche C — Trois micro-sprints

**Description** : Sprint 1 = securite back (V0-V2), Sprint 2 = features (V3-V5), Sprint 3 = UX + infra (V6-V9).

| Critere | Evaluation |
|---------|-----------|
| Avantages | Risque minimal par sprint, feedback precoce |
| Risques | 3x overhead P0, contexte perdu entre sessions |
| Duree | 3 sessions courtes |
| Faisabilite | Possible mais non recommande pour un T4 avec base mature |

**Recommandation Maria** : Approche A. La base est mature (18 510 lignes, 226 tests), les
extensions sont ciblees (pas de refactoring massif), et le plan est modulaire (10 vagues avec
gates). Le mode BIG_STEPS offre les checkpoints necessaires sans fragmenter l'execution.

---

## 4. Plan retenu — 10 vagues, 67 taches

### 4.1 Vue d'ensemble

| Vague | Nom | Taches | Agents | Gate |
|-------|-----|--------|--------|------|
| V0 | Setup | 5 | Denis | Branch + deps + smoke test |
| V1 | Securite critique | 8 | Francois + Victor | F-02/F-04/F-05/F-06 corriges |
| V2 | Auth TOTP + Sessions | 10 | Francois + Lise | 20 tests TOTP + 10 tests sessions |
| V3 | Onboarding + Monitoring | 8 | Francois + Lise | Onboarding e2e + health OK |
| V4 | API Handlers + Routes | 8 | Francois | 15 endpoints fonctionnels |
| V5 | Securite hardening | 7 | Francois + Victor | F-07/F-08/F-10 + headers HTTP |
| V6 | UX Polish front-end | 8 | Lise | Composants compilent |
| V7 | Infrastructure | 6 | Hugo | CI/CD + systemd + Caddy |
| V8 | Documentation + MSCM | 3 | Denis + Francois | MSCM 100% nouveaux fichiers |
| V9 | Integration finale | 4 | Denis + George + Victor | Build/test/clippy clean + audit >95 |
| **Total** | | **67** | **5 agents** | |

### 4.2 DAG de dependances

```
V0 (Setup) ───────┬──────────────────┐
                   v                  v
            V1 (Securite)      V6 (UX) [partiel]
                   |                  |
                   v                  |
            V2 (Auth)                 |
                   |                  |
                   v                  |
            V3 (Onboarding)           |
                   |                  |
                   v                  v
            V4 (API) ────────> V6 (UX) [reste]
                   |                  |
                   v                  v
            V5 (Hardening)     V7 (Infra)
                   |                  |
                   v                  v
            V8 (Doc+MSCM) ──> V9 (Integration)
```

### 4.3 Parallelisme Loi 9

- V1 + V6 (partiel) : fichiers distincts (crate vs Central UI)
- V2 back + V2 front : Francois (crate auth) + Lise (composants UI)
- V3 back + V3 front : Francois (domain/monitoring) + Lise (wizard/dashboard)
- V5 + V7 : securite back + infra (fichiers distincts)

### 4.4 Distribution des agents

| Agent | Taches | Perimetre |
|-------|--------|-----------|
| Francois | 38 | Back-end : utils, auth, onboarding, monitoring, API, securite |
| Lise | 15 | Front-end : composants TOTP, sessions, onboarding, UX polish |
| Hugo | 6 | Infrastructure : CI/CD, systemd, Caddy, scripts deploy |
| Denis | 6 | Setup, coordination, documentation, integration |
| Victor | 2 | Spot-checks securite (V1 gate + V9 audit final) |
| George | - | Audit conformite en V9 |

### 4.5 Livrables cles

| Livrable | Quantite |
|----------|----------|
| Fichiers a creer | ~19 (12 crate + 4 app + 1 test + 2 deploy) |
| Fichiers a modifier | ~22 |
| Lignes nouvelles | ~2 300 |
| Tests nouveaux | ~75 (total ~301) |
| Endpoints API nouveaux | 15 (total 42) |
| Tables SQLite nouvelles | 4 |
| Dependencies Cargo nouvelles | 4 (totp-rs, subtle, zeroize, base64) |

---

## 5. Risques et mitigations

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R1 | Regression sur les 226 tests existants lors des modifications de fichiers partages (kindmother_db, main.rs, share_page) | Moyen | Eleve | TDD strict, `cargo test -p miyucloud` apres chaque tache, checkpoints Denis toutes les ~5 taches |
| R2 | Score securite <95/100 a la fin de V9 malgre les 22 corrections | Faible | Eleve | Victor spot-check en V1 et V5, audit complet en V9, buffer 20% pour corrections supplementaires |
| R3 | Conflits de merge entre Francois (back) et Lise (front) sur fichiers partages (mod.rs, settings.rs) | Moyen | Moyen | Fichiers distincts par agent, merge coordination Denis, commits atomiques |
| R4 | Incompatibilite totp-rs 5.x ou breaking change non detecte | Faible | Moyen | Context7 verification completee (T6), versions epinglees dans Cargo.toml |
| R5 | Depassement budget tokens (>200K) sur sprint unique | Moyen | Faible | Mode BIG_STEPS avec gates, metriques temps reel, possibilite de decouper V6-V9 en sprint 2 si necessaire |

---

## 6. Metriques cibles

| Metrique | Valeur actuelle | Cible v2 |
|----------|----------------|----------|
| Score securite Victor | 72/100 | >95/100 |
| Score audit George | 87/100 | >90/100 |
| Tests unitaires | 226 | ~301 |
| Clippy warnings | 0 | 0 |
| Couverture MSCM | 100% | 100% (y compris nouveaux fichiers) |
| Endpoints API | 31 (27+4 web) | 46 (42+4 web) |
| Tables SQLite | existantes | +4 nouvelles |
| Dependencies Cargo | 15 | +4 (totp-rs, subtle, zeroize, base64) |

---

## 7. Artefacts MIP produits pendant ce P0

| Temps | Artefact | Chemin |
|-------|----------|--------|
| T3 | Analyse concurrentielle Fabrice | `.mip/briefs/2026-03-01-miyucloud-analyse-concurrentielle.md` |
| T5 | Audit securite Victor (score 72/100, 23 defauts) | Rapport interne T5 (non fichier — integre dans spec) |
| T6 | Spec technique Francois | `.mip/specs/2026-03-03-miyucloud-v2-spec-technique.md` |
| T7 | Plan exhaustif Denis (index) | `.mip/plans/2026-03-03-miyucloud-v2-plan.md` |
| T7 | Plan vagues V0-V3 | `.mip/plans/2026-03-03-miyucloud-v2-plan-V0-V3.md` |
| T7 | Plan vagues V4-V7 | `.mip/plans/2026-03-03-miyucloud-v2-plan-V4-V7.md` |
| T7 | Plan vagues V8-V9 | `.mip/plans/2026-03-03-miyucloud-v2-plan-V8-V9.md` |
| T10 | Brief de cadrage (ce document) | `.mip/briefs/2026-03-03-miyucloud-v2-brief.md` |
| Ref | Brief v1 (decisions D1-D4) | `.mip/briefs/2026-03-01-cloud-storage-service.md` |
| Ref | Audit securite George v1 (87/100) | `.mip/audits/2026-03-01-miyucloud-audit-securite.md` |

---

## 8. Recommandation Arianne (T8 — Audit de faisabilite)

- **Reclassification T5 -> T4** : base existante mature (18 510 lignes), extensions ciblees et non structurelles. Le volume de code nouveau (~2 300 lignes) et le nombre de fichiers (~19 crees, ~22 modifies) sont typiques d'un T4.
- **Gap front-end** : la spec technique (T6) couvre uniquement le back-end. Les composants front (Lise) suivent les maquettes de l'ideation (T2) — pas de spec front formelle. Risque controle car Lise a l'habitude du pattern et les composants sont independants.
- **Faisabilite** : 1 session (~150-200K tokens). Aucune hallucination detectee (4 crates verifiees, 0 dep inexistante).
- **Mode d'autonomie recommande** : BIG_STEPS (gates entre P3->P4 et P4->P5).
- **Decoupage alternatif** si depassement tokens : Sprint 1 (V0-V5 back-end + secu), Sprint 2 (V6-V9 front + infra + docs).

---

## 9. Prochaines etapes

Apres approbation de ce brief :

1. **Choix de l'approche** : A (sprint unique), B (2 sprints), ou C (3 micro-sprints)
2. **Choix du mode d'autonomie** : FULL, BIG_STEPS, ou GUIDED
3. **Lancement de l'execution** : creation de la feature branch `feat/miyucloud-v2` et demarrage V0

---

*Brief redige par Maria -- Chef de Projet, Miyukini AI Studio*
*2026-03-03 -- P0 Temps 10 (Synthese)*
*Synthese des contributions de : Lise (T2), Fabrice (T3), Denis (T4, T7), Victor (T5), Francois (T6), Arianne + Jean (T8), Hugo (T9)*
