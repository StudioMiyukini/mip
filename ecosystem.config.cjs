// @id mip.pm2
// @do declarer_les_processus_sous_pm2
// @role config
// @layer infra
// @human La déclaration PM2 : le serveur et le tunnel, relancés au démarrage

// Usage : pm2 start ecosystem.config.cjs && pm2 save
//
// **Depuis un terminal élevé.** Sur cette machine, PM2 tourne en service
// Windows sous LocalSystem (`C:\ProgramData\pm2-service`), avec
// `PM2_HOME=C:\Users\Van Jean\.pm2`. Le tube nommé `\\.\pipe\rpc.sock` du démon
// appartient donc à SYSTEM : un shell non élevé — même celui d'un
// administrateur, dont le groupe est alors « utilisé pour les refus
// uniquement » — se voit refuser la connexion avec `EPERM`, et PM2 croit devoir
// démarrer un second démon, qui échoue à son tour. Neuf démons fantômes ont été
// engendrés ainsi avant qu'on comprenne. Élever le terminal règle tout.
//
// Deux processus, et **rien d'autre** : PostgreSQL vit dans Docker avec
// `restart: unless-stopped`, il se relève seul et n'a pas besoin de PM2.
//
// L'ordre compte au premier démarrage : le tunnel se connecte à Cloudflare même
// si l'origine ne répond pas encore, et Cloudflare rend alors 502. PM2 lance les
// deux en même temps ; le serveur met deux ou trois secondes à écouter, donc une
// poignée de requêtes peuvent tomber pendant ce laps. C'est sans conséquence au
// démarrage d'une machine, et l'écrire évite de chercher la cause un jour de
// redémarrage.

const chemin = require("node:path");

const RACINE = __dirname;
const TSX = chemin.join(RACINE, "node_modules", "tsx", "dist", "cli.mjs");
// **Les barres obliques sont volontaires.** Dans un littéral JavaScript,
// « C:\Program Files » perd ses barres inverses : `\P` n'est pas une séquence
// d'échappement connue, et le moteur la réduit silencieusement à `P`. Le chemin
// valait `C:Program Files (x86)cloudflaredcloudflared.exe` — PM2 aurait échoué
// au lancement sans que rien dans ce fichier ne le laisse voir. Windows accepte
// les barres obliques, et elles ne s'échappent pas.
const CLOUDFLARED = "C:/Program Files (x86)/cloudflared/cloudflared.exe";
// **Absolu, et non pas déduit de `USERPROFILE`.** Le démon PM2 de cette machine
// tourne en service sous LocalSystem : si ce fichier était relu dans ce
// contexte, `USERPROFILE` vaudrait `C:\Windows\system32\config\systemprofile` et
// le chemin serait faux. Les huit tunnels déjà en service portent tous le chemin
// absolu ; on fait pareil. Le fichier de créance qu'il désigne est absolu aussi.
const CONFIG_TUNNEL = "C:/Users/Van Jean/.cloudflared/mip-config.yml";

module.exports = {
  apps: [
    {
      name: "mip",
      script: TSX,
      args: "src/index.ts",
      cwd: chemin.join(RACINE, "serveur"),
      env: {
        NODE_ENV: "production",
        // Le port : 8971, 8974 et 8975 sont déjà pris sur cette machine.
        MIP_PORT: "8976",
        // La base, dans son conteneur dédié.
        PGHOST: "127.0.0.1",
        PGPORT: "54329",
        PGUSER: "mip",
        PGPASSWORD: "mip",
        PGDATABASE: "mip_studio",
        // Le modèle du pré-remplissage. Local, toujours : rien de ce qui est
        // saisi ne sort de la machine.
        MIP_MODELE_URL: "http://127.0.0.1:1234/v1",
        MIP_MODELE: "qwen/qwen3.5-9b",
        // **MIP_EMPREINTE est volontairement absente.** Le site est public ; la
        // poser ici le refermerait derrière un mot de passe partagé. Voir
        // `.env.ferme` pour l'ancienne valeur, et le README pour le pourquoi.
      },
      // 512 Mo : le serveur tient dans une trentaine, et le pack du protocole
      // est en base, pas en mémoire. Un dépassement signalerait une fuite.
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      out_file: chemin.join(RACINE, "logs", "mip-out.log"),
      error_file: chemin.join(RACINE, "logs", "mip-err.log"),
      merge_logs: true,
      time: true,
    },
    {
      name: "mip-tunnel",
      script: CLOUDFLARED,
      args: ["tunnel", "--config", CONFIG_TUNNEL, "run"],
      cwd: RACINE,
      // Le binaire n'est pas du Node : PM2 doit le lancer tel quel.
      interpreter: "none",
      // **Aucun `env` ici, et c'est délibéré.** `TUNNEL_URL` traîne dans
      // l'environnement de cette machine, et `cloudflared tunnel ingress
      // validate` la refuse quand une configuration porte plusieurs règles
      // d'entrée. On pourrait croire qu'il faut la neutraliser — mais la vider
      // ne la retire pas, et les huit tunnels déjà en service sous PM2 tournent
      // avec elle posée. `run` la tolère là où `validate` la refuse.
      //
      // On se met donc dans les conditions exactes de ce qui fonctionne, plutôt
      // que d'inventer un réglage sur la foi d'un message d'erreur venu d'une
      // autre commande.
      autorestart: true,
      watch: false,
      out_file: chemin.join(RACINE, "logs", "tunnel-out.log"),
      error_file: chemin.join(RACINE, "logs", "tunnel-err.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
