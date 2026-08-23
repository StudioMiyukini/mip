// @id mip.web.etages
// @role ui
// @layer ui
// @human Les trois étages : où l'on en est, et ce qu'on gagne à continuer
// @do montrer_la_progression_par_etages_et_ce_que_chacun_apporte

import { ArrowRight, Check, Copy } from "lucide-react";

import { Button } from "@/composants/ui/button";
import { cn } from "@/lib/utils";

import type { Etage } from "./types";

/**
 * Ce que chaque étage apporte, dit à qui hésite à continuer.
 *
 * **Le libellé promet un gain, pas un effort.** « 12 questions de plus » fait
 * fermer l'onglet ; « pour que l'agent sache où s'arrêter » donne une raison de
 * cliquer. Le nombre reste affiché — on ne cache pas le coût — mais il n'est pas
 * ce qu'on lit en premier.
 */
export const ETAGES: Array<{ etage: Etage; titre: string; gain: string }> = [
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

interface Props {
  etage: Etage;
  surChangement: (etage: Etage) => void;
  restantes: Record<Etage, number>;
}

export function Etages({ etage, surChangement, restantes }: Props) {
  return (
    <nav
      aria-label="Progression du cadrage"
      className="grid gap-2 sm:grid-cols-3"
    >
      {ETAGES.map((niveau) => {
        const atteint = etage >= niveau.etage;
        const courant = etage === niveau.etage;
        const reste = restantes[niveau.etage] ?? 0;
        return (
          <button
            key={niveau.etage}
            type="button"
            aria-current={courant ? "step" : undefined}
            onClick={() => surChangement(niveau.etage)}
            className={cn(
              "focus-visible:ring-ring flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
              courant
                ? "border-primary bg-primary/5"
                : atteint
                  ? "border-primary/30 bg-background"
                  : "bg-background hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                atteint
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {atteint && !courant ? <Check className="size-3.5" /> : niveau.etage}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm font-semibold", courant && "text-primary")}>
                {niveau.titre}
              </span>
              <span className="text-muted-foreground block text-xs leading-snug">
                {niveau.gain}
              </span>
            </span>
            {reste > 0 && (
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-[11px]">
                {reste}
              </span>
            )}
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
  copie,
}: {
  etage: Etage;
  surSuite: () => void;
  surCopie: () => void;
  copie: boolean;
}) {
  const suivant = ETAGES.find((n) => n.etage === etage + 1);

  return (
    <section className="border-primary/40 bg-primary/5 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
      <div className="min-w-52 flex-1">
        <strong className="text-sm">Votre prompt est prêt.</strong>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">
          Vous pouvez le copier maintenant et vous arrêter là.
          {suivant && ` Ou continuer : ${suivant.gain}.`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={surCopie}>
          {copie ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copie ? "Copié" : "Copier le prompt"}
        </Button>
        {suivant && (
          <Button type="button" variant="outline" onClick={surSuite}>
            {suivant.titre}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </section>
  );
}
