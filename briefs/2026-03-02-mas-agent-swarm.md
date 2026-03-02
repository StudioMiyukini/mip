# Brief P0 — MASS : Miyukini Agent Swarm System

<!-- @id: mass.brief -->
<!-- @do: Cadrage complet du chantier MASS — pattern de parallelisation multi-agents pour MIP v2 -->
<!-- @role: Maria (PM) -->
<!-- @layer: Protocole MIP v2 -->
<!-- @human: miyukini-user -->

## TL;DR

Chantier T5 de PROTOCOLE et DOCUMENTATION. Enrichir MIP v2 avec un pattern Agent Swarm en 3 couches (Orchestrateur DAG / Pool Workers / Merge Coordination). 12 fichiers touches, ~600 lignes, 27 taches en 7 vagues. Nouvelle Loi 9 anti-serial-collapse. Activation du flag experimental Agent Teams. Aucun code Rust.

---

## 1. Contexte

MIP v2 orchestre 9 agents de maniere largement sequentielle en P3. Quand un plan contient 20+ taches independantes, elles sont traitees une par une, meme si 5 d'entre elles pourraient s'executer en parallele. Ce "serial collapse" gaspille du temps et sous-utilise les capacites de la plateforme Claude Code.

Le chantier MASS formalise un pattern de parallelisation par DAG (Directed Acyclic Graph) avec des vagues de taches executees simultanement. Il definit trois modes de dispatch adaptes aux classes T2-T5, un protocole de merge coordination, et des metriques pour mesurer le parallelisme effectif.

## 2. Objectifs

### Objectif principal
Doter MIP v2 d'un pattern documente, reproduisible et mesurable pour paralleliser l'execution des agents en P3.

### Objectifs secondaires
- Formaliser le format DAG JSON pour la decomposition en vagues paralleles
- Definir 3 modes de dispatch (subagent burst, worktree swarm, team swarm)
- Introduire la Loi 9 anti-serial-collapse dans les Lois d'Autonomie
- Creer le template de metriques swarm
- Activer le flag experimental Agent Teams dans Claude Code
- Enrichir chaque agent avec ses responsabilites swarm

### Criteres de succes mesurables
- 12 fichiers modifies/crees conformement au plan
- Loi 9 inscrite dans CLAUDE.md
- Schema DAG JSON documente et valide
- 3 modes dispatch documentes avec regles de selection
- Protocole merge coordination documente
- Template metriques swarm cree et valide
- Flag Agent Teams active dans settings.json
- 9 agents enrichis avec responsabilites swarm
- 0 incoherence inter-fichiers (verifie par audit)

## 3. Perimetre (Scope)

### Inclus
- Enrichissement de `.cursor/skills/miyukini-mip-workflow/SKILL.md` avec section MASS (~300 lignes)
- Enrichissement de `CLAUDE.md` (Loi 9, reference MASS, Agent Teams)
- Enrichissement des 9 fichiers `.claude/agents/*.md` (responsabilites swarm)
- Modification de `.claude/settings.local.json` (flag Agent Teams)
- Creation du template `.mip/metrics/swarm-template.json`
- Schema DAG JSON (`.mip/dags/`) documente dans SKILL.md

### Exclus
- Code Rust (aucune implementation logicielle)
- Outillage CLI pour generation/visualisation de DAG (futur chantier)
- Tests automatises du pattern swarm (non testable sans execution)
- Modification du pipeline CI/CD (inexistant)

## 4. Analyse des besoins

### Besoins fonctionnels
- F1 : Format DAG JSON pour decrire les taches, dependances, vagues
- F2 : Regles de selection automatique du mode dispatch (Maria)
- F3 : Protocole merge coordination (Denis)
- F4 : Loi 9 anti-serial-collapse avec seuil quantifie (>3 taches)
- F5 : Template metriques swarm extensible
- F6 : Documentation du flag Agent Teams + fallback

### Besoins techniques
- Acces en ecriture a 12 fichiers du repository
- SKILL.md editable par sections (fichier >33k tokens)
- Settings.json Claude Code modifiable

### Besoins en ressources
- Agents : Denis (lead implementation), Francois (spec), George (audit), Hugo (config)
- Aucune ressource externe
- Aucune infrastructure supplementaire

## 5. Plan de projet

### Phases et jalons

| Phase | Description | Jalon | Dependances |
|-------|-------------|-------|-------------|
| P0 | Cadrage complet (ce brief) | Brief approuve | Reponses brainstorming |
| P3-V1 | SKILL.md fondations (4 taches paralleles) | Section MASS architecture + DAG | Aucune |
| P3-V2 | SKILL.md suite (3 taches paralleles) | Section MASS Loi 9 + metriques + integration | V1 |
| P3-V3 | CLAUDE.md + Settings (3 taches paralleles) | Loi 9 inscrite, flag active | V2 |
| P3-V4 | Agents batch 1 (5 taches paralleles) | Maria + Denis + Francois + Lise + George enrichis | V3 |
| P3-V5 | Agents batch 2 + Template (4 taches paralleles) | Arianne + Victor + Hugo enrichis, template metriques cree | V3 |
| P4 | Audit coherence + MSCM + corrections | 0 incoherence | V4 + V5 |
| P5 | Livraison et test humain | Verdict utilisateur | P4 |
| P6 | Rapport final et archivage | Memoire a jour | P5 ACCEPTE |

### Distribution des taches

| Agent | Responsabilite | Livrables |
|-------|---------------|-----------|
| Denis | Implementation principale (SKILL.md, CLAUDE.md, agents, template) | 22 fichiers modifies |
| Francois | Specification technique | Spec + schema DAG |
| George | Audit de conformite | Rapport audit |
| Hugo | Configuration Agent Teams flag | settings.json |
| Arianne | Capitalisation + rapport final | Rapport P6 |
| Maria | Cadrage + synthese + metriques | Brief, metriques |
| Victor | Analyse securite | Recommandations integrees |
| Lise | Vision graphique DAG | Representation ASCII documentee |
| Fabrice | Analyse concurrentielle | Benchmark 4 frameworks |

## 6. Risques et mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| SKILL.md trop volumineux apres ajout MASS | Moyen | Faible | TL;DR en tete de section MASS |
| Flag Agent Teams instable (experimental) | Moyen | Moyen | Documenter fallback worktree swarm |
| Incoherence SKILL.md <-> agents .md | Faible | Moyen | Tache TEST-G-01 verification croisee |
| Settings.json ecrase par update Claude | Faible | Faible | Re-activation documentee |
| Agent .md prompt injection via fichier | Faible | Eleve | Git diff review, MSCM annotations |

## 7. Budget et ressources

### Couts estimes (fourchette)

| Poste | Optimiste | Pessimiste |
|-------|-----------|------------|
| Temps total P3-P5 | 1.5h | 3h |
| Tokens LLM | ~100k | ~200k |
| Fichiers modifies | 12 | 14 (si corrections) |
| Lignes ecrites | ~550 | ~700 |

### Cout financier
Zero. Chantier purement documentaire, aucune infra, aucune dependance externe.

## 8. Contributions des agents P0

### Temps 1 — Exploration & Brainstorming (Maria)
- Classification T5 confirmee
- 21 questions administrees, 4 reponses cles : perimetre 5 livrables, mode FULL, Agent Teams oui, Loi 9 obligatoire

### Temps 2 — Ideation (Maria + Lise)
- 3 approches proposees : A (DAG inline), B (DAG JSON separe), C (Markdown semi-structure)
- Recommandation : Approche B (separation des concerns, extensible, parsable)
- Lise : representation ASCII des vagues, metriques visuelles, composants futurs

### Temps 3 — Analyse concurrentielle (Fabrice)
- 4 frameworks analyses : OpenAI Swarm, AutoGen, CrewAI, Kimi K2
- 8 differenciateurs MASS identifies
- Conclusion : aucun concurrent n'offre DAG + vagues + merge + metriques

### Temps 4 — Inventaire prerequis + Infra (Denis + Hugo)
- 5 competences, 4 outils, 11 etapes generales
- Infra : aucun impact
- 1 manquant : template metriques (a creer)

### Temps 5 — Analyse securite (Victor)
- 4 surfaces identifiees, 3 recommandations
- Niveau securite : standard
- Certifications : aucune applicable

### Temps 6 — Specification technique (Francois)
- 12 fichiers, ~600 lignes
- Schema DAG JSON defini
- 3 modes dispatch specifies
- Loi 9 formulee
- Metriques swarm definies

### Temps 7 — Plan exhaustif (Denis)
- 27 taches atomiques en 7 vagues
- Parallelisme max : 5 taches (Vague 4)
- Estimation : 2-3h

### Temps 8 — Audit faisabilite (Arianne)
- Diagnostic : CONFORME
- 0 manque critique, 4 risques mitiges

### Temps 9 — Verification CI/CD (Hugo)
- Aucune CI/CD en place, 0 impact
- Recommandation future : step validation DAG

## 9. Approche retenue

**Approche B — DAG JSON separe** avec :
- Fichier `.mip/dags/YYYY-MM-DD-<slug>.json` pour chaque sequence MIP T3+
- TL;DR du DAG (vagues + parallelisme) dans le plan `.mip/plans/`
- Schema JSON versionne, extensible

## 10. Decisions verrouillees

- D1 : Approche B (DAG JSON separe)
- D2 : Loi 9 seuil = >3 taches independantes
- D3 : 3 modes dispatch (subagent burst / worktree swarm / team swarm)
- D4 : Denis = Merge Coordinator (pas Maria)
- D5 : Flag Agent Teams active en experimental
- D6 : Metriques swarm dans le JSON metriques existant (pas de fichier separe)
- D7 : Fallback worktree swarm si Agent Teams non dispo

## 11. Mode d'autonomie

**FULL** — Autopilot complet (P3 a P6 automatique, seul P5 = test humain).

---

*Brief genere le 2026-03-02 par Maria (Chef de Projet MIP v2).*
*Chantier MASS — Miyukini Agent Swarm System — Classe T5.*
