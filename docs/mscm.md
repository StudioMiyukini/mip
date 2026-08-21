<!-- @id mip.doc.mscm
     @do expliquer_le_balisage_mscm_et_son_usage
     @role config
     @layer doc
     @human Le balisage MSCM : annoter son code pour qu'un agent s'y retrouve -->

# Le balisage MSCM

> Le code dit ce qu'il fait. L'index dit où c'est.

Le second morceau du projet, et celui qu'aucun outil concurrent n'a. Cinq
annotations dans vos commentaires, un index reconstruit à partir d'elles, et un
contrôle qui échoue quand la carte ne correspond plus au terrain.

```bash
npx @mip/mscm              # génère l'index dans mscm_index/
npx @mip/mscm --verifier   # échoue si l'index est périmé — pour la CI
```

## Le problème qu'il règle

Un agent qui doit modifier un projet qu'il ne connaît pas a deux options : tout
relire, ou se fier aux noms de fichiers. La première coûte cher à chaque tour,
la seconde ment — `utils.ts` ne dit rien, et `auth.ts` peut contenir trois
choses sans rapport.

Le balisage donne une troisième voie : **une carte du sens**, tenue à jour par
construction, où l'agent lit *où sont les décisions* avant d'ouvrir un fichier.

## Les cinq annotations

```rust
//! @id maison.chauffage
//! @do reguler_la_temperature_par_piece
//! @role orchestration
//! @layer domain
//! @human Le chauffage : une consigne par pièce, un repli si la sonde se tait
```

| Champ | Obligatoire | Ce qu'il porte |
| --- | --- | --- |
| `@id` | oui | un identifiant unique et **hiérarchique**, en points |
| `@do` | oui | ce que fait l'unité, en `verbe_infinitif_souligne` |
| `@role` | non | `securite` · `donnee` · `orchestration` · `ui` · `config` · `rule` |
| `@layer` | non | `core` · `domain` · `infra` · `outil` · `ui` · `doc` |
| `@human` | non | une phrase, pour qui n'a pas le code sous les yeux |

**`@do` sans espace, et ce n'est pas une coquetterie** : un espace trahit une
phrase, et une phrase ne se compare pas d'un index à l'autre. `gerer_les_users`
se retrouve ; « gère les utilisateurs et parfois les groupes » non.

**`@human` est le champ qu'on saute et qu'on regrette.** C'est celui qu'un agent
lit en premier quand il cherche où intervenir.

## Où ça marche

L'outil ne cherche pas à analyser le langage : un balisage vit toujours dans un
commentaire, et un commentaire se reconnaît à peu de frais.

| Famille | Extensions |
| --- | --- |
| Barres `//` | `.rs` `.ts` `.tsx` `.js` `.jsx` `.go` `.java` `.c` `.cpp` `.cs` `.sql` |
| Dièse `#` | `.py` `.rb` `.sh` `.yml` `.yaml` |
| HTML | `.md` |

En Markdown, un exemple à l'intérieur d'un bloc de code est ignoré — sans quoi
la documentation du protocole s'indexerait elle-même. Même règle dans les
commentaires de code : c'est un défaut que l'outil s'est infligé à lui-même
avant d'être corrigé.

## Les trois règles d'intégrité

| Règle | Ce qu'elle attrape |
| --- | --- |
| **Identifiant unique** | deux blocs qui prétendent être le même |
| **Aucun orphelin** | un `@id` enfant dont le parent n'existe pas |
| **Aucun cycle** | une hiérarchie qui se mord la queue |

Plus deux contrôles de forme : les champs obligatoires, et le `@do` sans espace.

**Un index périmé est pire qu'aucun index** : c'est une carte fausse, et on s'y
fie. D'où `--verifier`, qui rend un code de sortie non nul — utilisable tel quel
dans une intégration continue.

L'empreinte couvre **tout ce que l'index publie, numéros de ligne compris**. Une
version antérieure ne hachait que la sémantique : ajouter un paragraphe décalait
les lignes sans que la vérification s'en aperçoive.

## Les dix fichiers de l'index

```
registry.json      version, intégrité, empreinte
blocks.json        l'identité de chaque bloc
hierarchy.json     la structure parent-enfant
graph.json         les nœuds et les arêtes
flows.json         les processus métier
domains.json       la vision par domaine
layers.json        l'architecture par couche
dependencies.json  les dépendances entre documents
files.json         la cartographie fichier → blocs
stats.json         les métriques globales
```

`domains.json` dit ce que le projet fait **par domaine métier** ; `layers.json`,
comment il est découpé ; `graph.json`, ce qui dépend de quoi. Ce sont des
projections du code réel, pas un schéma dessiné une fois puis oublié.

## Les options

```
--racine <dossier>    ce qu'on parcourt              (défaut : le dossier courant)
--sortie <dossier>    où l'index est écrit           (défaut : mscm_index/)
--projet <nom>        le nom dans le registre        (défaut : celui du package.json)
--ignorer a,b,c       des dossiers en plus des défauts
--verifier            ne rien écrire, échouer si périmé
```

`node_modules`, `target`, `dist`, `build`, `vendor` et les dossiers cachés sont
ignorés d'office. `--ignorer` **s'ajoute** à ces défauts, il ne les remplace pas :
un projet qui exclut un dossier ne veut pas réintroduire `node_modules`.

## Par où commencer sur un projet existant

1. Balisez les **fichiers d'entrée** — un `@id` racine par module.
2. Lancez `npx @mip/mscm`. Il listera les orphelins : ce sont vos prochains
   parents à écrire.
3. Descendez d'un niveau à chaque passe. Un projet se balise en plusieurs
   séances, pas en une.

Inutile de tout baliser. Un index partiel mais juste vaut mieux qu'un index
complet et périmé.

## Compatibilité

Le schéma est le contrat. Cet outil remplace deux implémentations antérieures —
une en Rust qui ne lisait que les `.rs`, une en Python qui en lisait cinq — et
produit un index **rigoureusement identique** à celui de la seconde : vérifié sur
un dépôt de 68 fichiers et 124 blocs, les dix fichiers octet pour octet.
