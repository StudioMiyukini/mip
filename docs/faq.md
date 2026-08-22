<!-- @id mip.doc.faq
     @do repondre_aux_questions_frequentes
     @role config
     @layer doc
     @human Les questions qu'on se pose en arrivant, et leurs réponses -->

# Questions fréquentes

## Sur l'usage

### Faut-il un compte ?

Non. Le formulaire fonctionne entièrement sans inscription, et c'est délibéré :
demander une adresse avant de commencer ferait partir les gens qu'on vise. Le
compte sert à **retrouver ses cadrages** plus tard, rien d'autre.

### Dois-je répondre à toutes les questions ?

Non. Quatre suffisent à obtenir un prompt utilisable, et un bandeau vous le dit
dès qu'elles sont remplies. Les étages 2 et 3 existent pour les projets qui le
méritent.

Ce qui reste vide apparaît dans « ce qui n'a pas été tranché » — l'agent posera
la question au lieu de deviner.

### Avec quelle IA ça marche ?

Toutes. Le prompt est du Markdown : Claude, ChatGPT, Gemini, Cursor, Copilot,
Claude Code, un modèle local — n'importe lequel le lit.

### Ça écrit du code ?

Non. **MIP Studio prépare le travail ; c'est votre IA qui le fait.** Il ne
remplace ni Cursor ni Copilot, il leur donne de quoi ne pas se tromper de projet.

### Mon projet n'est pas du code

Ça marche quand même. Cochez le format — support de cours, PDF, procédure,
rapport, diagramme, maquette — et le prompt cesse d'exiger des tests, une
branche Git et un balisage du code. Il demande à la place que la **trame** soit
validée avant le contenu.

Trois familles au choix : ce qui s'exécute, ce qui se lit, ce qui se regarde.

### Ma pile n'est pas dans la liste

La liste est courte volontairement : ce sont les piles réellement utilisées ici,
pas un catalogue de tout ce qui existe. Cent entrées se parcourent moins bien
qu'aucune.

Si la vôtre manque, **écrivez-la dans la description du projet** — l'agent la
lira là. Ou cochez « À décider » pour qu'il propose.

### Le prompt est trop long pour mon IA

Restez à l'étage 1 : environ 2 000 jetons. L'étage 3 complet en fait 4 000. Vous
pouvez aussi retirer des sections à la main — c'est du Markdown — mais gardez la
dernière : c'est elle qui déclenche l'action.

## Sur les réponses proposées

### D'où viennent-elles ?

D'un modèle qui tourne **sur la machine du service**, pas chez un tiers. Votre
texte ne part ni chez OpenAI, ni chez Anthropic, ni chez Google.

### Pourquoi faut-il les confirmer ?

Parce que le modèle invente. C'est mesuré, pas supposé : au premier essai réel,
il a donné un sens faux à deux sigles et inventé un public qui n'existait pas —
**malgré une consigne explicite de ne rien inventer**.

Une invention est plausible, bien écrite, et occupe le champ exactement comme une
vraie réponse. Tant que vous n'avez pas confirmé, elle **ne compte pas** : elle
n'entre pas dans le prompt.

### Je n'ai aucune proposition

Le modèle était froid ou occupé. Le premier appel après une période creuse peut
dépasser le délai. Le formulaire fonctionne sans — c'est un confort, pas une
fonction. Modifiez votre demande pour relancer une tentative.

## Sur le protocole

### C'est quoi, T1 à T5 ?

L'ampleur du projet, de « correctif d'une ligne » à « chantier ». Elle décide du
nombre de questions **et** de ce que le prompt demandera. En cas de doute, montez
d'un cran : un T3 traité comme un T4 coûte quelques questions, l'inverse coûte
une refonte.

### Que veut dire « gate » ?

Un point d'arrêt où l'agent vous rend la main. Vous choisissez leur fréquence à
l'étage 3 : `FULL` s'arrête une fois, `BIG_STEPS` à chaque phase, `GUIDED` à
chaque étape.

### Je dois connaître le MIP pour m'en servir ?

Non — c'est tout l'objet de l'outil. Si vous voulez comprendre ce que le prompt
raconte à votre agent, [le protocole](protocole.md) l'explique.

## Sur les données

### Qu'est-ce qui est conservé ?

Sans compte : **rien**. Avec un compte : votre adresse, une empreinte de votre
mot de passe, et vos cadrages. Pas de nom, pas de traceur, pas de mesure
d'audience.

### Comment tout effacer ?

Un bouton dans « mon compte », et le mot de passe redemandé. La suppression est
immédiate et emporte tous les cadrages. Il n'y a ni corbeille ni délai — et rien
n'est restaurable ensuite.

### Vous lisez mes cadrages ?

Non. Ils ne sont ni lus, ni analysés, ni utilisés pour entraîner un modèle, et
personne d'autre que vous n'y a accès.

## Sur le projet

### C'est gratuit ? Il y a un piège ?

C'est gratuit et il n'y a pas de version payante. Le service tourne sur une
machine personnelle ; le coût est celui de l'électricité.

En contrepartie, il n'offre **aucune garantie de disponibilité ni de
sauvegarde**. Si un cadrage compte pour vous, copiez-le.

### Je peux l'installer chez moi ?

Oui, le code est sous licence MIT :
[github.com/StudioMiyukini/mip](https://github.com/StudioMiyukini/mip). Voir
[Développer](developpement.md) pour le monter.

### En quoi c'est différent de Spec Kit ou BMAD ?

Ils cadrent la **spécification** — ce qu'il faut construire. MIP Studio cadre la
**réflexion qui la précède** : à quoi ça sert, pour qui, ce qu'on abandonne. Les
six sections viennent de méthodes de conception, pas de gabarits de spécification.

Et le balisage MSCM n'a d'équivalent chez aucun d'eux.

### Comment contribuer ?

Les remontées et les corrections passent par le dépôt GitHub. Ce qui aide le
plus : dire **où le formulaire vous a perdu**, et à quelle question.
