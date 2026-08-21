// @id mip.web
// @role ui
// @layer ui
// @human L'assemblage : la porte, le compte, le routeur et la coque
// @do assembler_les_pages_dans_la_coque_et_router_entre_elles

import { useEffect, useState } from "react";

import { Accueil } from "./Accueil";
import { Cadrage } from "./Cadrage";
import { Compte, type EtatCompte } from "./Compte";
import { Coque } from "./Coque";
import { Document } from "./Document";
import { MesCadrages } from "./MesCadrages";
import { Porte } from "./Porte";
import { useRoute } from "./routeur";
import type { Formulaire } from "./types";

/** Les pages qui sont un document Markdown du dépôt, servi par l'API. */
const DOCUMENTS = new Set([
  "guide",
  "protocole",
  "developpement",
  "confidentialite",
  "licence",
  "apropos",
  "documentation",
]);

export function App() {
  const [route, aller] = useRoute();
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
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`formulaire : ${r.status}`))))
      .then(setFormulaire)
      .catch((e) => setErreur(String(e)));
  }, [ouverte]);

  useEffect(() => {
    if (compteEtat.connecte) relireLesCadrages();
    else setMesCadrages(0);
  }, [compteEtat.connecte]);

  if (ouverte === null) {
    return (
      <main className="page">
        <p className="explication">…</p>
      </main>
    );
  }
  if (ouverte === false) return <Porte surOuverture={() => setOuverte(true)} />;

  return (
    <>
      <Coque
        route={route}
        aller={aller}
        compte={compteEtat}
        mesCadrages={mesCadrages}
        surCompte={() => setFenetreCompte(true)}
        enfants={
          <Scene
            route={route}
            aller={aller}
            formulaire={formulaire}
            erreur={erreur}
            connecte={compteEtat.connecte}
            surConnexion={() => setFenetreCompte(true)}
            surChangement={relireLesCadrages}
          />
        }
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
    </>
  );
}

/** Ce qu'on affiche, selon le chemin. */
function Scene({
  route,
  aller,
  formulaire,
  erreur,
  connecte,
  surConnexion,
  surChangement,
}: {
  route: string;
  aller: (chemin: string) => void;
  formulaire: Formulaire | null;
  erreur: string | null;
  connecte: boolean;
  surConnexion: () => void;
  surChangement: () => void;
}) {
  // Une page de documentation n'a besoin ni du protocole ni du compte : elle se
  // sert avant tout le reste, et reste lisible si la base est tombée.
  if (DOCUMENTS.has(route)) return <Document nom={route} />;

  if (erreur) {
    return (
      <div className="alerte">
        <strong>Le serveur ne répond pas.</strong>
        <p>{erreur}</p>
        <p className="explication">
          Vérifier que la base est montée (<code>npm run bd:monter</code>), que le schéma
          est posé (<code>npm run bd:schema</code>) et que le pack a été ingéré (
          <code>npm run ingerer</code>).
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
    if (!formulaire) return <p className="explication">Chargement du protocole…</p>;
    return <Cadrage formulaire={formulaire} connecte={connecte} surEnregistrement={surChangement} />;
  }

  // Tout le reste mène à la présentation : pour un site de six pages, une
  // adresse fautive vaut mieux qu'une page d'erreur.
  return <Accueil formulaire={formulaire} aller={aller} />;
}
