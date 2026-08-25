// @id mip.web.coque
// @role ui
// @layer ui
// @human La coque grand écran : la barre latérale, et ce qu'elle contient
// @do encadrer_les_pages_dans_une_navigation_laterale

import { Moon, MonitorSmartphone, Sun } from "lucide-react";

import { Button } from "@/composants/ui/button";
import { Separator } from "@/composants/ui/separator";
import { cn } from "@/lib/utils";

import { useAppareil } from "./appareil";
import type { EtatCompte } from "./Compte";
import { Evitement } from "./Evitement";
import { surClicInterne } from "./routeur";
import { useTheme } from "./theme";

export interface Entree {
  chemin: string;
  libelle: string;
  /** Un compteur discret, à droite. Absent quand il n'y a rien à compter. */
  compte?: number;
}

export interface Groupe {
  titre: string;
  entrees: Entree[];
}

interface Props {
  route: string;
  aller: (chemin: string) => void;
  compte: EtatCompte;
  mesCadrages: number;
  enfants: React.ReactNode;
  surCompte: () => void;
}

/** Les pages légales, ramassées en une ligne au pied du flanc. */
export const LEGAL: Entree[] = [
  { chemin: "confidentialite", libelle: "Confidentialité" },
  { chemin: "mentions", libelle: "Mentions légales" },
  { chemin: "cgu", libelle: "CGU" },
];

/**
 * Les groupes de navigation, partagés par les deux coques.
 *
 * **Les groupes disent à quel moment on est, pas où sont rangés les fichiers.**
 * « Découvrir » puis « Cadrer » puis « Documentation » suit le trajet réel d'un
 * visiteur : il arrive sans rien savoir, il essaie, il creuse. Un menu rangé par
 * type de contenu n'aiderait que celui qui connaît déjà.
 *
 * Les deux parcours lisent la même liste : une entrée ajoutée d'un côté et
 * oubliée de l'autre serait une page joignable sur PC et introuvable sur
 * téléphone.
 */
export function groupesDe(mesCadrages: number): Groupe[] {
  return [
    {
      titre: "Découvrir",
      entrees: [
        { chemin: "accueil", libelle: "Présentation" },
        { chemin: "guide", libelle: "Guide d'utilisation" },
        { chemin: "exemples", libelle: "Deux exemples" },
        { chemin: "faq", libelle: "Questions fréquentes" },
      ],
    },
    {
      titre: "Cadrer",
      entrees: [
        { chemin: "cadrage", libelle: "Nouveau cadrage" },
        // Le compteur n'apparaît que s'il y a quelque chose : un « 0 » perpétuel
        // devant « Mes cadrages » ressemble à une fonction cassée.
        { chemin: "cadrages", libelle: "Mes cadrages", compte: mesCadrages || undefined },
      ],
    },
    {
      titre: "Documentation",
      entrees: [
        { chemin: "protocole", libelle: "Le protocole MIP" },
        { chemin: "questions", libelle: "Les questions" },
        { chemin: "prompt", libelle: "Anatomie du prompt" },
        { chemin: "mscm", libelle: "Le balisage MSCM" },
        { chemin: "developpement", libelle: "Développer" },
        { chemin: "documentation", libelle: "Toute la documentation" },
      ],
    },
  ];
}

/**
 * La coque grand écran : une colonne de navigation, une scène qui change.
 *
 * **Le légal est en pied, pas dans un groupe.** Ce sont des pages qu'on doit
 * pouvoir atteindre depuis n'importe où — c'est une obligation — et que
 * personne ne vient lire. Leur donner un rang égal aux autres mentirait sur ce
 * qu'on attend du visiteur ; les cacher serait illégal. Le pied règle les deux.
 */
export function Coque({ route, aller, compte, mesCadrages, enfants, surCompte }: Props) {
  const { rouvrir } = useAppareil();
  const { sombre, basculer } = useTheme();
  const groupes = groupesDe(mesCadrages);

  return (
    <div className="grid min-h-dvh grid-cols-[248px_minmax(0,1fr)]">
      <Evitement />
      <aside className="bg-card sticky top-0 flex h-dvh flex-col gap-5 overflow-y-auto border-r px-4 py-5">
        <a href="/accueil" onClick={(e) => surClicInterne(e, aller)} className="block no-underline">
          <strong className="block text-base tracking-tight">MIP Studio</strong>
          <span className="text-muted-foreground block text-xs">cadrer avant de coder</span>
        </a>

        <nav className="flex flex-col gap-5">
          {groupes.map((groupe) => (
            <div key={groupe.titre}>
              <h2 className="text-muted-foreground mb-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase">
                {groupe.titre}
              </h2>
              <div className="flex flex-col gap-0.5">
                {groupe.entrees.map((entree) => (
                  <Lien
                    key={entree.chemin}
                    entree={entree}
                    actif={route === entree.chemin}
                    aller={aller}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <footer className="mt-auto flex flex-col items-start gap-2 border-t pt-3 text-xs">
          {compte.connecte ? (
            <>
              <span className="max-w-full truncate font-mono text-[11px]" title={compte.adresse}>
                {compte.adresse}
              </span>
              <Button variant="link" className="h-auto p-0 text-xs" onClick={surCompte}>
                mon compte
              </Button>
            </>
          ) : (
            <>
              <span className="text-muted-foreground leading-snug">
                Aucun compte n'est nécessaire.
              </span>
              <Button variant="link" className="h-auto p-0 text-xs" onClick={surCompte}>
                se connecter
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -ml-2 h-auto gap-1.5 py-1 text-xs"
            onClick={basculer}
          >
            {sombre ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {sombre ? "Passer au clair" : "Passer au sombre"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -ml-2 h-auto gap-1.5 py-1 text-xs"
            onClick={rouvrir}
          >
            <MonitorSmartphone className="size-3.5" />
            Changer de parcours
          </Button>

          <Separator />

          <a
            href="https://github.com/StudioMiyukini/mip"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-primary no-underline"
          >
            Code source · MIT
          </a>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-2 gap-y-0.5">
            {LEGAL.map((entree) => (
              <a
                key={entree.chemin}
                href={`/${entree.chemin}`}
                onClick={(e) => surClicInterne(e, aller)}
                className={cn(
                  "text-[11px] no-underline hover:underline",
                  route === entree.chemin ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {entree.libelle}
              </a>
            ))}
          </nav>
        </footer>
      </aside>

      <main id="contenu" className="min-w-0 px-7 pt-6 pb-16">
        <div className="mx-auto max-w-[1500px]">{enfants}</div>
      </main>
    </div>
  );
}

function Lien({
  entree,
  actif,
  aller,
}: {
  entree: Entree;
  actif: boolean;
  aller: (chemin: string) => void;
}) {
  return (
    <a
      href={`/${entree.chemin}`}
      aria-current={actif ? "page" : undefined}
      onClick={(e) => surClicInterne(e, aller)}
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 text-sm no-underline transition-colors",
        actif
          ? "bg-accent text-accent-foreground font-semibold"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {entree.libelle}
      {entree.compte !== undefined && (
        <span className="bg-background text-muted-foreground rounded-full px-1.5 font-mono text-[11px]">
          {entree.compte}
        </span>
      )}
    </a>
  );
}
