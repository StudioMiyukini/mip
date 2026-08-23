// @id mip.web.hero
// @role ui
// @layer ui
// @human Le hero de la présentation : le titre, et le prompt qui s'écrit tout seul à côté
// @do accrocher_le_visiteur_en_lui_montrant_le_produit_a_l_oeuvre

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";

import { Badge } from "@/composants/ui/badge";
import { Button } from "@/composants/ui/button";
import { cn } from "@/lib/utils";

import { surClicInterne } from "./routeur";

interface Props {
  aller: (chemin: string) => void;
}

/**
 * Le hero.
 *
 * **Ce qui s'anime, c'est le produit — pas une décoration.** Un dégradé qui
 * pulse et trois mots qui se relaient font joli et n'apprennent rien. Ici le
 * mouvement montre exactement ce que l'outil fait : un cadrage qui s'écrit,
 * ligne à ligne, avec ses sections nommées. Quelqu'un qui arrive sans rien
 * savoir a compris avant d'avoir lu le paragraphe.
 *
 * Trois mouvements, et pas un de plus :
 *
 * - **l'entrée en scène**, décalée de cent millisecondes par bloc, qui donne un
 *   sens de lecture au lieu de tout jeter d'un coup ;
 * - **deux halos** qui dérivent derrière le titre, lentement et de faible
 *   amplitude — une animation de fond qu'on remarque est une animation ratée ;
 * - **le prompt qui se tape**, seul mouvement qui porte de l'information.
 *
 * **Le mouvement est une préférence.** `prefers-reduced-motion` coupe tout : la
 * feuille de style neutralise les animations, et le prompt s'affiche d'emblée
 * complet plutôt que de rester à moitié écrit. Une animation coupée ne doit
 * jamais retirer du contenu.
 */
export function Hero({ aller }: Props) {
  return (
    <header className="relative isolate overflow-hidden">
      <Halos />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-1 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        <div className="animate-monte text-center lg:text-left">
          <Badge variant="secondary" className="mb-5 font-mono text-[11px]">
            gratuit · sans inscription
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
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

        <div className="animate-monte" style={{ animationDelay: "200ms" }}>
          <PromptQuiSEcrit />
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

/** Une ligne du cadrage qui se tape, avec son allure. */
interface Ligne {
  texte: string;
  classe: string;
  /** Une pause avant la ligne, en millisecondes — pour respirer entre sections. */
  avant?: number;
}

const LIGNES: Ligne[] = [
  { texte: "# Cadrage MIP — Suivi de lectures", classe: "text-foreground font-semibold" },
  { texte: "", classe: "" },
  { texte: "## La demande", classe: "text-primary", avant: 260 },
  { texte: "Une appli pour noter ce que je lis et", classe: "text-muted-foreground" },
  { texte: "retrouver ce que j'en ai pensé.", classe: "text-muted-foreground" },
  { texte: "", classe: "" },
  { texte: "## Le protocole, en bref", classe: "text-primary", avant: 320 },
  { texte: "### P3 — Réalisation", classe: "text-foreground" },
  { texte: "**Gate P3** — chaque tâche passe ses", classe: "text-muted-foreground" },
  { texte: "vérifications avant la suivante.", classe: "text-muted-foreground" },
  { texte: "", classe: "" },
  { texte: "## Ce qui n'a pas été tranché", classe: "text-amber-500", avant: 320 },
  { texte: "- 2.4 — Échéance ou jalon externe ?", classe: "text-muted-foreground" },
  { texte: "", classe: "" },
  { texte: "## Ce qu'il faut faire maintenant", classe: "text-primary", avant: 320 },
  { texte: "1. Commence par la question sans", classe: "text-muted-foreground" },
  { texte: "   réponse. Ne devine pas.", classe: "text-muted-foreground" },
];

/**
 * Le rythme de frappe, en millisecondes par caractère.
 *
 * Réglé en regardant une capture prise à 1,6 s : à quatorze millisecondes et
 * après sept cents de délai, la carte n'affichait encore qu'une ligne et demie.
 * Quelqu'un qui arrive et scrute une seconde voyait une fenêtre vide — soit
 * l'inverse de ce que ce mouvement doit dire.
 */
const CADENCE = 9;

/** Le temps mort avant la première frappe. Assez pour que l'entrée en scène
 *  des blocs se termine, pas assez pour qu'on croie à un écran figé. */
const AVANT_DEPART = 320;

/**
 * Le prompt qui s'écrit.
 *
 * **Le texte est vrai.** Ce sont les sections que l'outil produit réellement,
 * dans leur ordre réel, y compris « ce qui n'a pas été tranché » — la section
 * qu'on serait tenté de retirer d'une démonstration parce qu'elle montre un
 * trou. C'est justement ce qu'il faut montrer : elle est la promesse du produit.
 *
 * La boucle avance caractère par caractère avec `setTimeout` plutôt que par une
 * animation CSS de largeur : le retour à la ligne d'un texte en largeur animée
 * saute, et le curseur se retrouve au mauvais endroit.
 */
function PromptQuiSEcrit() {
  const complet = LIGNES.map((l) => l.texte).join("\n").length;
  const [ecrits, setEcrits] = useState(0);
  const [copie, setCopie] = useState(false);
  const minuterie = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Mouvement réduit : le texte est là, entier, tout de suite. Couper une
    // animation ne doit jamais couper du contenu.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setEcrits(complet);
      return;
    }

    let position = 0;
    const suivant = () => {
      position += 1;
      setEcrits(position);
      if (position >= complet) return;
      // Une pause en fin de ligne, plus longue avant un titre de section : sans
      // elle, le texte se déroule comme un ruban et l'œil ne s'accroche à rien.
      const pause = pauseApres(position);
      minuterie.current = window.setTimeout(suivant, CADENCE + pause);
    };
    minuterie.current = window.setTimeout(suivant, AVANT_DEPART);
    return () => window.clearTimeout(minuterie.current);
  }, [complet]);

  const fini = ecrits >= complet;

  return (
    <div className="bg-card/80 relative rounded-xl border shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="text-muted-foreground ml-1 font-mono text-[11px]">
          cadrage-mip.md
        </span>
        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 font-mono text-[11px] transition-opacity",
            fini ? "text-primary opacity-100" : "text-muted-foreground opacity-70",
          )}
        >
          {fini ? (
            <>
              <Check className="size-3" />
              prêt
            </>
          ) : (
            <>
              <Copy className="size-3" />
              en cours
            </>
          )}
        </span>
      </div>

      {/* La hauteur est figée : sans elle, la carte grandit à chaque ligne et
          pousse tout le bas de la page pendant plusieurs secondes. */}
      <pre
        className="h-[19rem] overflow-hidden p-4 font-mono text-[12px] leading-[1.55] sm:h-[21rem] sm:text-[13px]"
        aria-label="Un exemple de cadrage produit par MIP Studio"
      >
        {rendre(ecrits).map((ligne, index) => (
          <span key={index} className={cn("block", ligne.classe)}>
            {ligne.texte || " "}
            {ligne.derniere && !fini && (
              <span className="bg-primary animate-curseur ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em]" />
            )}
          </span>
        ))}
      </pre>

      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(LIGNES.map((l) => l.texte).join("\n"));
          setCopie(true);
          window.setTimeout(() => setCopie(false), 2000);
        }}
        className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 border-t py-2 text-xs transition-colors"
      >
        {copie ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copie ? "Copié" : "Un extrait — le vôtre fait dix fois ça"}
      </button>
    </div>
  );
}

/** La pause à ajouter après le caractère `n`, selon ce qui vient ensuite. */
function pauseApres(n: number): number {
  let parcouru = 0;
  for (let index = 0; index < LIGNES.length; index += 1) {
    parcouru += LIGNES[index].texte.length + 1;
    if (n === parcouru) return LIGNES[index + 1]?.avant ?? 90;
  }
  return 0;
}

/** Les lignes telles qu'elles doivent s'afficher à `n` caractères tapés. */
function rendre(n: number): Array<{ texte: string; classe: string; derniere: boolean }> {
  const sorties: Array<{ texte: string; classe: string; derniere: boolean }> = [];
  let reste = n;
  for (const ligne of LIGNES) {
    if (reste <= 0) break;
    const morceau = ligne.texte.slice(0, reste);
    sorties.push({ texte: morceau, classe: ligne.classe, derniere: false });
    reste -= ligne.texte.length + 1; // +1 pour le retour à la ligne
  }
  if (sorties.length) sorties[sorties.length - 1].derniere = true;
  return sorties;
}
