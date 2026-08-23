// @id mip.web.coque.mobile
// @role ui
// @layer ui
// @human La coque téléphone : une barre en tête, le menu en tiroir, rien qui prenne la largeur
// @do encadrer_les_pages_sur_petit_ecran_avec_un_menu_en_tiroir

import { useState } from "react";
import { Menu, MonitorSmartphone, Moon, PenLine, Sun, User } from "lucide-react";

import { Button } from "@/composants/ui/button";
import { Separator } from "@/composants/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/composants/ui/sheet";
import { cn } from "@/lib/utils";

import { useAppareil } from "./appareil";
import type { EtatCompte } from "./Compte";
import { groupesDe, LEGAL } from "./Coque";
import { surClicInterne } from "./routeur";
import { useTheme } from "./theme";

interface Props {
  route: string;
  aller: (chemin: string) => void;
  compte: EtatCompte;
  mesCadrages: number;
  enfants: React.ReactNode;
  surCompte: () => void;
}

/**
 * La coque téléphone.
 *
 * **Pas de colonne latérale, et pas de colonne latérale repliée non plus.** Une
 * barre latérale qui se réduit à un tiroir reste une barre latérale : elle
 * impose son ordre et sa densité. Ici la navigation vit dans un tiroir plein
 * écran, où chaque entrée a la place d'être touchée du pouce.
 *
 * **La barre du haut ne contient que trois choses** : le nom du site, l'accès
 * au cadrage, et le menu. Tout ce qu'on y ajouterait volerait de la largeur à
 * ce qui compte — le contenu.
 *
 * Les groupes viennent de la coque grand écran : une entrée ajoutée d'un côté
 * et oubliée de l'autre serait une page joignable sur PC et introuvable ici.
 */
export function CoqueMobile({ route, aller, compte, mesCadrages, enfants, surCompte }: Props) {
  const { rouvrir } = useAppareil();
  const { sombre, basculer } = useTheme();
  const [ouvert, setOuvert] = useState(false);
  const groupes = groupesDe(mesCadrages);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex items-center gap-2 border-b px-4 py-2.5 backdrop-blur">
        <a
          href="/accueil"
          onClick={(e) => surClicInterne(e, aller)}
          className="mr-auto no-underline"
        >
          <strong className="block text-sm leading-tight tracking-tight">MIP Studio</strong>
          <span className="text-muted-foreground block text-[11px] leading-tight">
            cadrer avant de coder
          </span>
        </a>

        {route !== "cadrage" && (
          <Button size="sm" onClick={() => aller("cadrage")}>
            <PenLine className="size-4" />
            Cadrer
          </Button>
        )}

        <Sheet open={ouvert} onOpenChange={setOuvert}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" aria-label="Ouvrir le menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[19rem] gap-0 overflow-y-auto p-0">
            <SheetHeader className="border-b">
              <SheetTitle>Naviguer</SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-5 p-4">
              {groupes.map((groupe) => (
                <div key={groupe.titre}>
                  <h2 className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-wider uppercase">
                    {groupe.titre}
                  </h2>
                  <div className="flex flex-col gap-0.5">
                    {groupe.entrees.map((entree) => {
                      const actif = route === entree.chemin;
                      return (
                        <a
                          key={entree.chemin}
                          href={`/${entree.chemin}`}
                          aria-current={actif ? "page" : undefined}
                          onClick={(e) => {
                            setOuvert(false);
                            surClicInterne(e, aller);
                          }}
                          className={cn(
                            // `py-2.5` et non `py-1.5` : une cible de moins de
                            // 40 px se rate au pouce, et se rater dans un menu
                            // veut dire atterrir sur la mauvaise page.
                            "flex items-center justify-between rounded-md px-2.5 py-2.5 text-sm no-underline transition-colors",
                            actif
                              ? "bg-accent text-accent-foreground font-semibold"
                              : "text-muted-foreground hover:bg-accent/50",
                          )}
                        >
                          {entree.libelle}
                          {entree.compte !== undefined && (
                            <span className="bg-muted rounded-full px-1.5 font-mono text-[11px]">
                              {entree.compte}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <Separator />

            <div className="flex flex-col items-start gap-2 p-4 text-xs">
              {compte.connecte ? (
                <>
                  <span className="max-w-full truncate font-mono text-[11px]">
                    {compte.adresse}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setOuvert(false);
                      surCompte();
                    }}
                  >
                    <User className="size-4" />
                    Mon compte
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground leading-snug">
                    Aucun compte n'est nécessaire pour cadrer.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setOuvert(false);
                      surCompte();
                    }}
                  >
                    <User className="size-4" />
                    Se connecter
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full justify-start"
                onClick={basculer}
              >
                {sombre ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {sombre ? "Passer au clair" : "Passer au sombre"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full justify-start"
                onClick={rouvrir}
              >
                <MonitorSmartphone className="size-4" />
                Passer au grand écran
              </Button>

              <Separator className="my-1" />

              <a
                href="https://github.com/StudioMiyukini/mip"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground no-underline"
              >
                Code source · MIT
              </a>
              <nav aria-label="Informations légales" className="flex flex-wrap gap-x-3 gap-y-1">
                {LEGAL.map((entree) => (
                  <a
                    key={entree.chemin}
                    href={`/${entree.chemin}`}
                    onClick={(e) => {
                      setOuvert(false);
                      surClicInterne(e, aller);
                    }}
                    className="text-muted-foreground text-[11px] no-underline hover:underline"
                  >
                    {entree.libelle}
                  </a>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{enfants}</main>
    </div>
  );
}
