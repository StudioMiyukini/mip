-- @id mip.bd.schema
-- @do definir_le_schema_du_cadrage
-- @role donnee
-- @layer infra
-- @human Le schéma : le protocole d'un côté, les cadrages de l'autre

-- **Deux moitiés qui ne se mélangent pas.**
--
-- Les tables du protocole (section, question, agent, skill, module,
-- certification) sont *dérivées* : elles se reconstruisent entièrement depuis
-- le pack, et l'ingestion les remplace sans état d'âme. Rien de ce qu'un humain
-- a saisi n'y vit.
--
-- La table `cadrage` est l'inverse : elle ne se régénère pas. C'est le travail
-- de quelqu'un. Une ré-extraction du protocole ne doit jamais pouvoir la
-- toucher — d'où l'absence de clé étrangère depuis `cadrage` vers `question` :
-- un cadrage rempli reste lisible même si une question disparaît du protocole.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── le protocole, dérivé du pack ────────────────────────────────────────

DROP TABLE IF EXISTS question CASCADE;
DROP TABLE IF EXISTS section CASCADE;
DROP TABLE IF EXISTS agent CASCADE;
DROP TABLE IF EXISTS skill CASCADE;
DROP TABLE IF EXISTS module CASCADE;
DROP TABLE IF EXISTS certification CASCADE;
DROP TABLE IF EXISTS protocole CASCADE;

CREATE TABLE section (
  numero  TEXT PRIMARY KEY,
  titre   TEXT NOT NULL,
  -- La méthode de conception dont la section est tirée. Affichée à qui remplit :
  -- savoir qu'on est dans les « chapeaux jaune/noir » explique pourquoi on
  -- demande à la fois le bénéfice et le risque.
  methode TEXT NOT NULL DEFAULT '',
  -- Vrai pour la section 0 : elle se déduit du premier prompt, on ne la pose pas.
  deduite BOOLEAN NOT NULL DEFAULT FALSE,
  rang    INTEGER NOT NULL
);

CREATE TABLE question (
  numero      TEXT PRIMARY KEY,
  section     TEXT NOT NULL REFERENCES section(numero) ON DELETE CASCADE,
  texte       TEXT NOT NULL,
  -- La classe minimale à partir de laquelle la question est posée. C'est un
  -- rang, pas une appartenance : « depuis T4 » veut dire T4 et T5.
  depuis      TEXT NOT NULL DEFAULT 'T3',
  optionnelle BOOLEAN NOT NULL DEFAULT FALSE,
  champ       TEXT NOT NULL DEFAULT 'texte',
  options     JSONB NOT NULL DEFAULT '[]'::jsonb,
  aide        TEXT NOT NULL DEFAULT '',
  rang        INTEGER NOT NULL
);
CREATE INDEX question_section ON question(section, rang);

CREATE TABLE agent (
  code      TEXT PRIMARY KEY,
  nom       TEXT NOT NULL,
  role      TEXT NOT NULL DEFAULT '',
  phases    TEXT NOT NULL DEFAULT '',
  optionnel BOOLEAN NOT NULL DEFAULT FALSE,
  jetons    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE skill (
  code        TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  -- Faux pour ce qui est lié à la stack d'origine (Rust, Dioxus, MGE). On les
  -- garde — on ne juge pas à la place de qui installe — mais on les marque.
  generique   BOOLEAN NOT NULL DEFAULT TRUE,
  jetons      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE module (
  code    TEXT PRIMARY KEY,
  fichier TEXT NOT NULL,
  jetons  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE certification (
  code   TEXT PRIMARY KEY,
  titre  TEXT NOT NULL,
  fiches INTEGER NOT NULL DEFAULT 0,
  ko     INTEGER NOT NULL DEFAULT 0
);

-- Classification, invariants, artefacts, modes : des tables de référence
-- courtes, hétérogènes, et qu'on ne requête jamais autrement qu'en entier.
-- Une table par forme coûterait quatre jointures pour un affichage.
CREATE TABLE protocole (
  cle    TEXT PRIMARY KEY,
  valeur JSONB NOT NULL
);

-- ── les comptes ─────────────────────────────────────────────────────────

-- **Le minimum de données possible.** Une adresse et une empreinte. Pas de nom,
-- pas de téléphone, pas de traceur, pas de date de dernière visite. Ce qu'on ne
-- collecte pas ne fuit pas, ne se supprime pas, et ne se déclare pas.
--
-- Le compte sert à **sauvegarder**, jamais à entrer : le formulaire fonctionne
-- sans inscription, et c'est le critère de sortie du produit.

CREATE TABLE IF NOT EXISTS utilisateur (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Normalisée en minuscules avant insertion : sans ça « Jean@Exemple.FR » et
  -- « jean@exemple.fr » sont deux comptes, et le second échoue en disant que
  -- l'adresse est prise.
  adresse    TEXT NOT NULL UNIQUE,
  -- `sel$empreinte`. Le sel est propre au compte : un sel fixe permettrait de
  -- casser tous les comptes d'un coup avec une seule table précalculée.
  empreinte  TEXT NOT NULL,
  cree_le    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── le travail, qui ne se régénère pas ──────────────────────────────────

CREATE TABLE IF NOT EXISTS cadrage (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre          TEXT NOT NULL,
  -- La demande brute, telle qu'elle a été formulée. C'est elle qui alimente la
  -- section 0 : ce que l'agent doit déduire avant de poser une question.
  demande        TEXT NOT NULL DEFAULT '',
  classe         TEXT NOT NULL DEFAULT 'T3',
  mode           TEXT NOT NULL DEFAULT 'BIG_STEPS',
  -- `{ "1.1": "…", "4.3": "C3 — moyenne" }`. Sans clé étrangère : un cadrage
  -- rempli doit rester lisible même si le protocole change sous lui.
  reponses       JSONB NOT NULL DEFAULT '{}'::jsonb,
  agents         TEXT[] NOT NULL DEFAULT '{}',
  skills         TEXT[] NOT NULL DEFAULT '{}',
  modules        TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  -- Le prompt est **stocké**, pas seulement recalculé. Un cadrage qu'on rouvre
  -- six mois plus tard doit rendre le texte qui a réellement servi, même si
  -- l'assembleur a changé entre-temps.
  prompt         TEXT NOT NULL DEFAULT '',
  cree_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
  modifie_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- **`ON DELETE CASCADE`, et c'est une obligation, pas une commodité.**
  -- Supprimer un compte doit supprimer ce qu'il a écrit — pour de bon, pas
  -- marqué effacé. Un cadrage décrit un projet, parfois avant qu'il existe.
  --
  -- `NULL` couvre deux cas : les cadrages d'avant les comptes, et ceux d'un
  -- visiteur qui n'en a pas. Ni les uns ni les autres ne sont publics — ils
  -- n'appartiennent à personne, donc personne ne les lit par l'interface.
  utilisateur    UUID REFERENCES utilisateur(id) ON DELETE CASCADE
);
-- **L'ordre compte, et il a été appris en le cassant.** Sur une base existante,
-- le `CREATE TABLE IF NOT EXISTS` ci-dessus ne fait rien : la colonne
-- `utilisateur` n'existe donc pas encore, et un index qui la référence échoue
-- avant que le `ALTER` ait pu l'ajouter. La migration passe d'abord.
ALTER TABLE cadrage ADD COLUMN IF NOT EXISTS utilisateur UUID REFERENCES utilisateur(id) ON DELETE CASCADE;

-- Ce que le projet produit, et avec quoi. Le protocole ne le demandait pas —
-- c'est un angle mort : un même besoin donne une application React ou un
-- document Word, et rien d'autre dans le cadrage ne le disait.
ALTER TABLE cadrage ADD COLUMN IF NOT EXISTS formats    TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE cadrage ADD COLUMN IF NOT EXISTS techniques TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS cadrage_recents ON cadrage(modifie_le DESC);
CREATE INDEX IF NOT EXISTS cadrage_par_utilisateur ON cadrage(utilisateur, modifie_le DESC);
