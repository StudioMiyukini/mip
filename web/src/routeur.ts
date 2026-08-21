// @id mip.web.routeur
// @role orchestration
// @layer ui
// @human Le routeur : trois lignes plutôt qu'une dépendance
// @do naviguer_entre_les_pages_sans_recharger

import { useEffect, useState } from "react";

/**
 * Un routeur minimal, sur le chemin.
 *
 * **Pourquoi pas une bibliothèque.** React Router pèse plus que tout le reste du
 * client réuni, et il apporte des routes imbriquées, des chargeurs, des actions
 * — rien de ce dont sept pages ont besoin. Ce fichier fait quarante lignes et se
 * lit d'un trait.
 *
 * Le serveur rend `index.html` sur toute route inconnue : une adresse tapée
 * directement, ou un lien partagé, arrive donc au bon endroit.
 */

export function cheminCourant(): string {
  return window.location.pathname.replace(/^\/+|\/+$/g, "") || "accueil";
}

/** Le chemin, et il suit les boutons précédent/suivant du navigateur. */
export function useRoute(): [string, (chemin: string) => void] {
  const [route, setRoute] = useState(cheminCourant);

  useEffect(() => {
    const surRetour = () => setRoute(cheminCourant());
    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);

  function aller(chemin: string): void {
    const propre = chemin.replace(/^\/+/, "");
    window.history.pushState(null, "", "/" + propre);
    setRoute(propre || "accueil");
    // Une navigation qui laisse la page à mi-hauteur donne l'impression que
    // rien ne s'est passé.
    window.scrollTo(0, 0);
  }

  return [route, aller];
}

/**
 * Intercepte un clic sur un lien interne.
 *
 * On garde de vraies balises `<a href>` — elles s'ouvrent dans un onglet avec le
 * clic du milieu, se copient, et se lisent par un lecteur d'écran. Un `<div
 * onClick>` perdrait les trois.
 */
export function surClicInterne(
  evenement: React.MouseEvent<HTMLAnchorElement>,
  aller: (chemin: string) => void,
): void {
  // Un clic modifié — nouvelle fenêtre, nouvel onglet — appartient au navigateur.
  if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.button !== 0) return;
  evenement.preventDefault();
  aller(new URL(evenement.currentTarget.href).pathname);
}
