// @id mip.bd
// @role donnee
// @layer infra
// @human La connexion PostgreSQL, et la lecture du protocole
// @do ouvrir_la_base_et_lire_le_protocole

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import type { Matiere, Protocole, Question, Section } from "./prompt.js";

const ICI = dirname(fileURLToPath(import.meta.url));
export const RACINE = join(ICI, "..", "..");

/**
 * La connexion.
 *
 * Un pool et non une connexion unique : le serveur répond à plusieurs onglets,
 * et une connexion partagée sérialiserait les requêtes sans qu'on le voie —
 * elle se manifesterait par une lenteur, pas par une erreur.
 */
export const bassin = new pg.Pool({
  host: process.env.PGHOST ?? "127.0.0.1",
  port: Number(process.env.PGPORT ?? 54329),
  user: process.env.PGUSER ?? "mip",
  password: process.env.PGPASSWORD ?? "mip",
  database: process.env.PGDATABASE ?? "mip_studio",
  max: 8,
});

export function schema(): string {
  return readFileSync(join(ICI, "schema.sql"), "utf8");
}

/**
 * Le protocole entier, en une lecture.
 *
 * Il tient en quelques dizaines de kilo-octets et ne change qu'à l'ingestion.
 * Le relire à chaque requête coûterait cinq allers-retours pour afficher un
 * formulaire ; le garder en mémoire coûte une variable.
 */
let enMemoire: Matiere | null = null;

export async function matiere(): Promise<Matiere> {
  if (enMemoire) return enMemoire;

  const sections = await bassin.query<Section>(
    "SELECT numero, titre, methode, deduite, rang FROM section ORDER BY rang",
  );
  const questions = await bassin.query<Question & { section: string }>(
    "SELECT numero, section, texte, depuis, optionnelle, champ, options, aide, rang FROM question ORDER BY rang",
  );
  const protocole = await bassin.query<{ cle: string; valeur: unknown }>(
    "SELECT cle, valeur FROM protocole",
  );
  const skills = await bassin.query("SELECT code, description, generique, jetons FROM skill ORDER BY generique DESC, code");
  const modules = await bassin.query("SELECT code, fichier, jetons FROM module ORDER BY code");
  const certifications = await bassin.query("SELECT code, titre, fiches, ko FROM certification ORDER BY code");

  const parCle = Object.fromEntries(protocole.rows.map((l) => [l.cle, l.valeur]));

  enMemoire = {
    sections: sections.rows.map((s) => ({
      ...s,
      questions: questions.rows.filter((q) => q.section === s.numero),
    })),
    protocole: {
      classification: (parCle.classification ?? []) as Protocole["classification"],
      equipe: (parCle.equipe ?? []) as Protocole["equipe"],
      artefacts: (parCle.artefacts ?? []) as Protocole["artefacts"],
      invariants: (parCle.invariants ?? []) as Protocole["invariants"],
      modes: (parCle.modes ?? []) as Protocole["modes"],
    },
    skills: skills.rows as Matiere["skills"],
    modules: modules.rows as Matiere["modules"],
    certifications: certifications.rows as Matiere["certifications"],
  };
  return enMemoire;
}

/** À appeler après une ingestion : le protocole a changé sous le cache. */
export function oublier(): void {
  enMemoire = null;
}
