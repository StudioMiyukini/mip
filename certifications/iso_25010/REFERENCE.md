<!-- @id cert.denis.iso_25010 -->
<!-- @do provide_iso25010_reference_knowledge -->
<!-- @role software_quality -->
<!-- @layer reference -->
<!-- @human Referentiel ISO/IEC 25010 pour Denis -->

# ISO/IEC 25010:2023 (SQuaRE) — Referentiel Denis

> **TL;DR** : Norme internationale definissant 8 caracteristiques de qualite logicielle + 5 caracteristiques de qualite en usage. Fournit le vocabulaire et le cadre d'evaluation pour structurer les revues qualite. Reference Denis pour definir et mesurer la qualite dans les audits P4/P5.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ISO/IEC JTC 1/SC 25 |
| Obligation | Volontaire (reference standard pour qualite logicielle) |
| Validite | Permanente (revision periodique, derniere : 2023) |
| Prerequis | Aucun |

## Domaine d'application

Modele de qualite pour les systemes et logiciels. Definit les caracteristiques mesurables pour evaluer un produit logiciel (Product Quality) et son usage effectif (Quality in Use). S'integre dans la serie SQuaRE (ISO 2500x).

## Modele de qualite produit — 8 caracteristiques

| # | Caracteristique | Sous-caracteristiques | Description |
|---|----------------|----------------------|-------------|
| 1 | **Functional Suitability** | Completeness, Correctness, Appropriateness | Le logiciel fait-il ce qu'il doit faire ? |
| 2 | **Performance Efficiency** | Time behaviour, Resource utilization, Capacity | Rapidite, consommation ressources, charge supportee |
| 3 | **Compatibility** | Co-existence, Interoperability | Cohabitation avec d'autres systemes, echange de donnees |
| 4 | **Usability** | Learnability, Operability, User error protection, Accessibility, UI aesthetics | Facilite d'utilisation et d'apprentissage |
| 5 | **Reliability** | Maturity, Availability, Fault tolerance, Recoverability | Fiabilite en conditions normales et degradees |
| 6 | **Security** | Confidentiality, Integrity, Non-repudiation, Accountability, Authenticity | Protection des donnees et des acces |
| 7 | **Maintainability** | Modularity, Reusability, Analysability, Modifiability, Testability | Facilite de maintenance et d'evolution |
| 8 | **Portability** | Adaptability, Installability, Replaceability | Deploiement sur differents environnements |

## Modele qualite en usage — 5 caracteristiques

| # | Caracteristique | Sous-caracteristiques | Description |
|---|----------------|----------------------|-------------|
| 1 | **Effectiveness** | — | Precision et completude des objectifs utilisateur |
| 2 | **Efficiency** | — | Ressources depensees par rapport aux resultats |
| 3 | **Satisfaction** | Usefulness, Trust, Pleasure, Comfort | Degre de satisfaction utilisateur |
| 4 | **Freedom from risk** | Economic, Health/Safety, Environmental | Attenuation des risques economiques, sante, environnement |
| 5 | **Context coverage** | Flexibility, Context completeness | Adaptation a differents contextes d'utilisation |

## Metriques par caracteristique

| Caracteristique | Metriques typiques | Outil de mesure |
|----------------|-------------------|-----------------|
| Functional Suitability | Taux de couverture exigences, taux de tests OK | cargo test, acceptance P5 |
| Performance Efficiency | Latence p95, memoire max, FPS min | benchmarks, profiler |
| Compatibility | Nombre d'interfaces conformes, taux interop | tests integration |
| Usability | Score SUS, taux reussite taches, temps moyen | questionnaire P5 |
| Reliability | MTBF, taux de crash, taux de recovery | monitoring, logs |
| Security | Score audit /100, vulnerabilites ouvertes | Victor P4, cargo audit |
| Maintainability | Clippy warnings, couverture tests, complexite cyclomatique | clippy, tarpaulin |
| Portability | Nombre de cibles supportees, taux de build OK | CI multi-plateforme |

## Checklist Denis

- [ ] Modele de qualite selectionne (produit et/ou usage) selon le type de livrable
- [ ] Metriques definies pour chaque caracteristique pertinente (au moins 5/8)
- [ ] Criteres d'evaluation documentes dans le brief P0 (seuils acceptables)
- [ ] Revue qualite P4 structuree par caracteristique (tableau score)
- [ ] Performance Efficiency : benchmarks definis et mesures (latence, memoire)
- [ ] Maintainability : modularite crates, clippy, couverture tests verifiees
- [ ] Security : score Victor /100 integre dans l'evaluation qualite
- [ ] Reliability : absence de crash, types erreur explicites, pas de unwrap()
- [ ] Portability : build verifie sur les 3 OS cibles (Windows, Linux, macOS)
- [ ] Rapport P6 Arianne inclut scores qualite par caracteristique

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Evaluer uniquement la fonctionnalite | Couvrir au minimum 5/8 caracteristiques dans chaque audit P4 |
| Metriques sans seuils | Definir des seuils PASS/FAIL pour chaque metrique en P0 |
| Ignorer la qualite en usage | Evaluer satisfaction + effectiveness en P5 (test humain) |
| Confondre qualite et absence de bugs | La qualite couvre performance, maintenabilite, securite, portabilite |
| Mesurer sans agir | Chaque mesure sous le seuil declenche une action corrective tracee |
| Qualite evaluee une seule fois | Evaluer en continu : P3 (unit), P4 (integration), P5 (usage) |
| Sous-caracteristiques ignorees | Chaque caracteristique a des sous-criteres specifiques a verifier |

## Application Miyukini

| Caracteristique | Application projet |
|----------------|-------------------|
| Functional Suitability | Tests TDD (Francois P3), V&V cargo test, criteres acceptance P5 |
| Performance Efficiency | Benchmarks render MGE, latence API axum, memoire desktop Dioxus |
| Compatibility | Cross-workspace COG/MGE, feature flags, interop services REST |
| Usability | Lise P3 front, Atomic Design miyuki-ui, ISO 9241 (voir cert.lise) |
| Reliability | Pas de `unwrap()`, types erreur explicites, fault tolerance LOI-1/LOI-2 |
| Security | Victor P4 audit /100, crypto MiyuCloud, OWASP, cargo audit |
| Maintainability | Modularite crates, clippy pedantic, MSCM annotations, TDD |
| Portability | Windows + Linux + macOS (MGE), desktop Dioxus, feature flags |

---

*Sources : ISO/IEC 25010:2023, ISO/IEC 25000:2014 (SQuaRE Guide), ISO/IEC 25040:2011 (Evaluation Process)*
