// @id mip.web.accueil
// @role ui
// @layer ui
// @human La présentation : ce qu'on y gagne, comment ça marche, par où commencer
// @do presenter_le_mip_a_quelqu_un_qui_arrive_sans_rien_savoir

import { ArrowRight, Check, Layers, ScanSearch, Terminal, Users } from "lucide-react";

import { Button } from "@/composants/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/composants/ui/card";

import { Hero } from "./Hero";
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
    <div className="space-y-14">
      <Hero aller={aller} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre
          icone={<Layers className="size-4" />}
          valeur={sections}
          libelle="sections de conception"
          detail="Design Thinking, SCAMPER, Six Thinking Hats"
        />
        <Chiffre
          icone={<ScanSearch className="size-4" />}
          valeur={questions}
          libelle="questions au total"
          detail="filtrées selon l'ampleur du projet"
        />
        <Chiffre
          icone={<Users className="size-4" />}
          valeur={agents}
          libelle="rôles spécialisés"
          detail="chargés au moment où ils servent"
        />
        <Chiffre
          icone={<Check className="size-4" />}
          valeur={referentiels}
          libelle="référentiels"
          detail="ISO, ITIL, RGPD — à joindre au besoin"
        />
      </section>

      <section className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-center text-xl font-semibold tracking-tight">En trois temps</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {TEMPS.map((temps, index) => (
            <li key={temps.titre}>
              <Card className="h-full">
                <CardHeader>
                  <span className="bg-primary text-primary-foreground mb-1 flex size-7 items-center justify-center rounded-full text-sm font-semibold">
                    {index + 1}
                  </span>
                  <CardTitle className="text-base">{temps.titre}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm leading-relaxed">
                  {temps.texte}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl">
        <h2 className="mb-5 text-xl font-semibold tracking-tight">Ce que le prompt contient</h2>
        <ul className="space-y-3">
          {CONTENU.map((ligne, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed">
              <Check className="text-primary mt-0.5 size-4 shrink-0" />
              <span>{ligne}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ce que ce n'est pas</CardTitle>
            <CardDescription>
              Ni un générateur de code, ni un agent. Ça ne remplace ni Claude Code, ni Cursor,
              ni Copilot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              MIP Studio prépare le travail. C'est votre IA qui le fait.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Et le balisage MSCM</CardTitle>
            <CardDescription>
              Le second morceau : cinq annotations dans vos commentaires, un index reconstruit
              à partir d'elles, et un contrôle qui échoue quand la carte ne correspond plus au
              terrain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="bg-muted flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs">
              <Terminal className="size-3.5 shrink-0" />
              npx @mip/mscm
            </p>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <a href="/mscm" onClick={(e) => surClicInterne(e, aller)}>
                Comment ça s'annote
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="flex flex-col items-center gap-3 border-t pt-10 pb-4 text-center">
        <Button size="lg" asChild>
          <a href="/cadrage" onClick={(e) => surClicInterne(e, aller)}>
            Commencer un cadrage
            <ArrowRight className="size-4" />
          </a>
        </Button>
        <span className="text-muted-foreground text-sm">
          Aucune donnée n'est conservée si vous n'avez pas de compte —{" "}
          <a
            href="/confidentialite"
            onClick={(e) => surClicInterne(e, aller)}
            className="text-primary underline underline-offset-2"
          >
            ce qu'on garde, et pourquoi
          </a>
          .
        </span>
      </footer>
    </div>
  );
}

const TEMPS: Array<{ titre: string; texte: React.ReactNode }> = [
  {
    titre: "Décrivez votre projet",
    texte: (
      <>
        Comme vous le diriez à quelqu'un. L'outil en déduit des réponses, que vous relisez —{" "}
        <em>une proposition n'est pas une réponse tant que vous ne l'avez pas confirmée</em>.
      </>
    ),
  },
  {
    titre: "Répondez à quatre questions",
    texte: (
      <>
        Le problème, l'utilisateur, la limite, le premier pas. Quatre angles, et le minimum
        sous lequel un prompt cesse d'être meilleur qu'une discussion libre.
      </>
    ),
  },
  {
    titre: "Copiez le prompt",
    texte: (
      <>
        Dans Claude, ChatGPT, Cursor, Copilot — n'importe lequel. Vous pouvez vous arrêter là,
        ou approfondir.
      </>
    ),
  },
];

const CONTENU: React.ReactNode[] = [
  <>
    <strong>Ce qu'il faut construire</strong>, et pour qui.
  </>,
  <>
    <strong>Ce qui a été décidé</strong>, avec vos mots.
  </>,
  <>
    <strong>Le protocole en bref</strong> — les phases, leurs points d'arrêt, et le
    vocabulaire. Un agent ne peut pas suivre ce qu'on ne lui a jamais décrit.
  </>,
  <>
    <strong>Ce qui n'a pas été tranché</strong> — pour que l'agent pose la question au lieu de
    deviner. C'est la section qu'on est tenté de retirer parce qu'elle fait désordre ; elle
    reste, parce qu'un cadrage muet sur le risque n'est pas un cadrage sans risque : c'est un
    cadrage où personne n'a regardé.
  </>,
  <>
    <strong>Où s'arrêter</strong> et vous demander votre accord.
  </>,
];

function Chiffre({
  icone,
  valeur,
  libelle,
  detail,
}: {
  icone: React.ReactNode;
  valeur: number;
  libelle: string;
  detail: string;
}) {
  return (
    <Card className="gap-2 py-5">
      <CardContent className="space-y-1">
        <span className="text-muted-foreground flex items-center gap-2 text-xs">
          {icone}
          {libelle}
        </span>
        {/* Le chiffre vient du protocole chargé, jamais du code : une page qui
            annonce « 32 questions » en dur ment le jour où il en compte 34. */}
        <strong className="block text-3xl font-semibold tracking-tight tabular-nums">
          {valeur || "—"}
        </strong>
        <span className="text-muted-foreground block text-xs leading-snug">{detail}</span>
      </CardContent>
    </Card>
  );
}
