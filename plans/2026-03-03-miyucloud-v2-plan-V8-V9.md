# Plan MiyuCloud v2 -- Detail Vagues 8 a 9

**Index** : `2026-03-03-miyucloud-v2-plan.md`
**Auteur** : Denis (Chef Dev Senior)

---

## Vague 8 : Documentation + MSCM (Denis + Francois)

### V8-T01 : Annotations MSCM sur tous les nouveaux fichiers

**Agent** : Denis (verification) + Francois (application si manquant)
**Fichiers concernes** (12 fichiers crate + 4 fichiers app) :
1. `crates/miyucloud/src/utils/mod.rs` -- `@id: miyucloud_utils_module`
2. `crates/miyucloud/src/utils/constant_time.rs` -- `@id: miyucloud_utils_constant_time`
3. `crates/miyucloud/src/utils/sanitize.rs` -- `@id: miyucloud_utils_sanitize`
4. `crates/miyucloud/src/utils/base64.rs` -- `@id: miyucloud_utils_base64`
5. `crates/miyucloud/src/auth/totp.rs` -- `@id: miyucloud_auth_totp`
6. `crates/miyucloud/src/auth/sessions.rs` -- `@id: miyucloud_auth_sessions`
7. `crates/miyucloud/src/domain/onboarding.rs` -- `@id: miyucloud_domain_onboarding`
8. `crates/miyucloud/src/monitoring/mod.rs` -- `@id: miyucloud_monitoring`
9. `apps/miyucloud/src/api/onboarding.rs` -- `@id: miyucloud_api_onboarding`
10. `apps/miyucloud/src/api/totp.rs` -- `@id: miyucloud_api_totp`
11. `apps/miyucloud/src/api/sessions.rs` -- `@id: miyucloud_api_sessions`
12. `apps/miyucloud/src/api/monitoring.rs` -- `@id: miyucloud_api_monitoring`

**Verification par fichier** : Chaque fichier DOIT avoir dans le header `//!` :
- `@id` : identifiant unique
- `@do` : description action
- `@role` : role (auth, domain, api, security, util, monitoring)
- `@layer` : couche (domain, infra, app)

**Critere** : 12 fichiers annotes. Aucun fichier sans header MSCM.
**Commit** : `docs(miyucloud): ensure MSCM annotations on all v2 modules`

### V8-T02 : Mise a jour data/mod.rs et data/types.rs

**Agent** : Francois
**Fichiers** :
- `crates/miyucloud/src/data/mod.rs` -- Ajouter re-exports pour les nouveaux types si necessaire
- `crates/miyucloud/src/data/types.rs` -- Ajouter ou re-exporter `TotpSecret`, `RecoveryCode`, `Session`, `OnboardingStatus`, `HealthReport`, `ServiceMetrics` si utilises via `data::types`

**Action** : Verifier que tous les types publics sont accessibles via le chemin canonique. Les types specifiques a un module restent dans leur module (`auth::totp::TotpSecret`), mais les types partages par l'API doivent etre re-exportes dans `data::types` pour coherence avec le pattern existant.

**Decision architecturale** : Les types restent dans leur module d'origine (auth, domain, monitoring). Pas de duplication dans `data::types`. L'API importe directement depuis le module source.

**Critere** : `cargo build -p miyucloud` compile. Imports propres.
**Commit** : `refactor(miyucloud): update data module re-exports for v2 types`

### V8-T03 : Mise a jour mscm_index/

**Agent** : Denis
**Fichier** : `mscm_index/` (ou equivalent)
**Action** : Regenerer l'index MSCM pour inclure les 12 nouveaux modules. Verifier que le compteur de couverture est a jour.

**Nouveaux IDs a indexer** :
- `miyucloud_utils_module`
- `miyucloud_utils_constant_time`
- `miyucloud_utils_sanitize`
- `miyucloud_utils_base64`
- `miyucloud_auth_totp`
- `miyucloud_auth_sessions`
- `miyucloud_domain_onboarding`
- `miyucloud_monitoring`
- `miyucloud_api_onboarding`
- `miyucloud_api_totp`
- `miyucloud_api_sessions`
- `miyucloud_api_monitoring`

**Couverture attendue apres V8** : miyucloud crate 100% (tous fichiers .rs annotes).
**Critere** : Index regenere et coherent.
**Commit** : `docs(miyucloud): update MSCM index with 12 new module annotations`

---

## Vague 9 : Integration finale (Denis + George + Victor)

### V9-T01 : cargo build --workspace clean

**Agent** : Denis
**Commande** : `cargo build --workspace`
**Critere** : 0 erreur de compilation sur l'ensemble du workspace.
**Action si echec** :
1. Identifier le crate fautif
2. Analyser l'erreur (import manquant, type mismatch, feature flag)
3. Corriger (tache CORRECT)
4. Re-lancer le build
**Frein d'urgence** : Si echec apres 2 corrections, notifier l'utilisateur.

### V9-T02 : cargo test --workspace clean

**Agent** : Denis
**Commande** : `cargo test --workspace`
**Critere** : 0 echec de test. Tous les tests existants (226+) et nouveaux (~75) passent.
**Verification specifique** :
- Tests miyucloud : `cargo test -p miyucloud -- --nocapture` (tous les nouveaux modules)
- Tests integration : `cargo test -p miyucloud-server` (endpoints API)
- Tests existants non casses : verifier que les 226 tests pre-existants passent toujours

**Action si echec** :
1. Identifier le test fautif
2. Verifier si regression (test existant casse) ou nouveau test echoue
3. Si regression : priorite maximale, corriger avant de continuer
4. Si nouveau test echoue : verifier le code du test et l'implementation

### V9-T03 : cargo clippy --workspace -- -D warnings clean

**Agent** : Denis
**Commande** : `cargo clippy --workspace -- -D warnings`
**Critere** : 0 warning clippy sur l'ensemble du workspace.
**Warnings courants a anticiper** :
- `needless_return` dans les handlers axum
- `unused_imports` apres refactoring
- `manual_let_else` dans les match de validation
- `clippy::similar_names` (deja allow dans Cargo.toml)
**Action si warning** : Corriger sur place, re-lancer.

### V9-T04 : Audit George + Audit Victor

**Agent** : Denis (coordination), George (audit conformite), Victor (audit securite)

**Audit George -- Criteres** :
1. Conformite architecturale : LOI-1 a LOI-9 respectees
2. MSCM : 100% nouveaux fichiers annotes
3. Tests : couverture des fonctions publiques
4. Documentation : headers `//!` complets
5. UX : Composants Lise coherents avec le design system

**Audit Victor -- Checklist securite** :
1. F-02 : `subtle::ConstantTimeEq` utilise partout (pas de comparaison directe)
2. F-04 : `html_escape()` applique sur tous les inputs dans le HTML
3. F-05 : `validate_uuid()` dans `file_dir()`
4. F-06 : Sel derive HKDF (pas de constante)
5. F-07 : Preview logge
6. F-08 : Rate limiter purge periodique
7. F-10 : `trust_proxy` respecte
8. Secrets TOTP : `Zeroizing<>` wrapper
9. Sessions : tokens 256 bits, comparaison constant-time
10. Recovery codes : Argon2id hash, single-use
11. Headers HTTP : securite en place
12. Pas d'`unwrap()` en production

**Score cible** : Victor >95/100, George >90/100.

**Critere** : Les deux audits sont CONFORME. Defauts mineurs corriges avant livraison.
**Commit final** : `feat(miyucloud): MiyuCloud v2 -- security hardening + 2FA + sessions + onboarding + monitoring`

---

## Post-V9 : Livraison (P5)

1. Push final sur `feat/miyucloud-v2`
2. Resume a l'utilisateur :
   - 67 taches executees
   - ~2 300 lignes nouvelles
   - 15 endpoints API ajoutes (total 42)
   - 4 tables DB ajoutees
   - Score securite : >95/100
   - Toutes les corrections F-01 a F-10 appliquees
3. Instructions de test :
   - `cargo test --workspace` -- doit passer
   - `cargo build --workspace` -- doit compiler
   - `cargo clippy --workspace -- -D warnings` -- 0 warning
   - Demarrer le serveur : `MIYUCLOUD_PASSPHRASE=test cargo run -p miyucloud-server`
   - Tester onboarding : `curl http://localhost:3456/api/onboarding/status -H "X-COG-Token: ..."`
   - Tester 2FA : `curl -X POST http://localhost:3456/api/2fa/setup -H "X-COG-Token: ..." -d '{"account_name":"test@miyukini.com"}'`
   - Tester health : `curl http://localhost:3456/api/health -H "X-COG-Token: ..."`
4. Attendre verdict utilisateur

---

## Risques et mitigations (rappel depuis spec T6)

| Risque | Mitigation | Vague concernee |
|--------|-----------|-----------------|
| `totp-rs` feature `qr` trop lourd | Feature-gater, QR cote client si besoin | V2 |
| Zeroize optimise away | `Zeroizing<>` avec `compiler_fence` | V5 |
| Sessions SQLite sous charge | Mutex OK pour mono-utilisateur | V2 |
| Purge sessions non automatique | Check lazy a chaque validation | V2 |
| Base64 crate redondant | Tiny crate, fiabilite > taille | V1 |

---

*Detail des vagues 8 a 9 -- Denis, 2026-03-03*
