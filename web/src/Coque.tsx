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

/** Les pages légales, ramassées en une ligne au pied du flanc. */
const LEGAL: Entree[] = [
  { chemin: "confidentialite", libelle: "Confidentialité" },
  { chemin: "mentions", libelle: "Mentions légales" },
  { chemin: "cgu", libelle: "CGU" },
];

/**
 * La coque.
 *
 * **Les groupes disent à quel moment on est, pas où sont rangés les fichiers.**
 * « Découvrir » puis « Cadrer » puis « Documentation » suit le trajet réel d'un
 * visiteur : il arrive sans rien savoir, il essaie, il creuse. Un menu rangé par
 * type de contenu — pages, outils, documents — n'aiderait que celui qui connaît
 * déjà.
 *
 * **Le légal est en pied, pas dans un groupe.** Ce sont des pages qu'on doit
 * pouvoir atteindre depuis n'importe où — c'est une obligation — et que
 * personne ne vient lire. Leur donner un rang égal aux autres mentirait sur ce
 * qu'on attend du visiteur ; les cacher serait illégal. Le pied règle les deux.
 */
export function Coque({ route, aller, compte, mesCadrages, enfants, surCompte }: Props) {
  const groupes: Groupe[] = [
    {
      titre: "Découvrir",
      entrees: [
        { chemin: "accueil", libelle: "Présentation" },
        { chemin: "guide", libelle: "Guide d'utilisation" },
        { chemin: "exemples", libelle: "Deux exemples" },
        { chemin: "faq", libelle: "Questions fréquentes" },
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
      titre: "Documentation",
      entrees: [
        { chemin: "protocole", libelle: "Le protocole MIP" },
        { chemin: "questions", libelle: "Les questions" },
        { chemin: "prompt", libelle: "Anatomie du prompt" },
        { chemin: "mscm", libelle: "Le balisage MSCM" },
        { chemin: "developpement", libelle: "Développer" },
        { chemin: "documentation", libelle: "Toute la documentation" },
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
          <nav className="flanc-legal" aria-label="Informations légales">
            {LEGAL.map((entree) => (
              <a
                key={entree.chemin}
                href={`/${entree.chemin}`}
                className={route === entree.chemin ? "actif" : undefined}
                onClick={(e) => surClicInterne(e, aller)}
              >
                {entree.libelle}
              </a>
            ))}
          </nav>
        </footer>
      </aside>

      <main className="scene">{enfants}</main>
    </div>
  );
}
