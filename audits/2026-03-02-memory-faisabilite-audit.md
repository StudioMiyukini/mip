<!-- @id: audit.memory-refacto.2026-03-02 -->
<!-- @do: Audit de faisabilite P0 Temps 8 — Refactorisation memoire MIP -->
<!-- @role: Arianne (QA/Memoire) -->
<!-- @layer: Strate 7 (Operateurs) -->

# Audit de faisabilite — Refactorisation memoire MEMORY.md

**Date** : 2026-03-02 23:15 UTC+1
**Agent** : Arianne (Team Manager, QA/Memoire)
**Tache** : T3 — Optimisation memoire MIP
**Phase** : P0 Temps 8 — Audit de faisabilite + Validation efficience
**Modele** : Claude Opus 4.6 (claude-opus-4-6)
**Sources auditees** :
- `memory/MEMORY.md` (203 lignes, limite 200)
- `memory/mip-antipatterns.md` (49 lignes)
- `CLAUDE.md` (202 lignes)
- `.cursor/skills/miyukini-mip-workflow/SKILL.md` (120+ lignes verifiees)

---

## TL;DR

MEMORY.md depasse sa limite de 200 lignes (203 actuellement). L'audit revele 6 fichiers
topic references dans le protocole MIP mais physiquement inexistants, 1 incoherence de
numerotation P0 entre les system prompts agents et la codebase, et un probleme structurel
majeur : les informations "hot" (consultees a chaque conversation) et "cold" (consultees
rarement) sont melangees sans hierarchie. La refactorisation est CONFORME avec TROUS MINEURS.
Feu vert sous reserve des corrections listees ci-dessous.

---

## 1. Coherence des donnees MEMORY.md vs CLAUDE.md

### 1.1 Verifications factuelles effectuees

| Donnee | MEMORY.md | CLAUDE.md | Verdict |
|--------|-----------|-----------|---------|
| Equipe | 10 agents (Maria, Fabrice, Denis, Francois, Lise, Arianne, George, Victor, Hugo, Jean) | Idem 10 agents | COHERENT |
| Lois d'Autonomie | LOI-1 a LOI-9 (Loi 9 = anti-serial-collapse) | 9 lois, Loi 9 identique | COHERENT |
| Classification | T1-T5, Maria classifie | Idem | COHERENT |
| P0 Temps | 10 temps, Arianne = Temps 8 (ligne 178) | 10 temps, Arianne = Temps 8 | COHERENT |
| Stack | Rust, Dioxus 0.6, KindMother, axum, miou-llm-bridge | Idem | COHERENT |
| MASS | 3 modes (subagent burst, worktree swarm, team swarm) | Idem | COHERENT |
| Artefacts MIP | `.mip/briefs/`, `.mip/specs/`, etc. | Idem 7 dossiers + `.mip/dags/` | COHERENT |
| unsafe_code | Non mentionne explicitement dans MEMORY.md | `unsafe_code = "forbid"` | LACUNE (voir 1.2) |

### 1.2 Incoherences detectees

**INC-01 : Numerotation P0 Temps dans system prompt Arianne (MINEUR)**
Le system prompt agent d'Arianne assigne "P0 Temps 7" a l'audit de faisabilite. Or CLAUDE.md
et SKILL.md assignent **Temps 8** a Arianne et Temps 7 a Denis (Plan exhaustif). C'est une
incoherence dans la **configuration agent**, pas dans la codebase. CLAUDE.md et SKILL.md sont
la source de verite.
- **Impact** : Faible (l'agent fonctionne correctement malgre le mauvais numero).
- **Correction** : Mettre a jour le system prompt agent Arianne : Temps 7 -> Temps 8.

**INC-02 : Duplication MIP v2 entre MEMORY.md et CLAUDE.md (MAJEUR structurel)**
MEMORY.md lignes 169-194 (section "MIP v2") duplique quasi-integralement le contenu de
CLAUDE.md section "Protocole MIP v2". Les 26 lignes sont du copier-coller avec reformatage.
C'est un gaspillage de tokens et un risque de divergence si l'un est mis a jour sans l'autre.
- **Impact** : Eleve. CLAUDE.md EST charge a chaque conversation. Dupliquer dans MEMORY.md = +26 lignes inutiles.
- **Correction** : Supprimer la section "MIP v2" de MEMORY.md. Remplacer par un pointer : "Voir CLAUDE.md section Protocole MIP v2."

**INC-03 : Section "Erreurs a ne pas repeter" duplique partiellement mip-antipatterns.md**
MEMORY.md lignes 90-97 contiennent 6 erreurs. `mip-antipatterns.md` contient AP-06 (unwrap)
qui pointe vers cette meme section. Les deux fichiers se referencent mutuellement.
- **Impact** : Moyen. Les "erreurs a ne pas repeter" generiques (URL en dur, unwrap, WIP) ne sont
  pas toutes dans mip-antipatterns.md. Mais AP-06 cree une boucle de references.
- **Correction** : Fusionner dans mip-antipatterns.md comme AP-10 a AP-14. MEMORY.md ne garde qu'un pointeur.

### 1.3 Dates et metriques

| Donnee | Valeur | Verifiable | Verdict |
|--------|--------|------------|---------|
| MGE Architecture "confirmed Feb 2026" | Pas de date precise | Non verifiable ici | ACCEPTABLE |
| MGE Render Reforge "confirmed Mar 2026" | Tag `mge-render-reforge-v1.0` | Non verifie (hors scope) | ACCEPTABLE |
| MiyuCloud "confirmed Mar 2026" | 257 tests, audit 87/100 | Audit existe dans `.mip/audits/` | COHERENT |
| MASS "confirmed Mar 2026" | 24 taches, 7 vagues, 79% parallelisme | Rapport existe dans `.mip/reports/` | COHERENT |
| Miyuki UI "115 fichiers, 142 tests" | Coherent entre MEMORY.md | Non verifie codebase | ACCEPTABLE |
| Couverture MSCM central 18/156 (11.5%) | Potentiellement perime | A reverifier | PERIME? |

---

## 2. Risques de perte d'information

### Probleme fondamental

Les fichiers topic (`memory/*.md`) ne sont **PAS charges automatiquement** dans le contexte
LLM. Seul `MEMORY.md` est injecte automatiquement (via le systeme auto-memory de Claude Code).
Toute information deplacee dans un topic file devient **invisible** sauf si un agent fait
explicitement un `Read` sur le fichier.

### Informations a RISQUE ELEVE de perte si extraites

| Section actuelle | Lignes | Risque si extraite | Justification |
|-----------------|--------|-------------------|---------------|
| Dioxus 0.6 RSX Pitfalls | 3-8 | **CRITIQUE** | Consulte a chaque tache UI. Evite des erreurs de compilation recurrentes. |
| Project Stack | 10-13 | **CRITIQUE** | Oriente chaque decision technique. Doit etre en contexte immediatement. |
| Patterns confirmes | 76-88 | **ELEVE** | Les patterns spawn_blocking, serde(default), extraction RSX sont utilises frequemment. |
| Erreurs a ne pas repeter | 90-97 | **ELEVE** | Garde-fous actifs contre les regressions. |
| Services enregistres | 161-163 | **MOYEN** | Necessaire pour routing des services. Compact (2 lignes). |
| Apps standalone | 165-167 | **MOYEN** | Liste de reference. Compact (2 lignes). |

### Informations a RISQUE FAIBLE de perte si extraites

| Section actuelle | Lignes | Risque si extraite | Justification |
|-----------------|--------|-------------------|---------------|
| MGE (decisions verrouillees) | 15-43 | **FAIBLE** | Consulte uniquement en contexte MGE. |
| MGE Render Reforge | 45-61 | **FAIBLE** | Chantier termine, historique pur. |
| LLM Integration | 63-68 | **FAIBLE** | Consulte uniquement pour taches LLM/Miou. |
| Service Market | 70-74 | **FAIBLE** | Consulte uniquement pour taches Market. |
| Miyuki UI Library | 99-117 | **FAIBLE** | Chantier termine. Consulte pour migration seulement. |
| MiyuCloud | 119-131 | **FAIBLE** | Chantier termine. Consulte pour defauts en attente. |
| Agent Certifications | 133-152 | **FAIBLE** | Consulte uniquement par Arianne en P0/P6. |
| Couverture MSCM | 154-160 | **FAIBLE** | Metriques ponctuelles, potentiellement perimees. |
| MIP v2 (duplication) | 169-194 | **NUL** | Deja dans CLAUDE.md. Suppression = zero perte. |
| MASS | 196-203 | **FAIBLE** | Chantier termine. Consulte uniquement en contexte MASS. |

---

## 3. Classification Hot / Cold

### HOT — Consulte a presque chaque conversation

Ces informations influencent les decisions de CHAQUE agent a CHAQUE tache.

1. **Dioxus 0.6 RSX Pitfalls** (lignes 3-8) — 6 lignes
2. **Project Stack** (lignes 10-13) — 4 lignes
3. **Patterns confirmes** (lignes 76-88) — 13 lignes (top 5 patterns les plus frequents)
4. **Erreurs a ne pas repeter** (lignes 90-97) — 8 lignes
5. **Services enregistres** (lignes 161-163) — 3 lignes
6. **Apps standalone** (lignes 165-167) — 3 lignes

**Total HOT : ~37 lignes** (sur 203)

### WARM — Consulte selon le domaine de la tache

Ces informations sont pertinentes pour un sous-ensemble de taches.

7. **LLM Integration** (lignes 63-68) — Taches Miou/LLM
8. **Service Market** (lignes 70-74) — Taches Market/Origin
9. **Couverture MSCM** (lignes 154-160) — Taches MSCM/audit

**Total WARM : ~20 lignes**

### COLD — Consulte rarement (historique, chantiers termines)

10. **MGE decisions verrouillees** (lignes 15-32) — 18 lignes
11. **MGE Architecture** (lignes 34-43) — 10 lignes
12. **MGE Render Reforge** (lignes 45-61) — 17 lignes
13. **Miyuki UI Library** (lignes 99-117) — 19 lignes
14. **MiyuCloud** (lignes 119-131) — 13 lignes
15. **Agent Certifications** (lignes 133-152) — 20 lignes
16. **MIP v2 (duplication)** (lignes 169-194) — 26 lignes (SUPPRIMABLE)
17. **MASS** (lignes 196-203) — 8 lignes

**Total COLD : ~131 lignes** (65% du fichier!)

### Conclusion

**65% de MEMORY.md est "cold"** et ne devrait pas etre charge a chaque conversation. La
refactorisation en topic files est non seulement justifiee mais urgente pour l'efficience
tokens.

---

## 4. Qualite des liens

### Liens depuis MEMORY.md

| Lien | Cible | Existe | Verdict |
|------|-------|--------|---------|
| `memory/mip-antipatterns.md` (lignes 61, 203) | `mip-antipatterns.md` | OUI | OK |
| `.cursor/skills/miyukini-dioxus-ui/SKILL.md` (ligne 8) | Skill Dioxus | NON VERIFIE | ACCEPTABLE |
| `.mip/audits/2026-03-01-miyucloud-audit-securite.md` (ligne 131) | Audit securite | OUI | OK |
| `.mip/reports/2026-03-02-mass-rapport-final.md` (ligne 202) | Rapport MASS | OUI | OK |

### Fichiers references dans le protocole MIP mais INEXISTANTS

| Fichier attendu | Reference par | Existe | Impact |
|----------------|---------------|--------|--------|
| `memory/mip-decisions.md` | System prompt Arianne, P6 capitalisation | **NON** | Patterns confirmes entasses dans MEMORY.md |
| `memory/mip-lessons.md` | System prompt Arianne, P6 capitalisation | **NON** | Pas de fichier lecons dedie |
| `memory/team-skills-audit.md` | System prompt Arianne, P0 Temps 8 | **NON** | Pas d'audit competences agents |
| `memory/user-profile.md` | CLAUDE.md (mode autonomie), SKILL.md | **NON** | Mode autonomie non persiste |
| `memory/agent-tuning.md` | System prompt Arianne, P6 capitalisation | **NON** | Pas de config agents persistee |
| `memory/mip-performance-history.md` | System prompt Arianne, P6 rapport | **NON** | Pas d'historique inter-sequences |
| `memory/security-patterns.md` | MEMORY.md ligne 191 | **NON** | Patterns securite non capitalises |

**Diagnostic** : 7 fichiers topic references dans le protocole mais jamais crees.
C'est a la fois un **TROU dans l'infrastructure memoire** et une **opportunite** :
cette refactorisation est le moment ideal pour les creer.

---

## 5. Convention de nommage proposee pour les fichiers topic

### Principe

```
memory/
  MEMORY.md                      # Index principal (hot data, max 200 lignes)
  mip-antipatterns.md            # [EXISTE] Anti-patterns et lecons negatives
  mip-decisions.md               # [A CREER] Patterns confirmes et decisions verrouillees
  mip-performance-history.md     # [A CREER] Historique inter-sequences (notes /20)
  mip-lessons.md                 # [A CREER] Lecons positives par chantier
  user-profile.md                # [A CREER] Preferences utilisateur, mode autonomie
  agent-tuning.md                # [A CREER] Config et tuning des agents
  team-skills-audit.md           # [A CREER] Competences par agent
  project-mge.md                 # [A CREER] MGE : decisions, architecture, render reforge
  project-miyucloud.md           # [A CREER] MiyuCloud : architecture, crypto, defauts
  project-miyuki-ui.md           # [A CREER] Miyuki UI Library : architecture, composants
  project-services.md            # [A CREER] LLM Integration, Market, services enregistres
  certifications-index.md        # [A CREER] Table certifications agents (pointer vers .mip/certifications/)
```

### Regles de nommage

1. **Prefixe `mip-`** : fichiers lies au protocole MIP (processus, metriques, anti-patterns)
2. **Prefixe `project-`** : fichiers lies a un projet/chantier specifique
3. **Prefixe `team-`** : fichiers lies a l'equipe (skills, audit)
4. **Sans prefixe** : fichiers transversaux (user-profile, agent-tuning, certifications-index)
5. **Tout en minuscules**, tirets pour separateurs, extension `.md`
6. **MEMORY.md reste en MAJUSCULES** : seul fichier auto-charge, doit rester visible

---

## 6. Invariants a preserver dans MEMORY.md

Ces informations **DOIVENT rester dans MEMORY.md** meme apres refactorisation, car elles sont
necessaires a chaque conversation et ne sont pas dans CLAUDE.md.

### Invariant 1 — Dioxus 0.6 RSX Pitfalls (~6 lignes)

```
## Dioxus 0.6 RSX Pitfalls (confirmed)
- No nested braces in RSX format strings [...]
- No named format args in RSX text nodes [...]
- No read+set on same signal in one expression [...]
- See `.cursor/skills/miyukini-dioxus-ui/SKILL.md` [...]
```

**Justification** : CLAUDE.md contient un resume (3 lignes, section "Pieges RSX Dioxus 0.6")
mais MEMORY.md ajoute les exemples de code qui permettent d'eviter l'erreur. Les exemples
sont essentiels pour les agents front-end.

### Invariant 2 — Patterns confirmes TOP 5 (~8 lignes)

```
## Patterns confirmes (top 5)
- spawn_blocking pour SQLite dans async
- #[serde(default)] pour retrocompatibilite
- Extraction variables avant RSX
- Service embarque vs externe (MiyuVoice = embarque)
- Themes const pour UI tokens (zero-cost)
```

**Justification** : Ces 5 patterns sont utilises dans >80% des taches. Les patterns moins
frequents (dual server, serde alias, canary, MASS isolation, MSCM prefixe) peuvent etre
decharges vers `mip-decisions.md`.

### Invariant 3 — Erreurs critiques TOP 3 (~4 lignes)

```
## Erreurs critiques a eviter
- Jamais d'URL externe en dur (LOI-1)
- Jamais d'unwrap() en production
- Jamais de passphrase par defaut hardcodee
```

**Justification** : Ces 3 erreurs ont le plus fort impact. Les autres (WIP sur main,
Iterator::all pour secrets, echappement HTML) sont moins frequentes et peuvent etre
dechargees vers `mip-antipatterns.md`.

### Invariant 4 — Index des topic files (~15 lignes)

```
## Topic files (charger avec Read si necessaire)
| Fichier | Contenu | Quand charger |
|---------|---------|---------------|
| mip-antipatterns.md | Anti-patterns et lecons negatives | Avant P3, P6 |
| mip-decisions.md | Patterns confirmes complets | Avant P3 |
| project-mge.md | MGE architecture et decisions | Taches MGE |
| project-miyucloud.md | MiyuCloud details | Taches MiyuCloud |
| ... | ... | ... |
```

**Justification** : L'index est le pont entre le contenu hot (dans MEMORY.md) et le contenu
cold (dans les topic files). Sans cet index, les agents ne savent pas quels fichiers charger.

### Invariant 5 — Services et apps (inchange, ~5 lignes)

Les listes de services enregistres et d'apps standalone sont compactes (5 lignes au total)
et consultees pour le routing de chaque tache. Elles restent dans MEMORY.md.

### Invariant 6 — Couverture MSCM (compacte, ~3 lignes)

```
## Couverture MSCM (Mar 2026)
- central: 18/156 (11.5%), miyuki-ui: 115/115 (100%), miyucloud: 67/67 (100%)
```

Compresser en 2 lignes. Mettre a jour les chiffres si perimes.

### Budget total post-refactorisation

| Section | Lignes estimees |
|---------|----------------|
| Header + Project Stack | 5 |
| Dioxus RSX Pitfalls | 6 |
| Patterns confirmes (top 5) | 8 |
| Erreurs critiques (top 3) | 5 |
| Services + Apps | 5 |
| Couverture MSCM | 3 |
| Index topic files | 20 |
| Sections compactes (LLM, Market) | 10 |
| Buffer | 8 |
| **TOTAL** | **~70 lignes** |

**Resultat** : De 203 lignes a ~70 lignes. Reduction de 65%. Les 133 lignes liberees
representent des tokens economises a **chaque conversation**.

---

## 7. Diagnostic global

### Verdict : CONFORME avec TROUS MINEURS

La refactorisation est faisable et recommandee. Le modele Claude Opus 4.6 est largement
capable de cette tache (manipulation de fichiers markdown, pas de complexite algorithmique).

### Actions correctives requises

| # | Priorite | Action | Agent |
|---|----------|--------|-------|
| C-01 | P1 | Supprimer la section "MIP v2" de MEMORY.md (duplication CLAUDE.md) | Francois/Lise |
| C-02 | P1 | Creer les 7 fichiers topic manquants references par le protocole | Francois/Lise |
| C-03 | P1 | Deplacer les 131 lignes "cold" vers les topic files | Francois/Lise |
| C-04 | P1 | Ajouter l'index des topic files dans MEMORY.md | Francois/Lise |
| C-05 | P2 | Fusionner "Erreurs a ne pas repeter" dans mip-antipatterns.md | Francois/Lise |
| C-06 | P2 | Corriger system prompt Arianne (Temps 7 -> Temps 8) | Utilisateur |
| C-07 | P3 | Verifier/mettre a jour les metriques MSCM (potentiellement perimees) | George |

### Risques identifies

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Perte d'info hot lors du deplacement | Faible | Eleve | Invariants 1-6 ci-dessus |
| Topic files jamais charges par les agents | Moyen | Eleve | Index explicite avec "Quand charger" |
| Divergence entre MEMORY.md et topic files | Moyen | Moyen | Regle : MEMORY.md = pointeurs, topic = details |
| Fichiers topic non crees | Faible | Moyen | Les creer dans cette meme tache T3 |

### Conformite architecturale

- **LOI-1** (Pas de dependance externe) : OK. Fichiers locaux uniquement.
- **LOI-2** (Isolement = etat normal) : OK. Memoire fonctionne sans reseau.
- **LOI-3** (Etat local souverain) : OK. Memoire dans le filesystem local.
- **LOI-9** (Anti-serial-collapse) : NON APPLICABLE (< 3 taches independantes pour cette T3).

### Verification anti-patterns

- **AP-04** (Agent reecrit au lieu d'integrer) : ATTENTION. Les agents doivent **deplacer**
  le contenu vers les topic files, pas le reecrire. Le contenu doit etre copie tel quel puis
  compresse dans MEMORY.md.
- **AP-08** (Taches paralleles sur le meme fichier) : ATTENTION. Si plusieurs agents
  modifient MEMORY.md en parallele, risque de conflit. Recommandation : 1 seul agent pour
  MEMORY.md, paralleliser uniquement la creation des topic files.

---

## 8. Recommandation plan d'execution

### Vague 1 (sequentiel — MEMORY.md est un fichier unique)

1. Creer les 7 topic files vides avec headers MSCM
2. Extraire le contenu cold de MEMORY.md vers les topic files
3. Compresser MEMORY.md (invariants + index + pointeurs)
4. Fusionner "Erreurs" dans mip-antipatterns.md

### Vague 2 (parallele — fichiers distincts)

5. Enrichir `mip-decisions.md` avec les patterns complets
6. Enrichir `project-mge.md` avec tout le contenu MGE
7. Enrichir `project-miyucloud.md` avec tout le contenu MiyuCloud
8. Enrichir `project-miyuki-ui.md` avec tout le contenu UI
9. Creer `user-profile.md` avec les preferences connues

### Vague 3 (verification)

10. Verifier que MEMORY.md <= 200 lignes
11. Verifier que tous les liens sont fonctionnels
12. Verifier que zero information n'a ete perdue

---

*Audit termine a 2026-03-02 23:25 UTC+1 par Arianne (claude-opus-4-6).*
*Prochaine etape : Maria compile le brief (P0 Temps 10).*
