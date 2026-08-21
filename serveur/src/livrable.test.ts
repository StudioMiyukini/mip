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

  it("les formats se rangent en deux familles", () => {
    // Ce qui s'exécute et ce qui se lit n'appellent pas le même travail.
    const familles = new Set(FORMATS.map((f) => f.groupe));
    assert.deepEqual([...familles].sort(), ["Ce qui s'exécute", "Ce qui se lit"]);
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
