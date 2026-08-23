// @id mip.web.document
// @role ui
// @layer ui
// @human Les pages en Markdown : confidentialité, licence, documentation
// @do rendre_un_document_markdown_du_depot

import { marked } from "marked";
import { useEffect, useState } from "react";

import { Skeleton } from "@/composants/ui/skeleton";

/**
 * Une page de documentation, rendue depuis le Markdown du dépôt.
 *
 * **Le contenu vit avec le code et versionne avec lui** — c'est la décision D-D :
 * une page qui vante une fonction retirée est pire qu'une page absente.
 *
 * La mise en forme est dans `styles.css`, sous `.prose-mip`. Le HTML arrive en
 * bloc depuis `marked` : aucune classe utilitaire ne peut lui être posée à la
 * volée, donc il se met en forme une fois, au niveau du parent.
 *
 * *Une réserve, pour le jour où :* le HTML n'est pas assaini, et c'est sans
 * danger tant que la source est une liste blanche de fichiers du dépôt. Le jour
 * où l'on rendrait du texte écrit par quelqu'un d'autre — un cadrage partagé,
 * un commentaire — l'assainissement devient obligatoire, pas optionnel.
 */
export function Document({ nom }: { nom: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [absent, setAbsent] = useState(false);

  useEffect(() => {
    setHtml(null);
    setAbsent(false);
    fetch(`/api/document/${nom}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("absent"))))
      .then((d: { markdown: string }) => setHtml(marked.parse(d.markdown) as string))
      .catch(() => setAbsent(true));
  }, [nom]);

  if (absent) {
    return (
      <p className="text-muted-foreground mx-auto max-w-3xl py-10 text-sm">
        Ce document n'existe pas.
      </p>
    );
  }

  if (html === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-8 h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  return (
    <article
      className="prose-mip mx-auto max-w-3xl pb-10"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
