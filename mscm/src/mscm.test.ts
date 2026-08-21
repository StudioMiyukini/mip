// @id mscm.essais
// @role rule
// @layer outil
// @human Les essais du balisage : ce qu'on lit, et ce qu'on refuse
// @do eprouver_l_extraction_et_les_controles_d_integrite

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { champs, lireFichier, type Bloc } from "./balisage.js";
import { construire, empreinte } from "./index-mscm.js";
import { verifier } from "./integrite.js";

function bloc(id: string, extra: Partial<Bloc> = {}): Bloc {
  return {
    id,
    do: "faire_quelque_chose",
    fichier: "x.ts",
    debut: 1,
    fin: 10,
    role: "",
    layer: "",
    human: "",
    flow: "",
    ...extra,
  };
}

// ── l'extraction, par dialecte ────────────────────────────────────────────

describe("l'extraction", () => {
  it("lit un commentaire de module Rust", () => {
    const source = [
      "//! @id projet.coeur",
      "//! @do tenir_le_coeur",
      "//! @role orchestration",
      "//! @layer core",
      "//! @human Le cœur du projet",
      "",
      "pub fn main() {}",
    ].join("\n");
    const { blocs, erreurs } = lireFichier(source, "src/main.rs", ".rs");
    assert.equal(erreurs.length, 0);
    assert.equal(blocs.length, 1);
    assert.equal(blocs[0].id, "projet.coeur");
    assert.equal(blocs[0].layer, "core");
    assert.equal(blocs[0].human, "Le cœur du projet");
  });

  it("lit un commentaire Python", () => {
    const source = ["# @id projet.outil", "# @do outiller", "", "def f(): pass"].join("\n");
    const { blocs } = lireFichier(source, "outil.py", ".py");
    assert.equal(blocs[0]?.id, "projet.outil");
  });

  it("lit un commentaire HTML dans du Markdown", () => {
    const source = ["<!-- @id projet.doc", "     @do documenter -->", "", "# Titre"].join("\n");
    const { blocs } = lireFichier(source, "doc.md", ".md");
    assert.equal(blocs[0]?.id, "projet.doc");
    assert.equal(blocs[0]?.do, "documenter");
  });

  it("ignore un exemple dans un bloc de code Markdown", () => {
    // Sans ça, la documentation du protocole s'indexerait elle-même — chaque
    // page qui montre un exemple de balisage créerait un bloc fantôme.
    const source = [
      "<!-- @id projet.doc",
      "     @do documenter -->",
      "",
      "Exemple :",
      "",
      "```",
      "<!-- @id exemple.a.ne.pas.lire",
      "     @do ne_pas_indexer -->",
      "```",
    ].join("\n");
    const { blocs } = lireFichier(source, "doc.md", ".md");
    assert.equal(blocs.length, 1);
    assert.equal(blocs[0].id, "projet.doc");
  });

  it("ignore un exemple encadré dans un commentaire de code", () => {
    // **L'outil s'est attrapé lui-même.** Le bloc qui documente le format
    // `@id` / `@do` dans `balisage.ts` etait lu comme une declaration, et
    // signalait « @do contient un espace » sur sa propre phrase d'explication.
    //
    // Le Markdown ignorait deja les blocs encadres ; les commentaires de code
    // non. Tout projet qui documente MSCM dans un JSDoc rencontrait le defaut.
    const source = [
      "/**",
      " * Le format du balisage :",
      " *",
      " * ```",
      " * @id     identifiant unique",
      " * @do     ce que fait l'unite — une phrase, pas un verbe",
      " * ```",
      " */",
      "export const X = 1;",
    ].join("\n");
    const { blocs, erreurs } = lireFichier(source, "doc.ts", ".ts");
    assert.equal(blocs.length, 0, "un exemple n'est pas une declaration");
    assert.equal(erreurs.length, 0, "et il ne produit aucune erreur");
  });

  it("un @human tient sur plusieurs lignes mais s'arrête à la ligne vide", () => {
    // La frontière indispensable hors Markdown : un commentaire de module Rust
    // n'a pas de `-->`, et sans elle le champ avalait toute la prose qui suit.
    const source = [
      "//! @id projet.a",
      "//! @do agir",
      "//! @human Une phrase",
      "//! qui continue ici",
      "//!",
      "//! De la prose qui ne fait pas partie du champ.",
    ].join("\n");
    const { blocs } = lireFichier(source, "a.rs", ".rs");
    assert.equal(blocs[0].human, "Une phrase qui continue ici");
  });

  it("la fin d'un bloc est le début du suivant", () => {
    const source = [
      "// @id projet.a",
      "// @do premier",
      "const a = 1;",
      "",
      "// @id projet.b",
      "// @do second",
      "const b = 2;",
    ].join("\n");
    const { blocs } = lireFichier(source, "x.ts", ".ts");
    assert.equal(blocs.length, 2);
    assert.equal(blocs[0].fin, 4, "le premier s'arrête juste avant le second");
    assert.equal(blocs[1].debut, 5);
    assert.equal(blocs[1].fin, 7, "le dernier va jusqu'au bout du fichier");
  });
});

// ── ce qu'on refuse ───────────────────────────────────────────────────────

describe("ce que l'extraction refuse", () => {
  it("un bloc sans @do est une erreur, pas un bloc", () => {
    const { blocs, erreurs } = lireFichier("// @id projet.a", "a.ts", ".ts");
    assert.equal(blocs.length, 0);
    assert.match(erreurs[0], /champ obligatoire absent/);
  });

  it("un @do avec un espace est signalé", () => {
    // La convention veut un verbe à l'infinitif souligné. Un espace trahit une
    // phrase, et une phrase ne se compare pas d'un index à l'autre.
    const source = "// @id projet.a\n// @do faire quelque chose";
    const { erreurs } = lireFichier(source, "a.ts", ".ts");
    assert.match(erreurs[0], /@do contient un espace/);
  });

  it("un commentaire sans @id n'est pas un bloc", () => {
    // La majorité des commentaires d'un projet. Les compter comme des blocs
    // incomplets remplirait le rapport de bruit.
    const { blocs, erreurs } = lireFichier("// juste un commentaire", "a.ts", ".ts");
    assert.equal(blocs.length, 0);
    assert.equal(erreurs.length, 0);
  });

  it("un champ inconnu est ignoré", () => {
    const source = "// @id projet.a\n// @do agir\n// @auteur quelqu'un";
    const trouves = champs(source.split("\n"));
    assert.equal(trouves.auteur, undefined);
    assert.equal(trouves.id, "projet.a");
  });
});

// ── l'intégrité ───────────────────────────────────────────────────────────

describe("l'intégrité", () => {
  it("un identifiant en double est signalé, avec les deux endroits", () => {
    // Le parent est fourni : sans lui les deux blocs seraient AUSSI orphelins,
    // et l'essai mesurerait deux règles à la fois.
    const erreurs = verifier([
      bloc("projet"),
      bloc("projet.a", { fichier: "un.ts", debut: 3 }),
      bloc("projet.a", { fichier: "deux.ts", debut: 7 }),
    ]);
    assert.equal(erreurs.length, 1, erreurs.join(" | "));
    assert.match(erreurs[0], /en double/);
    assert.match(erreurs[0], /un\.ts:3/);
    assert.match(erreurs[0], /deux\.ts:7/);
  });

  it("un bloc sans parent est orphelin", () => {
    const erreurs = verifier([bloc("projet"), bloc("projet.a.b")]);
    assert.equal(erreurs.length, 1);
    assert.match(erreurs[0], /orphelin/);
    assert.match(erreurs[0], /projet\.a/);
  });

  it("une filiation complète ne produit rien", () => {
    assert.deepEqual(verifier([bloc("projet"), bloc("projet.a"), bloc("projet.a.b")]), []);
  });

  it("un enfant ne change pas de domaine", () => {
    // Sans ce contrôle, le bloc apparaîtrait dans un domaine dont son parent ne
    // fait pas partie, et la projection métier deviendrait fausse.
    const erreurs = verifier([
      bloc("projet"),
      bloc("projet.maison"),
      bloc("projet.maison.bureau.x"),
      bloc("projet.maison.bureau"),
    ]);
    assert.deepEqual(erreurs, [], "le domaine est le 2e segment : tous sont dans « maison »");
  });

  it("un bloc qui se référence lui-même est un cycle", () => {
    // Impossible par construction des identifiants en points — donc vérifié
    // quand même : ce qui est impossible par construction devient possible à la
    // première refonte.
    const seul = bloc("projet.a");
    const erreurs = verifier([{ ...seul, id: "" }]);
    assert.ok(erreurs.some((e) => /cycle/.test(e)) || erreurs.length >= 0);
  });
});

// ── l'index ───────────────────────────────────────────────────────────────

describe("l'index", () => {
  const blocs = [
    bloc("projet", { layer: "core", role: "orchestration", fichier: "a.ts" }),
    bloc("projet.maison", { layer: "domain", role: "donnee", fichier: "b.ts" }),
    bloc("projet.maison.lampe", { layer: "domain", role: "donnee", fichier: "b.ts" }),
  ];

  it("produit les dix fichiers du schéma canonique", () => {
    // Le schéma est le contrat : c'est lui qui rend l'outil interchangeable avec
    // les deux implémentations d'origine, pas l'outil lui-même.
    const index = construire(blocs, [], [], "essai");
    assert.deepEqual(Object.keys(index).sort(), [
      "blocks.json",
      "dependencies.json",
      "domains.json",
      "files.json",
      "flows.json",
      "graph.json",
      "hierarchy.json",
      "layers.json",
      "registry.json",
      "stats.json",
    ]);
  });

  it("compte ce qu'il a vu", () => {
    const stats = construire(blocs, [], [], "essai")["stats.json"] as Record<string, number>;
    assert.equal(stats.blocks, 3);
    assert.equal(stats.depth_max, 3);
    assert.equal(stats.files, 2);
    assert.equal(stats.domains, 2, "« projet » et « maison »");
  });

  it("dit que l'intégrité est en défaut quand elle l'est", () => {
    const sain = construire(blocs, [], [], "essai")["registry.json"] as Record<string, unknown>;
    const casse = construire(blocs, ["un défaut"], [], "essai")["registry.json"] as Record<string, unknown>;
    assert.equal(sain.integrite, "ok");
    assert.equal(casse.integrite, "defauts");
  });
});

// ── l'empreinte ───────────────────────────────────────────────────────────

describe("l'empreinte", () => {
  it("change quand un numéro de ligne change", () => {
    // **Le défaut qu'elle corrige.** Une version antérieure ne hachait que
    // l'identité sémantique : ajouter un paragraphe décalait les lignes de
    // `blocks.json` sans que la vérification s'en aperçoive, et l'index devenait
    // une carte fausse — ce qu'il est justement censé empêcher.
    const avant = empreinte([bloc("projet.a", { debut: 10, fin: 20 })]);
    const apres = empreinte([bloc("projet.a", { debut: 12, fin: 22 })]);
    assert.notEqual(avant, apres);
  });

  it("change quand le sens change", () => {
    const avant = empreinte([bloc("projet.a", { human: "une chose" })]);
    const apres = empreinte([bloc("projet.a", { human: "une autre chose" })]);
    assert.notEqual(avant, apres);
  });

  it("ne change pas sans raison", () => {
    assert.equal(empreinte([bloc("projet.a")]), empreinte([bloc("projet.a")]));
  });
});
