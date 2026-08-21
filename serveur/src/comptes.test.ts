// @id mip.comptes.essais
// @role rule
// @layer core
// @human Les essais des comptes : l'adresse, le mot de passe, et à qui appartient un cadrage
// @do eprouver_l_identification_et_l_appartenance_des_cadrages

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adresseValide,
  empreindre,
  motDePasseAcceptable,
  normaliserAdresse,
  peutLire,
  peutEcrire,
  verifier,
} from "./comptes.js";

describe("l'adresse", () => {
  it("se normalise avant d'être comparée", () => {
    // Sans ça, « Jean@Exemple.FR » et « jean@exemple.fr » sont deux comptes, et
    // l'utilisateur ne comprend pas pourquoi son mot de passe est refusé.
    assert.equal(normaliserAdresse("  Jean@Exemple.FR "), "jean@exemple.fr");
  });

  it("accepte ce qui ressemble à une adresse et refuse le reste", () => {
    for (const bonne of ["a@b.fr", "jean.dupont@exemple.co.uk", "j+mip@exemple.org"]) {
      assert.ok(adresseValide(bonne), `${bonne} devrait passer`);
    }
    for (const mauvaise of ["", "jean", "jean@", "@exemple.fr", "jean exemple.fr", "a@b"]) {
      assert.ok(!adresseValide(mauvaise), `${mauvaise} ne devrait pas passer`);
    }
  });
});

describe("le mot de passe", () => {
  it("exige une longueur, pas une composition", () => {
    // Les règles de composition — une majuscule, un chiffre, un caractère
    // spécial — produisent « Password1! » et rien de mieux. La longueur est la
    // seule exigence qui augmente vraiment le coût d'une attaque.
    assert.ok(!motDePasseAcceptable("court"));
    assert.ok(!motDePasseAcceptable("1234567"));
    assert.ok(motDePasseAcceptable("un mot de passe long"));
    assert.ok(motDePasseAcceptable("12345678"));
  });

  it("se vérifie contre son empreinte", () => {
    const empreinte = empreindre("un mot de passe long");
    assert.ok(verifier("un mot de passe long", empreinte));
    assert.ok(!verifier("un autre mot de passe", empreinte));
  });

  it("porte un sel propre à chaque compte", () => {
    // **Le point qui compte.** Deux comptes avec le même mot de passe doivent
    // avoir deux empreintes différentes. Un sel fixe — comme celui de la porte
    // partagée, où il n'y a qu'un secret — permettrait de casser tous les
    // comptes d'un coup avec une seule table précalculée.
    const a = empreindre("le meme mot de passe");
    const b = empreindre("le meme mot de passe");
    assert.notEqual(a, b, "deux empreintes du même mot de passe doivent différer");
    assert.ok(verifier("le meme mot de passe", a));
    assert.ok(verifier("le meme mot de passe", b));
  });

  it("une empreinte abîmée refuse au lieu de lever", () => {
    // Une entrée de base tronquée ne doit pas faire tomber le serveur : elle
    // doit refuser la connexion, ce qui est le comportement sûr.
    for (const abimee of ["", "n'importe quoi", "sel", "sel$", "$empreinte"]) {
      assert.equal(verifier("un mot de passe long", abimee), false, abimee);
    }
  });
});

describe("à qui appartient un cadrage", () => {
  const mien = { utilisateur: "moi" };
  const tien = { utilisateur: "toi" };
  const anonyme = { utilisateur: null };

  it("on lit et modifie le sien", () => {
    assert.ok(peutLire(mien, "moi"));
    assert.ok(peutEcrire(mien, "moi"));
  });

  it("on ne touche pas à celui d'un autre", () => {
    // La règle qui compte le plus. Un cadrage décrit un projet — parfois avant
    // qu'il existe publiquement.
    assert.ok(!peutLire(tien, "moi"));
    assert.ok(!peutEcrire(tien, "moi"));
  });

  it("un visiteur sans compte ne lit rien de personne", () => {
    assert.ok(!peutLire(mien, null));
    assert.ok(!peutEcrire(mien, null));
  });

  it("un cadrage sans propriétaire n'appartient à personne", () => {
    // Les cadrages enregistrés avant les comptes. Ils ne sont pas « à tout le
    // monde » : ils ne sont à personne, et personne ne les lit par l'interface.
    assert.ok(!peutLire(anonyme, "moi"));
    assert.ok(!peutEcrire(anonyme, "moi"));
    assert.ok(!peutLire(anonyme, null));
  });
});
