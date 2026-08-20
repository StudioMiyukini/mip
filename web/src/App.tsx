// @id mip.web
// @role ui
// @layer ui
// @human Le formulaire de cadrage, et le prompt qu'il produit
// @do remplir_un_cadrage_et_en_voir_sortir_le_prompt

import { useEffect, useMemo, useRef, useState } from "react";

import { Champ } from "./Champ";
import { Porte } from "./Porte";
import { Tags } from "./Tags";
import { retenue, type Cadrage, type Formulaire } from "./types";

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
  // `null` tant qu'on ne sait pas : afficher le formulaire puis le remplacer
  // par un ecran de mot de passe ferait clignoter la page a chaque chargement.
  const [ouverte, setOuverte] = useState<boolean | null>(null);

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
        // Les agents non optionnels sont actifs d'emblée : ils constituent
        // l'équipe cœur du protocole, et les décocher est un choix, pas un
        // oubli. Bob, lui, ne sert qu'en parallélisation.
        setCadrage((c) => ({
          ...c,
          agents: donnees.agents.filter((a) => !a.optionnel).map((a) => a.code),
        }));
      })
      .catch((e) => setErreur(String(e)));
  }, [ouverte]);

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

  const posees = useMemo(() => {
    if (!formulaire) return [];
    return formulaire.sections
      .map((section) => ({
        ...section,
        questions: section.questions.filter((q) => retenue(q, cadrage.classe)),
      }))
      .filter((section) => section.questions.length);
  }, [formulaire, cadrage.classe]);

  const total = posees.reduce((somme, s) => somme + s.questions.length, 0);
  const remplies = posees.reduce(
    (somme, s) => somme + s.questions.filter((q) => (cadrage.reponses[q.numero] ?? "").trim()).length,
    0,
  );

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

  function repondre(numero: string, valeur: string): void {
    setCadrage((c) => ({ ...c, reponses: { ...c.reponses, [numero]: valeur } }));
  }

  async function enregistrer(): Promise<void> {
    const reponse = await fetch("/api/cadrages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cadrage),
    });
    const enregistré = await reponse.json();
    setEnregistre(enregistré.id);
  }

  return (
    <div className="page">
      <header className="entete">
        <div>
          <h1>MIP Studio</h1>
          <p className="explication">
            Le cadrage d'une séquence, et le prompt initial qu'il produit.
          </p>
        </div>
        <div className="avancement">
          <strong>
            {remplies} / {total}
          </strong>
          <span>questions renseignées</span>
        </div>
      </header>

      <div className="colonnes">
        <form className="formulaire" onSubmit={(e) => e.preventDefault()}>
          {/* ── l'identité de la séquence ────────────────────────────── */}
          <section className="bloc">
            <h3>La demande</h3>
            <p className="explication">
              Ce que tu veux faire, en tes mots. C'est de là que se déduit la section
              ORIENTER — celle qu'on ne pose pas.
            </p>
            <label className="ligne">
              <span>Titre de la séquence</span>
              <input
                className="controle"
                value={cadrage.titre}
                onChange={(e) => setCadrage({ ...cadrage, titre: e.target.value })}
                placeholder="ex. brancher l'agenda en lecture et écriture"
              />
            </label>
            <textarea
              className="controle zone"
              rows={4}
              value={cadrage.demande}
              onChange={(e) => setCadrage({ ...cadrage, demande: e.target.value })}
              placeholder="La demande telle que tu la formulerais à quelqu'un."
            />
          </section>

          {/* ── classe et mode ────────────────────────────────────────── */}
          <section className="bloc">
            <h3>Classification et conduite</h3>
            <p className="explication">
              La classe décide des phases <em>et</em> du nombre de questions posées. En
              cas de doute, le protocole dit de monter d'un cran.
            </p>
            <label className="ligne">
              <span>Classe</span>
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
              <span>Mode d'autonomie</span>
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

          {/* ── le questionnaire ──────────────────────────────────────── */}
          {posees.map((section) => (
            <section className="bloc" key={section.numero}>
              <header className="bloc-tete">
                <h3>{section.titre}</h3>
                {section.methode && <span className="compte">{section.methode}</span>}
              </header>
              {section.deduite && (
                <p className="explication">
                  Cette section n'est normalement pas posée — elle se déduit de la demande.
                  La remplir ici évite à l'agent de deviner.
                </p>
              )}
              {section.questions.map((question) => (
                <label className="question" key={question.numero}>
                  <span className="libelle">
                    <span className="numero">{question.numero}</span>
                    {question.texte}
                    {question.optionnelle && <em className="option"> · optionnelle</em>}
                  </span>
                  {question.aide && <span className="aide">{question.aide}</span>}
                  <Champ
                    question={question}
                    valeur={cadrage.reponses[question.numero] ?? ""}
                    surChangement={(valeur) => repondre(question.numero, valeur)}
                  />
                </label>
              ))}
            </section>
          ))}

          {/* ── ce qu'on active ───────────────────────────────────────── */}
          <Tags
            titre="L'équipe"
            explication="Chaque agent est un prompt chargé au moment de sa phase. L'équipe cœur est active par défaut ; Bob ne sert qu'en parallélisation."
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
            explication="Les skills du protocole. Ceux marqués « stack d'origine » viennent d'un projet Rust/Dioxus — les activer ailleurs demande de vérifier qu'ils s'appliquent."
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
            titre="Les certifications"
            explication="Des référentiels — ISO, ITIL, RGPD… — à joindre quand la séquence les touche. Ils ne sont jamais injectés en entier : seule la fiche choisie part."
            elements={formulaire.certifications.map((c) => ({
              code: c.code,
              libelle: c.code,
              detail: `${c.fiches} fiches · ${c.ko} Ko`,
            }))}
            actifs={cadrage.certifications}
            surChangement={(certifications) => setCadrage({ ...cadrage, certifications })}
          />
        </form>

        {/* ── le prompt ───────────────────────────────────────────────── */}
        <aside className="apercu">
          <header className="bloc-tete">
            <h3>Le prompt initial</h3>
            <span className="compte">
              ≈ {Math.round(prompt.length / 4).toLocaleString("fr-FR")} jetons
            </span>
          </header>
          <div className="boutons">
            <button
              type="button"
              className="principal"
              onClick={() => {
                navigator.clipboard.writeText(prompt);
                setCopie(true);
                window.setTimeout(() => setCopie(false), 2000);
              }}
            >
              {copie ? "copié" : "Copier"}
            </button>
            <button type="button" onClick={enregistrer}>
              Enregistrer
            </button>
            {enregistre && <span className="note">cadrage {enregistre.slice(0, 8)} enregistré</span>}
          </div>
          <pre className="prompt">{prompt}</pre>
        </aside>
      </div>
    </div>
  );
}
