<!-- @id cert.fabrice.lean_startup -->
<!-- @do provide_lean_startup_reference_knowledge -->
<!-- @role product_strategy -->
<!-- @layer reference -->
<!-- @human Referentiel Lean Startup pour Fabrice -->

# Lean Startup — Referentiel Fabrice

> **TL;DR** : Methodologie d'Eric Ries pour valider des idees produit rapidement avec un minimum de gaspillage.
> Couvre Build-Measure-Learn, MVP, Pivot/Persevere, Innovation Accounting, moteurs de croissance.
> Impact Miyukini : structure l'analyse PR de Fabrice (hypotheses, MVP, metriques, pivots, validation marche).

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | Eric Ries (The Lean Startup, 2011) |
| Obligation | Aucune (methodologie, pas de certification formelle) |
| Validite | N/A (principes intemporels) |
| Prerequis | Aucun |

## Domaine d'application

Developpement de produits et services en conditions d'incertitude extreme. Applicable aux startups, intrapreneurs, et tout projet innovant. L'objectif est d'apprendre le plus vite possible si une idee a de la valeur avant d'investir massivement.

## Boucle Build-Measure-Learn

| Phase | Objectif | Livrable | Piege a eviter |
|-------|----------|----------|----------------|
| **Build** | Construire le minimum pour tester une hypothese | MVP (Minimum Viable Product) | Construire trop (feature creep) |
| **Measure** | Collecter des donnees exploitables | Metriques actionnables | Vanity metrics (likes, pageviews) |
| **Learn** | Valider ou invalider l'hypothese | Validated Learning | Ignorer les donnees qui contredisent |

**Regle** : Minimiser le temps total de la boucle. Chaque cycle doit produire un apprentissage valide.

## Concepts fondamentaux

| Concept | Definition | Application |
|---------|------------|-------------|
| MVP | Plus petit produit testant l'hypothese la plus risquee | Prototype, landing page, concierge, Wizard of Oz |
| Pivot | Changement fondamental de strategie base sur les apprentissages | Pivot zoom-in, zoom-out, segment, canal, techno, plateforme |
| Persevere | Continuer la strategie actuelle si les donnees le confirment | Metriques en croissance, hypotheses validees |
| Innovation Accounting | Mesurer le progres d'une startup en 3 etapes | Baseline → tune engine → pivot or persevere |
| Validated Learning | Apprentissage demontre empiriquement (donnees, pas opinions) | Tests A/B, cohortes, entretiens structures |

## Types de MVP

| Type | Description | Effort | Quand |
|------|-------------|--------|-------|
| Landing Page | Page decrivant le produit + CTA (mesure interet) | Tres faible | Validation de demande |
| Video Explainer | Video montrant le concept (ex: Dropbox) | Faible | Produit technique complexe |
| Concierge | Service rendu manuellement a quelques clients | Moyen | Validation de valeur |
| Wizard of Oz | Interface automatisee, back-end manuel | Moyen | Validation UX + valeur |
| Prototype fonctionnel | Version reduite avec les features cles uniquement | Eleve | Validation technique + UX |
| Single Feature | Un seul feature core, parfaitement execute | Moyen-eleve | Marche connu, solution nouvelle |

## Innovation Accounting (3 etapes)

| Etape | Action | Metrique |
|-------|--------|----------|
| 1. Establish baseline | Lancer un MVP, mesurer l'etat initial | Taux de conversion, retention, engagement |
| 2. Tune the engine | Iterer pour ameliorer les metriques vers l'ideal | Progression des cohortes successives |
| 3. Pivot or persevere | Decider : les metriques s'ameliorent-elles assez vite ? | Tendance vs objectif cible |

## 3 Moteurs de croissance

| Moteur | Mecanisme | Metrique cle |
|--------|-----------|--------------|
| Sticky | Retention elevee, faible churn | Taux retention > taux churn |
| Viral | Utilisateurs recrutent d'autres utilisateurs | Coefficient viral > 1.0 |
| Paid | Acquisition payante rentable | LTV > CAC (Customer Acquisition Cost) |

## Types de pivot

| Pivot | Description |
|-------|-------------|
| Zoom-in | Un feature secondaire devient le produit entier |
| Zoom-out | Le produit entier devient un feature d'un produit plus grand |
| Customer segment | Meme produit, segment client different |
| Customer need | Meme segment, besoin different |
| Channel | Changement du canal de distribution |
| Technology | Meme solution, technologie differente |
| Platform | Passage d'une application a une plateforme (ou inverse) |
| Value capture | Changement du modele de monetisation |
| Engine of growth | Changement du moteur de croissance |

## Checklist Fabrice

- [ ] Hypothese de valeur formulee et falsifiable (qui, quoi, pourquoi)
- [ ] Hypothese de croissance formulee (quel moteur, quel mecanisme)
- [ ] MVP defini (minimum pour tester l'hypothese la plus risquee)
- [ ] Metriques actionnables identifiees (pas de vanity metrics)
- [ ] Tableau de bord metriques en place (cohortes, conversion, retention)
- [ ] Criteres de pivot definis a l'avance (seuils, delais)
- [ ] Modele de croissance identifie (sticky, viral, ou paid)
- [ ] Feedback utilisateurs collecte de maniere structuree
- [ ] Boucle Build-Measure-Learn < 2 semaines par cycle
- [ ] Decision pivot/persevere documentee avec donnees

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| MVP = produit bacle | MVP = minimum, mais viable (qualite suffisante pour tester) |
| Vanity metrics (total users, downloads) | Utiliser des metriques actionnables (retention, activation, revenue) |
| Pas de criteres de pivot | Definir les seuils d'echec AVANT de lancer le test |
| Build-Build-Build sans mesurer | Forcer un cycle de mesure a chaque iteration |
| Ignorer les donnees negatives | Les invalidations sont des apprentissages precieux |
| Pivot sans donnees | Pivoter sur des donnees, pas sur des intuitions |
| Feature creep sur le MVP | Retirer des features jusqu'a ce que ca fasse mal |

## Application Miyukini

| Concept Lean Startup | Application MIP v2 |
|---------------------|---------------------|
| Build-Measure-Learn | P3 (build TDD) → P5 (measure: test humain) → P6 (learn: rapport) |
| MVP | Smoke test e2e en debut P3 (compile mais echoue = structure validee) |
| Hypothese de valeur | P0 Temps 1 brainstorming (Maria) — 5 sections Design Thinking |
| Innovation Accounting | `.mip/metrics/` — baseline, progression, tendance |
| Pivot/Persevere | Gate P5 : ACCEPTE (persevere) ou REFUSE (pivot → retour P0) |
| Validated Learning | Tests TDD P3 + audit P4 + feedback P5 = apprentissage valide |
| Analyse concurrentielle | P0 Temps 3 (Fabrice) — qualites/defauts concurrence |
| Moteur de croissance | Analyse du modele de distribution dans le brief P0 |
| Metriques actionnables | Rapport P6 (Arianne) — notes /20 sur 8 criteres |

---

*Sources : The Lean Startup (Eric Ries, 2011), Running Lean (Ash Maurya, 2012), The Startup Way (Eric Ries, 2017)*
