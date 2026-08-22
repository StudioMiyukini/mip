<!-- @id mip.doc.guide
     @do expliquer_l_usage_de_mip_studio_a_quelqu_un_qui_arrive
     @role config
     @layer doc
     @human Le guide d'utilisation : à quoi ça sert, comment s'en servir, et ce que ça ne fait pas -->

# Guide d'utilisation

## Ce que le cadrage vous apporte

Une IA travaille avec ce qu'on lui donne. Trois phrases suffisent à la lancer ;
elles ne suffisent pas à lui dire pour qui c'est, jusqu'où aller, ni ce qui
compte le plus. Ces réponses-là, personne d'autre que vous ne les a — et dès
qu'elle les reçoit, elle vise juste du premier coup.

**MIP Studio pose les questions qu'un chef de projet poserait, et met vos
réponses dans une forme qu'un agent suit.** Le même modèle, mieux dirigé, va
beaucoup plus loin.

## En cinq minutes

1. **Décrivez votre projet** dans la grande zone de texte, comme vous le diriez
   à quelqu'un. Deux ou trois phrases suffisent.
2. **Répondez aux quatre questions** de l'étage 1.
3. **Copiez le prompt** à droite, collez-le dans Claude, ChatGPT, Cursor,
   Copilot — n'importe lequel.

C'est tout. Les étages 2 et 3 existent pour les projets qui le méritent ; vous
n'êtes pas obligé d'y aller.

## Ce que ça doit produire

Juste sous la description, deux rangées de tags — et **c'est la question que le
protocole ne pose pas**. Ses questions portent sur le pourquoi et le pour qui ;
aucune ne demande ce qu'on obtient à la fin. Un agent qui l'ignore choisit à
votre place, et il choisit du code.

Les formats sont rangés en trois familles :

| Famille | Exemples | Ce que ça change |
| --- | --- | --- |
| **Ce qui s'exécute** | application, API, jeu, bot, greffon, script | tests obligatoires, branche Git, balisage du code |
| **Ce qui se lit** | PDF, Word, support de cours, procédure, rapport | pas de tests : une relecture à chaque étape |
| **Ce qui se regarde** | diagramme, maquette, charte graphique | même régime que ci-dessus — on valide la trame avant le contenu |

La seconde rangée, **avec quoi**, liste les techniques. Laissez-la vide si ce
n'est pas du code. Cochez **« À décider »** pour que l'agent propose une pile
avec son coût au lieu d'en supposer une.

Un projet peut cocher dans plusieurs familles : une application *et* sa
documentation, c'est le cas courant.

## Les trois étages

| Étage | Ce qu'on demande | Ce que vous gagnez |
| --- | --- | --- |
| **1 — l'essentiel** | 4 questions | un prompt **déjà utilisable** |
| **2 — le cadrage** | les questions de votre classe | l'agent sait où s'arrêter |
| **3 — le détail** | les nuances, l'équipe, les référentiels | tout ce que le protocole sait faire |

**Vous pouvez vous arrêter à n'importe quel étage et copier.** C'est prévu, pas
toléré : un cadrage à l'étage 1 vaut déjà beaucoup mieux qu'une discussion
libre.

La barre en haut est cliquable dans les deux sens — on peut revenir.

### Pourquoi ces quatre questions-là

| Question | Ce qu'elle empêche |
| --- | --- |
| **Quel problème ça résout ?** | que l'agent construise la mauvaise chose, très bien |
| **Qui est l'utilisateur final ?** | qu'il conçoive pour vous alors que c'est pour un autre |
| **Ce qui est inclus et exclu** | qu'il déborde, et vous fasse relire du code inutile |
| **La version minimale** | qu'il commence par la fin |

Quatre angles : le besoin, la cible, la limite, le premier pas.

## Les réponses proposées

Quand vous décrivez votre projet, l'outil **propose** des réponses à partir de
votre texte. Elles apparaissent dans des champs **hachurés**, avec un bandeau.

> **Une proposition n'est pas une réponse.** Tant que vous n'avez pas cliqué sur
> « C'est juste » — ou modifié le texte — elle ne compte pas : elle n'entre pas
> dans le prompt, et la question reste dans la liste de ce qui n'a pas été
> tranché.

Ce n'est pas de la prudence excessive. Sur notre premier essai réel, le modèle a
inventé le sens de deux sigles et un public qui n'existait pas — **en dépit
d'une consigne explicite de ne rien inventer**. Une invention est plausible,
bien écrite, et occupe le champ exactement comme une vraie réponse. Relisez.

Les propositions arrivent en quelques secondes, ou pas du tout si le modèle est
occupé. Le formulaire fonctionne sans elles.

## L'ampleur : T1 à T5

À l'étage 3, vous pouvez dire l'ampleur du projet. Elle décide du nombre de
questions **et** de ce que le prompt demandera à votre agent.

| Classe | Ce que c'est | Questions posées |
| --- | --- | --- |
| **T1** | un correctif d'une ligne | 4 |
| **T2** | un correctif ciblé, deux ou trois fichiers | 11 |
| **T3** | une fonctionnalité | 21 |
| **T4** | une fonctionnalité majeure | 31 |
| **T5** | un chantier | 32 |

**En cas de doute, montez d'un cran.** C'est la règle du protocole, et elle est
là parce qu'un projet sous-estimé se découvre au milieu, quand il est trop tard
pour cadrer.

## Ce que le prompt contient

Un document en Markdown qui dit à votre agent :

- **ce qu'il faut construire**, et pour qui ;
- **ce qui a été décidé**, avec vos mots ;
- **ce qui ne l'a pas été** — pour qu'il pose la question au lieu de deviner ;
- **où s'arrêter** et vous demander votre accord ;
- **quoi produire**, et sous quelle forme.

La section « ce qui n'a pas été tranché » est celle qu'on est tenté de retirer,
parce qu'elle fait désordre. Elle reste : *un cadrage muet sur le risque n'est
pas un cadrage sans risque, c'est un cadrage où personne n'a regardé.*

## Le compte

**Il n'est jamais nécessaire.** Vous pouvez tout faire sans vous inscrire — le
site est ouvert, il n'y a pas de mot de passe à l'entrée.

Il sert à une chose : retrouver vos cadrages plus tard. On garde votre adresse
et une empreinte de votre mot de passe, rien d'autre — et vous pouvez tout
emporter ou tout effacer d'un bouton. Voir [la
confidentialité](/confidentialite).

## Ce que MIP Studio n'est pas

- **Ce n'est pas un générateur de code.** Il ne produit rien d'exécutable.
- **Ce n'est pas un agent.** Il ne parle à aucune IA à votre place.
- **Ça ne remplace ni Claude Code, ni Cursor, ni Copilot.** Ça leur donne de
  quoi ne pas se tromper de projet.

MIP Studio prépare le travail. C'est votre IA qui le fait.

## Aller plus loin

- [Le protocole MIP](/protocole) — ce que signifient les phases, les classes et
  les rôles que le prompt évoque.
- [Le balisage MSCM](https://www.npmjs.com/package/@mip/mscm) — annoter son code
  pour qu'un agent s'y retrouve.
- [Pour développer](/developpement) — l'architecture, et comment contribuer.
