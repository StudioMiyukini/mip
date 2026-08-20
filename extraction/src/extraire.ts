// @id mip.extraction
// @role orchestration
// @layer outil
// @human L'extraction : lire .mip/ dans miyukini-cog et en faire un pack exploitable
// @do extraire_le_protocole_mip_depuis_le_depot_d_origine

/**
 * Extrait le protocole MIP et le balisage MSCM depuis `miyukini-cog`.
 *
 * **Pourquoi une extraction et non une copie.** Le protocole vit aujourd'hui
 * dans un monorepo, mêlé à vingt séquences d'historique, à une stack précise et
 * à des noms de projet. Ce qui est réutilisable, c'est la *forme* : la
 * classification, les phases, les questions, l'équipe. Le reste est du contexte.
 *
 * **Ce que l'extraction répare au passage.** Deux fichiers de la source sont
 * doublement encodés — « DÉCIDER » y est écrit « DÃ‰CIDER ». Recopier tel quel
 * propagerait le défaut dans tous les prompts produits.
 *
 *     npm run extraire -- --source D:/APP/miyukini-cog
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** La racine du dépôt, déduite de l'emplacement de ce fichier.
 *
 *  Pas `process.cwd()` : npm exécute un script d'espace de travail depuis le
 *  dossier de cet espace, et le pack partait alors dans `extraction/pack`. Un
 *  chemin de sortie qui dépend d'où l'on a tapé la commande est un chemin qui
 *  se trompera un jour. */
const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

import { champDe, type Champ } from "./champs.js";
import { lire } from "./encodage.js";
import { sansGras, tableauAvec, tableaux } from "./markdown.js";

const CLASSES = ["T1", "T2", "T3", "T4", "T5"] as const;
type Classe = (typeof CLASSES)[number];

export interface Question extends Champ {
  numero: string;
  texte: string;
  /** La classe minimale à partir de laquelle la question est posée. */
  depuis: Classe;
  optionnelle: boolean;
}

export interface Section {
  numero: string;
  titre: string;
  /**
   * La méthode de conception dont la section est tirée — Design Thinking,
   * Six Thinking Hats, SCAMPER. Ce n'est pas décoratif : c'est ce qui explique
   * pourquoi les questions sont dans cet ordre, et ce qui permet à qui remplit
   * le formulaire de comprendre ce qu'on lui demande.
   */
  methode: string;
  /** La section 0 se déduit du premier prompt ; elle n'est pas posée. */
  deduite: boolean;
  questions: Question[];
}

// ── le questionnaire ──────────────────────────────────────────────────────

const TITRE_SECTION = /^####\s+Section\s+(\d+)\s*[\u2014\u2013-]\s*(.+)$/gm;

/**
 * Le questionnaire du Temps 1, tiré de `p0-details.md`.
 *
 * C'est le cœur de l'application : ces questions sont celles qu'un chef de
 * projet pose avant d'écrire une ligne de code, et le prompt initial n'est que
 * leurs réponses mises en forme.
 */
export function questionnaire(source: string): Section[] {
  const texte = lire(join(source, ".mip", "modules", "p0-details.md"));
  const titres = [...texte.matchAll(TITRE_SECTION)];
  const sections: Section[] = [];

  for (const [index, titre] of titres.entries()) {
    const debut = titre.index! + titre[0].length;
    const fin = index + 1 < titres.length ? titres[index + 1].index! : texte.length;
    const corps = texte.slice(debut, fin);

    const entete = titre[2].trim();
    const ouvrante = entete.indexOf("(");
    const nom = ouvrante === -1 ? entete : entete.slice(0, ouvrante);
    const methode = ouvrante === -1 ? "" : entete.slice(ouvrante + 1).replace(/\)\s*$/, "");

    const deduite = titre[1] === "0";
    const lignes = tableaux(corps)[0] ?? [];
    const questions: Question[] = [];

    for (const ligne of lignes) {
      const numero = sansGras(ligne["#"] ?? "");
      const libelle = (ligne["Question"] ?? "").trim();
      if (!numero || !libelle) continue;

      const optionnelle = libelle.includes("[OPT]");
      const propre = libelle.replace(/`?\[OPT\]`?/g, "").trim();
      questions.push({
        numero,
        texte: propre,
        depuis: depuisClasse(sansGras(ligne["Classes"] ?? ""), deduite),
        optionnelle,
        ...champDe(numero, propre),
      });
    }

    if (questions.length) {
      sections.push({ numero: titre[1], titre: nom.trim(), methode: methode.trim(), deduite, questions });
    }
  }

  return sections;
}

/** La classe minimale, lue depuis une cellule du genre `T4-T5`. */
function depuisClasse(cellule: string, deduite: boolean): Classe {
  if (deduite) return "T1";
  const trouvees = [...cellule.matchAll(/T[1-5]/g)].map((m) => m[0] as Classe);
  if (!trouvees.length) return "T3";
  return trouvees.reduce((a, b) => (CLASSES.indexOf(a) <= CLASSES.indexOf(b) ? a : b));
}

// ── le protocole ──────────────────────────────────────────────────────────

export interface Protocole {
  classification: Array<{ classe: string; critere: string; phases: string[] }>;
  equipe: Array<{ agent: string; nom: string; role: string; phases: string; optionnel: boolean }>;
  artefacts: Array<{ artefact: string; chemin: string; phase: string }>;
  invariants: Array<{ numero: string; invariant: string; portee: string }>;
  modes: Array<{ mode: string; libelle: string; description: string }>;
}

/** Les modes d'autonomie. Le mapping vient de `setup.md`, section style de travail. */
const MODES = [
  {
    mode: "FULL",
    libelle: "Autonome",
    description: "L'agent enchaîne les phases sans s'arrêter. Une seule validation humaine, en P5.",
  },
  {
    mode: "BIG_STEPS",
    libelle: "Collaboratif",
    description: "Arrêt à chaque gate de phase : P0, P3, P4, P5 sont validées une par une.",
  },
  {
    mode: "GUIDED",
    libelle: "Supervision",
    description: "Arrêt à chaque étape du plan P3. Le plus lent, et le seul qui laisse reprendre la main en cours d'implémentation.",
  },
];

export function protocole(source: string): Protocole {
  const conventions = lire(join(source, ".mip", "protocol", "conventions.md"));

  const classes = tableauAvec(conventions, ["Classe", "Critere", "Phases"]) ?? [];
  const equipe = tableauAvec(conventions, ["Agent", "Role"]) ?? [];
  const artefacts = tableauAvec(conventions, ["Artefact", "Chemin", "Phase"]) ?? [];

  const skill = lire(join(source, ".mip", "skills", "miyukini-mip-workflow", "SKILL.md"));
  const invariants = (tableauAvec(skill, ["#", "Invariant", "Portee"]) ?? []).filter((l) =>
    l["#"].startsWith("I-"),
  );

  return {
    classification: classes.map((l) => ({
      classe: sansGras(l["Classe"]),
      critere: l["Critere"],
      phases: l["Phases"].split("->").map((p) => p.trim()),
    })),
    equipe: equipe.map((l) => {
      const brut = sansGras(l["Agent"]);
      return {
        agent: brut.split(" ")[0].toLowerCase(),
        nom: brut.split(" ")[0],
        role: l["Role"],
        phases: l["Phases principales"] ?? "",
        optionnel: /optionnel/i.test(l["Agent"]),
      };
    }),
    artefacts: artefacts.map((l) => ({
      artefact: sansGras(l["Artefact"]),
      chemin: l["Chemin"],
      phase: l["Phase"],
    })),
    invariants: invariants.map((l) => ({
      numero: l["#"],
      invariant: sansGras(l["Invariant"]),
      portee: l["Portee"],
    })),
    modes: MODES,
  };
}

// ── agents, skills, modules, certifications ───────────────────────────────

/**
 * Les prompts d'agents, bornés par phase.
 *
 * On emporte les versions **par phase** et non les `FULL_*`. C'est la règle du
 * protocole lui-même — « charger d'abord la version de phase » — et c'est ce qui
 * rend un prompt injectable : un `FULL` fait plusieurs milliers de jetons.
 */
export function agents(source: string, vers: string) {
  const dossier = join(source, ".mip", "agents");
  const sortie: Array<{ agent: string; phases: Record<string, string>; complet: string | null; jetons: number }> = [];

  for (const nom of readdirSync(dossier).sort()) {
    const chemin = join(dossier, nom);
    if (!statSync(chemin).isDirectory()) continue;

    const phases: Record<string, string> = {};
    let complet: string | null = null;
    let jetons = 0;

    const destination = join(vers, "agents", nom);
    mkdirSync(destination, { recursive: true });

    for (const fichier of readdirSync(chemin).filter((f) => f.endsWith(".md")).sort()) {
      const texte = lire(join(chemin, fichier));
      writeFileSync(join(destination, fichier), texte, "utf8");

      const racine = fichier.replace(/\.md$/, "");
      if (racine.startsWith("FULL_")) {
        complet = fichier;
      } else if (racine.includes("_")) {
        phases[racine.split("_")[0]] = fichier;
        jetons = Math.max(jetons, Math.round(texte.length / 4));
      }
    }

    if (Object.keys(phases).length || complet) sortie.push({ agent: nom, phases, complet, jetons });
  }
  return sortie;
}

/**
 * Les skills liés à la stack d'origine.
 *
 * Ils partent quand même — on ne juge pas à la place de qui installera — mais
 * ils sont **marqués**, pour qu'un projet qui n'est ni en Rust ni en Dioxus ne
 * les charge pas sans le vouloir.
 */
const LIES_A_LA_STACK = new Set([
  "miyukini-cargo-workspace",
  "miyukini-dioxus-ui",
  "miyukini-rust-patterns",
  "miyukini-cores-api",
  "miyukini-kindmother",
  "miyukini-kindmother-db",
  "miyukini-mge",
  "miyukini-mge-ainative",
  "miyukini-mws-origin",
  "miyukini-services",
  "miyukini-deplacement-orientation",
]);

export function skills(source: string, vers: string) {
  const dossier = join(source, ".mip", "skills");
  const sortie: Array<{ skill: string; description: string; generique: boolean; jetons: number }> = [];

  for (const nom of readdirSync(dossier).sort()) {
    const fiche = join(dossier, nom, "SKILL.md");
    if (!existsSync(fiche)) continue;

    const texte = lire(fiche);
    const entete = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texte);
    const description = entete ? (/^description:\s*(.+)$/m.exec(entete[1])?.[1]?.trim() ?? "") : "";

    const destination = join(vers, "skills", nom);
    mkdirSync(destination, { recursive: true });
    writeFileSync(join(destination, "SKILL.md"), texte, "utf8");

    sortie.push({
      skill: nom,
      description,
      generique: !LIES_A_LA_STACK.has(nom),
      jetons: Math.round(texte.length / 4),
    });
  }
  return sortie;
}

/**
 * Les modules de phase, recopiés et mesurés.
 *
 * Leur poids est la donnée qui compte : c'est lui qui décide de ce qu'on peut
 * joindre à un prompt sans le noyer.
 */
export function modules(source: string, vers: string) {
  const sortie: Array<{ module: string; fichier: string; jetons: number }> = [];

  // **Le nom du dossier fait partie de l'identité.** `modules/conventions.md` et
  // `protocol/conventions.md` coexistent dans la source et n'ont rien à voir.
  // Les aplatir sur leur seul nom de fichier faisait écraser le premier par le
  // second — sur le disque, sans erreur, et la collision n'apparaissait qu'à
  // l'insertion en base. Un doublon qui se voit vaut mieux qu'un fichier perdu.
  for (const origine of ["modules", "protocol"]) {
    const dossier = join(source, ".mip", origine);
    if (!existsSync(dossier)) continue;

    const destination = join(vers, "modules", origine);
    mkdirSync(destination, { recursive: true });

    for (const fichier of readdirSync(dossier).filter((f) => f.endsWith(".md")).sort()) {
      const texte = lire(join(dossier, fichier));
      writeFileSync(join(destination, fichier), texte, "utf8");
      sortie.push({
        module: `${origine}/${fichier.replace(/\.md$/, "")}`,
        fichier: `${origine}/${fichier}`,
        jetons: Math.round(texte.length / 4),
      });
    }
  }
  return sortie;
}

/**
 * La base de certifications, et l'index qui dit quand la charger.
 *
 * Dix-neuf mégaoctets sur vingt-trois. Elle est recopiée **entière** — c'est ce
 * qui a été demandé — mais elle n'entre jamais dans un prompt d'un bloc :
 * l'application ne joint que les fiches choisies. Une base de connaissances
 * qu'on injecte toujours en entier ne sert qu'à saturer le contexte.
 */
export function certifications(source: string, vers: string) {
  const dossier = join(source, ".mip", "certifications");
  if (!existsSync(dossier)) return [];

  const destination = join(vers, "certifications");
  if (existsSync(destination)) rmSync(destination, { recursive: true, force: true });
  cpSync(dossier, destination, { recursive: true });

  const sortie: Array<{ code: string; titre: string; fiches: number; ko: number }> = [];
  for (const nom of readdirSync(dossier).sort()) {
    const chemin = join(dossier, nom);
    if (!statSync(chemin).isDirectory()) continue;
    const fiches = compter(chemin);
    sortie.push({
      code: nom,
      titre: nom.replace(/[-_]/g, " ").toUpperCase(),
      fiches: fiches.nombre,
      ko: Math.round(fiches.octets / 1024),
    });
  }
  return sortie;
}

function compter(dossier: string): { nombre: number; octets: number } {
  let nombre = 0;
  let octets = 0;
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      const sous = compter(chemin);
      nombre += sous.nombre;
      octets += sous.octets;
    } else {
      octets += statSync(chemin).size;
      if (entree.name.endsWith(".md")) nombre += 1;
    }
  }
  return { nombre, octets };
}

// ── l'assemblage ──────────────────────────────────────────────────────────

function principal(): number {
  const arguments_ = process.argv.slice(2);
  const valeur = (nom: string, defaut: string) => {
    const position = arguments_.indexOf(nom);
    return position === -1 ? defaut : (arguments_[position + 1] ?? defaut);
  };

  const source = valeur("--source", "D:/APP/miyukini-cog");
  const vers = valeur("--vers", join(RACINE, "pack"));
  const sansCertifications = arguments_.includes("--sans-certifications");

  if (!existsSync(join(source, ".mip"))) {
    console.error(`Pas de .mip dans ${source}`);
    return 1;
  }
  mkdirSync(vers, { recursive: true });

  const sections = questionnaire(source);
  const pack = {
    source,
    extrait_le: new Date().toISOString().slice(0, 10),
    protocole: protocole(source),
    questionnaire: sections,
    agents: agents(source, vers),
    skills: skills(source, vers),
    modules: modules(source, vers),
    certifications: sansCertifications ? [] : certifications(source, vers),
  };

  writeFileSync(join(vers, "pack.json"), JSON.stringify(pack, null, 2), "utf8");

  const questions = sections.reduce((somme, s) => somme + s.questions.length, 0);
  console.log(`MIP — ${sections.length} sections, ${questions} questions`);
  console.log(
    `      ${pack.agents.length} agents, ${pack.skills.length} skills, ${pack.modules.length} modules, ${pack.certifications.length} certifications`,
  );
  console.log(`pack écrit dans ${vers}`);
  return 0;
}

if (basename(process.argv[1] ?? "").startsWith("extraire")) {
  process.exit(principal());
}
