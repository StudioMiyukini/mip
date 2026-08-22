// @id mip.glossaire
// @role donnee
// @layer core
// @human Ce que le protocole veut dire, en français : les phases, les mots, les rôles
// @do traduire_le_vocabulaire_du_protocole_pour_un_humain_et_pour_un_modele

/**
 * Le protocole extrait dit **quoi**, jamais **ce que ça veut dire**.
 *
 * Deux symptômes de la même lacune, l'un côté écran, l'autre côté prompt :
 *
 * - le formulaire affichait « Arianne — Team manager, QA, memoire · P0 T9, P6 ».
 *   Qui n'a pas écrit le protocole ne peut pas décider s'il lui faut Arianne :
 *   il coche par défaut, et le tag cesse d'être un choix ;
 * - le prompt ordonnait « commence en P3 », « arrête-toi à chaque gate », sans
 *   avoir jamais dit ce qu'est P3 ni ce qu'est une gate. On demandait à un
 *   modèle de suivre un protocole qu'on ne lui avait pas décrit — et il le
 *   devinait, ce qui est la définition même de ce que ce projet cherche à
 *   éviter.
 *
 * Ces textes ne viennent donc pas de l'extraction : ils n'y sont pas. Ils sont
 * **déclarés ici**, une seule fois, et servent les deux usages. Un glossaire en
 * double divergerait — c'est déjà arrivé dans ce dépôt entre l'affichage et
 * l'assemblage des questions.
 */

// ── les phases ────────────────────────────────────────────────────────────

export interface Phase {
  /** Le nom qu'un humain comprend. */
  titre: string;
  /** Ce qui s'y passe, en une phrase. */
  quoi: string;
  /** Où l'agent s'arrête, et à quelle condition il repart. */
  gate: string;
  /** Vrai si la phase n'existe qu'à partir de T3. */
  depuisT3?: boolean;
}

/**
 * Les six phases.
 *
 * **Le prompt n'en cite que celles de la classe retenue.** Décrire P4 et P6 à
 * quelqu'un qui fait un micro-fix ajoute deux cents jetons pour lui apprendre
 * des étapes qu'il ne fera pas — et laisse planer un doute sur ce qu'on attend
 * vraiment de lui.
 */
export const PHASES: Record<string, Phase> = {
  P0: {
    titre: "Cadrage",
    quoi:
      "La seule phase où l'humain décide. On explore, on spécifie, on chiffre les " +
      "risques, et on écrit un brief. Aucune ligne de code avant sa fin.",
    gate:
      "Le brief est présenté, l'humain l'approuve ou le rejette, **puis seulement** " +
      "il choisit le mode d'autonomie. Ni approbation implicite, ni choix avant lecture.",
    depuisT3: true,
  },
  Git: {
    titre: "Ouverture de branche",
    quoi: "Une branche `feat/<slug>` est créée. Rien n'est écrit sur la branche principale.",
    gate: "La branche existe et le dépôt est propre.",
  },
  P3: {
    titre: "Réalisation",
    quoi:
      "Le travail se fait, tâche par tâche, selon le plan. Un point d'étape toutes " +
      "les cinq tâches plutôt qu'un grand saut.",
    gate: "Chaque tâche passe ses vérifications avant que la suivante commence.",
  },
  P4: {
    titre: "Intégration et audit",
    quoi:
      "L'ensemble est assemblé et vérifié : construction complète, conformité à ce " +
      "qui avait été décidé, revue de sécurité.",
    gate: "Aucun défaut bloquant. Un défaut bloquant renvoie en P3, il ne se contourne pas.",
    depuisT3: true,
  },
  P5: {
    titre: "Livraison et test humain",
    quoi:
      "Le livrable est présenté à l'humain, qui l'essaie et rend un verdict : accepté, " +
      "accepté avec réserves, ou refusé.",
    gate:
      "Le verdict humain. **Il est obligatoire** — un agent ne se décerne pas son " +
      "propre quitus. Un refus renvoie au cadrage avec le motif.",
  },
  P6: {
    titre: "Rapport et capitalisation",
    quoi:
      "Ce qui a été fait est consigné : trace d'exécution, mesures, et ce qu'on retient " +
      "pour la prochaine fois.",
    gate: "Le rapport porte une trace d'exécution réelle. Sans elle, il est incomplet.",
    depuisT3: true,
  },
};

export interface Terme {
  terme: string;
  sens: string;
  /** Les phases où le mot a cours. Absent : partout. */
  portee?: string[];
}

/**
 * Le vocabulaire hiérarchique.
 *
 * **Chaque mot désigne un seul niveau**, et le protocole y tient : un agent qui
 * appelle « étape » une subdivision de P0 produit des artefacts qu'on ne
 * retrouve plus. C'est le genre de dérive qui ne casse rien tout de suite.
 *
 * `portee` sert au prompt : apprendre le mot « Temps » à un agent dont la
 * séquence ne passe pas par P0 lui donne un mot qu'il ne peut qu'employer à
 * tort. Un vocabulaire trop large ne se contente pas de coûter des jetons — il
 * invite à s'en servir.
 */
export const VOCABULAIRE: Terme[] = [
  { terme: "Séquence", sens: "un cycle complet, du cadrage au rapport" },
  { terme: "Phase", sens: "P0, Git, P3, P4, P5, P6 — l'ordre ne se réarrange pas" },
  { terme: "Temps", sens: "les onze subdivisions de P0, et de P0 seulement", portee: ["P0"] },
  { terme: "Étape", sens: "les groupes du plan de P3, et de P3 seulement", portee: ["P3"] },
  { terme: "Volet", sens: "les blocs internes de P4, P5 et P6", portee: ["P4", "P5", "P6"] },
  { terme: "Tâche", sens: "l'unité atomique — une tâche, un exécutant" },
  { terme: "Gate", sens: "le point d'arrêt entre deux phases, avec un critère explicite" },
];

/** Les phases d'une classe, dans l'ordre, décrites. */
export function phasesDe(codes: string[]): Array<Phase & { code: string }> {
  return codes.filter((c) => PHASES[c]).map((c) => ({ code: c, ...PHASES[c] }));
}

/** Les mots qui ont cours dans ces phases-là. */
export function vocabulaireDe(codes: string[]): Terme[] {
  return VOCABULAIRE.filter((t) => !t.portee || t.portee.some((p) => codes.includes(p)));
}

// ── les agents ────────────────────────────────────────────────────────────

export interface ExplicationAgent {
  /** Ce que la personne fait, dit à quelqu'un qui n'a jamais lu le protocole. */
  resume: string;
  /** Quand il vaut la peine de l'activer — ou de ne pas le faire. */
  quand: string;
  /**
   * Le nom accentué, quand la source l'a perdu.
   *
   * **On rend les accents, on ne change pas les mots.** La table du protocole
   * est écrite en ASCII : « Francois », « Expert cybersecurite ». C'est correct
   * comme identifiant et fautif comme affichage. La couche de présentation est
   * l'endroit où l'on répare ça — et un essai vérifie que la version accentuée,
   * une fois ses accents retirés, redonne exactement la chaîne d'origine. Sans
   * ce garde-fou, ce champ deviendrait un endroit où réécrire le protocole.
   */
  nom?: string;
  /** L'intitulé de poste accentué. Même règle, même garde-fou. */
  poste?: string;
}

/** « Expert cybersécurité » → « Expert cybersecurite ». */
export function sansAccents(texte: string): string {
  // Les diacritiques combinants sont retirés par leur point de code, pas par
  // une classe de caractères : écrits littéralement dans une expression
  // régulière, ils sont invisibles dans un éditeur, et la première reformulation
  // du fichier les emporte sans que rien ne le signale.
  const COMBINANTS = [0x0300, 0x036f];
  return [...texte.normalize("NFD")]
    .filter((c) => {
      const point = c.codePointAt(0) ?? 0;
      return point < COMBINANTS[0] || point > COMBINANTS[1];
    })
    .join("");
}

/**
 * Les onze rôles, expliqués.
 *
 * Le protocole donne un intitulé de poste (« Efficience tokens ») et une liste
 * de phases (« P0 T9, P4, P6 »). Ni l'un ni l'autre ne dit à un utilisateur s'il
 * en a besoin. Ces deux phrases-là, si.
 *
 * `quand` est le champ qui compte : c'est celui qui permet de **décocher**. Sans
 * lui on active tout, et le chargement à la demande — la raison d'être de ces
 * tags — ne sert plus à rien.
 */
export const AGENTS: Record<string, ExplicationAgent> = {
  maria: {
    resume:
      "Mène le cadrage : elle pose les questions, découpe le travail, ouvre la séquence " +
      "et rédige le brief. Si le livrable est refusé, c'est elle qui reprend.",
    quand: "Toujours. C'est elle qui tient le fil du début à la fin.",
  },
  denis: {
    resume:
      "Décide de l'architecture et écrit le plan d'implémentation, puis coordonne la " +
      "réalisation et présente les résultats aux points d'arrêt.",
    quand: "Dès qu'il y a du code. Sans lui, personne ne tient le plan.",
  },
  francois: {
    nom: "François",
    resume:
      "La partie invisible : le serveur, les données, les interfaces de programmation. " +
      "Il écrit d'abord la spécification technique, ensuite le code.",
    quand: "Dès qu'il y a un serveur, une base de données ou une API.",
  },
  lise: {
    resume: "La partie visible : les écrans, ce qui se clique, ce qui s'affiche.",
    quand: "Dès qu'il y a une interface. Inutile pour un outil en ligne de commande.",
  },
  victor: {
    poste: "Expert cybersécurité",
    resume:
      "Cherche ce qui peut être attaqué : entrées non vérifiées, secrets exposés, droits " +
      "d'accès trop larges. Il note le résultat sur 100 lors de l'audit.",
    quand:
      "Impératif dès qu'il y a des comptes, des paiements ou des données personnelles. " +
      "Le protocole l'impose à partir de T3.",
  },
  george: {
    poste: "Audit conformité",
    resume:
      "Vérifie que ce qui a été construit correspond à ce qui avait été décidé, et aux " +
      "référentiels joints au cadrage.",
    quand: "Quand le projet doit rendre des comptes — une norme, un client, un audit.",
  },
  hugo: {
    resume:
      "La mise en service : conteneurs, intégration continue, déploiement, ce qui fait " +
      "qu'un projet tourne ailleurs que sur la machine qui l'a écrit.",
    quand: "Si le résultat doit être déployé. Inutile pour un script local.",
  },
  arianne: {
    poste: "Team manager, QA, mémoire",
    resume:
      "Juge la faisabilité avant qu'on s'engage, puis rédige le rapport final et ce " +
      "qu'on en retient pour la fois suivante.",
    quand: "Sur les gros chantiers, où se tromper de direction coûte des semaines.",
  },
  jean: {
    resume:
      "Surveille ce que la séquence consomme en contexte et allège ce qui peut l'être. " +
      "Un contexte se paie à chaque tour, pas une fois.",
    quand: "Sur les longues séquences, ou quand le budget du modèle est une contrainte.",
  },
  fabrice: {
    resume: "Regarde ce qui existe déjà ailleurs avant qu'on reconstruise.",
    quand:
      "Quand le projet est un produit destiné à d'autres. Sans objet pour un outil interne.",
  },
  bob: {
    poste: "Codeur léger (MASS, T1-T2)",
    resume:
      "Exécute des tâches simples en parallèle, sans dérouler le protocole complet.",
    quand: "Pour un lot de petites corrections indépendantes. Optionnel, et il l'est bien.",
  },
};

/**
 * « P0 T4&T8, P3 » → « P0 temps 4 et 8, P3 ».
 *
 * **`T` veut dire deux choses dans la source, et rien ne les distingue** sinon
 * la position : `T9` après une phase désigne un *temps* de P0, `T3+` entre
 * parenthèses désigne une *classe*. « P0 T5 (T3+) » contient les deux. Une
 * substitution globale les confondrait et écrirait « temps 3+ », ce qui est
 * faux et se lit comme une vérité.
 *
 * On traite donc les deux zones séparément : hors parenthèses, `T<n>` est un
 * temps ; dedans, c'est une classe. Ce qui n'entre dans aucun des deux motifs
 * est **laissé tel quel** — un intitulé opaque vaut mieux qu'un intitulé
 * inventé, c'est la règle qui vaut déjà pour les suggestions.
 */
export function phasesEnClair(brut: string): string {
  const horsParentheses = (texte: string): string =>
    texte
      .replace(/\bT(\d{1,2})\s*&\s*T(\d{1,2})\b/g, "temps $1 et $2")
      .replace(/\bT(\d{1,2})\b/g, "temps $1")
      .replace(/\bTemps (\d+)/g, "temps $1");

  const dansParentheses = (texte: string): string =>
    texte
      .replace(/\bT(\d)\s*-\s*T(\d)\b/g, "classes T$1 et T$2")
      .replace(/\bT(\d)\+/g, "à partir de T$1");

  // On découpe sur les groupes parenthésés, en les gardant dans le résultat.
  return brut
    .split(/(\([^)]*\))/)
    .map((bout) => (bout.startsWith("(") ? dansParentheses(bout) : horsParentheses(bout)))
    .join("");
}
