// @id mip.porte.empreinte
// @role securite
// @layer outil
// @human Calculer l'empreinte d'un mot de passe, sans qu'il touche un fichier
// @do calculer_l_empreinte_d_un_mot_de_passe

/**
 * Affiche l'empreinte a mettre dans `MIP_EMPREINTE`.
 *
 *     npm run -w serveur empreinte -- "mon mot de passe"
 *
 * Le mot de passe ne touche jamais un fichier du depot, et il n'y a rien a
 * modifier dans le code pour le changer.
 */

import { empreindre } from "./porte.js";

const mot = process.argv.slice(2).join(" ").trim();
if (!mot) {
  console.error('usage : npm run -w serveur empreinte -- "<mot de passe>"');
  process.exit(1);
}
console.log(empreindre(mot));
