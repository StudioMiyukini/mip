<!-- @id cert.victor.iso_20000 -->
<!-- @do provide_iso_20000_reference_knowledge -->
<!-- @role service_management -->
<!-- @layer reference -->
<!-- @human Referentiel ISO/IEC 20000-1:2018 pour Victor -->

# ISO/IEC 20000-1:2018 — Reference Victor

**TL;DR** : Norme certifiable pour les SMS (Systeme de Management des Services IT). Structure HLS (clauses 4-10) + clause 8 detaillee (portefeuille, SLA, incidents, changements, continuite). ITIL = bonnes pratiques associees. Validite 3 ans.

**Edition** : 3e, 2018 (Amdt 1:2024 Climate) | **Organisme** : ISO/IEC JTC 1/SC 40 | **Validite** : 3 ans (suivi annuel)
**Obligation** : Volontaire (souvent exige contractuellement) | **Prerequis** : Aucun (ITIL = guide associe)

---

## 1. Domaine d'application

Exigences pour etablir, implementer, maintenir et ameliorer un SMS. Toute organisation fournissant des services IT (internes ou externes).

---

## 2. Structure normative (Clauses 4-10)

| Clause | Ref | Exigence |
|--------|-----|----------|
| **4 Contexte** | 4.1-4.4 | Contexte, parties interessees, perimetre SMS, SMS |
| **5 Leadership** | 5.1-5.3 | Engagement direction, politique services, roles (proprietaire service, gestionnaire processus) |
| **6 Planification** | 6.1-6.3 | Risques/opportunites, objectifs mesurables, plan gestion services |
| **7 Support** | 7.1-7.6 | Ressources, competences, sensibilisation, communication, documentation, **connaissances** |
| **8 Fonctionnement** | | *Voir detail ci-dessous* |
| **9 Performance** | 9.1-9.4 | Surveillance/mesure, audit interne, revue direction, **reporting services** |
| **10 Amelioration** | 10.1-10.2 | NC/actions correctives, amelioration continue |

### Clause 8 — Fonctionnement (detail)

| Sous-clause | Domaine | Exigences cles |
|-------------|---------|----------------|
| 8.2 | Portefeuille de services | Fourniture, planification, parties, **catalogue**, actifs, **CMDB** |
| 8.3 | Relations et accords | Relations affaires, **SLA/SLM**, fournisseurs |
| 8.4 | Offre et demande | Budget, demande, capacite |
| 8.5 | Conception et transition | **Gestion changements** (politique, CAB), conception/transition, mises en production |
| 8.6 | Resolution | **Incidents** (classification, escalade), demandes, **problemes** (causes racines) |
| 8.7 | Assurance | Disponibilite, **continuite**, securite de l'information |

---

## 3. Documents obligatoires

| Document | Clause |
|----------|--------|
| Perimetre SMS | 4.3 |
| Politique gestion services | 5.2 |
| Plan gestion services | 6.3 |
| Evaluation risques + plan traitement | 6.1 |
| Objectifs gestion services | 6.2 |
| Preuves competence | 7.2 |
| Catalogue de services | 8.2.4 |
| CMDB | 8.2.6 |
| SLA | 8.3.3 |
| Politique gestion changements | 8.5.1 |
| Registre incidents + procedure incident majeur | 8.6.1 |
| Plan continuite services | 8.7.2 |
| Politique securite information | 8.7.3 |
| Rapports de service | 9.4 |
| Programme + resultats audit interne | 9.2 |
| Resultats revues direction | 9.3 |
| Registre NC + actions correctives | 10.1 |

---

## 4. Certification

| Etape | Duree indicative |
|-------|-----------------|
| Preparation (mise en place SMS) | 6-18 mois |
| Audit Phase 1 (documentaire) | 1-2 jours |
| Audit Phase 2 (sur site) | 3-5 jours |
| Decision de certification | — |
| Suivi annuel | 1-2 jours |
| Renouvellement | Tous les 3 ans |

---

## 5. Normes liees

| Norme | Relation |
|-------|----------|
| ITIL 4 | Bonnes pratiques (ISO 20000 = certifiable, ITIL non) |
| ISO 9001 | Structure HLS identique, souvent combine |
| ISO 27001 | Securite info (clause 8.7.3). ISO 27013 = guide integration |
| COBIT | Gouvernance IT (complementaire) |
| HDS | HDS v1 referencait ISO 20000. HDS v2 integre directement |

---

## 6. Non-conformites courantes

Documentation incomplete, roles non definis (proprietaire service absent), catalogue absent/incomplet, CMDB non maintenue, SLA non formalises/mesures, gestion changements informelle (pas de CAB), classification incidents absente, pas de procedure incident majeur, amelioration non demontree, reporting service absent.

---

## 7. Checklist Victor

**SMS (4-10)** : [ ] Perimetre defini [ ] Politique documentee/communiquee [ ] Plan gestion services [ ] Connaissances gerees
**Portefeuille (8.2)** : [ ] Catalogue publie/maintenu [ ] CMDB implementee/a jour
**Relations (8.3)** : [ ] SLA definis/mesures/rapportes [ ] Fournisseurs geres
**Changements (8.5)** : [ ] Politique appliquee [ ] Mises en production formalisees
**Incidents (8.6)** : [ ] Classification + escalade [ ] Problemes (causes racines)
**Assurance (8.7)** : [ ] Disponibilite mesuree [ ] Continuite testee [ ] Politique securite
**Performance (9)** : [ ] Audits internes [ ] Revues direction [ ] Rapports service periodiques

---

## 8. Application Miyukini

| Point | Pertinence projet |
|-------|-------------------|
| Catalogue | 12 services enregistres dans Central |
| SLA | Temps reponse, disponibilite, performance services |
| Incidents | Gestion bugs, crashes, erreurs service |
| Changements | MIP v2 couvre deja la gestion changements (P3-P5) |
| Configuration | Cargo.toml, feature flags, configs par service |
| Continuite | LOI-2 (isolement = etat normal) garantit continuite sans reseau |

---

*Sources : ISO/IEC 20000-1:2018, ISO/IEC 20000-2:2019, ITIL 4, ISO/IEC 27013*
