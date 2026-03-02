# Plan Exhaustif & Guide d'Implementation — MASS : Miyukini Agent Swarm System

<!-- @id: mass.plan -->
<!-- @do: Plan tache par tache avec guide d'implementation detaille pour le chantier MASS -->
<!-- @role: Denis (Chef Dev) -->
<!-- @layer: Protocole MIP v2 -->
<!-- @human: miyukini-user -->

## TL;DR

27 taches atomiques en 7 vagues. Parallelisme max = 5 taches (Vague 4). 12 fichiers touches (1 cree, 11 modifies). ~600 lignes. Estimation : 1.5h (optimiste) a 3h (pessimiste). Nature : DOCUMENTATION PURE, pas de code Rust.

---

## DAG Resume

```
Vague 1 (4 paralleles)    Vague 2 (3 paralleles)    Vague 3 (3 paralleles)
+----------+              +----------+              +----------+
| SPEC-01  |              | SPEC-05  |              | DOC-01   |
| SPEC-02  |--deps:V1---->| SPEC-06  |--deps:V2---->| DOC-02   |
| SPEC-03  |              | SPEC-07  |              | CONFIG-01|
| SPEC-04  |              +----------+              +----------+
+----------+                                             |
                                                         v
Vague 4 (5 paralleles)    Vague 5 (4 paralleles)    Vague 6 (3 sequentielles)
+----------+              +----------+              +----------+
| AGENT-01 |              | AGENT-06 |              | TEST-G-01|
| AGENT-02 |--deps:V3---->| AGENT-07 |--deps:V3---->| TEST-G-02|-->AUDIT-01
| AGENT-03 |              | AGENT-08 |              +----------+
| AGENT-04 |              | TEMPLATE |                    |
| AGENT-05 |              +----------+                    v
+----------+                                     Vague 7 (2 sequentielles)
                                                  +----------+
                                                  | CORRECT-01|-->DOC-03
                                                  +----------+
```

---

## Vague 1 — Fondations SKILL.md (4 taches paralleles)

> **Prerequis** : Aucun. **Deps** : Aucune. **Parallelisme** : 4.

### SPEC-01 : SKILL.md — Architecture 3 couches MASS

**Agent** : Francois
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.cursor\skills\miyukini-mip-workflow\SKILL.md`
**Action** : Ajouter une section `## MASS — Miyukini Agent Swarm System` apres la section existante sur les regles non-negociables (fin du fichier ou section dediee). Contenu :

```markdown
## MASS — Miyukini Agent Swarm System (Pattern de parallelisation)

### TL;DR
MASS permet d'executer les taches MIP en parallele via un DAG de dependances decompose en vagues.
3 couches : Orchestrateur (Maria/DAG) → Pool Workers (agents) → Synchronisation (Denis/merge).
Loi 9 : si >3 taches independantes, parallelisation OBLIGATOIRE.

### Architecture en 3 couches

**Couche 1 — Orchestrateur (Maria)**
Maria decompose le plan exhaustif (Denis, Temps 7) en un DAG de dependances. Elle identifie
les vagues paralleles (groupes de taches sans dependance entre elles) et previent le serial
collapse. Le DAG est stocke dans `.mip/dags/YYYY-MM-DD-<slug>.json`.

Responsabilites :
- Generer le DAG a partir du plan (extraction des dependances)
- Calculer les vagues par tri topologique
- Appliquer la Loi 9 (detection du seuil >3 taches independantes)
- Choisir le mode de dispatch adapte a la classe et a la vague

**Couche 2 — Pool Workers (agents)**
Les agents (Francois, Lise, Victor en spot-check) executent les taches de chaque vague en
parallele. Chaque agent recoit une tache isolee avec ses fichiers, le contexte necessaire,
et ne touche JAMAIS un fichier assigne a un autre agent dans la meme vague.

3 modes de dispatch :
- **Subagent burst** : T2-T3 ou vague <=3 taches. Maria lance N subagents via Task tool.
- **Worktree swarm** : T4 ou vague >3 taches avec fichiers disjoints. Git worktrees.
- **Team swarm** : T5, vagues complexes. Flag Agent Teams experimental.

**Couche 3 — Synchronisation (Denis)**
Denis merge les resultats de chaque vague, verifie la coherence (build + test + clippy),
et lance la vague suivante. Si conflit de merge : resolution, log dans les metriques.
```

**Commit** : `docs(mip): add MASS architecture 3 layers in SKILL.md`
**Critere** : Section ajoutee, pas de doublon, pas de casse du fichier existant.

---

### SPEC-02 : SKILL.md — Format DAG JSON + schema

**Agent** : Francois
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.cursor\skills\miyukini-mip-workflow\SKILL.md`
**Action** : Ajouter la sous-section DAG JSON dans la section MASS. Contenu :

```markdown
### Format DAG JSON

Le DAG est stocke dans `.mip/dags/YYYY-MM-DD-<slug>.json`. Il est genere par Maria en P0
Temps 10 (synthese) ou au debut de P3 si le brief est deja approuve.

#### Schema

| Champ | Type | Description |
|-------|------|-------------|
| `version` | string | Version du schema ("1.0") |
| `slug` | string | Identifiant du chantier |
| `generated_by` | string | Agent generateur ("Maria") |
| `generated_at` | string | ISO 8601 timestamp |
| `dispatch_mode` | enum | "subagent_burst" / "worktree_swarm" / "team_swarm" |
| `total_tasks` | number | Nombre total de taches |
| `total_waves` | number | Nombre de vagues |
| `anti_serial_threshold` | number | Seuil Loi 9 (defaut: 3) |
| `nodes[]` | array | Taches du DAG |
| `nodes[].id` | string | Identifiant unique (ex: "CODE-01") |
| `nodes[].label` | string | Description courte |
| `nodes[].agent` | string | Agent assigne |
| `nodes[].type` | enum | "code" / "test_unit" / "test_integration" / "test_global" / "audit" / "correct" |
| `nodes[].wave` | number | Numero de vague |
| `nodes[].deps` | string[] | IDs des taches prerequises |
| `nodes[].estimated_minutes` | number | Estimation en minutes |
| `nodes[].files` | string[] | Fichiers concernes |
| `nodes[].status` | enum | "pending" / "running" / "done" / "failed" / "skipped" |
| `edges[]` | array | Aretes du graphe |
| `edges[].from` | string | ID source |
| `edges[].to` | string | ID destination |
| `waves[]` | array | Vagues d'execution |
| `waves[].number` | number | Numero de vague |
| `waves[].tasks` | string[] | IDs des taches de la vague |
| `waves[].parallelism` | number | Nombre de taches paralleles |
| `waves[].estimated_minutes` | number | Duree estimee (= tache la plus longue) |
| `waves[].status` | enum | "pending" / "running" / "done" |

#### Validation

Le DAG DOIT respecter :
- Aucun cycle (graphe acyclique)
- Aucune dependance a soi-meme
- Chaque tache appartient a exactement une vague
- Les taches d'une vague n'ont pas de dependances entre elles
- Les dependances d'une tache sont dans des vagues anterieures
```

**Commit** : `docs(mip): add DAG JSON schema in SKILL.md`
**Critere** : Schema complet, regles de validation documentees.

---

### SPEC-03 : SKILL.md — 3 modes dispatch

**Agent** : Francois
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.cursor\skills\miyukini-mip-workflow\SKILL.md`
**Action** : Ajouter la sous-section modes dispatch dans la section MASS. Contenu :

```markdown
### Modes de dispatch

Maria selectionne le mode de dispatch en fonction de la classe de la tache et de la
taille de la vague. Le choix est inscrit dans le DAG JSON (`dispatch_mode`).

| Mode | Declencheur | Mecanisme | Git strategy | Parallelisme max |
|------|-------------|-----------|-------------|------------------|
| **Subagent burst** | T2-T3 ou vague <=3 taches | Maria lance N subagents (Task tool), chacun une tache isolee. Denis merge au retour. | Branche unique, commits sequentiels apres merge | ~3 agents |
| **Worktree swarm** | T4 ou vague >3 taches, fichiers disjoints | Denis cree N git worktrees, chaque agent travaille dans son worktree. Denis merge les worktrees. | 1 worktree par agent, merge dans branche principale | ~5 agents |
| **Team swarm** | T5, vagues complexes | Utilise le flag Agent Teams de Claude Code (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`). L'orchestrateur lance des teams. | Gere par Agent Teams (experimental) | Limite plateforme |

#### Regles de selection (Maria)

1. Si classe <= T3 ET vague a <=3 taches independantes → **subagent burst**
2. Si classe T4 OU vague a >3 taches ET fichiers disjoints → **worktree swarm**
3. Si classe T5 ET Agent Teams active → **team swarm**
4. Fallback si Agent Teams non dispo → **worktree swarm**
5. Loi 9 : Si >3 taches independantes dans une vague → parallelisation OBLIGATOIRE

#### Isolation des fichiers

Regle ABSOLUE : dans une vague parallele, deux agents ne PEUVENT PAS toucher le meme fichier.
Si le plan cree un chevauchement de fichier entre deux taches de la meme vague, Denis DOIT
reordonnancer pour placer les taches conflictuelles dans des vagues differentes.

#### Worktree swarm — detail

```bash
# Denis cree les worktrees
git worktree add ../wt-francois feat/slug
git worktree add ../wt-lise feat/slug

# Chaque agent travaille dans son worktree
# Apres completion, Denis merge
git worktree remove ../wt-francois
git worktree remove ../wt-lise
```

#### Agent Teams — detail

Le flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` dans `.claude/settings.local.json` active
la fonctionnalite native de Claude Code. MASS utilise cette fonctionnalite comme backend
pour le mode team swarm. Si le flag n'est pas actif ou la feature pas disponible, MASS
retombe sur le mode worktree swarm.
```

**Commit** : `docs(mip): add 3 dispatch modes in SKILL.md`
**Critere** : 3 modes documentes, regles de selection explicites, isolation fichiers.

---

### SPEC-04 : SKILL.md — Protocole merge coordination

**Agent** : Francois
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.cursor\skills\miyukini-mip-workflow\SKILL.md`
**Action** : Ajouter la sous-section merge coordination dans la section MASS. Contenu :

```markdown
### Protocole de merge coordination (Denis)

Denis est le **Merge Coordinator** : il orchestre la fusion des contributions a chaque vague.

#### Avant chaque vague
1. Lire la liste des taches de la vague et leurs fichiers assignes
2. Verifier qu'aucun fichier n'est touche par deux agents (si conflit → reordonnancer)
3. Preparer le contexte pour chaque agent (tache + fichiers + anti-patterns)
4. Lancer les agents selon le mode dispatch

#### Pendant la vague
- Chaque agent travaille sur ses fichiers assignes UNIQUEMENT
- Chaque agent commit ses changements dans sa branche/worktree
- Denis monitore la progression (si possible via Agent Teams ou TodoWrite)

#### Apres la vague (merge sequence)
1. Collecter les commits de chaque agent
2. Merge sequentiellement dans la branche principale :
   - `git merge --no-ff <worktree-branch>` (si worktree swarm)
   - Direct commit (si subagent burst, car branche unique)
3. Si conflit de merge :
   a. Identifier les fichiers en conflit
   b. Resoudre (priorite a la derniere tache dans l'ordre du DAG)
   c. Logger le conflit dans les metriques swarm (`merge_conflicts++`)
4. Checkpoint :
   - `cargo build --workspace` (ou commande build du projet)
   - `cargo clippy --workspace -- -D warnings` (ou commande lint)
   - `cargo test --workspace` (ou commande test)
5. Si checkpoint echoue : corriger AVANT la vague suivante
6. Mettre a jour les metriques swarm (wave.status = "done", duree, parallelisme)
7. Lancer la vague suivante

#### Metriques collectees par vague
- `parallelism_effective` : nombre de taches reellement executees en parallele
- `duration_seconds` : duree mur-a-mur de la vague
- `merge_conflicts` : nombre de conflits de merge
- `started_at` / `ended_at` : horodatage ISO 8601
```

**Commit** : `docs(mip): add merge coordination protocol in SKILL.md`
**Critere** : Protocole avant/pendant/apres documente, metriques par vague.

---

## Vague 2 — Fondations SKILL.md suite (3 taches paralleles)

> **Prerequis** : Vague 1 completee. **Deps** : SPEC-01 a SPEC-04. **Parallelisme** : 3.

### SPEC-05 : SKILL.md — Loi 9 anti-serial-collapse

**Agent** : Francois
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.cursor\skills\miyukini-mip-workflow\SKILL.md`
**Action** : Ajouter dans la section MASS. Contenu :

```markdown
### Loi 9 — Anti-Serial-Collapse (NON NEGOCIABLE)

> "Si le DAG d'une sequence MIP contient une vague de plus de 3 taches independantes,
> ces taches DOIVENT etre executees en parallele. Le traitement sequentiel de taches
> independantes est interdit."

**Seuil** : >3 taches independantes dans une meme vague
**Detection** : Maria, lors de la generation du DAG (P0 Temps 10 ou debut P3)
**Consequence** : Maria selectionne le mode dispatch le plus adapte
**Exception** : Si l'outil IA ne supporte pas les agents paralleles (detecte en SETUP-4,
colonne "Agents paralleles" = Non), la Loi 9 est **suspendue** et un warning est emis :
"[WARNING] Loi 9 suspendue : outil IA {nom} ne supporte pas les agents paralleles.
Execution sequentielle forcee."

**Metriques** : Le compteur `serial_collapses_prevented` dans les metriques swarm
enregistre chaque fois que la Loi 9 force une parallelisation.
```

**Commit** : `docs(mip): add Law 9 anti-serial-collapse in SKILL.md`
**Critere** : Loi 9 enoncee, seuil quantifie, exception documentee.

---

### SPEC-06 : SKILL.md — Metriques swarm

**Agent** : Francois
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.cursor\skills\miyukini-mip-workflow\SKILL.md`
**Action** : Ajouter dans la section MASS. Contenu :

```markdown
### Metriques swarm

Les metriques swarm etendent le fichier `.mip/metrics/YYYY-MM-DD-<slug>.json` avec une
section `swarm`. Maria initialise la section, Denis alimente apres chaque vague.

#### Champs swarm

| Champ | Type | Description |
|-------|------|-------------|
| `swarm.enabled` | boolean | true si MASS est active pour cette sequence |
| `swarm.dispatch_mode` | string | Mode choisi par Maria |
| `swarm.dag_file` | string | Chemin relatif vers le DAG JSON |
| `swarm.total_waves` | number | Nombre total de vagues |
| `swarm.waves_completed` | number | Vagues completees |
| `swarm.total_parallel_tasks` | number | Taches executees en parallele (cumul) |
| `swarm.total_serial_tasks` | number | Taches executees en serie (cumul) |
| `swarm.max_parallelism_achieved` | number | Max taches paralleles dans une vague |
| `swarm.merge_conflicts` | number | Total conflits de merge |
| `swarm.serial_collapses_prevented` | number | Fois ou Loi 9 a force le parallele |
| `swarm.wave_details[]` | array | Detail par vague |
| `swarm.wave_details[].wave` | number | Numero |
| `swarm.wave_details[].tasks_planned` | number | Taches prevues |
| `swarm.wave_details[].tasks_completed` | number | Taches completees |
| `swarm.wave_details[].parallelism_effective` | number | Parallelisme reel |
| `swarm.wave_details[].duration_seconds` | number | Duree mur-a-mur |
| `swarm.wave_details[].merge_conflicts` | number | Conflits dans cette vague |
| `swarm.wave_details[].started_at` | string/null | ISO 8601 |
| `swarm.wave_details[].ended_at` | string/null | ISO 8601 |

#### Indicateurs derives (calcules en P6 par Arianne)

- **Parallelisme effectif** = total_parallel_tasks / (total_parallel_tasks + total_serial_tasks)
- **Ratio serial/parallel** = vagues a 1 tache / total vagues
- **Throughput** = total_tasks / duree totale P3
- **Merge conflict rate** = merge_conflicts / total_waves
```

**Commit** : `docs(mip): add swarm metrics specification in SKILL.md`
**Critere** : Schema complet, indicateurs derives documentes.

---

### SPEC-07 : SKILL.md — Integration MASS avec P0/P3/P4/P5

**Agent** : Francois
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.cursor\skills\miyukini-mip-workflow\SKILL.md`
**Action** : Ajouter dans la section MASS. Contenu :

```markdown
### Integration MASS dans le workflow MIP

#### P0 — Cadrage
- **Temps 7 (Denis)** : Le plan exhaustif inclut les dependances entre taches (`deps[]`)
- **Temps 10 (Maria)** : Generation du DAG JSON a partir du plan. Classification des vagues.
  Selection du mode dispatch. Inclusion du TL;DR DAG dans le brief.

#### P3 — Implementation
- **Debut P3** : Denis valide le DAG (pas de cycle, fichiers disjoints par vague)
- **Par vague** : Denis lance les agents selon le mode dispatch, merge apres chaque vague,
  checkpoint (build + test + lint), met a jour les metriques
- **Checkpoints Denis (/5 taches)** : Inchanges. S'appliquent au cumul des taches toutes
  vagues confondues.
- **Victor spot-check** : S'applique a chaque checkpoint, peu importe si les taches sont
  paralleles ou series

#### P4 — Audit
- George verifie la coherence globale post-merge (pas de regression inter-vagues)
- Les metriques swarm sont incluses dans le rapport d'audit

#### P5 — Livraison
- Denis presente le resume incluant les stats swarm (parallelisme, vagues, conflits)
- L'utilisateur peut voir le DAG dans `.mip/dags/`

#### P6 — Rapport
- Arianne calcule les indicateurs derives (parallelisme effectif, throughput)
- Capitalisation : patterns swarm dans `memory/mip-decisions.md`
- Anti-patterns : serial collapses detectes dans `memory/mip-antipatterns.md`
```

**Commit** : `docs(mip): add MASS integration with MIP phases in SKILL.md`
**Critere** : Integration P0/P3/P4/P5/P6 documentee.

---

## Vague 3 — CLAUDE.md + Settings (3 taches paralleles)

> **Prerequis** : Vague 2 completee. **Deps** : SPEC-05 (Loi 9). **Parallelisme** : 3.

### DOC-01 : CLAUDE.md — Ajouter Loi 9

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\CLAUDE.md`
**Action** : Dans la section "Lois d'Autonomie (NON NEGOCIABLES)", ajouter apres la ligne 8 :

```markdown
9. Anti-serial-collapse : si >3 taches independantes, parallelisation obligatoire
```

**Commit** : `docs(cog): add Law 9 anti-serial-collapse to CLAUDE.md`
**Critere** : Loi 9 presente, numerotation correcte (1-9).

---

### DOC-02 : CLAUDE.md — Reference MASS dans MIP v2

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\CLAUDE.md`
**Action** : Dans la section MIP v2, ajouter apres les lignes existantes sur les modes d'execution :

```markdown
**MASS (Agent Swarm)** : Parallelisation par DAG de dependances et vagues d'execution. 3 modes : subagent burst (T2-T3), worktree swarm (T4), team swarm (T5). Merge coordination par Denis. DAG dans `.mip/dags/`. Metriques swarm dans `.mip/metrics/`. Loi 9 : >3 taches independantes → parallelisation obligatoire. Flag experimental : `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` dans `.claude/settings.local.json`.
```

Aussi, dans la section "Artefacts MIP", ajouter :

```markdown
- `.mip/dags/` — DAG de dependances pour parallelisation swarm (P3)
```

**Commit** : `docs(cog): add MASS reference and dag artifacts to CLAUDE.md`
**Critere** : Section MASS presente, artefact `.mip/dags/` reference.

---

### CONFIG-01 : Activer Agent Teams flag

**Agent** : Hugo
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\settings.local.json`
**Action** : Ajouter une section `"env"` dans le JSON pour activer le flag :

```json
{
  "permissions": { ... },
  "hooks": { ... },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Note : Si le format `env` n'est pas supporte dans `settings.local.json`, ajouter plutot dans `~/.claude/settings.json`. Verifier la documentation Claude Code pour le bon emplacement du flag.

**Commit** : `feat(mip): enable Agent Teams experimental flag`
**Critere** : Flag present dans le fichier de configuration.

---

## Vague 4 — Agents batch 1 (5 taches paralleles)

> **Prerequis** : Vague 3 completee. **Deps** : DOC-01, DOC-02. **Parallelisme** : 5.

### AGENT-01 : maria.md — DAG Generator + anti-serial-collapse

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\maria.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm" apres la section existante. Contenu :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

Maria est l'**Orchestrateur** du pattern MASS (Couche 1).

### DAG Generator
- A la fin de P0 (Temps 10) ou au debut de P3, generer le DAG JSON depuis le plan exhaustif
- Extraire les dependances inter-taches (`deps[]`)
- Calculer les vagues par tri topologique
- Stocker dans `.mip/dags/YYYY-MM-DD-<slug>.json`

### Anti-Serial-Collapse (Loi 9)
- Detecter les vagues de >3 taches independantes
- Selectionner le mode dispatch : subagent burst (T2-T3, <=3), worktree swarm (T4, >3), team swarm (T5)
- Si l'outil IA ne supporte pas le parallelisme : emettre un warning et continuer en sequentiel
- Logger chaque prevention dans les metriques (`serial_collapses_prevented`)

### Choix du mode dispatch
- T2-T3 ou vague <=3 taches → subagent burst
- T4 ou vague >3 taches → worktree swarm
- T5 + Agent Teams active → team swarm
- Fallback → worktree swarm
```

**Commit** : `docs(agent): add MASS swarm responsibilities to maria.md`
**Critere** : DAG Generator, Loi 9, modes dispatch documentes.

---

### AGENT-02 : denis.md — Merge Coordinator

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\denis.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm" apres la section existante. Contenu :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

Denis est le **Merge Coordinator** du pattern MASS (Couche 3).

### Avant chaque vague
- Valider l'assignation fichiers/agents (pas de chevauchement)
- Preparer le contexte de chaque agent
- Creer les worktrees si mode worktree swarm

### Pendant la vague
- Monitorer la progression
- Aucune intervention sauf blocage

### Apres la vague
- Merge des contributions de chaque agent
- Resoudre les conflits (si fichier conflit : priorite au DAG order)
- Checkpoint : build + test + lint
- Mettre a jour les metriques swarm
- Lancer la vague suivante

### Worktree management
```bash
# Creer les worktrees
git worktree add ../wt-<agent> feat/<slug>
# Apres la vague, merge et nettoyage
git worktree remove ../wt-<agent>
```
```

**Commit** : `docs(agent): add MASS merge coordinator to denis.md`
**Critere** : Protocole avant/pendant/apres, worktree commands.

---

### AGENT-03 : francois.md — Worker swarm back-end

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\francois.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm". Contenu :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

Francois est un **Worker** du pool MASS (Couche 2 — back-end).

### Execution parallele
- Recevoir une tache isolee avec ses fichiers assignes et le contexte
- Executer le cycle TDD standard (RED-GREEN-REFACTOR-VERIFY-LINT-COMMIT-PUSH-LOG)
- Ne JAMAIS toucher un fichier assigne a un autre agent dans la meme vague
- Signaler a Denis si la tache necessite un fichier non-assigne (blocage)

### Isolation
- En mode worktree swarm : travailler dans le worktree dedie
- En mode subagent burst : travailler sur la branche commune (commits isoles)
- En mode team swarm : suivre les instructions Agent Teams
```

**Commit** : `docs(agent): add MASS worker swarm to francois.md`
**Critere** : Execution, isolation, 3 modes.

---

### AGENT-04 : lise.md — Worker swarm front-end

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\lise.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm". Contenu identique a Francois adapte front-end :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

Lise est un **Worker** du pool MASS (Couche 2 — front-end).

### Execution parallele
- Recevoir une tache isolee avec ses fichiers assignes et le contexte
- Executer le cycle TDD standard (RED-GREEN-REFACTOR-VERIFY-LINT-COMMIT-PUSH-LOG)
- Ne JAMAIS toucher un fichier assigne a un autre agent dans la meme vague
- Signaler a Denis si la tache necessite un fichier non-assigne (blocage)
- Rappel RSX : charger les pieges connus AVANT chaque tache (nested braces, named args, read+set)

### Isolation
- En mode worktree swarm : travailler dans le worktree dedie
- En mode subagent burst : travailler sur la branche commune (commits isoles)
- En mode team swarm : suivre les instructions Agent Teams
```

**Commit** : `docs(agent): add MASS worker swarm to lise.md`
**Critere** : Execution, isolation, rappel RSX.

---

### AGENT-05 : george.md — Audit coherence swarm

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\george.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm". Contenu :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

George intervient en **P4 post-merge** pour verifier la coherence du swarm.

### Audit swarm
- Verifier qu'aucune regression n'a ete introduite par le merge multi-vagues
- Verifier la coherence inter-fichiers (imports, types, API) apres fusion
- Inclure les metriques swarm dans le rapport d'audit (parallelisme, conflits)
- Si conflit de merge non resolu detecte : defaut BLOQUANT
```

**Commit** : `docs(agent): add MASS audit swarm to george.md`
**Critere** : Audit post-merge, metriques incluses.

---

## Vague 5 — Agents batch 2 + Template (4 taches paralleles)

> **Prerequis** : Vague 3 completee (DOC-01, DOC-02, CONFIG-01). **Deps** : V3. **Parallelisme** : 4.

### AGENT-06 : arianne.md — Capitalisation swarm

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\arianne.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm". Contenu :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

Arianne capitalise les apprentissages swarm en **P6**.

### Metriques et capitalisation
- Calculer les indicateurs derives (parallelisme effectif, throughput, merge conflict rate)
- Archiver le DAG JSON dans `.mip/dags/` avec les autres artefacts
- Extraire les patterns swarm efficaces → `memory/mip-decisions.md`
- Extraire les anti-patterns swarm (serial collapses, conflits recurrents) → `memory/mip-antipatterns.md`
- Inclure les stats swarm dans le rapport final P6
```

**Commit** : `docs(agent): add MASS capitalisation swarm to arianne.md`
**Critere** : Indicateurs, archivage, capitalisation.

---

### AGENT-07 : victor.md — Securite swarm

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\victor.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm". Contenu :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

Victor intervient en **spot-check parallele** pendant le swarm.

### Securite multi-agent
- Les spot-checks securite aux checkpoints Denis s'appliquent au cumul des taches, meme paralleles
- En mode worktree swarm : verifier que les worktrees ne contiennent pas de secrets (gitleaks)
- En mode team swarm : memes verifications que subagent burst
- Les fichiers agents (.md) sont des fichiers de confiance : toujours reviewer avant merge
```

**Commit** : `docs(agent): add MASS security swarm to victor.md`
**Critere** : Spot-check parallele, worktree securite.

---

### AGENT-08 : hugo.md — Infra swarm

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.claude\agents\hugo.md`
**Action** : Ajouter une section "MASS — Responsabilites Swarm". Contenu :

```markdown
## MASS — Responsabilites Swarm (Agent Swarm)

Hugo supporte l'infrastructure du swarm.

### Infrastructure parallele
- En mode worktree swarm : verifier que l'espace disque est suffisant pour N worktrees
- Futur : si CI/CD en place, configurer les builds paralleles pour les vagues
- Verifier que les git worktrees sont nettoyes apres chaque sequence MIP
- Documenter les pre-requis systeme pour le swarm dans `.mip/environment.md`
```

**Commit** : `docs(agent): add MASS infra swarm to hugo.md`
**Critere** : Worktree infra, CI/CD futur, nettoyage.

---

### TEMPLATE-01 : Creer le template metriques swarm

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.mip\metrics\swarm-template.json`
**Action** : Creer le fichier template. Contenu :

```json
{
  "_comment": "Template metriques swarm MASS. A copier dans le fichier metriques de chaque sequence MIP T3+ utilisant le swarm.",
  "swarm": {
    "enabled": false,
    "dispatch_mode": null,
    "dag_file": null,
    "total_waves": 0,
    "waves_completed": 0,
    "total_parallel_tasks": 0,
    "total_serial_tasks": 0,
    "max_parallelism_achieved": 0,
    "merge_conflicts": 0,
    "serial_collapses_prevented": 0,
    "wave_details": []
  }
}
```

**Commit** : `feat(mip): create swarm metrics template`
**Critere** : JSON valide, champs conformes au schema SPEC-06.

---

## Vague 6 — Integration (3 taches sequentielles)

> **Prerequis** : Vagues 4 et 5 completees. **Deps** : AGENT-01 a AGENT-08, TEMPLATE-01. **Parallelisme** : 1 (sequentiel).

### TEST-G-01 : Verification coherence inter-fichiers

**Agent** : Denis
**Fichier** : Tous les fichiers modifies
**Action** : Verifier que :
- SKILL.md reference les agents par leurs noms corrects
- Les agents .md referencent la section MASS du SKILL.md
- CLAUDE.md reference `.mip/dags/` dans les artefacts
- Le schema DAG dans SKILL.md correspond au template dans swarm-template.json
- La Loi 9 dans CLAUDE.md est coherente avec celle dans SKILL.md
- Les 3 modes dispatch sont mentionnes de maniere coherente partout

**Commit** : `test(mip): verify cross-file coherence for MASS`
**Critere** : 0 incoherence detectee.

---

### TEST-G-02 : Verification MSCM

**Agent** : Denis
**Fichier** : Tous les fichiers modifies
**Action** : Verifier que les nouvelles sections portent des annotations MSCM :
- `@id` : prefixe `mas.*` pour toutes les sections MASS
- `@do` : description de chaque section
- `@role` : agent responsable

**Commit** : `docs(mscm): verify annotations on MASS sections`
**Critere** : Toutes les nouvelles sections annotees.

---

### AUDIT-01 : Audit global de conformite

**Agent** : George
**Fichier** : Tous les fichiers modifies
**Action** : Executer l'audit de conformite :
- [ ] Tous les fichiers modifies sont syntaxiquement corrects (Markdown, JSON)
- [ ] Pas de doublon de section dans les fichiers
- [ ] Les references croisees sont valides
- [ ] La Loi 9 est presente dans CLAUDE.md ET SKILL.md
- [ ] Le flag Agent Teams est dans settings.local.json
- [ ] Le template swarm est un JSON valide
- [ ] Les 9 agents ont leur section MASS
- [ ] Le schema DAG est complet et coherent

**Commit** : `audit(mip): MASS conformity audit`
**Critere** : 0 defaut bloquant.

---

## Vague 7 — Corrections + Finalisation (2 taches sequentielles)

> **Prerequis** : Vague 6 completee (AUDIT-01). **Deps** : AUDIT-01. **Parallelisme** : 1.

### CORRECT-01 : Buffer corrections

**Agent** : Denis
**Action** : Corriger les defauts identifies par AUDIT-01 (si aucun defaut, tache skipped).
**Commit** : `fix(mip): corrections from MASS audit`
**Critere** : 0 defaut restant.

---

### DOC-03 : Mettre a jour les metriques finales

**Agent** : Denis
**Fichier** : `C:\Users\miyuk\Cursor\Miyukini-COG\.mip\metrics\2026-03-02-mas-agent-swarm.json`
**Action** : Mettre a jour les compteurs finaux : lines_written, files_created, files_modified, commits, agents_engaged. Horodater p3_end.

**Commit** : `docs(mip): update MASS metrics`
**Critere** : Metriques a jour, horodatage present.

---

## Resume des taches

| # | ID | Vague | Agent | Fichier principal | Description |
|---|-----|-------|-------|-------------------|-------------|
| 1 | SPEC-01 | 1 | Francois | SKILL.md | Architecture 3 couches MASS |
| 2 | SPEC-02 | 1 | Francois | SKILL.md | Format DAG JSON + schema |
| 3 | SPEC-03 | 1 | Francois | SKILL.md | 3 modes dispatch |
| 4 | SPEC-04 | 1 | Francois | SKILL.md | Protocole merge coordination |
| 5 | SPEC-05 | 2 | Francois | SKILL.md | Loi 9 anti-serial-collapse |
| 6 | SPEC-06 | 2 | Francois | SKILL.md | Metriques swarm |
| 7 | SPEC-07 | 2 | Francois | SKILL.md | Integration MASS phases MIP |
| 8 | DOC-01 | 3 | Denis | CLAUDE.md | Loi 9 dans Lois d'Autonomie |
| 9 | DOC-02 | 3 | Denis | CLAUDE.md | Reference MASS dans MIP v2 |
| 10 | CONFIG-01 | 3 | Hugo | settings.local.json | Flag Agent Teams |
| 11 | AGENT-01 | 4 | Denis | maria.md | DAG Generator, Loi 9 |
| 12 | AGENT-02 | 4 | Denis | denis.md | Merge Coordinator |
| 13 | AGENT-03 | 4 | Denis | francois.md | Worker swarm back |
| 14 | AGENT-04 | 4 | Denis | lise.md | Worker swarm front |
| 15 | AGENT-05 | 4 | Denis | george.md | Audit coherence swarm |
| 16 | AGENT-06 | 5 | Denis | arianne.md | Capitalisation swarm |
| 17 | AGENT-07 | 5 | Denis | victor.md | Securite swarm |
| 18 | AGENT-08 | 5 | Denis | hugo.md | Infra swarm |
| 19 | TEMPLATE-01 | 5 | Denis | swarm-template.json | Template metriques |
| 20 | TEST-G-01 | 6 | Denis | tous | Coherence inter-fichiers |
| 21 | TEST-G-02 | 6 | Denis | tous | Verification MSCM |
| 22 | AUDIT-01 | 6 | George | tous | Audit global |
| 23 | CORRECT-01 | 7 | Denis | selon audit | Buffer corrections |
| 24 | DOC-03 | 7 | Denis | metriques | MAJ metriques finales |

**Note** : Le plan initial prevoyait 27 taches. Apres consolidation, 24 taches atomiques suffisent (certaines taches redondantes fusionnees). Le parallelisme max reste 5 (Vague 4).

---

*Plan genere le 2026-03-02 par Denis (Chef Dev Senior MIP v2).*
*Revise par Maria (Chef de Projet MIP v2).*
