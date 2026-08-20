// @id mip.bd.ingestion
// @role orchestration
// @layer infra
// @human L'ingestion : du pack extrait vers la base
// @do ingerer_le_pack_extrait_dans_la_base

/**
 * Charge `pack/pack.json` dans PostgreSQL.
 *
 * **L'ingestion est destructive côté protocole, et jamais côté travail.** Les
 * tables dérivées sont vidées et refaites : c'est ce qui garantit qu'une
 * question retirée de la source disparaît vraiment, plutôt que de survivre en
 * doublon silencieux. La table `cadrage` n'est pas touchée — elle contient ce
 * que des gens ont écrit.
 *
 *     npm run -w serveur ingerer
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { bassin, RACINE } from "./bd.js";

interface Pack {
  protocole: Record<string, unknown>;
  questionnaire: Array<{
    numero: string;
    titre: string;
    methode: string;
    deduite: boolean;
    questions: Array<{
      numero: string;
      texte: string;
      depuis: string;
      optionnelle: boolean;
      type: string;
      options: string[];
      aide: string;
    }>;
  }>;
  agents: Array<{ agent: string; phases: Record<string, string>; jetons: number }>;
  skills: Array<{ skill: string; description: string; generique: boolean; jetons: number }>;
  modules: Array<{ module: string; fichier: string; jetons: number }>;
  certifications: Array<{ code: string; titre: string; fiches: number; ko: number }>;
}

async function principal(): Promise<void> {
  const pack: Pack = JSON.parse(readFileSync(join(RACINE, "pack", "pack.json"), "utf8"));
  const client = await bassin.connect();

  try {
    // Tout ou rien. Une ingestion à moitié faite laisserait un formulaire avec
    // des sections sans questions — pire qu'un formulaire absent, parce qu'elle
    // ressemblerait à un protocole appauvri plutôt qu'à une panne.
    await client.query("BEGIN");
    await client.query("TRUNCATE question, section, agent, skill, module, certification, protocole CASCADE");

    let rangSection = 0;
    for (const section of pack.questionnaire) {
      await client.query(
        "INSERT INTO section (numero, titre, methode, deduite, rang) VALUES ($1,$2,$3,$4,$5)",
        [section.numero, section.titre, section.methode, section.deduite, rangSection++],
      );
      let rangQuestion = 0;
      for (const question of section.questions) {
        await client.query(
          `INSERT INTO question (numero, section, texte, depuis, optionnelle, champ, options, aide, rang)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            question.numero,
            section.numero,
            question.texte,
            question.depuis,
            question.optionnelle,
            question.type,
            JSON.stringify(question.options ?? []),
            question.aide ?? "",
            rangQuestion++,
          ],
        );
      }
    }

    // L'équipe vient du protocole (rôle, phases) et le poids du prompt vient du
    // dossier des agents. Les deux sources décrivent le même agent ; on les
    // joint ici plutôt que de faire choisir l'interface.
    const equipe = (pack.protocole.equipe ?? []) as Array<{
      agent: string;
      nom: string;
      role: string;
      phases: string;
      optionnel: boolean;
    }>;
    for (const membre of equipe) {
      const fichiers = pack.agents.find((a) => a.agent === membre.agent);
      await client.query(
        "INSERT INTO agent (code, nom, role, phases, optionnel, jetons) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (code) DO NOTHING",
        [membre.agent, membre.nom, membre.role, membre.phases, membre.optionnel, fichiers?.jetons ?? 0],
      );
    }

    for (const skill of pack.skills) {
      await client.query(
        "INSERT INTO skill (code, description, generique, jetons) VALUES ($1,$2,$3,$4)",
        [skill.skill, skill.description, skill.generique, skill.jetons],
      );
    }
    for (const module of pack.modules) {
      await client.query("INSERT INTO module (code, fichier, jetons) VALUES ($1,$2,$3)", [
        module.module,
        module.fichier,
        module.jetons,
      ]);
    }
    for (const certification of pack.certifications) {
      await client.query(
        "INSERT INTO certification (code, titre, fiches, ko) VALUES ($1,$2,$3,$4)",
        [certification.code, certification.titre, certification.fiches, certification.ko],
      );
    }

    for (const [cle, valeur] of Object.entries(pack.protocole)) {
      await client.query("INSERT INTO protocole (cle, valeur) VALUES ($1,$2)", [
        cle,
        JSON.stringify(valeur),
      ]);
    }

    await client.query("COMMIT");
  } catch (erreur) {
    await client.query("ROLLBACK");
    throw erreur;
  } finally {
    client.release();
  }

  const compte = async (table: string) =>
    Number((await bassin.query(`SELECT count(*) FROM ${table}`)).rows[0].count);

  console.log(
    `ingéré — ${await compte("section")} sections, ${await compte("question")} questions, ` +
      `${await compte("agent")} agents, ${await compte("skill")} skills, ` +
      `${await compte("module")} modules, ${await compte("certification")} certifications`,
  );
  await bassin.end();
}

principal().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
