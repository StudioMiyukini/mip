// @id mip.extraction.champ
// @role donnee
// @layer outil
// @human Le contrôle de saisie, déduit de la question elle-même
// @do deduire_le_controle_de_saisie_depuis_le_libelle

export type TypeChamp = "texte" | "ligne" | "liste" | "cases" | "echelle" | "oui_non";

export interface Champ {
  type: TypeChamp;
  options: string[];
  aide: string;
}

/**
 * Ce que l'heuristique ne peut pas deviner.
 *
 * Une table courte et explicite vaut mieux qu'une règle de plus : chaque entrée
 * ici est un cas qu'on a **vu** mal tomber en lisant la sortie, pas un cas qu'on
 * imagine. Elle est faite pour rester petite.
 */
const SURCHARGES: Record<string, Champ> = {
  "0.5": { type: "oui_non", options: [], aide: "" },
  "0.6": {
    type: "liste",
    options: ["Partir d'un existant open-source", "Écrire de zéro", "À décider"],
    aide: "",
  },
  "0.7": { type: "liste", options: ["T1", "T2", "T3", "T4", "T5"], aide: "" },
  // « INCLUS et EXCLUS » sont deux réponses dans une seule question. Le dire à
  // la saisie évite un périmètre où l'on ne sait plus ce qui est dedans — ce que
  // la question cherche précisément à éviter.
  "2.2": {
    type: "texte",
    options: [],
    aide: "Une ligne par élément. Préfixer d'un « hors : » ce qui est explicitement exclu.",
  },
  "2.4": { type: "ligne", options: [], aide: "Une date, un jalon, ou « aucune »." },
  // Le libellé porte l'échelle en toutes lettres, mais avec des barres obliques
  // qui la rendent pénible à découper proprement. On l'écrit une fois ici.
  "4.3": {
    type: "liste",
    options: [
      "C1 — mineur",
      "C2 — faible",
      "C3 — moyenne",
      "C4 — élevée",
      "C5 — stratégique",
    ],
    aide: "",
  },
  "4.4": { type: "echelle", options: ["1", "2", "3", "4", "5"], aide: "" },
};

/**
 * Le contrôle de saisie d'une question.
 *
 * **Les questions portent souvent leurs propres options.** « Prioriser :
 * (a) rapidité, (b) complétude, (c) qualité ? » est un menu déroulant écrit en
 * prose. Les extraire plutôt que de tout rendre en zone de texte, c'est la
 * différence entre un formulaire et un formulaire qu'on remplit.
 */
export function champDe(numero: string, texte: string): Champ {
  const surcharge = SURCHARGES[numero];
  if (surcharge) return surcharge;

  // « (a) minimal viable, (b) souhaité, (c) nice-to-have »
  const choix = [...texte.matchAll(/\(([a-z])\)\s*([^,;?()]+)/g)];
  if (choix.length >= 2) {
    return { type: "liste", options: choix.map((c) => c[2].trim().replace(/[.\s]+$/, "")), aide: "" };
  }

  if (/\(1\s*-\s*5\)/.test(texte)) {
    return { type: "echelle", options: ["1", "2", "3", "4", "5"], aide: "" };
  }

  // Une question fermée se reconnaît à sa forme : « X requise ? », « Y connues ? ».
  // On ne la devine pas — le doute penche vers la zone de texte, qui n'empêche
  // jamais de répondre, là où une case à cocher mal choisie ampute la réponse.
  return { type: "texte", options: [], aide: "" };
}
