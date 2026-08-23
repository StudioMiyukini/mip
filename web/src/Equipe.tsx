// @id mip.web.equipe
// @role ui
// @layer ui
// @human L'équipe : chaque rôle expliqué, pour qu'on puisse décocher en connaissance de cause
// @do presenter_chaque_role_avec_ce_qu_il_fait_et_quand_il_sert

import { Check } from "lucide-react";

import { Badge } from "@/composants/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/composants/ui/card";
import { cn } from "@/lib/utils";

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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>L'équipe</CardTitle>
          <span className="text-muted-foreground font-mono text-xs">
            {actifs.length} / {agents.length}
            {total > 0 && <> · ≈ {total.toLocaleString("fr-FR")} jetons</>}
          </span>
        </div>
        <CardDescription>
          Chaque rôle est un prompt chargé au moment de sa phase, pas un personnage à jouer.
          Décochez ceux dont votre projet n'a pas besoin : ce qui n'est pas chargé ne se paie
          pas à chaque tour.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1.5">
          {agents.map((agent) => {
            const actif = ensemble.has(agent.code);
            return (
              <li key={agent.code}>
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => basculer(agent.code)}
                  className={cn(
                    "focus-visible:ring-ring flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                    actif
                      ? "border-primary bg-primary/5 shadow-[inset_3px_0_0_var(--color-primary)]"
                      : "bg-background hover:border-primary/60",
                  )}
                >
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {actif && <Check className="text-primary size-3.5 self-center" />}
                    <span className={cn("font-semibold", actif && "text-primary")}>
                      {agent.nom}
                    </span>
                    <span className="text-muted-foreground text-xs">{agent.role}</span>
                    {agent.optionnel && (
                      <Badge variant="secondary" className="text-[10px]">
                        optionnel
                      </Badge>
                    )}
                    {agent.jetons ? (
                      <span className="text-muted-foreground ml-auto font-mono text-[11px]">
                        {Math.round(agent.jetons / 100) / 10}k
                      </span>
                    ) : null}
                  </span>
                  {agent.resume && <span className="text-sm leading-snug">{agent.resume}</span>}
                  {agent.quand && (
                    <span className="text-muted-foreground text-xs leading-snug">
                      <em className="text-foreground/80 font-semibold not-italic">Quand</em> —{" "}
                      {agent.quand}
                    </span>
                  )}
                  <span className="text-muted-foreground/80 font-mono text-[11px]">
                    {agent.phases_claires || agent.phases}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
