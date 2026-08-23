// @id mip.web.capture
// @do capturer_les_deux_parcours_dans_un_navigateur_reel
// @role config
// @layer outil
// @human Le script qui ouvre les deux parcours dans un vrai navigateur et les photographie

/*
 * **Regarder, plutot que supposer.**
 *
 * Le typage passe, les essais passent, et l'ecran peut rester faux. Ce script a
 * trouve deux defauts qu'aucun des deux n'aurait vus : l'aide des questions
 * affichee DEUX fois — sous le libelle et en filigrane dans le champ — et les
 * deux catalogues deroules, treize cents pixels de tags avant la premiere des
 * quatre questions essentielles.
 *
 * Il verifie aussi ce qu'aucune capture ne montre : la console. Une exception
 * React ne casse pas forcement la page, mais elle vide une moitie d'ecran.
 *
 * Usage, serveur demarre :
 *   node scripts/capturer.mjs [http://127.0.0.1:8976]
 * Les images vont dans .tmp/, qui est ignore par Git.
 */

import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8977";
const navigateur = await chromium.launch();
const erreurs = [];

async function page(nom, { largeur, hauteur, tactile, appareil, theme, chemin }) {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: hauteur },
    hasTouch: tactile,
    isMobile: tactile,
    deviceScaleFactor: 2,
    colorScheme: theme === "sombre" ? "dark" : "light",
    locale: "fr-FR",
  });
  const p = await contexte.newPage();
  p.on("console", (m) => {
    if (m.type() === "error") erreurs.push(`${nom} · console : ${m.text()}`);
  });
  p.on("pageerror", (e) => erreurs.push(`${nom} · exception : ${e.message}`));

  if (appareil) {
    await p.addInitScript(
      ([a, t]) => {
        localStorage.setItem("mip.appareil", a);
        if (t) localStorage.setItem("mip.theme", t);
      },
      [appareil, theme],
    );
  }

  await p.goto(BASE + (chemin ?? "/"), { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  await p.screenshot({ path: `.tmp/${nom}.png`, fullPage: true });

  const titre = await p.title();
  const texte = (await p.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 110);
  console.log(`${nom.padEnd(24)} ${titre.slice(0, 30).padEnd(32)} ${texte}`);

  await contexte.close();
}

// La gate — aucun choix mémorisé.
await page("gate-pc", { largeur: 1440, hauteur: 900, tactile: false, theme: "sombre" });
await page("gate-mobile", { largeur: 390, hauteur: 844, tactile: true, theme: "clair" });

// Les deux parcours, choix déjà fait.
await page("pc-accueil", { largeur: 1440, hauteur: 1000, tactile: false, appareil: "pc", theme: "sombre", chemin: "/accueil" });
await page("pc-cadrage", { largeur: 1440, hauteur: 1000, tactile: false, appareil: "pc", theme: "sombre", chemin: "/cadrage" });
await page("pc-accueil-clair", { largeur: 1440, hauteur: 1000, tactile: false, appareil: "pc", theme: "clair", chemin: "/accueil" });
await page("pc-doc", { largeur: 1440, hauteur: 1000, tactile: false, appareil: "pc", theme: "clair", chemin: "/guide" });
await page("mobile-accueil", { largeur: 390, hauteur: 844, tactile: true, appareil: "mobile", theme: "clair", chemin: "/accueil" });
await page("mobile-cadrage", { largeur: 390, hauteur: 844, tactile: true, appareil: "mobile", theme: "sombre", chemin: "/cadrage" });

await navigateur.close();

if (erreurs.length) {
  console.log("\n--- erreurs de console ---");
  for (const e of erreurs) console.log("  " + e);
  process.exitCode = 1;
} else {
  console.log("\naucune erreur de console");
}
