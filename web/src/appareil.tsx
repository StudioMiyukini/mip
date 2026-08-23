// @id mip.web.appareil
// @role orchestration
// @layer ui
// @human La gate d'appareil : PC ou mobile, choisi une fois puis mémorisé
// @do choisir_et_memoriser_le_parcours_pc_ou_mobile

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Appareil = "pc" | "mobile";

const CLE = "mip.appareil";
/** Au-dessous, le tableau de bord à deux colonnes ne tient plus. */
const SEUIL = 900;

interface Contexte {
  appareil: Appareil;
  /** Ce que l'écran suggère — sert à pré-cocher la gate, jamais à décider seul. */
  detecte: Appareil;
  choisir: (appareil: Appareil) => void;
  /** Rouvre la gate. Accessible depuis les deux coques. */
  rouvrir: () => void;
}

const ContexteAppareil = createContext<Contexte | null>(null);

/**
 * Ce que l'écran laisse penser.
 *
 * **La largeur seule décide, et le pointeur ne sert qu'à départager.** Un
 * premier jet exigeait « étroit *et* tactile » — mais ses deux branches
 * rendaient « mobile » de toute façon, et le signal tactile ne servait à rien.
 *
 * La règle tenable est plus simple : sous le seuil, la vue à deux colonnes ne
 * tient pas, quel que soit l'appareil. Au-dessus, elle tient — y compris sur
 * une tablette en paysage, où le doigt n'empêche rien. Le pointeur grossier ne
 * pèse donc que dans la bande de tolérance juste au-dessus du seuil, là où
 * l'espace suffit tout juste et où viser une pastille au doigt ne suffit plus.
 */
export function detecter(): Appareil {
  if (typeof window === "undefined") return "pc";
  const largeur = window.innerWidth;
  if (largeur < SEUIL) return "mobile";
  const tactile = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return tactile && largeur < SEUIL + 180 ? "mobile" : "pc";
}

function lire(): Appareil | null {
  try {
    const garde = window.localStorage.getItem(CLE);
    return garde === "pc" || garde === "mobile" ? garde : null;
  } catch {
    // Navigation privée, stockage refusé : la gate se reposera. C'est une gêne,
    // pas une panne, et c'est préférable à un plantage au chargement.
    return null;
  }
}

/**
 * Le choix d'appareil, tenu pour toute l'application.
 *
 * **Un choix, pas une détection.** On aurait pu se contenter de la largeur, et
 * c'est ce que fait une mise en page adaptative ordinaire. Mais les deux
 * parcours ne se contentent pas de se réagencer : ils **posent les questions
 * autrement** — tout à l'écran d'un côté, une section à la fois de l'autre.
 * Imposer l'un des deux sur la foi d'une mesure de pixels, c'est décider à la
 * place de quelqu'un ce qu'il préfère.
 *
 * La détection reste : elle pré-coche la bonne réponse. C'est le compromis
 * exact — l'outil propose, la personne tranche, et le choix est mémorisé pour
 * qu'on ne le lui redemande pas.
 */
export function FournisseurAppareil({ children }: { children: React.ReactNode }) {
  const [detecte, setDetecte] = useState<Appareil>(detecter);
  const [appareil, setAppareil] = useState<Appareil | null>(lire);

  // La fenêtre peut changer de taille — on passe d'un écran externe au portable,
  // on tourne une tablette. La suggestion suit ; le choix, lui, ne bouge pas.
  useEffect(() => {
    const surMesure = () => setDetecte(detecter());
    window.addEventListener("resize", surMesure);
    return () => window.removeEventListener("resize", surMesure);
  }, []);

  const choisir = useCallback((choix: Appareil) => {
    setAppareil(choix);
    try {
      window.localStorage.setItem(CLE, choix);
    } catch {
      /* le choix vaudra pour cette visite seulement */
    }
  }, []);

  const rouvrir = useCallback(() => {
    setAppareil(null);
    try {
      window.localStorage.removeItem(CLE);
    } catch {
      /* rien à retirer */
    }
  }, []);

  return (
    <ContexteAppareil.Provider
      value={{ appareil: appareil ?? detecte, detecte, choisir, rouvrir }}
    >
      {appareil === null ? <PorteAppareil detecte={detecte} choisir={choisir} /> : children}
    </ContexteAppareil.Provider>
  );
}

export function useAppareil(): Contexte {
  const contexte = useContext(ContexteAppareil);
  if (!contexte) throw new Error("useAppareil hors de FournisseurAppareil");
  return contexte;
}

/**
 * L'écran de choix.
 *
 * **Il ne s'affiche qu'une fois**, et il dit ce que chaque parcours change —
 * pas « PC » et « Mobile », qui laisseraient croire à une simple question de
 * taille. Ce qui change, c'est la façon de poser les questions.
 */
function PorteAppareil({
  detecte,
  choisir,
}: {
  detecte: Appareil;
  choisir: (appareil: Appareil) => void;
}) {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center p-5">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase">
            MIP Studio
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Comment préférez-vous remplir ?
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed">
            Deux parcours, le même cadrage au bout. Vous pourrez changer d'avis à tout
            moment.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Carte
            titre="Sur grand écran"
            resume="Tout le formulaire à l'écran, et le prompt qui se construit à côté, en direct."
            points={["Le formulaire entier", "Aperçu du prompt en vis-à-vis", "Barre latérale de navigation"]}
            suggere={detecte === "pc"}
            surChoix={() => choisir("pc")}
          />
          <Carte
            titre="Sur téléphone"
            resume="Une section à la fois, avec l'avancement en tête et le prompt dans un tiroir."
            points={["Une section par écran", "Prompt dans un tiroir", "Navigation en bas de page"]}
            suggere={detecte === "mobile"}
            surChoix={() => choisir("mobile")}
          />
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Votre écran suggère « {detecte === "pc" ? "grand écran" : "téléphone"} ».
          Rien ne vous y oblige.
        </p>
      </div>
    </main>
  );
}

function Carte({
  titre,
  resume,
  points,
  suggere,
  surChoix,
}: {
  titre: string;
  resume: string;
  points: string[];
  suggere: boolean;
  surChoix: () => void;
}) {
  return (
    <button
      type="button"
      onClick={surChoix}
      className={[
        "group bg-card relative flex flex-col gap-3 rounded-xl border p-5 text-left transition-all",
        "hover:border-primary/60 hover:shadow-lg focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:outline-none",
        suggere ? "border-primary/70 ring-primary/15 ring-2" : "",
      ].join(" ")}
    >
      {suggere && (
        <span className="bg-primary text-primary-foreground absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          détecté
        </span>
      )}
      <span className="text-base font-semibold">{titre}</span>
      <span className="text-muted-foreground text-sm leading-relaxed">{resume}</span>
      <ul className="mt-1 space-y-1.5">
        {points.map((point) => (
          <li key={point} className="text-muted-foreground flex gap-2 text-xs">
            <span className="bg-primary/60 mt-1.5 size-1 shrink-0 rounded-full" />
            {point}
          </li>
        ))}
      </ul>
      <span className="text-primary mt-2 text-sm font-medium">Continuer →</span>
    </button>
  );
}
