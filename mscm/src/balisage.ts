// @id mscm.balisage
// @role donnee
// @layer outil
// @human L'extraction : repérer les commentaires, puis y lire les champs
// @do extraire_les_blocs_mscm_d_un_fichier_source

/**
 * Le balisage MSCM.
 *
 * Cinq annotations dans un commentaire, et un index reconstruit à partir
 * d'elles :
 *
 * ```
 * @id     identifiant unique et hiérarchique — obligatoire
 * @do     ce que fait l'unité — obligatoire
 * @role   securite | donnee | orchestration | ui | config | rule
 * @layer  core | domain | infra | outil | ui | doc
 * @human  une phrase lisible, pour qui n'a pas le code sous les yeux
 * ```
 *
 * **On n'analyse pas le langage.** Un balisage vit toujours dans un
 * commentaire, et un commentaire se reconnaît à peu de frais. Écrire un
 * analyseur par langage coûterait cent fois plus pour la même sortie.
 */

/** Les extensions lues, et la façon d'y trouver les commentaires. */
export const DIALECTES: Record<string, "markdown" | "diese" | "barre"> = {
  ".md": "markdown",
  // `//!` et `///` commencent par `//` : le dialecte à barres suffit pour Rust.
  ".rs": "barre",
  ".ts": "barre",
  ".tsx": "barre",
  ".js": "barre",
  ".mjs": "barre",
  ".jsx": "barre",
  ".go": "barre",
  ".java": "barre",
  ".c": "barre",
  ".h": "barre",
  ".cpp": "barre",
  ".cs": "barre",
  ".py": "diese",
  ".rb": "diese",
  ".sh": "diese",
  ".yml": "diese",
  ".yaml": "diese",
  ".sql": "barre",
};

/** Ce qu'on ne parcourt jamais. */
export const IGNORES = new Set([
  ".git",
  "node_modules",
  "__pycache__",
  ".venv",
  "venv",
  "mscm_index",
  "target",
  "dist",
  "build",
  ".next",
  "coverage",
  "vendor",
]);

/** Les champs du protocole. Les deux premiers sont obligatoires. */
export const CHAMPS = ["id", "do", "role", "layer", "human", "flow"] as const;
const OBLIGATOIRES = ["id", "do"] as const;

export interface Bloc {
  id: string;
  do: string;
  fichier: string;
  debut: number;
  fin: number;
  role: string;
  layer: string;
  human: string;
  flow: string;
}

export function profondeur(bloc: Bloc): number {
  return bloc.id.split(".").length;
}

/** Le domaine : le deuxième segment, ou le premier s'il est seul. */
export function domaine(bloc: Bloc): string {
  const parts = bloc.id.split(".");
  return parts.length > 1 ? parts[1] : parts[0];
}

export function parent(bloc: Bloc): string {
  const parts = bloc.id.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : "";
}

const MARQUEUR = /^\s*@(\w+)\s*(.*)$/;

/**
 * Le préfixe de commentaire, retiré.
 *
 * **L'ordre compte** : `///` et `//!` doivent passer avant `//`, sinon il reste
 * un caractère devant le `@` et le champ n'est plus reconnu.
 */
const NETTOYAGE = /^\s*(?:<!--|-->|#|\/\/\/|\/\/!|\/\/|\/\*|\*\/|\*)?\s?/;

/** Un groupe de lignes de commentaire, avec sa ligne de départ (1-indexée). */
interface Groupe {
  debut: number;
  lignes: string[];
}

function commentairesMarkdown(lignes: string[]): Groupe[] {
  const groupes: Groupe[] = [];
  let dedans = false;
  let debut = 0;
  let tampon: string[] = [];
  // Un exemple dans un bloc de code n'est pas une déclaration. Sans ça, la
  // documentation du protocole s'indexerait elle-même.
  let cloture = false;

  lignes.forEach((ligne, index) => {
    const n = index + 1;
    const nue = ligne.trimStart();
    if (nue.startsWith("```") || nue.startsWith("~~~")) {
      cloture = !cloture;
      return;
    }
    if (cloture) return;

    if (!dedans && ligne.includes("<!--")) {
      dedans = true;
      debut = n;
      tampon = [ligne];
      if (ligne.split("<!--")[1]?.includes("-->")) {
        dedans = false;
        groupes.push({ debut, lignes: tampon });
      }
    } else if (dedans) {
      tampon.push(ligne);
      if (ligne.includes("-->")) {
        dedans = false;
        groupes.push({ debut, lignes: tampon });
      }
    }
  });
  return groupes;
}

function commentairesCode(lignes: string[], dialecte: "diese" | "barre"): Groupe[] {
  const groupes: Groupe[] = [];
  const prefixe = dialecte === "diese" ? "#" : "//";
  const [ouvre, ferme] = dialecte === "diese" ? ['"""', '"""'] : ["/*", "*/"];

  let debut = 0;
  let tampon: string[] = [];
  let dedansBloc = false;

  lignes.forEach((ligne, index) => {
    const n = index + 1;
    const nue = ligne.trim();

    if (dedansBloc) {
      tampon.push(ligne);
      if (nue.includes(ferme)) {
        groupes.push({ debut, lignes: tampon });
        dedansBloc = false;
        tampon = [];
      }
      return;
    }

    if (nue.startsWith(ouvre)) {
      const reste = nue.slice(ouvre.length);
      if (reste.includes(ferme)) {
        groupes.push({ debut: n, lignes: [ligne] });
      } else {
        dedansBloc = true;
        debut = n;
        tampon = [ligne];
      }
      return;
    }

    if (nue.startsWith(prefixe)) {
      if (!tampon.length) debut = n;
      tampon.push(ligne);
    } else if (tampon.length) {
      groupes.push({ debut, lignes: tampon });
      tampon = [];
    }
  });

  if (tampon.length) groupes.push({ debut, lignes: tampon });
  return groupes;
}

/**
 * Les champs `@nom valeur` d'un groupe de commentaires.
 *
 * Une valeur peut tenir sur plusieurs lignes : tout ce qui suit lui appartient
 * jusqu'au prochain `@nom` — c'est ce qui permet un `@human` en phrase — **ou
 * jusqu'à une ligne vide**.
 *
 * Cette seconde frontière est indispensable hors du Markdown : un commentaire
 * de module Rust n'a pas de `-->` pour se terminer, et sans elle le champ
 * avalait toute la prose qui suit le bloc d'étiquettes.
 */
export function champs(lignes: string[]): Record<string, string> {
  const trouves: Record<string, string[]> = {};
  let courant = "";
  // **Un exemple encadré n'est pas une déclaration.** Le Markdown le savait
  // déjà ; les commentaires de code, non — et le module qui documente le format
  // se déclarait lui-même, en signalant « @do contient un espace » sur sa propre
  // phrase d'explication. Tout projet qui documente MSCM dans un JSDoc tombait
  // dessus.
  let encadre = false;

  for (const brute of lignes) {
    const ligne = brute.replace(NETTOYAGE, "").replace("-->", "").trimEnd();
    if (ligne.trimStart().startsWith("```") || ligne.trimStart().startsWith("~~~")) {
      encadre = !encadre;
      courant = "";
      continue;
    }
    if (encadre) continue;
    if (!ligne.trim()) {
      courant = "";
      continue;
    }
    const marque = MARQUEUR.exec(ligne);
    if (marque) {
      courant = marque[1].toLowerCase();
      trouves[courant] = [marque[2].trim()];
    } else if (courant) {
      trouves[courant].push(ligne.trim());
    }
  }

  const sortie: Record<string, string> = {};
  for (const [nom, morceaux] of Object.entries(trouves)) {
    if ((CHAMPS as readonly string[]).includes(nom)) sortie[nom] = morceaux.join(" ").trim();
  }
  return sortie;
}

/** Les documents cités par celui-ci — la source des dépendances. */
export function liensMarkdown(texte: string): string[] {
  return [...texte.matchAll(/\]\((\d\d-[a-z0-9-]+\.md)[^)]*\)/g)].map((m) => m[1]);
}

export interface Lecture {
  blocs: Bloc[];
  erreurs: string[];
  liens: string[];
}

/** Les blocs d'un fichier, les erreurs rencontrées, et les liens sortants. */
export function lireFichier(texte: string, relatif: string, extension: string): Lecture {
  const dialecte = DIALECTES[extension];
  const lignes = texte.split(/\r?\n/);
  // **Un fichier qui finit par un saut de ligne a N lignes, pas N + 1.**
  // `split` rend une chaîne vide finale que le découpage en lignes ne rend pas.
  // Sans ce retrait, le dernier bloc de *chaque* fichier gagnait une ligne :
  // 68 écarts sur un dépôt de 68 fichiers, et un index qui diverge de celui de
  // l'implémentation d'origine sans qu'aucun contrôle ne le dise.
  const total = lignes.at(-1) === "" ? lignes.length - 1 : lignes.length;

  const groupes =
    dialecte === "markdown" ? commentairesMarkdown(lignes) : commentairesCode(lignes, dialecte);

  const blocs: Bloc[] = [];
  const erreurs: string[] = [];

  for (const groupe of groupes) {
    const trouves = champs(groupe.lignes);
    if (!("id" in trouves)) continue;

    const manquants = OBLIGATOIRES.filter((champ) => !trouves[champ]);
    if (manquants.length) {
      erreurs.push(`${relatif}:${groupe.debut} — champ obligatoire absent : ${manquants.join(", ")}`);
      continue;
    }
    if (trouves.do.includes(" ")) {
      erreurs.push(`${relatif}:${groupe.debut} — @do contient un espace : « ${trouves.do} »`);
    }

    blocs.push({
      id: trouves.id,
      do: trouves.do,
      fichier: relatif,
      debut: groupe.debut,
      fin: 0,
      role: trouves.role ?? "",
      layer: trouves.layer ?? "",
      human: trouves.human ?? "",
      flow: trouves.flow ?? "",
    });
  }

  // La fin d'un bloc, c'est le début du suivant. Le dernier va jusqu'au bout.
  blocs.forEach((bloc, i) => {
    bloc.fin = i + 1 < blocs.length ? blocs[i + 1].debut - 1 : total;
  });

  return { blocs, erreurs, liens: dialecte === "markdown" ? liensMarkdown(texte) : [] };
}
