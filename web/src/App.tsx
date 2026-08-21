// @id mip.web
// @role ui
// @layer ui
// @human Le formulaire de cadrage, par étages, et le prompt qu'il produit
// @do remplir_un_cadrage_par_etages_et_en_voir_sortir_le_prompt

import { useEffect, useMemo, useRef, useState } from "react";

import { Champ, Suggestion } from "./Champ";
import { Compte, type EtatCompte } from "./Compte";
import { Document } from "./Document";
import { Etages, Palier } from "./Etages";
import { Pied } from "./Pied";
import { Porte } from "./Porte";
import { Tags } from "./Tags";
import {
  compte,
  etatDe,
  texteDe,
  type Cadrage,
  type Etage,
  type Formulaire,
  type Question,
} from "./types";

const VIDE: Cadrage = {
  titre: "",
  demande: "",
  classe: "T3",
  mode: "BIG_STEPS",
  reponses: {},
  agents: [],
  skills: [],
  modules: [],
  certifications: [],
};

export function App() {
  const [formulaire, setFormulaire] = useState<Formulaire | null>(null);
  const [cadrage, setCadrage] = useState<Cadrage>(VIDE);
  const [prompt, setPrompt] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [enregistre, setEnregistre] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<boolean | null>(null);
  const [compteEtat, setCompteEtat] = useState<EtatCompte>({ connecte: false });
  // On commence à l'étage 1, toujours. C'est tout l'objet de la refonte : le
  // formulaire posait 21 à 32 questions d'un bloc, et un mur ne se termine pas.
  const [etage, setEtage] = useState<Etage>(1);

  /** L'état du compte. Rechargé après chaque inscription, connexion ou effacement. */
  function relireLeCompte(): void {
    fetch("/api/compte")
      .then((r) => r.json())
      .then((d: EtatCompte) => setCompteEtat(d))
      .catch(() => setCompteEtat({ connecte: false }));
  }

  useEffect(relireLeCompte, []);

  useEffect(() => {
    fetch("/api/porte")
      .then((r) => r.json())
      .then((d: { ouverte: boolean }) => setOuverte(d.ouverte))
      .catch(() => setOuverte(true));
  }, []);

  useEffect(() => {
    if (ouverte !== true) return;
    fetch("/api/formulaire")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`formulaire : ${r.status}`))))
      .then((donnees: Formulaire) => {
        setFormulaire(donnees);
        // L'équipe cœur est active d'emblée ; la décocher est un choix, pas un
        // oubli. Bob ne sert qu'en parallélisation.
        setCadrage((c) => ({
          ...c,
          agents: donnees.agents.filter((a) => !a.optionnel).map((a) => a.code),
        }));
      })
      .catch((e) => setErreur(String(e)));
  }, [ouverte]);

  /**
   * Les suggestions, demandées quand la demande cesse de bouger.
   *
   * **Elles ne remplacent jamais rien.** Une suggestion ne se pose que sur un
   * champ vide : si l'on a déjà répondu — ou déjà confirmé une suggestion
   * précédente — elle est écartée en silence. Écraser une réponse humaine par
   * une proposition de modèle serait le pire défaut possible de cette fonction.
   *
   * **Le formulaire ne l'attend pas.** 7 s à chaud, 55 s à froid : bloquer la
   * saisie sur cette réponse rendrait l'outil pénible pour un gain de confort.
   * Une panne du modèle ne produit ni message ni bandeau — la liste est vide, et
   * c'est tout.
   */
  const suggestionEnCours = useRef<string>("");
  useEffect(() => {
    if (!formulaire) return;
    const demande = cadrage.demande.trim();
    if (demande.length < 25 || demande === suggestionEnCours.current) return;

    const attente = window.setTimeout(() => {
      suggestionEnCours.current = demande;
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
  }, [cadrage.demande, formulaire]);

  // L'aperçu se recalcule au fil de la frappe, mais pas à chaque touche : le
  // prompt fait plusieurs milliers de caractères, et le reconstruire vingt fois
  // par seconde ferait sauter le curseur dans les zones de texte.
  const minuterie = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!formulaire) return;
    window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => {
      fetch("/api/apercu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cadrage),
      })
        .then((r) => r.json())
        .then((d: { prompt: string }) => setPrompt(d.prompt))
        .catch((e) => setErreur(String(e)));
    }, 250);
    return () => window.clearTimeout(minuterie.current);
  }, [cadrage, formulaire]);

  /** Les questions visibles : celles dont l'étage est atteint. */
  const visibles = useMemo(() => {
    if (!formulaire) return [];
    return formulaire.sections
      .map((section) => ({
        ...section,
        questions: section.questions.filter((q) => {
          const niveau = q.etages[cadrage.classe];
          return niveau !== null && niveau !== undefined && niveau <= etage;
        }),
      }))
      .filter((section) => section.questions.length);
  }, [formulaire, cadrage.classe, etage]);

  /** Ce qui reste à remplir, par étage. Affiché sans être mis en avant. */
  const restantes = useMemo(() => {
    const par: Record<Etage, number> = { 1: 0, 2: 0, 3: 0 };
    if (!formulaire) return par;
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

  // Une page de documentation se sert avant tout le reste : elle n'a besoin ni
  // de la porte, ni du formulaire, ni du compte. Un routeur complet serait trois
  // dépendances pour trois pages.
  const chemin = window.location.pathname.replace(/^\/|\/$/g, "");
  if (chemin && chemin !== "index.html") return <Document nom={chemin} />;

  if (ouverte === null) return <main className="page"><p className="explication">…</p></main>;
  if (ouverte === false) return <Porte surOuverture={() => setOuverte(true)} />;

  if (erreur) {
    return (
      <main className="page">
        <div className="alerte">
          <strong>Le serveur ne répond pas.</strong>
          <p>{erreur}</p>
          <p className="explication">
            Vérifier que la base est montée (<code>npm run bd:monter</code>), que le schéma est
            posé (<code>npm run bd:schema</code>) et que le pack a été ingéré (
            <code>npm run ingerer</code>).
          </p>
        </div>
      </main>
    );
  }

  if (!formulaire) return <main className="page"><p className="explication">Chargement…</p></main>;

  const classe = formulaire.protocole.classification.find((c) => c.classe === cadrage.classe);
  const etageRempli = restantes[etage] === 0;

  /** Une saisie confirme toujours : on a écrit, donc on a répondu. */
  function repondre(numero: string, valeur: string): void {
    setCadrage((c) => ({
      ...c,
      reponses: { ...c.reponses, [numero]: { valeur, etat: "repondu" } },
    }));
  }

  /** Accepter une suggestion sans la retoucher. */
  function accepter(numero: string): void {
    setCadrage((c) => {
      const actuelle = c.reponses[numero];
      return {
        ...c,
        reponses: { ...c.reponses, [numero]: { valeur: texteDe(actuelle), etat: "repondu" } },
      };
    });
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
   * Le refus doit dire *pourquoi*, et rester une invitation : sans compte, on
   * n'a rien perdu, on a toujours son prompt sous les yeux et le bouton
   * « Copier » à côté.
   */
  async function enregistrer(): Promise<void> {
    const reponse = await fetch("/api/cadrages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cadrage),
    });
    if (reponse.status === 401) {
      setEnregistre("Il faut un compte pour garder ce cadrage — le prompt reste copiable.");
      return;
    }
    const cree = await reponse.json();
    setEnregistre(cree.id ? "cadrage enregistré" : "l'enregistrement a échoué");
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
    <div className="page">
      <header className="entete">
        <div>
          <h1>MIP Studio</h1>
          <p className="explication">
            Répondez à quelques questions. Repartez avec un prompt qui fait travailler
            votre IA correctement.
          </p>
        </div>
        <Compte etat={compteEtat} surChangement={relireLeCompte} />
      </header>

      {aRelire > 0 && (
        <p className="a-relire-bandeau">
          <strong>{aRelire}</strong> réponse{aRelire > 1 ? "s" : ""} proposée
          {aRelire > 1 ? "s" : ""} à partir de votre demande —{" "}
          <em>à relire avant de compter</em>. Une proposition n'est pas une réponse : elle
          n'entre pas dans le prompt tant que vous ne l'avez pas confirmée.
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

          {/* ── l'étage 3 : la conduite et ce qu'on charge ─────────────── */}
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
              Enregistrer
            </button>
            {enregistre && <span className="note">{enregistre}</span>}
          </div>
          <pre className="prompt">{prompt}</pre>
        </aside>
      </div>

      <Pied />
    </div>
  );
}
