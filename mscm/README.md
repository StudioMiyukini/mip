# MSCM

**Le code dit ce qu'il fait. L'index dit où c'est.**

Cinq annotations dans un commentaire, un index reconstruit à partir d'elles, et
un contrôle d'intégrité qui échoue quand la carte ne correspond plus au terrain.

```bash
npx @mip/mscm              # génère l'index dans mscm_index/
npx @mip/mscm --verifier   # échoue si l'index est périmé — pour la CI
```

## Le balisage

```
@id     identifiant unique et hiérarchique — obligatoire
@do     ce que fait l'unité, en verbe_infinitif — obligatoire
@role   securite | donnee | orchestration | ui | config | rule
@layer  core | domain | infra | outil | ui | doc
@human  une phrase lisible, pour qui n'a pas le code sous les yeux
```

En Rust, en TypeScript, en Python, en Markdown — l'outil ne cherche pas à
analyser le langage : un balisage vit toujours dans un commentaire.

```rust
//! @id maison.chauffage
//! @do reguler_la_temperature_par_piece
//! @role orchestration
//! @layer domain
//! @human Le chauffage : une consigne par pièce, et un repli si la sonde se tait
```

## À quoi ça sert

**À un agent.** Un modèle qui doit modifier un projet balisé lit l'index et sait
où il met les pieds — sans relire tout le code, et sans se fier à des noms de
fichiers qui mentent.

**À une équipe.** `domains.json` dit ce que le projet fait par domaine métier ;
`layers.json`, comment il est découpé ; `graph.json`, ce qui dépend de quoi. Ce
sont des projections du code réel, pas un schéma dessiné une fois puis oublié.

## L'intégrité

Trois règles, et elles font échouer plutôt qu'avertir :

| Règle | Ce qu'elle attrape |
| --- | --- |
| **Identifiant unique** | deux blocs qui prétendent être le même |
| **Aucun orphelin** | un `@id` enfant dont le parent n'existe pas |
| **Aucun cycle** | une hiérarchie qui se mord la queue |

Plus deux contrôles de forme : les champs obligatoires, et un `@do` sans espace —
un espace trahit une phrase, et une phrase ne se compare pas d'un index à l'autre.

**Un index périmé est pire qu'aucun index** : c'est une carte fausse, et on s'y
fie. D'où `--verifier`, qui rend un code de sortie non nul.

L'empreinte couvre **tout ce que l'index publie, numéros de ligne compris**. Une
version antérieure ne hachait que la sémantique : ajouter un paragraphe décalait
les lignes sans que la vérification s'en aperçoive.

## Les dix fichiers

```
registry.json      version, intégrité, empreinte
blocks.json        identité de chaque bloc
hierarchy.json     structure parent-enfant
graph.json         nœuds et arêtes
flows.json         processus métier
domains.json       vision par domaine
layers.json        architecture par couche
dependencies.json  dépendances entre documents
files.json         cartographie fichier → blocs
stats.json         métriques globales
```

## Options

```
--racine <dossier>    ce qu'on parcourt              (défaut : le dossier courant)
--sortie <dossier>    où l'index est écrit           (défaut : mscm_index/)
--projet <nom>        le nom inscrit dans le registre (défaut : celui du package.json)
--ignorer a,b,c       des dossiers en plus des défauts
--verifier            ne rien écrire, échouer si périmé
```

## Compatibilité

Le schéma est le contrat. Cet outil remplace deux implémentations antérieures —
une en Rust qui ne lisait que les fichiers `.rs`, une en Python qui en lisait
cinq — et produit un index **rigoureusement identique** à celui de la seconde :
vérifié sur un dépôt de 68 fichiers et 124 blocs, les dix fichiers octet pour
octet.

## Licence

MIT — NGUYEN "Miyukini" Van Jean
