// @id mip.glossaire.essais
// @role config
// @layer core
// @human Les essais du glossaire : la traduction des phases, et la couverture des rôles
// @do verifier_que_le_glossaire_traduit_juste_et_couvre_toute_l_equipe

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { AGENTS, PHASES, VOCABULAIRE, phasesDe, phasesEnClair, sansAccents, vocabulaireDe } from "./glossaire.js";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("la traduction des intitulés de phase", () => {
  it("déplie un temps de P0", () => {
    assert.equal(phasesEnClair("P0 T9, P6"), "P0 temps 9, P6");
  });

  it("déplie deux temps liés par une esperluette", () => {
    assert.equal(phasesEnClair("P0 T4&T8, P3, P4, P5"), "P0 temps 4 et 8, P3, P4, P5");
  });

  it("ne confond pas un temps et une classe", () => {
    // Le cas qui a motivé la separation en deux zones. « T5 » est un temps,
    // « T3+ » est une classe, et ils sont dans la même chaîne. Une
    // substitution globale écrirait « temps 3+ » — faux, et lu comme vrai.
    assert.equal(phasesEnClair("P0 T5 (T3+), P4"), "P0 temps 5 (à partir de T3), P4");
    assert.equal(phasesEnClair("P0 Temps 3 (T4-T5)"), "P0 temps 3 (classes T4 et T5)");
  });

  it("laisse intact ce qu'elle ne reconnaît pas", () => {
    assert.equal(phasesEnClair("P3 workers"), "P3 workers");
    assert.equal(phasesEnClair("P0 (lead), P5 (boucle si refus)"), "P0 (lead), P5 (boucle si refus)");
  });

  it("traduit sans perte les onze intitulés réellement présents", () => {
    // Contre la traduction qui marche sur les exemples choisis et rate le
    // reste : on relit le pack extrait, pas une liste recopiée à la main.
    const pack = JSON.parse(readFileSync(join(RACINE, "pack", "pack.json"), "utf8"));
    for (const agent of pack.protocole.equipe) {
      const clair = phasesEnClair(agent.phases ?? "");
      assert.ok(!/\bT\d/.test(clair.replace(/classes T\d et T\d|à partir de T\d/g, "")),
        `${agent.nom} : « ${agent.phases} » → « ${clair} » — un T abrégé subsiste`);
    }
  });
});

describe("les phases", () => {
  it("ne rend que les phases demandées, dans l'ordre", () => {
    const rendues = phasesDe(["P3", "P5"]);
    assert.deepEqual(rendues.map((p) => p.code), ["P3", "P5"]);
  });

  it("ignore un code de phase inconnu plutôt que de l'inventer", () => {
    assert.deepEqual(phasesDe(["P3", "P9"]).map((p) => p.code), ["P3"]);
  });

  it("chaque phase dit ce qui s'y passe et où l'on s'arrête", () => {
    for (const [code, phase] of Object.entries(PHASES)) {
      assert.ok(phase.titre.length > 3, `${code} : titre trop court`);
      assert.ok(phase.quoi.length > 40, `${code} : « quoi » trop court pour apprendre quoi que ce soit`);
      assert.ok(phase.gate.length > 20, `${code} : la gate n'est pas décrite`);
    }
  });

  it("couvre exactement les phases que le protocole utilise", () => {
    const pack = JSON.parse(readFileSync(join(RACINE, "pack", "pack.json"), "utf8"));
    const utilisees = new Set(pack.protocole.classification.flatMap((c: { phases: string[] }) => c.phases));
    for (const code of utilisees) {
      assert.ok(PHASES[code as string], `phase ${code} employée par une classe mais absente du glossaire`);
    }
  });
});

describe("les rôles expliqués", () => {
  it("chaque agent du protocole a son explication", () => {
    // Un agent sans explication réapparaîtrait dans le formulaire avec son seul
    // intitulé de poste — c'est exactement ce qu'on corrige ici.
    const pack = JSON.parse(readFileSync(join(RACINE, "pack", "pack.json"), "utf8"));
    for (const agent of pack.protocole.equipe) {
      assert.ok(AGENTS[agent.agent], `${agent.nom} (${agent.agent}) n'est pas expliqué`);
    }
  });

  it("aucune explication ne vise un agent qui n'existe pas", () => {
    const pack = JSON.parse(readFileSync(join(RACINE, "pack", "pack.json"), "utf8"));
    const codes = new Set(pack.protocole.equipe.map((a: { agent: string }) => a.agent));
    for (const code of Object.keys(AGENTS)) {
      assert.ok(codes.has(code), `${code} est expliqué mais ne figure pas dans l'équipe`);
    }
  });

  it("le « quand » dit vraiment quand, pas seulement ce que", () => {
    // Le champ qui permet de décocher. S'il se contente de répéter le rôle, on
    // active tout par défaut et le chargement à la demande ne sert plus.
    for (const [code, explication] of Object.entries(AGENTS)) {
      assert.ok(explication.resume.length > 40, `${code} : résumé trop court`);
      assert.ok(explication.quand.length > 20, `${code} : « quand » trop court`);
      assert.notEqual(explication.quand, explication.resume, `${code} : les deux champs se répètent`);
    }
  });
});

describe("les accents rendus à la source", () => {
  it("une surcharge ne change que les accents, jamais les mots", () => {
    // Le garde-fou du champ `nom`/`poste`. Sans lui, cette couche de
    // présentation deviendrait un endroit où réécrire le protocole — et la
    // divergence ne se verrait nulle part.
    const pack = JSON.parse(readFileSync(join(RACINE, "pack", "pack.json"), "utf8"));
    for (const agent of pack.protocole.equipe as Array<{ agent: string; nom: string; role: string }>) {
      const surcharge = AGENTS[agent.agent];
      if (surcharge?.nom) {
        assert.equal(sansAccents(surcharge.nom), agent.nom, `${agent.agent} : le nom a changé de mot`);
      }
      if (surcharge?.poste) {
        assert.equal(sansAccents(surcharge.poste), agent.role, `${agent.agent} : le poste a changé de mot`);
      }
    }
  });

  it("retire les diacritiques et rien d'autre", () => {
    assert.equal(sansAccents("Expert cybersécurité"), "Expert cybersecurite");
    assert.equal(sansAccents("François"), "Francois");
    assert.equal(sansAccents("Codeur léger (MASS, T1-T2)"), "Codeur leger (MASS, T1-T2)");
    assert.equal(sansAccents("déjà vu"), "deja vu", "l'espace et la casse sont intacts");
  });
});

describe("la portée du vocabulaire", () => {
  it("« Temps » n'a cours qu'avec P0, « Volet » qu'avec P4, P5 ou P6", () => {
    const mots = (codes: string[]) => vocabulaireDe(codes).map((v) => v.terme);
    assert.ok(!mots(["P3", "P5"]).includes("Temps"));
    assert.ok(mots(["P3", "P5"]).includes("Volet"));
    assert.ok(mots(["P0", "P3"]).includes("Temps"));
    assert.ok(!mots(["P0", "P3"]).includes("Volet"));
  });

  it("les mots sans portée sont toujours là", () => {
    const mots = vocabulaireDe([]).map((v) => v.terme);
    assert.deepEqual(mots, ["Séquence", "Phase", "Tâche", "Gate"]);
  });
});

describe("la documentation suit le glossaire", () => {
  it("la page du protocole nomme les onze rôles", () => {
    // Un rôle ajouté au protocole et oublié dans la page se verrait ici, pas
    // six mois plus tard. La page est écrite à la main — c'est ce contrôle qui
    // remplace la génération.
    const page = readFileSync(join(RACINE, "docs", "protocole.md"), "utf8");
    const pack = JSON.parse(readFileSync(join(RACINE, "pack", "pack.json"), "utf8"));
    for (const agent of pack.protocole.equipe as Array<{ agent: string; nom: string }>) {
      const nom = AGENTS[agent.agent]?.nom ?? agent.nom;
      assert.ok(page.includes(nom), `${nom} absent de docs/protocole.md`);
    }
  });

  it("la page du protocole décrit chaque phase du glossaire", () => {
    const page = readFileSync(join(RACINE, "docs", "protocole.md"), "utf8");
    for (const code of Object.keys(PHASES)) {
      assert.ok(page.includes(code), `phase ${code} absente de docs/protocole.md`);
    }
  });
});

describe("le vocabulaire", () => {
  it("nomme les six niveaux et la gate", () => {
    const termes = VOCABULAIRE.map((v) => v.terme);
    for (const attendu of ["Séquence", "Phase", "Temps", "Étape", "Volet", "Tâche", "Gate"]) {
      assert.ok(termes.includes(attendu), `terme manquant : ${attendu}`);
    }
  });
});
