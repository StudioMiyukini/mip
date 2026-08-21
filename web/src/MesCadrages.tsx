// @id mip.web.mes_cadrages
// @role ui
// @layer ui
// @human La liste des cadrages enregistrés, et de quoi en reprendre un
// @do lister_les_cadrages_enregistres_et_permettre_de_les_reprendre

import { useEffect, useState } from "react";

import { surClicInterne } from "./routeur";

interface Ligne {
  id: string;
  titre: string;
  classe: string;
  mode: string;
  cree_le: string;
  modifie_le: string;
  repondues: string;
}

interface Props {
  connecte: boolean;
  aller: (chemin: string) => void;
  surConnexion: () => void;
  surChangement: () => void;
}

/**
 * Les cadrages enregistrés.
 *
 * **Sans compte, la page n'affiche pas une liste vide.** Un tableau vide se lit
 * comme « vous n'avez rien » alors que la vraie phrase est « il faut un compte
 * pour en garder ». Les deux états ont l'air identiques et ne veulent pas dire
 * la même chose.
 */
export function MesCadrages({ connecte, aller, surConnexion, surChangement }: Props) {
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  function relire(): void {
    fetch("/api/cadrages")
      .then((r) => r.json())
      .then((d: { cadrages: Ligne[] }) => setLignes(d.cadrages ?? []))
      .catch(() => setLignes([]));
  }

  useEffect(relire, [connecte]);

  async function ouvrir(id: string): Promise<void> {
    if (ouvert === id) {
      setOuvert(null);
      return;
    }
    const reponse = await fetch(`/api/cadrages/${id}`);
    if (!reponse.ok) return;
    const cadrage = (await reponse.json()) as { prompt: string };
    setPrompt(cadrage.prompt);
    setOuvert(id);
  }

  async function supprimer(id: string, titre: string): Promise<void> {
    // Une suppression se confirme, et le titre est dans la question : « voulez-
    // vous supprimer ? » se clique machinalement, « supprimer Suivi d'arrosage ? »
    // se lit.
    if (!window.confirm(`Supprimer « ${titre} » ? C'est définitif.`)) return;
    await fetch(`/api/cadrages/${id}`, { method: "DELETE" });
    if (ouvert === id) setOuvert(null);
    relire();
    surChangement();
  }

  if (!connecte) {
    return (
      <div className="scene-vide">
        <h1>Mes cadrages</h1>
        <p className="explication">
          Un compte permet de retrouver vos cadrages d'un jour à l'autre. Il n'est jamais
          nécessaire pour utiliser l'outil — sans lui, le prompt reste copiable, il n'est
          simplement pas conservé.
        </p>
        <div className="boutons">
          <button type="button" className="principal" onClick={surConnexion}>
            Créer un compte
          </button>
          <a href="/cadrage" className="bouton-second" onClick={(e) => surClicInterne(e, aller)}>
            Commencer sans compte
          </a>
        </div>
      </div>
    );
  }

  if (lignes === null) return <p className="explication">…</p>;

  if (!lignes.length) {
    return (
      <div className="scene-vide">
        <h1>Mes cadrages</h1>
        <p className="explication">Rien d'enregistré pour l'instant.</p>
        <a href="/cadrage" className="bouton-principal" onClick={(e) => surClicInterne(e, aller)}>
          Commencer un cadrage
        </a>
      </div>
    );
  }

  return (
    <div>
      <header className="scene-tete">
        <div>
          <h1>Mes cadrages</h1>
          <p className="explication">
            {lignes.length} cadrage{lignes.length > 1 ? "s" : ""} enregistré
            {lignes.length > 1 ? "s" : ""}.
          </p>
        </div>
        <a href="/cadrage" className="bouton-principal" onClick={(e) => surClicInterne(e, aller)}>
          Nouveau cadrage
        </a>
      </header>

      <div className="liste-cadrages">
        {lignes.map((ligne) => (
          <article className="bloc" key={ligne.id}>
            <header className="bloc-tete">
              <h3>{ligne.titre}</h3>
              <span className="compte">
                {ligne.classe} · {ligne.repondues} réponse{Number(ligne.repondues) > 1 ? "s" : ""}
              </span>
            </header>
            <p className="note">
              modifié le {new Date(ligne.modifie_le).toLocaleDateString("fr-FR")}
            </p>
            <div className="boutons">
              <button type="button" onClick={() => ouvrir(ligne.id)}>
                {ouvert === ligne.id ? "masquer" : "voir le prompt"}
              </button>
              {ouvert === ligne.id && (
                <button
                  type="button"
                  className="principal"
                  onClick={() => navigator.clipboard.writeText(prompt)}
                >
                  Copier
                </button>
              )}
              <button type="button" className="danger" onClick={() => supprimer(ligne.id, ligne.titre)}>
                Supprimer
              </button>
            </div>
            {ouvert === ligne.id && <pre className="prompt">{prompt}</pre>}
          </article>
        ))}
      </div>
    </div>
  );
}
