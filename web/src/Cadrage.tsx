// @id mip.web.cadrage
// @role ui
// @layer ui
// @human La page de cadrage : le formulaire par étages, et le prompt qu'il produit
// @do remplir_un_cadrage_par_etages_et_en_voir_sortir_le_prompt

import { useEffect, useMemo, useRef, useState } from "react";

import { Champ, Suggestion } from "./Champ";
import { Etages, Palier } from "./Etages";
import { Tags } from "./Tags";
import { TagsGroupes } from "./TagsGroupes";
import {
  compte,
  etatDe,
  texteDe,
  type Cadrage as TypeCadrage,
  type Etage,
  type Formulaire,
  type Question,
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

interface Props {
  formulaire: Formulaire;
  connecte: boolean;
  /** Rechargé après un enregistrement, pour que le compteur du flanc suive. */
  surEnregistrement: () => void;
}

export function Cadrage({ formulaire, connecte, surEnregistrement }: Props) {
  const [cadrage, setCadrage] = useState<TypeCadrage>(() => ({
    ...VIDE,
    // L'équipe cœur est active d'emblée ; la décocher est un choix, pas un
    // oubli. Bob ne sert qu'en parallélisation.
    agents: formulaire.agents.filter((a) => !a.optionnel).map((a) => a.code),
  }));
  const [prompt, setPrompt] = useState("");
  const [copie, setCopie] = useState(false);
  const [dit, setDit] = useState<string | null>(null);
  // On commence à l'étage 1, toujours. C'est tout l'objet de la refonte : le
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
   * froid : bloquer la saisie là-dessus rendrait l'outil pénible pour un gain de
   * confort. Une panne ne produit ni message ni bandeau.
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

  /** Les questions visibles : celles dont l'étage est atteint. */
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
      reponses: { ...c.reponses, [numero]: { valeur: texteDe(c.reponses[numero]), etat: "repondu" } },
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
    setDit(cree.id ? "cadrage enregistré" : "l'enregistrement a échoué");
    if (cree.id) surEnregistrement();
  }

  function rendreQuestion(question: Question) {
    const reponse = cadrage.reponses[question.numero];
    const suggere = etatDe(reponse) === "suggere";
    return (
      <div className={suggere ? "question a-relire" : "question"} key={question.numero}>
        <label className="libelle" htmlFor={`q-${question.numero}`}>
          <span className="numero">{question.numero}</span>
          {question.texte}
        </label>
        {question.aide && <span className="aide">{question.aide}</span>}
        <Champ
          question={question}
          reponse={reponse}
          surSaisie={(valeur) => repondre(question.numero, valeur)}
        />
        {suggere && (
          <Suggestion
            surAcceptation={() => accepter(question.numero)}
            surRejet={() => effacer(question.numero)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="cadrage-page">
      <header className="scene-tete">
        <div>
          <h1>Nouveau cadrage</h1>
          <p className="explication">
            Décrivez votre projet, répondez à quatre questions, repartez avec un prompt.
          </p>
        </div>
      </header>

      {aRelire > 0 && (
        <p className="a-relire-bandeau">
          <strong>{aRelire}</strong> réponse{aRelire > 1 ? "s" : ""} proposée
          {aRelire > 1 ? "s" : ""} à partir de votre demande — <em>à relire avant de
          compter</em>. Une proposition n'est pas une réponse : elle n'entre pas dans le
          prompt tant que vous ne l'avez pas confirmée.
        </p>
      )}

      <Etages etage={etage} surChangement={setEtage} restantes={restantes} />

      <div className="colonnes">
        <form className="formulaire" onSubmit={(e) => e.preventDefault()}>
          <section className="bloc">
            <h3>Votre projet</h3>
            <p className="explication">
              Décrivez-le comme vous le diriez à quelqu'un. Le reste part de là.
            </p>
            <label className="ligne">
              <span>Un titre court</span>
              <input
                className="controle"
                value={cadrage.titre}
                onChange={(e) => setCadrage({ ...cadrage, titre: e.target.value })}
                placeholder="ex. une appli pour suivre mes lectures"
              />
            </label>
            <textarea
              className="controle zone"
              rows={4}
              value={cadrage.demande}
              onChange={(e) => setCadrage({ ...cadrage, demande: e.target.value })}
              placeholder="Ce que vous voulez construire, en quelques phrases."
            />
          </section>

          <TagsGroupes
            titre="Ce que ça doit produire"
            explication="Le protocole ne le demande pas, et c'est un angle mort : un même besoin donne une application ou un document. Sans réponse, l'agent prend la première hypothèse venue."
            choix={formulaire.formats}
            actifs={cadrage.formats}
            surChangement={(formats) => setCadrage({ ...cadrage, formats })}
          />

          <TagsGroupes
            titre="Avec quoi"
            explication="Laissez vide si ce n'est pas du code, ou cochez « À décider » pour que l'agent propose au lieu de supposer."
            choix={formulaire.techniques}
            actifs={cadrage.techniques}
            surChangement={(techniques) => setCadrage({ ...cadrage, techniques })}
          />

          {visibles.map((section) => (
            <section className="bloc" key={section.numero}>
              <header className="bloc-tete">
                <h3>{section.titre}</h3>
                {section.methode && <span className="compte">{section.methode}</span>}
              </header>
              {section.deduite && (
                <p className="explication">
                  Normalement déduite de votre demande. La remplir évite à l'agent de deviner.
                </p>
              )}
              {section.questions.map(rendreQuestion)}
            </section>
          ))}

          {etageRempli && (
            <Palier
              etage={etage}
              surCopie={copier}
              surSuite={() => setEtage((e) => Math.min(3, e + 1) as Etage)}
            />
          )}

          {etage >= 3 && (
            <>
              <section className="bloc">
                <h3>Classification et conduite</h3>
                <p className="explication">
                  La classe décide des phases <em>et</em> du nombre de questions posées. En
                  cas de doute, le protocole dit de monter d'un cran.
                </p>
                <label className="ligne">
                  <span>Ampleur</span>
                  <select
                    className="controle"
                    value={cadrage.classe}
                    onChange={(e) => setCadrage({ ...cadrage, classe: e.target.value })}
                  >
                    {formulaire.protocole.classification.map((c) => (
                      <option key={c.classe} value={c.classe}>
                        {c.classe} — {c.critere}
                      </option>
                    ))}
                  </select>
                </label>
                {classe && <p className="note">Phases : {classe.phases.join(" → ")}</p>}

                <label className="ligne">
                  <span>Jusqu'où l'agent avance seul</span>
                  <select
                    className="controle"
                    value={cadrage.mode}
                    onChange={(e) => setCadrage({ ...cadrage, mode: e.target.value })}
                  >
                    {formulaire.protocole.modes.map((m) => (
                      <option key={m.mode} value={m.mode}>
                        {m.mode} — {m.libelle}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="note">
                  {formulaire.protocole.modes.find((m) => m.mode === cadrage.mode)?.description}
                </p>
              </section>

              <Tags
                titre="L'équipe"
                explication="Chaque rôle est un prompt chargé au moment de sa phase. L'équipe cœur est active par défaut."
                elements={formulaire.agents.map((a) => ({
                  code: a.code,
                  libelle: a.nom,
                  detail: `${a.role} · ${a.phases}`,
                  reserve: a.optionnel ? "optionnel" : undefined,
                  jetons: a.jetons,
                }))}
                actifs={cadrage.agents}
                surChangement={(agents) => setCadrage({ ...cadrage, agents })}
              />

              <Tags
                titre="Les savoir-faire"
                explication="Ceux marqués « stack d'origine » viennent d'un projet Rust — les activer ailleurs demande de vérifier qu'ils s'appliquent."
                elements={formulaire.skills.map((s) => ({
                  code: s.code,
                  libelle: s.code.replace(/^miyukini-/, ""),
                  detail: s.description,
                  reserve: s.generique ? undefined : "stack d'origine",
                  jetons: s.jetons,
                }))}
                actifs={cadrage.skills}
                surChangement={(skills) => setCadrage({ ...cadrage, skills })}
              />

              <Tags
                titre="Les modules de phase"
                explication="À charger au début de la phase correspondante, jamais tous au départ."
                elements={formulaire.modules.map((m) => ({
                  code: m.code,
                  libelle: m.code,
                  detail: m.fichier,
                  jetons: m.jetons,
                }))}
                actifs={cadrage.modules}
                surChangement={(modules) => setCadrage({ ...cadrage, modules })}
              />

              <Tags
                titre="Les référentiels"
                explication="ISO, ITIL, RGPD… à joindre quand la séquence les touche. Jamais injectés en entier."
                elements={formulaire.certifications.map((c) => ({
                  code: c.code,
                  libelle: c.code,
                  detail: `${c.fiches} fiches · ${c.ko} Ko`,
                }))}
                actifs={cadrage.certifications}
                surChangement={(certifications) => setCadrage({ ...cadrage, certifications })}
              />
            </>
          )}
        </form>

        <aside className="apercu">
          <header className="bloc-tete">
            <h3>Votre prompt</h3>
            <span className="compte">
              ≈ {Math.round(prompt.length / 4).toLocaleString("fr-FR")} jetons
            </span>
          </header>
          <div className="boutons">
            <button type="button" className="principal" onClick={copier}>
              {copie ? "copié" : "Copier"}
            </button>
            <button type="button" onClick={enregistrer}>
              {connecte ? "Enregistrer" : "Enregistrer…"}
            </button>
          </div>
          {dit && <p className="note">{dit}</p>}
          <pre className="prompt">{prompt}</pre>
        </aside>
      </div>
    </div>
  );
}
