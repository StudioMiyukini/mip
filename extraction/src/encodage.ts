// @id mip.extraction.encodage
// @role donnee
// @layer outil
// @human La lecture qui répare le double encodage plutôt que de le propager
// @do lire_un_fichier_en_reparant_son_double_encodage

import { readFileSync } from "node:fs";

/** Les signatures du double encodage. Leur présence suffit à décider. */
const SIGNATURES = ["Ã©", "Ã¨", "Ã ", "Ã´", "â€”", "â€™", "Ã‰", "Ã§"];

/**
 * La table cp1252 pour les positions 0x80-0x9F.
 *
 * Node ne sait pas encoder en cp1252 nativement, et c'est **précisément ce
 * codec-là** qu'il faut : la bavure contient `€`, `‰`, `"`, que latin-1 n'a pas
 * du tout — ses positions 0x80-0x9F sont vides. Utiliser latin-1 à la place ne
 * produit pas d'erreur visible, seulement un texte qu'on croit réparé.
 *
 * Le reste de la table (0xA0-0xFF) coïncide avec Unicode, donc n'a pas besoin
 * d'être écrit.
 */
const CP1252_HAUT: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84,
  "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c,
  "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93,
  "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

/** L'octet cp1252 du caractère, s'il est dans la moitié haute. */
function octetHaut(caractere: string): number | null {
  const code = caractere.codePointAt(0)!;
  if (code >= 0xa0 && code <= 0xff) return code;
  const special = CP1252_HAUT[caractere];
  return special ?? null;
}

export function abime(texte: string): boolean {
  return SIGNATURES.some((signature) => texte.includes(signature));
}

/**
 * Répare la bavure **segment par segment**, jamais sur le fichier entier.
 *
 * Le premier réflexe — réencoder tout le texte et le relire en UTF-8 — ne marche
 * pas ici, et l'échec est instructif : les fichiers de la source sont **mixtes**.
 * Une partie a été doublement encodée, l'autre non. Réencoder l'ensemble produit
 * des octets qui ne sont plus de l'UTF-8 valide dès le premier accent resté sain,
 * la conversion lève, et l'on rend le texte abîmé en croyant l'avoir réparé.
 *
 * On travaille donc sur les **suites maximales** de caractères issus de la
 * moitié haute de cp1252. Une suite qui se relit en UTF-8 était de la bavure et
 * se répare ; une suite qui ne s'y relit pas était du texte français normal et
 * reste intacte. « créé » ne bouge pas — `E9 E9` n'est pas de l'UTF-8 valide —
 * là où « Ã©tÃ© » redevient « été ».
 */
export function reparer(texte: string): string {
  const morceaux: string[] = [];
  const caracteres = Array.from(texte);
  let debut = 0;

  while (debut < caracteres.length) {
    if (octetHaut(caracteres[debut]) === null) {
      morceaux.push(caracteres[debut]);
      debut += 1;
      continue;
    }

    let fin = debut;
    const octets: number[] = [];
    while (fin < caracteres.length) {
      const octet = octetHaut(caracteres[fin]);
      if (octet === null) break;
      octets.push(octet);
      fin += 1;
    }

    const suite = caracteres.slice(debut, fin).join("");
    morceaux.push(relire(Buffer.from(octets)) ?? suite);
    debut = fin;
  }

  return morceaux.join("");
}

/** Les octets, relus en UTF-8 — ou `null` s'ils n'en sont pas. */
function relire(octets: Buffer): string | null {
  const texte = octets.toString("utf8");
  // `toString` ne lève jamais : il remplace l'invalide par U+FFFD. C'est ce
  // caractère qui sert de verdict, et c'est aussi ce qui rend la vérification
  // fiable — on ne se fie pas à l'absence d'exception.
  if (texte.includes("�")) return null;
  // Un aller-retour qui ne redonne pas les mêmes octets n'était pas de l'UTF-8.
  return Buffer.from(texte, "utf8").equals(octets) ? texte : null;
}

/** Le texte d'un fichier, BOM retiré et bavure réparée. */
export function lire(chemin: string): string {
  const texte = readFileSync(chemin, "utf8").replace(/^﻿/, "");
  return abime(texte) ? reparer(texte) : texte;
}
