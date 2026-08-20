// @id mip.web.porte
// @role securite
// @layer ui
// @human L'écran de mot de passe, quand la demande vient du tunnel
// @do demander_le_mot_de_passe_quand_la_porte_est_fermee

import { useState } from "react";

interface Props {
  surOuverture: () => void;
}

/**
 * L'écran de la porte.
 *
 * Il ne s'affiche que quand le serveur l'exige — c'est-à-dire depuis le tunnel.
 * Depuis la machine, on ne le voit jamais : le serveur constate la provenance,
 * le client ne décide de rien. C'est ce qui évite d'avoir deux vérités sur qui
 * a le droit d'entrer.
 */
export function Porte({ surOuverture }: Props) {
  const [mot, setMot] = useState("");
  const [refus, setRefus] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function entrer(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault();
    setEnCours(true);
    setRefus(null);
    try {
      const reponse = await fetch("/api/entrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mot_de_passe: mot }),
      });
      if (reponse.ok) {
        surOuverture();
        return;
      }
      const dit = await reponse.json().catch(() => ({}));
      setRefus(dit.message ?? "Mot de passe refusé.");
    } catch (erreur) {
      setRefus(String(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="page">
      <form className="bloc porte" onSubmit={entrer}>
        <h1>MIP Studio</h1>
        <p className="explication">
          Cette adresse est publiée. Il faut le mot de passe pour entrer.
        </p>
        <input
          className="controle"
          type="password"
          value={mot}
          onChange={(e) => setMot(e.target.value)}
          placeholder="mot de passe"
          autoFocus
          autoComplete="current-password"
        />
        <button className="principal" type="submit" disabled={enCours || !mot}>
          {enCours ? "…" : "Entrer"}
        </button>
        {refus && <p className="refus">{refus}</p>}
      </form>
    </main>
  );
}
