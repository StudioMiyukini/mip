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
 * Rangé en trois familles parce qu'elles n'appellent pas le même travail : ce
 * qui s'exécute, ce qui se lit, ce qui se regarde. Un même projet peut tenir
 * dans plusieurs — une application *et* sa documentation.
 *
 * **Trois familles à l'affichage, deux comportements.** Un diagramme ne
 * s'exécute pas et ne se lit pas comme un texte : il se relit d'un coup d'œil,
 * et on l'itère. Mais côté prompt, il suit le même régime qu'un document —
 * relecture à chaque étape, plan avant production. La famille sert à *choisir*,
 * pas à multiplier les branches ; ce qui décide reste [`EXECUTABLES`].
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
  { code: "bot", libelle: "Bot ou assistant", detail: "Discord, Slack, Telegram, agent conversationnel", groupe: "Ce qui s'exécute" },
  { code: "jeu", libelle: "Jeu", detail: "navigateur, bureau ou mobile", groupe: "Ce qui s'exécute" },
  { code: "extension", libelle: "Extension de navigateur", groupe: "Ce qui s'exécute" },
  { code: "greffon", libelle: "Greffon", detail: "pour un logiciel hôte — éditeur, CMS, outil de design", groupe: "Ce qui s'exécute" },
  { code: "service-fond", libelle: "Service en tâche de fond", detail: "démon, tâche planifiée, robot de veille", groupe: "Ce qui s'exécute" },
  { code: "pipeline", libelle: "Traitement de données", detail: "extraction, transformation, chargement", groupe: "Ce qui s'exécute" },
  { code: "analyse", libelle: "Carnet d'analyse", detail: "notebook, exploration de données", groupe: "Ce qui s'exécute" },

  { code: "markdown", libelle: "Markdown (.md)", groupe: "Ce qui se lit" },
  { code: "pdf", libelle: "PDF", groupe: "Ce qui se lit" },
  { code: "docx", libelle: "Word (.docx)", groupe: "Ce qui se lit" },
  { code: "html", libelle: "Page HTML", groupe: "Ce qui se lit" },
  { code: "txt", libelle: "Texte brut (.txt)", groupe: "Ce qui se lit" },
  { code: "presentation", libelle: "Présentation (.pptx)", groupe: "Ce qui se lit" },
  { code: "tableur", libelle: "Tableur (.xlsx, .csv)", groupe: "Ce qui se lit" },
  { code: "epub", libelle: "Livre numérique (.epub)", groupe: "Ce qui se lit" },
  { code: "cours", libelle: "Support de cours", detail: "notes, fiches, exercices", groupe: "Ce qui se lit" },
  { code: "procedure", libelle: "Procédure ou mode d'emploi", detail: "des pas à suivre, pas un exposé", groupe: "Ce qui se lit" },
  { code: "rapport", libelle: "Rapport ou étude", detail: "un état des lieux et ses conclusions", groupe: "Ce qui se lit" },
  { code: "specification", libelle: "Cahier des charges", detail: "ce qu'il faudra construire, pour quelqu'un d'autre", groupe: "Ce qui se lit" },
  { code: "courrier", libelle: "Courrier ou infolettre", groupe: "Ce qui se lit" },
  { code: "jeu-donnees", libelle: "Jeu de données ou schéma", detail: "JSON, YAML, SQL — structuré, pas rédigé", groupe: "Ce qui se lit" },

  { code: "diagramme", libelle: "Diagramme ou schéma", detail: "Mermaid, PlantUML, architecture", groupe: "Ce qui se regarde" },
  { code: "maquette", libelle: "Maquette d'interface", detail: "écrans, parcours, avant le code", groupe: "Ce qui se regarde" },
  { code: "charte", libelle: "Charte graphique", detail: "couleurs, typographie, composants", groupe: "Ce qui se regarde" },
  { code: "visuel", libelle: "Affiche ou visuel", detail: "image unique, illustration, bannière", groupe: "Ce qui se regarde" },
];

/**
 * Les formats qui appellent du code. Voir [`produitDuCode`].
 *
 * **La liste est déclarée, pas déduite du groupe.** Lire « Ce qui s'exécute »
 * pour décider marcherait aujourd'hui et casserait au premier format rangé là
 * pour l'affichage sans être du code. Le groupe sert à ranger l'écran, cette
 * liste-ci à décider ce que le prompt exige — deux questions distinctes, deux
 * sources distinctes.
 */
const EXECUTABLES = new Set([
  "app-web",
  "site",
  "api",
  "app-bureau",
  "app-mobile",
  "cli",
  "bibliotheque",
  "script",
  "bot",
  "jeu",
  "extension",
  "greffon",
  "service-fond",
  "pipeline",
  "analyse",
]);

/**
 * La technique.
 *
 * Volontairement **située** : ce sont les piles réellement utilisées ici, pas
 * un catalogue de tout ce qui existe. Personne ne coche dans une liste qu'il
 * faut lire.
 *
 * **La liste vient d'un inventaire, pas d'une intuition.** Les dix-neuf entrées
 * de la première version avaient été écrites de mémoire, et un relevé des vingt
 * projets voisins a montré ce que la mémoire avait oublié : Tailwind, présent
 * dans six d'entre eux, n'y figurait pas. Ni React Router (six), ni Stripe
 * (six), ni la génération de PDF (six), ni la validation de schéma (huit), ni
 * PowerShell (sept). Une liste écrite de tête reflète ce qu'on a fait cette
 * semaine.
 *
 * **Le critère d'entrée est l'usage constaté, pas la notoriété.** Vue, Svelte,
 * Solid, Astro, Next, Nuxt, MongoDB, Redis, Jest, Playwright, Cypress, Webpack,
 * Sass, three.js, Phaser, Tauri, Go, PHP, Java : cherchés dans les vingt
 * projets, trouvés dans aucun. Ils n'entrent pas. Une entrée qu'on ne coche
 * jamais coûte à tous ceux qui parcourent la liste.
 *
 * **Le critère de sortie est la redondance, pas la rareté.** Ce qui n'apparaît
 * qu'une fois reste s'il représente une décision distincte — Electron engage
 * une application de bureau, Hono un serveur autre. Ce qui n'apparaît qu'une
 * fois *et* que la liste couvre déjà sort : `egui` est une interface Rust,
 * comme Dioxus ; `sqlx` est un accès SQL, comme les deux bases déjà nommées.
 *
 * **Les groupes portent la charge.** Une quarantaine d'entrées à plat se lisent
 * comme une liste de courses ; rangées en dix familles de trois à huit, on sait
 * où chercher et l'on saute les neuf autres.
 *
 * « À décider » est une réponse, pas une absence de réponse : elle dit à l'agent
 * de proposer plutôt que de supposer. Et si votre pile n'est pas là, elle a sa
 * place dans la description du projet — l'agent la lira.
 */
export const TECHNIQUES: Choix[] = [
  { code: "typescript", libelle: "TypeScript", groupe: "Langage" },
  { code: "javascript", libelle: "JavaScript", groupe: "Langage" },
  { code: "rust", libelle: "Rust", groupe: "Langage" },
  { code: "python", libelle: "Python", groupe: "Langage" },
  { code: "html-css", libelle: "HTML/CSS", detail: "sans cadriciel", groupe: "Langage" },
  { code: "sql", libelle: "SQL", detail: "requêtes et schémas écrits à la main", groupe: "Langage" },
  { code: "powershell", libelle: "PowerShell", detail: "scripts Windows", groupe: "Langage" },
  { code: "shell", libelle: "Shell", detail: "bash, sh", groupe: "Langage" },

  { code: "react", libelle: "React", groupe: "Interface" },
  { code: "vite", libelle: "Vite", detail: "développement et construction", groupe: "Interface" },
  { code: "tailwind", libelle: "Tailwind CSS", groupe: "Interface" },
  { code: "tanstack", libelle: "TanStack", detail: "Router, Query", groupe: "Interface" },
  { code: "react-router", libelle: "React Router", groupe: "Interface" },
  { code: "radix", libelle: "Radix / shadcn", detail: "composants accessibles", groupe: "Interface" },

  { code: "electron", libelle: "Electron", detail: "application de bureau en web", groupe: "Bureau, mobile, jeu" },
  { code: "dioxus", libelle: "Dioxus", detail: "interface en Rust, bureau et mobile", groupe: "Bureau, mobile, jeu" },
  { code: "canvas", libelle: "Canvas 2D", detail: "jeu ou dessin dans le navigateur", groupe: "Bureau, mobile, jeu" },
  { code: "wgpu", libelle: "wgpu", detail: "rendu 3D en Rust", groupe: "Bureau, mobile, jeu" },

  { code: "node", libelle: "Node.js", groupe: "Serveur" },
  { code: "fastify", libelle: "Fastify", groupe: "Serveur" },
  { code: "express", libelle: "Express", groupe: "Serveur" },
  { code: "hono", libelle: "Hono", detail: "léger, compatible bordure", groupe: "Serveur" },
  { code: "axum", libelle: "axum", detail: "serveur en Rust, avec Tokio", groupe: "Serveur" },
  { code: "websocket", libelle: "WebSocket", detail: "temps réel — ws, Socket.IO", groupe: "Serveur" },

  { code: "postgresql", libelle: "PostgreSQL", groupe: "Données" },
  { code: "sqlite", libelle: "SQLite", detail: "un fichier, aucun serveur", groupe: "Données" },
  { code: "drizzle", libelle: "Drizzle", detail: "schéma et migrations", groupe: "Données" },
  { code: "prisma", libelle: "Prisma", detail: "l'autre ORM, avec son propre schéma", groupe: "Données" },

  { code: "auth", libelle: "Comptes et sessions", detail: "argon2, bcrypt, jetons", groupe: "Briques courantes" },
  { code: "validation", libelle: "Validation de schéma", detail: "zod — refuser une entrée mal formée", groupe: "Briques courantes" },
  { code: "paiement", libelle: "Paiement", detail: "Stripe", groupe: "Briques courantes" },
  // `pdf` est déjà pris par le format « PDF » : un même code dans les deux
  // catalogues ferait deux tags dont un seul se décoche. L'essai le refuse.
  { code: "generation-pdf", libelle: "Génération de PDF", detail: "pdfkit, puppeteer", groupe: "Briques courantes" },
  { code: "courriel", libelle: "Envoi de courriel", detail: "nodemailer, SMTP", groupe: "Briques courantes" },
  { code: "carte", libelle: "Cartographie", detail: "Leaflet, données géographiques", groupe: "Briques courantes" },

  { code: "modele-local", libelle: "Modèle local", detail: "LM Studio, llama.cpp — rien ne sort de la machine", groupe: "Intelligence artificielle" },
  { code: "candle", libelle: "Candle", detail: "inférence en Rust", groupe: "Intelligence artificielle" },
  { code: "transcription", libelle: "Transcription vocale", detail: "Whisper", groupe: "Intelligence artificielle" },

  { code: "node-test", libelle: "node:test", detail: "le lanceur d'essais de Node, sans dépendance", groupe: "Essais et qualité" },
  { code: "vitest", libelle: "Vitest", groupe: "Essais et qualité" },
  { code: "eslint", libelle: "ESLint", groupe: "Essais et qualité" },

  { code: "docker", libelle: "Docker", groupe: "Mise en service" },
  { code: "pm2", libelle: "PM2", groupe: "Mise en service" },
  { code: "cloudflare", libelle: "Cloudflare", detail: "tunnel, DNS", groupe: "Mise en service" },
  { code: "actions", libelle: "GitHub Actions", detail: "intégration continue", groupe: "Mise en service" },
  { code: "mandataire", libelle: "Mandataire inverse", detail: "nginx, Caddy", groupe: "Mise en service" },
  { code: "kubernetes", libelle: "Kubernetes", detail: "Helm — pour un vrai parc, rarement avant", groupe: "Mise en service" },

  { code: "a-decider", libelle: "À décider", detail: "que l'agent propose, avec son coût", groupe: "Ouvert" },
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
