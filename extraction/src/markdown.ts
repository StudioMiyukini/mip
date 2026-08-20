// @id mip.extraction.markdown
// @role donnee
// @layer outil
// @human Les tableaux Markdown, qui portent l'essentiel du protocole
// @do lire_les_tableaux_markdown_en_lignes_exploitables

/**
 * Tous les tableaux Markdown d'un texte, en lignes nommées par colonne.
 *
 * Le protocole est écrit en tableaux — c'est sa forme naturelle, et c'est une
 * chance : un tableau se lit sans deviner. On ne fait aucune analyse sémantique
 * ici, seulement de la mise en forme.
 */
export function tableaux(texte: string): Array<Array<Record<string, string>>> {
  const blocs: string[][][] = [];
  let courant: string[][] = [];

  for (const ligne of texte.split(/\r?\n/)) {
    const nue = ligne.trim();
    if (nue.startsWith("|") && nue.endsWith("|")) {
      courant.push(
        nue
          .slice(1, -1)
          .split("|")
          .map((cellule) => cellule.trim()),
      );
      continue;
    }
    if (courant.length) {
      blocs.push(courant);
      courant = [];
    }
  }
  if (courant.length) blocs.push(courant);

  const sortie: Array<Array<Record<string, string>>> = [];
  for (const bloc of blocs) {
    // Un tableau, c'est un en-tête, un séparateur, et des lignes. Moins que ça,
    // c'est autre chose qui ressemble à un tableau.
    if (bloc.length < 3) continue;
    if (!/^[-: ]+$/.test(bloc[1][0] ?? "")) continue;

    const entetes = bloc[0];
    sortie.push(
      bloc
        .slice(2)
        .filter((ligne) => ligne.length === entetes.length)
        .map((ligne) => Object.fromEntries(entetes.map((entete, i) => [entete, ligne[i]]))),
    );
  }
  return sortie;
}

/** `**T3**` → `T3`. Le gras est de la mise en forme, pas de la donnée. */
export function sansGras(valeur: string): string {
  return valeur.replace(/[*`]/g, "").trim();
}

/** Le premier tableau dont l'en-tête porte toutes ces colonnes. */
export function tableauAvec(
  texte: string,
  colonnes: string[],
): Array<Record<string, string>> | null {
  for (const tableau of tableaux(texte)) {
    const entetes = new Set(Object.keys(tableau[0] ?? {}));
    if (colonnes.every((colonne) => entetes.has(colonne))) return tableau;
  }
  return null;
}
