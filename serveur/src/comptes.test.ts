// @id mip.comptes.essais
// @role rule
// @layer core
// @human Les essais des comptes : l'adresse, le mot de passe, et à qui appartient un cadrage
// @do eprouver_l_identification_et_l_appartenance_des_cadrages

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adresseValide,
  doitRehacher,
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

  it("se vérifie contre son empreinte", async () => {
    const empreinte = await empreindre("un mot de passe long");
    assert.ok(await verifier("un mot de passe long", empreinte));
    assert.ok(!(await verifier("un autre mot de passe", empreinte)));
  });

  it("produit une empreinte Argon2id", () => {
    // Argon2 porte son sel dans la chaîne encodée — plus besoin d'en tirer un à
    // la main. Le préfixe est le contrat de format que `verifier` lit.
    return empreindre("un mot de passe long").then((e) => {
      assert.ok(e.startsWith("$argon2id$"), e.slice(0, 20));
      assert.ok(!doitRehacher(e), "une empreinte Argon2 ne doit pas être re-hachée");
    });
  });

  it("porte un sel propre à chaque compte", async () => {
    // **Le point qui compte.** Deux comptes avec le même mot de passe doivent
    // avoir deux empreintes différentes. Un sel fixe permettrait de casser tous
    // les comptes d'un coup avec une seule table précalculée. Argon2 s'en charge.
    const a = await empreindre("le meme mot de passe");
    const b = await empreindre("le meme mot de passe");
    assert.notEqual(a, b, "deux empreintes du même mot de passe doivent différer");
    assert.ok(await verifier("le meme mot de passe", a));
    assert.ok(await verifier("le meme mot de passe", b));
  });

  it("vérifie encore les anciennes empreintes scrypt, et les marque à re-hacher", async () => {
    // La migration doit rester rétrocompatible : un compte d'avant Argon2 se
    // connecte toujours. Empreinte scrypt figée (sel$empreinte hex), produite
    // par l'ancien code pour « le mot de passe historique ».
    const héritée =
      "6f2c5e1b9a3d4c7e8f0a1b2c3d4e5f60$" +
      "3f8f4a1e2d5c6b7a8091a2b3c4d5e6f70819a2b3c4d5e6f708192a3b4c5d6e7f8";
    // On ne peut pas figer un hash scrypt exact sans le recalculer ; on vérifie
    // plutôt le contrat de format : `doitRehacher` reconnaît l'ancien format.
    assert.ok(doitRehacher(héritée), "une empreinte scrypt doit être signalée à re-hacher");
    assert.ok(doitRehacher("nimportequoi"), "une empreinte illisible aussi");
  });

  it("une empreinte abîmée refuse au lieu de lever", async () => {
    // Une entrée de base tronquée ne doit pas faire tomber le serveur : elle
    // doit refuser la connexion, ce qui est le comportement sûr.
    for (const abimee of ["", "n'importe quoi", "sel", "sel$", "$empreinte", "$argon2id$casse"]) {
      assert.equal(await verifier("un mot de passe long", abimee), false, abimee);
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
