# BRIEF — Analyse comparative Sodomight MVP vs Diablo 2

**Date** : 2026-03-01
**Classification MIP** : T4 (Feature majeure, 10+ fichiers)
**Auteur** : Maria (P0 Cadrage)
**Statut** : En attente d'approbation utilisateur

---

## 1. Contexte

Le MVP Sodomight tourne : terrain isometrique, joueur, monstres et GUI basique sont visibles.
Cependant, l'utilisateur a identifie 4 bugs bloquants qui rendent le jeu injouable dans son
etat actuel. Ce brief fait l'inventaire exhaustif du delta entre l'etat actuel du code et
un MVP acceptable inspire de l'experience Diablo 2 Act 1.

## 2. Fichiers analyses

| Fichier | Lignes | Role |
|---------|--------|------|
| `mge/games/sodomight-client/src/game.rs` | 811 | Integration principale, game loop, input, rendu |
| `mge/games/sodomight-client/src/gui.rs` | 834 | GUI overlay (barres, skill bar, inventaire) |
| `mge/games/sodomight/src/world.rs` | ~800 | Monde authoritative, ECS, combat, loot, skills, AI |
| `mge/games/sodomight/src/content.rs` | 1043 | Contenu Act 1 (monstres, items, skills, quetes, zones) |
| `mge/crates/engine/mge-render/src/camera.rs` | 138 | Camera 2D isometrique, follow, smoothing |
| `mge/crates/engine/mge-render/src/pipeline.rs` | 793 | Pipeline GPU wgpu, SpriteBatcher, textures |

---

## 3. Analyse par categorie

---

### 3.1 RENDU / CAMERA

#### BUG-01 : La camera ne suit pas le joueur [P0-CRITIQUE]

**Etat actuel** : La camera est initialisee correctement a `on_init` (lignes 503-508 de game.rs) avec
`camera.follow(px, py)` et un snap initial. Ensuite, `on_frame` (ligne 567) appelle bien
`camera.follow(px, py)` a chaque frame, puis `camera.update(alpha)` (ligne 570).

**Analyse de la cause** : Le code semble correct sur le papier. La methode `Camera2D::follow()`
(camera.rs:110-113) convertit les coordonnees tile en coordonnees ecran via `world_to_screen()`,
puis les assigne a `target_x/target_y`. Ensuite `update()` (camera.rs:98-106) interpole
`world_x/world_y` vers les targets avec un facteur de smoothing de 0.1.

**Cause probable** : Le `smooth_speed` de 0.1 est tres faible. Avec `dt = alpha` qui vient de
`game_loop.alpha()` (une valeur entre 0.0 et 1.0 representant la fraction du tick), le facteur
d'interpolation `1.0 - (1.0 - 0.1).powf(dt * 60.0)` peut etre tres lent si alpha est petit.
Mais surtout, `alpha` est le residuel de frame, PAS un delta-time reel en secondes. Si `alpha`
est constamment proche de 0, le facteur sera quasi-nul et la camera ne bougera pas visiblement.

**Verification supplementaire necessaire** : Il faut inspecter `GameLoop::alpha()` et `begin_frame()`.
Si `alpha` retourne systematiquement ~0 (par exemple si le jeu tourne a un framerate plus eleve
que le tick rate sans interpolation correcte), la camera parait figee.

**Direction du fix** :
1. Passer un vrai delta-time normalise a `camera.update()` au lieu du game loop alpha.
2. Augmenter `smooth_speed` a 0.15-0.2 pour un suivi plus reactif.
3. Ou bien, en mode MVP, faire un snap direct : `self.camera.world_x = self.camera.target_x`.

#### BUG-04 : Terrain mal centre / deporte en haut-gauche [P0-CRITIQUE]

**Etat actuel** : Le terrain 32x32 tiles est rendu par `batch_tiles()` (game.rs:348-379).
Les positions isometriques sont calculees comme :
```
sx = (tx - ty) * (TILE_WIDTH / 2.0)
sy = (tx + ty) * (TILE_HEIGHT / 2.0)
```
Avec tx/ty de 0 a 31, les positions sx vont de -31*32 = -992 a +31*32 = +992 pixels.
Les positions sy vont de 0 a 31*16*2 = 992 pixels.

Le joueur spawne a (5.0, 5.0), ce qui donne sx=0, sy=160. Si la camera ne suit pas
correctement (BUG-01), le viewport reste centre a (0,0) dans l'espace ecran et le terrain
apparait deporte.

**Cause probable** : Ce bug est une consequence directe de BUG-01. Si la camera suivait le
joueur, le terrain serait centre. Mais il y a aussi un second probleme : les tiles 0,0 sont
a l'ecran pixel (0,0), ce qui est le coin haut-gauche de l'espace monde, pas le centre
de la map. Sans camera follow, on voit le coin.

**Direction du fix** : Resoudre BUG-01 resout BUG-04. Optionnellement, centrer les tiles
autour de l'origine avec un offset : `sx = (tx - ty) * half_w - map_offset_x`.

#### DELTA-R01 : Pas de terrain varie [P2-SOUHAITABLE]

**Etat actuel** : Une seule texture `Grass_a.png` pour toutes les tiles. Pas de variation.
**D2 fait** : Tiles variees (herbe, terre, chemins, eau) avec des transitions.
**Delta** : Aucun tile atlas, pas de systeme de terrain varie.

#### DELTA-R02 : Pas de decor (arbres, rochers, murs, batiments) [P1-IMPORTANT]

**Etat actuel** : Terrain nu, aucun obstacle.
**D2 fait** : Environnement dense avec arbres, murs, portes, coffres, autels.
**Delta** : Manque complet de decor et d'obstacles de pathfinding. Les sprites existent
deja dans `mge/assets/Dev_assets/` (arbres) mais ne sont pas integres.

#### DELTA-R03 : Sprites placeholder (carres colores) [P1-IMPORTANT]

**Etat actuel** : Joueur = carre bleu 28px, monstres = carres rouges 24px, loot = carres
jaunes 12px. Utilisation de la texture herbe avec un tint de couleur.
**D2 fait** : Sprites animes multi-directionnels (8 ou 16 directions), idle/walk/attack/death.
**Delta** : Zero animation, zero sprite specifique par entite. Les carres colores font "tech demo",
pas "jeu jouable". Minimum viable : un sprite statique par type d'entite (joueur, fallen, quill rat).

#### DELTA-R04 : Pas de depth sorting correct [P2-SOUHAITABLE]

**Etat actuel** : Les entites sont batch dans un ordre fixe (loot, monstres, joueur) sans tri
par profondeur isometrique (painter's algorithm sur y+x).
**D2 fait** : Tri isometrique strict pour que les entites proches du bas de l'ecran masquent
celles du haut.
**Delta** : Pas de z-sort. Le module `sprite.rs` a un `SpriteRenderer` avec des layers et
`sort_by_depth()`, mais il n'est pas utilise par le client.

---

### 3.2 GAMEPLAY / COMBAT

#### BUG-02 : Impossible de voir si le joueur attaque [P0-CRITIQUE]

**Etat actuel** : Le clic gauche appelle `handle_world_click()` (game.rs:222-279) qui :
1. Convertit les coordonnees ecran en coordonnees monde isometriques.
2. Cherche le loot le plus proche dans un rayon de 2.0 unites.
3. Cherche les monstres proches du point de clic dans un rayon de 3.0 unites.
4. Appelle `world.player_attack(monster_id)`.

Le combat fonctionne en back-end (les messages de log sont generes). Mais il n'y a
AUCUN feedback visuel : pas de flash, pas de nombre de degats flottant, pas d'animation
d'attaque, pas de son, pas de changement de teinte du monstre touche.

**Cause probable** : Le code `player_attack()` renvoie des `messages` et les log dans
`tracing::debug!`, mais ceux-ci ne sont visibles qu'en console. Le combat_log est pousse
dans la GUI (`sync_gui_from_world`), mais le combat_log du GUI dessine seulement des
rectangles noirs semi-transparents sans texte (gui.rs:512-524, `draw_combat_log` ne
dessine que des `COL_LOG_BG` quads, aucun texte n'est rendu).

**Direction du fix** :
1. **Feedback immediat** : Flash rouge/blanc sur le monstre touche pendant 2-3 frames
   (modifier le tint dans `batch_monsters` selon un timer de hit).
2. **Nombres de degats flottants** : Ajouter un systeme de "damage numbers" au GUI
   (quads positionnes en world-space au-dessus de l'entite touchee).
3. **Texte dans le combat log** : Le SpriteBatcher ne supporte que des quads, pas du texte.
   Option MVP : bitmap font (texture atlas de caracteres). C'est un effort non negligeable.

#### BUG-03 : Touche K (Skills) ne produit aucun effet visible [P0-CRITIQUE]

**Etat actuel** : L'appui sur K genere bien `GuiAction::ToggleSkills`, et `handle_gui_action`
appelle `self.gui.toggle_skills()` (gui.rs:253-254) qui flippe `skill_panel_open`.
Cependant, la methode `draw()` du GUI (gui.rs:387-397) ne verifie jamais `skill_panel_open` :

```rust
pub fn draw(&self, batcher: &mut SpriteBatcher) {
    self.draw_xp_bar(batcher);
    self.draw_health_bar(batcher);
    self.draw_mana_bar(batcher);
    self.draw_skill_bar(batcher);
    self.draw_combat_log(batcher);
    if self.inventory_open {
        self.draw_inventory_panel(batcher);
    }
    // MANQUE : if self.skill_panel_open { self.draw_skill_panel(batcher); }
}
```

**Cause racine** : La methode `draw_skill_panel()` n'existe pas. Le skill panel n'a jamais
ete implemente visuellement. Le flag `skill_panel_open` est toggle mais rien n'est dessine.

**Direction du fix** :
1. Implementer `draw_skill_panel()` dans gui.rs, analogue a `draw_inventory_panel()`.
2. Afficher les 6 skills avec leurs noms (requiert du texte bitmap ou au minimum le nom
   du skill via des quads colores distincts par skill).
3. Ajouter le bloc `if self.skill_panel_open { self.draw_skill_panel(batcher); }` dans `draw()`.

#### DELTA-G01 : Pas de deplacement au clic (click-to-move) [P1-IMPORTANT]

**Etat actuel** : Deplacement WASD uniquement (game.rs:706-719). Le clic est uniquement
utilise pour attaquer/ramasser du loot.
**D2 fait** : Click-to-move avec pathfinding, le joueur se deplace vers le point clique.
**Delta** : Pas de click-to-move, pas de pathfinding. Le crate `mge-pathfinding` existe
dans le workspace mais n'est pas integre.

#### DELTA-G02 : Monstres statiques [P1-IMPORTANT]

**Etat actuel** : L'IA des monstres fonctionne en back-end (`tick_ai()` dans world.rs:354-397).
Les monstres detectent le joueur et attaquent s'il est a portee. Cependant, les monstres ne
se DEPLACENT PAS visuellement vers le joueur. L'`AiAgent::update()` met a jour le FSM interne,
mais aucune logique de mouvement n'est appliquee a `MonsterRecord.position`.
**D2 fait** : Monstres patrouillent, chassent le joueur, fuient quand low HP.
**Delta** : Les monstres sont cloues au sol. Ils attaquent magiquement a distance meme s'ils
sont censes etre melee.

**Direction du fix** : Apres le check `agent.fsm.can_attack()`, si le monstre est hors
portee d'attaque mais dans la portee de vision, appliquer un deplacement vers le joueur
en mettant a jour `MonsterRecord.position`.

#### DELTA-G03 : Pas de respawn des monstres [P2-SOUHAITABLE]

**Etat actuel** : Les monstres spawnes au demarrage ne reviennent pas apres la mort.
**D2 fait** : Les monstres respawnent quand on revient dans une zone (sauf uniques).
**Delta** : Aucun systeme de respawn.

#### DELTA-G04 : Pas de mort du joueur / game over [P1-IMPORTANT]

**Etat actuel** : Le combat log affiche "You have been slain!" quand HP <= 0, mais le
joueur reste en jeu, peut continuer a bouger et attaquer.
**D2 fait** : Mort du joueur = respawn en ville, perte d'or, corpse run.
**Delta** : Aucune consequence a la mort. Le joueur est immortel de facto.

#### DELTA-G05 : Potions non fonctionnelles [P1-IMPORTANT]

**Etat actuel** : Les potions existent dans le contenu (`minor_health_potion`, `minor_mana_potion`)
et peuvent etre ramassees, mais il n'y a aucun mecanisme pour les consommer. Pas de belt,
pas de raccourci potion.
**D2 fait** : Belt avec 4-16 slots, potions consommees via 1-4, regen HP/mana immediatement.
**Delta** : Les potions sont des objets inertes dans l'inventaire.

---

### 3.3 UI / HUD

#### DELTA-U01 : Aucun texte visible nulle part [P0-CRITIQUE]

**Etat actuel** : Le SpriteBatcher ne gere que des quads textures/teintes. Aucun systeme
de rendu de texte n'existe. Cela impacte :
- Noms des monstres (inexistants)
- Nombres de degats (inexistants)
- Combat log (rectangles noirs sans texte)
- Skill names dans la skill bar (carres gris vides)
- Valeurs HP/Mana (pas de chiffres, juste des barres)
- Niveaux, or, XP (aucun chiffre)
- Tooltips (inexistants)

**D2 fait** : Texte partout — noms de monstres, nombres de degats, chat, menus, tooltips.
**Delta** : Zero capacite de rendu de texte. C'est le single biggest gap du MVP.

**Direction du fix** : Implementer un bitmap font renderer :
1. Generer une texture atlas de police (ASCII 32-126, grille reguliere).
2. Ajouter une methode `push_text(batcher, x, y, text, color, scale)` dans gui.rs.
3. Utiliser la meme texture que la GUI (ou un atlas separe) avec les UVs des caracteres.

#### DELTA-U02 : Skill bar sans contenu [P1-IMPORTANT]

**Etat actuel** : 6 carres gris identiques. Pas d'icones, pas de noms, pas de cooldown visuel.
**D2 fait** : Icones de skills, cooldown overlay, level dans le coin, tooltip au survol.
**Delta** : Les skill_slots sont `[None; 6]` et ne sont jamais populees depuis le SkillBook.

#### DELTA-U03 : Pas de minimap [P2-SOUHAITABLE]

**Etat actuel** : Aucune minimap.
**D2 fait** : Minimap overlay en haut-droite, tab pour plein ecran.
**Delta** : Manquant mais non critique pour un MVP.

#### DELTA-U04 : Pas de menus (pause, options, sauvegarde) [P2-SOUHAITABLE]

**Etat actuel** : Echap ne fait rien.
**D2 fait** : Echap ouvre le menu avec Quitter, Options, Sauvegarder.
**Delta** : La seule facon de quitter est Alt+F4.

#### DELTA-U05 : Barres de vie des monstres inexistantes [P1-IMPORTANT]

**Etat actuel** : Pas de barre de vie au-dessus des monstres. Impossible de savoir combien
de HP reste a un monstre.
**D2 fait** : Barre de vie sous le portrait en haut de l'ecran quand on survole un monstre.
**Delta** : Ni barre de vie par monstre, ni barre de vie en HUD pour la cible actuelle.

---

### 3.4 CONTENU ACT 1

#### DELTA-C01 : Une seule zone (Blood Moor plat) [P1-IMPORTANT]

**Etat actuel** : Le code content.rs definit 6 zones (Rogue Encampment, Blood Moor,
Den of Evil, Cold Plains, Burial Grounds, Cathedral), mais seul Blood Moor est instancie.
Le terrain est un carre de 32x32 tiles uniformes sans transition ni portail.
**D2 fait** : Zones interconnectees avec waypoints, portails, transitions animees.
**Delta** : Une seule zone flat, pas de transitions, pas de waypoints.

#### DELTA-C02 : Pas de PNJ (pas de Akara, Charsi, Kashya) [P1-IMPORTANT]

**Etat actuel** : Aucun PNJ, pas de ville, pas de vendeur, pas de forgeron.
**D2 fait** : Rogue Encampment avec 6+ PNJ interactifs.
**Delta** : Manquant completement. La quete "The Search for Cain" demande "Talk to Cain"
mais Cain n'existe pas comme entite.

#### DELTA-C03 : Quetes non trackees visuellement [P2-SOUHAITABLE]

**Etat actuel** : Le `QuestJournal` existe et `register_kill()` est appele a la mort des
monstres, mais aucune UI ne montre la progression des quetes.
**D2 fait** : Panneau de quetes avec objectifs, progression, completion.
**Delta** : Backend existe, frontend manque.

#### DELTA-C04 : Pas de boss (Blood Raven, Andariel) en jeu [P2-SOUHAITABLE]

**Etat actuel** : Les definitions existent dans content.rs mais ils ne sont pas spawnes.
Seuls les monstres de Blood Moor (fallen, quill_rat) sont instancies.
**D2 fait** : Super-uniques et boss dans leurs zones respectives.
**Delta** : Definitions OK, instanciation manquante.

---

### 3.5 SYSTEMES (inventaire, items, skills, stats)

#### DELTA-S01 : Pas d'equipement fonctionnel [P1-IMPORTANT]

**Etat actuel** : L'`Equipment` existe dans world.rs mais aucune action ne permet d'equiper
un item depuis l'inventaire. L'inventaire visuel existe (touche I) mais les items y sont
juste des carres colores sans interaction d'equipement.
**D2 fait** : Double-clic ou drag pour equiper, panneau personnage avec slots visuels.
**Delta** : Backend partiellement pret, frontend et logique d'equipement manquants.

#### DELTA-S02 : Pas de panneau personnage (stats, attributs) [P1-IMPORTANT]

**Etat actuel** : Le `StatBlock` existe avec str/dex/vit/ene mais aucune UI ne les montre.
Pas de bouton pour distribuer les points de stats au level up.
**D2 fait** : Panneau personnage (C) avec tous les stats, points a distribuer.
**Delta** : Backend pret, frontend manquant.

#### DELTA-S03 : Level up sans notification [P2-SOUHAITABLE]

**Etat actuel** : `player_gain_xp()` dans world.rs gere la montee de niveau et ajoute
un message au combat_log, mais pas de flash visuel, pas de son, pas de notification HUD.
**D2 fait** : Flash lumineux, son, notification, points a distribuer.
**Delta** : Backend OK, feedback visuel manquant.

#### DELTA-S04 : Pas de generation d'items magiques/rares [P2-SOUHAITABLE]

**Etat actuel** : Tous les items sont `ItemInstance::new_normal()`. Pas d'affixes,
pas de tiers de qualite (magic, rare, unique).
**D2 fait** : Systeme complet d'affixes avec prefixes/suffixes, items colores.
**Delta** : Grosse feature, mais pas necessaire pour un MVP jouable.

---

## 4. Synthese des priorites

### P0-CRITIQUE (bloque le gameplay de base)

| # | Probleme | Fichiers impactes | Effort estime |
|---|----------|-------------------|---------------|
| BUG-01 | Camera ne suit pas le joueur | `camera.rs`, `game.rs` | 1-2h |
| BUG-02 | Aucun feedback d'attaque | `game.rs`, `gui.rs` | 2-4h |
| BUG-03 | Panneau skills non implemente | `gui.rs` | 2-3h |
| BUG-04 | Terrain mal centre | (consequence de BUG-01) | 0h (fixe par BUG-01) |
| DELTA-U01 | Aucun rendu de texte | `gui.rs`, nouveau module `bitmap_font` | 4-8h |

**Total P0** : 9-17h de dev

### P1-IMPORTANT (degrade fortement l'experience)

| # | Probleme | Effort estime |
|---|----------|---------------|
| DELTA-R02 | Pas de decor | 4-6h |
| DELTA-R03 | Sprites placeholder | 4-8h (depends assets) |
| DELTA-G01 | Pas de click-to-move | 4-6h |
| DELTA-G02 | Monstres statiques | 2-4h |
| DELTA-G04 | Pas de mort joueur | 2-3h |
| DELTA-G05 | Potions non fonctionnelles | 2-3h |
| DELTA-U02 | Skill bar sans contenu | 1-2h |
| DELTA-U05 | Pas de barres de vie monstres | 2-3h |
| DELTA-C01 | Une seule zone | 6-10h |
| DELTA-C02 | Pas de PNJ | 4-8h |
| DELTA-S01 | Pas d'equipement fonctionnel | 3-5h |
| DELTA-S02 | Pas de panneau personnage | 3-4h |

**Total P1** : 37-62h de dev

### P2-SOUHAITABLE (ameliore l'experience)

| # | Probleme | Effort estime |
|---|----------|---------------|
| DELTA-R01 | Terrain non varie | 3-4h |
| DELTA-R04 | Pas de depth sorting | 2-3h |
| DELTA-G03 | Pas de respawn monstres | 1-2h |
| DELTA-U03 | Pas de minimap | 4-6h |
| DELTA-U04 | Pas de menus | 2-3h |
| DELTA-C03 | Quetes non trackees UI | 3-4h |
| DELTA-C04 | Boss pas spawnes | 1-2h |
| DELTA-S03 | Level up sans notification | 1-2h |
| DELTA-S04 | Pas d'items magiques/rares | 8-12h |

**Total P2** : 25-38h de dev

---

## 5. Recommandation : Plan d'action MVP playable

Pour obtenir un MVP "jouable 5 minutes sans frustration", je recommande de traiter
dans cet ordre :

### Sprint 1 — Debloquer le gameplay (P0, ~2 jours)

1. **BUG-01 + BUG-04** : Fixer la camera (snap ou ameliorer le delta-time)
2. **DELTA-U01** : Bitmap font renderer (minimum ASCII, 1 taille)
3. **BUG-02** : Feedback d'attaque (flash tint + damage numbers)
4. **BUG-03** : Skill panel basique

### Sprint 2 — Experience de combat (P1 core, ~3 jours)

5. **DELTA-G02** : Monstres mobiles (chase player)
6. **DELTA-U05** : Barres de vie monstres
7. **DELTA-G04** : Mort du joueur (respawn en place, full heal)
8. **DELTA-G05** : Potions consommables
9. **DELTA-U02** : Skill bar populee depuis le SkillBook

### Sprint 3 — Monde vivant (P1 contenu, ~4 jours)

10. **DELTA-R03** : Sprites basiques (au moins joueur + 2 types monstres)
11. **DELTA-R02** : Quelques decors (arbres, rochers)
12. **DELTA-G01** : Click-to-move basique
13. **DELTA-S01** : Equipement fonctionnel
14. **DELTA-S02** : Panneau personnage

**Total estime** : 9-15 jours ouvres pour un MVP acceptable.

---

## 6. Risques

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Bitmap font renderer plus complexe que prevu | Moyen | Eleve | Utiliser une lib existante (fontdue) ou generer un atlas offline |
| Assets sprites manquants/inadequats | Moyen | Moyen | Utiliser les Dev_assets existants, commissionner des placeholders |
| Performance SpriteBatcher avec texte | Faible | Moyen | Batch separement, limiter le texte affiche |
| Bug camera plus profond que prevu (GameLoop) | Moyen | Eleve | Inspecter GameLoop::alpha() en priorite |

---

## 7. Decision requise

Cet inventaire est complet. L'utilisateur doit valider :

1. **Confirmer la classification T4** (10+ fichiers, feature majeure)
2. **Valider l'ordre des sprints** ou le reajuster
3. **Decider** si les P2 sont dans le scope du MVP ou reportes

Apres approbation, ce brief sera transmis a Denis pour traduction en spec technique (P1).

---

*Genere par Maria — MIP v2 Phase P0 Cadrage*
