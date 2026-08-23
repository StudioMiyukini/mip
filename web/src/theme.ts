// @id mip.web.theme
// @role ui
// @layer ui
// @human Le thème clair ou sombre : celui du système, ou celui qu'on a choisi
// @do appliquer_le_theme_clair_ou_sombre_et_memoriser_le_choix

import { useCallback, useEffect, useState } from "react";

export type Theme = "clair" | "sombre" | "systeme";

const CLE = "mip.theme";

function lire(): Theme {
  try {
    const garde = window.localStorage.getItem(CLE);
    if (garde === "clair" || garde === "sombre") return garde;
  } catch {
    /* stockage refusé : on suit le système */
  }
  return "systeme";
}

function sombreVoulu(theme: Theme): boolean {
  if (theme !== "systeme") return theme === "sombre";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/**
 * Le thème, appliqué sur `<html>`.
 *
 * **Une classe, pas une requête média.** L'ancienne feuille basculait sur
 * `prefers-color-scheme` — c'était juste, et ça interdisait tout choix : qui
 * préfère le clair sur une machine réglée en sombre n'avait aucun recours.
 * Les jetons shadcn se redéfinissent sous `.dark`, ce qui rend les deux
 * possibles : le système décide par défaut, la personne peut trancher.
 *
 * `« systeme »` n'est pas un troisième thème, c'est l'absence de choix — et il
 * suit le réglage en direct, y compris quand celui-ci change en cours de route.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(lire);

  useEffect(() => {
    const appliquer = () => {
      document.documentElement.classList.toggle("dark", sombreVoulu(theme));
    };
    appliquer();

    if (theme !== "systeme") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", appliquer);
    return () => media.removeEventListener("change", appliquer);
  }, [theme]);

  const choisir = useCallback((choix: Theme) => {
    setTheme(choix);
    try {
      if (choix === "systeme") window.localStorage.removeItem(CLE);
      else window.localStorage.setItem(CLE, choix);
    } catch {
      /* le choix vaudra pour cette visite seulement */
    }
  }, []);

  /** Le bouton bascule entre les deux états visibles, sans passer par « système ». */
  const basculer = useCallback(() => {
    choisir(sombreVoulu(theme) ? "clair" : "sombre");
  }, [theme, choisir]);

  return { theme, sombre: sombreVoulu(theme), choisir, basculer };
}
