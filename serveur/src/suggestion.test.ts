// @id mip.suggestion.essais
// @role rule
// @layer core
// @human Les essais du pré-remplissage : surtout ce qu'il n'a pas le droit de faire
// @do eprouver_les_garde_fous_du_pre_remplissage

/**
 * Le pré-remplissage est la fonction la plus dangereuse de l'application.
 *
 * Mesuré le 2026-08-20 : sur le premier essai réel, le modèle local a donné un
 * sens faux à deux acronymes et inventé un public inexistant — malgré une
 * consigne explicite de ne rien inventer. On ne peut pas l'empêcher d'inventer.
 * On peut empêcher son invention de **compter**.
 *
 * D'où des essais tournés vers les interdits plutôt que vers les capacités.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHAMPS_SUGGERES, lireSuggestions, type Question } from "./suggestion.js";

function question(numero: string, champ = "texte", options: string[] = []): Question {
  return { numero, champ, options };
}

const QUESTIONS = [
  question("0.1"),
  question("0.2"),
  question("0.4"),
  question("0.7", "liste", ["T1", "T2", "T3", "T4", "T5"]),
  question("1.1"),
  question("1.3"),
  question("2.2"),
  question("5.1"),
];

describe("le pré-remplissage ne produit que des suggestions", () => {
  it("tout ce qui sort porte l'état « suggere »", () => {
    // La règle qui tient tout le reste. Un seul `repondu` échappé, et une
    // invention entre dans le prompt comme une réponse de l'utilisateur.
    const sorties = lireSuggestions('{"probleme":"un problème","pour_qui":"des gens"}', QUESTIONS);
    assert.ok(Object.keys(sorties).length > 0, "il doit y avoir des suggestions");
    for (const [numero, reponse] of Object.entries(sorties)) {
      assert.equal(reponse.etat, "suggere", `${numero} devrait être suggéré`);
    }
  });

  it("une clé alimente toutes les questions qu'elle couvre", () => {
    // « le problème » répond à 0.1 (ORIENTER) et à 1.1 (COMPRENDRE) : la même
    // information, deux endroits. Demander deux fois au modèle inviterait deux
    // réponses différentes.
    const sorties = lireSuggestions('{"probleme":"la trace des lectures se perd"}', QUESTIONS);
    assert.equal(sorties["0.1"]?.valeur, "la trace des lectures se perd");
    assert.equal(sorties["1.1"]?.valeur, "la trace des lectures se perd");
  });
});

describe("ce que le pré-remplissage refuse", () => {
  it("une réponse vide n'est pas une suggestion", () => {
    // Le modèle met la chaîne vide quand il ne sait pas — c'est la consigne. En
    // faire une suggestion afficherait un champ hachuré vide, qui n'aide
    // personne et fait douter de tout le reste.
    const sorties = lireSuggestions('{"probleme":"","pour_qui":"   ","usage":"un usage"}', QUESTIONS);
    assert.equal(sorties["0.1"], undefined);
    assert.equal(sorties["0.4"], undefined);
    assert.equal(sorties["0.2"]?.valeur, "un usage");
  });

  it("une valeur hors des options déclarées est rejetée", () => {
    // 0.7 est une liste T1..T5. Le modèle a rendu « T3 » dans notre essai, mais
    // rien ne l'y oblige — et une valeur hors liste casserait le menu.
    assert.equal(lireSuggestions('{"classe":"T7"}', QUESTIONS)["0.7"], undefined);
    assert.equal(lireSuggestions('{"classe":"moyenne"}', QUESTIONS)["0.7"], undefined);
    assert.equal(lireSuggestions('{"classe":"T4"}', QUESTIONS)["0.7"]?.valeur, "T4");
  });

  it("une phrase qui dit l'ignorance n'est pas une réponse", () => {
    // Mesuré le 2026-08-21, en conditions réelles. La consigne demande la chaîne
    // vide quand l'information manque ; le modèle a rendu « Pas d'information
    // fournie dans la demande. » — une phrase *à propos* de son ignorance.
    //
    // C'est pire qu'une chaîne vide : ça ressemble à du contenu, ça remplit le
    // champ, et confirmé par distraction, ça entre dans le prompt comme réponse
    // à « quel problème cette demande résout-elle ».
    for (const derobade of [
      "Pas d'information fournie dans la demande.",
      "Non précisé",
      "non renseigné",
      "Je ne sais pas.",
      "Aucune information disponible",
      "N/A",
      "Inconnu",
      "Non spécifié dans la demande",
    ]) {
      const sorties = lireSuggestions(JSON.stringify({ probleme: derobade }), QUESTIONS);
      assert.equal(sorties["0.1"], undefined, `« ${derobade} » ne doit pas passer`);
    }
  });

  it("une vraie réponse qui contient le mot « information » passe", () => {
    // Le filtre doit rester étroit : « Les utilisateurs perdent l'information
    // entre deux réunions » est une réponse, pas une dérobade.
    const vraie = "Les utilisateurs perdent l'information entre deux réunions.";
    assert.equal(lireSuggestions(JSON.stringify({ probleme: vraie }), QUESTIONS)["0.1"]?.valeur, vraie);
  });

  it("une clé inconnue est ignorée", () => {
    // Le modèle invente des champs autant que des contenus.
    const sorties = lireSuggestions('{"budget":"10000 euros","probleme":"vrai"}', QUESTIONS);
    assert.equal(Object.keys(sorties).some((n) => n === "budget"), false);
    assert.ok(sorties["0.1"]);
  });

  it("une question absente du protocole n'est pas inventée", () => {
    // Si le protocole change et perd 5.1, la suggestion ne doit pas créer une
    // réponse à une question qui n'existe plus.
    const sorties = lireSuggestions('{"minimal":"une liste"}', [question("0.1")]);
    assert.deepEqual(sorties, {});
  });

  it("une réponse qui n'est pas du texte est ignorée", () => {
    const sorties = lireSuggestions('{"probleme":{"x":1},"usage":["a"],"pour_qui":42}', QUESTIONS);
    assert.deepEqual(sorties, {});
  });
});

describe("ce que le pré-remplissage fait d'une réponse illisible", () => {
  it("du JSON invalide ne rend rien, sans lever", () => {
    // Le formulaire doit rester utilisable quoi qu'il arrive : aucune fonction
    // essentielle ne dépend d'un modèle disponible.
    assert.deepEqual(lireSuggestions("pas du json", QUESTIONS), {});
    assert.deepEqual(lireSuggestions("", QUESTIONS), {});
    assert.deepEqual(lireSuggestions("null", QUESTIONS), {});
    assert.deepEqual(lireSuggestions("[1,2,3]", QUESTIONS), {});
  });

  it("le JSON entouré de bavardage est retrouvé", () => {
    // Les petits modèles encadrent volontiers leur JSON de « Voici : » et de
    // barrières de code. Le refuser ferait échouer une réponse correcte.
    const bavard = 'Voici le résultat :\n```json\n{"probleme":"trouvé"}\n```\nJ\'espère que ça aide.';
    assert.equal(lireSuggestions(bavard, QUESTIONS)["0.1"]?.valeur, "trouvé");
  });

  it("un bloc de raisonnement laissé devant ne gêne pas", () => {
    // Le raisonnement n'est pas toujours éteignable — mesuré sur trois modèles.
    const avecPensee = '<think>Je réfléchis…</think>\n{"probleme":"malgré tout"}';
    assert.equal(lireSuggestions(avecPensee, QUESTIONS)["0.1"]?.valeur, "malgré tout");
  });
});

describe("la table des champs", () => {
  it("ne couvre que l'étage 1 et la section ORIENTER", () => {
    // Suggérer une réponse à « quels risques anticipez-vous » n'aiderait
    // personne : le modèle ne connaît ni le projet, ni celui qui le mène.
    const numeros = CHAMPS_SUGGERES.flatMap((c) => c.numeros);
    for (const numero of numeros) {
      const section = numero.split(".")[0];
      assert.ok(
        section === "0" || ["1.1", "1.3", "2.2", "5.1"].includes(numero),
        `${numero} n'est ni ORIENTER ni essentielle`,
      );
    }
  });

  it("chaque clé porte une question en français pour le modèle", () => {
    for (const champ of CHAMPS_SUGGERES) {
      assert.ok(champ.question.length > 10, `${champ.cle} : question trop courte`);
      assert.ok(champ.numeros.length > 0, `${champ.cle} : aucun numéro`);
    }
  });
});
