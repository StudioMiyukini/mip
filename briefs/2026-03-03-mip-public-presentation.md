# Brief P0 — MIP & MSCM : Presentation publique et distribution

**TL;DR** : Creer une page web /mip sur Origin presentant MIP v2 et MSCM, et un repo GitHub public `StudioMiyukini/mip` pour distribution et installation facile par une IA. Classification T3, 7 taches, 2 livrables.

---

## Metadata

| Champ | Valeur |
|-------|--------|
| Date | 2026-03-03 |
| Slug | `mip-public-presentation` |
| Classification | T3 (feature moderee, 3-10 fichiers) |
| Phases | P0 -> P3 -> P4 -> P5 -> P6 |
| Mode autonomie | A confirmer |
| Demandeur | Utilisateur |
| Classifie par | Maria |

---

## Contexte

Le protocole MIP v2 (Miyukini Implementation Protocol) et le systeme MSCM (Miyukini Semantic Code Markup) sont des systemes matures internes au projet Miyukini COG. L'objectif est de les rendre publics pour :
1. Permettre a d'autres developpeurs/IA de les adopter
2. Positionner Miyukini dans l'ecosysteme des protocoles AI-assisted development
3. Fournir une installation simple pour les outils IA (Claude Code, Cursor, etc.)

---

## Livrable 1 : Page Origin `/mip`

**Route** : `GET /mip` sur le serveur web Origin (port 8080)

### UX : Deux parcours d'onboarding

La page propose deux parcours au visiteur (pattern VN Miou existant sur la home page) :

**Parcours "Immersif" (Miou)** :
- Overlay VN fullscreen avec Miou (cerisier 🌸) qui guide
- Miou explique MIP et MSCM de facon interactive et ludique
- Dialogues etape par etape avec choix du visiteur
- Ton : accessible, pedagogique, avec des metaphores (ex: "MIP c'est comme un chef d'orchestre pour ton equipe IA")
- Sequence : Intro -> Qu'est-ce que MIP? -> Qu'est-ce que MSCM? -> Comment ca marche? -> Comparaison -> Installation -> Conclusion
- Bouton "Skip" pour basculer vers le parcours dev

**Parcours "Dev" (direct)** :
- Contenu technique classique (sections HTML scrollables)
- Acces immediat a toute l'information
- Optimise pour les developpeurs qui veulent comprendre vite et installer
- Table des matieres cliquable en sidebar

### Contenu detaille (partage entre les deux parcours)

#### Qu'est-ce que MIP v2 ?
- **Definition** : Miyukini Implementation Protocol v2 — protocole universel de gouvernance du developpement assiste par IA
- **Philosophie** : Structurer le chaos de l'IA coding avec des phases, des agents specialises et des quality gates
- **Stack-agnostique** : Le noyau (classification, phases, gates, agents) est invariant. La config projet s'adapte
- **10 agents nommes** : Maria (PM), Denis (Lead Dev), Francois (Back), Lise (Front), Arianne (QA), George (Audit), Victor (Securite), Hugo (DevOps), Jean (Efficience IA), Fabrice (Analyste PR)
- **5 classes de taches** : T1 (micro-fix) -> T5 (chantier strategique), avec routing automatique vers les bonnes phases
- **7 phases** : SETUP -> P0 (cadrage) -> P3 (TDD parallele) -> P4 (audit) -> P5 (livraison) -> P6 (rapport)
- **3 modes d'autonomie** : FULL, BIG_STEPS, GUIDED
- **MASS** : Miyukini Agent Swarm System — parallelisation par DAG de dependances
- **Metriques zero-estimation** : Valeurs mesurees uniquement, jamais d'approximation dans les rapports

#### Qu'est-ce que MSCM ?
- **Definition** : Miyukini Semantic Code Markup — balisage semantique du code source pour la gouvernance IA
- **5 annotations** : `@id` (identifiant unique), `@do` (description fonctionnelle), `@role` (role semantique), `@layer` (couche architecturale), `@human` (description humaine)
- **MSCM Index** : 10 fichiers JSON generes automatiquement (blocks, hierarchy, graph, flows, domains, layers, dependencies, files, stats, registry)
- **Objectif** : Permettre a l'IA de raisonner sur la structure du code, valider l'integrite, effectuer du refactoring sur
- **1578 blocs** indexes dans le codebase Miyukini COG actuel
- **Integration MWS** : Phase B de verification utilise les blocs MSCM pour prouver l'integrite du code

#### Generalites
- Lien vers le repo GitHub `StudioMiyukini/mip`
- Lien vers la documentation complete
- Contexte : ne dans le projet Miyukini COG (Rust/Dioxus), mais applicable a tout projet

#### Concurrents (tableau comparatif)
BMAD, Cursor Rules, CLAUDE.md (Anthropic), Aider, Windsurf, AGENTS.md (OpenAI/Linux Foundation), MetaGPT, CrewAI

#### Avantages et inconvenients
- **Forces** : seul protocole combinant lifecycle complet + agents non-dev + metriques + parallelisation DAG + securite dediee
- **Faiblesses** : couple Claude Code, courbe apprentissage, overhead T1/T2, CLAUDE.md > 200 lignes, pas de communaute publique

#### Guide d'utilisation
- Phase SETUP (6 etapes, une seule fois)
- Lancer un projet : classification -> P0 -> execution -> livraison
- Commandes cles
- Exemples concrets

#### Conclusion
- Vision : standardiser la gouvernance IA dans le developpement logiciel
- Call-to-action : installer MIP depuis le repo GitHub

### Fichiers modifies

- `apps/origin/src/web/pages.rs` — Ajouter `pub fn mip_page() -> String` (page complete avec VN + contenu dev)
- `apps/origin/src/web/server.rs` — Ajouter route `"/mip"` dans le match
- `apps/origin/src/web/pages.rs` (layout) — Ajouter lien "MIP" dans la navigation

---

## Livrable 2 : Repo GitHub `StudioMiyukini/mip`

**Organisation** : StudioMiyukini | **Repo** : mip | **Visibilite** : public | **Licence** : Apache-2.0

### Structure du repo

```
StudioMiyukini/mip/
+-- README.md                    # Exhaustif : intro, install, usage, architecture, concurrents
+-- LICENSE                      # Apache-2.0
+-- SKILL.md                     # Protocole MIP v2 principal
+-- modules/
|   +-- setup.md                 # Phase SETUP (6 etapes)
|   +-- p0-details.md            # P0 complet (10 temps)
|   +-- p3-execution.md          # P3 TDD parallel
|   +-- p4-p5-p6.md              # P4 audit, P5 livraison, P6 rapport
|   +-- mass.md                  # MASS Agent Swarm System
|   +-- metrics.md               # Metriques et horodatage
|   +-- tools-reference.md       # 25+ outils IA supportes
+-- templates/
|   +-- CLAUDE.md.template       # Template CLAUDE.md avec section MIP
|   +-- swarm-template.json      # Template metriques MASS
+-- mscm/
|   +-- MSCM.md                  # Documentation MSCM complete
|   +-- examples/                # Exemples d'annotations
+-- .cursorrules                 # Pour installation directe dans Cursor
```

### README.md — Sections

1. Badges + one-liner
2. Qu'est-ce que MIP v2 ?
3. Qu'est-ce que MSCM ?
4. Quick Start (installation en 3 commandes)
5. Architecture (phases, agents, classification)
6. Comparaison avec les alternatives
7. Guide complet d'utilisation
8. Configuration avancee
9. Contribuer
10. Licence

---

## Analyse concurrentielle (Fabrice)

### Vue d'ensemble des concurrents

| # | Framework | Createur | Stars GitHub | Type | Approche |
|---|-----------|----------|-------------|------|----------|
| 1 | **BMAD Method** | bmad-code-org | ~2k | Framework Agile IA | 4 phases, 8+ personas, SOPs encode dans les prompts |
| 2 | **GitHub Spec Kit** | GitHub (Den Delimarsky) | ~73.5k | Spec-driven dev | Constitution + 4 phases (Specify/Plan/Tasks/Implement) |
| 3 | **OpenSpec** | Fission-AI | ~27.1k | Spec-driven leger | 3 etapes fluides (Propose/Apply/Archive), delta specs |
| 4 | **AWS Kiro** | Amazon/AWS | N/A (IDE proprio) | IDE agentique | Spec-driven IDE (Requirements/Design/Tasks), Agent Hooks |
| 5 | **Get Shit Done (GSD)** | Lex Christopherson (TACHES) | ~23.6k | Meta-prompting + vagues | Context engineering, vagues paralleles, commits atomiques |
| 6 | **Claude Task Master** | Eyal Toledano | ~15.5k | Gestionnaire de taches | PRD -> taches structurees, MCP, 10+ providers IA |
| 7 | **Better Agents** | LangWatch | ~1.5k | Standards + scaffolding | Testing Pyramid, prompt versioning, AGENTS.md |

### Matrice comparative detaillee

| Dimension | MIP v2 | BMAD | Spec Kit | OpenSpec | Kiro | GSD | Task Master | Better Agents |
|-----------|--------|------|----------|---------|------|-----|-------------|---------------|
| **Multi-agent** | 10 agents nommes | 8+ personas | Non | Non | Non | Oui (4 types) | Non | Non |
| **Phases lifecycle** | 7 (SETUP+P0-P6) | 4 + Quick Flow | 4 (Specify/Plan/Tasks/Impl) | 3 fluides | 3 (Req/Design/Tasks) | 6 phases | PRD->Tasks->Exec | Init->Test->Eval |
| **Quality gates** | Par phase, explicites | Phase 3 readiness | 3 gates (Simplicity, Anti-Abstraction, Integration) | Minimal (/verify) | Hooks CI | Plan verify + UAT | Dependency checks | Tests must pass |
| **Securite** | Agent dedie (Victor /100) | Non | Dans specs, pas d'audit | Non | Hooks (credentials) | Minimal (deny-list) | Script auto-genere | Evals LangWatch |
| **Metriques** | Continue, zero-estimation | Non | Non | Non | Non | Context alerts | Datetime/tache | Via LangWatch |
| **Parallelisation** | MASS DAG (3 modes) | Party Mode | Annotation [P] | Non | Non | Vagues + deps | Filtres --ready | Non |
| **Portabilite** | Claude Code | Multi-IDE | 18+ agents | 20+ agents | Kiro IDE only | 4 CLIs | 7+ editeurs, 10+ IA | 5+ outils |
| **Cout** | Gratuit | Gratuit | Gratuit (MIT) | Gratuit (MIT) | $0-$200/mo | Gratuit (MIT) | Gratuit (BYOK) | Gratuit (MIT) |
| **Classification taches** | T1-T5 (5 niveaux) | L0-L4 (5 niveaux) | Non | Non | Non | Quick/Full | Non | Non |
| **Gouvernance code** | MSCM (balisage semantique) | Non | Constitution (9 articles) | Non | Steering files | Non | Non | AGENTS.md |

### Analyse par concurrent

**BMAD Method** — Framework Agile le plus proche de MIP en termes de structure multi-agent. 8+ personas (Analyst, PM, Architect, Scrum Master, Developer, QA). 34+ workflows via slash commands. Manque : securite dediee, metriques, parallelisation DAG, balisage semantique.

**GitHub Spec Kit** — Le plus populaire (73.5k stars). Constitution system elegant. Critique majeure : genere 2500+ lignes de markdown par feature (~4x plus lent que le prompting iteratif). Pas de multi-agent reel, pas de metriques.

**OpenSpec** — Alternative legere a Spec Kit. Delta specs (ADDED/MODIFIED/REMOVED) + Gherkin. Token-efficient. Feature de 5409 lignes dans une seule session Claude. Aucune gouvernance ni securite.

**AWS Kiro** — IDE standalone d'Amazon. Agent Hooks (event-driven, unique). Lock-in IDE total. Pricing critique ($39-200/mo). Pas de multi-agent ni parallelisation.

**GSD (Get Shit Done)** — Le plus innovant techniquement : resout le "context rot" avec des subagents frais par tache. Vagues paralleles. Commits atomiques. 23.6k stars. Manque : securite, metriques formelles, agents specialises par domaine.

**Claude Task Master** — Le plus portable (7+ editeurs, 10+ providers IA). Gestionnaire de taches, pas un protocole complet. PRD -> taches -> execution. MCP avec 3 modes de chargement. Pas de multi-agent ni parallelisation automatique.

**Better Agents** — Standards + scaffolding pour agents. Agent Testing Pyramid (Unit/Evals/Scenarios). Prompt versioning en YAML. Necessite LangWatch platform pour observabilite complete. Pas un protocole de dev.

### Positionnement MIP v2

**Avantages distinctifs MIP** (aucun concurrent ne combine ces 5 elements) :
1. **10 agents specialises** dont 4 non-dev (securite Victor, infra Hugo, efficience Jean, qualite Arianne)
2. **Lifecycle complet P0-P6** avec quality gates explicites a chaque phase
3. **MASS swarm** — parallelisation DAG avec 3 modes de dispatch (subagent burst, worktree, team)
4. **Metriques zero-estimation** — valeurs mesurees uniquement, jamais d'approximation
5. **MSCM** — balisage semantique du code avec index 10 JSON (gouvernance IA du code source)

**Faiblesses honnetes MIP** :
1. **Portabilite limitee** — couple a Claude Code (vs 20+ outils pour OpenSpec/Spec Kit)
2. **Courbe d'apprentissage elevee** — 10 agents, 7 phases, classification T1-T5
3. **Overhead T1/T2** — fast-track existe mais reste plus lourd qu'un simple prompt
4. **CLAUDE.md dense** — 200+ lignes (tension avec recommandation Anthropic <60 lignes)
5. **Pas de communaute publique** — vs 73.5k stars Spec Kit ou 23.6k stars GSD
6. **Token-hungry sur P0** — 10 temps de cadrage consomment beaucoup de contexte

---

## Inventaire technique (Denis)

- **Competences** : Rust (HTML generation dans pages.rs), Git/GitHub, contenu technique MIP/MSCM
- **Outils** : Git CLI, cargo build, rsync/ssh (deploiement VPS)
- **Prerequis** : Acces GitHub `StudioMiyukini`, acces SSH au VPS Origin

---

## Plan d'execution (7 taches)

| # | Tache | Agent | Fichiers | Deps | Parallele |
|---|-------|-------|----------|------|-----------|
| 1 | Ajouter `mip_page()` dans pages.rs (contenu HTML complet) | Francois | pages.rs | - | Vague 1 |
| 2 | Ajouter route `/mip` dans server.rs | Francois | server.rs | T1 | Vague 2 |
| 3 | Ajouter lien nav "MIP" dans layout() | Francois | pages.rs | T1 | Vague 2 |
| 4 | Initialiser repo GitHub `StudioMiyukini/mip` | Denis | (GitHub) | - | Vague 1 |
| 5 | Rediger README.md exhaustif | Denis | README.md | T4 | Vague 2 |
| 6 | Copier/adapter fichiers MIP+MSCM dans le repo | Denis | SKILL.md, modules/*, mscm/*, templates/* | T4 | Vague 2 |
| 7 | Creer documentation MSCM standalone | Denis | mscm/MSCM.md | T4 | Vague 2 |

**Parallelisation** : Vague 1 (T1+T4) en parallele, puis Vague 2 (T2+T3+T5+T6+T7) en parallele.

---

## Risques

| Risque | P | Impact | Mitigation |
|--------|---|--------|------------|
| Org GitHub `StudioMiyukini` non accessible | Faible | Bloquant T4-T7 | Verifier acces avant P3 |
| References internes Miyukini dans fichiers MIP | Haute | Qualite | Adapter chemins et references |
| Page HTML trop longue | Faible | Maintenabilite | Decouper en sections |
| `gh` CLI non disponible | Confirmee | Bloquant | Utiliser git + API GitHub directement |

---

## Decisions verrouillees

- **D1** : Route `/mip` (pas `/mip-mscm` ni `/protocols`)
- **D2** : Repo `StudioMiyukini/mip` (meme org que Miyukini-COG)
- **D3** : Licence Apache-2.0
- **D4** : Page HTML dans pages.rs (pas Markdown dans content/)
- **D5** : Navigation : lien "MIP" ajoute dans la barre de navigation existante

---

## Gate P0

Brief archive. En attente : approbation utilisateur + choix mode autonomie.
