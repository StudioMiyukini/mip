import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Le serveur d'API tourne à part, en local. Le mandataire evite CORS et fait
// que l'adresse du front est la meme en developpement et en production.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `@/` pointe sur src/ : c'est la convention qu'attend la CLI shadcn, et
  // celle qu'utilisent les composants qu'elle recopie. Sans elle, chaque ajout
  // demanderait une reecriture de ses imports — reecriture a refaire a chaque
  // mise a jour du composant.
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  server: {
    // 127.0.0.1 explicitement : par defaut Vite ne s'attache qu'a ::1, et
    // l'API Fastify n'ecoute qu'en IPv4. Qui tape 127.0.0.1:5975 n'obtenait
    // rien, sans message — la page ne repondait simplement pas.
    host: "127.0.0.1",
    port: 5975,
    proxy: { "/api": { target: "http://127.0.0.1:8976", changeOrigin: true } },
  },
  build: { outDir: "dist" },
});
