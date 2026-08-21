// @id mip.suggestion
// @role securite
// @layer core
// @human Le pré-remplissage : ce que le modèle propose, et ce qu'on en laisse passer
// @do proposer_des_reponses_sans_jamais_les_faire_passer_pour_des_reponses

/**
 * Le pré-remplissage.
 *
 * **C'est la fonction la plus dangereuse de l'application**, et le module est
 * écrit dans cet esprit : la moitié du code refuse des choses.
 *
 * Mesuré le 2026-08-20, premier essai réel, sur la demande de cette séquence :
 * le modèle a rendu « MIP (Management Information Platform) » et « MSCM
 * (Multi-Site Content Management) » — deux inventions — et un public,
 * « tous les utilisateurs de l'organisation », qui ne figurait nulle part.
 * La consigne disait, en toutes lettres : *n'invente jamais*.
 *
 * On ne peut pas l'empêcher d'inventer. On peut empêcher son invention de
 * **compter** : tout ce qui sort d'ici porte l'état `suggere`, et une suggestion
 * n'entre pas dans le prompt tant qu'un humain ne l'a pas confirmée.
 *
 * @role securite — et le rôle n'est pas usurpé : ce module est une passoire,
 * pas un traducteur.
 */

/** Ce dont on a besoin d'une question pour valider une suggestion. */
export interface Question {
  numero: string;
  champ: string;
  options: string[];
}

export interface Suggestion {
  valeur: string;
  etat: "suggere";
}

/**
 * Les champs qu'on demande au modèle, et les questions qu'ils alimentent.
 *
 * **Des clés nommées plutôt que des numéros.** Un petit modèle répond mieux à
 * `probleme` qu'à `1.1` — le numéro ne porte aucun sens, et il le remplit au
 * hasard. La traduction se fait ici, à un seul endroit.
 *
 * **Une clé peut alimenter plusieurs questions.** « Le problème » répond à 0.1
 * dans ORIENTER et à 1.1 dans COMPRENDRE : la même information, deux endroits.
 * Poser deux fois la question au modèle inviterait deux réponses différentes,
 * et l'utilisateur se demanderait laquelle est la bonne.
 *
 * **On s'arrête à l'étage 1 et à ORIENTER.** Suggérer une réponse à « quels
 * risques anticipez-vous » n'aiderait personne : le modèle ne connaît ni le
 * projet, ni celui qui le mène, ni ce qui l'inquiète.
 */
export const CHAMPS_SUGGERES: Array<{ cle: string; numeros: string[]; question: string }> = [
  {
    cle: "probleme",
    numeros: ["0.1", "1.1"],
    question: "Quel problème concret cette demande résout-elle ?",
  },
  {
    cle: "usage",
    numeros: ["0.2"],
    question: "Un exemple concret d'usage attendu, en une phrase ?",
  },
  {
    cle: "pour_qui",
    numeros: ["0.4", "1.3"],
    question: "Qui est l'utilisateur final ?",
  },
  {
    cle: "perimetre",
    numeros: ["2.2"],
    question: "Ce qui est inclus, et ce qui est explicitement exclu ?",
  },
  {
    cle: "minimal",
    numeros: ["5.1"],
    question: "La plus petite version qui rendrait déjà service ?",
  },
  {
    cle: "classe",
    numeros: ["0.7"],
    question:
      "L'ampleur : T1 correctif d'une ligne, T2 correctif cible, T3 fonctionnalité, " +
      "T4 fonctionnalité majeure, T5 chantier. Réponds par T1, T2, T3, T4 ou T5.",
  },
];

/**
 * La consigne envoyée au modèle.
 *
 * Elle dit trois fois de ne pas inventer, et le modèle invente quand même —
 * mesuré. Elle reste écrite ainsi parce qu'elle **réduit** les inventions sans
 * les supprimer, et parce que la vraie protection est en aval, pas ici.
 */
export function consigne(): string {
  const champs = CHAMPS_SUGGERES.map((c) => `  "${c.cle}"  ${c.question}`).join("\n");
  return (
    "Tu prépares une fiche de cadrage à partir d'une demande de projet.\n\n" +
    "Réponds UNIQUEMENT par un objet JSON, avec exactement ces clés :\n\n" +
    champs +
    "\n\nRègles :\n" +
    "- Si l'information n'est pas dans la demande, mets la chaîne vide. C'est la " +
    "bonne réponse, pas un échec.\n" +
    "- N'invente rien : ni sigle développé, ni public, ni fonctionnalité.\n" +
    "- Une phrase courte par clé. Reprends les mots de la demande.\n"
  );
}

/**
 * Les tournures par lesquelles le modèle **dit qu'il ne sait pas**.
 *
 * Mesuré le 2026-08-21, en conditions réelles : la consigne demande la chaîne
 * vide quand l'information manque, et le modèle a rendu « Pas d'information
 * fournie dans la demande. » — une phrase *à propos* de son ignorance.
 *
 * C'est pire qu'une chaîne vide. Une chaîne vide ne remplit rien ; cette
 * phrase-là ressemble à du contenu, occupe le champ, et confirmée d'un clic
 * distrait, elle entre dans le prompt comme réponse à « quel problème cette
 * demande résout-elle ». L'agent lirait alors une non-réponse comme une réponse.
 *
 * **La liste reste étroite et se compare sur la phrase entière, pas sur un mot
 * contenu.** « Les utilisateurs perdent l'information entre deux réunions » est
 * une vraie réponse ; un filtre qui chercherait « information » n'importe où la
 * jetterait. On teste donc le début de la phrase, une fois pliée.
 */
const DEROBADES = [
  "pas d'information",
  "aucune information",
  "information non",
  "non precise",
  "non specifie",
  "non renseigne",
  "non mentionne",
  "non indique",
  "je ne sais pas",
  "inconnu",
  "n/a",
  "n.a.",
  "sans objet",
  "a determiner",
  "a definir",
  "non applicable",
];

/** Sans accents, sans casse, sans ponctuation de fin. */
function plier(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.!?…]+\s*$/, "")
    .trim();
}

/**
 * La valeur est-elle une dérobade ?
 *
 * On regarde le **début** de la phrase. Une dérobade s'annonce : elle ne se
 * cache pas au milieu d'une vraie réponse. Chercher la tournure n'importe où
 * jetterait des réponses justes, et le doute doit pencher vers laisser passer —
 * une suggestion douteuse se relit, une suggestion manquante ne se voit pas.
 */
function derobade(valeur: string): boolean {
  const plie = plier(valeur);
  return DEROBADES.some((tournure) => plie.startsWith(tournure));
}

/**
 * Le JSON caché dans une réponse de modèle.
 *
 * Les petits modèles encadrent volontiers leur JSON de « Voici : », de barrières
 * de code, ou d'un bloc de raisonnement resté allumé — on a mesuré que celui-ci
 * n'est pas toujours éteignable. Refuser ces réponses ferait échouer un résultat
 * correct pour une question de présentation.
 */
function extraireJson(brut: string): unknown {
  const sansPensee = brut.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const debut = sansPensee.indexOf("{");
  const fin = sansPensee.lastIndexOf("}");
  if (debut === -1 || fin <= debut) return null;
  try {
    return JSON.parse(sansPensee.slice(debut, fin + 1));
  } catch {
    return null;
  }
}

/**
 * Ce qu'on retient de la réponse du modèle.
 *
 * Chaque valeur doit franchir quatre refus avant d'exister :
 *
 * 1. la clé est déclarée dans [`CHAMPS_SUGGERES`] ;
 * 2. la valeur est bien du texte, non vide une fois élaguée ;
 * 3. la question existe encore dans le protocole ;
 * 4. pour une question à choix, la valeur est **l'une des options déclarées**.
 *
 * Le quatrième est le moins évident et le plus utile : sur l'ampleur, le modèle
 * peut rendre « moyenne » ou « T7 », et un menu déroulant se retrouverait avec
 * une valeur qu'il ne sait pas afficher.
 */
export function lireSuggestions(brut: string, questions: Question[]): Record<string, Suggestion> {
  const objet = extraireJson(brut);
  if (!objet || typeof objet !== "object" || Array.isArray(objet)) return {};

  const parNumero = new Map(questions.map((q) => [q.numero, q]));
  const sorties: Record<string, Suggestion> = {};

  for (const champ of CHAMPS_SUGGERES) {
    const valeur = (objet as Record<string, unknown>)[champ.cle];
    if (typeof valeur !== "string") continue;
    // Le refus vient en trois temps : ce n'est pas du texte, c'est du vide, ou
    // c'est une phrase qui dit l'ignorance. Les trois donnent « non renseigné ».

    const propre = valeur.trim();
    if (!propre) continue;
    if (derobade(propre)) continue;

    for (const numero of champ.numeros) {
      const question = parNumero.get(numero);
      if (!question) continue;

      const aChoix = question.champ === "liste" || question.champ === "echelle";
      if (aChoix && !question.options.includes(propre)) continue;

      sorties[numero] = { valeur: propre, etat: "suggere" };
    }
  }

  return sorties;
}
