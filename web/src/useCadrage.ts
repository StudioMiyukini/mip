// @id mip.web.cadrage.etat
// @role orchestration
// @layer ui
// @human L'état d'un cadrage : partagé entre le parcours PC et le parcours mobile
// @do tenir_l_etat_du_cadrage_et_ses_effets_pour_les_deux_parcours

import { useEffect, useMemo, useRef, useState } from "react";

import {
  compte,
  etatDe,
  texteDe,
  type Cadrage as TypeCadrage,
  type Etage,
  type Formulaire,
} from "./types";

const VIDE: TypeCadrage = {
  titre: "",
  demande: "",
  classe: "T3",
  mode: "BIG_STEPS",
  reponses: {},
  agents: [],
  skills: [],
  modules: [],
  certifications: [],
  formats: [],
  techniques: [],
};

/**
 * Tout ce qu'un cadrage sait faire, hors de toute mise en page.
 *
 * **Il existe parce qu'il y a deux parcours.** Le PC montre le formulaire entier
 * avec l'aperçu à côté ; le mobile avance section par section, l'aperçu dans un
 * tiroir. Ce sont deux écrans, mais **un seul comportement** : le même
 * pré-remplissage, le même calcul d'étages, la même règle de confirmation.
 *
 * Écrire deux fois cette logique, c'est se donner rendez-vous avec une
 * divergence. Ce dépôt en a déjà connu deux — l'affichage et l'assemblage des
 * questions, puis la liste blanche des documents — et les deux fois le défaut
 * était invisible jusqu'à ce qu'un utilisateur le rencontre.
 */
export function useCadrage(formulaire: Formulaire, surEnregistrement: () => void) {
  const [cadrage, setCadrage] = useState<TypeCadrage>(() => ({
    ...VIDE,
    // L'équipe cœur est active d'emblée ; la décocher est un choix, pas un
    // oubli. Bob ne sert qu'en parallélisation.
    agents: formulaire.agents.filter((a) => !a.optionnel).map((a) => a.code),
  }));
  const [prompt, setPrompt] = useState("");
  const [copie, setCopie] = useState(false);
  const [dit, setDit] = useState<string | null>(null);
  // On commence à l'étage 1, toujours. C'est tout l'objet de l'étagement : le
  // formulaire posait 21 à 32 questions d'un bloc, et un mur ne se termine pas.
  const [etage, setEtage] = useState<Etage>(1);

  /**
   * Les suggestions, demandées quand la demande cesse de bouger.
   *
   * **Elles ne remplacent jamais rien.** Une suggestion ne se pose que sur un
   * champ vide : écraser une réponse humaine par une proposition de modèle
   * serait le pire défaut possible de cette fonction.
   *
   * **Le formulaire ne l'attend pas.** Neuf secondes à chaud, quarante-cinq à
   * froid : bloquer la saisie là-dessus rendrait l'outil pénible pour un gain
   * de confort. Une panne ne produit ni message ni bandeau.
   */
  const derniereDemande = useRef<string>("");
  useEffect(() => {
    const demande = cadrage.demande.trim();
    if (demande.length < 25 || demande === derniereDemande.current) return;

    const attente = window.setTimeout(() => {
      derniereDemande.current = demande;
      fetch("/api/suggerer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demande }),
      })
        .then((r) => r.json())
        .then((d: { suggestions: Record<string, { valeur: string; etat: "suggere" }> }) => {
          const proposees = Object.entries(d.suggestions ?? {});
          if (!proposees.length) return;
          setCadrage((c) => {
            const reponses = { ...c.reponses };
            for (const [numero, suggestion] of proposees) {
              if (texteDe(reponses[numero]).trim()) continue; // déjà rempli : on ne touche pas
              reponses[numero] = suggestion;
            }
            return { ...c, reponses };
          });
        })
        .catch(() => {
          // Muet, volontairement : le pré-remplissage est un confort.
        });
    }, 1200);
    return () => window.clearTimeout(attente);
  }, [cadrage.demande]);

  // L'aperçu se recalcule au fil de la frappe, mais pas à chaque touche : le
  // prompt fait plusieurs milliers de caractères, et le reconstruire vingt fois
  // par seconde ferait sauter le curseur dans les zones de texte.
  const minuterie = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => {
      fetch("/api/apercu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cadrage),
      })
        .then((r) => r.json())
        .then((d: { prompt: string }) => setPrompt(d.prompt))
        .catch(() => {
          /* l'aperçu se retentera à la frappe suivante */
        });
    }, 250);
    return () => window.clearTimeout(minuterie.current);
  }, [cadrage]);

  /** Les sections dont au moins une question est à l'étage atteint. */
  const visibles = useMemo(
    () =>
      formulaire.sections
        .map((section) => ({
          ...section,
          questions: section.questions.filter((q) => {
            const niveau = q.etages[cadrage.classe];
            return niveau !== null && niveau !== undefined && niveau <= etage;
          }),
        }))
        .filter((section) => section.questions.length),
    [formulaire, cadrage.classe, etage],
  );

  /** Ce qui reste à remplir, par étage. Affiché sans être mis en avant. */
  const restantes = useMemo(() => {
    const par: Record<Etage, number> = { 1: 0, 2: 0, 3: 0 };
    for (const section of formulaire.sections) {
      for (const question of section.questions) {
        const niveau = question.etages[cadrage.classe];
        if (niveau && !compte(cadrage.reponses[question.numero])) par[niveau] += 1;
      }
    }
    return par;
  }, [formulaire, cadrage.classe, cadrage.reponses]);

  /** Combien de questions l'étage courant pose, et combien sont répondues. */
  const avancement = useMemo(() => {
    let posees = 0;
    for (const section of formulaire.sections) {
      for (const question of section.questions) {
        const niveau = question.etages[cadrage.classe];
        if (niveau && niveau <= etage) posees += 1;
      }
    }
    const restant = (Object.entries(restantes) as Array<[string, number]>)
      .filter(([niveau]) => Number(niveau) <= etage)
      .reduce((n, [, v]) => n + v, 0);
    return { posees, repondues: posees - restant, restant };
  }, [formulaire, cadrage.classe, etage, restantes]);

  /** Combien de suggestions attendent une relecture. */
  const aRelire = Object.values(cadrage.reponses).filter((r) => etatDe(r) === "suggere").length;
  const classe = formulaire.protocole.classification.find((c) => c.classe === cadrage.classe);
  const etageRempli = restantes[etage] === 0;

  /** Une saisie confirme toujours : on a écrit, donc on a répondu. */
  function repondre(numero: string, valeur: string): void {
    setCadrage((c) => ({
      ...c,
      reponses: { ...c.reponses, [numero]: { valeur, etat: "repondu" } },
    }));
  }

  function accepter(numero: string): void {
    setCadrage((c) => ({
      ...c,
      reponses: {
        ...c.reponses,
        [numero]: { valeur: texteDe(c.reponses[numero]), etat: "repondu" },
      },
    }));
  }

  function effacer(numero: string): void {
    setCadrage((c) => {
      const reponses = { ...c.reponses };
      delete reponses[numero];
      return { ...c, reponses };
    });
  }

  function copier(): void {
    navigator.clipboard.writeText(prompt);
    setCopie(true);
    window.setTimeout(() => setCopie(false), 2000);
  }

  /**
   * Enregistrer — la seule fonction qui exige un compte.
   *
   * Le refus dit *pourquoi*, et reste une invitation : sans compte on n'a rien
   * perdu, le prompt est sous les yeux et le bouton « Copier » est à côté.
   */
  async function enregistrer(): Promise<void> {
    const reponse = await fetch("/api/cadrages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cadrage),
    });
    if (reponse.status === 401) {
      setDit("Il faut un compte pour garder ce cadrage — le prompt reste copiable.");
      return;
    }
    const cree = await reponse.json();
    setDit(cree.id ? "Cadrage enregistré." : "L'enregistrement a échoué.");
    if (cree.id) surEnregistrement();
  }

  return {
    cadrage,
    setCadrage,
    prompt,
    jetons: Math.round(prompt.length / 4),
    copie,
    dit,
    etage,
    setEtage,
    visibles,
    restantes,
    avancement,
    aRelire,
    classe,
    etageRempli,
    repondre,
    accepter,
    effacer,
    copier,
    enregistrer,
  };
}

export type EtatCadrage = ReturnType<typeof useCadrage>;
