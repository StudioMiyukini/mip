<!-- @id cert.arianne.iso_33001 -->
<!-- @do provide_iso33001_reference_knowledge -->
<!-- @role process_assessment -->
<!-- @layer reference -->
<!-- @human Referentiel ISO/IEC 33001 pour Arianne -->

# ISO/IEC 33001 -- Referentiel Arianne

> **TL;DR** : Cadre international pour l'evaluation de la maturite des processus (anciennement ISO 15504/SPICE).
> Definit 6 niveaux de capabilite (0-5) et un cadre d'evaluation reproductible.
> Impact Miyukini : mesure la maturite des processus COG, identifie les ecarts, guide l'amelioration.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ISO/IEC JTC 1/SC 7 (genie logiciel et systemes) |
| Obligation | Volontaire — souvent exigee dans les appels d'offres IT |
| Validite | Evaluation ponctuelle (pas de certification perenne) |
| Prerequis | Evaluateur competent, modele de reference de processus (PRM) |

## Domaine d'application

Evaluation de la capabilite des processus dans tout domaine (logiciel, systemes, services, organisation). La famille ISO/IEC 330xx remplace ISO/IEC 15504 (SPICE). Utilisable avec tout modele de reference (ISO/IEC 12207, 15288, COBIT, ITIL).

## Famille de normes 330xx

| Norme | Titre | Contenu |
|-------|-------|---------|
| 33001 | Concepts et terminologie | Definitions, cadre general |
| 33002 | Exigences pour l'evaluation | Regles pour conduire une evaluation |
| 33003 | Exigences pour les cadres de mesure | Comment construire une echelle |
| 33004 | Exigences pour les modeles de reference | Structure des PRM |
| 33020 | Cadre de mesure de la capabilite | Echelle 6 niveaux, 9 attributs |
| 33061 | Modele d'evaluation pour les processus logiciels | Base ISO 12207 |

## Niveaux de capabilite

| Niveau | Nom | Description | Attributs |
|--------|-----|-------------|-----------|
| 0 | Incomplet | Processus non implemente ou echoue | Aucun |
| 1 | Realise | Processus atteint ses objectifs | PA 1.1 Performance |
| 2 | Gere | Processus planifie, suivi et ajuste | PA 2.1 Gestion performance, PA 2.2 Gestion produits |
| 3 | Etabli | Processus defini, deploye de maniere coherente | PA 3.1 Definition, PA 3.2 Deploiement |
| 4 | Previsible | Processus opere dans des limites definies | PA 4.1 Mesure quantitative, PA 4.2 Controle quantitatif |
| 5 | En optimisation | Processus ameliore en continu | PA 5.1 Innovation, PA 5.2 Optimisation |

## Echelle de notation des attributs

| Note | Signification | Couverture |
|------|---------------|------------|
| N (Not achieved) | Non atteint | 0-15% |
| P (Partially) | Partiellement atteint | 16-50% |
| L (Largely) | Largement atteint | 51-85% |
| F (Fully) | Pleinement atteint | 86-100% |

**Regle** : un niveau est atteint si tous ses attributs sont F ou L, ET tous les attributs des niveaux inferieurs sont F.

## Deroulement d'une evaluation

| Etape | Action | Livrable |
|-------|--------|----------|
| 1 | Planification | Plan d'evaluation, perimetre, processus cibles |
| 2 | Collecte de preuves | Entretiens, documents, observations, artefacts |
| 3 | Notation | Attributs notes N/P/L/F par processus |
| 4 | Determination du niveau | Niveau de capabilite par processus |
| 5 | Rapport | Profil de capabilite, forces, faiblesses |
| 6 | Plan d'amelioration | Actions pour atteindre le niveau cible |

## Indicateurs d'evaluation

| Type | Description | Exemples |
|------|-------------|----------|
| Pratiques de base (BP) | Ce qui est fait | Activites, taches, techniques |
| Produits de travail (WP) | Ce qui est produit | Documents, livrables, enregistrements |
| Pratiques generiques (GP) | Comment c'est gere | Planification, suivi, ressources |
| Ressources generiques (GR) | Avec quoi | Outils, infrastructure, competences |

## Checklist Arianne

- [ ] Identification des processus a evaluer (perimetre MIP)
- [ ] Definition du niveau de capabilite cible par processus
- [ ] Plan d'evaluation (calendrier, evaluateurs, criteres)
- [ ] Collecte des preuves (artefacts MIP, metriques, rapports)
- [ ] Notation des attributs de processus (N/P/L/F)
- [ ] Analyse des ecarts (niveau actuel vs cible)
- [ ] Plan d'amelioration priorise par processus
- [ ] Suivi de la progression (reevaluation periodique)

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Evaluer sans preuves objectives | Toujours baser la notation sur des artefacts verifiables |
| Confondre evaluation et audit de conformite | L'evaluation mesure la capabilite, pas la conformite |
| Viser le niveau 5 pour tous les processus | Adapter le niveau cible au contexte et aux besoins |
| Notation inflexible sans calibration | Calibrer les evaluateurs avant chaque campagne |
| Ignorer les niveaux intermediaires | Un niveau 3 solide est preferable a un niveau 4 fragile |

## Application Miyukini

| Concept ISO 33001 | Implementation COG |
|--------------------|--------------------|
| Processus evalues | P0 (cadrage), P3 (implementation), P4 (audit), P5 (livraison), P6 (rapport) |
| Niveau 1 (Realise) | Processus MIP execute, livrables produits |
| Niveau 2 (Gere) | Gates, checkpoints, metriques `.mip/metrics/`, TodoWrite |
| Niveau 3 (Etabli) | MIP v2 defini, reproductible, CLAUDE.md + skills |
| Niveau 4 (Previsible) | Metriques quantitatives, scores /100, tendances |
| Niveau 5 (Optimisation) | Boucle MIP, capitalisation P6, memory, anti-patterns |
| Preuves | `.mip/` artefacts, rapports P6, audits P4, metriques |
| Evaluateur | Arianne (QA/Memoire) + George (Audit) |
