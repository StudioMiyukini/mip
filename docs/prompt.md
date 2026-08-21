<!-- @id mip.doc.prompt
     @do decrire_l_anatomie_du_prompt_produit
     @role config
     @layer doc
     @human Anatomie du prompt : chaque section, ce qu'elle fait, et pourquoi elle y est -->

# Anatomie du prompt

Le document que vous copiez fait entre deux mille et quatre mille jetons. Voici
ce qu'il contient, section par section, et **pourquoi chacune y est**.

Vous n'avez pas besoin de le lire pour vous en servir. Il est là pour le jour où
vous voudrez le modifier à la main — ou comprendre pourquoi votre agent s'est
arrêté.

---

## L'avertissement d'ouverture

> Ce document est un cadrage de séquence MIP. Il tient lieu de Temps 1 : les
> questions d'exploration ont déjà été posées. Ne les repose pas.

Sans cette phrase, un agent bien élevé recommence par vous interroger — et vous
venez de passer dix minutes à répondre. Elle dit aussi que « non renseigné »
signifie un **trou réel**, pas une case oubliée.

## La demande

Votre texte, tel quel. C'est le seul endroit où votre voix passe sans
reformulation, et souvent celui que l'agent relit quand le reste devient
ambigu.

## Ce qu'il faut produire

Le format du livrable et la technique. **Le protocole ne le demandait pas** —
ses vingt-cinq questions portent sur le pourquoi et le pour qui, aucune sur ce
qu'on obtient à la fin. Un agent qui l'ignore choisit à votre place.

Si vous avez coché « À décider », une ligne demande à l'agent de **proposer** la
technique avec son coût, et d'attendre votre accord.

## Classification et conduite

La classe (T1 à T5), les phases qu'elle déclenche, et le mode d'autonomie.

Une phrase compte plus que les autres : *« La classification a déjà été
tranchée. Ne la recalcule pas. »* Sans elle, l'agent refait l'estimation, arrive
à une autre, et vous vous retrouvez avec deux avis sans savoir lequel suivre.

## Le noyau immuable

Seize règles qui ne dépendent ni du projet ni de l'outil. Elles sont **copiées
en entier**, pas résumées : un agent applique ce qu'il lit, pas ce qu'on lui dit
d'aller chercher.

## L'équipe

Les rôles retenus, avec cette précision : ce sont des **prompts à charger au
moment de leur phase**, pas des personnages à jouer. Un agent qui « incarne »
onze rôles simultanément ne fait que changer de ton.

## Le cadrage

Vos réponses, question par question, groupées par section et par méthode. Les
réponses multilignes sont citées en bloc — sinon la deuxième ligne se recolle à
la question suivante, et on ne sait plus qui répond à quoi.

**Les suggestions non confirmées n'y figurent pas.** Elles comptent comme non
renseignées.

## Ce qui n'a pas été tranché

La liste des questions sans réponse.

C'est la section qu'on est tenté de retirer, parce qu'elle fait désordre — un
cadrage à moitié rempli affiche vingt lignes ici. **Elle reste** : un cadrage
muet sur le risque n'est pas un cadrage sans risque, c'est un cadrage où
personne n'a regardé. L'agent doit voir le trou pour poser la question.

## Ce que la séquence doit produire

Les artefacts attendus selon les phases : briefs, audits, métriques, rapports —
avec leur chemin. C'est ce qui permet de retrouver le travail six mois plus tard.

## À charger au fil des phases

Les modules, savoir-faire et référentiels que vous avez activés, avec une
consigne : **à la demande, jamais en bloc**. Tout charger d'emblée sature le
contexte et fait payer à chaque tour ce qui n'aura servi qu'une fois.

## Le balisage MSCM

Les cinq annotations et les règles d'intégrité. Présent même si vous n'utilisez
pas MSCM : un agent qui les connaît produit du code plus facile à reprendre, et
les ignorer ne coûte rien.

## Ce qu'il faut faire maintenant

**La seule section qui soit un ordre**, et elle change selon vos choix :

| Votre situation | Ce que dit la dernière section |
| --- | --- |
| Des questions sans réponse | commence par les poser, groupées, ne devine pas |
| Mode `FULL` | enchaîne les phases, une seule validation en P5 |
| Mode `BIG_STEPS` | arrête-toi à chaque gate de phase |
| Mode `GUIDED` | arrête-toi à chaque étape du plan |
| Livrable en code | TDD obligatoire : RED → GREEN → REFACTOR |
| Livrable en document | pas de tests ; une relecture à chaque étape |

Un prompt qui dirait « fais tout » à quelqu'un ayant choisi la supervision
contredirait le formulaire qu'il vient de remplir.

---

## Le modifier à la main

C'est du Markdown : rien ne vous empêche d'ajouter une contrainte, de retirer
une section, ou de coller un extrait de code existant. Deux conseils :

- **Gardez la dernière section.** C'est elle qui déclenche l'action ; sans elle,
  l'agent résume votre cadrage au lieu de l'exécuter.
- **Ne retirez pas les questions sans réponse** parce qu'elles font désordre.
  Répondez-y, ou assumez que l'agent les posera.
