<!-- @id cert.lise.wcag -->
<!-- @do provide_wcag_reference_knowledge -->
<!-- @role accessibility -->
<!-- @layer reference -->
<!-- @human Referentiel WCAG 2.2 pour Lise -->

# WCAG 2.2 — Referentiel Lise

> **TL;DR** : Recommandation W3C definissant les criteres d'accessibilite web/UI. 4 principes POUR (Perceivable, Operable, Understandable, Robust), 13 directives, 3 niveaux de conformite (A/AA/AAA). Reference Lise pour concevoir des interfaces accessibles dans les apps Dioxus et les surfaces web MiyuCloud.

## Identite

| Champ | Valeur |
|-------|--------|
| Organisme | W3C (World Wide Web Consortium) |
| Obligation | Obligatoire secteur public (EU: EN 301 549, FR: RGAA), recommande prive |
| Validite | Permanente (derniere version : WCAG 2.2, octobre 2023) |
| Prerequis | Aucun |

## Domaine d'application

Directives pour rendre les contenus web et interfaces utilisateur accessibles aux personnes en situation de handicap (visuel, auditif, moteur, cognitif). Applicables aux sites web, applications desktop, et surfaces web embarquees.

## 4 Principes POUR et 13 directives

### 1. Perceivable (Perceptible)

| Directive | Ref | Criteres cles (niveau) |
|-----------|-----|------------------------|
| Alternatives textuelles | 1.1 | Texte alternatif pour tout contenu non textuel (A) |
| Medias temporels | 1.2 | Sous-titres (A), audio-description (A), langue des signes (AAA) |
| Adaptable | 1.3 | Info et relations (A), ordre significatif (A), orientation libre (AA) |
| Distinguable | 1.4 | Contraste 4.5:1 texte (AA), 3:1 grand texte (AA), 7:1 (AAA), resize 200% (AA), espacement texte (AA) |

### 2. Operable (Utilisable)

| Directive | Ref | Criteres cles (niveau) |
|-----------|-----|------------------------|
| Clavier | 2.1 | Tout accessible au clavier (A), pas de piege clavier (A) |
| Delai suffisant | 2.2 | Reglable (A), pause/arret/masquer (A) |
| Crises et reactions physiques | 2.3 | Pas de flash >3/s (A) |
| Navigable | 2.4 | Bypass blocks (A), titre page (A), ordre focus (A), but du lien (A), focus visible (AA) |
| Modalites d'entree | 2.5 | Gestes pointeur (A), annulation pointeur (A), taille cible 24px min (AA, WCAG 2.2) |

### 3. Understandable (Comprehensible)

| Directive | Ref | Criteres cles (niveau) |
|-----------|-----|------------------------|
| Lisible | 3.1 | Langue de la page (A), langue des parties (AA) |
| Previsible | 3.2 | Pas de changement de contexte au focus (A), navigation coherente (AA) |
| Aide a la saisie | 3.3 | Identification erreur (A), etiquettes/instructions (A), suggestion correction (AA), prevention erreur (AA) |

### 4. Robust (Robuste)

| Directive | Ref | Criteres cles (niveau) |
|-----------|-----|------------------------|
| Compatible | 4.1 | Parsing valide (obsolete 2.2), nom/role/valeur (A), messages statut (AA) |

## Niveaux de conformite

| Niveau | Exigence | Cible Miyukini |
|--------|----------|----------------|
| **A** | Minimum absolu (30 criteres) | Obligatoire pour tout composant |
| **AA** | Standard recommande (20 criteres supplementaires) | Cible pour surfaces web MiyuCloud |
| **AAA** | Excellence (28 criteres supplementaires) | Aspirationnel, non vise globalement |

## Nouveautes WCAG 2.2

| Critere | Ref | Niveau | Description |
|---------|-----|--------|-------------|
| Focus Not Obscured (Minimum) | 2.4.11 | AA | Le focus ne doit pas etre entierement cache par un overlay |
| Focus Not Obscured (Enhanced) | 2.4.12 | AAA | Le focus ne doit pas etre partiellement cache |
| Focus Appearance | 2.4.13 | AAA | Indicateur de focus visible avec contraste suffisant |
| Dragging Movements | 2.5.7 | AA | Alternative sans glisser-deposer |
| Target Size (Minimum) | 2.5.8 | AA | Cibles 24x24px minimum |
| Consistent Help | 3.2.6 | A | Aide accessible de maniere coherente |
| Redundant Entry | 3.3.7 | A | Pas de ressaisie d'information deja fournie |
| Accessible Authentication | 3.3.8 | AA | Pas de test cognitif pour s'authentifier |

## Checklist Lise

- [ ] Alt text : tout contenu non textuel a un texte alternatif descriptif (1.1.1 A)
- [ ] Clavier : toute fonctionnalite utilisable au clavier sans piege (2.1.1/2.1.2 A)
- [ ] Contraste : ratio 4.5:1 texte normal, 3:1 grand texte (1.4.3 AA) — verifier tokens miyuki-ui
- [ ] Focus visible : indicateur de focus sur tout element interactif (2.4.7 AA)
- [ ] Focus non obscurci : aucun overlay ne cache le focus (2.4.11 AA, WCAG 2.2)
- [ ] Labels formulaires : chaque champ a un label explicite ou aria-label (3.3.2 A)
- [ ] Erreurs formulaires : identification + suggestion de correction (3.3.1/3.3.3 AA)
- [ ] ARIA roles : roles semantiques corrects sur les composants custom
- [ ] Skip navigation : lien d'evitement vers le contenu principal (2.4.1 A)
- [ ] Taille cible : elements cliquables >= 24x24px (2.5.8 AA)
- [ ] Responsive text : zoom 200% sans perte de contenu (1.4.4 AA)
- [ ] Langue : attribut lang sur la page et les sections multilingues (3.1.1/3.1.2 AA)

## Anti-patterns

| Erreur | Correction |
|--------|------------|
| Images decoratives avec alt text | `alt=""` ou `role="presentation"` pour les images decoratives |
| Focus invisible (outline: none) | Toujours un indicateur visible (ring, border, highlight) |
| Contraste insuffisant sur fond sombre | Verifier tokens `miyuki-ui-tokens` contre ratio 4.5:1 |
| Formulaires sans labels | Chaque input lie a un `<label>` ou `aria-label` |
| Navigation au clavier impossible | Tab order logique, pas de piege, skip links |
| Couleur seule comme information | Ajouter icone, texte ou pattern en complement |
| Cibles trop petites (touch) | Minimum 24x24px (WCAG 2.2), idealement 44x44px |

## Application Miyukini

| Critere WCAG | Application projet |
|-------------|-------------------|
| Alt text (1.1.1) | Composants `Image` miyuki-ui-dioxus : prop `alt` obligatoire |
| Clavier (2.1) | Navigation clavier dans toutes les apps Dioxus, pas de piege |
| Contraste (1.4.3) | `COG_THEME` et `D2_THEME` tokens verifies contre 4.5:1 |
| Focus (2.4.7/2.4.11) | Focus ring dans atoms Button, Input, Select (miyuki-ui-dioxus) |
| Labels (3.3.2) | Molecules Form* avec label prop obligatoire |
| Erreurs (3.3.1) | Pattern `FormField` avec error state + message |
| ARIA | Roles sur organisms complexes (Sidebar, Modal, Dialog) |
| Taille cible (2.5.8) | Spacing tokens base 4px, minimum sp_6 (24px) pour interactifs |
| Surface web MiyuCloud | Cible AA : templates web accessibles, auth sans test cognitif |

---

*Sources : WCAG 2.2 (W3C Recommendation, Oct 2023), WAI-ARIA 1.2, RGAA 4.1 (France), EN 301 549 (EU)*
