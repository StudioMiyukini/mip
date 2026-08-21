// @id mscm.integrite
// @role rule
// @layer outil
// @human Les contrôles : unicité, filiation, domaine, absence de cycle
// @do verifier_les_regles_d_integrite_de_l_index

/**
 * L'intégrité de l'index.
 *
 * **Un index périmé est pire qu'aucun index** : c'est une carte fausse, et on
 * s'y fie. C'est pourquoi la vérification fait échouer plutôt qu'avertir, et
 * pourquoi elle a sa place dans une intégration continue.
 */

import { domaine, parent, profondeur, type Bloc } from "./balisage.js";

export function verifier(blocs: Bloc[]): string[] {
  const erreurs: string[] = [];
  const vus = new Map<string, Bloc>();

  // ── unicité ─────────────────────────────────────────────────────────────
  for (const bloc of blocs) {
    const autre = vus.get(bloc.id);
    if (autre) {
      erreurs.push(
        `@id en double : « ${bloc.id} » — ${autre.fichier}:${autre.debut} et ${bloc.fichier}:${bloc.debut}`,
      );
    } else {
      vus.set(bloc.id, bloc);
    }
  }

  for (const bloc of blocs) {
    const pere = parent(bloc);
    if (!pere) continue;

    // ── filiation ─────────────────────────────────────────────────────────
    const ancetre = vus.get(pere);
    if (!ancetre) {
      erreurs.push(
        `bloc orphelin : « ${bloc.id} » (${bloc.fichier}:${bloc.debut}) — parent « ${pere} » introuvable`,
      );
      continue;
    }

    // ── cohérence de domaine ──────────────────────────────────────────────
    // Un enfant qui change de domaine casse la projection métier : le bloc
    // apparaîtrait dans un domaine dont son parent ne fait pas partie.
    if (profondeur(ancetre) > 1 && domaine(ancetre) !== domaine(bloc)) {
      erreurs.push(
        `changement de domaine : « ${bloc.id} » n'est pas dans le domaine de son parent « ${pere} »`,
      );
    }
  }

  // ── acyclicité ────────────────────────────────────────────────────────────
  // Elle porte sur la **hiérarchie**, pas sur les liens entre documents : une
  // documentation qui se cite mutuellement est saine, pas fautive.
  //
  // Un cycle est impossible par construction des identifiants en points — sauf
  // un identifiant qui se référence lui-même. On le vérifie quand même : ce qui
  // est impossible par construction devient possible à la première refonte.
  for (const bloc of blocs) {
    if (parent(bloc) === bloc.id) erreurs.push(`cycle hiérarchique sur « ${bloc.id} »`);
  }

  return erreurs;
}
