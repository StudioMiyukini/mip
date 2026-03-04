# Brief P0 — Certifications Agents MIP

**Date** : 2026-03-02
**Auteur** : Maria (P0 Temps 10 — Synthese)
**Classification MIP** : T4 — Feature majeure (10+ fichiers, multi-agents)
**Mode autonomie** : FULL

---

## TL;DR

Doter les 9 agents MIP de certifications industrielles reconnues pour structurer leur raisonnement. 34 certifications au total, documentees en format AI-optimise (100-150 lignes, tables, MSCM), indexees via INDEX.md pour chargement selectif.

---

## 1. Contexte (Temps 1 — Exploration)

L'equipe MIP compte 9 agents specialises mais sans ancrage formel dans des referentiels industriels. Victor (8 certs) et Hugo (2 certs) avaient des REFERENCE.md existants mais heterogenes (prose dense, pas de MSCM, 186-403 lignes). Les 7 autres agents n'avaient aucune certification documentee.

**Besoin utilisateur** : Chaque agent doit etre "forme" par ses certifications pour guider son raisonnement. Les documents doivent minimiser l'emprise sur la fenetre de contexte.

---

## 2. Inventaire (Temps 4 — Denis + Hugo)

### Etat initial

| Agent | Certifications existantes | Fichiers |
|-------|--------------------------|----------|
| Victor | 8 (ISO 27001, VP2, HDS, ISO 20000-1, NF461, NF203, NF525, CMMI) | 8 REFERENCE.md (heterogenes, pas MSCM) |
| Hugo | 2 (DevOps Foundation, AWS) | 2 REFERENCE.md (heterogenes, pas MSCM) |
| Maria, Fabrice, Denis, Francois, Lise, Arianne, George | 0 | Aucun |

### Certifications planifiees (34 total)

| Agent | Nouvelles certifications | Total |
|-------|-------------------------|-------|
| Maria | PMP (PMBOK 7), PRINCE2, PSM (Scrum), ITIL 4 | 4 |
| Fabrice | PSPO (Product Owner), Lean Startup | 2 |
| Denis | TOGAF, ISO 25010, ISO 12207 | 3 |
| Francois | ISTQB, OpenAPI 3.1 | 2 |
| Lise | WCAG 2.2, ISO 9241 | 2 |
| Arianne | ISO 9001, Six Sigma, ISO 33001 | 3 |
| George | ISO 19011, CISA, RGPD | 3 |
| Victor | +CISSP, +CEH (choix utilisateur) | 10 |
| Hugo | +CKA, +Terraform, +Docker (choix utilisateur) | 5 |

---

## 3. Specification (Temps 5-6)

### Format REFERENCE.md

- MSCM header : `@id`, `@do`, `@role`, `@layer`, `@human`
- H1 titre + TL;DR (5 lignes max)
- Identite (table : organisme, code, validite, obligation, cout)
- Exigences cles (tables, jamais de prose)
- Checklist agent (items coches)
- Anti-patterns (table : piege, consequence, solution)
- Application Miyukini (table : point, pertinence projet)
- **Cible** : 100-150 lignes par fichier

### Architecture de chargement

```
INDEX.md (114 lignes) → charge en premier, route vers le bon REFERENCE.md
REFERENCE.md (100-150 lignes) → charge a la demande, un seul a la fois
Agent .md → section "Referentiel Certifications" (10-15 lignes)
```

### Travaux sur les existants

- 10 REFERENCE.md (Victor 8 + Hugo 2) : reformater, compresser prose → tables, ajouter MSCM
- Objectif compression : >40%

---

## 4. Plan d'execution (Temps 7 — Denis)

| Lot | Taches | Agent(s) executant(s) |
|-----|--------|----------------------|
| 1 | 4 REFERENCE.md Maria + 2 Fabrice | Agent parallele 1 |
| 2 | 3 REFERENCE.md Denis + 2 Francois | Agent parallele 1 |
| 3 | 2 REFERENCE.md Lise + 3 Arianne + 3 George | Agent parallele 2 |
| 4 | 2 REFERENCE.md Victor (CISSP, CEH) + 3 Hugo (CKA, Terraform, Docker) | Agent parallele 3 |
| 5 | Reformatage 10 REFERENCE.md existants | Agent parallele 4 |
| 6 | INDEX.md master | Main thread |
| 7 | Mise a jour 9 agents .md | Main thread |
| 8 | Mise a jour docs/Les agents.md | Main thread |
| 9 | Verification finale + MEMORY.md | Main thread |

**Parallelisme** : 5 agents background simultanes (lots 1-5) + main thread (lots 6-9).

---

## 5. Decisions utilisateur

- **Mode autonomie** : FULL (autopilot complet)
- **Ajouts Victor** : CISSP + CEH (choix utilisateur)
- **Ajouts Hugo** : CKA + Terraform + Docker (choix utilisateur)

---

## 6. Risques identifies

| Risque | Mitigation |
|--------|------------|
| Race condition sur fichiers partages | Un seul agent par fichier, reformatage isole |
| Depassement 150 lignes | Template strict, review post-creation |
| Hallucination contenu certif | Sources officielles uniquement (exam guides, normes ISO) |

---

*Brief genere par Maria — P0 Temps 10 Synthese*
*Sequence : Certifications Agents MIP | Classification : T4 | Date : 2026-03-02*
