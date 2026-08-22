// @id mip.doc.exemples.engendrement
// @do engendrer_la_page_d_exemples_depuis_des_prompts_reellement_produits
// @role config
// @layer outil
// @human Le script qui refabrique docs/exemples.md à partir de vrais prompts

/**
 * La page d'exemples est **engendrée**, jamais recopiée.
 *
 * Elle affirme que les prompts cités sont réels. Un texte collé à la main cesse
 * d'être vrai à la première évolution de l'assembleur, sans que rien ne le
 * signale — et c'est arrivé : l'ajout de la section « Le protocole, en bref »
 * a rendu les deux prompts de la page obsolètes le jour même.
 *
 * Usage, serveur démarré :
 *   node scripts/engendrer-exemples.mjs [http://127.0.0.1:8976]
 */

import { writeFileSync } from "node:fs";

const API = process.argv[2] ?? "http://127.0.0.1:8976";
const F = "````"; // quatre : les prompts cités contiennent eux-mêmes des blocs
const jetons = (t) => Math.round((t.length / 1000) * 1.1 * 10) / 10;

const EX1 = {
  titre: "Corriger le tri par date des factures",
  demande:
    "Sur la page des factures, le tri par colonne Date se fait dans le mauvais ordre depuis la refonte.",
  classe: "T1",
  mode: "FULL",
  formats: ["app-web"],
  techniques: ["typescript", "react"],
  agents: ["denis", "lise"],
  skills: [],
  modules: [],
  certifications: [],
  reponses: {
    "1.1":
      "Le tri par date range 10/01 avant 02/01 : les dates sont comparées comme du texte, pas comme des dates.",
    "1.3": "La comptable, qui sort la liste du mois tous les 5.",
    "2.2":
      "INCLUS : le comparateur de la colonne Date. EXCLUS : le reste du tableau, la pagination, les autres colonnes.",
    "5.1": "Un test qui reproduit l'ordre faux, puis le comparateur corrigé.",
  },
};

const EX2 = {
  titre: "Fiches de révision — les temps du passé en espagnol",
  demande:
    "Je donne des cours particuliers d'espagnol à des lycéens. Je voudrais un jeu de fiches sur les temps du passé, à distribuer en PDF.",
  classe: "T3",
  mode: "BIG_STEPS",
  formats: ["cours", "pdf"],
  techniques: [],
  agents: ["maria", "arianne"],
  skills: [],
  modules: [],
  certifications: [],
  reponses: {
    "1.1":
      "Mes élèves confondent le passé simple et l'imparfait. Je réexplique la même chose à chaque cours, à l'oral, et il ne leur en reste rien la semaine suivante.",
    "1.2": "Cinq élèves sur six ont raté la même question au dernier contrôle blanc.",
    "1.3": "Des lycéens de première et terminale, LV2, niveau A2 à B1.",
    "2.1": "Format A4, recto seul, imprimable en noir et blanc — ils impriment au lycée.",
    "2.2":
      "INCLUS : le passé simple, l'imparfait, le passé composé, et le choix entre eux. EXCLUS : le subjonctif passé, le plus-que-parfait, la concordance des temps.",
    "4.1": "Qu'ils choisissent le bon temps sans réfléchir dans un exercice à trous.",
    "4.2":
      "Le risque, c'est la fiche exhaustive que personne ne lit. Il faut que ça tienne en une page.",
    "5.1": "Une fiche par temps, plus une fiche « lequel choisir » avec cinq exemples opposés.",
  },
};

async function prompt(cadrage) {
  const reponse = await fetch(`${API}/api/apercu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cadrage),
  });
  if (!reponse.ok) throw new Error(`${API}/api/apercu → ${reponse.status}`);
  return (await reponse.json()).prompt;
}

/**
 * Les sections du second prompt qui diffèrent du premier.
 *
 * Le citer en entier ferait de cette page un doublon de six cents lignes dont
 * l'essentiel serait identique — et le protocole se donne 400 lignes par
 * document (I-14). On garde ce qui change : le livrable, la conduite, et
 * l'ordre de marche.
 */
function extraitDe(t) {
  const bornes = [
    ["## Ce qu'il faut produire", "## Le noyau immuable"],
    ["## Ce qu'il faut faire maintenant", null],
  ];
  return bornes
    .map(([de, a]) => {
      const i = t.indexOf(de);
      const j = a ? t.indexOf(a) : t.length;
      return t.slice(i, j === -1 ? t.length : j).trimEnd();
    })
    .join(`

[…]

`);
}

const t1 = await prompt(EX1);
const t2 = await prompt(EX2);

const page = `<!-- @id mip.doc.exemples
     @do montrer_des_cadrages_reels_et_le_prompt_qu_ils_produisent
     @role config
     @layer doc
     @human Deux exemples complets : ce qu'on répond, et ce qui en sort -->

# Deux exemples

Ce qu'on tape dans le formulaire, et ce qui en sort. **Les prompts ci-dessous
sont réels** : cette page est refabriquée par l'outil lui-même
(\`node scripts/engendrer-exemples.mjs\`), à partir des réponses montrées — ni
raccourcis, ni retouchés. Deux cas volontairement éloignés : un correctif d'une
ligne dans du code, et un livrable qui n'est pas du code du tout.

---

## Exemple 1 — un micro-fix (T1)

### Ce qu'on remplit

**Titre** — \`${EX1.titre}\`

**La demande**, en une phrase, comme on la dirait à un collègue :

> ${EX1.demande}

**Classe** T1 (un fichier, moins de vingt lignes) · **Mode** FULL (l'agent
enchaîne, une seule validation à la fin) · **Format** Application web ·
**Technique** TypeScript, React · **Équipe** Denis, Lise

Puis les quatre questions de l'essentiel :

| Question | Réponse |
| --- | --- |
| **1.1 · Quel problème ?** | ${EX1.reponses["1.1"]} |
| **1.3 · Qui est l'utilisateur ?** | ${EX1.reponses["1.3"]} |
| **2.2 · Périmètre ?** | ${EX1.reponses["2.2"]} |
| **5.1 · Minimum viable ?** | ${EX1.reponses["5.1"]} |

### Ce qui en sort

${t1.length} caractères, environ ${jetons(t1)} k jetons.

<details>
<summary>Voir le prompt entier</summary>

${F}markdown
${t1}
${F}

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

**Titre** — \`${EX2.titre}\`

**La demande** :

> ${EX2.demande}

**Classe** T3 (un vrai petit chantier) · **Mode** BIG_STEPS (on relit à chaque
étape) · **Format** Support de cours, PDF · **Technique** aucune ·
**Équipe** Maria, Arianne

| Question | Réponse |
| --- | --- |
| **1.1 · Quel problème ?** | ${EX2.reponses["1.1"]} |
| **1.2 · Pourquoi maintenant ?** | ${EX2.reponses["1.2"]} |
| **1.3 · Qui est l'utilisateur ?** | ${EX2.reponses["1.3"]} |
| **2.1 · Contraintes ?** | ${EX2.reponses["2.1"]} |
| **2.2 · Périmètre ?** | ${EX2.reponses["2.2"]} |
| **4.1 · Bénéfice principal ?** | ${EX2.reponses["4.1"]} |
| **4.2 · Risques ?** | ${EX2.reponses["4.2"]} |
| **5.1 · Minimum viable ?** | ${EX2.reponses["5.1"]} |

### Ce qui en sort

${t2.length} caractères. Deux sections du prompt précédent ont **disparu**, et
c'est le format qui les a fait disparaître.

<details>
<summary>Voir ce qui change</summary>

${F}markdown
${extraitDe(t2)}
${F}

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
| Taille du prompt | ~${jetons(t1)} k jetons | ~${jetons(t2)} k jetons |
| Phases décrites | Git, P3, P5 | P0, P3, P4, P5, P6 |
| TDD exigé | oui | non |
| Balisage MSCM | oui | non |
| Arrêts prévus | 1 | 5 |

Dans les deux cas, **rien n'a été inventé** : ce que l'utilisateur n'a pas écrit
apparaît comme non tranché, et l'agent a pour première consigne de le demander.

## À vous

[Commencer un cadrage](/cadrage) · [Le guide](guide.md) ·
[Anatomie du prompt](prompt.md)
`;

writeFileSync("docs/exemples.md", page);
console.log("docs/exemples.md —", page.split("\n").length, "lignes");
