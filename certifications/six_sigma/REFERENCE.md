<!-- @id cert.arianne.six_sigma -->
<!-- @do provide_sixsigma_reference_knowledge -->
<!-- @role process_improvement -->
<!-- @layer reference -->
<!-- @human Referentiel Six Sigma pour Arianne -->

# Lean Six Sigma -- Referentiel Arianne

> **TL;DR** : Methodologie d'amelioration des processus basee sur la reduction des defauts et de la variabilite.
> Combine Lean (elimination des gaspillages) et Six Sigma (maitrise statistique).
> Impact Miyukini : optimise les processus MIP, mesure la qualite des livrables, reduit les reprises.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ASQ, IASSC, CSSC (certification), Motorola/GE (origine) |
| Obligation | Volontaire — standard industriel de fait |
| Validite | Certification a vie (IASSC) ou renouvellement selon organisme |
| Prerequis | Yellow Belt: aucun, Green: projet reel, Black: 2 projets, MBB: 5+ ans |

## Domaine d'application

Applicable a tout processus repetable dont on peut mesurer les sorties. Vise un objectif de 3.4 defauts par million d'opportunites (DPMO), soit un niveau de qualite 6 sigma.

## Niveaux Sigma

| Sigma | DPMO | Rendement | Equivalent |
|-------|------|-----------|------------|
| 1 | 691 462 | 30.9% | Chaos |
| 2 | 308 538 | 69.1% | Mediocre |
| 3 | 66 807 | 93.3% | Moyen |
| 4 | 6 210 | 99.38% | Bon |
| 5 | 233 | 99.977% | Excellent |
| 6 | 3.4 | 99.9997% | Classe mondiale |

## Systeme de ceintures

| Ceinture | Role | Responsabilite |
|----------|------|----------------|
| Yellow Belt | Participant | Comprend les bases, contribue aux projets |
| Green Belt | Chef de projet | Mene des projets d'amelioration a temps partiel |
| Black Belt | Expert | Mene des projets complexes, mentor les Green Belts |
| Master Black Belt | Stratege | Deploiement organisationnel, formation, coaching |

## DMAIC (processus existant)

| Phase | Objectif | Outils cles |
|-------|----------|-------------|
| Define | Definir le probleme et le perimetre | Project Charter, SIPOC, VOC, CTQ |
| Measure | Mesurer la performance actuelle | Collecte de donnees, Cp/Cpk, MSA, cartographie |
| Analyze | Identifier les causes racines | Ishikawa, 5 Pourquoi, Pareto, regression, ANOVA |
| Improve | Implementer les solutions | DOE, Poka-Yoke, pilote, plan d'action |
| Control | Perenniser les gains | Cartes de controle, SPC, plan de controle, standardisation |

## DMADV (nouveau processus)

| Phase | Objectif | Outils cles |
|-------|----------|-------------|
| Define | Definir les besoins clients | VOC, QFD, benchmark |
| Measure | Mesurer les CTQ | Specifications, capacite cible |
| Analyze | Analyser les options de conception | Matrice de Pugh, AMDEC, simulation |
| Design | Concevoir le processus optimal | Prototype, validation, tolerance |
| Verify | Verifier la performance | Pilote, Cp/Cpk, transfert production |

## Outils statistiques essentiels

| Outil | Usage | Phase |
|-------|-------|-------|
| SIPOC | Vue macro du processus (Suppliers, Inputs, Process, Outputs, Customers) | Define |
| VOC (Voice of Customer) | Capturer les besoins clients | Define |
| Diagramme Ishikawa | Causes racines (5M: Matiere, Methode, Main d'oeuvre, Milieu, Machine) | Analyze |
| Diagramme de Pareto | 80/20 — identifier les causes majeures | Analyze |
| 5 Pourquoi | Remonter a la cause racine par iterations | Analyze |
| Cartes de controle | Surveiller la stabilite du processus (X-bar, R, p, np, c, u) | Control |
| Cp / Cpk | Capabilite du processus (Cp >= 1.33 = capable) | Measure/Control |

## Checklist Arianne

- [ ] Project Charter redige (probleme, perimetre, objectifs, equipe)
- [ ] Diagramme SIPOC du processus cible
- [ ] Cartographie detaillee du processus (value stream mapping)
- [ ] Plan de collecte de donnees (quoi, ou, quand, comment)
- [ ] Analyse de cause racine documentee (Ishikawa + 5 Pourquoi)
- [ ] Plan de controle avec indicateurs et seuils d'alerte
- [ ] Mesure de capabilite processus (Cp/Cpk avant/apres)
- [ ] Standardisation des ameliorations (procedures mises a jour)

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Sauter l'etape Measure pour aller directement aux solutions | Toujours mesurer l'etat actuel avant d'ameliorer |
| Utiliser Six Sigma pour des problemes evidents | Reserver aux problemes complexes a causes inconnues |
| Collecter des donnees sans plan structure | Definir le plan de collecte AVANT de mesurer |
| Oublier la phase Control apres amelioration | Un plan de controle est obligatoire pour perenniser |
| Confondre correlation et causalite | Valider par DOE ou test d'hypothese |

## Application Miyukini

| Concept Six Sigma | Implementation COG |
|-------------------|--------------------|
| DMAIC | Boucle MIP : P0=Define, P3=Measure+Improve, P4=Analyze, P5=Control |
| VOC | Questionnaire P5, feedback utilisateur, brainstorming P0-T1 |
| SIPOC | Workflow MIP (Utilisateur → Agents → Livrables → Validation) |
| Cartes de controle | `.mip/metrics/` — suivi horodatage, compteurs, tendances |
| Cause racine | Analyse post-mortem P6, anti-patterns memory |
| Capabilite | Score audit /100 (George), notes /20 (Arianne P6) |
| Plan de controle | Gates P0/P5, checkpoints Denis /5 taches, frein d'urgence |
