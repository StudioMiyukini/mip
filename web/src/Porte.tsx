// @id mip.web.porte
// @role securite
// @layer ui
// @human L'écran de mot de passe, quand la demande vient du tunnel
// @do demander_le_mot_de_passe_quand_la_porte_est_fermee

import { useState } from "react";

import { Button } from "@/composants/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/composants/ui/card";
import { Input } from "@/composants/ui/input";

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
    <main className="flex min-h-dvh items-center justify-center p-5">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>MIP Studio</CardTitle>
          <CardDescription>
            Cette adresse est publiée. Il faut le mot de passe pour entrer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={entrer}>
            <Input
              type="password"
              value={mot}
              onChange={(e) => setMot(e.target.value)}
              placeholder="mot de passe"
              autoFocus
              autoComplete="current-password"
            />
            <Button className="w-full" type="submit" disabled={enCours || !mot}>
              {enCours ? "…" : "Entrer"}
            </Button>
            {refus && <p className="text-destructive text-sm">{refus}</p>}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
