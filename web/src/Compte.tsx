// @id mip.web.compte
// @role ui
// @layer ui
// @human Le compte : s'inscrire, corriger son adresse, tout emporter, tout effacer
// @do gerer_l_inscription_la_connexion_la_rectification_et_l_effacement_du_compte

import { useState } from "react";
import { AtSign, Download, LogOut, Trash2 } from "lucide-react";

import { Button } from "@/composants/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/composants/ui/dialog";
import { Input } from "@/composants/ui/input";
import { Separator } from "@/composants/ui/separator";

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
  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && surFermeture()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        {etat.connecte ? (
          <Reglages etat={etat} surFermeture={surFermeture} surChangement={surChangement} />
        ) : (
          <Identification surFermeture={surFermeture} surChangement={surChangement} />
        )}
      </DialogContent>
    </Dialog>
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
    <>
      <DialogHeader>
        <DialogTitle>Votre compte</DialogTitle>
        <DialogDescription>
          Un compte sert à retrouver vos cadrages. Il n'est jamais nécessaire pour utiliser
          l'outil.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <Input
          type="email"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="adresse électronique"
          autoComplete="email"
          autoFocus
        />
        <Input
          type="password"
          value={mot}
          onChange={(e) => setMot(e.target.value)}
          placeholder="mot de passe — huit caractères au minimum"
          autoComplete="current-password"
        />
        <div className="flex flex-wrap gap-2">
          <Button disabled={enCours} onClick={() => envoyer("entrer")}>
            Se connecter
          </Button>
          <Button variant="outline" disabled={enCours} onClick={() => envoyer("creer")}>
            Créer un compte
          </Button>
        </div>
        {refus && <p className="text-destructive text-sm">{refus}</p>}
        <p className="text-muted-foreground text-xs leading-snug">
          Nous gardons votre adresse et une empreinte de votre mot de passe. Rien d'autre —{" "}
          <a
            href="/confidentialite"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            voir le détail
          </a>
          .
        </p>
      </div>
    </>
  );
}

/** Ses données, la correction d'adresse, et le bouton qui efface tout. */
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
    <>
      <DialogHeader>
        <DialogTitle>Mon compte</DialogTitle>
        <DialogDescription className="font-mono text-xs">{etat.adresse}</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={emporter}>
            <Download className="size-4" />
            Emporter mes données
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRectifie((v) => !v)}>
            <AtSign className="size-4" />
            Changer d'adresse
          </Button>
          <Button variant="ghost" size="sm" onClick={sortir}>
            <LogOut className="size-4" />
            Se déconnecter
          </Button>
        </div>

        {rectifie && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs leading-snug">
              Vos cadrages restent attachés au compte. Le mot de passe est redemandé : une
              session ouverte ne doit pas suffire à changer l'adresse d'un compte.
            </p>
            <Input
              type="email"
              value={nouvelle}
              onChange={(e) => setNouvelle(e.target.value)}
              placeholder="nouvelle adresse électronique"
              autoComplete="email"
              autoFocus
            />
            <Input
              type="password"
              value={mot}
              onChange={(e) => setMot(e.target.value)}
              placeholder="votre mot de passe, pour confirmer"
              autoComplete="current-password"
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={!nouvelle || !mot} onClick={rectifier}>
                Corriger
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRectifie(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
        {dit && <p className="text-muted-foreground text-xs">{dit}</p>}

        <Separator />

        {!confirme ? (
          <Button variant="destructive" size="sm" onClick={() => setConfirme(true)}>
            <Trash2 className="size-4" />
            Supprimer mon compte
          </Button>
        ) : (
          <div className="border-destructive/40 bg-destructive/5 space-y-2 rounded-lg border p-3">
            <p className="text-sm leading-snug">
              <strong>La suppression est immédiate et définitive.</strong> Elle efface le
              compte et tous les cadrages qui y sont rattachés. Il n'y a ni corbeille, ni
              délai, ni restauration possible.
            </p>
            <Input
              type="password"
              value={mot}
              onChange={(e) => setMot(e.target.value)}
              placeholder="votre mot de passe, pour confirmer"
              autoComplete="current-password"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" disabled={!mot} onClick={supprimer}>
                Tout supprimer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirme(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
        {refus && <p className="text-destructive text-sm">{refus}</p>}
      </div>
    </>
  );
}
