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

export interface Cadrage {
  titre: string;
  demande: string;
  classe: string;
  mode: string;
  reponses: Record<string, string>;
  agents: string[];
  skills: string[];
  modules: string[];
  certifications: string[];
}

export interface Matiere {
  sections: Section[];
  protocole: Protocole;
  skills: Array<{ code: string; description: string; generique: boolean }>;
  modules: Array<{ code: string; fichier: string }>;
  certifications: Array<{ code: string; titre: string }>;
}

const CLASSES = ["T1", "T2", "T3", "T4", "T5"];

/** La question est-elle posée à cette classe ? « depuis T4 » veut dire T4 et T5. */
export function retenue(question: Question, classe: string): boolean {
  return CLASSES.indexOf(classe) >= CLASSES.indexOf(question.depuis);
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
    bouts.push(
      equipe
        .map((a) => `- **${a.nom}** — ${a.role}${a.phases ? ` · ${a.phases}` : ""}`)
        .join("\n"),
    );
  }

  // ── le cadrage, section par section ───────────────────────────────────
  bouts.push("## Le cadrage");

  const manquantes: string[] = [];
  for (const section of matiere.sections) {
    const questions = section.questions
      .filter((q) => retenue(q, cadrage.classe))
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
      const reponse = (cadrage.reponses[question.numero] ?? "").trim();
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

  lignes.push(
    `${suite + 1}. Le TDD est obligatoire dès qu'il y a du code : RED → GREEN → ` +
      "REFACTOR → VERIFY → LINT → COMMIT. Un test qui encode une décision de ce " +
      "cadrage vaut mieux qu'un paragraphe qui la raconte.",
  );

  return lignes.join("\n");
}
