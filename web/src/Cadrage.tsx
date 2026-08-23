// @id mip.web.cadrage
// @role ui
// @layer ui
// @human Le cadrage sur grand écran : le formulaire par étages, le prompt en vis-à-vis
// @do remplir_un_cadrage_sur_grand_ecran_avec_l_apercu_a_cote

import { Check, Copy, Save, Sparkles } from "lucide-react";

import { Badge } from "@/composants/ui/badge";
import { Button } from "@/composants/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/composants/ui/card";
import { Input } from "@/composants/ui/input";
import { Label } from "@/composants/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/composants/ui/select";
import { Textarea } from "@/composants/ui/textarea";
import { cn } from "@/lib/utils";

import { Champ, Suggestion } from "./Champ";
import { Equipe } from "./Equipe";
import { Etages, Palier } from "./Etages";
import { Tags } from "./Tags";
import { TagsGroupes } from "./TagsGroupes";
import { etatDe, type Etage, type Formulaire, type Question } from "./types";
import { useCadrage } from "./useCadrage";

interface Props {
  formulaire: Formulaire;
  connecte: boolean;
  /** Rechargé après un enregistrement, pour que le compteur du flanc suive. */
  surEnregistrement: () => void;
}

/**
 * Le parcours grand écran.
 *
 * **Tout est là, et le prompt se construit à côté.** C'est ce qui rend le
 * formulaire compréhensible : on voit le texte grossir en le remplissant, donc
 * on comprend à quoi sert chaque champ. Un formulaire dont on ne découvre le
 * résultat qu'à la fin se remplit une fois, mal.
 *
 * Toute la logique vient de [`useCadrage`], partagé avec le parcours mobile.
 * Ce fichier ne décide de rien — il place.
 */
export function Cadrage({ formulaire, connecte, surEnregistrement }: Props) {
  const e = useCadrage(formulaire, surEnregistrement);

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
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau cadrage</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Décrivez votre projet, répondez à quatre questions, repartez avec un prompt.
        </p>
      </header>

      {e.aRelire > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm leading-snug">
            <strong>{e.aRelire}</strong> réponse{e.aRelire > 1 ? "s" : ""} déduite
            {e.aRelire > 1 ? "s" : ""} de votre demande — <em>à relire avant de compter</em>.
            Une proposition n'est pas une réponse : elle n'entre pas dans le prompt tant que
            vous ne l'avez pas confirmée.
          </p>
        </div>
      )}

      <Etages etage={e.etage} surChangement={e.setEtage} restantes={e.restantes} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
        <form className="space-y-4" onSubmit={(evenement) => evenement.preventDefault()}>
          <Card>
            <CardHeader>
              <CardTitle>Votre projet</CardTitle>
              <CardDescription>
                Décrivez-le comme vous le diriez à quelqu'un. Le reste part de là.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="titre">Un titre court</Label>
                <Input
                  id="titre"
                  value={e.cadrage.titre}
                  onChange={(ev) => e.setCadrage({ ...e.cadrage, titre: ev.target.value })}
                  placeholder="ex. une appli pour suivre mes lectures"
                />
              </div>
              <Textarea
                rows={4}
                className="resize-y"
                value={e.cadrage.demande}
                onChange={(ev) => e.setCadrage({ ...e.cadrage, demande: ev.target.value })}
                placeholder="Ce que vous voulez construire, en quelques phrases."
              />
            </CardContent>
          </Card>

          <TagsGroupes
            titre="Ce que ça doit produire"
            explication="Le protocole ne le demande pas, et c'est un angle mort : un même besoin donne une application ou un document. Sans réponse, l'agent prend la première hypothèse venue."
            choix={formulaire.formats}
            actifs={e.cadrage.formats}
            surChangement={(formats) => e.setCadrage({ ...e.cadrage, formats })}
          />

          <TagsGroupes
            titre="Avec quoi"
            explication="Laissez vide si ce n'est pas du code, ou cochez « À décider » pour que l'agent propose au lieu de supposer."
            choix={formulaire.techniques}
            actifs={e.cadrage.techniques}
            surChangement={(techniques) => e.setCadrage({ ...e.cadrage, techniques })}
          />

          {e.visibles.map((section) => (
            <Card key={section.numero}>
              <CardHeader>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <CardTitle>{section.titre}</CardTitle>
                  {section.methode && (
                    <span className="text-muted-foreground text-xs italic">
                      {section.methode}
                    </span>
                  )}
                </div>
                {section.deduite && (
                  <CardDescription>
                    Normalement déduite de votre demande. La remplir évite à l'agent de
                    deviner.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {section.questions.map(rendreQuestion)}
              </CardContent>
            </Card>
          ))}

          {e.etageRempli && (
            <Palier
              etage={e.etage}
              copie={e.copie}
              surCopie={e.copier}
              surSuite={() => e.setEtage((n) => Math.min(3, n + 1) as Etage)}
            />
          )}

          {e.etage >= 3 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Classification et conduite</CardTitle>
                  <CardDescription>
                    La classe décide des phases <em>et</em> du nombre de questions posées. En
                    cas de doute, le protocole dit de monter d'un cran.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="classe">Ampleur</Label>
                    <Select
                      value={e.cadrage.classe}
                      onValueChange={(classe) => e.setCadrage({ ...e.cadrage, classe })}
                    >
                      <SelectTrigger id="classe" className="w-full">
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
                        Phases : {e.classe.phases.join(" → ")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mode">Jusqu'où l'agent avance seul</Label>
                    <Select
                      value={e.cadrage.mode}
                      onValueChange={(mode) => e.setCadrage({ ...e.cadrage, mode })}
                    >
                      <SelectTrigger id="mode" className="w-full">
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
                      {formulaire.protocole.modes.find((m) => m.mode === e.cadrage.mode)
                        ?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Equipe
                agents={formulaire.agents}
                actifs={e.cadrage.agents}
                surChangement={(agents) => e.setCadrage({ ...e.cadrage, agents })}
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
                explication="ISO, ITIL, RGPD… à joindre quand la séquence les touche. Jamais injectés en entier."
                elements={formulaire.certifications.map((c) => ({
                  code: c.code,
                  libelle: c.code,
                  detail: `${c.fiches} fiches · ${c.ko} Ko`,
                }))}
                actifs={e.cadrage.certifications}
                surChangement={(certifications) =>
                  e.setCadrage({ ...e.cadrage, certifications })
                }
              />
            </>
          )}
        </form>

        <Apercu
          prompt={e.prompt}
          jetons={e.jetons}
          copie={e.copie}
          dit={e.dit}
          connecte={connecte}
          surCopie={e.copier}
          surEnregistrement={e.enregistrer}
        />
      </div>
    </div>
  );
}

/**
 * L'aperçu, collé en haut de la colonne de droite.
 *
 * `sticky` plutôt que `fixed` : la colonne reste dans le flux, donc elle
 * n'écrase rien quand la fenêtre rétrécit — et sous `xl`, la grille repasse à
 * une colonne et l'aperçu se retrouve simplement en bas.
 */
function Apercu({
  prompt,
  jetons,
  copie,
  dit,
  connecte,
  surCopie,
  surEnregistrement,
}: {
  prompt: string;
  jetons: number;
  copie: boolean;
  dit: string | null;
  connecte: boolean;
  surCopie: () => void;
  surEnregistrement: () => void;
}) {
  return (
    <aside className="xl:sticky xl:top-6">
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="bg-card gap-0 border-b py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Votre prompt</CardTitle>
            <Badge variant="secondary" className="font-mono text-[11px]">
              ≈ {jetons.toLocaleString("fr-FR")} jetons
            </Badge>
          </div>
        </CardHeader>
        <div className="flex flex-wrap gap-2 border-b p-3">
          <Button type="button" size="sm" onClick={surCopie}>
            {copie ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copie ? "Copié" : "Copier"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={surEnregistrement}>
            <Save className="size-4" />
            {connecte ? "Enregistrer" : "Enregistrer…"}
          </Button>
          {dit && <p className="text-muted-foreground w-full text-xs">{dit}</p>}
        </div>
        <pre
          className={cn(
            "bg-muted/40 max-h-[min(70vh,900px)] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap",
          )}
        >
          {prompt}
        </pre>
      </Card>
    </aside>
  );
}
