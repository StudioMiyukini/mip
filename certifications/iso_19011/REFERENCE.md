<!-- @id cert.george.iso_19011 -->
<!-- @do provide_iso19011_reference_knowledge -->
<!-- @role audit_methodology -->
<!-- @layer reference -->
<!-- @human Referentiel ISO 19011 pour George -->

# ISO 19011:2018 -- Referentiel George

> **TL;DR** : Lignes directrices pour l'audit des systemes de management (qualite, securite, environnement, etc.).
> Definit les principes, la gestion du programme d'audit et la conduite des audits.
> Impact Miyukini : structure les audits P4 de George, garantit rigueur et independance.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ISO (International Organization for Standardization) |
| Obligation | Recommandation (guide, pas exigence certifiable) |
| Validite | Edition 2018 en vigueur (remplace 2011) |
| Prerequis | Connaissance du systeme de management audite |

## Domaine d'application

Applicable a l'audit interne et externe de tout systeme de management (ISO 9001, 14001, 27001, 45001, etc.). Couvre la planification, la realisation et le suivi des audits. Ne couvre pas les audits financiers ou reglementaires specifiques.

## 7 principes de l'audit

| # | Principe | Description |
|---|----------|-------------|
| 1 | Integrite | Honnetete, diligence, responsabilite |
| 2 | Presentation impartiale | Rapporter fidelement et avec exactitude |
| 3 | Conscience professionnelle | Rigueur et jugement dans l'audit |
| 4 | Confidentialite | Protection des informations obtenues |
| 5 | Independance | Objectivite, absence de biais et conflits d'interet |
| 6 | Approche fondee sur les preuves | Conclusions basees sur des preuves verifiables |
| 7 | Approche par les risques | Concentrer l'effort sur les enjeux significatifs |

## Programme d'audit (clause 5)

| Etape | Action | Responsable |
|-------|--------|-------------|
| 5.1 | Etablir les objectifs du programme | Direction / Responsable programme |
| 5.2 | Determiner les risques et opportunites | Responsable programme |
| 5.3 | Etablir le programme (frequence, perimetre, ressources) | Responsable programme |
| 5.4 | Mettre en oeuvre le programme | Responsable programme + equipe |
| 5.5 | Surveiller le programme | Responsable programme |
| 5.6 | Revoir et ameliorer le programme | Direction |

## Activites d'audit (clause 6)

| Etape | Activite | Livrables |
|-------|----------|-----------|
| 6.2 | Declenchement de l'audit | Objectifs, perimetre, criteres definis |
| 6.3 | Preparation | Plan d'audit, check-lists, attribution des taches |
| 6.4.2 | Reunion d'ouverture | Confirmation plan, methodes, communication |
| 6.4.3 | Revue documentaire | Examen des informations documentees |
| 6.4.4 | Communication pendant l'audit | Points d'avancement, problemes identifies |
| 6.4.5 | Collecte de preuves | Entretiens, observation, examen de documents |
| 6.4.6 | Production des constatations | Conformites, non-conformites, opportunites |
| 6.4.7 | Determination des conclusions | Synthese, recommandations, niveau de confiance |
| 6.4.8 | Reunion de cloture | Presentation des constatations et conclusions |
| 6.5 | Preparation et diffusion du rapport | Rapport d'audit complet |
| 6.6 | Cloture de l'audit | Archivage, confidentialite, retour d'experience |
| 6.7 | Suivi de l'audit | Verification des actions correctives |

## Types de constatations

| Type | Definition | Action requise |
|------|------------|----------------|
| Conformite | Satisfaction d'une exigence | Aucune (point fort possible) |
| Non-conformite majeure | Defaillance du systeme, risque eleve | Action corrective obligatoire + verification |
| Non-conformite mineure | Ecart ponctuel, risque faible | Action corrective recommandee |
| Opportunite d'amelioration | Suggestion, pas un ecart | Prise en compte facultative |
| Point fort | Bonne pratique notable | Capitalisation recommandee |

## Competences de l'auditeur (clause 7)

| Competence | Description |
|------------|-------------|
| Connaissances techniques | Maitrise du referentiel audite |
| Pensee analytique | Capacite a evaluer des preuves complexes |
| Communication | Ecoute active, questionnement, synthese |
| Jugement | Evaluation du niveau de risque et de gravite |
| Independance | Pas d'audit de son propre travail |

## Checklist George

- [ ] Programme d'audit annuel defini et approuve
- [ ] Plan d'audit prepare (objectifs, perimetre, criteres, calendrier)
- [ ] Reunion d'ouverture conduite (participants, regles, agenda)
- [ ] Preuves d'audit collectees (documents, entretiens, observations)
- [ ] Constatations d'audit formalisees (conformite/non-conformite/OA)
- [ ] Reunion de cloture conduite (presentation constatations)
- [ ] Rapport d'audit redige et diffuse
- [ ] Actions de suivi tracees et verifiees (efficacite confirmee)

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Auditer sans plan ni criteres definis | Toujours preparer plan d'audit avec objectifs et perimetre |
| Constatations basees sur des impressions | Chaque constatation doit etre tracable a une preuve |
| Rapport d'audit vague ou trop general | Constatations specifiques : ref exigence + preuve + ecart |
| Pas de suivi des actions correctives | Planifier la verification d'efficacite dans le programme |
| Auditeur non independant du domaine audite | Garantir l'absence de conflit d'interet (principe 5) |
| Reunion de cloture escamotee | Toujours presenter les constatations avant le rapport ecrit |

## Application Miyukini

| Concept ISO 19011 | Implementation COG |
|--------------------|--------------------|
| Programme d'audit | P4 systematique a chaque livraison MIP |
| Criteres d'audit | CLAUDE.md, Lois d'Autonomie, regles clippy, MSCM |
| Preuves d'audit | Code, tests, `.mip/metrics/`, rapports, commits |
| Constatations | Score /100 George (P4), defauts bloquants/mineurs |
| Rapport d'audit | `.mip/audits/` artefacts |
| Suivi | Boucle MIP si refus P5, capitalisation P6 |
| Independance | George n'implemente pas (Francois/Lise implementent) |
| Approche par les risques | Victor (securite) + George (conformite) en parallele P4 |
