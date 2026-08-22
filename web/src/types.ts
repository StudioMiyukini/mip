// @id mip.web.types
// @role donnee
// @layer ui
// @human Le contrat entre le serveur et le formulaire
// @do decrire_les_donnees_echangees_avec_le_serveur

export type TypeChamp = "texte" | "ligne" | "liste" | "cases" | "echelle" | "oui_non";

/** Les trois étages du formulaire. `null` : la question n'est pas posée ici. */
export type Etage = 1 | 2 | 3;

export interface Question {
  numero: string;
  section: string;
  texte: string;
  /** La classe minimale à partir de laquelle la question est posée. */
  depuis: string;
  optionnelle: boolean;
  champ: TypeChamp;
  options: string[];
  aide: string;
  rang: number;
  /**
   * L'étage de la question **à chaque classe**, calculé par le serveur.
   *
   * Le client lit dedans, il ne recalcule pas. Deux calculs séparés divergent,
   * et c'est déjà arrivé dans ce dépôt avec `retenue()`.
   */
  etages: Record<string, Etage | null>;
}

export interface Section {
  numero: string;
  titre: string;
  methode: string;
  /** La section 0 se déduit de la demande ; on la présente autrement. */
  deduite: boolean;
  rang: number;
  questions: Question[];
}

export interface Agent {
  code: string;
  nom: string;
  role: string;
  /** L'intitulé brut du protocole : « P0 T9, P6 ». */
  phases: string;
  optionnel: boolean;
  jetons: number;
  /**
   * Ce que la personne fait, en français. Ajouté par le serveur depuis son
   * glossaire — le protocole extrait ne porte qu'un intitulé de poste.
   * Facultatif : un agent inconnu du glossaire garde son seul intitulé plutôt
   * que de recevoir un rôle inventé.
   */
  resume?: string;
  /** Quand il vaut la peine de l'activer. C'est ce champ qui permet de décocher. */
  quand?: string;
  /** « P0 T9, P6 » déplié en « P0 temps 9, P6 ». */
  phases_claires?: string;
}

export interface Skill {
  code: string;
  description: string;
  /** Faux quand le skill est lié à la stack d'origine. */
  generique: boolean;
  jetons: number;
}

export interface Module {
  code: string;
  fichier: string;
  jetons: number;
}

export interface Certification {
  code: string;
  titre: string;
  fiches: number;
  ko: number;
}

export interface Choix {
  code: string;
  libelle: string;
  detail?: string;
  /** Le groupe d'affichage — les tags se rangent par sous-titre. */
  groupe: string;
}

export interface Formulaire {
  sections: Section[];
  protocole: {
    classification: Array<{ classe: string; critere: string; phases: string[] }>;
    equipe: Agent[];
    artefacts: Array<{ artefact: string; chemin: string; phase: string }>;
    invariants: Array<{ numero: string; invariant: string; portee: string }>;
    modes: Array<{ mode: string; libelle: string; description: string }>;
  };
  agents: Agent[];
  skills: Skill[];
  modules: Module[];
  certifications: Certification[];
  essentielles: string[];
  formats: Choix[];
  techniques: Choix[];
}

/**
 * L'état d'une réponse.
 *
 * **`suggere` n'est pas une réponse.** Le modèle qui pré-remplit invente — c'est
 * mesuré, pas supposé — et une invention est plausible, bien écrite, et occupe
 * le champ exactement comme une réponse. Tant que personne ne l'a confirmée,
 * elle ne compte pas.
 */
export type Etat = "repondu" | "suggere";

export interface Reponse {
  valeur: string;
  etat: Etat;
}

export type ReponseBrute = string | Reponse;

export interface Cadrage {
  titre: string;
  demande: string;
  classe: string;
  mode: string;
  reponses: Record<string, ReponseBrute>;
  agents: string[];
  skills: string[];
  modules: string[];
  certifications: string[];
  /** Ce que le projet produit. */
  formats: string[];
  /** Avec quoi. */
  techniques: string[];
}

/** Le texte d'une réponse, quel que soit son état. */
export function texteDe(reponse: ReponseBrute | undefined): string {
  if (reponse === undefined) return "";
  return typeof reponse === "string" ? reponse : reponse.valeur;
}

/** L'état d'une réponse. Une chaîne nue a été écrite par un humain. */
export function etatDe(reponse: ReponseBrute | undefined): Etat | null {
  if (reponse === undefined) return null;
  return typeof reponse === "string" ? "repondu" : reponse.etat;
}

/** La réponse compte-t-elle ? Une suggestion non confirmée, non. */
export function compte(reponse: ReponseBrute | undefined): boolean {
  return etatDe(reponse) === "repondu" && texteDe(reponse).trim() !== "";
}
