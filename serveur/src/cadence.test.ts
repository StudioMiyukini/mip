// @id mip.cadence.essais
// @role rule
// @layer core
// @human Les essais de la limite de cadence : ce qu'elle laisse passer, et ce qu'elle retient
// @do eprouver_la_limite_de_cadence

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Cadence } from "./cadence.js";

describe("la limite de cadence", () => {
  it("laisse passer sous le plafond", () => {
    const cadence = new Cadence(3, 60_000);
    for (let i = 0; i < 3; i++) assert.equal(cadence.accepte("a", i * 100), true, `appel ${i}`);
  });

  it("retient au-delà", () => {
    const cadence = new Cadence(3, 60_000);
    for (let i = 0; i < 3; i++) cadence.accepte("a", 0);
    assert.equal(cadence.accepte("a", 0), false);
  });

  it("compte par demandeur, pas globalement", () => {
    // Sans ça, le premier visiteur de la minute ferme la porte aux autres.
    const cadence = new Cadence(2, 60_000);
    cadence.accepte("a", 0);
    cadence.accepte("a", 0);
    assert.equal(cadence.accepte("a", 0), false, "a est au plafond");
    assert.equal(cadence.accepte("b", 0), true, "b n'y est pour rien");
  });

  it("oublie ce qui est sorti de la fenêtre", () => {
    // Une fenêtre glissante, pas un seau qui se vide d'un coup : sinon tout le
    // monde repart en même temps à la seconde ronde, et la pointe revient.
    const cadence = new Cadence(2, 1000);
    cadence.accepte("a", 0);
    cadence.accepte("a", 500);
    assert.equal(cadence.accepte("a", 900), false);
    assert.equal(cadence.accepte("a", 1100), true, "le premier appel est sorti de la fenêtre");
  });

  it("ne garde pas indéfiniment les demandeurs oisifs", () => {
    // Une carte qui ne se vide jamais est une fuite de mémoire à ciel ouvert :
    // une adresse par visiteur, sur un service public, pour toujours.
    const cadence = new Cadence(2, 1000);
    for (let i = 0; i < 500; i++) cadence.accepte(`visiteur-${i}`, 0);
    assert.equal(cadence.suivis(0), 500);
    cadence.accepte("dernier", 5000);
    assert.ok(cadence.suivis(5000) < 10, `les oisifs doivent partir, il en reste ${cadence.suivis(5000)}`);
  });
});
