// @id mip.prompt.essais
// @role rule
// @layer core
// @human Les essais de l'assembleur : l'étagement, et la suggestion qui n'est pas une réponse
// @do eprouver_l_etagement_et_le_traitement_des_suggestions

/**
 * Ces essais encodent deux décisions plutôt que de les raconter.
 *
 * **L'étagement** — le formulaire pose 21 à 32 questions d'un bloc, et le critère
 * de sortie compte les formulaires *terminés*. Un mur ne se termine pas.
 *
 * **La suggestion n'est pas une réponse** — mesuré le 2026-08-20 : sur le premier
 * essai réel, le modèle local a inventé le sens de deux acronymes et un public
 * inexistant, malgré une consigne explicite de ne rien inventer. Une invention
 * est plausible, bien écrite, et occupe le champ exactement comme une réponse.
 * D'où une règle dans le modèle de données, pas dans la couleur du champ.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assembler,
  etageDe,
  etagesDe,
  QUESTIONS_ESSENTIELLES,
  retenue,
  valeurRetenue,
  type Cadrage,
  type Matiere,
  type Question,
} from "./prompt.js";

// ── de quoi fabriquer un cadrage sans base ────────────────────────────────

function question(numero: string, depuis = "T3", optionnelle = false): Question {
  return {
    numero,
    section: "essai",
    texte: `Question ${numero} ?`,
    depuis,
    optionnelle,
    champ: "texte",
    options: [],
    aide: "",
    rang: Number(numero.replace(".", "")),
  };
}

function matiere(questions: Question[]): Matiere {
  return {
    sections: [
      {
        numero: "1",
        titre: "ESSAI",
        methode: "",
        deduite: false,
        rang: 0,
        questions,
      },
    ],
    protocole: {
      classification: [
        { classe: "T3", critere: "Feature moderee", phases: ["P0", "P3", "P5"] },
        { classe: "T5", critere: "Chantier strategique", phases: ["P0", "P3", "P4", "P5", "P6"] },
      ],
      equipe: [],
      artefacts: [],
      invariants: [],
      modes: [{ mode: "BIG_STEPS", libelle: "Collaboratif", description: "Arrêt à chaque gate." }],
    },
    skills: [],
    modules: [],
    certifications: [],
  };
}

function cadrage(reponses: Cadrage["reponses"], classe = "T3"): Cadrage {
  return {
    titre: "Essai",
    demande: "Une demande.",
    classe,
    mode: "BIG_STEPS",
    reponses,
    agents: [],
    skills: [],
    modules: [],
    certifications: [],
  };
}

// ── l'étagement ───────────────────────────────────────────────────────────

describe("l'étagement", () => {
  it("les quatre questions essentielles sont à l'étage 1", () => {
    // Déclarées, pas déduites : « les quatre premières » donnerait quatre
    // questions de la même section, donc quatre fois le même angle.
    assert.equal(QUESTIONS_ESSENTIELLES.length, 4);
    for (const numero of QUESTIONS_ESSENTIELLES) {
      assert.equal(etageDe(question(numero), "T3"), 1, `${numero} doit être à l'étage 1`);
    }
  });

  it("les quatre angles sont distincts et couvrent plusieurs sections", () => {
    // Le besoin, la cible, la limite, le premier pas.
    //
    // La première version de cet essai exigeait quatre *sections* distinctes.
    // C'était un substitut, et il était faux : 1.1 « quel problème » et 1.3
    // « qui est l'utilisateur » sont deux angles bien distincts, tous deux dans
    // la section COMPRENDRE. Ce qui compte n'est pas d'éparpiller les sections,
    // c'est de ne pas concentrer les quatre questions au même endroit.
    assert.deepEqual(QUESTIONS_ESSENTIELLES, ["1.1", "1.3", "2.2", "5.1"]);
    assert.equal(new Set(QUESTIONS_ESSENTIELLES).size, 4, "aucun doublon");

    const sections = new Set(QUESTIONS_ESSENTIELLES.map((n) => n.split(".")[0]));
    assert.ok(sections.size >= 3, `trop concentré : ${[...sections].join(", ")}`);
  });

  it("une question non optionnelle et posée est à l'étage 2", () => {
    assert.equal(etageDe(question("1.2", "T3", false), "T3"), 2);
  });

  it("une question optionnelle est à l'étage 3", () => {
    assert.equal(etageDe(question("3.4", "T4", true), "T5"), 3);
  });

  it("une question hors de la classe n'a pas d'étage", () => {
    // « depuis T4 » veut dire T4 et T5. En T3, la question n'est pas posée.
    assert.equal(etageDe(question("4.4", "T4", true), "T3"), null);
    assert.equal(retenue(question("4.4", "T4"), "T3"), false);
    assert.equal(retenue(question("4.4", "T4"), "T4"), true);
  });

  it("l'essentiel reste à l'étage 1 même s'il est optionnel dans le protocole", () => {
    // Le cas qui casse une implémentation naïve : si l'on teste `optionnelle`
    // avant l'appartenance aux essentielles, 2.2 tomberait à l'étage 3.
    const essentielle = QUESTIONS_ESSENTIELLES[0];
    assert.equal(etageDe(question(essentielle, "T3", true), "T3"), 1);
  });
});

describe("l'étage voyage avec la question", () => {
  it("chaque classe a son étage, calculé une fois pour toutes", () => {
    // Le client ne recalcule pas : il reçoit la table et lit dedans. Un
    // recalcul côté client diverge — c'est déjà arrivé avec `retenue()`.
    const table = etagesDe(question("4.4", "T4", true));
    assert.deepEqual(table, { T1: null, T2: null, T3: null, T4: 3, T5: 3 });
  });

  it("une essentielle est à l'étage 1 à toutes les classes", () => {
    // Y compris T1 et T2, où le protocole ne pose presque rien : l'étage 1
    // est le socle du prompt, pas une option de la classe.
    assert.deepEqual(etagesDe(question("1.1", "T3")), {
      T1: 1, T2: 1, T3: 1, T4: 1, T5: 1,
    });
  });
});

// ── une suggestion n'est pas une réponse ──────────────────────────────────

describe("les suggestions", () => {
  it("une réponse en texte simple vaut « répondu »", () => {
    // Compatibilité : les cadrages déjà enregistrés portent des chaînes nues.
    assert.equal(valeurRetenue("du texte"), "du texte");
  });

  it("une valeur confirmée est retenue", () => {
    assert.equal(valeurRetenue({ valeur: "du texte", etat: "repondu" }), "du texte");
  });

  it("une suggestion non confirmée est ignorée", () => {
    // La règle qui compte. Mesuré : le modèle invente, et son invention occupe
    // le champ comme une réponse.
    assert.equal(valeurRetenue({ valeur: "inventé par le modèle", etat: "suggere" }), "");
  });

  it("une suggestion n'entre pas dans le prompt et compte comme manquante", () => {
    const m = matiere([question("1.1"), question("1.2")]);
    const c = cadrage({
      "1.1": { valeur: "Management Information Platform", etat: "suggere" },
      "1.2": { valeur: "Une vraie réponse", etat: "repondu" },
    });
    const prompt = assembler(c, m);

    assert.ok(!prompt.includes("Management Information Platform"), "l'invention ne doit pas passer");
    assert.ok(prompt.includes("Une vraie réponse"), "la vraie réponse doit passer");
    assert.ok(prompt.includes("Ce qui n'a pas été tranché"), "le trou doit être signalé");
    assert.ok(
      prompt.includes("1.1"),
      "la question suggérée doit figurer parmi celles qui restent à trancher",
    );
  });

  it("un cadrage entièrement suggéré ne prétend rien", () => {
    const m = matiere([question("1.1"), question("1.2")]);
    const prompt = assembler(
      cadrage({
        "1.1": { valeur: "a", etat: "suggere" },
        "1.2": { valeur: "b", etat: "suggere" },
      }),
      m,
    );
    assert.ok(prompt.includes("2 questions sans réponse"), prompt.slice(0, 400));
  });
});

// ── le prompt de l'étage 1 ────────────────────────────────────────────────

describe("le prompt de l'étage 1", () => {
  it("quatre réponses suffisent à produire un prompt utilisable", () => {
    const questions = QUESTIONS_ESSENTIELLES.map((n) => question(n)).concat([
      question("1.2"),
      question("3.4", "T4", true),
    ]);
    const reponses = Object.fromEntries(QUESTIONS_ESSENTIELLES.map((n) => [n, "réponse " + n]));
    const prompt = assembler(cadrage(reponses), matiere(questions));

    // Utilisable veut dire : la demande, la conduite, les réponses, et un ordre
    // de marche. Pas « complet » — complet, c'est l'étage 3.
    for (const attendu of ["## La demande", "## Classification et conduite", "## Le cadrage", "## Ce qu'il faut faire maintenant"]) {
      assert.ok(prompt.includes(attendu), `section manquante : ${attendu}`);
    }
    for (const numero of QUESTIONS_ESSENTIELLES) {
      assert.ok(prompt.includes("réponse " + numero), `réponse ${numero} absente`);
    }
  });

  it("le prompt dit ce qui manque plutôt que de le taire", () => {
    const questions = QUESTIONS_ESSENTIELLES.map((n) => question(n)).concat([question("1.2")]);
    const reponses = Object.fromEntries(QUESTIONS_ESSENTIELLES.map((n) => [n, "réponse"]));
    const prompt = assembler(cadrage(reponses), matiere(questions));

    assert.ok(prompt.includes("Ce qui n'a pas été tranché"));
    assert.ok(prompt.includes("1.2"), "la question non posée doit être listée");
  });
});
