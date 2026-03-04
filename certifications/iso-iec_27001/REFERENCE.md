<!-- @id cert.victor.iso_27001 -->
<!-- @do provide_iso_27001_reference_knowledge -->
<!-- @role security -->
<!-- @layer reference -->
<!-- @human Referentiel ISO/IEC 27001:2022 pour Victor -->

# ISO/IEC 27001:2022 — Reference Victor

**TL;DR** : Norme certifiable pour les SMSI (Systeme de Management de la Securite de l'Information). 7 clauses d'exigences (4-10), 93 mesures Annexe A en 4 themes. Triade CIA. Certification 3 ans, audit annuel. Prerequis pour HDS.

**Edition** : 3e, octobre 2022 | **Organisme** : ISO/IEC JTC 1/SC 27 | **Validite** : 3 ans (suivi annuel)
**Obligation** : Volontaire (prerequis HDS, souvent exige contractuellement) | **Prerequis** : Aucun (ISO 27002 = guide associe)

---

## 1. Domaine d'application

Exigences pour etablir, implementer, maintenir et ameliorer un SMSI. Generique, toute organisation. Aucune exclusion des clauses 4-10. **Triade CIA** : Confidentialite, Integrite, Disponibilite.

---

## 2. Structure normative (Clauses 4-10)

| Clause | Ref | Exigence | Points cles |
|--------|-----|----------|-------------|
| **4 Contexte** | 4.1 | Contexte organisation | Enjeux externes/internes, mission |
| | 4.2 | Parties interessees | Exigences legales, reglementaires, contractuelles |
| | 4.3 | Domaine d'application | Limites, applicabilite. **Doc obligatoire** |
| | 4.4 | SMSI | Etablir, implementer, maintenir, ameliorer |
| **5 Leadership** | 5.1 | Engagement direction | Politique + objectifs alignes strategie, ressources, amelioration continue |
| | 5.2 | Politique | Appropriee, inclut objectifs SI. **Documentee, communiquee, disponible** |
| | 5.3 | Roles | Attribues et communiques. Conformite + reporting |
| **6 Planification** | 6.1.2 | Appreciation risques SI | Criteres, identifier risques (perte CIA) + proprietaires, analyser, evaluer. **Doc obligatoire** |
| | 6.1.3 | Traitement risques SI | Options, mesures, comparer Annexe A, **DdA** (Declaration d'Applicabilite), plan. **Doc obligatoire** |
| | 6.2 | Objectifs SI | Mesurables, surveilles, communiques. **Doc obligatoire** |
| | 6.3 | Modifications | Modifications planifiees |
| **7 Support** | 7.1-7.4 | Ressources, Competences, Sensibilisation, Communication | Determiner, fournir, documenter preuves competence |
| | 7.5 | Documentation | Creation, mise a jour, controle (disponibilite, protection, conservation) |
| **8 Fonctionnement** | 8.1 | Controle operationnel | Planifier, controler processus, processus externalises |
| | 8.2-8.3 | Appreciation + Traitement risques | A intervalles planifies ou si changement. **Doc resultats** |
| **9 Performance** | 9.1 | Surveillance, mesure | Methodes comparables et reproductibles. **Doc resultats** |
| | 9.2 | Audit interne | Programme, frequence, criteres, objectivite. **Doc programme + resultats** |
| | 9.3 | Revue de direction | Elements entree/sortie, decisions amelioration. **Doc resultats** |
| **10 Amelioration** | 10.1 | Amelioration continue | Pertinence, adequation, efficacite |
| | 10.2 | Non-conformite | Reagir, evaluer causes, actions correctives. **Doc nature NC + actions + resultats** |

---

## 3. Annexe A — 93 Mesures de securite

Derivees de ISO 27002:2022. Utilisees dans le contexte de 6.1.3 (traitement des risques).

| Theme | Nb | Mesures prioritaires (exemples) |
|-------|----|---------------------------------|
| **5 Organisationnelles** | 37 | 5.1 Politiques SI, 5.9 Inventaire actifs, 5.15 Controle d'acces, 5.24 Gestion incidents, 5.31 Exigences legales, 5.34 Protection DCP |
| **6 Personnes** | 8 | 6.1 Selection, 6.3 Sensibilisation/formation, 6.6 Accords confidentialite, 6.8 Signalement evenements |
| **7 Physiques** | 14 | 7.1 Perimetres securite, 7.2 Acces physique, 7.10 Supports stockage, 7.13 Maintenance |
| **8 Technologiques** | 34 | 8.2 Droits privileges, 8.5 Authentification, 8.7 Anti-malware, 8.8 Gestion vulns, 8.9 Config, 8.13 Sauvegardes, 8.15 Journalisation, 8.24 Crypto, 8.25 SDLC securise, 8.28 Codage securise, 8.31 Separation envs |

---

## 4. Certification

| Etape | Description |
|-------|-------------|
| 1 | Decision et perimetre par la direction |
| 2 | Mise en oeuvre SMSI (clauses 4-10 + Annexe A) |
| 3 | Audit interne |
| 4 | Revue de direction |
| 5 | Choix organisme certificateur (accredite COFRAC) |
| 6 | **Audit Phase 1** — Revue documentaire |
| 7 | **Audit Phase 2** — Audit sur site |
| 8 | Decision de certification |
| 9 | Suivi annuel (annees 1 et 2) |
| 10 | Renouvellement tous les 3 ans |

**Duree** : PME 6-12 mois (audit 2-3j) | ETI 12-18 mois (5-8j) | Grande 18-24 mois (10-20j)

---

## 5. Documents obligatoires

| Document | Clause |
|----------|--------|
| Domaine d'application SMSI | 4.3 |
| Politique SI | 5.2 |
| Processus appreciation risques | 6.1.2 |
| Processus traitement risques + DdA + Plan | 6.1.3 |
| Objectifs SI | 6.2 |
| Preuves de competence | 7.2 |
| Resultats appreciation/traitement risques | 8.2, 8.3 |
| Preuves surveillance/mesure | 9.1 |
| Programme audit interne + resultats | 9.2 |
| Resultats revues de direction | 9.3 |
| NC + actions correctives | 10.2 |

---

## 6. Non-conformites courantes

**Majeures (bloquantes)** : Absence analyse risques, pas de DdA, direction non impliquee, pas d'audit interne, mesures Annexe A exclues sans justification, pas de gestion incidents (5.24-5.27), pas de plan continuite (5.29-5.30).

**Mineures** : Politique non communiquee, objectifs non mesurables, indicateurs non exploites, sensibilisation insuffisante, inventaire actifs incomplet, droits non revus, sauvegardes non testees, logs non analyses, changements informels, clauses SI absentes contrats fournisseurs.

---

## 7. Normes liees

| Norme | Relation |
|-------|----------|
| ISO 27002:2022 | 93 mesures Annexe A en proviennent |
| ISO 27003/27004/27005 | Implementation, indicateurs, gestion risques |
| ISO 31000 | Management des risques (reference) |
| ISO 9001 | Structure HLS identique |
| ISO 22301 | Continuite d'activite (mesures 5.29, 5.30) |
| ISO 20000-1 | Gestion services IT, souvent combine |
| HDS | **Prerequis ISO 27001** |
| RGPD | ISO 27001 couvre les exigences techniques (mesure 5.34) |

---

## 8. Checklist Victor

**SMSI (4-10)** : [ ] 4.1-4.3 Contexte/parties/perimetre documentes [ ] 5.1-5.3 Direction engagee, politique, roles [ ] 6.1.2-6.1.3 Risques apprecies, DdA produite [ ] 6.2 Objectifs mesurables [ ] 7.1-7.5 Ressources, competences, documentation [ ] 8.1-8.3 Processus controles, risques traites [ ] 9.1-9.3 Surveillance, audits, revues direction [ ] 10.1-10.2 Amelioration, NC traitees

**Annexe A (echantillonnage)** : [ ] 5.1/5.9/5.15/5.24/5.31 Organisationnelles [ ] 6.1/6.3/6.6 Personnes [ ] 7.1/7.2/7.13 Physiques [ ] 8.2/8.5/8.7/8.8/8.9/8.13/8.15/8.24/8.25/8.28/8.31 Technologiques

---

## 9. Application Miyukini

| Mesure | Pertinence projet |
|--------|-------------------|
| 5.9 | Inventaire crates, assets, configs — `Cargo.toml`, `mge/assets/` |
| 5.15 | Controle d'acces : auth MiyuCloud, sessions utilisateur |
| 5.34 | Protection DCP : donnees utilisateur KindMother, MiyuCloud |
| 8.4 | Acces code source : Git, permissions, branches protegees |
| 8.5 | Auth : MiyuCloud passphrase, MiyuVoice wakeword |
| 8.8 | Vulns : `cargo audit`, deps, CVE tracking |
| 8.9 | Config : `unsafe_code = "forbid"`, clippy pedantic, feature flags |
| 8.12 | DLP : pas de secrets hardcodes, pas de logs donnees sensibles |
| 8.13 | Sauvegarde : KindMother DB, saves Sodomight, chunks MiyuCloud |
| 8.15 | Journalisation : logs structures, pas de donnees sensibles |
| 8.24 | Crypto : ChaCha20-Poly1305, Argon2id, X25519 (MiyuCloud) |
| 8.25 | SDLC : MIP v2 (TDD, P4 audit, P3 checkpoints) |
| 8.28 | Codage securise : pas de `unwrap()`, pas d'injection, OWASP |
| 8.29 | Tests securite : injection, fuzzing, brute force (Victor P4) |
| 8.31 | Separation envs : dev/staging/prod (Hugo CI/CD) |

---

*Sources : ISO/IEC 27001:2022, Guide PME DIGITAL SME, UTC Sorbonne Master QPO, Lacombe & Lesage (ENI)*
