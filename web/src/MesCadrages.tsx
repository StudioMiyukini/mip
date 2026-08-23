// @id mip.web.mes_cadrages
// @role ui
// @layer ui
// @human La liste des cadrages enregistrés, et de quoi en reprendre un
// @do lister_les_cadrages_enregistres_et_permettre_de_les_reprendre

import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/composants/ui/badge";
import { Button } from "@/composants/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/composants/ui/card";
import { Skeleton } from "@/composants/ui/skeleton";

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
      <div className="mx-auto max-w-xl space-y-4 py-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Mes cadrages</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Un compte permet de retrouver vos cadrages d'un jour à l'autre. Il n'est jamais
          nécessaire pour utiliser l'outil — sans lui, le prompt reste copiable, il n'est
          simplement pas conservé.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={surConnexion}>Créer un compte</Button>
          <Button variant="outline" asChild>
            <a href="/cadrage" onClick={(e) => surClicInterne(e, aller)}>
              Commencer sans compte
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (lignes === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!lignes.length) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Mes cadrages</h1>
        <p className="text-muted-foreground text-sm">Rien d'enregistré pour l'instant.</p>
        <Button asChild>
          <a href="/cadrage" onClick={(e) => surClicInterne(e, aller)}>
            <Plus className="size-4" />
            Commencer un cadrage
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes cadrages</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {lignes.length} cadrage{lignes.length > 1 ? "s" : ""} enregistré
            {lignes.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Button asChild>
          <a href="/cadrage" onClick={(e) => surClicInterne(e, aller)}>
            <Plus className="size-4" />
            Nouveau cadrage
          </a>
        </Button>
      </header>

      <div className="grid gap-3">
        {lignes.map((ligne) => (
          <Card key={ligne.id}>
            <CardHeader>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <CardTitle className="text-base">{ligne.titre}</CardTitle>
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {ligne.classe}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {ligne.repondues} réponse{Number(ligne.repondues) > 1 ? "s" : ""} ·
                    modifié le {new Date(ligne.modifie_le).toLocaleDateString("fr-FR")}
                  </span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => ouvrir(ligne.id)}>
                  {ouvert === ligne.id ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {ouvert === ligne.id ? "Masquer" : "Voir le prompt"}
                </Button>
                {ouvert === ligne.id && (
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(prompt)}>
                    <Copy className="size-4" />
                    Copier
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive ml-auto"
                  onClick={() => supprimer(ligne.id, ligne.titre)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              </div>
              {ouvert === ligne.id && (
                <pre className="bg-muted/40 max-h-96 overflow-auto rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {prompt}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
