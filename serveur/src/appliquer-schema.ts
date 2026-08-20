// @id mip.bd.migration
// @role orchestration
// @layer infra
// @human Poser le schéma sur une base neuve ou existante
// @do appliquer_le_schema_sur_la_base

import { bassin, schema } from "./bd.js";

const sql = schema();
await bassin.query(sql);
console.log("schéma appliqué");
await bassin.end();
