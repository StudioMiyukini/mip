// @id mip.web.entree
// @role ui
// @layer ui
// @human Le point d'entrée du client React
// @do monter_l_application_react

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { FournisseurAppareil } from "./appareil";
import { App } from "./App";
import "./styles.css";

// **Le fournisseur d'appareil enveloppe tout**, y compris la porte : le choix
// du parcours se pose avant de savoir quoi que ce soit du serveur, et l'écran
// de mot de passe lui-même a besoin d'un thème monté.
createRoot(document.getElementById("racine")!).render(
  <StrictMode>
    <FournisseurAppareil>
      <App />
    </FournisseurAppareil>
  </StrictMode>,
);
