// @id mip.web.tags_groupes
// @role ui
// @layer ui
// @human Des tags rangés par sous-groupe : le format du livrable, la technique
// @do choisir_parmi_des_tags_ranges_par_sous_groupe

import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/composants/ui/button";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/composants/ui/card";
import { cn } from "@/lib/utils";

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
 * **Le rangement fait le travail.** Quarante-sept tags à plat se lisent comme
 * une liste de courses ; les mêmes rangés en « Langage / Interface / Serveur /
 * Données » se parcourent d'un coup d'œil, parce qu'on sait dans quelle famille
 * chercher.
 *
 * **Le détail est écrit, pas mis en infobulle.** Il l'était, et une infobulle
 * ne se lit pas au doigt, ne s'imprime pas, et ne se voit que si l'on soupçonne
 * déjà qu'il y a quelque chose à lire. Tant que le catalogue tenait en seize
 * entrées aux libellés évidents, ça passait ; à trente-trois, le moment où le
 * détail sert est justement celui du choix.
 *
 * Un groupe dont aucune entrée ne porte de détail garde les pastilles serrées :
 * la grille ne s'impose que là où il y a quelque chose à lire.
 *
 * **Replié au-delà d'une vingtaine d'entrées, et ce n'est pas un détail de
 * mise en page.** Vu à l'écran : les deux catalogues déroulés faisaient
 * ensemble treize cents pixels *avant* la première des quatre questions
 * essentielles. Le formulaire posait donc son mur exactement là où l'étagement
 * l'avait abattu — plus haut, mais un mur quand même.
 *
 * Ce qui est coché reste visible replié : on voit son choix sans déplier, et
 * l'on ne déplie que pour le changer.
 */
/** Au-delà, le catalogue s'affiche replié. Vingt entrées tiennent à l'écran. */
const SEUIL_REPLI = 20;

export function TagsGroupes({ titre, explication, choix, actifs, surChangement }: Props) {
  const ensemble = new Set(actifs);
  const [deplie, setDeplie] = useState(choix.length <= SEUIL_REPLI);

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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>{titre}</CardTitle>
          {actifs.length > 0 && (
            <span className="text-primary font-mono text-xs">
              {actifs.length} choisi{actifs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <CardDescription>{explication}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!deplie && (
          <div className="flex flex-wrap items-center gap-1.5">
            {choix
              .filter((c) => ensemble.has(c.code))
              .map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => basculer(c.code)}
                  className="border-primary bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
                >
                  <Check className="size-3.5" />
                  {c.libelle}
                </button>
              ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setDeplie(true)}
            >
              <ChevronDown className="size-4" />
              {actifs.length ? `Changer (${choix.length} au choix)` : `Choisir parmi ${choix.length}`}
            </Button>
          </div>
        )}

        {deplie &&
          groupes.map(([nom, elements]) => {
          const detaille = elements.some((e) => e.detail);
          return (
            <div key={nom}>
              <h4 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
                {nom}
              </h4>
              <div
                className={cn(
                  detaille
                    ? "grid gap-1.5 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]"
                    : "flex flex-wrap gap-1.5",
                )}
              >
                {elements.map((element) => {
                  const actif = ensemble.has(element.code);
                  return (
                    <button
                      key={element.code}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => basculer(element.code)}
                      className={cn(
                        "focus-visible:ring-ring border text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                        detaille
                          ? "flex flex-col gap-0.5 rounded-lg px-3 py-2"
                          : "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                        actif
                          ? // Pas d'aplat de couleur sur les cases : sous un aplat,
                            // la seconde ligne devient illisible.
                            detaille
                            ? "border-primary bg-primary/5 shadow-[inset_3px_0_0_var(--color-primary)]"
                            : "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:border-primary/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-sm",
                          actif && detaille && "text-primary font-semibold",
                        )}
                      >
                        {actif && detaille && <Check className="size-3.5 shrink-0" />}
                        {element.libelle}
                      </span>
                      {detaille && (
                        <span className="text-muted-foreground text-[11px] leading-snug">
                          {element.detail ?? ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {deplie && choix.length > SEUIL_REPLI && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setDeplie(false)}
          >
            <ChevronUp className="size-4" />
            Replier
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
