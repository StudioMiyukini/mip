// @id mip.web.accueil
// @role ui
// @layer ui
// @human La présentation : ce qu'on y gagne, comment ça marche, par où commencer
// @do presenter_le_mip_a_quelqu_un_qui_arrive_sans_rien_savoir

import { surClicInterne } from "./routeur";
import type { Formulaire } from "./types";

interface Props {
  formulaire: Formulaire | null;
  aller: (chemin: string) => void;
}

/**
 * La page d'accueil.
 *
 * **Elle mène par ce qu'on y gagne, pas par ce qu'on fait mal.** « MIP est un
 * protocole de développement assisté par IA en six phases » ne dit rien à qui
 * n'a pas encore le problème. Une première version disait à la place « votre IA
 * part sur une mauvaise piste et vous refaites » : exact, reconnaissable, et
 * accusateur — elle mettait le visiteur en faute avant de lui proposer quoi que
 * ce soit.
 *
 * La promesse marche mieux que le reproche, et elle est tout aussi vraie : le
 * même modèle, mieux dirigé, va plus loin. On garde le mécanisme — ce qu'on
 * donne décide de ce qu'on obtient — sans le tourner contre le lecteur.
 *
 * **Les chiffres viennent du protocole réel**, chargés depuis l'API. Écrire
 * « 32 questions » en dur donnerait une page qui ment le jour où le protocole
 * change — et c'est exactement le défaut que ce projet passe son temps à
 * traquer ailleurs.
 */
export function Accueil({ formulaire, aller }: Props) {
  const questions = formulaire?.sections.reduce((n, s) => n + s.questions.length, 0) ?? 0;
  const sections = formulaire?.sections.length ?? 0;
  const agents = formulaire?.agents.length ?? 0;
  const referentiels = formulaire?.certifications.length ?? 0;

  return (
    <div className="accueil">
      <header className="hero">
        <h1>
          Bien guidée, votre IA va beaucoup plus loin.
          <br />
          <span className="hero-suite">Le même modèle. Dix minutes de cadrage.</span>
        </h1>
        <p className="hero-texte">
          Une IA travaille avec ce qu'on lui donne. Plus elle sait pour qui c'est,
          jusqu'où aller et ce qui compte le plus, plus elle vise juste — et ces
          réponses-là, c'est vous qui les avez.
        </p>
        <p className="hero-texte">
          <strong>
            MIP Studio pose les questions qu'un chef de projet poserait, et met vos réponses
            dans une forme qu'un agent suit.
          </strong>
        </p>
        <div className="hero-boutons">
          <a href="/cadrage" className="bouton-principal" onClick={(e) => surClicInterne(e, aller)}>
            Commencer un cadrage
          </a>
          <a href="/exemples" className="bouton-second" onClick={(e) => surClicInterne(e, aller)}>
            Voir un exemple
          </a>
        </div>
        <p className="hero-note">
          Gratuit, sans inscription. Quatre questions suffisent pour repartir avec quelque
          chose d'utilisable.
        </p>
      </header>

      <section className="cartes">
        <Carte valeur={sections} libelle="sections de conception" detail="Design Thinking, SCAMPER, Six Thinking Hats" />
        <Carte valeur={questions} libelle="questions au total" detail="filtrées selon l'ampleur du projet" />
        <Carte valeur={agents} libelle="rôles spécialisés" detail="chargés au moment où ils servent" />
        <Carte valeur={referentiels} libelle="référentiels" detail="ISO, ITIL, RGPD — à joindre au besoin" />
      </section>

      <section className="bloc">
        <h2>En trois temps</h2>
        <ol className="temps">
          <li>
            <strong>Décrivez votre projet</strong>
            <span>
              Comme vous le diriez à quelqu'un. L'outil en déduit des réponses, que vous
              relisez — <em>une proposition n'est pas une réponse tant que vous ne l'avez
              pas confirmée</em>.
            </span>
          </li>
          <li>
            <strong>Répondez à quatre questions</strong>
            <span>
              Le problème, l'utilisateur, la limite, le premier pas. Quatre angles, et le
              minimum sous lequel un prompt cesse d'être meilleur qu'une discussion libre.
            </span>
          </li>
          <li>
            <strong>Copiez le prompt</strong>
            <span>
              Dans Claude, ChatGPT, Cursor, Copilot — n'importe lequel. Vous pouvez vous
              arrêter là, ou approfondir.
            </span>
          </li>
        </ol>
      </section>

      <section className="bloc">
        <h2>Ce que le prompt contient</h2>
        <ul className="liste-marquee">
          <li>
            <strong>Ce qu'il faut construire</strong>, et pour qui.
          </li>
          <li>
            <strong>Ce qui a été décidé</strong>, avec vos mots.
          </li>
          <li>
            <strong>Ce qui ne l'a pas été</strong> — pour que l'agent pose la question au
            lieu de deviner. C'est la section qu'on est tenté de retirer parce qu'elle fait
            désordre ; elle reste, parce qu'un cadrage muet sur le risque n'est pas un
            cadrage sans risque : c'est un cadrage où personne n'a regardé.
          </li>
          <li>
            <strong>Où s'arrêter</strong> et vous demander votre accord.
          </li>
        </ul>
      </section>

      <section className="deux-colonnes">
        <div className="bloc">
          <h2>Ce que ce n'est pas</h2>
          <p className="explication">
            Ni un générateur de code, ni un agent. Ça ne remplace ni Claude Code, ni
            Cursor, ni Copilot.
          </p>
          <p>
            <strong>MIP Studio prépare le travail. C'est votre IA qui le fait.</strong>
          </p>
        </div>
        <div className="bloc">
          <h2>Et le balisage MSCM</h2>
          <p className="explication">
            Le second morceau : cinq annotations dans vos commentaires, un index
            reconstruit à partir d'elles, et un contrôle qui échoue quand la carte ne
            correspond plus au terrain.
          </p>
          <p className="commande">npx @mip/mscm</p>
          <p>
            <a href="/mscm" onClick={(e) => surClicInterne(e, aller)}>
              Comment ça s'annote
            </a>
          </p>
        </div>
      </section>

      <footer className="accueil-pied">
        <a href="/cadrage" className="bouton-principal" onClick={(e) => surClicInterne(e, aller)}>
          Commencer un cadrage
        </a>
        <span className="explication">
          Aucune donnée n'est conservée si vous n'avez pas de compte —{" "}
          <a href="/confidentialite" onClick={(e) => surClicInterne(e, aller)}>
            ce qu'on garde, et pourquoi
          </a>
          .
        </span>
      </footer>
    </div>
  );
}

function Carte({ valeur, libelle, detail }: { valeur: number; libelle: string; detail: string }) {
  return (
    <div className="carte">
      {/* Le chiffre vient du protocole chargé, jamais du code : une page qui
          annonce « 32 questions » en dur ment le jour où il en compte 34. */}
      <strong className="carte-valeur">{valeur || "—"}</strong>
      <span className="carte-libelle">{libelle}</span>
      <span className="carte-detail">{detail}</span>
    </div>
  );
}
