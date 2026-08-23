// @id mip.web.editeur
// @role ui
// @layer ui
// @human L'éditeur CodeMirror qui affiche un cadrage, coloré et en lecture seule
// @do afficher_un_markdown_colore_dans_codemirror_en_lecture_seule

import { useEffect, useRef, useState } from "react";

/**
 * Un cadrage affiché dans CodeMirror 6.
 *
 * **Pourquoi un éditeur pour un texte qu'on ne modifie pas.** Un `<pre>` rend
 * le Markdown en gris uniforme ; le prompt fait deux mille jetons et ses titres
 * de section sont ce qui le rend lisible d'un coup d'œil. CodeMirror colore la
 * syntaxe, gère le défilement long sans y perdre les performances, et surtout
 * *ressemble à l'endroit où ce texte va finir* — un éditeur. Le lecteur
 * reconnaît le geste : copier, coller dans son outil.
 *
 * **Chargé à la demande.** CodeMirror pèse plus de cent kilo-octets, et le
 * paquet passe déjà 470. Un `import()` dynamique le sort du premier rendu : la
 * page d'accueil s'affiche, puis l'éditeur se pose. Tant qu'il n'est pas là, le
 * texte est rendu tel quel dans un `<pre>` — jamais de fenêtre vide.
 *
 * **En lecture seule, mais pas inerte** : on peut sélectionner, faire défiler,
 * copier. `editable: false` retire le curseur de saisie sans retirer ces trois
 * gestes, là où un `<div>` avec `user-select` les aurait tous perdus.
 */
interface Props {
  texte: string;
  /** Le thème suit celui du site — CodeMirror ne lit pas nos variables CSS seul. */
  sombre: boolean;
  className?: string;
}

export function Editeur({ texte, sombre, className }: Props) {
  const hote = useRef<HTMLDivElement>(null);
  const vue = useRef<{
    dispatch: (t: unknown) => void;
    destroy: () => void;
    state: { doc: { length: number } };
  } | null>(null);
  const [pret, setPret] = useState(false);

  // Le montage : une fois, quand le module est arrivé.
  useEffect(() => {
    let vivant = true;

    (async () => {
      const [{ EditorState }, { EditorView, lineNumbers }, { markdown }, langue, surbrillance] =
        await Promise.all([
          import("@codemirror/state"),
          import("@codemirror/view"),
          import("@codemirror/lang-markdown"),
          import("@codemirror/language"),
          import("@lezer/highlight"),
        ]);
      if (!vivant || !hote.current) return;

      const { HighlightStyle, syntaxHighlighting } = langue;
      const { tags } = surbrillance;

      // **Les couleurs viennent des jetons du site, pas d'un thème importé.**
      // Un thème CodeMirror tout fait apporterait sa propre palette, et la
      // fenêtre jurerait avec le reste de la page — surtout en clair.
      const style = HighlightStyle.define([
        { tag: tags.heading1, color: "var(--foreground)", fontWeight: "600" },
        { tag: tags.heading2, color: "var(--primary)", fontWeight: "600" },
        { tag: tags.heading3, color: "var(--foreground)", fontWeight: "600" },
        { tag: tags.strong, color: "var(--foreground)", fontWeight: "600" },
        { tag: tags.emphasis, fontStyle: "italic" },
        { tag: tags.quote, color: "var(--muted-foreground)", fontStyle: "italic" },
        { tag: tags.list, color: "var(--primary)" },
        { tag: tags.monospace, color: "var(--primary)" },
        { tag: tags.link, color: "var(--primary)", textDecoration: "underline" },
        { tag: tags.processingInstruction, color: "var(--muted-foreground)" },
      ]);

      const apparence = EditorView.theme(
        {
          "&": {
            backgroundColor: "transparent",
            color: "var(--muted-foreground)",
            fontSize: "12.5px",
          },
          ".cm-content": { fontFamily: "var(--font-mono)", padding: "14px 0" },
          ".cm-line": { padding: "0 16px", lineHeight: "1.6" },
          ".cm-gutters": {
            backgroundColor: "transparent",
            border: "none",
            color: "color-mix(in oklch, var(--muted-foreground) 45%, transparent)",
            fontSize: "11px",
          },
          ".cm-lineNumbers .cm-gutterElement": { padding: "0 10px 0 14px" },
          "&.cm-focused": { outline: "none" },
          ".cm-scroller": { overflow: "auto" },
          // Le curseur de saisie n'a rien à faire dans un texte non modifiable ;
          // la sélection, si — c'est ce qui permet de copier trois lignes.
          ".cm-cursor": { display: "none" },
          "::selection": { backgroundColor: "color-mix(in oklch, var(--primary) 28%, transparent)" },
        },
        { dark: sombre },
      );

      const etat = EditorState.create({
        doc: texte,
        extensions: [
          lineNumbers(),
          markdown(),
          syntaxHighlighting(style),
          apparence,
          EditorView.lineWrapping,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ],
      });

      vue.current = new EditorView({ state: etat, parent: hote.current }) as never;
      setPret(true);
    })().catch(() => {
      // CodeMirror n'est pas arrivé — le repli en `<pre>` reste affiché, et il
      // dit la même chose en moins joli. Une décoration qui échoue ne doit pas
      // emporter le contenu.
    });

    return () => {
      vivant = false;
      vue.current?.destroy();
      vue.current = null;
    };
    // Le thème est figé au montage : le remonter à chaque bascule clair/sombre
    // rejouerait la frappe depuis le début.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le texte grandit caractère par caractère pendant la frappe. On remplace le
  // document plutôt que d'insérer à la fin : c'est une transaction par image au
  // lieu d'un journal d'annulation de deux mille entrées.
  //
  // **Et la fenêtre suit la frappe.** Sans `scrollIntoView`, le texte dépasse le
  // bas du cadre au bout de quinze lignes et continue de s'écrire là où personne
  // ne le voit — le mouvement s'arrête sans que rien ne soit fini. Le repli en
  // `<pre>` ne peut pas défiler, mais il n'est là qu'une fraction de seconde.
  useEffect(() => {
    const v = vue.current;
    if (!v) return;
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: texte },
      selection: { anchor: texte.length },
      scrollIntoView: true,
    });
  }, [texte]);

  return (
    <div className={className}>
      <div ref={hote} className={pret ? "" : "hidden"} />
      {!pret && (
        <pre className="text-muted-foreground overflow-hidden px-4 py-3.5 font-mono text-[12.5px] leading-[1.6] whitespace-pre-wrap">
          {texte}
        </pre>
      )}
    </div>
  );
}
