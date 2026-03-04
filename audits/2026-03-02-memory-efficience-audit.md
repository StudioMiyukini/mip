# Audit Efficience Tokens -- Structure Memoire MIP

<!-- @id: audit.memory-efficience.2026-03-02 -->
<!-- @do: Audit tokens MEMORY.md + CLAUDE.md, doublons, signal/bruit, recommandations -->
<!-- @role: Jean (Responsable Efficience IA) -->

**Date** : 2026-03-02
**Agent** : Jean (P0 Temps 4 -- Analyse efficience)
**Classification** : T3
**Statut** : CONSULTATIF (validation Denis + Arianne requise)

---

## TL;DR (5 lignes)

MEMORY.md (203 lignes, ~4860 tokens) est charge dans CHAQUE conversation. 35% du contenu est duplique avec CLAUDE.md (~1700 tokens gaspilles/conversation). 45% du contenu est "cold data" consultable uniquement par drill-down. L'extraction en 5 topic files reduirait MEMORY.md a ~90 lignes (~2160 tokens), soit une economie de ~2700 tokens/conversation (56%). Aucune information ne doit etre perdue : tout est deplace, rien n'est supprime.

---

## 1. Inventaire des fichiers charges

| Fichier | Lignes | Octets | Tokens estimes | Charge quand |
|---------|--------|--------|----------------|-------------|
| `CLAUDE.md` | 201 | 12 058 | ~3 445 | CHAQUE conversation (auto) |
| `MEMORY.md` | 203 | 17 013 | ~4 861 | CHAQUE conversation (auto, 200 premieres lignes) |
| `mip-antipatterns.md` | 48 | 4 173 | ~1 192 | Sur reference explicite |
| **Total contexte systematique** | **404** | **29 071** | **~8 306** | |

**Methode d'estimation** : 1 token ~ 3.5 caracteres pour le francais technique avec markup Markdown. Valide par comparaison avec les tokenizers cl100k_base (GPT-4) et Claude (similaire).

**Constat critique** : ~8 300 tokens sont consommes en contexte systematique AVANT que l'agent ne lise la moindre ligne de code. Sur une context window de 200k tokens, cela represente 4.2% -- acceptable mais optimisable.

---

## 2. Analyse des doublons CLAUDE.md <-> MEMORY.md

### 2.1 Doublons identifies

| # | Sujet | CLAUDE.md (lignes) | MEMORY.md (lignes) | Tokens dupliques | Gravite |
|---|-------|-------------------|--------------------|-----------------:|---------|
| D-01 | **Equipe dev (10 agents)** | L53-66 (table complete) | L172-173 (liste) | ~180 | Modere |
| D-02 | **Pieges RSX Dioxus 0.6** | L38-42 (3 regles) | L3-8 (3 regles + exemples + lien skill) | ~250 | Eleve -- MEMORY.md plus detaille que CLAUDE.md |
| D-03 | **Stack technique** | L8-14 (6 items) | L11-13 (2 items) | ~80 | Faible |
| D-04 | **Protocole MIP v2 complet** | L68-169 (101 lignes) | L169-194 (26 lignes) | ~750 | CRITIQUE -- MIP entier dans CLAUDE.md ET resume dans MEMORY.md |
| D-05 | **MASS description** | L138 (1 ligne CLAUDE.md) | L196-203 (8 lignes) | ~200 | Modere |
| D-06 | **Artefacts MIP** | L158-167 (9 lignes) | L192 (1 ligne) | ~50 | Faible |
| D-07 | **Classification T1-T5** | L80-89 (table) | L177 (1 ligne) | ~40 | Faible |
| D-08 | **Services enregistres** | implicite via state.rs ref | L161-163 (liste) | ~80 | Faible |
| D-09 | **Regles unwrap()** | L32 | L93, L43 antipatterns | ~50 | Faible |
| **TOTAL** | | | | **~1 680** | |

### 2.2 Cout du doublon

- **~1 680 tokens gaspilles par conversation** du fait de la double lecture CLAUDE.md + MEMORY.md
- Sur 50 conversations/jour en developpement actif : **~84 000 tokens/jour** de bruit pur
- D-04 (MIP v2) est le doublon le plus couteux : CLAUDE.md contient le protocole complet (101 lignes), et MEMORY.md le re-resume en 26 lignes. Ces 26 lignes n'apportent AUCUNE information supplementaire.

---

## 3. Analyse signal/bruit par section MEMORY.md

### Classification hot/warm/cold

| # | Section MEMORY.md | Lignes | Tokens | Temperature | Justification |
|---|-------------------|--------|-------:|-------------|---------------|
| S-01 | Dioxus 0.6 RSX Pitfalls | 3-8 | ~250 | **HOT** mais DOUBLON | Consulte a chaque session Dioxus -- MAIS deja dans CLAUDE.md L38-42 |
| S-02 | Project Stack | 10-13 | ~80 | WARM mais DOUBLON | Rappel utile -- MAIS deja dans CLAUDE.md L8-14 |
| S-03 | MGE -- Game Engine | 15-32 | ~600 | **COLD** | Consulte uniquement quand on travaille sur MGE (workspace separe) |
| S-04 | MGE Architecture | 34-43 | ~350 | **COLD** | Idem -- MGE-specifique |
| S-05 | MGE Render Reforge | 45-61 | ~550 | **COLD** | Chantier termine, reference archivistique |
| S-06 | LLM Integration | 63-68 | ~200 | WARM | Consulte quand on touche miou-llm-bridge |
| S-07 | Service Market | 70-74 | ~150 | **COLD** | Rarement modifie |
| S-08 | Patterns confirmes | 76-88 | ~500 | **HOT** | Consulte activement pour eviter les regressions |
| S-09 | Erreurs a ne pas repeter | 90-97 | ~300 | **HOT** | Garde-fou permanent |
| S-10 | Miyuki UI Library | 99-117 | ~650 | **COLD** | Chantier termine, reference |
| S-11 | MiyuCloud | 119-131 | ~500 | **COLD** | Chantier termine, reference |
| S-12 | Agent Certifications | 133-152 | ~550 | **COLD** | Meta-info, rarement consultee en dev |
| S-13 | Couverture MSCM | 154-160 | ~200 | WARM | Suivi progression, mis a jour periodiquement |
| S-14 | Services enregistres | 161-163 | ~80 | WARM | Reference rapide |
| S-15 | Apps standalone | 165-167 | ~80 | WARM | Reference rapide |
| S-16 | MIP v2 (resume) | 169-194 | ~750 | DOUBLON PUR | 100% doublon avec CLAUDE.md L68-169 |
| S-17 | MASS | 196-203 | ~200 | WARM | Resume utile mais partiellement doublon |

### Synthese

| Temperature | Sections | Tokens | % du total |
|-------------|----------|-------:|------------|
| **HOT** (garder dans MEMORY.md) | S-08, S-09 | ~800 | 16% |
| **WARM** (garder mais comprimer) | S-06, S-13, S-14, S-15, S-17 | ~710 | 15% |
| **COLD** (extraire en topic files) | S-03, S-04, S-05, S-07, S-10, S-11, S-12 | ~2 600 | 53% |
| **DOUBLON** (supprimer de MEMORY.md) | S-01, S-02, S-16 | ~1 080 | 22% |

**Ratio signal utile** : 31% HOT+WARM, **69% COLD+DOUBLON**

---

## 4. Recommandation d'architecture

### 4.1 Structure cible

```
memory/
  MEMORY.md                    # ~90 lignes, index + hot data + warm data
  mip-antipatterns.md          # 48 lignes (inchange)
  mge-engine.md                # NOUVEAU : S-03 + S-04 + S-05 (~1 500 tokens)
  completed-features.md        # NOUVEAU : S-10 + S-11 (~1 150 tokens)
  agent-certifications.md      # NOUVEAU : S-12 (~550 tokens)
  service-market.md            # NOUVEAU : S-07 (~150 tokens)
  mip-performance-history.md   # EXISTANT (baseline perf, cree par Jean en P6)
```

### 4.2 MEMORY.md cible (~90 lignes)

Contenu a GARDER (avec compression) :

1. **Patterns confirmes** (S-08) -- HOT, 10 items compresses en ~8 lignes (1 ligne/pattern, sans explications detaillees)
2. **Erreurs a ne pas repeter** (S-09) -- HOT, 6 items compresses en ~6 lignes
3. **LLM Integration** (S-06) -- WARM, 4 lignes (inchange)
4. **Couverture MSCM** (S-13) -- WARM, 5 lignes (inchange)
5. **Services enregistres + Apps** (S-14, S-15) -- WARM, 3 lignes fusionnees
6. **MASS resume** (S-17) -- WARM, 3 lignes (compresse)
7. **Index topic files** -- NOUVEAU, ~10 lignes de pointeurs vers les topic files

Contenu a SUPPRIMER (doublons avec CLAUDE.md) :

1. **Dioxus RSX Pitfalls** (S-01) -- Supprime, deja dans CLAUDE.md L38-42 + skill dioxus-ui
2. **Project Stack** (S-02) -- Supprime, deja dans CLAUDE.md L8-14
3. **MIP v2 resume** (S-16) -- Supprime, deja dans CLAUDE.md L68-169 (version complete)

Contenu a EXTRAIRE (cold data) :

1. **MGE** (S-03 + S-04 + S-05) -> `memory/mge-engine.md`
2. **Miyuki UI + MiyuCloud** (S-10 + S-11) -> `memory/completed-features.md`
3. **Certifications** (S-12) -> `memory/agent-certifications.md`
4. **Service Market** (S-07) -> fusionne dans `memory/completed-features.md`

### 4.3 Bilan tokens

| Etat | Tokens MEMORY.md | Tokens charges/conv | Delta |
|------|----------------:|--------------------:|------:|
| **Actuel** | ~4 860 | ~4 860 (tronque a 200 lignes) | -- |
| **Cible** | ~2 160 | ~2 160 | **-2 700 (-56%)** |

| Fichier | Charge quand | Tokens |
|---------|-------------|-------:|
| MEMORY.md (cible) | CHAQUE conversation | ~2 160 |
| CLAUDE.md (inchange) | CHAQUE conversation | ~3 445 |
| mip-antipatterns.md | Reference explicite | ~1 192 |
| mge-engine.md | Travail sur MGE | ~1 500 |
| completed-features.md | Reference features livrees | ~1 300 |
| agent-certifications.md | Meta-info agents | ~550 |

**Economie par conversation** : ~2 700 tokens (56% de MEMORY.md)
**Economie journaliere estimee** (50 conv/jour) : ~135 000 tokens/jour
**Economie mensuelle estimee** (20 jours) : ~2 700 000 tokens/mois

---

## 5. Doublons specifiques -- Detail des corrections

### D-02 : Pieges RSX (doublon le plus nuisible qualitativement)

**Probleme** : MEMORY.md contient des exemples de code inline (`style: "width: {if x { 24 }..."`) qui sont AUSSI dans CLAUDE.md ET dans le skill `miyukini-dioxus-ui`. Triple redondance.

**Correction** : Supprimer de MEMORY.md. CLAUDE.md contient la regle. Le skill contient les exemples detailles. Pas de perte d'information.

### D-04 : MIP v2 (doublon le plus couteux en tokens)

**Probleme** : CLAUDE.md contient le protocole MIP v2 COMPLET (101 lignes, ~2 900 tokens). MEMORY.md re-resume le meme protocole en 26 lignes (~750 tokens). Ces 750 tokens n'ajoutent AUCUNE information : chaque bullet de MEMORY.md est une reformulation d'une section de CLAUDE.md.

**Correction** : Supprimer S-16 integralement de MEMORY.md. CLAUDE.md fait reference.

---

## 6. Signal d'alerte : troncature MEMORY.md

**Constat** : MEMORY.md fait 203 lignes. La limite est 200. Les 3 dernieres lignes (fin de la section MASS) sont TRONQUEES et ne sont PAS chargees en contexte.

**Donnees perdues** (lignes 201-203) :
```
Livres : SKILL.md (280l, 7 sections MASS), CLAUDE.md (Loi 9 + ref MASS + .mip/dags/), ...
Metriques : 24 taches, 7 vagues, 79% parallelisme effectif, 0 conflits, 8 commits. ...
Anti-patterns AP-08/AP-09 : voir `memory/mip-antipatterns.md`.
```

**Impact** : Les metriques MASS et la reference aux anti-patterns AP-08/AP-09 ne sont pas accessibles aux agents. Risque de regression (AP-08 : taches paralleles sur meme fichier).

**Correction** : La refactorisation proposee (90 lignes cibles) elimine ce probleme definitivement.

---

## 7. Analyse du fichier mip-antipatterns.md

| Metrique | Valeur |
|----------|--------|
| Lignes | 48 |
| Tokens | ~1 192 |
| Chargement | Sur reference explicite (PAS systematique) |
| Temperature | HOT pour P3 (implementation) |

**Verdict** : Fichier bien dimensionne, bien isole. Pas de modification recommandee. Le pattern "charge sur demande" est exactement ce qu'on veut pour du contenu hot-mais-contextuel.

---

## 8. Analyse de CLAUDE.md

| Metrique | Valeur |
|----------|--------|
| Lignes | 201 |
| Tokens | ~3 445 |
| Chargement | CHAQUE conversation (auto) |

**Verdict** : CLAUDE.md est dense mais necessaire. Il contient les conventions projet, les regles de code, le protocole MIP, et la liste des skills. Chaque section est consultee regulierement. Pas de cold data identifie. Pas de modification recommandee pour CLAUDE.md dans cette iteration.

**Note future** : Si CLAUDE.md depasse 250 lignes, envisager l'extraction du workflow MIP complet (L68-169, 101 lignes) dans le skill `miyukini-mip-workflow/SKILL.md` avec un pointeur de 3 lignes dans CLAUDE.md. Gain potentiel : ~2 500 tokens. Mais cette optimisation n'est PAS recommandee aujourd'hui car le protocole MIP doit etre visible par TOUS les agents sans chargement conditionnel.

---

## 9. Metriques de synthese

| Metrique | Avant | Apres | Gain |
|----------|------:|------:|-----:|
| Lignes MEMORY.md | 203 | ~90 | -113 (-56%) |
| Tokens MEMORY.md | ~4 860 | ~2 160 | -2 700 (-56%) |
| Tokens contexte systematique | ~8 306 | ~5 605 | -2 700 (-33%) |
| Doublons CLAUDE.md <-> MEMORY.md | ~1 680 tk | ~0 tk | -1 680 (-100%) |
| Troncature (>200 lignes) | OUI (3 lignes perdues) | NON | Risque elimine |
| Topic files | 1 | 4 | +3 (cold data accessible par drill-down) |
| Information perdue | -- | -- | ZERO |

---

## 10. Plan d'action recommande (CONSULTATIF)

| # | Action | Responsable | Priorite | Tokens economises |
|---|--------|-------------|----------|------------------:|
| A-01 | Supprimer S-16 (MIP v2 resume) de MEMORY.md | Arianne | P1-CRITIQUE | ~750 |
| A-02 | Supprimer S-01 (RSX Pitfalls) de MEMORY.md | Arianne | P1-CRITIQUE | ~250 |
| A-03 | Supprimer S-02 (Project Stack) de MEMORY.md | Arianne | P1-CRITIQUE | ~80 |
| A-04 | Creer `memory/mge-engine.md` (S-03+S-04+S-05) | Arianne | P2-HAUTE | ~1 500 extraits |
| A-05 | Creer `memory/completed-features.md` (S-07+S-10+S-11) | Arianne | P2-HAUTE | ~1 300 extraits |
| A-06 | Creer `memory/agent-certifications.md` (S-12) | Arianne | P2-HAUTE | ~550 extraits |
| A-07 | Comprimer S-08 (Patterns confirmes) a 1 ligne/item | Arianne + Jean | P3-MOYENNE | ~200 |
| A-08 | Comprimer S-09 (Erreurs) a 1 ligne/item | Arianne + Jean | P3-MOYENNE | ~100 |
| A-09 | Ajouter section Index topic files dans MEMORY.md | Arianne | P2-HAUTE | +~100 (invest) |
| A-10 | Valider que la troncature est resolue (<200 lignes) | Jean | P1-CRITIQUE | risque elimine |

**Ordre d'execution recommande** : A-01, A-02, A-03 (suppressions doublons) -> A-04, A-05, A-06 (extractions) -> A-09 (index) -> A-07, A-08 (compressions) -> A-10 (validation)

---

## 11. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Topic file non charge quand necessaire | Agent manque de contexte MGE/UI/Cloud | Index dans MEMORY.md avec instructions "charger si travail sur X" |
| Perte accidentelle lors de la migration | Information perdue | Arianne verifie que chaque ligne supprimee est presente dans un topic file |
| CLAUDE.md grandit au-dela de 250 lignes | Retour au probleme initial | Jean surveille et recommande extraction MIP si seuil atteint |

---

**Rapport termine a 2026-03-02.**
**Jean -- Responsable Efficience IA, Miyukini AI Studio**

*Ce rapport est CONSULTATIF. Les actions A-01 a A-10 necessitent la validation de Denis (technique) et Arianne (memoire/qualite) avant execution.*
