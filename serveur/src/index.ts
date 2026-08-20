// @id mip.serveur
// @role ui
// @layer ui
// @human Le serveur : le formulaire, les cadrages, et le prompt assemblé
// @do servir_le_formulaire_et_assembler_les_prompts

import { existsSync } from "node:fs";
import { join } from "node:path";

import statique from "@fastify/static";
import Fastify from "fastify";

import { bassin, matiere, RACINE } from "./bd.js";
import { BISCUIT, duTunnel, jetonDe, Porte } from "./porte.js";
import { assembler, etagesDe, QUESTIONS_ESSENTIELLES, retenue, type Cadrage } from "./prompt.js";
import { consigne, lireSuggestions } from "./suggestion.js";

// 8976 : 8971, 8974 et 8975 sont deja pris sur cette machine. Le port est
// surchargeable par MIP_PORT — le codage en dur d'un port libre aujourd'hui est
// un conflit programme pour dans six mois.
const PORT = Number(process.env.MIP_PORT ?? 8976);

const serveur = Fastify({ logger: { level: process.env.MIP_LOG ?? "info" } });
const porte = new Porte();

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

  if (!porte.configuree()) {
    // Refuse, pas ouvert. Sans mot de passe, l'application n'est joignable que
    // depuis la machine, et c'est probablement une surprise : on le dit.
    return reponse.code(503).send({
      erreur: "porte_absente",
      message: "MIP_EMPREINTE n'est pas configuree : l'acces distant est refuse en bloc.",
    });
  }
  if (porte.valide(jetonDe(requete.headers as Record<string, unknown>))) return;

  if (chemin.startsWith("/api/")) {
    return reponse.code(401).send({ erreur: "session", message: "Il faut ouvrir la porte." });
  }
  // Une page demandee sans session recoit quand meme le client : c'est lui qui
  // affiche le champ de mot de passe. Rendre une page nue ici obligerait a
  // maintenir deux interfaces pour la meme chose.
});

serveur.get("/api/porte", async (requete) => ({
  configuree: porte.configuree(),
  exigee: duTunnel(requete.headers as Record<string, unknown>),
  ouverte:
    !duTunnel(requete.headers as Record<string, unknown>) ||
    porte.valide(jetonDe(requete.headers as Record<string, unknown>)),
}));

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
serveur.get("/api/formulaire", async () => {
  const donnees = await matiere();
  const agents = await bassin.query(
    "SELECT code, nom, role, phases, optionnel, jetons FROM agent ORDER BY optionnel, code",
  );
  // L'etage part avec la question, pour toutes les classes. Le client lit
  // dedans ; il ne recalcule rien.
  const sections = donnees.sections.map((section) => ({
    ...section,
    questions: section.questions.map((q) => ({ ...q, etages: etagesDe(q) })),
  }));
  return { ...donnees, sections, agents: agents.rows, essentielles: QUESTIONS_ESSENTIELLES };
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

serveur.get("/api/cadrages", async () => {
  const lignes = await bassin.query(
    `SELECT id, titre, classe, mode, cree_le, modifie_le,
            (SELECT count(*) FROM jsonb_object_keys(reponses)) AS repondues
     FROM cadrage ORDER BY modifie_le DESC LIMIT 100`,
  );
  return { cadrages: lignes.rows };
});

serveur.get<{ Params: { id: string } }>("/api/cadrages/:id", async (requete, reponse) => {
  const ligne = await bassin.query("SELECT * FROM cadrage WHERE id = $1", [requete.params.id]);
  if (!ligne.rowCount) return reponse.code(404).send({ erreur: "introuvable" });
  return ligne.rows[0];
});

serveur.post("/api/cadrages", async (requete, reponse) => {
  const cadrage = normaliser(requete.body as CorpsCadrage);
  const prompt = assembler(cadrage, await matiere());
  const ligne = await bassin.query(
    `INSERT INTO cadrage (titre, demande, classe, mode, reponses, agents, skills, modules, certifications, prompt)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
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
    ],
  );
  return reponse.code(201).send(ligne.rows[0]);
});

serveur.put<{ Params: { id: string } }>("/api/cadrages/:id", async (requete, reponse) => {
  const cadrage = normaliser(requete.body as CorpsCadrage);
  const prompt = assembler(cadrage, await matiere());
  const ligne = await bassin.query(
    `UPDATE cadrage SET titre=$2, demande=$3, classe=$4, mode=$5, reponses=$6,
            agents=$7, skills=$8, modules=$9, certifications=$10, prompt=$11, modifie_le=now()
     WHERE id=$1 RETURNING *`,
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
    ],
  );
  if (!ligne.rowCount) return reponse.code(404).send({ erreur: "introuvable" });
  return ligne.rows[0];
});

serveur.delete<{ Params: { id: string } }>("/api/cadrages/:id", async (requete) => {
  await bassin.query("DELETE FROM cadrage WHERE id = $1", [requete.params.id]);
  return { ok: true };
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
      questions: toutes.filter((q) => retenue(q, classe) && !q.optionnelle).length,
      avec_optionnelles: toutes.filter((q) => retenue(q, classe)).length,
    })),
  };
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

async function demarrer(): Promise<void> {
  await servirLeClient();
  // Écoute locale uniquement. La publication passe par un tunnel, qui se
  // connecte en local — aucun port n'est ouvert sur le réseau.
  await serveur.listen({ port: PORT, host: "127.0.0.1" });
  serveur.log.info("MIP Studio - http://127.0.0.1:" + PORT);
  if (porte.configuree()) {
    serveur.log.info("la porte est posee : le tunnel demande le mot de passe");
  } else {
    serveur.log.warn("MIP_EMPREINTE absente : le tunnel est refuse en bloc");
    serveur.log.warn('poser un mot de passe : npm run -w serveur empreinte -- "<mot de passe>"');
  }
}

demarrer().catch((erreur) => {
  serveur.log.error(erreur);
  process.exit(1);
});
