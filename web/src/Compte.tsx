// @id mip.web.compte
// @role ui
// @layer ui
// @human Le compte : s'inscrire, corriger son adresse, tout emporter, tout effacer
// @do gerer_l_inscription_la_connexion_la_rectification_et_l_effacement_du_compte

import { useState } from "react";

export interface EtatCompte {
  connecte: boolean;
  adresse?: string;
}

/**
 * La fenêtre de compte : s'identifier, ou gérer ce qu'on a.
 *
 * **Elle ne barre jamais la route.** Le formulaire fonctionne sans compte, et
 * c'est le critère de sortie du produit : un néophyte arrive et repart en dix
 * minutes avec un prompt. Demander une adresse avant de commencer échangerait la
 * seule chose qui compte contre une ligne dans une table.
 *
 * La coque décide quand l'ouvrir ; le compte ne s'invite pas de lui-même.
 */
export function Compte({
  etat,
  surFermeture,
  surChangement,
}: {
  etat: EtatCompte;
  surFermeture: () => void;
  surChangement: () => void;
}) {
  return etat.connecte ? (
    <Reglages etat={etat} surFermeture={surFermeture} surChangement={surChangement} />
  ) : (
    <Identification surFermeture={surFermeture} surChangement={surChangement} />
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
  // La rectification est repliée par défaut : c'est un droit, pas une tâche
  // courante. Dépliée, elle prendrait toute la place devant « emporter » et
  // « supprimer », qu'on vient chercher bien plus souvent.
  const [rectifie, setRectifie] = useState(false);
  const [nouvelle, setNouvelle] = useState("");
  const [dit, setDit] = useState<string | null>(null);

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

  /**
   * Corriger son adresse — RGPD art. 16.
   *
   * L'ancienne version de la politique disait « supprimez le compte et
   * recréez-en un ». Ce n'est pas une rectification : c'est un effacement, et
   * il emportait tous les cadrages.
   */
  async function rectifier(): Promise<void> {
    setRefus(null);
    setDit(null);
    const reponse = await fetch("/api/compte/adresse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adresse: nouvelle, mot_de_passe: mot }),
    });
    if (reponse.ok) {
      setDit("Adresse corrigée.");
      setNouvelle("");
      setMot("");
      setRectifie(false);
      surChangement();
      return;
    }
    setRefus((await reponse.json().catch(() => ({}))).message ?? "Refusé.");
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
        <button type="button" onClick={() => setRectifie((v) => !v)}>
          Changer d'adresse
        </button>
        <button type="button" onClick={sortir}>
          Se déconnecter
        </button>
      </div>

      {rectifie && (
        <>
          <p className="explication">
            Vos cadrages restent attachés au compte. Le mot de passe est redemandé : une
            session ouverte ne doit pas suffire à changer l'adresse d'un compte.
          </p>
          <input
            className="controle"
            type="email"
            value={nouvelle}
            onChange={(e) => setNouvelle(e.target.value)}
            placeholder="nouvelle adresse électronique"
            autoComplete="email"
            autoFocus
          />
          <input
            className="controle"
            type="password"
            value={mot}
            onChange={(e) => setMot(e.target.value)}
            placeholder="votre mot de passe, pour confirmer"
            autoComplete="current-password"
          />
          <div className="boutons">
            <button
              type="button"
              className="principal"
              disabled={!nouvelle || !mot}
              onClick={rectifier}
            >
              Corriger
            </button>
            <button type="button" onClick={() => setRectifie(false)}>
              Annuler
            </button>
          </div>
        </>
      )}
      {dit && <p className="note">{dit}</p>}

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
