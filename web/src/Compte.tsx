// @id mip.web.compte
// @role ui
// @layer ui
// @human Le compte : s'inscrire pour sauvegarder, et pouvoir tout effacer
// @do gerer_l_inscription_la_connexion_et_l_effacement_du_compte

import { useState } from "react";

export interface EtatCompte {
  connecte: boolean;
  adresse?: string;
}

/**
 * Le bandeau de compte, en haut à droite.
 *
 * **Il ne barre jamais la route.** Le formulaire fonctionne sans compte, et
 * c'est le critère de sortie du produit : un néophyte arrive et repart en dix
 * minutes avec un prompt. Demander une adresse avant de commencer échangerait
 * la seule chose qui compte contre une ligne dans une table.
 *
 * Le compte apparaît donc comme une offre — *pour retrouver vos cadrages* — et
 * jamais comme une porte.
 */
export function Compte({
  etat,
  surChangement,
}: {
  etat: EtatCompte;
  surChangement: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);

  if (etat.connecte) {
    return (
      <div className="compte">
        <span className="compte-adresse">{etat.adresse}</span>
        <button
          type="button"
          className="lien"
          onClick={() => setOuvert(true)}
          title="Vos données et la suppression du compte"
        >
          mon compte
        </button>
        {ouvert && <Reglages etat={etat} surFermeture={() => setOuvert(false)} surChangement={surChangement} />}
      </div>
    );
  }

  return (
    <div className="compte">
      <span className="compte-offre">Créez un compte pour retrouver vos cadrages</span>
      <button type="button" className="lien" onClick={() => setOuvert(true)}>
        se connecter
      </button>
      {ouvert && <Identification surFermeture={() => setOuvert(false)} surChangement={surChangement} />}
    </div>
  );
}

/** S'inscrire ou se connecter — le même formulaire, deux boutons. */
function Identification({
  surFermeture,
  surChangement,
}: {
  surFermeture: () => void;
  surChangement: () => void;
}) {
  const [adresse, setAdresse] = useState("");
  const [mot, setMot] = useState("");
  const [refus, setRefus] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(chemin: "creer" | "entrer"): Promise<void> {
    setEnCours(true);
    setRefus(null);
    try {
      const reponse = await fetch(`/api/compte/${chemin}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adresse, mot_de_passe: mot }),
      });
      if (reponse.ok) {
        surChangement();
        surFermeture();
        return;
      }
      setRefus((await reponse.json().catch(() => ({}))).message ?? "Refusé.");
    } catch (erreur) {
      setRefus(String(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Fenetre titre="Votre compte" surFermeture={surFermeture}>
      <p className="explication">
        Un compte sert à retrouver vos cadrages. Il n'est jamais nécessaire pour utiliser
        l'outil.
      </p>
      <input
        className="controle"
        type="email"
        value={adresse}
        onChange={(e) => setAdresse(e.target.value)}
        placeholder="adresse électronique"
        autoComplete="email"
        autoFocus
      />
      <input
        className="controle"
        type="password"
        value={mot}
        onChange={(e) => setMot(e.target.value)}
        placeholder="mot de passe — huit caractères au minimum"
        autoComplete="current-password"
      />
      <div className="boutons">
        <button type="button" className="principal" disabled={enCours} onClick={() => envoyer("entrer")}>
          Se connecter
        </button>
        <button type="button" disabled={enCours} onClick={() => envoyer("creer")}>
          Créer un compte
        </button>
      </div>
      {refus && <p className="refus">{refus}</p>}
      <p className="note">
        Nous gardons votre adresse et une empreinte de votre mot de passe. Rien d'autre —{" "}
        <a href="/confidentialite" target="_blank" rel="noreferrer">
          voir le détail
        </a>
        .
      </p>
    </Fenetre>
  );
}

/** Ses données, et le bouton qui efface tout. */
function Reglages({
  etat,
  surFermeture,
  surChangement,
}: {
  etat: EtatCompte;
  surFermeture: () => void;
  surChangement: () => void;
}) {
  const [mot, setMot] = useState("");
  const [refus, setRefus] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);

  async function emporter(): Promise<void> {
    const reponse = await fetch("/api/compte/donnees");
    const donnees = await reponse.json();
    // Un fichier, pas un affichage : ces données doivent pouvoir partir
    // ailleurs, c'est tout l'objet de la portabilité.
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(
      new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" }),
    );
    lien.download = "mip-studio-mes-donnees.json";
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  async function supprimer(): Promise<void> {
    setRefus(null);
    const reponse = await fetch("/api/compte/supprimer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mot_de_passe: mot }),
    });
    if (reponse.ok) {
      surChangement();
      surFermeture();
      return;
    }
    setRefus((await reponse.json().catch(() => ({}))).message ?? "Refusé.");
  }

  async function sortir(): Promise<void> {
    await fetch("/api/compte/sortir", { method: "POST" });
    surChangement();
    surFermeture();
  }

  return (
    <Fenetre titre="Mon compte" surFermeture={surFermeture}>
      <p className="explication">{etat.adresse}</p>

      <div className="boutons">
        <button type="button" onClick={emporter}>
          Emporter mes données
        </button>
        <button type="button" onClick={sortir}>
          Se déconnecter
        </button>
      </div>

      <hr className="separateur" />

      {!confirme ? (
        <button type="button" className="danger" onClick={() => setConfirme(true)}>
          Supprimer mon compte
        </button>
      ) : (
        <>
          <p className="explication">
            <strong>La suppression est immédiate et définitive.</strong> Elle efface le compte
            et tous les cadrages qui y sont rattachés. Il n'y a ni corbeille, ni délai, ni
            restauration possible.
          </p>
          <input
            className="controle"
            type="password"
            value={mot}
            onChange={(e) => setMot(e.target.value)}
            placeholder="votre mot de passe, pour confirmer"
            autoComplete="current-password"
            autoFocus
          />
          <div className="boutons">
            <button type="button" className="danger" disabled={!mot} onClick={supprimer}>
              Tout supprimer
            </button>
            <button type="button" onClick={() => setConfirme(false)}>
              Annuler
            </button>
          </div>
        </>
      )}
      {refus && <p className="refus">{refus}</p>}
    </Fenetre>
  );
}

function Fenetre({
  titre,
  surFermeture,
  children,
}: {
  titre: string;
  surFermeture: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="voile" onClick={surFermeture}>
      <div className="fenetre" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={titre}>
        <header className="bloc-tete">
          <h3>{titre}</h3>
          <button type="button" className="lien" onClick={surFermeture}>
            fermer
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
