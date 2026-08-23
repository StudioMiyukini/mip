// @id mip.web.utils
// @role ui
// @layer ui
// @human Fusionner des classes Tailwind sans qu'elles se contredisent
// @do fusionner_des_listes_de_classes_tailwind

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatène des classes, et **tranche les conflits**.
 *
 * `clsx` seul rendrait `px-2 px-4` : deux règles de même spécificité, et c'est
 * l'ordre dans la feuille — non celui de l'appel — qui déciderait. `twMerge`
 * garde la dernière, ce qui est ce qu'on croyait écrire.
 *
 * C'est l'utilitaire que tout composant recopié depuis un registre importe
 * sous ce nom-là. Le renommer casserait chaque ajout futur.
 */
export function cn(...entrees: ClassValue[]): string {
  return twMerge(clsx(entrees));
}
