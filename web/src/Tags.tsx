// @id mip.web.tags
// @role ui
// @layer ui
// @human Les tags : ce qu'on active selon la pertinence
// @do activer_ou_desactiver_des_elements_par_pertinence

interface Element {
  code: string;
  libelle: string;
  detail?: string;
  /** Un avertissement discret — « lié à la stack d'origine », par exemple. */
  reserve?: string;
  jetons?: number;
}

interface Props {
  titre: string;
  explication: string;
  elements: Element[];
  actifs: string[];
  surChangement: (actifs: string[]) => void;
}

/**
 * Une grille de tags à activer.
 *
 * **Le poids en jetons est affiché, et ce n'est pas de la décoration.** Chaque
 * élément activé finit dans le contexte d'un agent, et un contexte de soixante
 * mille jetons se paie à *chaque tour*, pas une fois. Sans le chiffre, on active
 * tout « au cas où » — et c'est exactement ce que le protocole cherche à
 * empêcher avec son chargement à la demande.
 */
export function Tags({ titre, explication, elements, actifs, surChangement }: Props) {
  const ensemble = new Set(actifs);
  const total = elements
    .filter((e) => ensemble.has(e.code))
    .reduce((somme, e) => somme + (e.jetons ?? 0), 0);

  function basculer(code: string): void {
    if (ensemble.has(code)) ensemble.delete(code);
    else ensemble.add(code);
    // On garde l'ordre du catalogue, pas l'ordre des clics : deux cadrages
    // identiques doivent produire deux prompts identiques.
    surChangement(elements.filter((e) => ensemble.has(e.code)).map((e) => e.code));
  }

  return (
    <section className="bloc">
      <header className="bloc-tete">
        <h3>{titre}</h3>
        <span className="compte">
          {actifs.length} / {elements.length}
          {total > 0 && <> · ≈ {total.toLocaleString("fr-FR")} jetons</>}
        </span>
      </header>
      <p className="explication">{explication}</p>
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
            {element.reserve && <span className="tag-reserve">{element.reserve}</span>}
            {element.jetons ? <span className="tag-poids">{Math.round(element.jetons / 100) / 10}k</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
