// @id mip.web.tags_groupes
// @role ui
// @layer ui
// @human Des tags rangés par sous-groupe : le format du livrable, la technique
// @do choisir_parmi_des_tags_ranges_par_sous_groupe

import type { Choix } from "./types";

interface Props {
  titre: string;
  explication: string;
  choix: Choix[];
  actifs: string[];
  surChangement: (actifs: string[]) => void;
}

/**
 * Une grille de tags, rangée par sous-groupe.
 *
 * **Le rangement fait le travail.** Vingt tags à plat se lisent comme une liste
 * de courses ; les mêmes rangés en « Langage / Interface / Serveur / Données »
 * se parcourent d'un coup d'œil, parce qu'on sait dans quelle famille chercher.
 *
 * Elle diffère de [`Tags`], qui affiche le poids en jetons : ici rien ne se
 * charge dans un contexte, donc il n'y a pas de coût à montrer — seulement un
 * choix à faire.
 */
export function TagsGroupes({ titre, explication, choix, actifs, surChangement }: Props) {
  const ensemble = new Set(actifs);

  // L'ordre des groupes suit celui de la déclaration, pas l'alphabet : « Langage »
  // avant « Mise en service » est un ordre de décision, pas de dictionnaire.
  const groupes: Array<[string, Choix[]]> = [];
  for (const element of choix) {
    const dernier = groupes.find(([nom]) => nom === element.groupe);
    if (dernier) dernier[1].push(element);
    else groupes.push([element.groupe, [element]]);
  }

  function basculer(code: string): void {
    if (ensemble.has(code)) ensemble.delete(code);
    else ensemble.add(code);
    // On garde l'ordre du catalogue, pas celui des clics : deux personnes qui
    // cochent la même chose doivent produire le même prompt.
    surChangement(choix.filter((c) => ensemble.has(c.code)).map((c) => c.code));
  }

  return (
    <section className="bloc">
      <header className="bloc-tete">
        <h3>{titre}</h3>
        {actifs.length > 0 && <span className="compte">{actifs.length} choisi{actifs.length > 1 ? "s" : ""}</span>}
      </header>
      <p className="explication">{explication}</p>

      {groupes.map(([nom, elements]) => (
        <div className="tags-groupe" key={nom}>
          <h4>{nom}</h4>
          <div className="tags">
            {elements.map((element) => (
              <button
                key={element.code}
                type="button"
                aria-pressed={ensemble.has(element.code)}
                className={ensemble.has(element.code) ? "tag actif" : "tag"}
                onClick={() => basculer(element.code)}
                title={element.detail}
              >
                <span className="tag-nom">{element.libelle}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
