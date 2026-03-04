<!-- @id cert.lise.iso_9241 -->
<!-- @do provide_iso9241_reference_knowledge -->
<!-- @role ergonomics -->
<!-- @layer reference -->
<!-- @human Referentiel ISO 9241 pour Lise -->

# ISO 9241 — Referentiel Lise

> **TL;DR** : Norme internationale d'ergonomie de l'interaction homme-systeme. Part 110 definit 7 principes d'interaction, Part 210 le processus de conception centree utilisateur. Reference Lise pour concevoir des interfaces efficaces, efficientes et satisfaisantes dans les apps Dioxus et le design system miyuki-ui.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | ISO TC 159/SC 4 |
| Obligation | Volontaire (reference standard en ergonomie IHM) |
| Validite | Permanente (Part 110: 2020, Part 210: 2019) |
| Prerequis | Aucun |

## Domaine d'application

Serie de normes couvrant l'ergonomie de l'interaction homme-systeme. Applicable a tout systeme interactif (desktop, web, mobile, jeux). Definit les principes d'interaction (Part 110), le processus de conception centree utilisateur (Part 210) et la definition de l'utilisabilite (Part 11).

## Definition de l'utilisabilite (Part 11:2018)

| Composante | Definition | Mesure |
|------------|-----------|--------|
| **Effectiveness** | Precision et completude avec lesquelles les utilisateurs atteignent leurs objectifs | Taux de reussite de la tache |
| **Efficiency** | Ressources depensees par rapport aux resultats obtenus | Temps de completion, nombre de clics |
| **Satisfaction** | Absence d'inconfort et attitudes positives envers l'utilisation | Questionnaire (SUS, CSUQ, UEQ) |

## 7 principes d'interaction (Part 110:2020)

| # | Principe | Description | Indicateurs |
|---|----------|-------------|-------------|
| 1 | **Suitability for the task** | Le systeme aide l'utilisateur a accomplir sa tache | Pas d'etapes inutiles, champs pertinents, valeurs par defaut |
| 2 | **Self-descriptiveness** | Chaque etape est compréhensible sans aide externe | Labels clairs, feedback immediat, etat visible |
| 3 | **Conformity with expectations** | Le comportement correspond aux attentes de l'utilisateur | Conventions respectees, coherence, previsibilite |
| 4 | **Learnability** | Le systeme guide l'apprentissage et la decouverte | Onboarding, aide contextuelle, progressive disclosure |
| 5 | **Controllability** | L'utilisateur garde le controle de l'interaction | Undo/redo, annulation, navigation libre, pas de blocage |
| 6 | **Error tolerance** | Le systeme previent les erreurs ou permet la correction | Validation en temps reel, confirmation destructive, recovery |
| 7 | **User engagement** | L'interaction est motivante et satisfaisante | Esthetique, micro-interactions, feedback positif |

## Processus de conception centree utilisateur (Part 210:2019)

| Phase | Activite | Livrables |
|-------|----------|-----------|
| **1. Comprendre le contexte** | Analyser utilisateurs, taches, environnement, contraintes | Personas, scenarios d'usage, analyse de taches |
| **2. Specifier les exigences** | Definir exigences utilisabilite, experience, accessibilite | User stories, criteres d'acceptance UX |
| **3. Produire des solutions** | Concevoir wireframes, prototypes, design system | Maquettes, prototypes interactifs, tokens UI |
| **4. Evaluer** | Tester avec des utilisateurs, mesurer utilisabilite | Tests utilisateur, metriques SUS/UEQ, heuristiques |
| *Iterer* | Revenir a l'etape pertinente selon les resultats | Design mis a jour, specifications revisees |

## Principes supplementaires (Parts 12x, 14x, 15x)

| Part | Sujet | Points cles |
|------|-------|-------------|
| 125 | Presentation de l'information | Clarte, discriminabilite, concision, coherence |
| 143 | Formulaires | Groupement logique, labels, validation, navigation |
| 151 | Contenu web | Structure, navigation, recherche, aide |
| 161 | Elements visuels | Icones, couleurs, typographie, mise en page |
| 171 | Accessibilite logicielle | Recouvre WCAG, principes accessibilite |

## Checklist Lise

- [ ] Analyse de taches : identifier les workflows utilisateur principaux avant le design
- [ ] Contexte utilisateur : documenter qui, quoi, ou, comment (personas, environnement)
- [ ] Suitability for task : chaque ecran ne contient que les elements necessaires a la tache
- [ ] Self-descriptiveness : labels explicites, feedback immediat, etats visibles
- [ ] Conformity with expectations : conventions UI respectees, coherence inter-ecrans
- [ ] Learnability : onboarding pour premieres utilisations, aide contextuelle disponible
- [ ] Controllability : undo/redo, annulation possible, navigation libre entre ecrans
- [ ] Error tolerance : validation inline, confirmation avant actions destructives
- [ ] User engagement : esthetique coherente (tokens), micro-interactions, feedback positif
- [ ] Evaluation : test utilisateur en P5, questionnaire satisfaction, metriques utilisabilite
- [ ] Design iteratif : incorporer feedback P5 dans le cycle suivant

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Concevoir sans analyser les taches | Toujours commencer par comprendre les workflows utilisateur (Phase 1) |
| Interface surchargee | Un ecran = une tache principale (suitability for task) |
| Feedback absent | Chaque action = retour visuel immediat (self-descriptiveness) |
| Comportement inattendu | Respecter les conventions de la plateforme (conformity) |
| Pas de possibilite d'annulation | Undo/redo sur toute action reversible (controllability) |
| Erreurs sans aide a la correction | Message d'erreur + suggestion + mise en evidence du champ (error tolerance) |
| Design final sans test utilisateur | Evaluer avec de vrais utilisateurs a chaque iteration (Part 210 Phase 4) |

## Application Miyukini

| Concept ISO 9241 | Application projet |
|------------------|-------------------|
| Utilisabilite (Part 11) | Mesuree en P5 : taux reussite + temps + satisfaction |
| Suitability for task | Layout organisms miyuki-ui : un objectif par template |
| Self-descriptiveness | Atoms Label, FormField avec feedback states (error, success, loading) |
| Conformity | COG_THEME coherent, Atomic Design hierarchie stricte |
| Learnability | Progressive disclosure dans organisms complexes (Sidebar, Settings) |
| Controllability | Undo pattern dans miyucloud (corbeille, restauration), navigation breadcrumb |
| Error tolerance | Molecules FormField : validation inline, messages correctifs |
| User engagement | D2_THEME medieval immersif (MGE), micro-animations Dioxus |
| Part 210 Phase 1 | P0 Temps 1 Maria : exploration + questionnaire brainstorming |
| Part 210 Phase 2 | P0 Temps 2 Lise : ideation + user stories |
| Part 210 Phase 3 | P3 Lise : implementation composants miyuki-ui-dioxus |
| Part 210 Phase 4 | P5 test humain + questionnaire + metriques |
| Iteration | Boucle MIP si refus P5 → retour P0 avec feedback |

---

*Sources : ISO 9241-11:2018, ISO 9241-110:2020, ISO 9241-210:2019, ISO 9241-125:2017, ISO 9241-171:2008*
