// @id mip.serveur.essais
// @role config
// @layer core
// @human L'essai qui empêche la liste blanche des documents de diverger du client
// @do verifier_que_la_liste_blanche_et_le_routeur_client_nomment_les_memes_pages

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Deux listes, un seul sens : les documents servis.
 *
 * Le serveur nomme les fichiers autorisés ; le client nomme les routes qui sont
 * des documents. Elles doivent coïncider, et **rien dans le code ne les y
 * oblige** : elles vivent dans deux paquets aux résolutions de modules
 * incompatibles — `bundler` d'un côté, `NodeNext` de l'autre — et un fichier
 * partagé demanderait deux conventions d'extension différentes.
 *
 * On assume la duplication, et on la garde honnête ici. Trois symptômes
 * possibles, tous silencieux à la compilation :
 *
 * - **une page servie mais pas routée** — le lien mène à la présentation, sans
 *   erreur, et on croit à un problème de contenu ;
 * - **une page routée mais pas servie** — un 404 dans une coquille de page ;
 * - **un fichier absent du dépôt** — la même chose, mais côté disque.
 *
 * C'est le troisième qui a motivé cet essai : `docs/prompt.md` et
 * `docs/questions.md` étaient écrits, versionnés, et joignables par aucun
 * chemin.
 */
function listeDuServeur(): string[] {
  const source = readFileSync(join(RACINE, "serveur", "src", "index.ts"), "utf8");
  const bloc = source.match(/const DOCUMENTS: Record<string, string> = \{([\s\S]*?)\};/);
  assert.ok(bloc, "la liste blanche du serveur est introuvable — a-t-elle été renommée ?");
  return [...bloc[1].matchAll(/^\s*(\w+):/gm)].map((m) => m[1]);
}

function fichiersDuServeur(): Record<string, string> {
  const source = readFileSync(join(RACINE, "serveur", "src", "index.ts"), "utf8");
  const bloc = source.match(/const DOCUMENTS: Record<string, string> = \{([\s\S]*?)\};/);
  assert.ok(bloc);
  return Object.fromEntries(
    [...bloc[1].matchAll(/^\s*(\w+):\s*"([^"]+)"/gm)].map((m) => [m[1], m[2]]),
  );
}

function listeDuClient(): string[] {
  const source = readFileSync(join(RACINE, "web", "src", "App.tsx"), "utf8");
  const bloc = source.match(/const DOCUMENTS = new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(bloc, "le jeu de routes du client est introuvable — a-t-il été renommé ?");
  return [...bloc[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

describe("les documents servis", () => {
  it("le serveur et le client nomment exactement les mêmes pages", () => {
    const serveur = listeDuServeur();
    const client = listeDuClient();

    const servisNonRoutes = serveur.filter((n) => !client.includes(n));
    const routesNonServis = client.filter((n) => !serveur.includes(n));

    assert.deepEqual(servisNonRoutes, [], "servis par l'API mais absents du routeur client");
    assert.deepEqual(routesNonServis, [], "routés par le client mais absents de la liste blanche");
  });

  it("chaque fichier de la liste blanche existe", () => {
    for (const [nom, fichier] of Object.entries(fichiersDuServeur())) {
      assert.ok(existsSync(join(RACINE, fichier)), `${nom} → ${fichier} : fichier absent`);
    }
  });

  it("aucune page de docs/ n'est orpheline", () => {
    // L'inverse du précédent : un fichier écrit et jamais servi. C'est ce qui
    // est arrivé à `prompt.md` et `questions.md` — rédigés, commités, et
    // atteignables par personne.
    const servis = new Set(Object.values(fichiersDuServeur()));
    const pages = readFileSync(join(RACINE, "docs", "README.md"), "utf8");

    for (const [, nom] of pages.matchAll(/\]\((\w[\w-]*\.md)\)/g)) {
      assert.ok(
        servis.has(`docs/${nom}`),
        `docs/${nom} est référencé par la carte mais n'est servi par aucune route`,
      );
    }
  });

  it("aucun chemin ne sort du dépôt", () => {
    // La liste blanche existe pour interdire la traversée. Qu'elle ne
    // l'introduise pas elle-même.
    for (const [nom, fichier] of Object.entries(fichiersDuServeur())) {
      assert.ok(!fichier.includes(".."), `${nom} → ${fichier} : remonte hors du dépôt`);
      assert.ok(!fichier.startsWith("/"), `${nom} → ${fichier} : chemin absolu`);
    }
  });
});
