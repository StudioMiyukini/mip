// @id mip.bd.migration
// @role orchestration
// @layer infra
// @human Poser le schéma sur une base neuve ou existante
// @do appliquer_le_schema_sur_la_base

import { bassin, schema } from "./bd.js";

await bassin.query(schema());
console.log("schéma appliqué");

// Le schéma **vide les tables du protocole** : elles sont dérivées et se
// régénèrent depuis le pack. Sans ré-ingestion, le formulaire n'a plus une
// seule question — et le dire ici coûte deux lignes, alors que le découvrir
// coûte une page cassée en production.
const restant = await bassin.query("SELECT count(*) FROM question");
if (Number(restant.rows[0].count) === 0) {
  console.log("");
  console.log("  ⚠ le protocole est vide : les tables dérivées ont été recréées.");
  console.log("    lancer `npm run ingerer` avant de servir le formulaire.");
}

await bassin.end();
