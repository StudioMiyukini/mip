// @id mip.web.hero
// @role ui
// @layer ui
// @human Le hero : le titre, et un vrai cadrage qui s'écrit dans un éditeur
// @do accrocher_le_visiteur_en_lui_montrant_un_cadrage_reel_qui_s_ecrit

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy, FileText } from "lucide-react";

import { Badge } from "@/composants/ui/badge";
import { Button } from "@/composants/ui/button";
import { cn } from "@/lib/utils";

import { Editeur } from "./Editeur";
import { surClicInterne } from "./routeur";
import { useTheme } from "./theme";

interface Props {
  aller: (chemin: string) => void;
}

/**
 * Le hero.
 *
 * **Ce qui s'anime, c'est le produit — pas une décoration.** Un dégradé qui
 * pulse et trois mots qui se relaient font joli et n'apprennent rien. Ici le
 * mouvement montre exactement ce que l'outil fait : un cadrage qui s'écrit,
 * ligne à ligne, dans un éditeur. Quelqu'un qui arrive sans rien savoir a
 * compris avant d'avoir lu le paragraphe.
 *
 * Trois mouvements, et pas un de plus :
 *
 * - **l'entrée en scène**, décalée de quatre-vingts millisecondes par bloc, qui
 *   donne un sens de lecture au lieu de tout jeter d'un coup ;
 * - **deux halos** qui dérivent derrière le titre, lentement et de faible
 *   amplitude — une animation de fond qu'on remarque est une animation ratée ;
 * - **la frappe**, seul mouvement qui porte de l'information.
 *
 * **Le mouvement est une préférence.** `prefers-reduced-motion` coupe tout : la
 * feuille de style neutralise les animations, et le cadrage s'affiche d'emblée
 * complet plutôt que de rester à moitié écrit. Une animation coupée ne doit
 * jamais retirer du contenu.
 */
export function Hero({ aller }: Props) {
  return (
    <header className="relative isolate overflow-hidden">
      <Halos />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-1 py-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:py-16">
        <div className="animate-monte text-center lg:text-left">
          <Badge variant="secondary" className="mb-5 font-mono text-[11px]">
            gratuit · sans inscription
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
            Bien guidée, votre IA{" "}
            {/* Le dégradé ne porte que trois mots : appliqué au titre entier, il
                devient une texture et cesse d'être une emphase. */}
            <span className="from-primary bg-gradient-to-r via-violet-400 to-sky-400 bg-clip-text text-transparent">
              va beaucoup plus loin
            </span>
            .
          </h1>

          <p
            className="text-muted-foreground animate-monte mt-3 text-xl sm:text-2xl"
            style={{ animationDelay: "80ms" }}
          >
            Le même modèle. Dix minutes de cadrage.
          </p>

          <p
            className="text-muted-foreground animate-monte mx-auto mt-6 max-w-xl leading-relaxed text-pretty lg:mx-0"
            style={{ animationDelay: "160ms" }}
          >
            Une IA travaille avec ce qu'on lui donne. Plus elle sait pour qui c'est, jusqu'où
            aller et ce qui compte le plus, plus elle vise juste — et ces réponses-là, c'est
            vous qui les avez.
          </p>

          <div
            className="animate-monte mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
            style={{ animationDelay: "240ms" }}
          >
            <Button size="lg" asChild>
              <a href="/cadrage" onClick={(e) => surClicInterne(e, aller)}>
                Commencer un cadrage
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/exemples" onClick={(e) => surClicInterne(e, aller)}>
                Voir un exemple
              </a>
            </Button>
          </div>

          <p
            className="text-muted-foreground animate-monte mt-5 text-sm"
            style={{ animationDelay: "320ms" }}
          >
            Quatre questions suffisent pour repartir avec quelque chose d'utilisable.
          </p>
        </div>

        <div className="animate-monte min-w-0" style={{ animationDelay: "200ms" }}>
          <CadrageQuiSEcrit aller={aller} />
        </div>
      </div>
    </header>
  );
}

/**
 * Deux halos derrière le titre.
 *
 * `aria-hidden` et `pointer-events-none` : c'est de la lumière, pas du contenu.
 * Un lecteur d'écran n'a rien à y annoncer, et le curseur rien à y attraper.
 */
function Halos() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="bg-primary/20 animate-aurore absolute -top-32 -left-24 size-[28rem] rounded-full blur-[110px]" />
      <div
        className="animate-aurore absolute -top-16 right-0 size-[24rem] rounded-full bg-sky-400/15 blur-[110px]"
        style={{ animationDelay: "-9s" }}
      />
    </div>
  );
}

/**
 * Le repli, si l'API ne répond pas.
 *
 * **Court, et vrai quand même** : ce sont les sections que l'assembleur produit,
 * dans leur ordre réel. Il ne sert qu'au cas où — la fenêtre ne doit jamais
 * rester vide, même quand la base est tombée.
 */
const REPLI = `# Cadrage MIP — Suivi de lectures

## La demande

Une petite application pour noter ce que je lis et
retrouver ce que j'en ai pensé, six mois plus tard.

## Le protocole, en bref

### P3 — Réalisation

**Gate P3** — Chaque tâche passe ses vérifications
avant que la suivante commence.

## Ce qui n'a pas été tranché

- 2.4 — Échéance ou jalon externe ?

## Ce qu'il faut faire maintenant

1. **Commence par la question sans réponse.**
   Ne devine pas.`;

/** Combien de lignes du cadrage réel la fenêtre montre. */
const LIGNES_MONTREES = 26;

/**
 * Le rythme de frappe, en millisecondes par caractère.
 *
 * Réglé en regardant une capture prise à 1,6 s : à quatorze millisecondes, la
 * fenêtre n'affichait encore qu'une ligne et demie. Quelqu'un qui s'arrête une
 * seconde voyait un écran vide — l'inverse de ce que ce mouvement doit dire.
 */
const CADENCE = 6;

/** Le temps mort avant la première frappe : assez pour que l'entrée en scène
 *  se termine, pas assez pour qu'on croie à un écran figé. */
const AVANT_DEPART = 320;

/**
 * Un vrai cadrage, qui s'écrit.
 *
 * **Le texte vient de l'API, pas d'une constante.** `/api/exemple` assemble un
 * cadrage de démonstration avec le protocole réellement en base : si le
 * protocole gagne une section, la page d'accueil la montre le jour même. Un
 * extrait recopié à la main cesse d'être vrai à la première évolution de
 * l'assembleur — c'est exactement ce qui est arrivé à `docs/exemples.md`, qui
 * est engendré depuis.
 *
 * On n'en tape que les premières lignes : le prompt complet fait deux mille
 * jetons, soit une minute de frappe. Le pied de la fenêtre dit la taille réelle
 * et mène à l'exemple entier — montrer un extrait sans dire que c'en est un
 * serait le seul vrai mensonge possible ici.
 */
function CadrageQuiSEcrit({ aller }: { aller: (chemin: string) => void }) {
  const { sombre } = useTheme();
  const [complet, setComplet] = useState(REPLI);
  const [jetons, setJetons] = useState<number | null>(null);
  const [ecrits, setEcrits] = useState(0);
  const [copie, setCopie] = useState(false);
  const minuterie = useRef<number | undefined>(undefined);

  useEffect(() => {
    fetch("/api/exemple")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("indisponible"))))
      .then((d: { prompt: string }) => {
        setJetons(Math.round(d.prompt.length / 4));
        setComplet(d.prompt.split("\n").slice(0, LIGNES_MONTREES).join("\n").trimEnd());
      })
      .catch(() => {
        /* le repli est déjà en place */
      });
  }, []);

  useEffect(() => {
    window.clearTimeout(minuterie.current);

    // Mouvement réduit : le texte est là, entier, tout de suite. Couper une
    // animation ne doit jamais couper du contenu.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setEcrits(complet.length);
      return;
    }

    let position = 0;
    setEcrits(0);
    const suivant = () => {
      position += 1;
      setEcrits(position);
      if (position < complet.length) {
        minuterie.current = window.setTimeout(suivant, CADENCE);
      }
    };
    minuterie.current = window.setTimeout(suivant, AVANT_DEPART);
    return () => window.clearTimeout(minuterie.current);
  }, [complet]);

  const fini = ecrits >= complet.length;

  return (
    <div className="bg-card/80 overflow-hidden rounded-xl border shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="text-muted-foreground ml-1 font-mono text-[11px]">cadrage-mip.md</span>
        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 font-mono text-[11px] transition-opacity",
            fini ? "text-primary" : "text-muted-foreground opacity-70",
          )}
        >
          {fini ? <Check className="size-3" /> : <FileText className="size-3" />}
          {fini ? "prêt" : "en cours"}
        </span>
      </div>

      {/* La hauteur est figée : sans elle, la fenêtre grandit à chaque ligne et
          pousse tout le bas de la page pendant plusieurs secondes. */}
      <div className="h-[21rem] overflow-hidden sm:h-[23rem]">
        <Editeur texte={complet.slice(0, ecrits)} sombre={sombre} />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2 text-xs">
        <span>
          Extrait
          {jetons !== null && <> — ce cadrage fait ≈ {jetons.toLocaleString("fr-FR")} jetons</>}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(complet);
            setCopie(true);
            window.setTimeout(() => setCopie(false), 2000);
          }}
          className="hover:text-foreground ml-auto flex items-center gap-1.5 transition-colors"
        >
          {copie ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copie ? "Copié" : "Copier"}
        </button>
        <a
          href="/exemples"
          onClick={(e) => surClicInterne(e, aller)}
          className="text-primary no-underline hover:underline"
        >
          en entier →
        </a>
      </div>
    </div>
  );
}
