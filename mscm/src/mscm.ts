#!/usr/bin/env node
// @id mscm
// @role orchestration
// @layer outil
// @human Le générateur d'index MSCM : un outil, cinq familles de langages
// @do parcourir_un_projet_et_generer_ou_verifier_son_index

/**
 * MSCM — Miyukini Semantic Code Markup.
 *
 * > La sémantique est dans le code. La structure est dans l'index. La
 * > gouvernance est dans le graphe.
 *
 * ```
 * mscm                génère l'index dans mscm_index/
 * mscm --verifier     échoue si l'index est périmé — pour l'intégration continue
 * mscm --racine <d>   parcourt un autre dossier
 * mscm --ignorer a,b   n'entre pas dans ces dossiers, en plus des defauts
 * ```
 *
 * **Pourquoi cet outil existe.** Le balisage vivait en deux exemplaires
 * divergents : une version Rust qui ne lisait que les fichiers `.rs` et était
 * câblée sur la disposition d'un monorepo, une version Python qui lisait cinq
 * langages et vérifiait l'intégrité. Deux copies d'un même outil qui dérivent
 * depuis mars. Celle-ci les remplace toutes les deux, et produit **exactement le
 * même schéma d'index** — c'est le format qui fait la compatibilité, pas l'outil.
 */

import { readdirSync, readFileSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

import { DIALECTES, IGNORES, lireFichier, profondeur, type Bloc } from "./balisage.js";
import { construire, empreinte } from "./index-mscm.js";
import { verifier } from "./integrite.js";

interface Options {
  racine: string;
  sortie: string;
  projet: string;
  /** Des dossiers a ne pas parcourir, en plus des defauts. */
  ignores: Set<string>;
  verifierSeulement: boolean;
}

function lireOptions(arguments_: string[]): Options {
  const valeur = (nom: string, defaut: string): string => {
    const position = arguments_.indexOf(nom);
    return position === -1 ? defaut : (arguments_[position + 1] ?? defaut);
  };
  const racine = resolve(valeur("--racine", process.cwd()));
  return {
    racine,
    sortie: resolve(valeur("--sortie", join(racine, "mscm_index"))),
    projet: valeur("--projet", nomDuProjet(racine)),
    // **En plus** des defauts, jamais a leur place : un projet qui ajoute un
    // dossier a ignorer ne veut pas reintroduire `node_modules`.
    ignores: new Set([
      ...IGNORES,
      ...valeur("--ignorer", "").split(",").map((n) => n.trim()).filter(Boolean),
    ]),
    verifierSeulement: arguments_.includes("--verifier"),
  };
}

/** Le nom du projet, lu dans `package.json` s'il y en a un. */
function nomDuProjet(racine: string): string {
  try {
    const paquet = JSON.parse(readFileSync(join(racine, "package.json"), "utf8"));
    if (typeof paquet.name === "string") return paquet.name;
  } catch {
    // Pas de package.json, ou illisible : le nom du dossier fera l'affaire.
  }
  return racine.split(sep).filter(Boolean).pop() ?? "projet";
}

/** Tous les fichiers lisibles, sans entrer dans ce qui est ignoré. */
function* fichiers(dossier: string, ignores: Set<string>): Generator<string> {
  let entrees;
  try {
    entrees = readdirSync(dossier, { withFileTypes: true });
  } catch {
    return; // dossier illisible : on passe, plutôt que d'échouer sur un droit
  }
  for (const entree of entrees.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    if (ignores.has(entree.name) || entree.name.startsWith(".")) continue;
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      yield* fichiers(chemin, ignores);
    } else if (extname(entree.name) in DIALECTES) {
      yield chemin;
    }
  }
}

interface Parcours {
  blocs: Bloc[];
  erreurs: string[];
  liens: Array<[string, string]>;
}

function parcourir(racine: string, ignores: Set<string>): Parcours {
  const blocs: Bloc[] = [];
  const erreurs: string[] = [];
  const parFichier = new Map<string, string[]>();

  for (const chemin of fichiers(racine, ignores)) {
    const relatif = relative(racine, chemin).split(sep).join("/");
    let texte: string;
    try {
      texte = readFileSync(chemin, "utf8");
    } catch {
      continue;
    }
    const lecture = lireFichier(texte, relatif, extname(chemin));
    blocs.push(...lecture.blocs);
    erreurs.push(...lecture.erreurs);
    if (lecture.blocs.length && lecture.liens.length) {
      parFichier.set(lecture.blocs[0].id, lecture.liens);
    }
  }

  // Un lien entre documents devient une dépendance entre leurs blocs racines.
  const racines = new Map<string, string>();
  for (const bloc of blocs) {
    // Le **dernier** bloc racine du fichier gagne, pas le premier. C'est le
    // comportement de l'implémentation Python d'origine, et la compatibilité
    // des index prime sur une préférence : deux outils qui produisent des
    // dépendances différentes sur le même dépôt ne sont pas interchangeables.
    if (profondeur(bloc) <= 3) racines.set(bloc.fichier.split("/").pop()!, bloc.id);
  }

  const liens: Array<[string, string]> = [];
  for (const [source, cibles] of parFichier) {
    for (const cible of cibles) {
      const vise = racines.get(cible);
      if (vise && vise !== source) liens.push([source, vise]);
    }
  }

  return { blocs, erreurs, liens };
}

function ecrire(index: Record<string, unknown>, destination: string): void {
  mkdirSync(destination, { recursive: true });
  for (const [nom, contenu] of Object.entries(index)) {
    writeFileSync(join(destination, nom), JSON.stringify(contenu, null, 2) + "\n", "utf8");
  }
}

/** L'empreinte inscrite dans l'index existant, ou `null`. */
function empreinteEcrite(sortie: string): string | null {
  try {
    const registre = JSON.parse(readFileSync(join(sortie, "registry.json"), "utf8"));
    return typeof registre.empreinte === "string" ? registre.empreinte : null;
  } catch {
    return null;
  }
}

function principal(): number {
  const options = lireOptions(process.argv.slice(2));
  try {
    if (!statSync(options.racine).isDirectory()) throw new Error("pas un dossier");
  } catch {
    console.error(`MSCM — ${options.racine} n'est pas un dossier lisible.`);
    return 2;
  }

  const { blocs, erreurs: erreursLecture, liens } = parcourir(options.racine, options.ignores);
  const erreurs = [...erreursLecture, ...verifier(blocs)];
  const index = construire(blocs, erreurs, liens, options.projet);
  const stats = index["stats.json"] as Record<string, number>;

  console.log(
    `MSCM — ${stats.blocks} blocs, ${stats.files} fichiers, ${stats.domains} domaines, ` +
      `${stats.layers} couches, profondeur max ${stats.depth_max}`,
  );

  if (erreurs.length) {
    console.error(`intégrité : ${erreurs.length} défaut(s)`);
    for (const erreur of erreurs) console.error(`  ✗ ${erreur}`);
  } else {
    console.log("intégrité : aucun doublon, aucun orphelin, aucun cycle");
  }

  if (options.verifierSeulement) {
    // **La vérification échoue, elle n'avertit pas.** Un index périmé est une
    // carte fausse, et on s'y fie — c'est ce qui la rend pire qu'un index absent.
    const ecrite = empreinteEcrite(options.sortie);
    const attendue = empreinte([...blocs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
    if (ecrite === null) {
      console.error("index absent : lancer `mscm` pour le générer.");
      return 1;
    }
    if (ecrite !== attendue) {
      console.error(`index périmé : ${ecrite} sur le disque, ${attendue} dans le code.`);
      return 1;
    }
    console.log("index à jour");
    return erreurs.length ? 1 : 0;
  }

  ecrire(index, options.sortie);
  // L'empreinte affichée doit être celle qui est écrite : elle se calcule sur
  // les blocs **triés**, comme dans le registre.
  const registre = index["registry.json"] as { empreinte: string };
  console.log(`index écrit dans ${options.sortie} (empreinte ${registre.empreinte})`);
  // On écrit **même en cas de défaut** : l'index reste la meilleure carte
  // disponible, et le registre porte la liste des défauts. Mais le code de
  // sortie dit non, pour que l'intégration continue s'arrête.
  return erreurs.length ? 1 : 0;
}

process.exit(principal());
