/* @id mip.web.theme.init
   @do poser_le_theme_avant_le_premier_rendu
   @role ui
   @layer ui
   @human Pose le thème clair/sombre avant la peinture, pour éviter l'éclair blanc

   Fichier externe et non pas script en ligne : une politique de sécurité de
   contenu (CSP) stricte interdit `script-src 'unsafe-inline'`, et un
   même-origine `'self'` est couvert sans hachage fragile. */
(function () {
  try {
    var garde = localStorage.getItem("mip.theme");
    var sombre =
      garde === "sombre" ||
      (garde !== "clair" && matchMedia("(prefers-color-scheme: dark)").matches);
    if (sombre) document.documentElement.classList.add("dark");
  } catch (_) {}
})();
