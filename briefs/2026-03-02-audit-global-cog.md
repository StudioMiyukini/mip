<!-- @id mip.brief.audit-global-cog -->
<!-- @do define_audit_scope_and_plan -->
<!-- @role brief -->
<!-- @layer governance -->
<!-- @human Brief P0 audit global COG hors MGE — 9 agents, 34 certifications, score maturite /100 -->

# Brief P0 — Audit Global Miyukini COG (hors MGE)

**Date** : 2026-03-02
**Auteur** : Maria (Chef de Projet)
**Classification** : T5 — Chantier strategique
**Statut** : EN ATTENTE VALIDATION GATE P0

---

## 1. Objectifs (valides par l'utilisateur)

1. **Quantifier la dette technique** du workspace COG
2. **Verifier la conformite legale** (RGPD, NF525, NF203)
3. **Mesurer la maturite globale** du projet avec un score /100

**Mode** : Audit approfondi, hybride (stricte securite/legal, pragmatique reste)
**Livrable** : Score de maturite global /100 + fiches par service avec recommandations actionnables

---

## 2. Perimetre

| Metrique | Valeur |
|----------|--------|
| Lignes Rust | 233 020 |
| Packages | 117 (99 crates + 13 apps + 5 outils) |
| Fichiers .rs | 1 307 |
| Exclus | mge/ (workspace separe) |

---

## 3. Etat de sante initial (mesures reelles)

| Indicateur | Valeur | Norme | Verdict |
|------------|--------|-------|---------|
| unwrap() production | **854** (111 apps + 743 crates) | 0 | NON CONFORME |
| panic! production | **37** | 0 | NON CONFORME |
| Clippy warnings | **1 511** (+ 70 erreurs) | 0 | NON CONFORME |
| Packages 0 tests | **40** (31 crates + 9 apps) | 0 | NON CONFORME |
| MSCM couverture | **52.5%** (687/1307) | 100% | INSUFFISANT |
| CI/CD / Docker | **0** | Existant | ABSENT |
| unsafe_code forbid | **99/117** (18 manquants) | 117/117 | PARTIEL |
| Defauts securite | **15** (1C, 4E, 8M, 2F) | 0 bloquant | A CORRIGER |
| Score WCAG | **31%** | AA (100%) | NON CONFORME |
| Score ISO 9241 | **49%** | 70%+ | INSUFFISANT |

**Score maturite estime (baseline)** : **~38/100** (Niveau 2 ISO 33001 "Gere")

---

## 4. Defauts critiques deja identifies

| ID | Severite | Domaine | Description |
|----|----------|---------|-------------|
| S-01 | **CRITIQUE** | Securite | XSS stored via nom de fichier dans MiyuCloud share_page.rs:318 |
| S-02 | ELEVE | Securite | CORS allow_origin(Any) sur LLM Bridge (0.0.0.0:11435) |
| S-03 | ELEVE | Securite | SHA256 nu pour password hashing legacy (kindmother-db-adapter, miyukinibb) |
| S-04 | ELEVE | Securite | unwrap() sur RwLock dans security.rs = DoS par lock poisoning |
| S-10 | ELEVE | Securite | Origin Web HTTP sans TLS sur Internet |
| F-WCAG-05 | CRITIQUE | UI/UX | outline:none inline sur 6 atoms = focus visible casse |
| F-WCAG-06 | CRITIQUE | UI/UX | Navigation clavier absente dans 95%+ des vues |
| F-ISO-01 | MAJEUR | UI/UX | Double systeme theming non reconcilie |

---

## 5. Conformite legale

| Certification | Applicable ? | Statut |
|--------------|-------------|--------|
| **RGPD** | OUI (obligatoire) | PARTIELLEMENT CONFORME — registre absent, DPO absent |
| NF525 | NON (pas de caisse) | N/A — A surveiller si JayKonta evolue |
| NF203 | POTENTIEL (JayKonta) | A surveiller — export FEC manquant |
| HDS | NON | N/A |
| ISO 27001 | RECOMMANDE | NON CONFORME — pas de SMSI |

---

## 6. Methodologie d'audit

### 7 domaines avec ponderation

| Domaine | Poids | Agent lead | Referentiels |
|---------|-------|-----------|--------------|
| D1 Sante code | 25% | Francois | ISTQB, ISO 25010 |
| D2 Architecture | 15% | Denis | TOGAF, ISO 12207 |
| D3 Securite | 20% | Victor | ISO 27001, CISSP, CEH |
| D4 UI/UX | 10% | Lise | WCAG 2.2, ISO 9241 |
| D5 Conformite legale | 15% | George | ISO 19011, CISA, RGPD |
| D6 Qualite processus | 10% | Arianne | ISO 9001, Six Sigma, ISO 33001 |
| D7 Infrastructure | 5% | Hugo | DevOps Foundation, Docker |

### 3 phases d'execution

| Phase | Contenu | Agents |
|-------|---------|--------|
| Phase 1 | Scan automatise (metriques brutes par crate) | Francois + Arianne + Hugo |
| Phase 2 | Audit approfondi par lot (5 lots, findings fichier:ligne) | Denis + Victor + George + Lise + Fabrice |
| Phase 3 | Consolidation scores + plan remediation | Maria + Denis |

### 5 lots d'audit

| Lot | Contenu | Volume |
|-----|---------|--------|
| L1 | Coeur COG (Cores strate 1-4) | ~11K lignes |
| L2 | Services Jay* + Watch | ~40K lignes |
| L3 | Toolkits Miyu* + LLM Bridge + Cloud | ~18K lignes |
| L4 | UI + Central + Origin | ~63K lignes |
| L5 | Transverse (MSCM, docs, architecture, lois) | ~15K lignes |

---

## 7. Mode d'autonomie recommande

**BIG_STEPS** — 4 gates humaines :

| Gate | Moment | Question |
|------|--------|----------|
| G1 | Fin Phase 1 | Metriques brutes coherentes ? Ajuster priorites ? |
| G2 | Fin Phase 2 L1+L2 | Findings coeur + services corrects ? Approfondir ? |
| G3 | Fin Phase 3 | Score global + plan remediation credibles ? |
| G4 | P5 | Acceptation/refus du rapport final |

---

## 8. Reserves bloquantes (Arianne T8)

| # | Reserve | Action requise |
|---|---------|---------------|
| RB-1 | Metriques JSON initiales erronees (66% a 1600%) | Francois recalcule en Phase 1 |
| RB-2 | Lots L2 et L4 trop volumineux pour un seul passe | Decouper en sous-lots 15-20 fichiers |
| RB-3 | Pas de calibration inter-agents | Calibrer sur 1 crate reference avant Phase 2 |

---

## 9. Livrables finaux

| Livrable | Format |
|----------|--------|
| Score global /100 avec decomposition 7 axes | Markdown |
| ~35 fiches individuelles (crates majeurs) + tableaux consolides | Markdown |
| Catalogue findings (ID, severite, domaine, crate, fichier:ligne, recommandation) | Markdown |
| Rapport securite detaille /100 | Markdown |
| Rapport conformite legale (RGPD, NF525, NF203) | Markdown |
| Plan remediation priorise (quick-wins + chantiers + timeline) | Markdown |
| Rapport final MIP P6 (notes /20, capitalisation) | Markdown |

**Destination** : `.mip/audits/2026-03-02-cog/`

---

## 10. Estimation

| Metrique | Valeur |
|----------|--------|
| Taches totales | ~180 |
| Agents mobilises | 9 |
| Gates humaines | 4 |
| Checkpoints Denis | 6 |
| Livrables | ~15 fichiers |
| Score baseline estime | 38/100 |
| Faisabilite (Arianne) | 78/100 — FAISABLE AVEC RESERVES |

---

*Brief compile par Maria — P0 Temps 10. En attente Gate P0.*
