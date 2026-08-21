// @id mip.web.etages
// @role ui
// @layer ui
// @human Les trois étages : où l'on en est, et ce qu'on gagne à continuer
// @do montrer_la_progression_par_etages_et_ce_que_chacun_apporte

import type { Etage } from "./types";

interface Props {
  etage: Etage;
  surChangement: (etage: Etage) => void;
  restantes: Record<Etage, number>;
}

/**
 * Ce que chaque étage apporte, dit à qui hésite à continuer.
 *
 * **Le libellé promet un gain, pas un effort.** « 12 questions de plus » fait
 * fermer l'onglet ; « pour que l'agent sache où s'arrêter » donne une raison de
 * cliquer. Le nombre reste affiché — on ne cache pas le coût — mais il n'est pas
 * ce qu'on lit en premier.
 */
const ETAGES: Array<{ etage: Etage; titre: string; gain: string }> = [
  {
    etage: 1,
    titre: "L'essentiel",
    gain: "quatre questions, et un prompt déjà utilisable",
  },
  {
    etage: 2,
    titre: "Le cadrage",
    gain: "pour que l'agent sache où s'arrêter et quoi produire",
  },
  {
    etage: 3,
    titre: "Le détail",
    gain: "les nuances, l'équipe, et ce qu'il doit charger",
  },
];

export function Etages({ etage, surChangement, restantes }: Props) {
  return (
    <nav className="etages" aria-label="Progression du cadrage">
      {ETAGES.map((niveau) => {
        const atteint = etage >= niveau.etage;
        const reste = restantes[niveau.etage] ?? 0;
        return (
          <button
            key={niveau.etage}
            type="button"
            className={atteint ? "etage atteint" : "etage"}
            aria-current={etage === niveau.etage ? "step" : undefined}
            onClick={() => surChangement(niveau.etage)}
          >
            <span className="etage-rang">{niveau.etage}</span>
            <span className="etage-corps">
              <strong>{niveau.titre}</strong>
              <span className="etage-gain">{niveau.gain}</span>
            </span>
            {reste > 0 && <span className="etage-reste">{reste}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Le bandeau de fin d'étage.
 *
 * Il apparaît quand l'étage courant est rempli, et il dit deux choses en même
 * temps : **c'est utilisable maintenant**, et voilà ce qu'on gagnerait à
 * continuer. Sans lui, l'utilisateur ne sait pas qu'il peut s'arrêter — et
 * quelqu'un qui ne sait pas qu'il peut s'arrêter abandonne au lieu de finir.
 */
export function Palier({
  etage,
  surSuite,
  surCopie,
}: {
  etage: Etage;
  surSuite: () => void;
  surCopie: () => void;
}) {
  const suivant = ETAGES.find((n) => n.etage === etage + 1);

  return (
    <section className="palier">
      <div>
        <strong>Votre prompt est prêt.</strong>
        <p className="explication">
          Vous pouvez le copier maintenant et vous arrêter là.
          {suivant && ` Ou continuer : ${suivant.gain}.`}
        </p>
      </div>
      <div className="boutons">
        <button type="button" className="principal" onClick={surCopie}>
          Copier le prompt
        </button>
        {suivant && (
          <button type="button" onClick={surSuite}>
            {suivant.titre} →
          </button>
        )}
      </div>
    </section>
  );
}
