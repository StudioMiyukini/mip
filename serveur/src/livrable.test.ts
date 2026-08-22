// @id mip.livrable.essais
// @role rule
// @layer core
// @human Les essais du livrable : ce qui produit du code, et ce qui n'en produit pas
// @do eprouver_la_distinction_entre_livrable_de_code_et_document

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FORMATS, TECHNIQUES, libelleDe, produitDuCode } from "./livrable.js";

describe("les catalogues", () => {
  it("aucun code n'est en double", () => {
    // Un doublon ferait deux tags identiques, dont un qui ne se décoche pas.
    const codes = [...FORMATS, ...TECHNIQUES].map((c) => c.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  it("chaque choix porte un groupe et un libellé lisible", () => {
    for (const choix of [...FORMATS, ...TECHNIQUES]) {
      assert.ok(choix.groupe, `${choix.code} : aucun groupe`);
      assert.ok(choix.libelle.length > 1, `${choix.code} : libellé trop court`);
    }
  });

  it("les formats se rangent en trois familles", () => {
    // Ce qui s'exécute, ce qui se lit, ce qui se regarde : trois travaux
    // différents. Le troisième suit le régime du deuxième côté prompt.
    const familles = new Set(FORMATS.map((f) => f.groupe));
    assert.deepEqual(
      [...familles].sort(),
      ["Ce qui s'exécute", "Ce qui se lit", "Ce qui se regarde"],
    );
  });

  it("tout format exécutable est rangé dans « Ce qui s'exécute »", () => {
    // La liste EXECUTABLES et le groupe d'affichage sont deux sources
    // distinctes — c'est voulu, elles répondent à deux questions. Mais elles ne
    // doivent pas se contredire : un format qui exige du TDD tout en étant
    // affiché parmi les documents serait incompréhensible à l'écran.
    for (const format of FORMATS) {
      const executable = produitDuCode([format.code], []);
      assert.equal(
        executable,
        format.groupe === "Ce qui s'exécute",
        `${format.code} : groupe « ${format.groupe} » mais produitDuCode=${executable}`,
      );
    }
  });

  it("aucun groupe ne dépasse ce qu'un œil parcourt", () => {
    // Le rangement est ce qui rend une longue liste utilisable : c'est
    // l'argument du fichier, et il ne tient que si les groupes restent courts.
    // Huit entrées se balaient d'un regard ; vingt redeviennent une liste de
    // courses, et le groupe cesse de servir a quoi que ce soit.
    const tailles = new Map<string, number>();
    for (const choix of [...FORMATS, ...TECHNIQUES]) {
      tailles.set(choix.groupe, (tailles.get(choix.groupe) ?? 0) + 1);
    }
    for (const [groupe, taille] of tailles) {
      assert.ok(taille <= 15, `« ${groupe} » compte ${taille} entrées — à découper`);
    }
  });

  it("un détail n'est pas une répétition du libellé", () => {
    // Le détail est desormais affiché sous le libellé, plus en infobulle. Un
    // détail qui redit le nom occupe une ligne pour rien.
    for (const choix of [...FORMATS, ...TECHNIQUES]) {
      if (!choix.detail) continue;
      const nu = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
      assert.notEqual(nu(choix.detail), nu(choix.libelle), `${choix.code} : détail redondant`);
      assert.ok(choix.detail.length > 4, `${choix.code} : détail trop court pour apprendre quelque chose`);
    }
  });

  it("un code inconnu rend le code lui-même", () => {
    // Un cadrage enregistré avant qu'un choix disparaisse doit rester lisible.
    assert.equal(libelleDe("format-disparu"), "format-disparu");
    assert.equal(libelleDe("react"), "React");
  });
});

describe("le projet produit-il du code ?", () => {
  it("un format exécutable, oui", () => {
    assert.equal(produitDuCode(["app-web"], []), true);
    assert.equal(produitDuCode(["cli"], []), true);
  });

  it("un document seul, non", () => {
    // C'est ce qui retire le TDD du prompt. Exiger RED → GREEN de quelqu'un qui
    // rédige un support de cours apprend à l'agent que le reste du document est
    // peut-être décoratif aussi.
    assert.equal(produitDuCode(["pdf"], []), false);
    assert.equal(produitDuCode(["cours", "docx"], []), false);
  });

  it("un document plus une technique, oui", () => {
    // Un rapport engendré par un script reste du code.
    assert.equal(produitDuCode(["pdf"], ["python"]), true);
  });

  it("« à décider » ne compte pas comme une technique", () => {
    assert.equal(produitDuCode(["pdf"], ["a-decider"]), false);
  });

  it("sans rien de coché, le doute penche vers le code", () => {
    // Une exigence de test superflue coûte moins qu'une exigence manquante.
    assert.equal(produitDuCode([], []), true);
  });
});
