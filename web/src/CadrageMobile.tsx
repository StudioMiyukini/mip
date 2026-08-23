// @id mip.web.cadrage.mobile
// @role ui
// @layer ui
// @human Le cadrage sur téléphone : une section à la fois, le prompt dans un tiroir
// @do remplir_un_cadrage_section_par_section_sur_un_petit_ecran

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, FileText, Save, Sparkles } from "lucide-react";

import { Badge } from "@/composants/ui/badge";
import { Button } from "@/composants/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/composants/ui/card";
import { Input } from "@/composants/ui/input";
import { Label } from "@/composants/ui/label";
import { Progress } from "@/composants/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/composants/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/composants/ui/sheet";
import { Textarea } from "@/composants/ui/textarea";
import { cn } from "@/lib/utils";

import { Champ, Suggestion } from "./Champ";
import { Equipe } from "./Equipe";
import { ETAGES } from "./Etages";
import { Tags } from "./Tags";
import { TagsGroupes } from "./TagsGroupes";
import { etatDe, type Etage, type Formulaire, type Question } from "./types";
import { useCadrage, type EtatCadrage } from "./useCadrage";

interface Props {
  formulaire: Formulaire;
  connecte: boolean;
  surEnregistrement: () => void;
}

/** Une page du parcours : un titre, une raison d'être, un contenu. */
interface Ecran {
  cle: string;
  titre: string;
  sous?: string;
}

/**
 * Le parcours téléphone.
 *
 * **Ce n'est pas le formulaire du PC réagencé** — c'est une autre façon de
 * poser les mêmes questions. Sur un écran étroit, le formulaire entier fait un
 * rouleau de plusieurs mètres où l'on ne sait jamais combien il reste : c'est
 * exactement le mur que l'étagement avait été inventé pour abattre, et qui se
 * reformait verticalement.
 *
 * Ici, **un écran à la fois**, l'avancement en tête, et le prompt dans un
 * tiroir qu'on ouvre quand on veut voir où l'on en est. Le compteur de jetons
 * reste visible en permanence : c'est lui qui donne le sentiment d'avancer.
 *
 * Le comportement vient de [`useCadrage`], strictement le même que sur grand
 * écran. Deux mises en page, une seule logique — deux logiques divergeraient,
 * et ce dépôt sait ce que ça coûte.
 */
export function CadrageMobile({ formulaire, connecte, surEnregistrement }: Props) {
  const e = useCadrage(formulaire, surEnregistrement);
  const [page, setPage] = useState(0);

  // Les écrans se recalculent avec l'étage : monter d'un étage ajoute des
  // sections au parcours, sans jamais réordonner celles qu'on a déjà vues.
  const ecrans = useMemo<Ecran[]>(() => {
    const liste: Ecran[] = [
      { cle: "projet", titre: "Votre projet", sous: "Le reste part de là." },
      { cle: "formats", titre: "Ce que ça doit produire" },
      { cle: "techniques", titre: "Avec quoi" },
      ...e.visibles.map((s) => ({ cle: `s-${s.numero}`, titre: s.titre, sous: s.methode })),
    ];
    if (e.etage >= 3) {
      liste.push(
        { cle: "conduite", titre: "Classification et conduite" },
        { cle: "equipe", titre: "L'équipe" },
        { cle: "ressources", titre: "Ce qu'il faut charger" },
      );
    }
    return liste;
  }, [e.visibles, e.etage]);

  const courant = ecrans[Math.min(page, ecrans.length - 1)];
  const dernier = page >= ecrans.length - 1;
  const avancement = ecrans.length > 1 ? ((page + 1) / ecrans.length) * 100 : 100;

  function rendreQuestion(question: Question) {
    const reponse = e.cadrage.reponses[question.numero];
    const suggere = etatDe(reponse) === "suggere";
    return (
      <div key={question.numero} className="space-y-1.5">
        <Label htmlFor={`q-${question.numero}`} className="items-start gap-2 leading-snug">
          <span className="text-muted-foreground font-mono text-xs">{question.numero}</span>
          {question.texte}
        </Label>
        {question.aide && (
          <p className="text-muted-foreground text-xs leading-snug">{question.aide}</p>
        )}
        <Champ
          question={question}
          reponse={reponse}
          surSaisie={(valeur) => e.repondre(question.numero, valeur)}
        />
        {suggere && (
          <Suggestion
            surAcceptation={() => e.accepter(question.numero)}
            surRejet={() => e.effacer(question.numero)}
          />
        )}
      </div>
    );
  }

  return (
    // La marge basse dégage la barre d'action fixe, qui recouvrirait sinon le
    // dernier champ de chaque écran.
    <div className="space-y-4 pb-28">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-muted-foreground font-mono text-[11px]">
            {page + 1} / {ecrans.length}
          </p>
          <p className="text-muted-foreground text-[11px]">
            étage {e.etage} · {ETAGES[e.etage - 1].titre.toLowerCase()}
          </p>
        </div>
        <Progress value={avancement} className="h-1.5" />
        <h1 className="pt-1 text-xl font-semibold tracking-tight">{courant.titre}</h1>
        {courant.sous && (
          <p className="text-muted-foreground text-sm leading-snug">{courant.sous}</p>
        )}
      </header>

      {e.aRelire > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-snug">
            <strong>{e.aRelire}</strong> réponse{e.aRelire > 1 ? "s" : ""} déduite
            {e.aRelire > 1 ? "s" : ""} de votre demande, à relire. Non confirmée, une
            proposition n'entre pas dans le prompt.
          </p>
        </div>
      )}

      <ContenuEcran cle={courant.cle} etat={e} formulaire={formulaire} rendre={rendreQuestion} />

      {dernier && e.etageRempli && e.etage < 3 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm">Votre prompt est prêt.</CardTitle>
            <CardDescription>
              Vous pouvez vous arrêter là. Ou continuer : {ETAGES[e.etage].gain}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                e.setEtage((n) => Math.min(3, n + 1) as Etage);
                setPage((p) => p + 1);
              }}
            >
              {ETAGES[e.etage].titre}
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <BarreAction
        etat={e}
        connecte={connecte}
        page={page}
        total={ecrans.length}
        surPage={setPage}
      />
    </div>
  );
}

/** Le contenu de l'écran courant. Un `switch`, pas une carte de composants :
 *  trois écrans sur sept ont une forme propre, et l'indirection les cacherait. */
function ContenuEcran({
  cle,
  etat: e,
  formulaire,
  rendre,
}: {
  cle: string;
  etat: EtatCadrage;
  formulaire: Formulaire;
  rendre: (question: Question) => React.ReactNode;
}) {
  if (cle === "projet") {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="titre-m">Un titre court</Label>
            <Input
              id="titre-m"
              value={e.cadrage.titre}
              onChange={(ev) => e.setCadrage({ ...e.cadrage, titre: ev.target.value })}
              placeholder="ex. suivre mes lectures"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demande-m">Ce que vous voulez construire</Label>
            <Textarea
              id="demande-m"
              rows={6}
              className="resize-y"
              value={e.cadrage.demande}
              onChange={(ev) => e.setCadrage({ ...e.cadrage, demande: ev.target.value })}
              placeholder="Comme vous le diriez à quelqu'un, en quelques phrases."
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cle === "formats") {
    return (
      <TagsGroupes
        titre="Ce que ça doit produire"
        explication="Un même besoin donne une application ou un document. Sans réponse, l'agent prend la première hypothèse venue."
        choix={formulaire.formats}
        actifs={e.cadrage.formats}
        surChangement={(formats) => e.setCadrage({ ...e.cadrage, formats })}
      />
    );
  }

  if (cle === "techniques") {
    return (
      <TagsGroupes
        titre="Avec quoi"
        explication="Laissez vide si ce n'est pas du code, ou cochez « À décider » pour que l'agent propose."
        choix={formulaire.techniques}
        actifs={e.cadrage.techniques}
        surChangement={(techniques) => e.setCadrage({ ...e.cadrage, techniques })}
      />
    );
  }

  if (cle === "conduite") {
    return (
      <Card>
        <CardHeader>
          <CardDescription>
            La classe décide des phases <em>et</em> du nombre de questions. En cas de doute,
            monter d'un cran.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="classe-m">Ampleur</Label>
            <Select
              value={e.cadrage.classe}
              onValueChange={(classe) => e.setCadrage({ ...e.cadrage, classe })}
            >
              <SelectTrigger id="classe-m" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formulaire.protocole.classification.map((c) => (
                  <SelectItem key={c.classe} value={c.classe}>
                    {c.classe} — {c.critere}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {e.classe && (
              <p className="text-muted-foreground font-mono text-xs">
                {e.classe.phases.join(" → ")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mode-m">Jusqu'où l'agent avance seul</Label>
            <Select
              value={e.cadrage.mode}
              onValueChange={(mode) => e.setCadrage({ ...e.cadrage, mode })}
            >
              <SelectTrigger id="mode-m" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formulaire.protocole.modes.map((m) => (
                  <SelectItem key={m.mode} value={m.mode}>
                    {m.mode} — {m.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs leading-snug">
              {formulaire.protocole.modes.find((m) => m.mode === e.cadrage.mode)?.description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cle === "equipe") {
    return (
      <Equipe
        agents={formulaire.agents}
        actifs={e.cadrage.agents}
        surChangement={(agents) => e.setCadrage({ ...e.cadrage, agents })}
      />
    );
  }

  if (cle === "ressources") {
    return (
      <div className="space-y-4">
        <Tags
          titre="Les savoir-faire"
          explication="Ceux marqués « stack d'origine » viennent d'un projet Rust."
          elements={formulaire.skills.map((s) => ({
            code: s.code,
            libelle: s.code.replace(/^miyukini-/, ""),
            detail: s.description,
            reserve: s.generique ? undefined : "stack d'origine",
            jetons: s.jetons,
          }))}
          actifs={e.cadrage.skills}
          surChangement={(skills) => e.setCadrage({ ...e.cadrage, skills })}
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
          actifs={e.cadrage.modules}
          surChangement={(modules) => e.setCadrage({ ...e.cadrage, modules })}
        />
        <Tags
          titre="Les référentiels"
          explication="ISO, ITIL, RGPD… à joindre quand la séquence les touche."
          elements={formulaire.certifications.map((c) => ({
            code: c.code,
            libelle: c.code,
            detail: `${c.fiches} fiches · ${c.ko} Ko`,
          }))}
          actifs={e.cadrage.certifications}
          surChangement={(certifications) => e.setCadrage({ ...e.cadrage, certifications })}
        />
      </div>
    );
  }

  const section = e.visibles.find((s) => `s-${s.numero}` === cle);
  if (!section) return null;
  return (
    <Card>
      {section.deduite && (
        <CardHeader>
          <CardDescription>
            Normalement déduite de votre demande. La remplir évite à l'agent de deviner.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn("space-y-5", !section.deduite && "pt-6")}>
        {section.questions.map(rendre)}
      </CardContent>
    </Card>
  );
}

/**
 * La barre du bas : avancer, reculer, et voir le prompt.
 *
 * **Fixe, parce que c'est la seule chose qu'on cherche du pouce.** Le compteur
 * de jetons y reste affiché en permanence : il monte à mesure qu'on répond, et
 * c'est ce qui donne le sentiment d'avancer quand on ne voit qu'un écran à la
 * fois.
 */
function BarreAction({
  etat: e,
  connecte,
  page,
  total,
  surPage,
}: {
  etat: EtatCadrage;
  connecte: boolean;
  page: number;
  total: number;
  surPage: (page: number) => void;
}) {
  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={page === 0}
          aria-label="Écran précédent"
          onClick={() => surPage(Math.max(0, page - 1))}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="flex-1">
              <FileText className="size-4" />
              Le prompt
              <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
                {e.jetons.toLocaleString("fr-FR")}
              </Badge>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85dvh] gap-0 p-0">
            <SheetHeader className="border-b">
              <SheetTitle>Votre prompt</SheetTitle>
              <SheetDescription>
                ≈ {e.jetons.toLocaleString("fr-FR")} jetons. Copiez-le et collez-le dans
                votre IA.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-wrap gap-2 border-b p-4">
              <Button type="button" size="sm" onClick={e.copier}>
                {e.copie ? <Check className="size-4" /> : <Copy className="size-4" />}
                {e.copie ? "Copié" : "Copier"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={e.enregistrer}>
                <Save className="size-4" />
                {connecte ? "Enregistrer" : "Enregistrer…"}
              </Button>
              {e.dit && <p className="text-muted-foreground w-full text-xs">{e.dit}</p>}
            </div>
            <pre className="bg-muted/40 flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {e.prompt}
            </pre>
          </SheetContent>
        </Sheet>

        {page < total - 1 ? (
          <Button type="button" onClick={() => surPage(page + 1)}>
            Suivant
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={e.copier}>
            {e.copie ? <Check className="size-4" /> : <Copy className="size-4" />}
            {e.copie ? "Copié" : "Copier"}
          </Button>
        )}
      </div>
    </div>
  );
}
