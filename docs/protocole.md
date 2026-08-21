<!-- @id mip.doc.protocole
     @do expliquer_le_protocole_mip_a_qui_recoit_un_prompt
     @role config
     @layer doc
     @human Le protocole MIP : les classes, les phases, les gates et les rôles -->

# Le protocole MIP

Le prompt que vous copiez parle de **classes**, de **phases**, de **gates** et
de **rôles**. Voici ce que ces mots veulent dire — et pourquoi ils y sont.

Vous n'avez pas besoin de lire cette page pour utiliser MIP Studio. Elle est là
pour le jour où votre agent dira « je m'arrête à la gate P3 » et où vous
voudrez savoir ce qu'il raconte.

## L'idée

Un projet mené en discussion libre échoue rarement d'un coup. Il dérive : une
hypothèse non dite au début devient une refonte à la fin.

Le protocole ne rend pas l'agent plus intelligent. Il **l'empêche d'avancer sans
avoir demandé**, et il rend visible ce qui n'a pas été décidé.

## Les classes — T1 à T5

Tout commence par une question : *quelle est l'ampleur ?* La réponse décide de
tout le reste.

| Classe | Critère | Ce qui s'applique |
| --- | --- | --- |
| **T1** | correctif, un fichier, moins de 20 lignes | on code, on livre |
| **T2** | correctif ciblé, 1 à 3 fichiers | un mini-plan d'abord |
| **T3** | fonctionnalité, 3 à 10 fichiers | cadrage complet |
| **T4** | fonctionnalité majeure, 10 fichiers et plus | cadrage complet |
| **T5** | chantier stratégique | cadrage complet |

**En cas de doute, un cran au-dessus.** Un T3 traité comme un T4 coûte quelques
questions ; un T4 traité comme un T3 coûte une refonte.

## Les phases

À partir de T3, le travail passe par des phases, dans cet ordre, sans saut :

```
P0  →  Git  →  P3  →  P4  →  P5  →  P6
```

| Phase | Ce qui s'y fait | Qui décide |
| --- | --- | --- |
| **P0** | le cadrage — c'est ce que MIP Studio produit | **vous** |
| **Git** | une branche dédiée | l'agent |
| **P3** | l'implémentation, en TDD | l'agent |
| **P4** | l'intégration et l'audit | l'agent |
| **P5** | la livraison, et **votre** test | **vous** |
| **P6** | le rapport et l'archivage | l'agent |

**P0 est la seule phase humaine**, et P5 la seule où l'on vous demande de
juger. Le reste, l'agent le fait — mais il s'arrête à chaque frontière si vous
le lui avez demandé.

## Les gates

Une gate est un point d'arrêt avec des critères explicites. Pas de passage sans
validation.

C'est ce que règle le **mode d'autonomie**, que vous choisissez à l'étage 3 :

| Mode | L'agent s'arrête | Pour qui |
| --- | --- | --- |
| **FULL** | seulement en P5 | vous connaissez le sujet, vous voulez la vitesse |
| **BIG_STEPS** | à chaque phase | le défaut raisonnable |
| **GUIDED** | à chaque étape du plan | vous découvrez, ou l'enjeu est fort |

En **GUIDED**, on reprend la main en cours d'implémentation. C'est le plus lent
et le seul qui le permette.

## Les rôles

Le protocole nomme onze rôles. **Ce ne sont pas des personnages à jouer** : ce
sont des jeux d'instructions qu'on charge au moment où ils servent, puis qu'on
décharge.

| Rôle | Ce qu'il porte |
| --- | --- |
| **Maria** | l'orchestration, et la classification |
| **Denis** | l'architecture et le plan |
| **Lise** · **François** | le front, le back |
| **Victor** | la sécurité |
| **George** | la conformité |
| **Hugo** | l'infrastructure |
| **Jean** | le coût en jetons |
| **Arianne** | la qualité et la mémoire |
| **Fabrice** | l'analyse concurrentielle |
| **Bob** | les tâches simples, en parallèle |

L'intérêt n'est pas la mise en scène : c'est qu'un contexte chargé pour la
sécurité ne traîne pas pendant l'implémentation. **Un contexte se paie à chaque
tour, pas une fois.**

## Le noyau immuable

Seize règles ne dépendent ni du projet, ni de la stack, ni de l'outil. Les plus
utiles à connaître :

- **Classification avant toute action.** Rien ne commence sans elle.
- **Aucun code avant que le cadrage soit approuvé.**
- **TDD obligatoire** dès qu'il y a du code : le test d'abord.
- **Métriques mesurées, jamais estimées.** Pas d'approximation dans un rapport.
- **Test humain obligatoire** en P5 : l'agent ne se donne pas son propre quitus.
- **Frein d'urgence** : arrêt après deux tentatives infructueuses sur le même
  point, plutôt qu'une troisième au hasard.

## Ce que le protocole ne fait pas

Il ne garantit pas que le projet est une bonne idée. Il garantit que si c'en est
une mauvaise, **vous vous en apercevrez au cadrage** plutôt qu'à la livraison.

## D'où ça vient

MIP est né d'un usage réel : piloter des agents sur des projets qui tournent en
production. Les décisions qu'il porte ne sont pas théoriques — la plupart sont
des défauts rencontrés, puis écrits pour ne pas les refaire.

C'est aussi pour ça que le prompt insiste tant sur ce qui **n'a pas** été
décidé : l'expérience dit que c'est là que ça casse.
