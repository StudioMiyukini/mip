// @id mip.web.equipe
// @role ui
// @layer ui
// @human L'équipe : chaque rôle expliqué, pour qu'on puisse décocher en connaissance de cause
// @do presenter_chaque_role_avec_ce_qu_il_fait_et_quand_il_sert

import type { Agent } from "./types";

interface Props {
  agents: Agent[];
  actifs: string[];
  surChangement: (actifs: string[]) => void;
}

/**
 * L'équipe, en lignes plutôt qu'en tags.
 *
 * **Un tag ne peut pas porter une explication.** Les autres catalogues —
 * savoir-faire, modules, référentiels — se cochent sur leur seul nom : on sait
 * ce qu'est `rust-async` ou `RGPD`, ou bien on n'en a pas besoin. Les rôles
 * non : « Arianne — Team manager, QA, memoire · P0 T9, P6 » ne dit à personne
 * s'il lui faut Arianne.
 *
 * On avait mis le rôle en infobulle. Une infobulle ne se lit pas au doigt, ne
 * s'imprime pas, et ne se voit que si l'on soupçonne déjà qu'il y a quelque
 * chose à lire. Autant dire qu'elle n'existait pas.
 *
 * **Le champ « quand » est celui qui compte** : c'est lui qui permet de
 * décocher. Sans lui on active les onze rôles au cas où — et le chargement à la
 * demande, seule raison d'être de ces cases, ne sert plus à rien.
 */
export function Equipe({ agents, actifs, surChangement }: Props) {
  const ensemble = new Set(actifs);
  const total = agents
    .filter((a) => ensemble.has(a.code))
    .reduce((somme, a) => somme + (a.jetons ?? 0), 0);

  function basculer(code: string): void {
    if (ensemble.has(code)) ensemble.delete(code);
    else ensemble.add(code);
    // L'ordre du catalogue, pas celui des clics : deux cadrages identiques
    // doivent produire deux prompts identiques.
    surChangement(agents.filter((a) => ensemble.has(a.code)).map((a) => a.code));
  }

  return (
    <section className="bloc">
      <header className="bloc-tete">
        <h3>L'équipe</h3>
        <span className="compte">
          {actifs.length} / {agents.length}
          {total > 0 && <> · ≈ {total.toLocaleString("fr-FR")} jetons</>}
        </span>
      </header>
      <p className="explication">
        Chaque rôle est un prompt chargé au moment de sa phase, pas un personnage à jouer.
        Décochez ceux dont votre projet n'a pas besoin : ce qui n'est pas chargé ne se paie
        pas à chaque tour.
      </p>

      <ul className="equipe">
        {agents.map((agent) => {
          const actif = ensemble.has(agent.code);
          return (
            <li key={agent.code}>
              <button
                type="button"
                aria-pressed={actif}
                className={actif ? "role actif" : "role"}
                onClick={() => basculer(agent.code)}
              >
                <span className="role-tete">
                  <span className="role-nom">{agent.nom}</span>
                  <span className="role-poste">{agent.role}</span>
                  {agent.optionnel && <span className="role-reserve">optionnel</span>}
                  {agent.jetons ? (
                    <span className="role-poids">{Math.round(agent.jetons / 100) / 10}k</span>
                  ) : null}
                </span>
                {agent.resume && <span className="role-resume">{agent.resume}</span>}
                {agent.quand && (
                  <span className="role-quand">
                    <em>Quand</em> — {agent.quand}
                  </span>
                )}
                <span className="role-phases">{agent.phases_claires || agent.phases}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
