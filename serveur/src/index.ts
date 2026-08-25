// @id mip.serveur
// @role ui
// @layer ui
// @human Le serveur : le formulaire, les cadrages, et le prompt assemblé
// @do servir_le_formulaire_et_assembler_les_prompts

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import statique from "@fastify/static";
import Fastify from "fastify";

import { bassin, matiere, RACINE } from "./bd.js";
import { Cadence, demandeur } from "./cadence.js";
import { FORMATS, TECHNIQUES } from "./livrable.js";
import { BISCUIT, duTunnel, jetonDe, Porte } from "./porte.js";
import { AGENTS, phasesEnClair } from "./glossaire.js";
import { assembler, etageDe, etagesDe, QUESTIONS_ESSENTIELLES, type Cadrage } from "./prompt.js";
import {
  adresseValide,
  doitRehacher,
  empreindre,
  motDePasseAcceptable,
  normaliserAdresse,
  verifier as motCorrespond,
} from "./comptes.js";
import { consigne, lireSuggestions } from "./suggestion.js";

// 8976 : 8971, 8974 et 8975 sont deja pris sur cette machine. Le port est
// surchargeable par MIP_PORT — le codage en dur d'un port libre aujourd'hui est
// un conflit programme pour dans six mois.
const PORT = Number(process.env.MIP_PORT ?? 8976);

const serveur = Fastify({ logger: { level: process.env.MIP_LOG ?? "info" } });
const porte = new Porte();

/**
 * Les en-têtes de sécurité, sur chaque réponse.
 *
 * **L'audit du 2026-08-25 les donnait tous manquants** — constat élevé. Écrits
 * à la main dans un hook plutôt qu'importés d'un greffon : ils tiennent en
 * quelques lignes, et une dépendance de plus pour poser sept en-têtes coûte
 * plus qu'elle ne rapporte.
 *
 * La CSP est **stricte parce que l'application le permet** : tout est servi
 * depuis la même origine — le client construit, l'API, les polices système. Rien
 * n'est chargé d'un CDN, aucun script en ligne (le thème est passé dans un
 * fichier externe pour cette raison). `frame-ancestors 'none'` interdit
 * l'encadrement par un tiers ; `'unsafe-inline'` ne survit que pour les styles,
 * que React pose en attribut (`style={{…}}`) et que Tailwind injecte.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

serveur.addHook("onSend", async (_requete, reponse, charge) => {
  reponse.header("Content-Security-Policy", CSP);
  reponse.header("X-Content-Type-Options", "nosniff");
  reponse.header("X-Frame-Options", "DENY");
  reponse.header("Referrer-Policy", "strict-origin-when-cross-origin");
  reponse.header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), interest-cohort=()");
  // HSTS : deux ans, sous-domaines compris. Le site n'est joignable qu'en HTTPS
  // par le tunnel ; annoncer qu'il ne faut plus jamais tenter le HTTP ferme la
  // fenêtre d'un détournement au premier accès.
  reponse.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  return charge;
});

// -- la porte -------------------------------------------------------------

/**
 * Le gardien. Il ne juge pas *qui* parle, il constate *par ou*.
 *
 * Ce qui vient de la machine passe : le tunnel se connecte en local, et une
 * requete locale n'a pas de mot de passe a donner. Ce qui traverse le tunnel
 * doit presenter une session.
 */
serveur.addHook("onRequest", async (requete, reponse) => {
  const chemin = requete.url.split("?")[0] ?? "";
  // La porte elle-meme doit rester joignable pour pouvoir etre ouverte.
  if (chemin === "/api/porte" || chemin === "/api/entrer" || chemin === "/api/sante") return;
  if (!duTunnel(requete.headers as Record<string, unknown>)) return;

  // Sans empreinte, le site est **ouvert**. Les comptes bornent les données ;
  // la porte n'est plus qu'un verrou de maintenance.
  if (!porte.configuree()) return;
  if (porte.valide(jetonDe(requete.headers as Record<string, unknown>))) return;

  if (chemin.startsWith("/api/")) {
    return reponse.code(401).send({ erreur: "session", message: "Il faut ouvrir la porte." });
  }
  // Une page demandee sans session recoit quand meme le client : c'est lui qui
  // affiche le champ de mot de passe. Rendre une page nue ici obligerait a
  // maintenir deux interfaces pour la meme chose.
});

serveur.get("/api/porte", async (requete) => {
  const entetes = requete.headers as Record<string, unknown>;
  const exigee = porte.configuree() && duTunnel(entetes);
  return {
    configuree: porte.configuree(),
    exigee,
    ouverte: !exigee || porte.valide(jetonDe(entetes)),
  };
});

serveur.post("/api/entrer", async (requete, reponse) => {
  const corps = (requete.body ?? {}) as { mot_de_passe?: string };
  const jeton = porte.ouvre(corps.mot_de_passe ?? "");
  if (!jeton) return reponse.code(401).send({ ok: false, message: "Mot de passe refuse." });

  // `Secure` et `SameSite=Lax` : le biscuit ne part qu'en HTTPS, ce que le
  // tunnel garantit, et ne suit pas une requete venue d'un autre site.
  reponse.header(
    "set-cookie",
    BISCUIT + "=" + jeton + "; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=" + 30 * 24 * 3600,
  );
  return { ok: true };
});

serveur.post("/api/sortir", async (requete, reponse) => {
  porte.ferme(jetonDe(requete.headers as Record<string, unknown>));
  reponse.header("set-cookie", BISCUIT + "=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0");
  return { ok: true };
});

/**
 * Le formulaire, en une requête.
 *
 * Tout part ensemble — sections, questions, équipe, skills, certifications —
 * parce que l'interface en a besoin d'un bloc pour se dessiner, et que le tout
 * pèse moins qu'une image. Découper en cinq routes ferait cinq allers-retours
 * pour afficher une page qui ne s'affiche qu'une fois.
 */
serveur.get("/api/formulaire", async (_requete, reponse) => {
  const donnees = await matiere();

  // **Un protocole vide est une panne, pas un formulaire court.**
  //
  // Le schéma supprime et recrée les tables dérivées — c'est voulu, elles se
  // régénèrent depuis le pack. Mais qui applique le schéma sans ré-ingérer
  // derrière obtient une base sans une seule question, et le formulaire s'est
  // alors affiché *comme s'il marchait* : des menus déroulants vides, aucune
  // question, et un prompt qui annonçait « critère inconnu ». Vu en vrai le
  // 2026-08-21.
  //
  // Une page cassée qui a l'air normale coûte plus cher qu'une erreur franche :
  // on cherche le défaut dans son propre usage avant de le chercher dans le
  // service.
  if (!donnees.sections.length || !donnees.protocole.classification.length) {
    return reponse.code(503).send({
      erreur: "protocole_absent",
      message:
        "Le protocole n'est pas chargé en base. Lancer `npm run extraire` puis `npm run ingerer`.",
    });
  }

  const agents = await bassin.query(
    "SELECT code, nom, role, phases, optionnel, jetons FROM agent ORDER BY optionnel, code",
  );
  // **Le protocole donne un intitulé de poste, pas une explication.**
  // « Arianne — Team manager, QA, memoire · P0 T9, P6 » ne permet à personne de
  // décider s'il lui faut Arianne : on coche par défaut, et le tag cesse d'être
  // un choix. Le glossaire ajoute ce que la personne fait, quand elle sert, et
  // déplie les abréviations. Un agent sans explication garde son intitulé — on
  // n'invente pas de rôle pour combler un trou.
  const equipe = agents.rows.map((a: { code: string; nom: string; role: string; phases: string }) => {
    const clair = AGENTS[a.code];
    return {
      ...a,
      ...clair,
      // Les accents que la source ASCII a perdus, quand une surcharge existe.
      // Un essai garantit qu'elle ne change que les accents.
      nom: clair?.nom ?? a.nom,
      role: clair?.poste ?? a.role,
      phases_claires: phasesEnClair(a.phases ?? ""),
    };
  });
  // L'etage part avec la question, pour toutes les classes. Le client lit
  // dedans ; il ne recalcule rien.
  const sections = donnees.sections.map((section) => ({
    ...section,
    questions: section.questions.map((q) => ({ ...q, etages: etagesDe(q) })),
  }));
  return {
    ...donnees,
    sections,
    agents: equipe,
    essentielles: QUESTIONS_ESSENTIELLES,
    formats: FORMATS,
    techniques: TECHNIQUES,
  };
});

/** Ce qu'un formulaire rempli envoie. */
interface CorpsCadrage extends Partial<Cadrage> {
  titre?: string;
}

function normaliser(corps: CorpsCadrage): Cadrage {
  return {
    titre: (corps.titre ?? "").trim() || "Sans titre",
    demande: corps.demande ?? "",
    classe: corps.classe ?? "T3",
    mode: corps.mode ?? "BIG_STEPS",
    reponses: corps.reponses ?? {},
    agents: corps.agents ?? [],
    skills: corps.skills ?? [],
    modules: corps.modules ?? [],
    certifications: corps.certifications ?? [],
    formats: corps.formats ?? [],
    techniques: corps.techniques ?? [],
  };
}

/**
 * L'aperçu : le prompt sans rien enregistrer.
 *
 * C'est ce qui rend le formulaire utilisable — on voit le texte se construire
 * en le remplissant, donc on comprend à quoi sert chaque champ. Un formulaire
 * dont on ne découvre le résultat qu'à la fin se remplit une fois, mal.
 */
serveur.post("/api/apercu", async (requete) => {
  const cadrage = normaliser(requete.body as CorpsCadrage);
  return { prompt: assembler(cadrage, await matiere()) };
});

/**
 * Les limites de cadence.
 *
 * Deux routes coûtent cher à qui les sert, et le site est public sans mot de
 * passe : `/api/suggerer` occupe un modèle local pendant sept secondes — un
 * modèle partagé avec une autre application — et `/api/compte/creer` écrit en
 * base sans rien demander.
 *
 * Les plafonds sont larges à dessein. Ils visent l'usage machinal — un script
 * mal écrit, un onglet qui recharge en boucle — pas l'attaque déterminée, contre
 * laquelle une adresse se change. Un plafond serré gênerait les gens honnêtes
 * sans arrêter les autres.
 */
const CADENCE_SUGGESTION = new Cadence(20, 10 * 60_000);
const CADENCE_INSCRIPTION = new Cadence(5, 60 * 60_000);
/**
 * La cadence de connexion. **Contre la force brute** (audit du 2026-08-25,
 * constat élevé) : la connexion était la seule action modifiante sans plafond,
 * et scrypt/Argon2 ralentissent une attaque hors ligne, pas une attaque en
 * ligne sur un mot de passe faible. Dix essais par quart d'heure et par IP —
 * large pour qui se trompe, étroit pour qui devine en boucle. Le comptage est
 * en mémoire, par IP, et se purge tout seul, comme les deux autres.
 */
const CADENCE_CONNEXION = new Cadence(10, 15 * 60_000);

/** Le modèle local. Jamais distant : rien de ce qui est saisi ne sort d'ici. */
const MODELE = process.env.MIP_MODELE ?? "qwen/qwen3.5-9b";
const MODELE_URL = process.env.MIP_MODELE_URL ?? "http://127.0.0.1:1234/v1";

/**
 * Le délai du modèle.
 *
 * Mesuré : 23,5 s à chaud sur une vraie demande, 55 s au chargement à froid. Le
 * premier plafond était à 25 s — une marge d'une seconde et demie, c'est-à-dire
 * aucune. Comme l'appel ne bloque rien, attendre plus longtemps ne coûte rien ;
 * couper trop tôt, si.
 */
const DELAI_MODELE = 45_000;

/**
 * Propose des réponses à partir de la demande libre.
 *
 * **Rien ici ne peut produire une réponse** — seulement des suggestions, que
 * l'interface affiche hachurées et que l'assembleur ignore tant qu'un humain
 * ne les a pas confirmées. Le modèle invente : c'est mesuré, et c'est pourquoi
 * la garantie est structurelle plutôt que d'être demandée dans la consigne.
 *
 * **La panne est un cas normal, pas une erreur.** Modèle éteint, occupé par
 * Alicia, ou trop lent : on rend une liste vide et le formulaire continue. Un
 * code d'erreur ferait afficher un bandeau rouge pour une fonction de confort.
 */
serveur.post("/api/suggerer", async (requete) => {
  const { demande } = (requete.body ?? {}) as { demande?: string };
  const texte = (demande ?? "").trim();
  // Sous quelques mots, il n'y a rien à déduire — et le modèle comblerait le
  // vide en inventant, ce qu'il fait déjà quand il a de la matière.
  if (texte.length < 25) return { suggestions: {} };

  // Au-delà du plafond, on rend une liste vide plutôt qu'une erreur : le
  // pré-remplissage est un confort, et le formulaire n'en dépend pas. Un code
  // d'erreur ferait clignoter un bandeau rouge pour une fonction accessoire.
  const qui = demandeur(requete.headers as Record<string, unknown>, requete.ip);
  if (!CADENCE_SUGGESTION.accepte(qui)) return { suggestions: {} };

  const questions = (await matiere()).sections.flatMap((s) => s.questions);

  try {
    const reponse = await fetch(`${MODELE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(DELAI_MODELE),
      body: JSON.stringify({
        model: MODELE,
        temperature: 0,
        max_tokens: 500,
        messages: [
          { role: "system", content: consigne() },
          { role: "user", content: texte },
          // Le bloc de raisonnement **déjà fermé**. Aucun levier de l'API ne
          // l'éteint — `enable_thinking`, `reasoning.enabled` et
          // `reasoning_effort` ont été essayés, tous sans effet. Sans cette
          // amorce, le raisonnement mange le plafond de jetons et le contenu
          // revient vide ([D54] d'Alicia, reproduit ici à l'identique).
          { role: "assistant", content: "<think></think>" },
        ],
      }),
    });
    if (!reponse.ok) return { suggestions: {} };

    const charge = (await reponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const brut = charge.choices?.[0]?.message?.content ?? "";
    return { suggestions: lireSuggestions(brut, questions) };
  } catch {
    // Volontairement muet. Le formulaire ne dépend pas de cette réponse.
    return { suggestions: {} };
  }
});

// -- les comptes ----------------------------------------------------------

/**
 * Les sessions de compte, en mémoire.
 *
 * Un redémarrage déconnecte tout le monde. C'est un désagrément, pas un défaut :
 * redemander un mot de passe après un redémarrage est le comportement attendu,
 * et une session en base coûterait une table pour une gêne rare.
 */
const sessions = new Map<string, { utilisateur: string; expire: number }>();
const BISCUIT_COMPTE = "mip_compte";
const DUREE_SESSION = 30 * 24 * 3600 * 1000;

function biscuitDe(entetes: Record<string, unknown>, nom: string): string | undefined {
  const brut = entetes["cookie"];
  if (typeof brut !== "string") return undefined;
  for (const morceau of brut.split(";")) {
    const [cle, ...reste] = morceau.trim().split("=");
    if (cle === nom) return reste.join("=");
  }
  return undefined;
}

/**
 * Qui parle, ou `null`.
 *
 * **`null` est un cas normal, pas une erreur.** Le formulaire fonctionne sans
 * compte : c'est le critère de sortie du produit. Seule la sauvegarde en exige un.
 */
function quiParle(requete: { headers: Record<string, unknown> }): string | null {
  const jeton = biscuitDe(requete.headers, BISCUIT_COMPTE);
  if (!jeton) return null;
  const session = sessions.get(jeton);
  if (!session) return null;
  if (session.expire < Date.now()) {
    sessions.delete(jeton);
    return null;
  }
  return session.utilisateur;
}

function poserLaSession(
  reponse: { header: (n: string, v: string) => void },
  utilisateur: string,
): void {
  const jeton = randomBytes(32).toString("hex");
  sessions.set(jeton, { utilisateur, expire: Date.now() + DUREE_SESSION });
  reponse.header(
    "set-cookie",
    BISCUIT_COMPTE +
      "=" +
      jeton +
      "; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=" +
      DUREE_SESSION / 1000,
  );
}

function oublierLaSession(reponse: { header: (n: string, v: string) => void }): void {
  reponse.header(
    "set-cookie",
    BISCUIT_COMPTE + "=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0",
  );
}

serveur.post("/api/compte/creer", async (requete, reponse) => {
  const corps = (requete.body ?? {}) as { adresse?: string; mot_de_passe?: string };
  if (!adresseValide(corps.adresse ?? "")) {
    return reponse
      .code(400)
      .send({ erreur: "adresse", message: "Cette adresse ne semble pas valide." });
  }
  if (!motDePasseAcceptable(corps.mot_de_passe ?? "")) {
    return reponse.code(400).send({
      erreur: "mot_de_passe",
      message: "Huit caractères au minimum. La longueur compte, pas la composition.",
    });
  }

  // Ici on refuse franchement : créer un compte est une action, et l'utilisateur
  // doit savoir qu'elle n'a pas eu lieu.
  const qui = demandeur(requete.headers as Record<string, unknown>, requete.ip);
  if (!CADENCE_INSCRIPTION.accepte(qui)) {
    return reponse.code(429).send({
      erreur: "cadence",
      message: "Trop de créations de compte depuis cette adresse. Réessayez dans une heure.",
    });
  }

  const normalisee = normaliserAdresse(corps.adresse!);
  try {
    const ligne = await bassin.query(
      "INSERT INTO utilisateur (adresse, empreinte) VALUES ($1, $2) RETURNING id",
      [normalisee, await empreindre(corps.mot_de_passe!)],
    );
    poserLaSession(reponse, ligne.rows[0].id);
    return reponse.code(201).send({ ok: true, adresse: normalisee });
  } catch (erreur) {
    // 23505 : l'adresse est déjà prise. On le dit — prétendre que le compte est
    // créé pour ne pas révéler l'existence d'une adresse laisserait quelqu'un
    // devant un compte qu'il ne peut pas ouvrir.
    if ((erreur as { code?: string }).code === "23505") {
      return reponse
        .code(409)
        .send({ erreur: "existe", message: "Un compte existe déjà pour cette adresse." });
    }
    throw erreur;
  }
});

serveur.post("/api/compte/entrer", async (requete, reponse) => {
  const corps = (requete.body ?? {}) as { adresse?: string; mot_de_passe?: string };
  // Le plafond passe avant la requête : une IP qui martèle ne doit pas même
  // déclencher un accès base. Refuser franchement — la connexion est une action,
  // et savoir qu'elle est bloquée vaut mieux qu'un échec silencieux.
  const qui = demandeur(requete.headers as Record<string, unknown>, requete.ip);
  if (!CADENCE_CONNEXION.accepte(qui)) {
    return reponse.code(429).send({
      erreur: "cadence",
      message: "Trop de tentatives de connexion. Réessayez dans un quart d'heure.",
    });
  }

  const ligne = await bassin.query("SELECT id, empreinte FROM utilisateur WHERE adresse = $1", [
    normaliserAdresse(corps.adresse ?? ""),
  ]);
  // Un seul message pour « adresse inconnue » et « mot de passe faux » : les
  // distinguer dirait à un inconnu quelles adresses ont un compte ici.
  const refus = { erreur: "refuse", message: "Adresse ou mot de passe incorrect." };
  if (!ligne.rowCount) return reponse.code(401).send(refus);
  const empreinte = ligne.rows[0].empreinte as string;
  if (!(await motCorrespond(corps.mot_de_passe ?? "", empreinte))) {
    return reponse.code(401).send(refus);
  }
  // **Migration transparente vers Argon2id.** Un compte d'avant la migration se
  // connecte avec son ancienne empreinte scrypt ; on la réécrit ici, une fois,
  // pendant qu'on tient le mot de passe en clair. Aucune campagne de migration
  // à lancer : les comptes se convertissent au fil des connexions.
  if (doitRehacher(empreinte)) {
    try {
      await bassin.query("UPDATE utilisateur SET empreinte = $1 WHERE id = $2", [
        await empreindre(corps.mot_de_passe!),
        ligne.rows[0].id,
      ]);
    } catch {
      // Le re-hachage est un bonus : s'il échoue, la connexion réussit quand
      // même et on réessaiera au prochain passage.
    }
  }
  // La connexion réussit : on horodate, pour la limitation de conservation.
  await bassin.query("UPDATE utilisateur SET derniere_connexion = now() WHERE id = $1", [
    ligne.rows[0].id,
  ]);
  poserLaSession(reponse, ligne.rows[0].id);
  return { ok: true };
});

serveur.post("/api/compte/sortir", async (requete, reponse) => {
  const jeton = biscuitDe(requete.headers as Record<string, unknown>, BISCUIT_COMPTE);
  if (jeton) sessions.delete(jeton);
  oublierLaSession(reponse);
  return { ok: true };
});

serveur.get("/api/compte", async (requete) => {
  const utilisateur = quiParle(requete as never);
  if (!utilisateur) return { connecte: false };
  const ligne = await bassin.query("SELECT adresse, cree_le FROM utilisateur WHERE id = $1", [
    utilisateur,
  ]);
  return { connecte: true, ...ligne.rows[0] };
});

/**
 * Emporter ses données.
 *
 * Le droit à la portabilité, et il coûte deux requêtes. Tout ce qu'on a sur
 * quelqu'un tient dans cette réponse — c'est aussi la meilleure preuve qu'on
 * n'en collecte pas plus qu'annoncé.
 */
serveur.get("/api/compte/donnees", async (requete, reponse) => {
  const utilisateur = quiParle(requete as never);
  if (!utilisateur) return reponse.code(401).send({ erreur: "session" });
  const compte = await bassin.query("SELECT adresse, cree_le FROM utilisateur WHERE id = $1", [
    utilisateur,
  ]);
  const cadrages = await bassin.query(
    "SELECT * FROM cadrage WHERE utilisateur = $1 ORDER BY cree_le",
    [utilisateur],
  );
  return { compte: compte.rows[0], cadrages: cadrages.rows };
});

/**
 * Corriger son adresse.
 *
 * **Le droit de rectification (RGPD art. 16), et il manquait.** La politique de
 * confidentialité disait « supprimez le compte et recréez-en un » : ce n'est pas
 * une rectification, c'est un effacement suivi d'une perte. Tous les cadrages
 * partaient avec l'ancienne adresse.
 *
 * L'adresse est le seul champ d'identité qu'on détient — donc le seul qui puisse
 * être faux. Le mot de passe est redemandé pour la même raison qu'à la
 * suppression : une session volée ne doit pas suffire à s'emparer d'un compte en
 * en changeant l'adresse.
 */
serveur.post("/api/compte/adresse", async (requete, reponse) => {
  const utilisateur = quiParle(requete as never);
  if (!utilisateur) return reponse.code(401).send({ erreur: "session" });

  const corps = (requete.body ?? {}) as { adresse?: string; mot_de_passe?: string };
  if (!adresseValide(corps.adresse ?? "")) {
    return reponse
      .code(400)
      .send({ erreur: "adresse", message: "Cette adresse ne semble pas valide." });
  }

  const ligne = await bassin.query("SELECT empreinte FROM utilisateur WHERE id = $1", [utilisateur]);
  if (!ligne.rowCount || !(await motCorrespond(corps.mot_de_passe ?? "", ligne.rows[0].empreinte))) {
    return reponse.code(401).send({ erreur: "refuse", message: "Mot de passe incorrect." });
  }

  const normalisee = normaliserAdresse(corps.adresse!);
  try {
    await bassin.query("UPDATE utilisateur SET adresse = $1 WHERE id = $2", [
      normalisee,
      utilisateur,
    ]);
  } catch (erreur) {
    if ((erreur as { code?: string }).code === "23505") {
      return reponse
        .code(409)
        .send({ erreur: "existe", message: "Un compte existe déjà pour cette adresse." });
    }
    throw erreur;
  }
  // La session tient à un jeton, pas à l'adresse : on reste connecté.
  return { ok: true, adresse: normalisee };
});

/**
 * Supprimer son compte.
 *
 * **Pour de bon, pas marqué effacé.** La suppression emporte les cadrages par
 * cascade — déclarée dans le schéma plutôt que dans du code qu'on pourrait
 * oublier d'appeler. Après ça il ne reste rien : ni ligne, ni copie, ni corbeille.
 *
 * Le mot de passe est redemandé : une session volée ne doit pas suffire à
 * effacer le travail de quelqu'un.
 */
serveur.post("/api/compte/supprimer", async (requete, reponse) => {
  const utilisateur = quiParle(requete as never);
  if (!utilisateur) return reponse.code(401).send({ erreur: "session" });

  const corps = (requete.body ?? {}) as { mot_de_passe?: string };
  const ligne = await bassin.query("SELECT empreinte FROM utilisateur WHERE id = $1", [utilisateur]);
  if (!ligne.rowCount || !(await motCorrespond(corps.mot_de_passe ?? "", ligne.rows[0].empreinte))) {
    return reponse.code(401).send({ erreur: "refuse", message: "Mot de passe incorrect." });
  }

  const partis = await bassin.query("DELETE FROM cadrage WHERE utilisateur = $1", [utilisateur]);
  await bassin.query("DELETE FROM utilisateur WHERE id = $1", [utilisateur]);
  for (const [jeton, session] of sessions) {
    if (session.utilisateur === utilisateur) sessions.delete(jeton);
  }
  oublierLaSession(reponse);
  return { ok: true, cadrages_supprimes: partis.rowCount ?? 0 };
});

// -- les cadrages ---------------------------------------------------------

serveur.get("/api/cadrages", async (requete) => {
  const utilisateur = quiParle(requete as never);
  // Sans compte, aucune liste. Pas une liste vide « en attendant » : il n'y a
  // rien a montrer, et un tableau vide laisserait croire qu'on a perdu quelque
  // chose.
  if (!utilisateur) return { cadrages: [], connecte: false };
  const lignes = await bassin.query(
    `SELECT id, titre, classe, mode, cree_le, modifie_le,
            (SELECT count(*) FROM jsonb_object_keys(reponses)) AS repondues
     FROM cadrage WHERE utilisateur = $1 ORDER BY modifie_le DESC LIMIT 100`,
    [utilisateur],
  );
  return { cadrages: lignes.rows, connecte: true };
});

serveur.get<{ Params: { id: string } }>("/api/cadrages/:id", async (requete, reponse) => {
  const utilisateur = quiParle(requete as never);
  // **La propriété est dans la requête, pas dans un test après coup.** Un
  // `WHERE` oublié se voit à la relecture du SQL ; un `if` oublié se lit comme
  // du code normal.
  const ligne = await bassin.query("SELECT * FROM cadrage WHERE id = $1 AND utilisateur = $2", [
    requete.params.id,
    utilisateur,
  ]);
  if (!ligne.rowCount) return reponse.code(404).send({ erreur: "introuvable" });
  return ligne.rows[0];
});

serveur.post("/api/cadrages", async (requete, reponse) => {
  const utilisateur = quiParle(requete as never);
  if (!utilisateur) {
    return reponse
      .code(401)
      .send({ erreur: "session", message: "Il faut un compte pour enregistrer un cadrage." });
  }
  const cadrage = normaliser(requete.body as CorpsCadrage);
  const prompt = assembler(cadrage, await matiere());
  const ligne = await bassin.query(
    `INSERT INTO cadrage (titre, demande, classe, mode, reponses, agents, skills, modules, certifications, prompt, utilisateur, formats, techniques)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      cadrage.titre,
      cadrage.demande,
      cadrage.classe,
      cadrage.mode,
      JSON.stringify(cadrage.reponses),
      cadrage.agents,
      cadrage.skills,
      cadrage.modules,
      cadrage.certifications,
      prompt,
      utilisateur,
      cadrage.formats,
      cadrage.techniques,
    ],
  );
  return reponse.code(201).send(ligne.rows[0]);
});

serveur.put<{ Params: { id: string } }>("/api/cadrages/:id", async (requete, reponse) => {
  const utilisateur = quiParle(requete as never);
  if (!utilisateur) return reponse.code(401).send({ erreur: "session" });
  const cadrage = normaliser(requete.body as CorpsCadrage);
  const prompt = assembler(cadrage, await matiere());
  const ligne = await bassin.query(
    `UPDATE cadrage SET titre=$2, demande=$3, classe=$4, mode=$5, reponses=$6,
            agents=$7, skills=$8, modules=$9, certifications=$10, prompt=$11,
            formats=$13, techniques=$14, modifie_le=now()
     WHERE id=$1 AND utilisateur=$12 RETURNING *`,
    [
      requete.params.id,
      cadrage.titre,
      cadrage.demande,
      cadrage.classe,
      cadrage.mode,
      JSON.stringify(cadrage.reponses),
      cadrage.agents,
      cadrage.skills,
      cadrage.modules,
      cadrage.certifications,
      prompt,
      utilisateur,
      cadrage.formats,
      cadrage.techniques,
    ],
  );
  if (!ligne.rowCount) return reponse.code(404).send({ erreur: "introuvable" });
  return ligne.rows[0];
});

serveur.delete<{ Params: { id: string } }>("/api/cadrages/:id", async (requete, reponse) => {
  const utilisateur = quiParle(requete as never);
  if (!utilisateur) return reponse.code(401).send({ erreur: "session" });
  await bassin.query("DELETE FROM cadrage WHERE id = $1 AND utilisateur = $2", [
    requete.params.id,
    utilisateur,
  ]);
  return { ok: true };
});

/**
 * Un cadrage d'exemple, et le prompt qu'il produit.
 *
 * **La page d'accueil montre une sortie réelle, pas une capture recopiée.**
 * C'est la même règle que pour ses compteurs — « 32 questions » écrit en dur
 * ment le jour où le protocole en compte 34 — et que pour `docs/exemples.md`,
 * dont la page entière est engendrée. Un extrait collé à la main cesse d'être
 * vrai à la première évolution de l'assembleur, sans que rien ne le signale ;
 * c'est arrivé le jour où la section « Le protocole, en bref » est apparue.
 *
 * **Mémoïsé** : le prompt ne dépend que du protocole en base, qui ne bouge
 * qu'à une ré-ingestion. Le recalculer à chaque visite ferait une requête SQL
 * par curieux, pour un texte rigoureusement identique.
 */
const CADRAGE_EXEMPLE: Cadrage = {
  titre: "Suivi de lectures",
  demande:
    "Une petite application pour noter ce que je lis et retrouver ce que j'en ai pensé, " +
    "six mois plus tard.",
  classe: "T3",
  mode: "BIG_STEPS",
  reponses: {
    "1.1": {
      valeur:
        "Je lis beaucoup et j'oublie. Retrouver mon avis sur un livre me demande de " +
        "fouiller trois carnets.",
      etat: "repondu",
    },
    "1.3": { valeur: "Moi seul, sur mon téléphone, le soir.", etat: "repondu" },
    "2.2": {
      valeur:
        "INCLUS : ajouter un livre, noter, écrire un avis, rechercher. " +
        "EXCLUS : les prêts, les statistiques, le partage.",
      etat: "repondu",
    },
    "5.1": { valeur: "Une liste, un formulaire d'ajout, une recherche par titre.", etat: "repondu" },
  },
  agents: ["maria", "denis", "lise"],
  skills: [],
  modules: [],
  certifications: [],
  formats: ["app-web"],
  techniques: ["typescript", "react", "sqlite"],
};

let exempleEnCache: string | null = null;

serveur.get("/api/exemple", async (_requete, reponse) => {
  if (exempleEnCache === null) {
    const donnees = await matiere();
    if (!donnees.sections.length) {
      // Pas de protocole en base : la page d'accueil a son propre repli, et
      // elle doit rester lisible plutôt que d'afficher une fenêtre vide.
      return reponse.code(503).send({ erreur: "protocole_absent" });
    }
    exempleEnCache = assembler(CADRAGE_EXEMPLE, donnees);
  }
  return { prompt: exempleEnCache, titre: CADRAGE_EXEMPLE.titre };
});

/**
 * Combien de questions une classe pose réellement.
 *
 * Affiché avant de commencer : passer de T3 à T4 fait passer de douze à vingt
 * questions, et le savoir **avant** évite d'abandonner à la moitié.
 */
serveur.get("/api/poids", async () => {
  const donnees = await matiere();
  const classes = donnees.protocole.classification.map((c) => c.classe);
  const toutes = donnees.sections.flatMap((s) => s.questions);
  return {
    poids: classes.map((classe) => ({
      classe,
      // Comptés sur l'étage, comme l'affichage et comme l'assemblage. Sur
      // `retenue()`, T1 et T2 annonçaient sept questions et en posaient onze.
      questions: toutes.filter((q) => (etageDe(q, classe) ?? 3) <= 2).length,
      avec_optionnelles: toutes.filter((q) => etageDe(q, classe) !== null).length,
    })),
  };
});

/**
 * Les documents du dépôt, servis au client.
 *
 * **Une liste blanche, pas un chemin.** Accepter un nom de fichier ouvrirait la
 * traversée de répertoire — `../../.env` — et c'est le genre de route qu'on
 * écrit en trois secondes et qu'on regrette longtemps. Ici, ce qui n'est pas
 * nommé n'existe pas.
 */
const DOCUMENTS: Record<string, string> = {
  documentation: "docs/README.md",
  guide: "docs/guide.md",
  exemples: "docs/exemples.md",
  faq: "docs/faq.md",
  protocole: "docs/protocole.md",
  questions: "docs/questions.md",
  prompt: "docs/prompt.md",
  mscm: "docs/mscm.md",
  developpement: "docs/developpement.md",
  confidentialite: "CONFIDENTIALITE.md",
  registre: "docs/registre-traitements.md",
  mentions: "MENTIONS-LEGALES.md",
  cgu: "CGU.md",
  licence: "LICENSE",
  apropos: "README.md",
};

serveur.get<{ Params: { nom: string } }>("/api/document/:nom", async (requete, reponse) => {
  const fichier = DOCUMENTS[requete.params.nom];
  if (!fichier) return reponse.code(404).send({ erreur: "inconnu" });
  try {
    return { nom: requete.params.nom, markdown: readFileSync(join(RACINE, fichier), "utf8") };
  } catch {
    return reponse.code(404).send({ erreur: "absent" });
  }
});

serveur.get("/api/sante", async () => {
  await bassin.query("SELECT 1");
  return { ok: true };
});

/**
 * Le client construit.
 *
 * En production le front est servi par le meme serveur que l'API : une seule
 * origine, donc pas de CORS, pas de mandataire, et une seule chose a publier.
 * En developpement, Vite sert le front et remandate `/api` ; le dossier `dist`
 * n'existe alors pas, et on ne l'enregistre pas.
 */
async function servirLeClient(): Promise<void> {
  const dist = join(RACINE, "web", "dist");
  if (!existsSync(dist)) {
    serveur.log.warn("web/dist absent : l'interface n'est pas servie (npm run -w web build)");
    return;
  }
  await serveur.register(statique, { root: dist });
  // Une application a une seule page : toute route inconnue rend l'index, et
  // c'est le client qui decide quoi afficher.
  serveur.setNotFoundHandler((requete, reponse) => {
    if (requete.url.startsWith("/api/")) return reponse.code(404).send({ erreur: "route" });
    return reponse.sendFile("index.html");
  });
}

/**
 * La purge des comptes inactifs — limitation de conservation (RGPD art. 5.1.e).
 *
 * **Une donnée n'a pas à rester « au cas où ».** Un compte sans connexion depuis
 * deux ans est supprimé, cadrages compris (cascade déclarée au schéma). La
 * politique de confidentialité l'annonce ; ici on l'applique.
 *
 * Pas de courriel d'avertissement préalable : le service n'a pas d'envoi de
 * courriel, et en inventer un pour cette seule fonction ajouterait une
 * dépendance et une adresse d'expéditeur à gérer. Le délai large (24 mois) et
 * l'annonce dans la politique tiennent lieu de préavis.
 */
const RETENTION_MOIS = 24;

async function purgerLesInactifs(): Promise<void> {
  try {
    const partis = await bassin.query(
      `DELETE FROM utilisateur WHERE derniere_connexion < now() - interval '${RETENTION_MOIS} months'`,
    );
    if (partis.rowCount) {
      serveur.log.info(`purge RGPD : ${partis.rowCount} compte(s) inactif(s) depuis ${RETENTION_MOIS} mois`);
    }
  } catch (erreur) {
    // La purge est un devoir, pas un service : si elle échoue, on le note et le
    // serveur continue. On réessaiera au prochain cycle.
    serveur.log.error({ err: erreur }, "purge RGPD échouée");
  }
}

async function demarrer(): Promise<void> {
  await servirLeClient();
  // Écoute locale uniquement. La publication passe par un tunnel, qui se
  // connecte en local — aucun port n'est ouvert sur le réseau.
  await serveur.listen({ port: PORT, host: "127.0.0.1" });
  serveur.log.info("MIP Studio - http://127.0.0.1:" + PORT);
  // La rétention s'applique au démarrage puis une fois par jour. `unref` : ce
  // minuteur ne doit pas, à lui seul, empêcher le processus de s'arrêter.
  await purgerLesInactifs();
  setInterval(purgerLesInactifs, 24 * 3600 * 1000).unref();
  if (porte.configuree()) {
    serveur.log.warn("MIP_EMPREINTE posée : le site est FERMÉ au public, mot de passe exigé");
  } else {
    serveur.log.info("site ouvert au public — les comptes bornent les données");
  }
}

demarrer().catch((erreur) => {
  serveur.log.error(erreur);
  process.exit(1);
});
