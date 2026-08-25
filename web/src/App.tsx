// @id mip.web
// @role ui
// @layer ui
// @human L'assemblage : la porte, la gate d'appareil, le compte, le routeur et les coques
// @do assembler_les_pages_dans_la_coque_du_parcours_choisi

import { useEffect, useState } from "react";

import { Skeleton } from "@/composants/ui/skeleton";
import { TooltipProvider } from "@/composants/ui/tooltip";

import { Accueil } from "./Accueil";
import { useAppareil } from "./appareil";
import { Cadrage } from "./Cadrage";
import { CadrageMobile } from "./CadrageMobile";
import { Compte, type EtatCompte } from "./Compte";
import { Coque } from "./Coque";
import { CoqueMobile } from "./CoqueMobile";
import { Document } from "./Document";
import { MesCadrages } from "./MesCadrages";
import { Porte } from "./Porte";
import { useRoute } from "./routeur";
import type { Formulaire } from "./types";

/** Les pages qui sont un document Markdown du dépôt, servi par l'API. */
const DOCUMENTS = new Set([
  "documentation",
  "guide",
  "exemples",
  "faq",
  "protocole",
  "questions",
  "prompt",
  "mscm",
  "developpement",
  "confidentialite",
  "registre",
  "mentions",
  "cgu",
  "licence",
  "apropos",
]);

export function App() {
  const [route, aller] = useRoute();
  const { appareil } = useAppareil();
  const [formulaire, setFormulaire] = useState<Formulaire | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [compteEtat, setCompteEtat] = useState<EtatCompte>({ connecte: false });
  const [mesCadrages, setMesCadrages] = useState(0);
  const [fenetreCompte, setFenetreCompte] = useState(false);
  // `null` tant qu'on ne sait pas : afficher la page puis la remplacer par un
  // écran de mot de passe ferait clignoter le chargement.
  const [ouverte, setOuverte] = useState<boolean | null>(null);

  function relireLeCompte(): void {
    fetch("/api/compte")
      .then((r) => r.json())
      .then((d: EtatCompte) => setCompteEtat(d))
      .catch(() => setCompteEtat({ connecte: false }));
  }

  function relireLesCadrages(): void {
    fetch("/api/cadrages")
      .then((r) => r.json())
      .then((d: { cadrages: unknown[] }) => setMesCadrages(d.cadrages?.length ?? 0))
      .catch(() => setMesCadrages(0));
  }

  useEffect(() => {
    fetch("/api/porte")
      .then((r) => r.json())
      .then((d: { ouverte: boolean }) => setOuverte(d.ouverte))
      .catch(() => setOuverte(true));
  }, []);

  useEffect(() => {
    if (ouverte !== true) return;
    relireLeCompte();
    relireLesCadrages();
    // Le protocole part en une requête, une fois. Il ne change qu'à une
    // ré-ingestion et il sert à trois pages — le recharger par page ferait trois
    // allers-retours pour la même chose.
    fetch("/api/formulaire")
      .then(async (r) => {
        if (r.ok) return r.json();
        // Le serveur dit *pourquoi* : on relaie son message plutôt que le code
        // HTTP, qui n'apprend rien à qui lit l'écran.
        const dit = await r.json().catch(() => ({}));
        throw new Error(dit.message ?? `formulaire : ${r.status}`);
      })
      .then(setFormulaire)
      .catch((e) => setErreur(e instanceof Error ? e.message : String(e)));
  }, [ouverte]);

  useEffect(() => {
    if (compteEtat.connecte) relireLesCadrages();
    else setMesCadrages(0);
  }, [compteEtat.connecte]);

  if (ouverte === null) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </main>
    );
  }
  if (ouverte === false) return <Porte surOuverture={() => setOuverte(true)} />;

  const scene = (
    <Scene
      route={route}
      aller={aller}
      formulaire={formulaire}
      erreur={erreur}
      mobile={appareil === "mobile"}
      connecte={compteEtat.connecte}
      surConnexion={() => setFenetreCompte(true)}
      surChangement={relireLesCadrages}
    />
  );

  // **Deux coques, un seul jeu de props.** Le parcours change la mise en page et
  // la façon de poser les questions ; il ne change ni les données, ni les
  // droits, ni les routes.
  const CoqueChoisie = appareil === "mobile" ? CoqueMobile : Coque;

  return (
    <TooltipProvider delayDuration={300}>
      <CoqueChoisie
        route={route}
        aller={aller}
        compte={compteEtat}
        mesCadrages={mesCadrages}
        surCompte={() => setFenetreCompte(true)}
        enfants={scene}
      />
      {fenetreCompte && (
        <Compte
          etat={compteEtat}
          surFermeture={() => setFenetreCompte(false)}
          surChangement={() => {
            relireLeCompte();
            relireLesCadrages();
          }}
        />
      )}
    </TooltipProvider>
  );
}

/** Ce qu'on affiche, selon le chemin. */
function Scene({
  route,
  aller,
  formulaire,
  erreur,
  mobile,
  connecte,
  surConnexion,
  surChangement,
}: {
  route: string;
  aller: (chemin: string) => void;
  formulaire: Formulaire | null;
  erreur: string | null;
  mobile: boolean;
  connecte: boolean;
  surConnexion: () => void;
  surChangement: () => void;
}) {
  // Une page de documentation n'a besoin ni du protocole ni du compte : elle se
  // sert avant tout le reste, et reste lisible si la base est tombée.
  if (DOCUMENTS.has(route)) return <Document nom={route} />;

  if (erreur) {
    return (
      <div className="border-destructive/40 bg-destructive/5 mx-auto max-w-2xl space-y-2 rounded-lg border p-5">
        <strong>Le serveur ne répond pas.</strong>
        <p className="text-sm">{erreur}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Vérifier que la base est montée (<code className="font-mono">npm run bd:monter</code>),
          que le schéma est posé (<code className="font-mono">npm run bd:schema</code>) et que
          le pack a été ingéré (<code className="font-mono">npm run ingerer</code>).
        </p>
      </div>
    );
  }

  if (route === "cadrages") {
    return (
      <MesCadrages
        connecte={connecte}
        aller={aller}
        surConnexion={surConnexion}
        surChangement={surChangement}
      />
    );
  }

  if (route === "cadrage") {
    if (!formulaire) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }
    const Parcours = mobile ? CadrageMobile : Cadrage;
    return (
      <Parcours formulaire={formulaire} connecte={connecte} surEnregistrement={surChangement} />
    );
  }

  // Tout le reste mène à la présentation : pour un site de cette taille, une
  // adresse fautive vaut mieux qu'une page d'erreur.
  return <Accueil formulaire={formulaire} aller={aller} />;
}
