// @id mip.prompt
// @role orchestration
// @layer core
// @human L'assembleur : des réponses de formulaire vers un prompt qu'on colle
// @do assembler_le_prompt_initial_depuis_les_reponses_de_cadrage

/**
 * L'assembleur du prompt initial.
 *
 * **Ce n'est pas un résumé, c'est un script.** Le prompt produit ne raconte pas
 * ce qu'on veut faire : il dit à un agent quoi faire, dans quel ordre, avec
 * quelles contraintes, et à quoi il n'a pas le droit de toucher. La différence
 * se voit à la fin — un résumé se termine par une conclusion, un script par une
 * instruction.
 *
 * **Ce qui n'a pas été répondu est écrit.** La tentation est de ne garder que
 * les réponses remplies, ce qui donne un prompt net. Mais un cadrage muet sur le
 * risque n'est pas un cadrage sans risque : c'est un cadrage où personne n'a
 * regardé. L'agent doit voir le trou pour poser la question.
 */

export interface Question {
  numero: string;
  section: string;
  texte: string;
  depuis: string;
  optionnelle: boolean;
  champ: string;
  options: string[];
  aide: string;
  rang: number;
}

export interface Section {
  numero: string;
  titre: string;
  methode: string;
  deduite: boolean;
  rang: number;
  questions: Question[];
}

export interface Protocole {
  classification: Array<{ classe: string; critere: string; phases: string[] }>;
  equipe: Array<{ agent: string; nom: string; role: string; phases: string; optionnel: boolean }>;
  artefacts: Array<{ artefact: string; chemin: string; phase: string }>;
  invariants: Array<{ numero: string; invariant: string; portee: string }>;
  modes: Array<{ mode: string; libelle: string; description: string }>;
}

/**
 * L'état d'une réponse.
 *
 * **`suggere` n'est pas une réponse.** Mesuré le 2026-08-20 : sur le premier
 * essai réel, le modèle local a inventé le sens de deux acronymes et un public
 * inexistant, malgré une consigne explicite de ne rien inventer. Une invention
 * est plausible, bien écrite, et occupe le champ exactement comme une réponse —
 * d'où une distinction dans **le modèle de données**, pas dans la couleur du
 * champ. Le style se perd d'une refonte à l'autre ; la règle non.
 */
export type Etat = "repondu" | "suggere";

export interface Reponse {
  valeur: string;
  etat: Etat;
}

/** Une réponse en texte nu vaut « répondu » : les cadrages déjà enregistrés
 *  n'ont pas d'état, et un humain les a écrits. */
export type ReponseBrute = string | Reponse;

/**
 * Ce qu'on retient d'une réponse — la chaîne vide si rien n'est confirmé.
 *
 * C'est le seul endroit où la règle s'applique, et c'est voulu : la répéter à
 * chaque lecture, c'est se donner l'occasion de l'oublier une fois.
 */
export function valeurRetenue(reponse: ReponseBrute | undefined): string {
  if (reponse === undefined) return "";
  if (typeof reponse === "string") return reponse;
  return reponse.etat === "suggere" ? "" : reponse.valeur;
}

import { AGENTS, phasesDe, phasesEnClair, vocabulaireDe } from "./glossaire.js";
import { libelleDe, produitDuCode } from "./livrable.js";

export interface Cadrage {
  titre: string;
  demande: string;
  classe: string;
  mode: string;
  reponses: Record<string, ReponseBrute>;
  agents: string[];
  skills: string[];
  modules: string[];
  certifications: string[];
  /** Ce que le projet produit — voir `livrable.ts`. */
  formats: string[];
  /** Avec quoi. */
  techniques: string[];
}

export interface Matiere {
  sections: Section[];
  protocole: Protocole;
  skills: Array<{ code: string; description: string; generique: boolean }>;
  modules: Array<{ code: string; fichier: string }>;
  certifications: Array<{ code: string; titre: string }>;
}

const CLASSES = ["T1", "T2", "T3", "T4", "T5"];

/**
 * Les quatre questions de l'étage 1. **Déclarées, jamais déduites.**
 *
 * Prendre « les quatre premières » donnerait quatre questions de la même
 * section — donc quatre fois le même angle, et un cadrage qui ne cadre rien.
 * Celles-ci couvrent quatre angles distincts :
 *
 * - `1.1` quel problème --------- le *pourquoi*
 * - `1.3` qui est l'utilisateur - le *pour qui*
 * - `2.2` périmètre inclus/exclus le *jusqu'où*
 * - `5.1` fonctionnalité minimale le *par où commencer*
 *
 * C'est le minimum sous lequel un prompt cesse d'être meilleur qu'une
 * discussion libre.
 */
export const QUESTIONS_ESSENTIELLES = ["1.1", "1.3", "2.2", "5.1"];

/** La question est-elle posée à cette classe ? « depuis T4 » veut dire T4 et T5. */
export function retenue(question: Question, classe: string): boolean {
  return CLASSES.indexOf(classe) >= CLASSES.indexOf(question.depuis);
}

/**
 * L'étage d'une question, ou `null` si elle n'est pas posée à cette classe.
 *
 * ```
 * 1  l'essentiel : les quatre déclarées — un prompt déjà utilisable
 * 2  le cadrage  : posée à cette classe, non optionnelle
 * 3  le détail   : posée à cette classe, optionnelle
 * ```
 *
 * **L'ordre des tests compte.** L'appartenance aux essentielles se vérifie
 * *avant* le drapeau `optionnelle` : une question essentielle marquée
 * optionnelle par le protocole tomberait sinon à l'étage 3, c'est-à-dire hors
 * du prompt minimal — qui est justement ce qu'on construit.
 *
 * **Le serveur décide, le client rend.** L'étage part avec chaque question ;
 * le client ne le recalcule pas. Deux calculs séparés divergent, et c'est déjà
 * arrivé dans ce dépôt avec `retenue()`.
 */
export function etageDe(question: Question, classe: string): 1 | 2 | 3 | null {
  if (QUESTIONS_ESSENTIELLES.includes(question.numero)) return 1;
  if (!retenue(question, classe)) return null;
  return question.optionnelle ? 3 : 2;
}

/**
 * L'étage de la question **à chaque classe**, calculé une fois.
 *
 * Le client choisit la classe en cours de saisie ; recalculer chez lui, ou
 * redemander au serveur à chaque changement, sont deux façons de se tromper.
 * On envoie la table entière — cinq entiers par question, quelques centaines
 * d'octets pour tout le formulaire.
 */
export function etagesDe(question: Question): Record<string, 1 | 2 | 3 | null> {
  return Object.fromEntries(CLASSES.map((classe) => [classe, etageDe(question, classe)]));
}

/**
 * Le prompt initial, en Markdown.
 *
 * Le Markdown n'est pas un choix esthétique : c'est le seul format qu'un modèle
 * lit sans effort **et** qu'un humain relit avant de le coller. Un JSON serait
 * plus précis et personne ne le relirait.
 */
export function assembler(cadrage: Cadrage, matiere: Matiere): string {
  const bouts: string[] = [];
  const classe = matiere.protocole.classification.find((c) => c.classe === cadrage.classe);
  const mode = matiere.protocole.modes.find((m) => m.mode === cadrage.mode);

  bouts.push(`# Cadrage MIP — ${cadrage.titre}`);
  bouts.push(
    "> Ce document est un **cadrage de séquence MIP**. Il tient lieu de Temps 1 : " +
      "les questions d'exploration ont déjà été posées et leurs réponses sont " +
      "ci-dessous. Ne les repose pas. Ce qui est marqué « non renseigné » est un " +
      "trou réel — demande-le avant de t'en passer.",
  );

  // ── la demande ────────────────────────────────────────────────────────
  bouts.push("## La demande");
  bouts.push(cadrage.demande.trim() || "_Non renseignée._");

  // ── ce qu'il faut produire ────────────────────────────────────────────
  //
  // **Juste apres la demande, et avant la classification.** C'est la deuxieme
  // chose qu'un agent doit savoir : un meme besoin donne une application React
  // ou un document Word, et rien d'autre dans le cadrage ne le dit.
  if (cadrage.formats.length || cadrage.techniques.length) {
    bouts.push("## Ce qu'il faut produire");
    const lignes: string[] = [];
    if (cadrage.formats.length) {
      lignes.push(`- **Format** : ${cadrage.formats.map(libelleDe).join(", ")}`);
    }
    if (cadrage.techniques.length) {
      lignes.push(`- **Technique** : ${cadrage.techniques.map(libelleDe).join(", ")}`);
    }
    if (cadrage.techniques.includes("a-decider")) {
      lignes.push(
        "- La technique n'est **pas tranchee** : propose-la, avec ce qu'elle coute, " +
          "et attends l'accord avant de commencer.",
      );
    }
    bouts.push(lignes.join("\n"));
  }

  // ── classification et conduite ────────────────────────────────────────
  bouts.push("## Classification et conduite");
  const lignes = [
    `- **Classe : ${cadrage.classe}** — ${classe?.critere ?? "critère inconnu"}`,
    `- **Phases** : ${classe?.phases.join(" → ") ?? "P3 → P5"}`,
    `- **Mode d'autonomie : ${cadrage.mode}**${mode ? ` (${mode.libelle})` : ""} — ${mode?.description ?? ""}`,
  ];
  // La classification décide de tout le reste — c'est l'invariant I-1. Le dire
  // ici évite qu'un agent la refasse et arrive à une autre.
  lignes.push(
    "- La classification a **déjà été tranchée** par le cadrage. Ne la recalcule pas ; " +
      "si tu la crois fausse, dis-le et attends.",
  );
  bouts.push(lignes.join("\n"));

  // ── le protocole, en clair ────────────────────────────────────────────
  //
  // **On ordonnait « commence en P3 » sans avoir dit ce qu'est P3.** Le prompt
  // citait les phases par leur code, exigeait un arrêt « à chaque gate », et
  // renvoyait vers `<sequence>/briefs/` — trois choses qu'un modèle qui n'a
  // jamais lu le protocole ne peut que deviner. Or deviner est précisément ce
  // que ce cadrage existe pour empêcher : un agent qui invente sa propre
  // définition de P4 produit un travail plausible et hors protocole.
  //
  // **Seulement les phases de la classe retenue.** Décrire P4 et P6 à quelqu'un
  // qui fait un micro-fix coûte deux cents jetons pour lui apprendre des étapes
  // qu'il ne fera pas — et laisse un doute sur ce qu'on attend vraiment.
  //
  // **Une seule liste de phases, pas deux.** Un premier jet lisait le repli
  // `["P3", "P5"]` pour les descriptions et `classe?.phases ?? []` pour le
  // vocabulaire : sur une classe inconnue, le prompt décrivait P5 et refusait
  // d'expliquer « Volet », le mot que P5 emploie. Deux replis pour une même
  // question donnent deux réponses.
  //
  // **Git est nommée partout et listée nulle part.** L'invariant I-2 énonce la
  // séquence « P0 → Git → P3 → … » et I-11 impose la branche de fonctionnalité,
  // mais la table de classification ne fait figurer Git dans aucune classe. Le
  // prompt citait donc une phase qu'il n'expliquait jamais — exactement le trou
  // qu'on est en train de boucher. On l'insère quand il y a du code, puisque
  // c'est la condition qui rend I-11 applicable, et jamais pour un document :
  // on n'ouvre pas de branche pour un support de cours.
  const codesDePhase = classe?.phases ?? ["P3", "P5"];
  const avecGit =
    produitDuCode(cadrage.formats, cadrage.techniques) && !codesDePhase.includes("Git")
      ? [...codesDePhase.slice(0, codesDePhase.indexOf("P3")), "Git", ...codesDePhase.slice(codesDePhase.indexOf("P3"))]
      : codesDePhase;
  const enBref = phasesDe(codesDePhase.includes("P3") ? avecGit : codesDePhase);
  if (enBref.length) {
    bouts.push("## Le protocole, en bref");
    bouts.push(
      "Tu suis un protocole nommé MIP. Voici le strict nécessaire pour t'y tenir ; " +
        "le reste se charge au fil des phases.",
    );
    bouts.push(
      "**Une gate est un point d'arrêt avec un critère explicite.** On ne la franchit " +
        "pas parce que le travail semble fini : on la franchit parce que son critère " +
        "est rempli. Un critère non rempli renvoie en arrière, il ne se contourne pas.",
    );
    bouts.push(
      enBref
        .map(
          (phase) =>
            [
              `### ${phase.code} — ${phase.titre}`,
              phase.quoi,
              `**Gate ${phase.code}** — ${phase.gate}`,
            ].join("\n\n"),
        )
        .join("\n\n"),
    );
    bouts.push(
      [
        "Le vocabulaire est strict : chaque mot désigne un seul niveau.",
        vocabulaireDe(codesDePhase)
          .map((v) => `- **${v.terme}** — ${v.sens}`)
          .join("\n"),
      ].join("\n\n"),
    );
  }

  // ── les invariants ────────────────────────────────────────────────────
  if (matiere.protocole.invariants.length) {
    bouts.push("## Le noyau immuable");
    bouts.push(
      "Ces règles ne dépendent ni du projet, ni de la stack, ni de l'outil. Elles " +
        "s'appliquent telles quelles.",
    );
    bouts.push(
      matiere.protocole.invariants
        .map((i) => `- **${i.numero}** — ${i.invariant} _(${i.portee})_`)
        .join("\n"),
    );
  }

  // ── l'équipe retenue ──────────────────────────────────────────────────
  const equipe = matiere.protocole.equipe.filter((a) => cadrage.agents.includes(a.agent));
  if (equipe.length) {
    bouts.push("## L'équipe");
    bouts.push(
      "Chaque rôle est un **prompt à charger au moment de sa phase**, pas un " +
        "personnage à jouer. Charger la version de phase, jamais la version complète " +
        "sans raison.",
    );
    // Le rôle expliqué plutôt que l'intitulé de poste. « Jean — Efficience
    // tokens · P0 T9, P4, P6 » ne dit pas à un agent ce que Jean fait ni quand
    // l'appeler ; la phrase du glossaire, si. L'intitulé reste, entre
    // parenthèses : c'est lui qui nomme le fichier à charger.
    bouts.push(
      equipe
        .map((a) => {
          const clair = AGENTS[a.agent];
          // Les accents que la source ASCII a perdus. Un essai garantit que la
          // surcharge ne change que les accents, jamais les mots.
          const nom = clair?.nom ?? a.nom;
          const poste = clair?.poste ?? a.role;
          const quand = a.phases ? ` — ${phasesEnClair(a.phases)}` : "";
          return clair
            ? `- **${nom}** (${poste})${quand}\n  ${clair.resume}`
            : `- **${nom}** — ${poste}${quand}`;
        })
        .join("\n"),
    );
  }

  // ── le cadrage, section par section ───────────────────────────────────
  bouts.push("## Le cadrage");

  const manquantes: string[] = [];
  for (const section of matiere.sections) {
    // **Le même critère que le formulaire, pas un critère parallèle.**
    // Une version antérieure filtrait ici sur `retenue()` alors que le
    // formulaire affiche sur `etageDe()`. Les deux divergent pour les quatre
    // essentielles, dont le `depuis` vaut T3 : à T1 et T2 elles étaient posées
    // à l'écran, saisies, puis **jetées** à l'assemblage. Le cadrage d'un
    // micro-fix sortait sans une seule des réponses écrites — seule la section
    // déduite survivait, entièrement vide. Un seul critère, donc, et c'est
    // celui qui décide déjà de l'affichage.
    const questions = section.questions
      .filter((q) => etageDe(q, cadrage.classe) !== null)
      .sort((a, b) => a.rang - b.rang);
    if (!questions.length) continue;

    const entete = section.methode
      ? `### ${section.titre} — _${section.methode}_`
      : `### ${section.titre}`;
    const corps: string[] = [entete];

    if (section.deduite) {
      corps.push(
        "_Cette section n'a pas été posée : elle se déduit de la demande. " +
          "Vérifie-la contre le code existant avant d'agir._",
      );
    }

    for (const question of questions) {
      const reponse = valeurRetenue(cadrage.reponses[question.numero]).trim();
      corps.push(`**${question.numero} · ${question.texte}**`);
      if (reponse) {
        // Une réponse multiligne se cite en bloc, sinon la deuxième ligne se
        // recolle à la question suivante et on ne sait plus qui répond à quoi.
        corps.push(reponse.split(/\r?\n/).map((l) => `> ${l}`).join("\n"));
      } else {
        corps.push("> _Non renseigné._");
        manquantes.push(`${question.numero} — ${question.texte}`);
      }
    }
    bouts.push(corps.join("\n\n"));
  }

  // ── ce qui manque ─────────────────────────────────────────────────────
  if (manquantes.length) {
    bouts.push("## Ce qui n'a pas été tranché");
    bouts.push(
      `**${manquantes.length} question${manquantes.length > 1 ? "s" : ""} sans réponse.** ` +
        "Ce ne sont pas des détails : chacune peut changer ce qu'il faut construire. " +
        "Pose-les avant de commencer, ou dis explicitement l'hypothèse que tu retiens.",
    );
    bouts.push(manquantes.map((m) => `- ${m}`).join("\n"));
  }

  // ── les artefacts attendus ────────────────────────────────────────────
  const phases = new Set(classe?.phases ?? []);
  const artefacts = matiere.protocole.artefacts.filter(
    (a) => phases.has(a.phase) || a.phase === "Toutes",
  );
  if (artefacts.length) {
    bouts.push("## Ce que la séquence doit produire");
    bouts.push(
      // Le chemin arrive de la source **déjà entouré d'accents graves**. Les
      // remettre en produit deux, et le Markdown rend alors le premier comme
      // du texte : `` `<sequence>/briefs/` ``.
      artefacts
        .map((a) => `- **${a.artefact}** → \`${a.chemin.replace(/`/g, "")}\` _(${a.phase})_`)
        .join("\n"),
    );
  }

  // ── ce qu'il faut charger ─────────────────────────────────────────────
  const aCharger: string[] = [];
  for (const code of cadrage.modules) {
    const module = matiere.modules.find((m) => m.code === code);
    // `fichier` porte déjà son dossier d'origine — `modules/…` ou `protocol/…`.
    // C'est ce qui distingue les deux `conventions.md` de la source, et le
    // préfixer d'un second « modules/ » donnait un chemin qui n'existe pas.
    if (module) aCharger.push(`- \`.mip/${module.fichier}\` — au début de sa phase`);
  }
  for (const code of cadrage.skills) {
    const skill = matiere.skills.find((s) => s.code === code);
    if (skill) {
      aCharger.push(
        `- skill \`${skill.code}\`${skill.generique ? "" : " _(lié à la stack d'origine — vérifier qu'il s'applique)_"}`,
      );
    }
  }
  for (const code of cadrage.certifications) {
    const certification = matiere.certifications.find((c) => c.code === code);
    if (certification) aCharger.push(`- certification \`${certification.code}\` — ${certification.titre}`);
  }
  if (aCharger.length) {
    bouts.push("## À charger au fil des phases");
    bouts.push(
      "**À la demande, jamais en bloc.** Tout charger d'emblée sature le contexte " +
        "et fait payer à chaque tour ce qui n'aura servi qu'une fois.",
    );
    bouts.push(aCharger.join("\n"));
  }

  // ── le balisage ───────────────────────────────────────────────────────
  //
  // **Seulement s'il y a du code.** Demander `@id` et `@layer` à quelqu'un qui
  // rédige des fiches de révision, c'est la même faute que d'exiger son cycle
  // TDD : une consigne hors sujet apprend à l'agent que le reste du document
  // est peut-être décoratif aussi. Le format décide, comme pour l'instruction
  // finale, et par le même appel.
  if (produitDuCode(cadrage.formats, cadrage.techniques)) {
    bouts.push("## Le balisage MSCM");
    bouts.push(
      "Chaque unité de sens du code porte cinq annotations en commentaire, et un " +
        "index est reconstruit à partir d'elles :",
    );
    bouts.push(
      [
        "```",
        "@id     identifiant unique et hiérarchique — obligatoire",
        "@do     ce que fait l'unité, en verbe_infinitif_souligne — obligatoire",
        "@role   securite | donnee | orchestration | ui | config | rule",
        "@layer  core | domain | infra | outil | ui | doc",
        "@human  une phrase lisible, pour qui n'a pas le code sous les yeux",
        "```",
      ].join("\n"),
    );
    bouts.push(
      "Règles d'intégrité : **identifiant unique**, **aucun bloc orphelin** (tout " +
        "`@id` enfant doit avoir un parent existant), **aucun cycle** dans les " +
        "dépendances. Un index périmé fait échouer la vérification.",
    );
  }

  // ── l'instruction finale ──────────────────────────────────────────────
  bouts.push("## Ce qu'il faut faire maintenant");
  bouts.push(instruction(cadrage, classe?.phases ?? [], manquantes.length));

  return bouts.join("\n\n");
}

/**
 * La dernière section, et la seule qui soit un ordre.
 *
 * Elle change selon le mode d'autonomie, parce que c'est le mode qui décide de
 * l'endroit où l'agent doit s'arrêter. Un prompt qui dirait « fais tout » à
 * quelqu'un qui a choisi la supervision serait un prompt qui contredit le
 * formulaire qu'on vient de remplir.
 */
function instruction(cadrage: Cadrage, phases: string[], manquantes: number): string {
  const avecDuCode = produitDuCode(cadrage.formats, cadrage.techniques);
  const lignes: string[] = [];

  if (manquantes > 0) {
    lignes.push(
      `1. **Commence par les ${manquantes} questions sans réponse.** Pose-les groupées, ` +
        "en une fois. Ne devine pas.",
    );
  }

  const premiere = phases[0] ?? "P3";
  lignes.push(
    `${manquantes > 0 ? "2" : "1"}. Ouvre la séquence : \`.mip/sequences/<AAAA-MM-JJ>-<slug>/\`, ` +
      `et commence en **${premiere}**.`,
  );

  const suite = manquantes > 0 ? 3 : 2;
  switch (cadrage.mode) {
    case "FULL":
      lignes.push(
        `${suite}. Enchaîne ${phases.join(" → ")} **sans t'arrêter**. Une seule ` +
          "validation humaine, en P5. Si tu rencontres un choix que ce cadrage ne " +
          "tranche pas, retiens l'option la plus réversible et **écris-le** dans le " +
          "rapport plutôt que de t'arrêter.",
      );
      break;
    case "GUIDED":
      lignes.push(
        `${suite}. **Arrête-toi à chaque étape du plan** et attends l'accord avant ` +
          "de passer à la suivante. Une étape = un lot de tâches, pas le plan entier.",
      );
      break;
    default:
      lignes.push(
        `${suite}. **Arrête-toi à chaque gate de phase** — ${phases.join(", ")} — et ` +
          "présente ce qui est fait avant de demander à passer la suivante.",
      );
  }

  // **Le TDD ne s'exige que s'il y a du code.** Le demander à quelqu'un qui
  // rédige un support de cours n'est pas seulement inutile : c'est le genre de
  // consigne hors sujet qui apprend à l'agent que le reste du document est
  // peut-être décoratif aussi.
  if (avecDuCode) {
    lignes.push(
      `${suite + 1}. Le TDD est obligatoire dès qu'il y a du code : RED → GREEN → ` +
        "REFACTOR → VERIFY → LINT → COMMIT. Un test qui encode une décision de ce " +
        "cadrage vaut mieux qu'un paragraphe qui la raconte.",
    );
  } else {
    lignes.push(
      `${suite + 1}. Ce livrable n'est pas du code : pas de tests, pas de branche. ` +
        "Ce qui les remplace, c'est une **relecture à chaque étape** — présente un " +
        "plan avant de rédiger, et le plan avant le texte.",
    );
  }

  return lignes.join("\n");
}
