<!-- @id mip.doc.questions
     @do expliquer_ce_que_chaque_section_de_questions_cherche
     @role config
     @layer doc
     @human Les six sections : d'où viennent les questions et ce qu'elles cherchent -->

# Les questions, et ce qu'elles cherchent

Trente-deux questions, six sections. Elles ne sont pas inventées : chaque section
reprend une méthode de conception éprouvée, et les questions en sont les
questions canoniques.

Savoir **ce qu'une question cherche** aide à y répondre. « Quel problème cette
demande résout-elle ? » attend un problème, pas une solution — et c'est la
confusion la plus fréquente.

---

## 0 — ORIENTER

*Déduction depuis votre demande.*

Sept questions que **vous n'avez normalement pas à remplir** : elles se déduisent
du texte que vous avez écrit. Le protocole le prescrivait déjà à la main — « le
chef de projet remplit ce tableau seul, avant de poser des questions » — et
l'outil ne fait que l'exécuter.

Si les propositions vous semblent fausses, corrigez-les : c'est le contexte sur
lequel tout le reste s'appuie.

## 1 — COMPRENDRE

*Design Thinking et les 5 Whys.*

| Question | Ce qu'elle cherche |
| --- | --- |
| Quel problème cette demande résout-elle ? | **le problème, pas la solution** |
| Pourquoi maintenant ? | ce qui déclenche — un projet sans déclencheur dérive |
| Qui est l'utilisateur final ? | et ce n'est pas toujours vous |
| Le flux actuel, ses frictions ? | ce qu'on remplace, et pourquoi il gêne |
| Pourquoi cette approche ? | les alternatives écartées, et leur motif |

**Le piège de 1.1.** « Je veux une application de suivi de lecture » est une
solution. Le problème est « je ne me souviens plus de ce que j'ai lu ». La
différence compte : un agent qui connaît le problème peut proposer plus simple
que ce qu'on avait imaginé.

## 2 — CADRER

*Six Thinking Hats — chapeaux blanc et bleu : les faits, et le pilotage.*

| Question | Ce qu'elle cherche |
| --- | --- |
| Contraintes techniques connues ? | ce qui est imposé, pas ce qui est souhaité |
| Périmètre : inclus **et exclus** | la limite, dans les deux sens |
| Priorité : minimal, souhaité, confort ? | ce qu'on sacrifie si le temps manque |
| Échéance ou jalon externe ? | ce qui ne se négocie pas |
| Données ou références existantes ? | ce sur quoi s'appuyer |

**Le piège de 2.2.** Tout le monde remplit « inclus », presque personne
« exclus ». C'est pourtant la moitié utile : sans exclusion écrite, un agent
déborde de bonne foi, et vous relisez du code que vous n'avez pas demandé.

## 3 — IMAGINER

*Chapeau vert et SCAMPER.*

Six questions pour ouvrir avant de refermer : idées d'approche, ce qu'on
pourrait adapter, combiner, éliminer, ce que font les autres, et la
reformulation en opportunité.

**C'est la section la plus sautable** — et celle qui rapporte le plus sur un
projet flou. Question 3.4, *« que peut-on éliminer pour simplifier ? »*, fait
souvent gagner une semaine.

## 4 — ÉVALUER

*Chapeaux jaune, noir et rouge : le bénéfice, le risque, l'instinct.*

| Question | Ce qu'elle cherche |
| --- | --- |
| Bénéfice principal ? | **LA** chose qui doit fonctionner |
| Risques anticipés ? | ce qui vous inquiète, pas ce qui est théorique |
| Complexité C1 à C5 ? | votre estimation, pas celle de l'agent |
| Importance stratégique ? | pour arbitrer face à un autre projet |
| Que se passe-t-il si on ne le fait pas ? | la question qui tue les faux projets |

**4.5 mérite qu'on s'y arrête.** Si la réponse est « rien de grave », le projet
n'a peut-être pas besoin d'exister — et c'est une découverte à dix minutes
plutôt qu'à trois semaines.

## 5 — DÉCIDER

*Lightning Decision Jam.*

| Question | Ce qu'elle cherche |
| --- | --- |
| Fonctionnalité minimale viable ? | par où commencer |
| Arbitrage : rapidité, complétude, qualité ? | on ne peut pas avoir les trois |
| Reportable au prochain sprint ? | ce qui attend sans dommage |
| Décisions déjà figées ? | ce qu'il ne faut pas rouvrir |

---

## Pourquoi certaines n'apparaissent pas

Le formulaire n'affiche que les questions de **votre classe**. Un correctif
d'une ligne n'a pas besoin d'une analyse concurrentielle.

```
T1 · T2    4 à 11 questions
T3         21 questions
T4         31 questions
T5         32 questions
```

Et l'étagement en ajoute une couche : les quatre essentielles d'abord, le
cadrage ensuite, le détail en dernier. Voir [le guide](guide.md).

## Répondre « je ne sais pas »

C'est une réponse valable, et il vaut mieux **laisser vide** que d'inventer :
une case vide apparaît dans « ce qui n'a pas été tranché », et l'agent la posera.
Une réponse fausse, elle, passe pour une décision.
