// @id mip.web.champ
// @role ui
// @layer ui
// @human Un champ de formulaire, choisi selon la question — et son état
// @do rendre_le_controle_de_saisie_adapte_a_la_question

import { Check, Sparkles, X } from "lucide-react";

import { Badge } from "@/composants/ui/badge";
import { Button } from "@/composants/ui/button";
import { Checkbox } from "@/composants/ui/checkbox";
import { Input } from "@/composants/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/composants/ui/select";
import { Textarea } from "@/composants/ui/textarea";
import { cn } from "@/lib/utils";

import { etatDe, texteDe, type Question, type ReponseBrute } from "./types";

interface Props {
  question: Question;
  reponse: ReponseBrute | undefined;
  /** Une saisie de l'utilisateur : elle confirme toujours. */
  surSaisie: (valeur: string) => void;
}

/**
 * Le contrôle de saisie d'une question.
 *
 * **Le type vient de la question, pas de l'interface.** Plusieurs questions du
 * protocole portent déjà leurs options dans leur libellé — « Prioriser :
 * (a) rapidité, (b) complétude, (c) qualité ? » est un menu déroulant écrit en
 * prose. L'extraction les a sorties ; ici on ne fait que les rendre.
 *
 * **Toute saisie confirme.** Modifier une suggestion, c'est l'avoir relue : elle
 * devient une réponse. C'est le seul geste de confirmation qui ne demande pas un
 * bouton de plus — et le bouton existe quand même, pour accepter sans retoucher.
 *
 * **Une suggestion se voit.** L'anneau ambré n'est pas une décoration : c'est
 * le seul indice visuel qu'un texte plausible n'a encore été relu par personne.
 */
export function Champ({ question, reponse, surSaisie }: Props) {
  const identifiant = `q-${question.numero}`;
  const valeur = texteDe(reponse);
  const suggere = etatDe(reponse) === "suggere";
  const marque = suggere ? "border-amber-500/60 ring-2 ring-amber-500/15" : "";

  switch (question.champ) {
    case "liste":
      return (
        <Select value={valeur} onValueChange={(v) => surSaisie(v === "—" ? "" : v)}>
          <SelectTrigger id={identifiant} className={cn("w-full", marque)}>
            <SelectValue placeholder="— non renseigné —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="—">— non renseigné —</SelectItem>
            {question.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "echelle":
    case "oui_non": {
      // Des boutons plutôt qu'un menu : quelques valeurs se comparent d'un coup
      // d'œil, et un menu fermé cache justement l'échelle qu'on demande de juger.
      const options = question.champ === "oui_non" ? ["oui", "non"] : question.options;
      return (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={identifiant}>
          {options.map((option) => {
            const actif = valeur === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => surSaisie(actif ? "" : option)}
                className={cn(
                  "focus-visible:ring-ring rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                  actif
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary/60",
                  suggere && actif && "border-amber-500 bg-amber-500/90 text-white",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    case "cases": {
      const cochees = new Set(valeur ? valeur.split(", ") : []);
      return (
        <div className={cn("grid gap-2 rounded-md sm:grid-cols-2", suggere && "p-2 " + marque)}>
          {question.options.map((option) => (
            <label
              key={option}
              className="hover:bg-accent/40 flex cursor-pointer items-start gap-2.5 rounded-md p-1.5 text-sm"
            >
              <Checkbox
                className="mt-0.5"
                checked={cochees.has(option)}
                onCheckedChange={() => {
                  if (cochees.has(option)) cochees.delete(option);
                  else cochees.add(option);
                  // L'ordre des options, pas l'ordre des clics : deux personnes
                  // qui cochent la même chose doivent produire le même prompt.
                  surSaisie(question.options.filter((o) => cochees.has(o)).join(", "));
                }}
              />
              <span className="leading-snug">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    // **Pas de `placeholder` tiré de l'aide.** Elle est déjà rendue au-dessus
    // du champ, en toutes lettres : la répéter en filigrane affichait deux fois
    // la même phrase à dix pixels d'écart. Vu à l'écran sur la question 2.2,
    // dont l'aide tient sur deux lignes.
    case "ligne":
      return (
        <Input
          id={identifiant}
          value={valeur}
          onChange={(e) => surSaisie(e.target.value)}
          className={marque}
        />
      );

    default:
      return (
        <Textarea
          id={identifiant}
          value={valeur}
          onChange={(e) => surSaisie(e.target.value)}
          className={cn("resize-y", marque)}
          rows={Math.min(valeur.split("\n").length + 1, 8)}
        />
      );
  }
}

/**
 * Le bandeau d'une suggestion non confirmée.
 *
 * **Il dit d'où vient le texte, et il demande un geste.** Le modèle qui
 * pré-remplit invente : mesuré le 2026-08-20, il a donné un sens faux à deux
 * acronymes et inventé un public. Une invention est plausible et bien écrite —
 * rien dans le texte lui-même ne la distingue d'une réponse.
 *
 * Tant que personne n'a cliqué, la suggestion **ne compte pas** : elle n'entre
 * pas dans le prompt et la question figure parmi celles qui restent à trancher.
 */
export function Suggestion({
  surAcceptation,
  surRejet,
}: {
  surAcceptation: () => void;
  surRejet: () => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2">
      <Badge
        variant="outline"
        className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      >
        <Sparkles className="size-3" />
        proposé
      </Badge>
      <span className="text-muted-foreground min-w-40 flex-1 text-xs leading-snug">
        Déduit de votre demande — <strong className="text-foreground">à relire</strong>. Tant
        que ce n'est pas confirmé, la question compte comme sans réponse.
      </span>
      <span className="flex gap-1.5">
        <Button type="button" size="sm" onClick={surAcceptation}>
          <Check className="size-3.5" />
          C'est juste
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={surRejet}>
          <X className="size-3.5" />
          Effacer
        </Button>
      </span>
    </div>
  );
}
