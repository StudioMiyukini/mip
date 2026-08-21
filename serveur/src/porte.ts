// @id mip.porte
// @role securite
// @layer core
// @human La porte : ce qui vient du tunnel doit donner le mot de passe
// @do proteger_l_acces_venu_du_tunnel_par_un_mot_de_passe

/**
 * La porte.
 *
 * **Elle ne juge pas *qui* parle — elle constate *par où*.** Une requête venue
 * du tunnel Cloudflare doit présenter une session ; une requête venue de la
 * machine, non. C'est le même principe que chez Alicia : le client ne déclare
 * pas ses droits, le serveur les établit à partir de ce qu'il voit passer.
 *
 * **Sans empreinte configurée, le site est ouvert.** Ce n'était pas le cas au
 * départ : le tunnel était alors refusé en bloc, parce qu'une application sans
 * compte publiée sans porte aurait laissé lire et écrire à qui trouvait l'URL.
 *
 * Cette raison a disparu le jour où les comptes sont arrivés. Aujourd'hui,
 * l'écriture exige un compte et la lecture est bornée à son propriétaire — la
 * porte partagée ne protégeait plus des données, elle empêchait seulement le
 * public d'entrer. Or le public est le but.
 *
 * Elle reste disponible : poser `MIP_EMPREINTE` referme le site d'un coup, pour
 * une maintenance ou une mise en ligne progressive. C'est un verrou, plus une
 * condition d'existence.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Le nom du biscuit de session. */
export const BISCUIT = "mip_session";

/** Combien de temps une session vaut. Un mois : c'est un outil de travail. */
const DUREE = 30 * 24 * 3600 * 1000;

/** Le coût du hachage. scrypt avec ces paramètres prend ~100 ms — assez pour
 *  qu'une attaque par dictionnaire coûte, assez peu pour qu'on ne le sente pas. */
const SEL = "mip-studio";
const COUT = { N: 16384, r: 8, p: 1 };

/** L'empreinte d'un mot de passe, en hexadécimal. */
export function empreindre(mot: string): string {
  return scryptSync(mot, SEL, 32, COUT).toString("hex");
}

const sessions = new Map<string, number>();

export class Porte {
  /**
   * L'empreinte attendue. Elle vient de l'environnement : le mot de passe ne
   * touche jamais un fichier du dépôt, et le changer ne demande pas de toucher
   * au code.
   */
  private readonly empreinte: string;

  constructor(empreinte = process.env.MIP_EMPREINTE ?? "") {
    this.empreinte = empreinte.trim();
  }

  configuree(): boolean {
    return this.empreinte.length > 0;
  }

  /**
   * Le mot de passe est-il le bon ?
   *
   * La comparaison est à durée constante. Le gain est théorique derrière un
   * tunnel dont la latence varie de dizaines de millisecondes — mais elle ne
   * coûte rien, et l'écrire évite d'avoir à se demander si elle manquait.
   */
  ouvre(mot: string): string | null {
    if (!this.configuree()) return null;
    const propose = Buffer.from(empreindre(mot), "hex");
    const attendu = Buffer.from(this.empreinte, "hex");
    if (propose.length !== attendu.length || !timingSafeEqual(propose, attendu)) return null;

    const jeton = randomBytes(32).toString("hex");
    sessions.set(jeton, Date.now() + DUREE);
    return jeton;
  }

  valide(jeton: string | undefined): boolean {
    if (!jeton) return false;
    const expire = sessions.get(jeton);
    if (!expire) return false;
    if (expire < Date.now()) {
      sessions.delete(jeton);
      return false;
    }
    return true;
  }

  ferme(jeton: string | undefined): void {
    if (jeton) sessions.delete(jeton);
  }
}

/**
 * La requête vient-elle du tunnel ?
 *
 * Cloudflare ajoute `cf-ray` à tout ce qui traverse son réseau, et rien de
 * local ne le porte. On ne se fie pas à l'adresse source : le tunnel se connecte
 * en local, donc toutes les requêtes arrivent de 127.0.0.1 et l'adresse ne
 * distingue rien.
 *
 * *Sa limite, écrite plutôt que masquée :* un client local pourrait forger
 * `cf-ray` et se faire passer pour le tunnel. C'est sans conséquence — il en
 * hériterait des droits **moindres**, pas plus grands. L'inverse serait grave,
 * et c'est pour ça que le test est dans ce sens.
 */
export function duTunnel(entetes: Record<string, unknown>): boolean {
  return Boolean(entetes["cf-ray"] ?? entetes["cf-connecting-ip"]);
}

/** Le jeton porté par le biscuit, s'il y en a un. */
export function jetonDe(entetes: Record<string, unknown>): string | undefined {
  const brut = entetes["cookie"];
  if (typeof brut !== "string") return undefined;
  for (const morceau of brut.split(";")) {
    const [nom, ...reste] = morceau.trim().split("=");
    if (nom === BISCUIT) return reste.join("=");
  }
  return undefined;
}
