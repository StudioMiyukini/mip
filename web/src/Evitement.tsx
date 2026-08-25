// @id mip.web.evitement
// @role ui
// @layer ui
// @human Le lien « Aller au contenu » : sauter la navigation au clavier
// @do offrir_un_lien_d_evitement_vers_le_contenu_principal

/**
 * Le lien d'évitement — WCAG 2.2, critère 2.4.1 (niveau A).
 *
 * **Masqué jusqu'au focus.** Un utilisateur à la souris ne le voit jamais ;
 * celui qui tabule le trouve en premier et saute la vingtaine de liens de la
 * navigation pour atterrir sur le contenu. C'était le seul critère de niveau A
 * manquant à l'audit du 2026-08-25.
 *
 * Il cible `#contenu`, que les deux coques posent sur leur `<main>`.
 */
export function Evitement() {
  return (
    <a
      href="#contenu"
      className="bg-primary text-primary-foreground focus-visible:ring-ring sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus-visible:ring-[3px]"
    >
      Aller au contenu
    </a>
  );
}
