<!-- @id mip.doc.exemples
     @do montrer_des_cadrages_reels_et_le_prompt_qu_ils_produisent
     @role config
     @layer doc
     @human Deux exemples complets : ce qu'on répond, et ce qui en sort -->

# Deux exemples

Ce qu'on tape dans le formulaire, et ce qui en sort. **Les prompts ci-dessous
sont réels** : cette page est refabriquée par l'outil lui-même
(`node scripts/engendrer-exemples.mjs`), à partir des réponses montrées — ni
raccourcis, ni retouchés. Deux cas volontairement éloignés : un correctif d'une
ligne dans du code, et un livrable qui n'est pas du code du tout.

---

## Exemple 1 — un micro-fix (T1)

### Ce qu'on remplit

**Titre** — `Corriger le tri par date des factures`

**La demande**, en une phrase, comme on la dirait à un collègue :

> Sur la page des factures, le tri par colonne Date se fait dans le mauvais ordre depuis la refonte.

**Classe** T1 (un fichier, moins de vingt lignes) · **Mode** FULL (l'agent
enchaîne, une seule validation à la fin) · **Format** Application web ·
**Technique** TypeScript, React · **Équipe** Denis, Lise

Puis les quatre questions de l'essentiel :

| Question | Réponse |
| --- | --- |
| **1.1 · Quel problème ?** | Le tri par date range 10/01 avant 02/01 : les dates sont comparées comme du texte, pas comme des dates. |
| **1.3 · Qui est l'utilisateur ?** | La comptable, qui sort la liste du mois tous les 5. |
| **2.2 · Périmètre ?** | INCLUS : le comparateur de la colonne Date. EXCLUS : le reste du tableau, la pagination, les autres colonnes. |
| **5.1 · Minimum viable ?** | Un test qui reproduit l'ordre faux, puis le comparateur corrigé. |

### Ce qui en sort

8154 caractères, environ 9 k jetons.

<details>
<summary>Voir le prompt entier</summary>

````markdown
# Cadrage MIP — Corriger le tri par date des factures

> Ce document est un **cadrage de séquence MIP**. Il tient lieu de Temps 1 : les questions d'exploration ont déjà été posées et leurs réponses sont ci-dessous. Ne les repose pas. Ce qui est marqué « non renseigné » est un trou réel — demande-le avant de t'en passer.

## La demande

Sur la page des factures, le tri par colonne Date se fait dans le mauvais ordre depuis la refonte.

## Ce qu'il faut produire

- **Format** : Application web
- **Technique** : TypeScript, React

## Classification et conduite

- **Classe : T1** — Micro-fix, 1 fichier, <20 lignes
- **Phases** : P3 → P5
- **Mode d'autonomie : FULL** (Autonome) — L'agent enchaîne les phases sans s'arrêter. Une seule validation humaine, en P5.
- La classification a **déjà été tranchée** par le cadrage. Ne la recalcule pas ; si tu la crois fausse, dis-le et attends.

## Le protocole, en bref

Tu suis un protocole nommé MIP. Voici le strict nécessaire pour t'y tenir ; le reste se charge au fil des phases.

**Une gate est un point d'arrêt avec un critère explicite.** On ne la franchit pas parce que le travail semble fini : on la franchit parce que son critère est rempli. Un critère non rempli renvoie en arrière, il ne se contourne pas.

### Git — Ouverture de branche

Une branche `feat/<slug>` est créée. Rien n'est écrit sur la branche principale.

**Gate Git** — La branche existe et le dépôt est propre.

### P3 — Réalisation

Le travail se fait, tâche par tâche, selon le plan. Un point d'étape toutes les cinq tâches plutôt qu'un grand saut.

**Gate P3** — Chaque tâche passe ses vérifications avant que la suivante commence.

### P5 — Livraison et test humain

Le livrable est présenté à l'humain, qui l'essaie et rend un verdict : accepté, accepté avec réserves, ou refusé.

**Gate P5** — Le verdict humain. **Il est obligatoire** — un agent ne se décerne pas son propre quitus. Un refus renvoie au cadrage avec le motif.

Le vocabulaire est strict : chaque mot désigne un seul niveau.

- **Séquence** — un cycle complet, du cadrage au rapport
- **Phase** — P0, Git, P3, P4, P5, P6 — l'ordre ne se réarrange pas
- **Étape** — les groupes du plan de P3, et de P3 seulement
- **Volet** — les blocs internes de P4, P5 et P6
- **Tâche** — l'unité atomique — une tâche, un exécutant
- **Gate** — le point d'arrêt entre deux phases, avec un critère explicite

## Le noyau immuable

Ces règles ne dépendent ni du projet, ni de la stack, ni de l'outil. Elles s'appliquent telles quelles.

- **I-1** — Classification T1-T5 avant toute action _(Maria classifie, doute = un cran au-dessus)_
- **I-2** — Sequence de phases : P0 → Git → P3 → P4 → P5 → P6 (T3+) _(Pas de saut de phase, pas de reordonnancement)_
- **I-3** — P0 = seule phase humaine _(Aucun code avant brief approuve)_
- **I-4** — Brief lu par l'utilisateur AVANT choix d'autonomie _(L'utilisateur ne peut pas choisir FULL/BIG_STEPS/GUIDED sans avoir lu le brief — choix eclaire obligatoire)_
- **I-5** — Hard gates entre phases _(Chaque gate a des criteres explicites, pas de passage sans validation)_
- **I-6** — TDD obligatoire en P3 _(Cycle RED → GREEN → REFACTOR → VERIFY → LINT → COMMIT)_
- **I-7** — Metriques mesurees, jamais estimees _(Sources : task-notifications, filesystem timestamps, comptages. Aucune approximation dans le rapport P6)_
- **I-8** — P5 = test humain obligatoire _(L'utilisateur teste le livrable et rend un verdict (ACCEPTE/REFUSE))_
- **I-9** — 9 Lois d'Autonomie _(Non negociables, applicables a tout le code produit)_
- **I-10** — Roles agents fixes _(Chaque agent a un role, des competences et un perimetre definis)_
- **I-11** — Feature branch workflow _(`feat/<slug>`, merge --no-ff vers main apres P5)_
- **I-12** — Artefacts structures par sequence _(`<sequence>/` contient briefs/, specs/, gpi/, phases/, plans_p3/, audits/, metrics/, rapports_finaux/, ressources/, agents/)_
- **I-13** — Frein d'urgence _(Arret automatique si bug bloquant apres 2 tentatives ou delta majeur)_
- **I-14** — Documents modulaires, 400 lignes max _(Tout artefact decoupe si depassement ; volet optimisation P4/P6 si depassement)_
- **I-15** — Boucle MIP bornee _(Comptage `mip_loops` ; apres 10 iterations, suggerer de reduire le scope)_
- **I-16** — Chargement agents borne par phase _(Charger `<PHASE>_<agent>.md` en premier ; escalader vers `FULL_<agent>.md` uniquement si justifie)_

## L'équipe

Chaque rôle est un **prompt à charger au moment de sa phase**, pas un personnage à jouer. Charger la version de phase, jamais la version complète sans raison.

- **Denis** (Chef dev, architecture) — P0 temps 4 et 8, P3, P4, P5
  Décide de l'architecture et écrit le plan d'implémentation, puis coordonne la réalisation et présente les résultats aux points d'arrêt.
- **Lise** (Dev front-end) — P0 temps 2, P3
  La partie visible : les écrans, ce qui se clique, ce qui s'affiche.

## Le cadrage

### ORIENTER — _deduction depuis le premier prompt_

_Cette section n'a pas été posée : elle se déduit de la demande. Vérifie-la contre le code existant avant d'agir._

**0.1 · Pourquoi exactement ? Quel probleme est resolu ?**

> _Non renseigné._

**0.2 · Exemple concret d'usage attendu ?**

> _Non renseigné._

**0.3 · Solution existante proche dans le projet ?**

> _Non renseigné._

**0.4 · Pour qui ? (utilisateur final, persona)**

> _Non renseigné._

**0.5 · Fonction Online / MWS requise ?**

> _Non renseigné._

**0.6 · Open-source / forkable ou from scratch ?**

> _Non renseigné._

**0.7 · Classification estimee (T1-T5)**

> _Non renseigné._

### COMPRENDRE — _Design Thinking + 5 Whys_

**1.1 · Quel problème ou besoin cette demande résout-elle ?**

> Le tri par date range 10/01 avant 02/01 : les dates sont comparées comme du texte, pas comme des dates.

**1.3 · Qui est l'utilisateur final ?**

> La comptable, qui sort la liste du mois tous les 5.

### CADRER — _Six Thinking Hats : Blanc/Bleu_

**2.2 · Périmètre souhaité ? INCLUS et EXCLUS.**

> INCLUS : le comparateur de la colonne Date. EXCLUS : le reste du tableau, la pagination, les autres colonnes.

### DÉCIDER — _Lightning Decision Jam_

**5.1 · Fonctionnalité MINIMALE viable ?**

> Un test qui reproduit l'ordre faux, puis le comparateur corrigé.

## Ce qui n'a pas été tranché

**7 questions sans réponse.** Ce ne sont pas des détails : chacune peut changer ce qu'il faut construire. Pose-les avant de commencer, ou dis explicitement l'hypothèse que tu retiens.

- 0.1 — Pourquoi exactement ? Quel probleme est resolu ?
- 0.2 — Exemple concret d'usage attendu ?
- 0.3 — Solution existante proche dans le projet ?
- 0.4 — Pour qui ? (utilisateur final, persona)
- 0.5 — Fonction Online / MWS requise ?
- 0.6 — Open-source / forkable ou from scratch ?
- 0.7 — Classification estimee (T1-T5)

## Ce que la séquence doit produire

- **Metriques** → `<sequence>/metrics/` _(Toutes)_

## Le balisage MSCM

Chaque unité de sens du code porte cinq annotations en commentaire, et un index est reconstruit à partir d'elles :

```
@id     identifiant unique et hiérarchique — obligatoire
@do     ce que fait l'unité, en verbe_infinitif_souligne — obligatoire
@role   securite | donnee | orchestration | ui | config | rule
@layer  core | domain | infra | outil | ui | doc
@human  une phrase lisible, pour qui n'a pas le code sous les yeux
```

Règles d'intégrité : **identifiant unique**, **aucun bloc orphelin** (tout `@id` enfant doit avoir un parent existant), **aucun cycle** dans les dépendances. Un index périmé fait échouer la vérification.

## Ce qu'il faut faire maintenant

1. **Commence par les 7 questions sans réponse.** Pose-les groupées, en une fois. Ne devine pas.
2. Ouvre la séquence : `.mip/sequences/<AAAA-MM-JJ>-<slug>/`, et commence en **P3**.
3. Enchaîne P3 → P5 **sans t'arrêter**. Une seule validation humaine, en P5. Si tu rencontres un choix que ce cadrage ne tranche pas, retiens l'option la plus réversible et **écris-le** dans le rapport plutôt que de t'arrêter.
4. Le TDD est obligatoire dès qu'il y a du code : RED → GREEN → REFACTOR → VERIFY → LINT → COMMIT. Un test qui encode une décision de ce cadrage vaut mieux qu'un paragraphe qui la raconte.
````

</details>

### Ce qu'il faut y remarquer

**Le protocole est rappelé avant qu'on ordonne de le suivre.** « Commence en
P3 », « arrête-toi à chaque gate » : un modèle qui n'a jamais lu MIP ne peut que
deviner ce que ça veut dire. La section « Le protocole, en bref » décrit les
phases de cette classe-là — pas les six — et ce qu'est une gate.

**La classification est déjà tranchée**, et le prompt le dit à l'agent — « ne la
recalcule pas ; si tu la crois fausse, dis-le et attends ». Sans ça, un agent
commence par réévaluer l'ampleur du travail, et il la surévalue à peu près
toujours.

**Le périmètre porte ses EXCLUS.** « On ne touche pas à la pagination » est la
phrase qui évite la refonte du tableau pendant qu'on y était.

**Les questions non répondues sont listées, pas cachées**, et la première
instruction de la fin est « commence par elles ». C'est la partie qu'on est
tenté de retirer parce qu'elle fait désordre. Elle reste : un cadrage muet sur
ses trous n'est pas un cadrage sans trous, c'est un cadrage où personne n'a
regardé.

---

## Exemple 2 — un livrable qui n'est pas du code (T3)

Un professeur particulier, pas un développeur. **Le protocole marche quand
même** — à condition de cocher le bon format.

### Ce qu'on remplit

**Titre** — `Fiches de révision — les temps du passé en espagnol`

**La demande** :

> Je donne des cours particuliers d'espagnol à des lycéens. Je voudrais un jeu de fiches sur les temps du passé, à distribuer en PDF.

**Classe** T3 (un vrai petit chantier) · **Mode** BIG_STEPS (on relit à chaque
étape) · **Format** Support de cours, PDF · **Technique** aucune ·
**Équipe** Maria, Arianne

| Question | Réponse |
| --- | --- |
| **1.1 · Quel problème ?** | Mes élèves confondent le passé simple et l'imparfait. Je réexplique la même chose à chaque cours, à l'oral, et il ne leur en reste rien la semaine suivante. |
| **1.2 · Pourquoi maintenant ?** | Cinq élèves sur six ont raté la même question au dernier contrôle blanc. |
| **1.3 · Qui est l'utilisateur ?** | Des lycéens de première et terminale, LV2, niveau A2 à B1. |
| **2.1 · Contraintes ?** | Format A4, recto seul, imprimable en noir et blanc — ils impriment au lycée. |
| **2.2 · Périmètre ?** | INCLUS : le passé simple, l'imparfait, le passé composé, et le choix entre eux. EXCLUS : le subjonctif passé, le plus-que-parfait, la concordance des temps. |
| **4.1 · Bénéfice principal ?** | Qu'ils choisissent le bon temps sans réfléchir dans un exercice à trous. |
| **4.2 · Risques ?** | Le risque, c'est la fiche exhaustive que personne ne lit. Il faut que ça tienne en une page. |
| **5.1 · Minimum viable ?** | Une fiche par temps, plus une fiche « lequel choisir » avec cinq exemples opposés. |

### Ce qui en sort

10480 caractères. Deux sections du prompt précédent ont **disparu**, et
c'est le format qui les a fait disparaître.

<details>
<summary>Voir ce qui change</summary>

````markdown
## Ce qu'il faut produire

- **Format** : Support de cours, PDF

## Classification et conduite

- **Classe : T3** — Feature moderee, 3-10 fichiers
- **Phases** : P0 → P3 → P4 → P5 → P6
- **Mode d'autonomie : BIG_STEPS** (Collaboratif) — Arrêt à chaque gate de phase : P0, P3, P4, P5 sont validées une par une.
- La classification a **déjà été tranchée** par le cadrage. Ne la recalcule pas ; si tu la crois fausse, dis-le et attends.

## Le protocole, en bref

Tu suis un protocole nommé MIP. Voici le strict nécessaire pour t'y tenir ; le reste se charge au fil des phases.

**Une gate est un point d'arrêt avec un critère explicite.** On ne la franchit pas parce que le travail semble fini : on la franchit parce que son critère est rempli. Un critère non rempli renvoie en arrière, il ne se contourne pas.

### P0 — Cadrage

La seule phase où l'humain décide. On explore, on spécifie, on chiffre les risques, et on écrit un brief. Aucune ligne de code avant sa fin.

**Gate P0** — Le brief est présenté, l'humain l'approuve ou le rejette, **puis seulement** il choisit le mode d'autonomie. Ni approbation implicite, ni choix avant lecture.

### P3 — Réalisation

Le travail se fait, tâche par tâche, selon le plan. Un point d'étape toutes les cinq tâches plutôt qu'un grand saut.

**Gate P3** — Chaque tâche passe ses vérifications avant que la suivante commence.

### P4 — Intégration et audit

L'ensemble est assemblé et vérifié : construction complète, conformité à ce qui avait été décidé, revue de sécurité.

**Gate P4** — Aucun défaut bloquant. Un défaut bloquant renvoie en P3, il ne se contourne pas.

### P5 — Livraison et test humain

Le livrable est présenté à l'humain, qui l'essaie et rend un verdict : accepté, accepté avec réserves, ou refusé.

**Gate P5** — Le verdict humain. **Il est obligatoire** — un agent ne se décerne pas son propre quitus. Un refus renvoie au cadrage avec le motif.

### P6 — Rapport et capitalisation

Ce qui a été fait est consigné : trace d'exécution, mesures, et ce qu'on retient pour la prochaine fois.

**Gate P6** — Le rapport porte une trace d'exécution réelle. Sans elle, il est incomplet.

Le vocabulaire est strict : chaque mot désigne un seul niveau.

- **Séquence** — un cycle complet, du cadrage au rapport
- **Phase** — P0, Git, P3, P4, P5, P6 — l'ordre ne se réarrange pas
- **Temps** — les onze subdivisions de P0, et de P0 seulement
- **Étape** — les groupes du plan de P3, et de P3 seulement
- **Volet** — les blocs internes de P4, P5 et P6
- **Tâche** — l'unité atomique — une tâche, un exécutant
- **Gate** — le point d'arrêt entre deux phases, avec un critère explicite

[…]

## Ce qu'il faut faire maintenant

1. **Commence par les 13 questions sans réponse.** Pose-les groupées, en une fois. Ne devine pas.
2. Ouvre la séquence : `.mip/sequences/<AAAA-MM-JJ>-<slug>/`, et commence en **P0**.
3. **Arrête-toi à chaque gate de phase** — P0, P3, P4, P5, P6 — et présente ce qui est fait avant de demander à passer la suivante.
4. Ce livrable n'est pas du code : pas de tests, pas de branche. Ce qui les remplace, c'est une **relecture à chaque étape** — présente d'abord la trame (sommaire, plan, esquisse), fais-la valider, et ne produis le contenu qu'ensuite.
````

</details>

### Ce qu'il faut y remarquer

**Plus de TDD, plus de balisage MSCM, plus de branche Git.** L'instruction finale
du premier exemple disait « RED → GREEN → REFACTOR ». Ici elle dit :

> Ce livrable n'est pas du code : pas de tests, pas de branche. Ce qui les
> remplace, c'est une **relecture à chaque étape** — présente d'abord la trame
> (sommaire, plan, esquisse), fais-la valider, et ne produis le contenu
> qu'ensuite.

Ce n'est pas cosmétique. Une consigne hors sujet — exiger un cycle de tests de
quelqu'un qui rédige des fiches — apprend à l'agent que le reste du document est
peut-être décoratif aussi. Le prompt perd son autorité par le détail qui ne colle
pas.

**BIG_STEPS a changé la marche à suivre**, pas seulement une étiquette :
« arrête-toi à chaque gate de phase — P0, P3, P4, P5, P6 ». En FULL, la même
ligne disait « enchaîne sans t'arrêter ». Et chacune de ces gates est décrite
plus haut dans le prompt, avec son critère de sortie.

**4.2 est la réponse la plus utile du lot.** « Le risque, c'est la fiche
exhaustive que personne ne lit » cadre le travail mieux que les sept autres
réunies : elle dit à l'agent ce qu'il doit refuser de faire.

---

## Ce que les deux ont en commun

| | Exemple 1 | Exemple 2 |
| --- | --- | --- |
| Questions répondues | 4 | 8 |
| Temps de saisie | ~2 min | ~10 min |
| Taille du prompt | ~9 k jetons | ~11.5 k jetons |
| Phases décrites | Git, P3, P5 | P0, P3, P4, P5, P6 |
| TDD exigé | oui | non |
| Balisage MSCM | oui | non |
| Arrêts prévus | 1 | 5 |

Dans les deux cas, **rien n'a été inventé** : ce que l'utilisateur n'a pas écrit
apparaît comme non tranché, et l'agent a pour première consigne de le demander.

## À vous

[Commencer un cadrage](/cadrage) · [Le guide](guide.md) ·
[Anatomie du prompt](prompt.md)
