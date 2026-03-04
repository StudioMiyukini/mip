# Brief P0 -- Refactorisation Memoire MIP

<!-- @id: mip.brief.memory-refactoring -->
<!-- @do: Brief de cadrage pour la refactorisation de MEMORY.md -->
<!-- @role: Maria (PM) -->
<!-- @layer: MIP P0 -->

**Date** : 2026-03-02
**Classification** : T3 (Feature moderee, 5-10 fichiers documentation)
**T0** : 2026-03-02

---

## TL;DR

MEMORY.md depasse la limite systeme (203/200 lignes). 24% du contenu est doublon
de CLAUDE.md. 17 sections entassees, 1 seul fichier topic existant. Extraction en
6 fichiers topic + purge des doublons + enrichissement de l'antipatterns existant.
Resultat cible : MEMORY.md ~65-75 lignes (index pur avec marge de croissance).

---

## 1. Contexte

Le fichier `MEMORY.md` est le fichier de memoire persistante des agents Claude Code
pour le projet Miyukini-COG. Il est charge automatiquement dans le contexte systeme
de chaque conversation. Le systeme impose une limite de 200 lignes : au-dela, le
contenu est tronque silencieusement.

**Situation actuelle** :
- MEMORY.md : 203 lignes (3 lignes tronquees = metriques MASS perdues)
- 17 sections heterogenes empilees sans structure thematique
- 1 seul fichier topic existant : `mip-antipatterns.md` (49 lignes)
- 24% du contenu (49 lignes) est doublon exact de CLAUDE.md
- Aucune marge de croissance pour les prochains chantiers

## 2. Objectifs

- **Objectif principal** : Ramener MEMORY.md sous 75 lignes avec une structure index
  pure, sans perte d'information
- **Objectifs secondaires** :
  - Eliminer 100% des doublons avec CLAUDE.md
  - Creer des fichiers topic thematiques autonomes et maintenables
  - Recuperer les 3 lignes tronquees (metriques MASS)
  - Etablir une convention pour les futurs ajouts a la memoire
- **Criteres de succes mesurables** :
  - MEMORY.md <= 75 lignes
  - 0 doublon avec CLAUDE.md
  - 0 perte d'information (chaque item traçable vers un fichier)
  - Tous les fichiers topic < 60 lignes chacun

## 3. Perimetre (Scope)

### Inclus
- Refactorisation de MEMORY.md en index pur
- Creation de 4 fichiers topic nouveaux (mge, miyuki-ui, miyucloud, certifications)
- Renommage + enrichissement de mip-antipatterns.md → patterns-and-lessons.md
- Purge des sections dupliquees avec CLAUDE.md (RSX, Stack, MIP v2)
- Verification que les references croisees restent valides

### Exclus
- Modification de CLAUDE.md (hors perimetre)
- Modification des fichiers .cursor/skills/ (hors perimetre)
- Mise a jour du contenu factuel des sections (seulement deplacer, pas reecrire)
- Ajout de nouveau contenu memoire

## 4. Diagnostic detaille

### 4.1 Sections MEMORY.md — Inventaire complet

| # | Section | Lignes | Disposition recommandee |
|---|---------|--------|------------------------|
| 1 | Dioxus 0.6 RSX Pitfalls | 7 | PURGER — doublon CLAUDE.md + skill dioxus-ui |
| 2 | Project Stack | 3 | PURGER — doublon CLAUDE.md "Stack technique" |
| 3 | MGE -- Game Engine | 16 | EXTRAIRE → `memory/mge.md` |
| 4 | MGE Architecture | 10 | EXTRAIRE → `memory/mge.md` (fusionner avec #3) |
| 5 | MGE Render Reforge | 17 | EXTRAIRE → `memory/mge.md` (fusionner avec #3) |
| 6 | LLM Integration | 6 | GARDER dans MEMORY.md (resume 2 lignes) |
| 7 | Service Market | 4 | GARDER dans MEMORY.md (resume 1 ligne) |
| 8 | Patterns confirmes | 13 | EXTRAIRE → `memory/patterns-and-lessons.md` |
| 9 | Erreurs a ne pas repeter | 8 | EXTRAIRE → `memory/patterns-and-lessons.md` |
| 10 | Miyuki UI Library | 19 | EXTRAIRE → `memory/miyuki-ui.md` |
| 11 | MiyuCloud | 14 | EXTRAIRE → `memory/miyucloud.md` |
| 12 | Agent Certifications | 20 | EXTRAIRE → `memory/certifications.md` |
| 13 | Couverture MSCM | 7 | GARDER dans MEMORY.md (resume 2 lignes) |
| 14 | Services enregistres | 3 | GARDER dans MEMORY.md (1 ligne) |
| 15 | Apps standalone | 3 | PURGER — information structurelle du workspace |
| 16 | MIP v2 | 28 | PURGER — doublon massif CLAUDE.md |
| 17 | MASS | 7 | GARDER dans MEMORY.md (resume 2 lignes, INCLURE les 3 lignes tronquees) |

### 4.2 Doublons identifies avec CLAUDE.md

| Contenu | MEMORY.md | CLAUDE.md | Action |
|---------|-----------|-----------|--------|
| Pieges RSX | Section 1 (7l) | "Pieges RSX" (3l) | Purger de MEMORY |
| Stack technique | Section 2 (3l) | "Stack technique" (6l) | Purger de MEMORY |
| Equipe agents | Section 16 (1l) | "Equipe dev" (table) | Purger de MEMORY |
| Classification T1-T5 | Section 16 (2l) | "Classification" (table) | Purger de MEMORY |
| Phases P0-P6 | Section 16 (15l) | "P0", "Execution" | Purger de MEMORY |
| Artefacts MIP | Section 16 (7l) | "Artefacts MIP" | Purger de MEMORY |
| MASS description | Section 17 (2l) | "MASS" dans MIP v2 | Garder les metriques (pas dans CLAUDE.md) |

## 5. Strategie retenue : C — Extraction hybride ciblee

**Justification** : La strategie C offre le meilleur equilibre entre lisibilite
(MEMORY.md reste un index navigable avec micro-resumes), maintenabilite (6 fichiers
topic de taille raisonnable), et marge de croissance (~125 lignes disponibles).

### 5.1 Fichiers a creer (4 nouveaux)

| Fichier | Contenu source | Lignes estimees |
|---------|---------------|-----------------|
| `memory/mge.md` | Sections 3+4+5 | ~50 |
| `memory/miyuki-ui.md` | Section 10 | ~22 |
| `memory/miyucloud.md` | Section 11 | ~16 |
| `memory/certifications.md` | Section 12 | ~22 |

### 5.2 Fichier a renommer et enrichir (1)

| Ancien | Nouveau | Contenu ajoute | Lignes estimees |
|--------|---------|---------------|-----------------|
| `memory/mip-antipatterns.md` | `memory/patterns-and-lessons.md` | + Section 8 (patterns) + Section 9 (erreurs) | ~70 |

### 5.3 Fichier a recrire (1)

| Fichier | Etat actuel | Etat cible |
|---------|-------------|------------|
| `memory/MEMORY.md` | 203 lignes, 17 sections, doublons | ~65-75 lignes, index pur |

### 5.4 Structure cible de MEMORY.md

```markdown
# Miyukini COG -- Memory

## Index des fichiers topic

| Fichier | Sujet | Derniere MAJ |
|---------|-------|-------------|
| memory/mge.md | MGE Game Engine (decisions, archi, render) | 2026-03 |
| memory/miyuki-ui.md | Miyuki UI Library (tokens, dioxus, egui) | 2026-03 |
| memory/miyucloud.md | MiyuCloud (crypto, P2P, defauts) | 2026-03 |
| memory/certifications.md | 37 certifications, 10 agents | 2026-03 |
| memory/patterns-and-lessons.md | Patterns confirmes + erreurs + anti-patterns | 2026-03 |

## LLM Integration (confirmed Feb 2026)
[2 lignes resume + pointeur]

## Service Market (confirmed Feb 2026)
[1 ligne resume]

## Couverture MSCM (Mar 2026)
[2 lignes resume]

## Services enregistres dans Central (Mar 2026)
[1 ligne liste]

## MASS -- Miyukini Agent Swarm System (confirmed Mar 2026)
[3 lignes resume INCLUANT les metriques tronquees]
```

**Estimation** : ~65-75 lignes. Marge de croissance : ~125 lignes pour les futurs chantiers.

## 6. Risques et mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Perte d'information pendant le deplacement | Faible | Eleve | Diff avant/apres, checklist section par section |
| Fichier `mip-antipatterns.md` reference dans d'autres fichiers | Moyen | Moyen | Grep references avant renommage, mettre a jour les pointeurs (MGE Render Reforge section 5 ligne 61) |
| Agents ne trouvent pas les topic files | Faible | Moyen | Index dans MEMORY.md avec chemins complets |
| Desynchronisation index vs topics | Moyen | Faible | Convention : toujours MAJ l'index quand on MAJ un topic |
| Contenu des topics depasse a son tour la taille utile | Faible | Faible | Plafonner chaque topic a 60 lignes, subdiviser si besoin |

## 7. Plan de taches

| # | Tache | Agent | Fichier(s) | Deps |
|---|-------|-------|-----------|------|
| 1 | Creer `memory/mge.md` (sections 3+4+5) | Arianne | mge.md | - |
| 2 | Creer `memory/miyuki-ui.md` (section 10) | Arianne | miyuki-ui.md | - |
| 3 | Creer `memory/miyucloud.md` (section 11) | Arianne | miyucloud.md | - |
| 4 | Creer `memory/certifications.md` (section 12) | Arianne | certifications.md | - |
| 5 | Renommer + enrichir `mip-antipatterns.md` → `patterns-and-lessons.md` (sections 8+9 + existant) | Arianne | patterns-and-lessons.md | - |
| 6 | Grep references a `mip-antipatterns.md` dans tout le workspace et MAJ | Arianne | divers | 5 |
| 7 | Recrire MEMORY.md en index pur | Arianne | MEMORY.md | 1-5 |
| 8 | Verification : compter lignes, verifier zero perte, zero doublon | George | tous | 7 |

**Parallelisme** : Taches 1-5 sont independantes (fichiers disjoints) → parallelisables.
Tache 6 depend de 5. Tache 7 depend de 1-5. Tache 8 depend de 7.

**DAG en 4 vagues** :
- Vague 1 : taches 1, 2, 3, 4, 5 (paralleles, 5 fichiers disjoints)
- Vague 2 : tache 6 (MAJ references)
- Vague 3 : tache 7 (recriture MEMORY.md)
- Vague 4 : tache 8 (verification)

## 8. Estimation budget

| Poste | Optimiste | Pessimiste |
|-------|-----------|------------|
| Tokens totaux | ~8 000 | ~15 000 |
| Duree effective | 15 min | 30 min |
| Fichiers touches | 7 | 9 |
| Lignes ecrites | ~250 | ~320 |

## 9. Mode d'autonomie recommande

**FULL** — Ce chantier est purement documentaire, sans impact sur le code ni sur
les builds. Le risque est faible. Les criteres de succes sont objectivement
mesurables (nombre de lignes, zero doublon). L'autopilot complet est adapte.

## 10. Approbation requise

- [ ] Brief approuve par l'utilisateur
- [ ] Strategie C confirmee
- [ ] Mode autonomie FULL confirme

---

*Brief redige par Maria — 2026-03-02*
*Classification T3 confirmee (5-10 fichiers, refactorisation moderee)*
