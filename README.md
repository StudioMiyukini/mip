<!-- @id mip
     @do cadrer_une_sequence_de_developpement_et_en_produire_le_prompt
     @role orchestration
     @layer doc
     @human MIP Studio : le protocole MIP et le balisage MSCM, extraits en application de cadrage -->

# MIP Studio

**Répondez à quelques questions sur ce que vous voulez construire. Repartez avec
un prompt qui fait travailler votre IA correctement.**

[mip.miyukini.org](https://mip.miyukini.org) · MIT · TypeScript

---

## Le problème

On ouvre une IA, on décrit son projet en trois phrases, elle part sur une
mauvaise piste, on rattrape, on refait. Le défaut n'est pas dans le modèle : il
est dans ce qu'on lui a donné.

Un chef de projet expérimenté pose une vingtaine de questions avant d'écrire une
ligne de code — à quoi ça sert, pour qui, qu'est-ce qui est hors périmètre, quel
est le risque, qu'est-ce qu'on abandonne. **MIP Studio pose ces questions à votre
place, et met vos réponses dans la forme qu'un agent suit.**

## Ce que ça donne

Un document en Markdown, prêt à coller, qui dit à votre agent :

- ce qu'il faut construire, et pour qui ;
- ce qui a été décidé — et **ce qui ne l'a pas été**, pour qu'il le demande au
  lieu de le deviner ;
- où s'arrêter et demander votre accord ;
- ce qu'il doit produire, et à quel format.

Les questions ne sont pas inventées. Elles viennent de méthodes de conception
éprouvées — Design Thinking, 5 Whys, Six Thinking Hats, SCAMPER, Lightning
Decision Jam — regroupées en six sections. Le protocole complet, dit **MIP**,
existe et tourne sur des projets réels depuis mars 2026.

## Ce que ça n'est pas

Ce n'est pas un générateur de code, ni un agent. **MIP Studio prépare le
travail ; c'est votre IA qui le fait.** Il ne remplace ni Claude Code, ni Cursor,
ni Copilot — il leur donne de quoi ne pas se tromper de projet.

## Le balisage MSCM

Le second morceau du dépôt. Chaque unité de sens du code porte cinq annotations
en commentaire, et un index se reconstruit à partir d'elles :

```
@id     identifiant unique et hiérarchique
@do     ce que fait l'unité
@role   securite | donnee | orchestration | ui | config | rule
@layer  core | domain | infra | outil | ui | doc
@human  une phrase lisible, pour qui n'a pas le code sous les yeux
```

L'index se vérifie : identifiant unique, aucun bloc orphelin, aucun cycle. Un
agent qui doit modifier un projet balisé sait où il met les pieds sans relire
tout le code.

---

## Pourquoi ce dépôt existe

Le protocole MIP pèse **23 Mo**. Personne ne peut le donner à la main à un
agent, et personne ne relit vingt-cinq questions de cadrage avant chaque
séquence. Résultat prévisible : on saute le cadrage, ou on en fait une version
appauvrie de mémoire.

Une deuxième raison, moins visible et plus décisive : **le balisage MSCM existait
déjà en deux exemplaires divergents** — une version Rust qui ne scannait que les
fichiers `.rs`, une version Python qui lisait cinq langages et vérifiait
l'intégrité. Deux copies d'un même outil qui dérivent depuis mars. Un protocole
qu'on ne sait pas distribuer se fragmente chez son propre auteur.

## Ce qu'on obtient

| | |
| --- | --- |
| **Un formulaire** | 32 questions, six sections, filtrées par classe de tâche |
| **Des champs adaptés** | zones de texte, menus, échelles, cases — déduits du libellé des questions |
| **Des tags** | 11 agents, 19 skills, 14 modules, 42 certifications, à activer selon la pertinence |
| **Un prompt** | assemblé en direct, ~2 400 jetons pour un cadrage T4 |
| **Un historique** | les cadrages sont conservés avec le prompt qui a réellement servi |

## Démarrer

```bash
npm install
npm run bd:monter        # PostgreSQL sur 127.0.0.1:54329
npm run bd:schema        # pose le schéma
npm run extraire         # lit miyukini-cog/.mip → pack/
npm run ingerer          # pack/ → PostgreSQL

npm run serveur          # API sur 127.0.0.1:8976
npm run web              # interface sur 127.0.0.1:5975
```

L'extraction pointe par défaut sur `D:/APP/miyukini-cog`. Pour une autre source :
`npm run -w extraction extraire -- --source <chemin>`.

## Structure

```
extraction/   lit .mip/ et en fait un pack — TypeScript, exécuté une fois
pack/         le protocole extrait (généré, hors dépôt : 19 Mo)
serveur/      Fastify + PostgreSQL : le formulaire, les cadrages, l'assembleur
web/          React : le formulaire et l'aperçu du prompt
```

<!-- @id mip.decisions
     @do consigner_les_decisions_et_leur_raison
     @role rule
     @layer doc
     @human Les décisions prises pendant l'extraction, avec leur motif -->

## Les décisions, et leur raison

**La source est doublement encodée, et l'extraction le répare.**
`p0-details.md` et `setup.md` contiennent « DÃ‰CIDER » au lieu de « DÉCIDER » :
de l'UTF-8 relu en cp1252 puis réenregistré. Recopier tel quel aurait propagé la
bavure dans tous les prompts produits.

*Et la réparation évidente ne marche pas.* Réencoder le fichier entier échoue :
il est **mixte** — une partie a été doublement encodée, l'autre non. Dès le
premier accent resté sain, les octets ne sont plus de l'UTF-8 valide, la
conversion lève, et l'on rend le texte abîmé **en croyant l'avoir réparé**. La
réparation travaille donc par suites maximales de caractères issus de la moitié
haute de cp1252 : « créé » ne bouge pas, « Ã©tÃ© » redevient « été ».

**Les questions portent leurs propres options.** « Prioriser : (a) rapidité,
(b) complétude, (c) qualité ? » est un menu déroulant écrit en prose. Le type de
champ se déduit du libellé plutôt que de se déclarer à la main — avec une table
de surcharges courte pour les six cas que l'heuristique rate. Chaque entrée de
cette table est un cas qu'on a *vu* mal tomber, pas un cas qu'on imagine.

**Ce qui n'a pas été répondu est écrit dans le prompt.** La tentation est de ne
garder que les réponses remplies, ce qui donne un texte net. Mais un cadrage muet
sur le risque n'est pas un cadrage sans risque : c'est un cadrage où personne n'a
regardé. L'agent doit voir le trou pour poser la question.

**Le poids en jetons est affiché sur chaque tag.** Tout ce qu'on active finit
dans le contexte, et un contexte se paie à *chaque tour*, pas une fois. Sans le
chiffre, on active tout « au cas où » — exactement ce que le chargement à la
demande du protocole cherche à empêcher.

**La base a deux moitiés qui ne se mélangent pas.** Les tables du protocole sont
dérivées : l'ingestion les vide et les refait, pour qu'une question retirée de la
source disparaisse vraiment. La table `cadrage` ne se régénère jamais et n'a
aucune clé étrangère vers `question` — un cadrage rempli doit rester lisible même
si le protocole change sous lui.

**Le prompt est stocké, pas seulement recalculé.** Un cadrage rouvert six mois
plus tard doit rendre le texte qui a réellement servi, même si l'assembleur a
changé entre-temps.

**Un PostgreSQL dédié, pas un schéma de plus.** La machine en héberge déjà
quatre. Les mêler ferait dépendre le cadrage d'un service sans rapport : une
migration Immich ne doit pas pouvoir empêcher d'ouvrir un formulaire.

## Ce qui reste ouvert

- **Le générateur MSCM n'est pas encore unifié.** Le prompt transmet les
  conventions de balisage ; les deux implémentations divergentes vivent toujours
  chacune chez elle. C'est le prochain morceau, et il a un critère de réussite
  clair : un seul outil, cinq langages, contrôle d'intégrité, et les deux projets
  qui l'appellent.
- **Les phases suivantes.** Le formulaire couvre le Temps 1 du cadrage. P3, P4,
  P5, P6 ont leurs propres artefacts et leurs propres gates — aucun n'est outillé
  ici.
- **Les certifications sont recopiées entières** (19 Mo) mais l'application ne
  joint que les fiches choisies. Une base qu'on injecterait en entier ne servirait
  qu'à saturer le contexte.
- **La porte est un mot de passe partagé**, pas des comptes. C'est suffisant pour
  un outil qu'une personne utilise, et insuffisant dès qu'il faut savoir *qui* a
  écrit un cadrage. Le jour où ça compte, il faudra des identités.
- **Les sessions vivent en mémoire.** Un redémarrage du serveur déconnecte tout
  le monde. C'est un désagrément, pas un défaut : redemander un mot de passe
  après un redémarrage est le comportement attendu.

<!-- @id mip.publication
     @do publier_l_application_derriere_un_tunnel_cloudflare
     @role config
     @layer infra
     @human La publication : le tunnel, la porte, et l'enregistrement PM2 -->

## Publier — mip.miyukini.org

**Le site est ouvert par défaut.** Les comptes bornent les données — l'écriture
en exige un, la lecture est limitée au propriétaire — et le formulaire fonctionne
sans inscription, ce qui est le but.

`MIP_EMPREINTE` reste disponible : la poser **referme le site d'un coup** derrière
un mot de passe partagé, pour une maintenance ou une mise en ligne progressive.
C'est un verrou, pas une condition d'existence.

Deux routes sont plafonnées par adresse, parce qu'elles coûtent cher à servir :
les suggestions (20 par dix minutes) et la création de compte (5 par heure).

```bash
npm run -w serveur empreinte -- "<mot de passe>"   # → une empreinte scrypt
# la poser dans .env :  MIP_EMPREINTE=<empreinte>
npm run -w web build                                # Fastify sert web/dist
```

Le serveur constate la provenance, il ne la croit pas : une requête qui porte
`cf-ray` vient du tunnel et doit présenter une session ; une requête locale
passe. Un client local pourrait forger l'en-tête — il en hériterait des droits
**moindres**, jamais plus grands, et c'est pour ça que le test est dans ce sens.

**Le tunnel.**

```
tunnel : mip — d276192f-2486-4252-859d-5883e26c2bba
config : %USERPROFILE%\.cloudflared\mip-config.yml  →  http://127.0.0.1:8976
```

**Le DNS ne se pose pas avec `cloudflared`.** Le certificat d'origine
(`cert.pem`) n'autorise qu'une seule zone — `miyukini-home.org`. Lancer
`cloudflared tunnel route dns mip mip.miyukini.org` crée
`mip.miyukini.org.miyukini-home.org`, ce qui n'est pas ce qu'on veut. Il faut
donc poser le CNAME dans la zone `miyukini.org` :

| Champ | Valeur |
| --- | --- |
| Type | `CNAME` |
| Nom | `mip` |
| Cible | `d276192f-2486-4252-859d-5883e26c2bba.cfargotunnel.com` |
| Proxy | **activé** (nuage orange) |

**PM2**, une fois le DNS en place :

```
pm2 start "C:\Program Files (x86)\cloudflared\cloudflared.exe" --name mip-tunnel -- \
  tunnel --config "C:\Users\Van Jean\.cloudflared\mip-config.yml" run
pm2 start npm --name mip --cwd D:\APP\mip-studio\serveur -- run start
pm2 save
```

Le serveur doit voir `MIP_EMPREINTE` dans son environnement. **PM2 rejoue
l'environnement capturé au premier démarrage** : une variable ajoutée après coup
n'arrive jamais, et `pm2 restart` relance sans elle sans rien signaler. La poser
dans le shell *avant* le `pm2 start`, ou utiliser `--update-env`.
