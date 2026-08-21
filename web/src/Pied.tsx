// @id mip.web.pied
// @role ui
// @layer ui
// @human Le pied de page : où trouver le guide, le protocole, et le reste
// @do rendre_la_documentation_atteignable_depuis_l_application

/**
 * Le pied de page.
 *
 * **Discret mais présent sur chaque écran.** Une documentation qu'on ne trouve
 * pas n'existe pas — et le premier réflexe de quelqu'un qui bloque est de
 * chercher en bas de la page, pas dans un menu.
 */
export function Pied() {
  return (
    <footer className="pied">
      <nav>
        <a href="/guide">Guide d'utilisation</a>
        <a href="/protocole">Le protocole MIP</a>
        <a href="/developpement">Développer</a>
        <a href="/confidentialite">Confidentialité</a>
        <a href="/licence">Licence MIT</a>
      </nav>
      <span className="pied-note">
        MIP Studio prépare le travail. C'est votre IA qui le fait.
      </span>
    </footer>
  );
}
