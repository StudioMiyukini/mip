// @id mip.web.champ
// @role ui
// @layer ui
// @human Un champ de formulaire, choisi selon la question
// @do rendre_le_controle_de_saisie_adapte_a_la_question

import type { Question } from "./types";

interface Props {
  question: Question;
  valeur: string;
  surChangement: (valeur: string) => void;
}

/**
 * Le contrôle de saisie d'une question.
 *
 * **Le type vient de la question, pas de l'interface.** Plusieurs questions du
 * protocole portent déjà leurs options dans leur libellé — « Prioriser :
 * (a) rapidité, (b) complétude, (c) qualité ? » est un menu déroulant écrit en
 * prose. L'extraction les a sorties ; ici on ne fait que les rendre.
 *
 * Les cases à cocher enregistrent une chaîne, pas un tableau. C'est délibéré :
 * la réponse finit dans un prompt en français, et « rapidité, qualité » s'y lit
 * mieux que `["rapidite","qualite"]`. Le stockage suit l'usage.
 */
export function Champ({ question, valeur, surChangement }: Props) {
  const identifiant = `q-${question.numero}`;

  switch (question.champ) {
    case "liste":
      return (
        <select
          id={identifiant}
          value={valeur}
          onChange={(e) => surChangement(e.target.value)}
          className="controle"
        >
          <option value="">— non renseigné —</option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "echelle":
      // Des boutons plutôt qu'un menu : cinq valeurs se comparent d'un coup
      // d'œil, et un menu fermé cache justement l'échelle qu'on demande de juger.
      return (
        <div className="echelle" role="radiogroup" aria-labelledby={identifiant}>
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={valeur === option}
              className={valeur === option ? "cran actif" : "cran"}
              onClick={() => surChangement(valeur === option ? "" : option)}
            >
              {option}
            </button>
          ))}
        </div>
      );

    case "oui_non":
      return (
        <div className="echelle" role="radiogroup" aria-labelledby={identifiant}>
          {["oui", "non"].map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={valeur === option}
              className={valeur === option ? "cran actif" : "cran"}
              onClick={() => surChangement(valeur === option ? "" : option)}
            >
              {option}
            </button>
          ))}
        </div>
      );

    case "cases": {
      const cochees = new Set(valeur ? valeur.split(", ") : []);
      return (
        <div className="cases">
          {question.options.map((option) => (
            <label key={option} className="case">
              <input
                type="checkbox"
                checked={cochees.has(option)}
                onChange={() => {
                  if (cochees.has(option)) cochees.delete(option);
                  else cochees.add(option);
                  // L'ordre des options, pas l'ordre des clics : deux personnes
                  // qui cochent la même chose doivent produire le même prompt.
                  surChangement(question.options.filter((o) => cochees.has(o)).join(", "));
                }}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    case "ligne":
      return (
        <input
          id={identifiant}
          type="text"
          value={valeur}
          onChange={(e) => surChangement(e.target.value)}
          className="controle"
          placeholder={question.aide || undefined}
        />
      );

    default:
      return (
        <textarea
          id={identifiant}
          value={valeur}
          onChange={(e) => surChangement(e.target.value)}
          className="controle zone"
          rows={valeur.split("\n").length + 1}
          placeholder={question.aide || undefined}
        />
      );
  }
}
