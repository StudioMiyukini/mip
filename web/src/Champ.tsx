// @id mip.web.champ
// @role ui
// @layer ui
// @human Un champ de formulaire, choisi selon la question — et son état
// @do rendre_le_controle_de_saisie_adapte_a_la_question

import { etatDe, texteDe, type Question, type ReponseBrute } from "./types";

interface Props {
  question: Question;
  reponse: ReponseBrute | undefined;
  /** Une saisie de l'utilisateur : elle confirme toujours. */
  surSaisie: (valeur: string) => void;
}

/**
 * Le contrôle de saisie d'une question.
 *
 * **Le type vient de la question, pas de l'interface.** Plusieurs questions du
 * protocole portent déjà leurs options dans leur libellé — « Prioriser :
 * (a) rapidité, (b) complétude, (c) qualité ? » est un menu déroulant écrit en
 * prose. L'extraction les a sorties ; ici on ne fait que les rendre.
 *
 * **Toute saisie confirme.** Modifier une suggestion, c'est l'avoir relue : elle
 * devient une réponse. C'est le seul geste de confirmation qui ne demande pas un
 * bouton de plus — et le bouton existe quand même, pour accepter sans retoucher.
 */
export function Champ({ question, reponse, surSaisie }: Props) {
  const identifiant = `q-${question.numero}`;
  const valeur = texteDe(reponse);
  const suggere = etatDe(reponse) === "suggere";
  const classe = suggere ? "controle suggere" : "controle";

  switch (question.champ) {
    case "liste":
      return (
        <select id={identifiant} value={valeur} onChange={(e) => surSaisie(e.target.value)} className={classe}>
          <option value="">— non renseigné —</option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "echelle":
    case "oui_non": {
      // Des boutons plutôt qu'un menu : quelques valeurs se comparent d'un coup
      // d'œil, et un menu fermé cache justement l'échelle qu'on demande de juger.
      const options = question.champ === "oui_non" ? ["oui", "non"] : question.options;
      return (
        <div className="echelle" role="radiogroup" aria-labelledby={identifiant}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={valeur === option}
              className={valeur === option ? `cran actif${suggere ? " suggere" : ""}` : "cran"}
              onClick={() => surSaisie(valeur === option ? "" : option)}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

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
                  surSaisie(question.options.filter((o) => cochees.has(o)).join(", "));
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
          onChange={(e) => surSaisie(e.target.value)}
          className={classe}
          placeholder={question.aide || undefined}
        />
      );

    default:
      return (
        <textarea
          id={identifiant}
          value={valeur}
          onChange={(e) => surSaisie(e.target.value)}
          className={`${classe} zone`}
          rows={Math.min(valeur.split("\n").length + 1, 8)}
          placeholder={question.aide || undefined}
        />
      );
  }
}

/**
 * Le bandeau d'une suggestion non confirmée.
 *
 * **Il dit d'où vient le texte, et il demande un geste.** Le modèle qui
 * pré-remplit invente : mesuré le 2026-08-20, il a donné un sens faux à deux
 * acronymes et inventé un public. Une invention est plausible et bien écrite —
 * rien dans le texte lui-même ne la distingue d'une réponse.
 *
 * Tant que personne n'a cliqué, la suggestion **ne compte pas** : elle n'entre
 * pas dans le prompt et la question figure parmi celles qui restent à trancher.
 */
export function Suggestion({
  surAcceptation,
  surRejet,
}: {
  surAcceptation: () => void;
  surRejet: () => void;
}) {
  return (
    <div className="suggestion">
      <span className="suggestion-dit">
        Proposé à partir de votre demande — <strong>à relire</strong>. Tant que ce n'est pas
        confirmé, la question compte comme sans réponse.
      </span>
      <span className="boutons">
        <button type="button" className="principal" onClick={surAcceptation}>
          C'est juste
        </button>
        <button type="button" onClick={surRejet}>
          Effacer
        </button>
      </span>
    </div>
  );
}
