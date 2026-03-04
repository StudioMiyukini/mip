<!-- @id cert.george.cisa -->
<!-- @do provide_cisa_reference_knowledge -->
<!-- @role is_audit -->
<!-- @layer reference -->
<!-- @human Referentiel CISA pour George -->

# CISA -- Referentiel George

> **TL;DR** : Certification internationale d'audit des systemes d'information delivree par ISACA.
> Couvre 5 domaines : audit SI, gouvernance IT, acquisition/developpement, operations, protection des actifs.
> Impact Miyukini : structure les audits techniques de George sur le code, l'infra et la securite.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ISACA (Information Systems Audit and Control Association) |
| Obligation | Volontaire — standard de reference pour les auditeurs SI |
| Validite | Certification continue (20 CPE/an, 120 CPE sur 3 ans) |
| Prerequis | 5 ans d'experience en audit/controle/securite SI (substitutions possibles) |

## Domaine d'application

Audit et controle des systemes d'information dans toute organisation. Couvre la gouvernance IT, le cycle de developpement, les operations, la resilience et la protection des actifs informationnels.

## 5 domaines CISA

| Domaine | Titre | Poids examen |
|---------|-------|-------------|
| 1 | Processus d'audit des SI | 21% |
| 2 | Gouvernance et gestion des IT | 17% |
| 3 | Acquisition, developpement et implementation des SI | 12% |
| 4 | Operations, maintenance et gestion des services IT | 23% |
| 5 | Protection des actifs informationnels | 27% |

## Domaine 1 — Processus d'audit des SI

| Ref | Exigence | Detail |
|-----|----------|--------|
| 1.1 | Planification basee sur les risques | Prioriser les controles selon le niveau de risque |
| 1.2 | Standards d'audit | ISACA ITAF, normes et directives d'audit SI |
| 1.3 | Types de preuves | Physiques, documentaires, analytiques, testimoniales |
| 1.4 | Echantillonnage | Statistique ou discretionnaire selon le contexte |
| 1.5 | Techniques d'audit | CAAT (Computer-Assisted Audit Techniques), revue de code |
| 1.6 | Communication des resultats | Rapport structure, recommandations, plan d'action |

## Domaine 2 — Gouvernance et gestion des IT

| Ref | Exigence | Detail |
|-----|----------|--------|
| 2.1 | Cadres de gouvernance IT | COBIT 2019, ITIL, ISO 38500 |
| 2.2 | Alignement strategique | IT supporte les objectifs metier |
| 2.3 | Gestion des risques IT | Identification, evaluation, traitement, suivi |
| 2.4 | Gestion des ressources | Budget, competences, infrastructure |
| 2.5 | Mesure de la performance | KPI, KGI, tableaux de bord |

## Domaine 3 — Acquisition, developpement et implementation

| Ref | Exigence | Detail |
|-----|----------|--------|
| 3.1 | Gestion du cycle de vie (SDLC) | Exigences, conception, dev, test, deploiement |
| 3.2 | Controles d'application | Entree, traitement, sortie, autorisation |
| 3.3 | Gestion du changement | Processus formel, approbation, retour arriere |
| 3.4 | Tests et recette | Unitaire, integration, systeme, acceptation |
| 3.5 | Migration de donnees | Integrite, completude, verification post-migration |

## Domaine 4 — Operations et resilience

| Ref | Exigence | Detail |
|-----|----------|--------|
| 4.1 | Gestion des services IT | SLA, gestion des incidents, problemes, changements |
| 4.2 | Gestion des actifs | Inventaire, configuration, licences |
| 4.3 | Plan de continuite (BCP/DRP) | RTO, RPO, tests de reprise, sites de secours |
| 4.4 | Gestion de la capacite | Surveillance, planification, evolutivite |
| 4.5 | Gestion des incidents | Detection, reponse, escalade, retour d'experience |

## Domaine 5 — Protection des actifs informationnels

| Ref | Exigence | Detail |
|-----|----------|--------|
| 5.1 | Politique de securite | Cadre, roles, responsabilites, communication |
| 5.2 | Controle d'acces | Identification, authentification, autorisation |
| 5.3 | Securite reseau | Pare-feu, IDS/IPS, segmentation, chiffrement |
| 5.4 | Securite des donnees | Classification, chiffrement, DLP, anonymisation |
| 5.5 | Securite physique | Acces physique, surveillance, protection environnementale |
| 5.6 | Gestion des vulnerabilites | Scan, patch management, test de penetration |

## Approche d'audit basee sur les risques

| Etape | Action | Livrable |
|-------|--------|----------|
| 1 | Comprehension du contexte | Cartographie SI, parties prenantes |
| 2 | Evaluation des risques | Matrice risques (probabilite x impact) |
| 3 | Definition du perimetre | Processus/systemes a risque eleve |
| 4 | Evaluation des controles | Tests de conformite + tests substantifs |
| 5 | Documentation des preuves | Preuves tracables, reproductibles |
| 6 | Opinion d'audit | Conclusion sur l'efficacite des controles |
| 7 | Suivi | Verification de la mise en oeuvre des recommandations |

## Checklist George

- [ ] Charte d'audit definie (mandat, autorite, perimetre)
- [ ] Evaluation des risques IT documentee (matrice)
- [ ] Perimetre d'audit defini (systemes, processus, controles)
- [ ] Evaluation des controles effectuee (conformite + substantif)
- [ ] Verification de conformite (normes, politiques, reglementations)
- [ ] Preuves d'audit documentees et tracables
- [ ] Opinion d'audit formalisee (adequation des controles)
- [ ] Suivi des reponses de la direction aux recommandations

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Audit sans evaluation prealable des risques | Toujours prioriser par le risque (domaine 1.1) |
| Se fier uniquement aux declarations verbales | Corroborer par des preuves documentaires ou techniques |
| Ignorer les controles compensatoires | Evaluer l'ensemble du dispositif de controle |
| Rapport sans recommandations actionnables | Chaque constatation doit avoir une recommandation concrete |
| Pas de suivi des audits precedents | Verifier la cloture des actions anterieures |

## Application Miyukini

| Concept CISA | Implementation COG |
|--------------|--------------------|
| Audit base sur les risques | George priorise les audits P4 par criticite |
| Gouvernance IT | Pyramide COG, Lois d'Autonomie, strates 0-9 |
| SDLC | MIP v2 (P0 cadrage → P3 TDD → P4 audit → P5 livraison) |
| Controles d'application | Tests unitaires, clippy, MSCM, gates |
| Protection des actifs | Victor (securite /100), chiffrement MiyuCloud |
| Gestion du changement | Git workflow, feature branches, gates P0/P5 |
| Preuves d'audit | `.mip/audits/`, `.mip/metrics/`, rapports P6 |
| BCP/DRP | LOI-1 (zero dep externe), LOI-2 (isolement normal) |
