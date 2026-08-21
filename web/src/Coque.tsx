// @id mip.web.coque
// @role ui
// @layer ui
// @human La coque du tableau de bord : la barre latérale, et ce qu'elle contient
// @do encadrer_les_pages_dans_une_navigation_laterale

import { surClicInterne } from "./routeur";
import type { EtatCompte } from "./Compte";

interface Entree {
  chemin: string;
  libelle: string;
  /** Un compteur discret, à droite. Absent quand il n'y a rien à compter. */
  compte?: number;
}

interface Groupe {
  titre: string;
  entrees: Entree[];
}

interface Props {
  route: string;
  aller: (chemin: string) => void;
  compte: EtatCompte;
  mesCadrages: number;
  enfants: React.ReactNode;
  surCompte: () => void;
}

/**
 * La coque.
 *
 * **Les groupes disent à quel moment on est, pas où sont rangés les fichiers.**
 * « Découvrir » puis « Cadrer » puis « Comprendre » suit le trajet réel d'un
 * visiteur : il arrive sans rien savoir, il essaie, il creuse. Un menu rangé par
 * type de contenu — pages, outils, documents — n'aiderait que celui qui connaît
 * déjà.
 */
export function Coque({ route, aller, compte, mesCadrages, enfants, surCompte }: Props) {
  const groupes: Groupe[] = [
    {
      titre: "Découvrir",
      entrees: [
        { chemin: "accueil", libelle: "Présentation" },
        { chemin: "guide", libelle: "Guide d'utilisation" },
        { chemin: "protocole", libelle: "Le protocole MIP" },
      ],
    },
    {
      titre: "Cadrer",
      entrees: [
        { chemin: "cadrage", libelle: "Nouveau cadrage" },
        // Le compteur n'apparaît que s'il y a quelque chose : un « 0 » perpétuel
        // devant « Mes cadrages » ressemble à une fonction cassée.
        {
          chemin: "cadrages",
          libelle: "Mes cadrages",
          compte: mesCadrages || undefined,
        },
      ],
    },
    {
      titre: "Aller plus loin",
      entrees: [
        { chemin: "developpement", libelle: "Développer" },
        { chemin: "confidentialite", libelle: "Confidentialité" },
      ],
    },
  ];

  return (
    <div className="coque">
      <aside className="flanc">
        <a
          className="marque"
          href="/accueil"
          onClick={(e) => surClicInterne(e, aller)}
        >
          <strong>MIP Studio</strong>
          <span>cadrer avant de coder</span>
        </a>

        <nav>
          {groupes.map((groupe) => (
            <div className="flanc-groupe" key={groupe.titre}>
              <h2>{groupe.titre}</h2>
              {groupe.entrees.map((entree) => (
                <a
                  key={entree.chemin}
                  href={`/${entree.chemin}`}
                  className={route === entree.chemin ? "flanc-lien actif" : "flanc-lien"}
                  aria-current={route === entree.chemin ? "page" : undefined}
                  onClick={(e) => surClicInterne(e, aller)}
                >
                  {entree.libelle}
                  {entree.compte !== undefined && <span className="flanc-compte">{entree.compte}</span>}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <footer className="flanc-pied">
          {compte.connecte ? (
            <>
              <span className="flanc-adresse" title={compte.adresse}>
                {compte.adresse}
              </span>
              <button type="button" className="lien" onClick={surCompte}>
                mon compte
              </button>
            </>
          ) : (
            <>
              <span className="flanc-offre">Aucun compte n'est nécessaire.</span>
              <button type="button" className="lien" onClick={surCompte}>
                se connecter
              </button>
            </>
          )}
          <a className="flanc-source" href="https://github.com/StudioMiyukini/mip" target="_blank" rel="noreferrer">
            Code source · MIT
          </a>
        </footer>
      </aside>

      <main className="scene">{enfants}</main>
    </div>
  );
}
