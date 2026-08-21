// @id mip.web.document
// @role ui
// @layer ui
// @human Les pages en Markdown : confidentialité, licence, documentation
// @do rendre_un_document_markdown_du_depot

import { marked } from "marked";
import { useEffect, useState } from "react";

/**
 * Une page de documentation, rendue depuis le Markdown du dépôt.
 *
 * **Le contenu vit avec le code et versionne avec lui** — c'est la décision D-D :
 * une page qui vante une fonction retirée est pire qu'une page absente.
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
    fetch(`/api/document/${nom}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("absent"))))
      .then((d: { markdown: string }) => setHtml(marked.parse(d.markdown) as string))
      .catch(() => setAbsent(true));
  }, [nom]);

  if (absent) {
    return (
      <main className="page document">
        <p className="explication">Ce document n'existe pas.</p>
      </main>
    );
  }
  if (html === null) {
    return (
      <main className="page document">
        <p className="explication">…</p>
      </main>
    );
  }

  return (
    <main className="page document">
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
