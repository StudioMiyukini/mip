<!-- @id cert.fabrice.pspo -->
<!-- @do provide_pspo_reference_knowledge -->
<!-- @role product_management -->
<!-- @layer reference -->
<!-- @human Referentiel PSPO pour Fabrice -->

# PSPO (Professional Scrum Product Owner) — Referentiel Fabrice

> **TL;DR** : Certification Scrum.org validant la maitrise du role de Product Owner.
> Couvre vision produit, gestion du Product Backlog, maximisation de la valeur, parties prenantes.
> Impact Miyukini : structure l'analyse PR de Fabrice (vision, valeur, backlog, priorisation, stakeholders).

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | Scrum.org |
| Obligation | Volontaire (reference pour les Product Owners) |
| Validite | A vie (pas de renouvellement) |
| Prerequis | Aucun (PSPO I), PSPO I obtenu (PSPO II) |

## Domaine d'application

Gestion de produit dans un cadre Scrum. Le Product Owner maximise la valeur du produit en gerant le Product Backlog, en comprenant les besoins des parties prenantes, et en guidant l'equipe de developpement. Applicable a tout produit ou service.

## Competences cles du Product Owner

| Domaine | Competences |
|---------|-------------|
| Vision et strategie | Definir et communiquer la vision produit, aligner avec les objectifs business |
| Gestion du backlog | Creer, ordonner, raffiner, maintenir le Product Backlog |
| Maximisation valeur | Prioriser par valeur business, mesurer les outcomes |
| Parties prenantes | Comprendre besoins, gerer attentes, integrer feedback |
| Collaboration equipe | Travailler avec les Developers, clarifier les items, criteres d'acceptation |

## Product Backlog Management

| Aspect | Exigence | Detail |
|--------|----------|--------|
| Ordonnancement | Items ordonnes par valeur/risque/dependance | PO a le dernier mot sur l'ordre |
| Transparence | Backlog visible par tous | Source unique de travail a faire |
| Raffinement | 10% max du Sprint pour raffiner | Decomposition, estimation, criteres |
| Granularite | Items hauts = detailles, items bas = grossiers | Progressive elaboration |
| Product Goal | Objectif a long terme du produit | Engage dans le Product Backlog |

## Techniques de priorisation et d'ordonnancement

| Technique | Description | Quand utiliser |
|-----------|-------------|----------------|
| MoSCoW | Must/Should/Could/Won't have | Release planning rapide |
| WSJF (Weighted Shortest Job First) | Valeur / taille (CoD / Duration) | Ordonnancement SAFe/Lean |
| Kano Model | Basic/Performance/Excitement features | Analyse satisfaction client |
| Value vs Effort | Matrice 2x2 valeur/effort | Priorisation quotidienne |
| Buy a Feature | Stakeholders "achetent" des features | Atelier priorisation collaborative |
| Story Mapping | Cartographie activites utilisateur | Planification de release |

## Definition of Done et criteres d'acceptation

| Concept | Portee | Responsable |
|---------|--------|-------------|
| Definition of Done | Standard qualite pour tout Increment | Scrum Team (organisation) |
| Criteres d'acceptation | Conditions specifiques d'un item | Product Owner |
| Definition of Ready | Prerequis pour entrer en Sprint | Equipe (informel, non Scrum Guide) |

## Checklist Fabrice

- [ ] Vision produit definie et communiquee (Product Vision Board)
- [ ] User Story Mapping realise pour les features majeures
- [ ] Product Backlog ordonne par valeur business (pas par facilite)
- [ ] Release planning etabli avec jalons mesurables
- [ ] Analyse parties prenantes complete (besoins, attentes, influence)
- [ ] Criteres d'acceptation definis pour chaque item prioritaire
- [ ] Metriques de valeur definies (outcomes, pas outputs)
- [ ] Raffinement regulier du backlog (items du prochain sprint prets)
- [ ] Feedback stakeholders integre apres chaque Sprint Review
- [ ] Analyse concurrentielle alimentant la priorisation

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| PO = secretaire qui ecrit des specs | PO decide de l'ordre et de la valeur, pas seulement du contenu |
| Backlog = liste de souhaits infinie | Nettoyer regulierement, supprimer les items obsoletes |
| Prioriser par urgence client le plus bruyant | Utiliser des techniques objectives (WSJF, Kano, Value/Effort) |
| Pas de vision produit | Definir et partager la vision avant de remplir le backlog |
| Criteres d'acceptation absents | Chaque item prioritaire doit avoir des criteres verifiables |
| PO absent des Sprint Reviews | PO doit presenter l'Increment et collecter le feedback |
| Confondre output et outcome | Mesurer l'impact (outcome) pas le volume livre (output) |

## Application Miyukini

| Concept PSPO | Application MIP v2 |
|-------------|---------------------|
| Vision produit | P0 Temps 1-2 (Maria + Lise ideation) |
| Product Backlog | Plan exhaustif P0 Temps 7 (Denis) ordonne par priorite |
| Ordonnancement | Classification T1-T5 + priorisation dans le plan |
| Analyse concurrentielle | P0 Temps 3 (Fabrice) — audit PR, qualites/defauts, cibles |
| Stakeholder management | Profil utilisateur `.mip/environment.md` + questionnaire P5 |
| Criteres d'acceptation | Gate P4 : tests + clippy + audit securite + 0 defaut |
| Sprint Review (feedback) | P5 — test humain + verdict ACCEPTE/REFUSE |
| Metriques valeur | `.mip/metrics/` — temps, qualite, satisfaction |
| Raffinement | Checkpoints Denis /5 taches + ajustements en P3 |
| Story Mapping | Brainstorming P0 Temps 1 (5 sections Design Thinking) |

---

*Sources : Scrum Guide 2020 (Schwaber & Sutherland), Professional Scrum Product Owner (Scrum.org), Evidence-Based Management Guide*
