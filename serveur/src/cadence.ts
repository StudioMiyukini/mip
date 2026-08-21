// @id mip.cadence
// @role securite
// @layer core
// @human La limite de cadence : ce qui protège le modèle local d'un visiteur pressé
// @do limiter_le_nombre_d_appels_par_demandeur_et_par_fenetre

/**
 * Une limite de cadence, par demandeur, sur une fenêtre glissante.
 *
 * **Pourquoi elle existe.** Le site est public et sans mot de passe. Deux routes
 * coûtent cher à qui les sert : `/api/suggerer` pilote un modèle local pendant
 * sept secondes — et ce modèle sert aussi une autre application — et
 * `/api/compte/creer` écrit en base sans rien demander à personne.
 *
 * Ce n'est pas une protection contre une attaque déterminée : une adresse se
 * change. C'est une protection contre l'usage machinal — un script mal écrit,
 * un onglet qui recharge en boucle — qui est la cause réelle de la plupart des
 * saturations.
 *
 * **Une fenêtre glissante, pas un seau qui se vide.** Avec un compteur remis à
 * zéro toutes les minutes, tout le monde repart ensemble au top de la minute et
 * la pointe revient — déplacée, pas supprimée.
 */
export class Cadence {
  private readonly appels = new Map<string, number[]>();

  constructor(
    private readonly plafond: number,
    private readonly fenetre: number,
  ) {}

  /**
   * L'appel passe-t-il ? `maintenant` est injecté pour que les essais n'aient
   * pas à attendre une vraie minute.
   */
  accepte(demandeur: string, maintenant: number = Date.now()): boolean {
    this.oublier(maintenant);
    const recents = (this.appels.get(demandeur) ?? []).filter((t) => maintenant - t < this.fenetre);
    if (recents.length >= this.plafond) {
      this.appels.set(demandeur, recents);
      return false;
    }
    recents.push(maintenant);
    this.appels.set(demandeur, recents);
    return true;
  }

  /** Combien de demandeurs sont suivis. Sert aux essais et au diagnostic. */
  suivis(maintenant: number = Date.now()): number {
    this.oublier(maintenant);
    return this.appels.size;
  }

  /**
   * Purge les demandeurs sortis de la fenêtre.
   *
   * Sans ça, la carte grandit d'une entrée par visiteur et ne rend jamais rien :
   * sur un service public, c'est une fuite de mémoire à ciel ouvert.
   */
  private oublier(maintenant: number): void {
    for (const [demandeur, horodatages] of this.appels) {
      if (horodatages.every((t) => maintenant - t >= this.fenetre)) this.appels.delete(demandeur);
    }
  }
}

/**
 * Qui demande.
 *
 * Derrière le tunnel, toutes les requêtes viennent de 127.0.0.1 : c'est
 * `cf-connecting-ip` qui porte l'adresse réelle, et Cloudflare la pose
 * lui-même. En local, l'adresse de la connexion suffit.
 *
 * *Sa limite, écrite plutôt que masquée :* un client local peut forger l'en-tête
 * et se donner autant de compteurs qu'il veut. C'est sans conséquence — il
 * faudrait déjà être sur la machine, où l'on peut appeler le modèle
 * directement.
 */
export function demandeur(entetes: Record<string, unknown>, adresse: string): string {
  const reelle = entetes["cf-connecting-ip"];
  return typeof reelle === "string" && reelle ? reelle : adresse;
}
