// @id mip.web.tags
// @role ui
// @layer ui
// @human Les tags : ce qu'on active selon la pertinence, avec son poids en jetons
// @do activer_ou_desactiver_des_elements_par_pertinence

import { Badge } from "@/composants/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/composants/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/composants/ui/tooltip";
import { cn } from "@/lib/utils";

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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>{titre}</CardTitle>
          <span className="text-muted-foreground font-mono text-xs">
            {actifs.length} / {elements.length}
            {total > 0 && <> · ≈ {total.toLocaleString("fr-FR")} jetons</>}
          </span>
        </div>
        <CardDescription>{explication}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {elements.map((element) => {
          const actif = ensemble.has(element.code);
          const pastille = (
            <button
              type="button"
              aria-pressed={actif}
              onClick={() => basculer(element.code)}
              className={cn(
                "focus-visible:ring-ring inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                actif
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:border-primary/60",
              )}
            >
              <span>{element.libelle}</span>
              {element.reserve && (
                <span className="text-[11px] italic opacity-75">{element.reserve}</span>
              )}
              {element.jetons ? (
                <span className="font-mono text-[11px] opacity-65">
                  {Math.round(element.jetons / 100) / 10}k
                </span>
              ) : null}
            </button>
          );
          // L'infobulle ne porte jamais une information nécessaire — seulement
          // un complément. Ce qu'il faut pour choisir est dans le libellé.
          return element.detail ? (
            <Tooltip key={element.code}>
              <TooltipTrigger asChild>{pastille}</TooltipTrigger>
              <TooltipContent className="max-w-xs">{element.detail}</TooltipContent>
            </Tooltip>
          ) : (
            <span key={element.code}>{pastille}</span>
          );
        })}
        {!elements.length && (
          <Badge variant="secondary">rien à activer pour cette classe</Badge>
        )}
      </CardContent>
    </Card>
  );
}
