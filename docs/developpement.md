<!-- @id mip.doc.developpement
     @do expliquer_l_architecture_et_comment_contribuer
     @role config
     @layer doc
     @human La documentation développeur : monter le projet, le comprendre, y contribuer -->

# Développer MIP Studio

## Monter le projet

```bash
git clone <le dépôt> && cd mip-studio
npm install

npm run bd:monter        # PostgreSQL 17 sur 127.0.0.1:54329
npm run bd:schema        # pose le schéma
npm run extraire         # lit miyukini-cog/.mip → pack/
npm run ingerer          # pack/ → PostgreSQL

npm run serveur          # API + client construit, 127.0.0.1:8976
npm run web              # Vite en développement, 127.0.0.1:5975
```

`npm run installer` enchaîne les trois étapes du milieu.

**L'extraction a besoin de la source du protocole.** Elle pointe par défaut sur
`D:/APP/miyukini-cog` ; ailleurs :
`npm run -w extraction extraire -- --source <chemin>`.

Sans elle, la base reste vide et le formulaire n'a rien à afficher.

## Les quatre espaces de travail

```
extraction/   lit .mip/ et en fait un pack JSON — exécuté une fois, pas au service
mscm/         le CLI de balisage, publiable en @mip/mscm — indépendant du reste
serveur/      Fastify + PostgreSQL : formulaire, cadrages, assembleur, comptes
web/          React + Tailwind + shadcn/ui : deux parcours, PC et téléphone
```

Ils sont séparés parce qu'ils ont des **durées de vie différentes** :
l'extraction tourne quand le protocole change, le MSCM s'installe chez les
autres, le serveur et le client tournent en continu.

## Les commandes

| Commande | Ce qu'elle fait |
| --- | --- |
| `npm run essais` | tous les essais — 113, sans réseau ni base |
| `npm run verifier` | les quatre typages |
| `npm run mscm` | régénère `mscm_index/` |
| `npm run mscm:verifier` | échoue si l'index est périmé — pour la CI |
| `npm run extraire` | reconstruit `pack/` depuis la source |

## Les décisions qui structurent le code

Elles sont écrites dans le code, à l'endroit où elles s'appliquent. Les cinq qui
expliquent le plus de choses :

### Le serveur décide, le client rend

L'étage d'une question, ses droits, sa provenance : tout est établi côté
serveur. Le client affiche. Ce dépôt a déjà eu `retenue()` dupliqué des deux
côtés — deux calculs séparés divergent, c'est une question de temps.

### Une suggestion n'est pas une réponse

Le pré-remplissage produit `{ valeur, etat: "suggere" }`. `valeurRetenue()` rend
la chaîne vide tant que l'état n'est pas `repondu`. **La règle est dans le
modèle de données, pas dans la couleur du champ** : le style se perd d'une
refonte à l'autre.

Le module `suggestion.ts` porte `@role securite` et ce n'est pas usurpé : la
moitié de son code refuse des choses.

### La base a deux moitiés qui ne se mélangent pas

Les tables du protocole (`section`, `question`, `agent`…) sont **dérivées** :
l'ingestion les vide et les refait. La table `cadrage` ne se régénère jamais, et
n'a **aucune clé étrangère vers `question`** — un cadrage rempli doit rester
lisible même si le protocole change sous lui.

### La propriété est dans la requête

`WHERE id = $1 AND utilisateur = $2`, pas un `if` après coup. Un `WHERE` oublié
se voit à la relecture du SQL ; un `if` oublié se lit comme du code normal.

### Aucune fonction essentielle ne dépend d'un modèle

Le pré-remplissage peut tomber : le formulaire continue, sans message. C'est un
invariant de conception, pas une gestion d'erreur.

## Les essais

`node --test` avec `tsx`, sans dépendance ajoutée.

```bash
npm run -w serveur essais    # 39
npm run -w mscm essais       # 22
```

**Un essai encode une décision plutôt que de la raconter.** Le nom de l'essai
dit la règle, et le commentaire dit *le défaut qu'il empêche de revenir* — pas
ce que fait le code, qui se lit dans le code.

Les plus instructifs sont dans `suggestion.test.ts` : ils décrivent tous ce que
le pré-remplissage **n'a pas le droit** de faire, et chacun vient d'une
observation réelle.

## Le balisage MSCM

Chaque unité de sens porte cinq annotations, et l'index se régénère à partir
d'elles :

```bash
npm run mscm            # écrit mscm_index/
npm run mscm:verifier   # code de sortie 1 si périmé
```

Voir [le README du paquet](https://www.npmjs.com/package/@mip/mscm) pour le
format. La règle qui surprend : **un index périmé est pire qu'aucun index**,
donc la vérification échoue au lieu d'avertir.

## Ajouter une question au formulaire

Les questions **ne sont pas dans le code** : elles sont extraites du protocole.
Pour en ajouter une :

1. modifier la source, dans `.mip/modules/p0-details.md` ;
2. `npm run extraire` puis `npm run ingerer` ;
3. si le contrôle de saisie déduit du libellé est faux, ajouter une entrée dans
   `SURCHARGES` (`extraction/src/champs.ts`).

Cette table est faite pour rester petite : **chaque entrée est un cas qu'on a vu
mal tomber**, pas un cas qu'on imagine.

Pour qu'une question rejoigne l'étage 1, l'ajouter à `QUESTIONS_ESSENTIELLES`
(`serveur/src/prompt.ts`) — et un essai vérifie qu'elles restent peu nombreuses
et d'angles distincts.

## Le front : deux parcours, une logique

L'interface est bâtie sur **Tailwind v4 et shadcn/ui**. Les composants de base
vivent dans `web/src/composants/ui/` : ils sont **recopiés dans le dépôt**, pas
importés d'un paquet — c'est la façon de faire de shadcn, et elle a l'avantage
qu'on peut les modifier. Le socle est aussi celui qu'attendent les registres de
composants comme [21st.dev](https://21st.dev) ; `components.json` déclare déjà
ce registre sous `@21st`, avec sa clé en variable d'environnement.

```
appareil.tsx      la gate PC / téléphone, et le choix mémorisé
useCadrage.ts     TOUT l'état d'un cadrage, hors mise en page
Cadrage.tsx       parcours PC     — le formulaire entier, l'aperçu en vis-à-vis
CadrageMobile.tsx parcours mobile — une section par écran, l'aperçu en tiroir
Coque.tsx         coque PC + `groupesDe()`, la navigation partagée
CoqueMobile.tsx   coque mobile — lit `groupesDe()`
theme.ts          clair / sombre, système par défaut
```

**La règle qui tient l'ensemble : deux mises en page, une seule logique.**
`useCadrage` porte le pré-remplissage, le calcul des étages, la règle de
confirmation, l'enregistrement. Les deux parcours ne font que placer. Écrire
deux fois cette logique, c'est se donner rendez-vous avec une divergence — ce
dépôt en a déjà connu deux, l'affichage contre l'assemblage des questions, puis
la liste blanche des documents, et les deux fois le défaut est resté invisible
jusqu'à ce qu'un utilisateur le rencontre.

Même raison pour `groupesDe()` : une entrée de menu ajoutée d'un côté et oubliée
de l'autre serait une page joignable sur PC et introuvable sur téléphone.

### Regarder le résultat, pas le supposer

`.tmp/capture.mjs` ouvre les deux parcours dans un Chromium sans tête, en clair
et en sombre, et écrit les captures. C'est ce qui a montré deux défauts que le
typage laissait passer : l'aide des questions affichée **deux fois** — sous le
libellé et en filigrane dans le champ — et les deux catalogues déroulés, treize
cents pixels de tags *avant* la première question essentielle.

## Le style

Le code est en **français**, commentaires compris. Ce n'est pas une coquetterie :
le domaine est français, les questions du protocole sont en français, et
traduire les noms créerait une couche de plus à maintenir dans la tête.

Deux règles de commentaire :

- **On explique pourquoi, pas quoi.** Ce que fait la ligne se lit dans la ligne.
- **Un défaut corrigé se raconte.** Ce dépôt en compte une dizaine, chacun avec
  la mesure qui l'a révélé. Le prochain lecteur évite de le réintroduire.

## Ce qui manque encore

- **Aucune CI.** Les essais et `mscm:verifier` sont prêts à y entrer.
- **Les sessions vivent en mémoire.** Un redémarrage déconnecte tout le monde.
- **Aucun composant de 21st.dev n'est encore posé.** Le registre demande une
  authentification (`403 authentication_required`) : `npx shadcn add @21st/<nom>`
  marchera dès que `TWENTYFIRST_API_KEY` sera dans l'environnement.
- **Aucune sauvegarde de la base.** Ce n'est pas un défaut caché : la
  confidentialité l'annonce.
- **Le pré-remplissage dépend d'un LM Studio local**, partagé avec un autre
  service — il peut ralentir.
