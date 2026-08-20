// @id mip.web.types
// @role donnee
// @layer ui
// @human Le contrat entre le serveur et le formulaire
// @do decrire_les_donnees_echangees_avec_le_serveur

export type TypeChamp = "texte" | "ligne" | "liste" | "cases" | "echelle" | "oui_non";

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
  phases: string;
  optionnel: boolean;
  jetons: number;
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
}

export interface Cadrage {
  titre: string;
  demande: string;
  classe: string;
  mode: string;
  reponses: Record<string, string>;
  agents: string[];
  skills: string[];
  modules: string[];
  certifications: string[];
}

const CLASSES = ["T1", "T2", "T3", "T4", "T5"];

/** La question est-elle posée à cette classe ? « depuis T4 » veut dire T4 et T5. */
export function retenue(question: Question, classe: string): boolean {
  return CLASSES.indexOf(classe) >= CLASSES.indexOf(question.depuis);
}
