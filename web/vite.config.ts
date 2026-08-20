import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Le serveur d'API tourne à part, en local. Le mandataire evite CORS et fait
// que l'adresse du front est la meme en developpement et en production.
export default defineConfig({
  plugins: [react()],
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
