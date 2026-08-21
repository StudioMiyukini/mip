// @id mip.livrable
// @role donnee
// @layer core
// @human Ce que le projet produit, et avec quoi — le format et la technique
// @do declarer_les_formats_de_livrable_et_les_techniques_disponibles

/**
 * Le format du livrable, et la technique.
 *
 * **Deux questions que le protocole ne posait pas.** Ses vingt-cinq questions
 * portent sur le *pourquoi* et le *pour qui* ; aucune ne demande ce qu'on obtient
 * à la fin. C'est un angle mort : un agent qui ne sait pas s'il doit rendre une
 * application React ou un document Word part sur la première hypothèse venue.
 *
 * **Et tous les projets ne sont pas du code.** L'usage visé mentionne
 * explicitement les notes de cours. Un livrable qui est un PDF n'a pas besoin de
 * TDD ni de branche de fonctionnalité — le prompt doit cesser de les exiger, et
 * c'est [`produitDuCode`] qui le décide.
 *
 * Ces listes ne viennent pas du protocole extrait : elles n'y sont pas. Elles
 * sont déclarées ici, et se modifient ici.
 */

export interface Choix {
  code: string;
  libelle: string;
  detail?: string;
  /** Le groupe d'affichage. */
  groupe: string;
}

/**
 * Ce que le projet produit.
 *
 * Rangé en deux familles parce qu'elles n'appellent pas le même travail : d'un
 * côté ce qui s'exécute, de l'autre ce qui se lit. Un même projet peut tenir
 * dans les deux — une application *et* sa documentation.
 */
export const FORMATS: Choix[] = [
  { code: "app-web", libelle: "Application web", detail: "un site avec lequel on interagit", groupe: "Ce qui s'exécute" },
  { code: "site", libelle: "Site vitrine", detail: "des pages à lire, sans compte", groupe: "Ce qui s'exécute" },
  { code: "api", libelle: "API ou service", detail: "consommé par d'autres programmes", groupe: "Ce qui s'exécute" },
  { code: "app-bureau", libelle: "Application de bureau", groupe: "Ce qui s'exécute" },
  { code: "app-mobile", libelle: "Application mobile", groupe: "Ce qui s'exécute" },
  { code: "cli", libelle: "Outil en ligne de commande", groupe: "Ce qui s'exécute" },
  { code: "bibliotheque", libelle: "Bibliothèque", detail: "un paquet que d'autres installent", groupe: "Ce qui s'exécute" },
  { code: "script", libelle: "Script d'automatisation", groupe: "Ce qui s'exécute" },

  { code: "markdown", libelle: "Markdown (.md)", groupe: "Ce qui se lit" },
  { code: "pdf", libelle: "PDF", groupe: "Ce qui se lit" },
  { code: "docx", libelle: "Word (.docx)", groupe: "Ce qui se lit" },
  { code: "html", libelle: "Page HTML", groupe: "Ce qui se lit" },
  { code: "txt", libelle: "Texte brut (.txt)", groupe: "Ce qui se lit" },
  { code: "presentation", libelle: "Présentation (.pptx)", groupe: "Ce qui se lit" },
  { code: "tableur", libelle: "Tableur (.xlsx, .csv)", groupe: "Ce qui se lit" },
  { code: "cours", libelle: "Support de cours", detail: "notes, fiches, exercices", groupe: "Ce qui se lit" },
];

/** Les formats qui appellent du code. Voir [`produitDuCode`]. */
const EXECUTABLES = new Set([
  "app-web",
  "site",
  "api",
  "app-bureau",
  "app-mobile",
  "cli",
  "bibliotheque",
  "script",
]);

/**
 * La technique.
 *
 * Volontairement **courte et située** : ce sont les piles réellement utilisées
 * ici, pas un catalogue de tout ce qui existe. Une liste de cent entrées se
 * parcourt moins bien qu'un champ libre, et personne ne coche dans une liste
 * qu'il faut lire.
 *
 * « À décider » est une réponse, pas une absence de réponse : elle dit à l'agent
 * de proposer plutôt que de supposer.
 */
export const TECHNIQUES: Choix[] = [
  { code: "typescript", libelle: "TypeScript", groupe: "Langage" },
  { code: "javascript", libelle: "JavaScript", groupe: "Langage" },
  { code: "rust", libelle: "Rust", groupe: "Langage" },
  { code: "python", libelle: "Python", groupe: "Langage" },
  { code: "html-css", libelle: "HTML/CSS", detail: "sans cadriciel", groupe: "Langage" },

  { code: "react", libelle: "React", groupe: "Interface" },
  { code: "vite", libelle: "Vite", groupe: "Interface" },
  { code: "dioxus", libelle: "Dioxus", detail: "interface en Rust", groupe: "Interface" },
  { code: "tanstack", libelle: "TanStack", detail: "Router, Query", groupe: "Interface" },

  { code: "node", libelle: "Node.js", groupe: "Serveur" },
  { code: "fastify", libelle: "Fastify", groupe: "Serveur" },
  { code: "express", libelle: "Express", groupe: "Serveur" },

  { code: "postgresql", libelle: "PostgreSQL", groupe: "Données" },
  { code: "sqlite", libelle: "SQLite", groupe: "Données" },
  { code: "drizzle", libelle: "Drizzle", detail: "schéma et migrations", groupe: "Données" },

  { code: "docker", libelle: "Docker", groupe: "Mise en service" },
  { code: "pm2", libelle: "PM2", groupe: "Mise en service" },
  { code: "cloudflare", libelle: "Cloudflare", detail: "tunnel, DNS", groupe: "Mise en service" },

  { code: "a-decider", libelle: "À décider", detail: "que l'agent propose", groupe: "Ouvert" },
];

const PAR_CODE = new Map([...FORMATS, ...TECHNIQUES].map((c) => [c.code, c]));

/** Le libellé d'un code, ou le code lui-même s'il est inconnu. */
export function libelleDe(code: string): string {
  return PAR_CODE.get(code)?.libelle ?? code;
}

/**
 * Le projet produit-il du code ?
 *
 * **Ce qui en dépend :** les instructions de fin de prompt. Exiger le cycle
 * `RED → GREEN → REFACTOR` de quelqu'un qui rédige un support de cours n'est pas
 * seulement inutile — c'est le genre de consigne hors sujet qui apprend à
 * l'agent que le reste du document est peut-être décoratif aussi.
 *
 * Le doute penche vers le code : sans format choisi, on suppose du code, parce
 * que c'est le cas courant et qu'une exigence de test superflue coûte moins
 * qu'une exigence de test manquante.
 */
export function produitDuCode(formats: string[], techniques: string[]): boolean {
  if (!formats.length) return true;
  if (formats.some((f) => EXECUTABLES.has(f))) return true;
  // Un document peut demander du code — un rapport engendré par un script.
  // Une technique cochée le trahit.
  return techniques.some((t) => t !== "a-decider");
}
