// @id mip.web.entree
// @role ui
// @layer ui
// @human Le point d'entrée du client React
// @do monter_l_application_react

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("racine")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
