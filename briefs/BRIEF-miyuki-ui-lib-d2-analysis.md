# Analyse PR — Interface Diablo 2 pour Miyuki UI Lib (mge-ui / miyuki-ui-egui)

**Date** : 2026-03-01
**Classification MIP** : T5 (partie de la Miyuki UI Lib)
**Auteur** : Fabrice (P0 Analyse PR)
**Statut** : LIVRE — En attente validation Maria
**Dependance** : BRIEF-miyuki-ui-lib.md (P0 valide)

---

## Preambule

Ce document est une analyse exhaustive de l'interface utilisateur de Diablo 2 (version originale Lord of Destruction 800x600 et version Resurrected HD). L'objectif est de fournir a l'equipe (Denis pour la spec, Lise pour le design, Francois pour l'implementation) une reference complete pour reproduire fidelement l'UI D2 dans le MGE via le crate `miyuki-ui-egui`.

L'analyse couvre : chaque ecran/panneau UI, le design system complet (palette, typographie, decorations), les composants reutilisables classes en Atomic Design, les points de friction du design original et les recommandations pour notre reproduction.

---

## 1. Inventaire complet des ecrans/panneaux UI de Diablo 2

### 1.1 HUD Principal (In-Game Overlay)

**Nom** : Control Panel / HUD Bar
**Fonction** : Interface permanente de gameplay -- affiche l'etat du personnage et donne acces aux actions rapides.

**Layout** :
- Ancre en bas de l'ecran, occupe toute la largeur (800px en original)
- Hauteur : ~104px (panneau principal) + 6px (barre XP tout en bas)
- Le panneau est une texture de pierre sombre ornementee de motifs gothiques

**Elements visuels** :

| Element | Position | Taille approx. | Description |
|---------|----------|----------------|-------------|
| Orbe de vie | Bas-gauche, encadre dans le panneau | ~80x80px (sphere) | Globe rouge rempli proportionnellement de bas en haut. Cadre metallique ornemente avec griffes/cranes. Le liquide rouge "bouillonne" avec une animation subtile. |
| Orbe de mana | Bas-droite, symetrique a la vie | ~80x80px (sphere) | Globe bleu identique en structure. Le liquide bleu a une teinte plus froide avec reflets. |
| Belt / Ceinture | Centre-bas, entre les deux orbes | 4 colonnes x 1-4 rangees | Affiche la rangee inferieure des potions. Les touches 1-4 correspondent aux colonnes. |
| Boutons de skill gauche/droite | De part et d'autre du belt | ~40x40px chacun | Icone du skill assigne au clic gauche et au clic droit. Cadre metallique. |
| Selecteurs de skill | Adjacents aux boutons de skill | Fleches gauche/droite | Permettent de faire defiler les skills assignables. |
| Boutons de menu | Distribues sur le panneau | ~20x20px chacun | Inventaire, Arbre skills, Stats, Quetes, Chat, Aide, Menu. Icones dorees sur fond pierre. |
| Barre d'experience | Toute la largeur en bas | 800x5px | Fine barre horizontale qui se remplit de gauche a droite. Couleur or/jaune. Survol affiche le pourcentage exact. |
| Stamina bar | Au-dessus du belt | ~120x6px | Barre jaune/verte de stamina. Diminue en courant, se remplit au repos. |
| Indicateur Run/Walk | Pres de la stamina | Petit bouton toggle | Bascule entre course et marche. |

**Interactions** :
- Clic gauche/droit sur les icones de skill : utilise le skill
- Survol des orbes : affiche "Life: X/Y" ou "Mana: X/Y" en tooltip
- Survol de la barre XP : affiche le pourcentage et l'XP restante pour le prochain niveau
- Touches 1-4 : consomme la potion de la colonne correspondante
- Touches de raccourcis : I (inventaire), C (character), T (skill tree), Q (quetes), M (minimap), Tab (automap)

**Palette** :
- Fond panneau : texture pierre gris-brun fonce (~#1C160E a #2A2015)
- Bordures metalliques : or terne (~#50401E a #846430)
- Orbe vie : rouge profond (#B41414) avec degradation vers noir en fond
- Orbe mana : bleu profond (#1428B4) avec reflets plus clairs
- Texte XP/valeurs : or clair (#C8A546)

---

### 1.2 Inventaire

**Nom** : Inventory Panel
**Fonction** : Gestion des objets portes et equipes.

**Layout** :
- S'ouvre a droite de l'ecran (ancre droite)
- Occupe environ la moitie droite de l'ecran (400x380px environ en 800x600)
- Fond de texture pierre sombre avec cadre dore

**Elements visuels** :

| Element | Position | Dimensions | Description |
|---------|----------|-----------|-------------|
| Paperdoll (silhouette) | Moitie gauche du panneau | ~180x280px | Silhouette du personnage avec emplacements d'equipement positionnes anatomiquement |
| Grille d'inventaire | Moitie droite / bas | 10 colonnes x 4 rangees = 40 slots | Grille quadrillee, chaque cellule ~29x29px. Fond tres sombre avec lignes de separation fines. |
| Affichage or | Sous la grille | Texte dore | Quantite d'or portee. Clic ouvre un champ pour deposer de l'or. |
| Cadre gothique | Tout autour | Ornements coins + bordures | Texture pierre avec ornements metalliques aux quatre coins |

**Emplacements d'equipement (Paperdoll)** :

| Emplacement | Taille grille | Position sur la silhouette |
|-------------|--------------|---------------------------|
| Helm (Tete) | 2x2 | Centre-haut, au-dessus de la tete |
| Amulet (Amulette) | 1x1 | Cou, juste sous le helm a droite |
| Body Armor (Torse) | 2x3 | Centre, sur le torse |
| Main Hand (Main gauche) | 1x3 ou 1x4 ou 2x3 ou 2x4 | A gauche de la silhouette |
| Off Hand (Main droite) | 1x3 ou 2x2 ou 2x3 ou 2x4 | A droite de la silhouette |
| Gloves (Gants) | 2x2 | Bas-gauche |
| Belt (Ceinture) | 2x1 | Centre-bas, sous le torse |
| Boots (Bottes) | 2x2 | Bas-droite |
| Ring Left (Anneau G) | 1x1 | Cote gauche, hauteur de la taille |
| Ring Right (Anneau D) | 1x1 | Cote droit, hauteur de la taille |

**Tailles d'items dans la grille d'inventaire** :

| Taille | Types d'items |
|--------|---------------|
| 1x1 | Potions, gemmes, runes, anneaux, amulettes, charmes petits, fleches/carreaux (stack), cles, scroll |
| 1x2 | Sceptres, baguettes, masses, dagues |
| 1x3 | Epees courtes, javelots courts, certains sceptres |
| 1x4 | Lances courtes, certaines armes d'hast |
| 2x2 | Casques, petits boucliers, bottes, gants, ceintures, charmes grands |
| 2x3 | Armures, grands boucliers, arcs, certaines epees longues |
| 2x4 | Arcs longs, armes d'hast grandes (pique, hallebarde) |

**Interactions** :
- Drag-and-drop : glisser un item de la grille vers un emplacement d'equipement ou inversement
- Clic droit : utiliser l'item (boire potion, lire parchemin, equiper)
- Survol : affiche le tooltip detaille de l'item
- Clic gauche + maintien : "ramasser" l'item, il suit le curseur
- Swap : deposer un item sur un emplacement occupe echange les deux items
- Drop au sol : glisser hors de la fenetre d'inventaire

---

### 1.3 Skill Tree (Arbre de competences)

**Nom** : Skill Tree Panel
**Fonction** : Allocation des points de competence dans 3 arbres par classe.

**Layout** :
- S'ouvre a gauche de l'ecran (ancre gauche)
- Occupe environ la moitie gauche de l'ecran (~400x380px en 800x600)
- 3 onglets en haut, un par arbre de competences

**Elements visuels** :

| Element | Position | Description |
|---------|----------|-------------|
| 3 onglets | Haut du panneau | Texte dore sur fond sombre. Onglet actif plus lumineux. Noms des 3 arbres de la classe. |
| Fond de l'arbre | Zone principale | Background unique par arbre (texture artistique thematique) |
| Noeuds de skill | Disposition en grille 3 colonnes x 6 rangees | Icones rondes/carrees dans un cadre metallique. Skill non debloque = grise/desature. Skill debloque = couleur pleine. |
| Lignes de prerequis | Entre les noeuds | Fleches/lignes connectant un skill a ses prerequis. Active = doree, inactive = grise. |
| Compteur de points | Bas du panneau | "Skill Points: X" en texte dore |
| Niveau du skill | Sur chaque noeud | Petit chiffre en bas du noeud (ex: "5/20") |

**Organisation des arbres (3 colonnes x 6 rangees par arbre)** :

Chaque arbre comporte 10 skills repartis sur 6 niveaux de prerequis :
- Rangee 1 (Niveau 1) : 1-2 skills de base
- Rangee 2 (Niveau 6) : 1-2 skills
- Rangee 3 (Niveau 12) : 1 skill
- Rangee 4 (Niveau 18) : 1-2 skills
- Rangee 5 (Niveau 24) : 1-2 skills
- Rangee 6 (Niveau 30) : 1-2 skills capstone

Les skills sont positionnes dans une grille de 3 colonnes, et les lignes de prerequis descendent verticalement ou en diagonale.

**Arbres par classe** :

| Classe | Arbre 1 | Arbre 2 | Arbre 3 |
|--------|---------|---------|---------|
| Amazon | Bow and Crossbow | Passive and Magic | Javelin and Spear |
| Necromancer | Summoning Spells | Poison and Bone | Curses |
| Barbarian | Warcries | Combat Skills | Combat Masteries |
| Sorceress | Fire | Lightning | Cold |
| Paladin | Combat Skills | Defensive Auras | Offensive Auras |
| Druid | Elemental | Shape Shifting | Summoning |
| Assassin | Martial Arts | Shadow Disciplines | Traps |

**Interactions** :
- Clic sur un onglet : change l'arbre affiche
- Clic gauche sur un noeud debloque : ajoute 1 point (si points disponibles et prerequis remplis)
- Clic droit sur un noeud : assigne le skill au clic droit de la souris
- Survol d'un noeud : tooltip avec nom, niveau, description, synergies, prerequis, degats/effets par niveau
- Noeud grise : prerequis non remplis ou pas assez de points

---

### 1.4 Character Stats (Fiche de personnage)

**Nom** : Character Screen / Stats Panel
**Fonction** : Affichage et distribution des attributs de base et stats derivees.

**Layout** :
- S'ouvre a gauche de l'ecran (comme le skill tree, ils se remplacent mutuellement dans D2 original; dans D2R ils peuvent coexister)
- ~320x400px
- Fond pierre sombre avec cadre dore

**Elements visuels** :

| Section | Contenu | Position |
|---------|---------|----------|
| En-tete | Nom du personnage, classe, niveau | Haut du panneau, texte dore centre |
| Attributs de base | Force, Dexterite, Vitalite, Energie | Bloc gauche, avec valeurs et boutons "+" si points disponibles |
| Stats derivees | Vie, Mana, Stamina, Defense, Attack Rating | Bloc droit ou centre |
| Degats | Min-Max damage du skill actif | Section centrale |
| Resistances | Feu, Froid, Foudre, Poison (en %) | Section inferieure, couleurs codees par element |
| Points disponibles | "Stat Points Remaining: X" | Affiche en or vif si > 0 |

**Stats affichees dans D2** :
- **Gauche** : Strength, Dexterity, Vitality, Energy (avec bouton "+" pour chacun)
- **Droite** : Defense, Stamina (current/max), Life (current/max), Mana (current/max)
- **Centre** : Attack Rating, Damage (skill-dependent), Block chance (si bouclier equipe)
- **Bas** : Fire Res %, Cold Res %, Lightning Res %, Poison Res %

**Ajouts D2 Resurrected** :
- Panneau "Advanced Stats" additionnel qui liste TOUS les bonus actifs de l'equipement
- Comparaison d'items en maintenant Shift sur un item

**Interactions** :
- Bouton "+" sur un attribut : ajoute 1 point (si disponibles)
- Survol de Defense/Attack Rating : affiche les chances de toucher/etre touche contre le dernier monstre rencontre
- Survol de chaque stat : tooltip explicatif

**Couleurs des resistances** :
- >= 75% (cap) : or brillant (max atteint)
- 0-74% : or standard
- < 0% : rouge (danger)

---

### 1.5 Quest Log (Journal de quetes)

**Nom** : Quest Log Panel
**Fonction** : Suivi des quetes par acte.

**Layout** :
- Panneau central ou gauche, ~350x300px
- Onglets par Acte (1-5) en haut
- Liste de quetes dans chaque acte

**Elements visuels** :

| Element | Description |
|---------|-------------|
| Onglets Actes | 5 onglets (Acte I a V) avec numerotation romaine. Acte actif = plus lumineux. |
| Liste des quetes | 6 quetes par acte, disposees en 2 colonnes de 3. Chaque quete est un bouton icone. |
| Etat de la quete | Icone de la quete change selon l'etat : non commencee (gris), en cours (clair), terminee (check dore) |
| Detail de quete | Clic sur une quete affiche sa description et son objectif dans la zone inferieure |

**Quetes par Acte** :
- Acte I : 6 quetes (Den of Evil, Sisters' Burial Grounds, Tools of the Trade, The Forgotten Tower, Sisters to the Slaughter, The Search for Cain)
- Acte II : 6 quetes
- Acte III : 6 quetes
- Acte IV : 3 quetes (acte plus court)
- Acte V (LoD) : 6 quetes

**Interactions** :
- Clic sur un onglet d'acte : change l'acte affiche
- Clic sur une icone de quete : affiche le detail
- Le log clignote/s'illumine quand une mise a jour de quete survient

---

### 1.6 Waypoint Map (Carte de teleportation)

**Nom** : Waypoint Panel
**Fonction** : Teleportation instantanee entre les zones decouvertes.

**Layout** :
- S'ouvre en cliquant sur un waypoint physique dans le monde
- Panneau central, ~400x350px
- Onglets par Acte en haut (comme le quest log)

**Elements visuels** :

| Element | Description |
|---------|-------------|
| Onglets Actes | Identiques au Quest Log |
| Liste de waypoints | Noms de zones empiles verticalement, 9 par acte (sauf Acte IV : 3) |
| Waypoint decouvert | Texte blanc, cliquable |
| Waypoint non decouvert | Texte gris fonce, non cliquable |
| Waypoint actuel | Surligne en or |

**Interactions** :
- Clic sur un waypoint decouvert : teleportation instantanee
- Les waypoints s'activent en marchant dessus dans le monde
- Chaque difficulte a ses propres waypoints decouverts

---

### 1.7 Party Screen (Ecran de groupe)

**Nom** : Party Panel
**Fonction** : Gestion des joueurs dans une partie multijoueur.

**Layout** :
- Panneau central, ~300x250px
- Liste verticale des joueurs de la partie (max 8)

**Elements visuels** :

| Element | Description |
|---------|-------------|
| Nom du joueur | Texte couleur par classe ou blanc |
| Classe et niveau | Sous le nom |
| Barre de vie | Barre rouge horizontale |
| Bouton Hostile | Bouton pour declarer l'hostilite (PvP) |
| Bouton Loot | Toggle pour le partage de loot |
| Bouton Squelch | Mute le joueur |

**Interactions** :
- Clic sur "Hostile" : declare l'hostilite avec le joueur (PvP)
- Clic sur le nom : cible le joueur pour le suivi (teleport To)
- Les joueurs hostiles apparaissent en rouge sur la minimap

---

### 1.8 Trade Window (Fenetre d'echange)

**Nom** : Trade Panel
**Fonction** : Echange d'items entre deux joueurs.

**Layout** :
- Panneau central, divise en deux moities verticales
- Chaque moitie contient une grille de trade + or

**Elements visuels** :

| Element | Description |
|---------|-------------|
| Grille joueur local | 5x5 (25 slots) a gauche -- on y depose ses items a echanger |
| Grille autre joueur | 5x5 (25 slots) a droite -- affiche les items proposes par l'autre |
| Or propose | Champ numerique sous chaque grille |
| Bouton Accept | Bouton dore pour accepter l'echange |
| Bouton Cancel | Bouton pour annuler |
| Statut | Texte indiquant si l'autre joueur a accepte |

**Interactions** :
- Drag-drop items de l'inventaire vers la grille de trade
- Les deux joueurs doivent accepter pour finaliser
- Si un joueur modifie son offre apres l'acceptation de l'autre, l'acceptation est annulee
- Securite anti-scam : delai de confirmation

---

### 1.9 Stash (Coffre personnel)

**Nom** : Stash Panel
**Fonction** : Stockage personnel d'items dans les villes.

**Layout** :
- S'ouvre en cliquant sur le coffre en ville
- Panneau similaire a l'inventaire

**Dimensions** :

| Version | Grille |
|---------|--------|
| D2 Classic | 6x4 (24 slots) |
| D2 Lord of Destruction | 8x6 (48 slots) |
| D2 Resurrected Personal | 10x10 (100 slots) |
| D2R Shared Stash | 10x10 par onglet, 3 a 5 onglets |

**Elements visuels** :
- Grille de stockage (meme style que l'inventaire)
- Affichage de l'or stocke dans le coffre (separe de l'or porte)
- Bouton de transfert d'or (porter -> coffre et inversement)
- Dans D2R : onglets en haut pour les shared stash tabs

**Interactions** :
- Drag-drop identique a l'inventaire
- Clic droit rapide pour transferer vite
- Or : clic sur le champ or pour specifier le montant a deposer/retirer
- D2R : onglets cliquables pour naviguer entre Personal et Shared tabs

---

### 1.10 Horadric Cube (Cube Horadrique)

**Nom** : Horadric Cube Panel
**Fonction** : Stockage supplementaire et transmutation d'items.

**Layout** :
- Occupe 2x2 slots dans l'inventaire
- S'ouvre via clic droit : revele une grille interne 3x4 (12 slots) dans D2 original, ou 4x3 selon la source

**Elements visuels** :
- Grille 3x4 (3 colonnes, 4 rangees) = 12 slots
- Bouton "Transmute" en bas de la fenetre
- Meme style visuel que l'inventaire (fond sombre, grille fine)

**Interactions** :
- Drag-drop items dans la grille
- Bouton "Transmute" : applique la recette si les ingredients sont valides
- Le resultat remplace les ingredients dans le cube
- Si la recette echoue : rien ne se passe (pas de perte)

---

### 1.11 NPC Dialog (Dialogue PNJ)

**Nom** : NPC Dialog Panel
**Fonction** : Interaction avec les PNJ de la ville.

**Layout** :
- Grande fenetre centree ou en bas de l'ecran
- ~500x300px

**Elements visuels** :

| Element | Description |
|---------|-------------|
| Portrait du NPC | Image a gauche (~100x100px), encadree en or |
| Zone de texte | Texte du dialogue en blanc/beige sur fond sombre |
| Options de dialogue | Boutons textuels empiles verticalement (Trade, Gossip, Quest, Hire, etc.) |
| Nom du NPC | Titre du panneau en or brillant |

**Options typiques par NPC** :
- Trade (ouvre la boutique)
- Gossip (texte de lore)
- Quest (informations de quete si pertinent)
- Hire (pour les mercenaires -- Greiz, Asheara, Qual-Kehk)
- Gamble (Gheed, Alkor, Anya -- pari sur items non identifies)
- Repair (forgeron -- Charsi, Fara, Hratli, Larzuk, Lazaruth)
- Identify (Deckard Cain -- identification de tous les items)

**Interactions** :
- Clic sur une option : ouvre la sous-interface correspondante
- Scroll possible si le texte est long
- Fermeture par Escape ou bouton close

---

### 1.12 Mercenary Panel (Panneau du mercenaire)

**Nom** : Mercenary Panel
**Fonction** : Gestion de l'equipement et des stats du mercenaire.

**Layout** :
- S'ouvre depuis le portrait du mercenaire (en haut a gauche du HUD)
- Similaire a l'ecran de personnage mais reduit

**Elements visuels** :
- Silhouette du mercenaire avec emplacements d'equipement
- Emplacements : Helm, Body Armor, Weapon (3 slots seulement dans D2 original, etendu dans certains mods)
- Stats : Vie, Defense, Niveau, Type (Act 2 Defiance, Act 3 Fire, etc.)
- Nom du mercenaire

**Interactions** :
- Drag-drop d'equipement sur les slots du mercenaire
- Le mercenaire peut utiliser certains types d'items uniquement
- Survol des stats : tooltips

---

### 1.13 Chat / Messages

**Nom** : Chat Overlay
**Fonction** : Communication entre joueurs et messages systeme.

**Layout** :
- Zone de texte en bas-gauche de l'ecran, au-dessus du HUD
- Semi-transparent

**Elements visuels** :
- Messages systeme : blanc ou dore
- Messages joueurs : couleur variable (blanc par defaut)
- Whispers : vert ou cyan
- Messages systeme importants : jaune ou orange
- Zone de saisie : barre de texte en bas

**Interactions** :
- Enter : ouvre la zone de saisie
- Commandes : /msg, /whisper, /party, /hostile, /help
- Scroll : molette pour remonter l'historique
- Messages disparaissent apres quelques secondes

---

### 1.14 Main Menu (Menu principal)

**Nom** : Title Screen / Main Menu
**Fonction** : Point d'entree du jeu.

**Layout** :
- Plein ecran
- Background : illustration sombre thematique (porte de feu dans D2, portail dans D2R)
- Boutons centraux empiles verticalement

**Elements visuels** :

| Element | Description |
|---------|-------------|
| Logo/Titre | "DIABLO II" en haut, police Exocet, lettrage dore avec effets de lumiere |
| "LORD OF DESTRUCTION" | Sous-titre si expansion installee |
| Single Player | Bouton principal |
| Multiplayer | Bouton principal |
| Cinematics | Bouton secondaire |
| Options | Bouton secondaire |
| Credits | Bouton secondaire |
| Exit Game | Bouton en bas |

**Style des boutons** :
- Fond : texture pierre/metal sombre
- Texte : Exocet ou police similaire, dore
- Hover : le texte s'illumine (dore plus clair/blanc)
- Click : enfoncement visuel subtil
- Taille : ~220x36px approximativement

---

### 1.15 Character Select (Selection de personnage)

**Nom** : Character Selection Screen
**Fonction** : Choisir ou creer un personnage avant d'entrer en jeu.

**Layout** :
- Plein ecran
- Liste de personnages a gauche/centre
- Rendu 3D/2D du personnage selectionne a droite (en D2R : modele 3D anime)

**Elements visuels** :

| Element | Description |
|---------|-------------|
| Liste de personnages | Entrées cliquables : nom, classe, niveau, status (Normal/Nightmare/Hell) |
| Apercu | Personnage selectionne affiche avec son equipement |
| Bouton "Create New" | Creer un nouveau personnage |
| Bouton "Delete" | Supprimer un personnage (avec confirmation) |
| Bouton "Enter Game" | Lancer la partie avec le personnage selectionne |
| Filtre | Hardcore/Softcore, Ladder/Non-Ladder (D2R) |

**Ecran de creation** :
- 7 classes affichees avec apercu visuel
- Champ de nom du personnage
- Toggle Hardcore
- Toggle Expansion (Classic vs LoD)
- Bouton OK / Cancel

---

### 1.16 Loading Screens (Ecrans de chargement)

**Nom** : Loading Screen
**Fonction** : Transition entre les zones/actes.

**Elements visuels** :
- Illustration unique par acte (art concept de l'acte)
- Barre de progression en bas
- Texte du nom de la zone en cours de chargement
- En D2R : illustrations haute resolution avec effets de particules

**Actes** :
- Acte I : Rogue Encampment (tonalite gothique, foret sombre)
- Acte II : Lut Gholein (desert, tons sable et or)
- Acte III : Kurast (jungle tropicale, tons verts)
- Acte IV : Pandemonium Fortress (enfer, rouges et noirs)
- Acte V : Harrogath (montagne glaciale, bleus et blancs)

---

### 1.17 Minimap / Automap

**Nom** : Automap Overlay
**Fonction** : Carte de la zone actuelle en transparence.

**Layout** :
- Mode Minimap : petit carre en haut a droite (~140x140px)
- Mode Automap : overlay plein ecran semi-transparent
- Toggle via Tab

**Elements visuels** :
- Murs et passages dessines en lignes (blanc/vert clair)
- Position du joueur : fleche/point au centre
- Monstres : points rouges
- Allies/mercenaire : points verts
- Items au sol : non affiches par defaut
- Waypoints : icone distincte (croix doree)
- Sortie de zone : icone fleche
- Fond : noir semi-transparent (alpha ~40-60%)

**Interactions** :
- Tab : toggle automap on/off
- V : deplacer la minimap (coin haut-droit vs plein ecran)
- H : afficher le nom de la zone en overlay
- Molette : pas de zoom dans D2 original

---

### 1.18 Belt / Quick Bar (Ceinture de potions)

**Nom** : Belt Interface
**Fonction** : Acces rapide aux potions via les touches 1-4.

**Layout** :
- Integre dans le HUD principal, au centre-bas
- 4 colonnes x 1-4 rangees (selon le type de ceinture equipee)
- Seule la rangee du bas est toujours visible sur le HUD

**Comportement par type de ceinture** :

| Type de ceinture | Rangees | Total slots | Exemples |
|-----------------|---------|------------|----------|
| Pas de ceinture | 1 | 4 | Debut de jeu |
| Sash / Light Belt | 2 | 8 | Sash, Light Belt |
| Belt / Heavy Belt | 3 | 12 | Belt, Heavy Belt |
| Plated Belt et superieurs | 4 | 16 | Plated Belt, War Belt, Colossus Girdle |

**Mecanique "distributeur automatique"** :
- Les potions sont empilees en colonnes
- Quand on consomme une potion (touche 1-4), celle du dessus descend automatiquement
- Le joueur voit toujours la rangee du bas
- Survoler la ceinture dans le HUD "ouvre" la vue complete de toutes les rangees
- Les potions ramassees au sol vont automatiquement dans une colonne libre

---

## 2. Design System D2

### 2.1 Palette de couleurs complete

#### Couleurs d'interface

| Nom | Usage | Hex | RGB |
|-----|-------|-----|-----|
| BG Dark | Fond principal (quasi-noir chaud) | #0A0805 | (10, 8, 5) |
| Panel BG | Fond des panneaux/fenetres | #1C160E | (28, 22, 14) |
| Panel Border | Bordure des panneaux (or terne) | #503C14 | (80, 60, 20) |
| Gold Standard | Labels, titres, texte important | #C8A546 | (200, 165, 70) |
| Gold Bright | Valeurs, titres principaux | #FFD700 | (255, 215, 0) |
| Gold Dark | Bordures, separateurs | #846430 | (132, 100, 48) |
| Red Life | Orbe de vie, degats, negatif | #B41414 | (180, 20, 20) |
| Blue Mana | Orbe de mana | #1428B4 | (20, 40, 180) |
| Stone Light | Texture pierre claire (reflets) | #3A3025 | (58, 48, 37) |
| Stone Dark | Texture pierre foncee (ombres) | #1A1410 | (26, 20, 16) |
| Slot Empty | Fond de slot vide (semi-transparent) | #281E0F/C8 | (40, 30, 15, 200) |
| Slot Hover | Fond de slot survole | #3C3219/DC | (60, 50, 25, 220) |
| Stamina Yellow | Barre de stamina | #D4C832 | (212, 200, 50) |
| XP Bar Gold | Barre d'experience | #C8A546 | (200, 165, 70) |

#### Couleurs de texte des items (rarete)

| Rarete | Nom D2 | Usage | Hex | RGB |
|--------|--------|-------|-----|-----|
| Normal | White/Light Gray | Items normaux, texte par defaut | #C8BEA0 | (200, 190, 160) |
| Socketed/Ethereal | Gray | Items socketes ou etheres | #848484 | (132, 132, 132) |
| Magic | Blue | Items magiques | #6969FF | (105, 105, 255) |
| Rare | Yellow | Items rares | #FFFF64 | (255, 255, 100) |
| Unique | Dark Gold/Brown | Items uniques | #A56E00 | (165, 110, 0) |
| Set | Green | Items de set | #00B400 | (0, 180, 0) |
| Crafted | Orange | Items craftes | #FFA500 | (255, 165, 0) |
| Rune Word | Orange | Mots runiques (meme couleur que crafted) | #FFA500 | (255, 165, 0) |

#### Couleurs de texte systeme

| Code D2 | Nom | Hex | RGB | Usage |
|---------|-----|-----|-----|-------|
| c0 | Light Gray | #C4C4C4 | (196, 196, 196) | Descriptions d'items par defaut |
| c1 | Red | #FF4040 | (255, 64, 64) | Avertissements, requirements non remplis |
| c2 | Bright Green | #00FF00 | (0, 255, 0) | Set items, messages positifs |
| c3 | Blue | #6969FF | (105, 105, 255) | Magic items, proprietes magiques |
| c4 | Gold | #C7B377 | (199, 179, 119) | Unique items, titres, labels UI |
| c5 | Dark Gray | #696969 | (105, 105, 105) | Socketed/Ethereal items |
| c6 | Black | #000000 | (0, 0, 0) | Ombre de texte |
| c7 | Tan/BNet Gold | #D0C090 | (208, 192, 144) | Or Battle.net, labels secondaires |
| c8 | Orange | #FFA800 | (255, 168, 0) | Crafted items |
| c9 | Yellow | #FFFF64 | (255, 255, 100) | Rare items |

#### Couleurs d'elements (resistances et degats)

| Element | Hex | RGB | Usage |
|---------|-----|-----|-------|
| Fire (Feu) | #FF4500 | (255, 69, 0) | Degats/resistance feu |
| Cold (Froid) | #4488FF | (68, 136, 255) | Degats/resistance froid |
| Lightning (Foudre) | #FFFF00 | (255, 255, 0) | Degats/resistance foudre |
| Poison | #00FF00 | (0, 255, 0) | Degats/resistance poison |
| Physical | #C8BEA0 | (200, 190, 160) | Degats physiques (texte normal) |
| Magic | #6969FF | (105, 105, 255) | Degats magiques |

---

### 2.2 Typographie

#### Polices utilisees dans Diablo 2

| Police | Usage | Poids | Taille typique |
|--------|-------|-------|----------------|
| **Exocet Heavy** | Logo, titres principaux, nom du jeu | Heavy/Bold | 36-48px |
| **Exocet Light** | Titres de panneaux, noms importants | Light/Regular | 18-24px |
| **Formal 436 BT** | Texte de body, descriptions, dialogues | Regular | 11-14px |
| **Font16 (bitmap)** | Texte in-game standard (chat, labels) | N/A | 16px fixe |
| **Font30 (bitmap)** | Titres plus grands in-game | N/A | 30px fixe |
| **Font42 (bitmap)** | Chiffres de degats (overlays combat) | N/A | 42px fixe |

**Note sur Exocet** : Concu en 1991 par Jonathan Barnbrook pour la fonderie Emigre. Police decorative serif avec empattements angulaires prononces, evoquant des inscriptions anciennes. C'est LA police iconique de la franchise Diablo.

**Note sur les polices bitmap** : Le D2 original utilise des polices bitmap (BMFont format : .fnt + PNG atlas). Chaque taille est une texture separee. Les polices bitmap garantissent un rendu pixel-perfect a toutes les resolutions.

**Pour le MGE** : Utiliser une police TTF libre de style similaire a Exocet (ex: "AvQest", "Cinzel Decorative", "Uncial Antiqua") ou acheter la licence Exocet. Les polices bitmap sont le format natif a privilegier pour le rendu in-game (deja prevu dans le pipeline : `BMFont .fnt + PNG`).

---

### 2.3 Iconographie

| Type d'icone | Taille | Style | Exemples |
|-------------|--------|-------|----------|
| Skill icons | 40x40px ou 48x48px | Illustration peinte, cadre metallique | Bone Spear, Frozen Orb, Teleport |
| Item icons | Variable (suit la taille de l'item en grille) | Rendu 3D pre-calcule, fond transparent | Chaque item a son propre visuel |
| Potion icons | ~28x28px (1 cellule) | Fioles stylisees, couleur de la potion | Rouge (vie), bleu (mana), violet (rejuvenation) |
| Gem icons | ~28x28px | Pierres precieuses facettees | Topaz (jaune), Sapphire (bleu), Ruby (rouge), Emerald (vert), Diamond (blanc), Amethyst (violet), Skull (gris) |
| Rune icons | ~28x28px | Pierres gravees avec runes | El, Eld, Tir... Zod |
| Cursor icons | ~32x32px | Main gantee metallique | Normal, drag, target, cast |
| Menu icons | ~20x20px | Icones dorees stylisees | Inventaire, Skills, Character, Quest, Map |
| Charm icons | 28x28 (small), 28x56 (large), 56x84 (grand) | Amulettes/medaillons peints | Small Charm, Large Charm, Grand Charm |

---

### 2.4 Patterns decoratifs

#### Cadres gothiques
- **Coins ornementes** : Motifs de cranes, griffes, ailes demoniaques ou angeliques aux 4 coins des panneaux
- **Bordures** : Bandes metalliques (or terne) avec rivets et gravures
- **Fond de panneaux** : Texture pierre sombre avec micro-variations (bruit de Perlin subtil)
- **Separateurs** : Lignes horizontales dorees avec petits ornements centraux (losange, cercle)

#### Orbes (vie/mana)
- **Cadre** : Cercle metallique ornemente avec cranes/griffes
- **Remplissage** : Liquide semi-transparent avec animation de "bouillonnement"
- **Fond d'orbe** : Noir avec texture de verre/cristal

#### Texture de pierre
- Couleur de base : gris-brun chaud (#1C160E a #2A2015)
- Variations : fissures, joints de maconnerie
- Vieillissement : usure aux bords, taches plus sombres
- Luminosite : reflets subtils sur les bords des cadres metalliques

---

### 2.5 Tooltips

**Style** :
- Fond : noir opaque (#000000) ou tres sombre avec alpha 0.85-0.95
- Bordure : fine ligne doree (#C7B377, 1px)
- Padding : ~6-8px
- Largeur max : ~200-250px
- Position : a droite et au-dessus du curseur (offset +16px, +0px)

**Structure d'un tooltip d'item** :
1. **Nom de l'item** (premiere ligne) : couleur de rarete, taille 13-14px, gras
2. **Type de base** : texte normal gris, taille 11px
3. **Separateur** : fine ligne doree
4. **Proprietes magiques** : texte bleu (#6969FF), une par ligne, taille 11px
5. **Degats/Defense** : texte blanc
6. **Requirements** : texte blanc, rouge si non remplis
7. **Durabilite** : texte gris "Durability: X/Y"
8. **Niveau requis** : texte blanc "Required Level: X"
9. **Description set** (si item de set) : texte vert, liste des pieces et bonus
10. **Prix de vente** : texte dore "Sell value: X gold"

**Structure d'un tooltip de skill** :
1. **Nom du skill** : texte dore, gras, taille 14px
2. **Niveau actuel** : "Level: X"
3. **Description** : texte blanc, taille 11px
4. **Cout en mana** : texte bleu
5. **Degats/effets au niveau actuel** : texte blanc
6. **"Next Level" : degats au niveau suivant** : texte gris
7. **Synergies** : "Receives bonus from: [skills]"

---

### 2.6 Couleurs de rarete items — Resume visuel

```
Normal    : Texte blanc/gris clair (#C8BEA0) — objet commun
Socketed  : Texte gris (#848484) — objet avec trous
Magic     : Texte bleu (#6969FF) — 1-2 affixes magiques
Rare      : Texte jaune (#FFFF64) — 3-6 affixes, nom aleatoire
Unique    : Texte or/brun (#A56E00) — item nomme legendaire
Set       : Texte vert (#00B400) — piece d'un set nomme
Crafted   : Texte orange (#FFA500) — fabrique au Cube
Rune Word : Texte orange (#FFA500) — mot runique dans un item sockete
```

---

## 3. Composants UI reutilisables — Classification Atomic Design

### 3.1 Atoms (Elements primitifs indivisibles)

| Atom | Description | Props cles | Variantes |
|------|-------------|------------|-----------|
| **D2Button** | Bouton style D2 avec fond pierre et texte dore | label, size, variant, disabled, on_click | Primary (grand, dore), Secondary (petit, gris), Menu (bouton de menu HUD) |
| **HealthOrb** | Orbe circulaire remplie proportionnellement | current, maximum, color (rouge/bleu), label | Life (rouge), Mana (bleu) |
| **ProgressBar** | Barre de progression horizontale | value (0.0-1.0), color, height | XP (or, 5px), Stamina (jaune, 6px), Loading (or, 10px) |
| **SlotFrame** | Cadre de slot vide (grille/equip) | size, is_hovered, is_selected | Inventory (28x28), Equipment (38x38), Belt (36x36), Skill (40x40) |
| **ItemIcon** | Icone d'item dans un slot | item_id, quality, width_cells, height_cells, is_identified | Par taille (1x1 a 2x4) |
| **QualityText** | Texte colore selon la rarete | text, quality | Normal, Magic, Rare, Unique, Set, Crafted, RuneWord |
| **GoldDisplay** | Affichage de l'or avec icone | amount | HUD (compact), Inventory (complet) |
| **SeparatorLine** | Separateur gothique horizontal | width, variant | Simple (ligne), Ornate (avec losange central) |
| **PanelFrame** | Cadre gothique de panneau | width, height, title | Standard, Ornate (coins decores) |
| **TabButton** | Onglet cliquable | label, is_active | Active (lumineux), Inactive (terne) |
| **StatLabel** | Label + valeur pour une stat | label, value, color | Standard, Bonus (vert), Penalty (rouge) |
| **ResistanceBar** | Barre de resistance avec couleur element | element, value_pct | Fire, Cold, Lightning, Poison |

### 3.2 Molecules (Compositions d'atoms)

| Molecule | Description | Atoms utilises | Props cles |
|----------|-------------|----------------|------------|
| **InventorySlot** | Un slot de la grille avec item optionnel | SlotFrame + ItemIcon + QualityText | position (x,y), item, on_click, on_hover, on_drag |
| **EquipSlot** | Emplacement d'equipement avec silhouette | SlotFrame + ItemIcon | slot_type (Head/Body/...), item, on_equip |
| **SkillNode** | Noeud de competence dans l'arbre | SlotFrame + icone skill + niveau | skill_id, level, max_level, is_available, on_click, on_right_click |
| **StatRow** | Ligne de stat avec bouton "+" | StatLabel + D2Button | stat_name, value, can_add, on_add |
| **ResistanceRow** | Ligne de resistance avec couleur | ResistanceBar + StatLabel | element, value, is_capped |
| **BeltColumn** | Colonne de potion dans la ceinture | SlotFrame x 1-4 + ItemIcon | column_index, potions[], key_binding |
| **QuestEntry** | Entree de quete dans le journal | icone + label + etat | quest_id, name, state (inactive/active/complete) |
| **WaypointEntry** | Entree de waypoint cliquable | label + etat | zone_name, is_discovered, is_current |
| **PlayerEntry** | Entree de joueur dans le party panel | nom + classe + vie + boutons | player_id, name, class, life_pct, is_hostile |
| **ChatMessage** | Message unique dans le chat | texte + couleur + timestamp | sender, text, msg_type (system/player/whisper) |
| **TooltipLine** | Ligne individuelle de tooltip | QualityText ou StatLabel | text, color, size, is_bold |

### 3.3 Organisms (Panneaux complets)

| Organism | Description | Molecules/Atoms utilises |
|----------|-------------|--------------------------|
| **HudBar** | Barre de HUD complete en bas de l'ecran | HealthOrb x2 + SkillSlot x2 + BeltColumn x4 + ProgressBar (XP) + GoldDisplay + D2Button (menu) |
| **InventoryPanel** | Panneau d'inventaire complet | EquipSlot x10 (paperdoll) + InventorySlot x40 (grille 10x4) + GoldDisplay |
| **SkillTreePanel** | Panneau de l'arbre de competences | TabButton x3 + SkillNode x10 + lignes de prerequis + compteur de points |
| **CharacterSheet** | Fiche de personnage complete | StatRow x4 (base) + StatLabel (derives) + ResistanceRow x4 + D2Button (+) |
| **QuestLog** | Journal de quetes complet | TabButton x5 (actes) + QuestEntry x6 + zone de detail |
| **WaypointMap** | Carte de waypoints | TabButton x5 + WaypointEntry x9 |
| **TradeWindow** | Fenetre d'echange | InventorySlot x25 x2 + GoldDisplay x2 + D2Button (Accept/Cancel) |
| **StashPanel** | Coffre de stockage | TabButton (D2R) + InventorySlot x48-100 + GoldDisplay |
| **CubePanel** | Cube Horadrique | InventorySlot x12 (3x4) + D2Button (Transmute) |
| **NpcDialog** | Fenetre de dialogue PNJ | Portrait + texte + D2Button x3-5 (options) |
| **MercenaryPanel** | Panneau du mercenaire | EquipSlot x3 + StatLabel (stats) |
| **PartyPanel** | Panneau de groupe | PlayerEntry x8 |
| **ChatOverlay** | Zone de chat | ChatMessage x15-20 + champ de saisie |
| **MinimapOverlay** | Mini-carte | Canvas de rendu + legende |
| **ItemTooltip** | Tooltip d'item detaille | TooltipLine x5-15 + SeparatorLine + PanelFrame |
| **SkillTooltip** | Tooltip de skill detaille | TooltipLine x8-12 + PanelFrame |

### 3.4 Templates (Layouts d'ecrans)

| Template | Description | Organisms utilises |
|----------|-------------|-------------------|
| **GameplayLayout** | Layout principal en jeu | HudBar (bottom) + MinimapOverlay (top-right) + ChatOverlay (bottom-left) + [InventoryPanel / SkillTreePanel / CharacterSheet / QuestLog / WaypointMap en overlay] |
| **MenuLayout** | Layout des menus hors-jeu | PanelFrame centre + D2Button empiles + fond illustre |
| **CharSelectLayout** | Layout selection de personnage | Liste personnages (gauche) + apercu (droite) + D2Button (bas) |
| **LoadingLayout** | Layout ecran de chargement | Illustration plein ecran + ProgressBar (bas) + texte zone |
| **TradeLayout** | Layout de trade | TradeWindow (centre) + InventoryPanel (cote) |
| **NpcLayout** | Layout d'interaction NPC | NpcDialog (centre-bas) + [ShopGrid si Trade] |

---

## 4. Points de friction et qualites du design D2

### 4.1 Ce qui fonctionne exceptionnellement bien

1. **Les orbes de vie/mana** : Metaphore visuelle immediate et iconique. On sait instinctivement ou en est son personnage. L'animation du liquide ajoute du "juice" sensoriel.

2. **Les couleurs de rarete** : Le systeme de couleurs (blanc, bleu, jaune, or, vert, orange) est devenu un standard de l'industrie. Instantanement lisible meme dans un flux rapide de loot.

3. **Le "Tetris d'inventaire"** : Les items de tailles variables (1x1 a 2x4) creent une micro-gestion strategique qui ajoute de la profondeur. Le joueur ressent physiquement la valeur et l'encombrement des items.

4. **Le systeme de belt** : Le mecanisme de "distributeur automatique" (potions qui descendent) est elegant et efficace. Quatre touches (1-4) suffisent pour le healing en combat.

5. **Les tooltips multicolores** : La structure du tooltip (nom colore, type en gris, proprietes en bleu, requirements en blanc/rouge) est immediatement scannable. Le joueur identifie la valeur d'un item en < 1 seconde.

6. **L'arbre de competences a 3 onglets** : La presentation visuelle avec fleches de prerequis donne une "carte" mentale claire du build. Les synergies encouragent l'exploration.

7. **L'automap overlay** : L'overlay semi-transparent est un design brillant -- on voit a la fois la carte ET le gameplay sans avoir a switcher de vue.

8. **La palette sombre et chaude** : Le choix du "noir chaud" (#0A0805) au lieu du noir pur donne une ambiance oppressante sans etre agressive pour les yeux. Les accents dores contrastent parfaitement.

9. **La simplicit des stats** : 4 stats de base avec bouton "+" est intuitif. Les stats derivees sont visibles mais ne polluent pas l'espace.

10. **Le son UI** : Bien que non visuel, le "clink" metallique du loot, le "whoosh" des portails, le "ting" des niveaux -- tout participe a la coherence de l'interface.

### 4.2 Ce qui est date ou problematique

1. **Resolution fixe 800x600** : Le jeu original etait concu pour exactement 800x600 (ou 640x480 en Classic). Tout est positionne en pixels absolus. Pas de responsive, pas de scaling.

2. **Pas de filtre de loot natif** : Les items au sol sont listes en texte Alt+hover sans filtrage. En endgame, l'ecran est noye de texte blanc inutile. C'est le defaut le plus critique du D2 original.

3. **Taille du stash insuffisante** : 8x6 (48 slots) en LoD est ridiculement petit pour un jeu base sur la collection. Les joueurs "mule" en creant des personnages uniquement pour stocker.

4. **Pas de comparaison d'items** : Aucun moyen natif de comparer un item au sol avec l'item equipe sans ouvrir l'inventaire.

5. **Drag-drop imprecis** : Le systeme de drag-drop peut causer des drops accidentels d'items de valeur. Pas de confirmation pour jeter un item unique au sol.

6. **Allocation de stats irr versible** : Pas de respec natif (seulement 1 respec par difficulte ajoutee tardivement). Un point mal place est permanent, ce qui est punitif et anti-experimentation.

7. **Interface de trade peu securisee** : Le trade screen original etait sujet aux scams (switch d'item rapide). D2R a ameliore cela.

8. **Pas de search dans le stash** : Impossible de chercher un item par nom dans le coffre. On scrolle et on scan visuellement.

9. **Skill tree non respecable** : Meme probleme que les stats -- un point de skill est irr versible.

10. **Chat rudimentaire** : Pas de tabs, pas de filtres, pas d'historique persistant.

### 4.3 Ce que D2 Resurrected a ameliore

| Amelioration | Impact |
|-------------|--------|
| **Stash etendu** : 10x10 personnel + 3-5 onglets shared | Resout le probleme #3 majeur |
| **Auto gold pickup** : L'or est ramasse automatiquement en marchant dessus | QoL enorme, pas de micro-clic |
| **Panneau Advanced Stats** : Liste tous les bonus d'equipement | Transparence totale des stats |
| **Comparaison d'items** : Shift+survol compare avec l'equipe | Resout le probleme #4 |
| **UI scaling** : Support des resolutions modernes (1080p, 1440p, 4K) | Resout le probleme #1 |
| **Large font mode** : Mode grands caracteres pour accessibilite | Accessibilite |
| **Skill direct cast** : Touche numerique cast directement le skill | Plus besoin de changer de skill assigne |
| **Clock** : Horloge affichee dans l'interface | QoL mineure mais appreciee |
| **Controller support** : Interface adaptee manette (console) | Nouvelle audience |

### 4.4 Recommandations pour notre reproduction (Sodomight)

**A reproduire fidelement (le "core" iconique)** :
- Orbes de vie/mana avec animation
- Systeme de couleurs de rarete
- Grille d'inventaire Tetris (10x4)
- Paperdoll avec emplacements anatomiques
- Arbre de skills a 3 onglets
- Tooltips multicolores structures
- Automap semi-transparent
- Belt 4 colonnes avec distribution auto
- Palette sombre et chaude
- Cadres gothiques et texture pierre

**A implementer en mieux que D2 (QoL D2R + extensions)** :
- Filtre de loot configurable (non present dans D2 original, partiellement dans D2R, excellent dans Path of Exile)
- Stash multi-onglets des le debut (pas la limitation 8x6)
- Comparaison d'items native (Shift+hover)
- Recherche dans le stash par nom/type
- Respec de stats et skills (avec cout en ressources, pas gratuit)
- Confirmation avant drop d'items rares+
- Auto gold pickup par defaut
- UI scalable (notre dual-res 800x600 pixel-perfect ET HD)
- Panneau de stats avancees

**A eviter (erreurs de D2 ou pieges)** :
- Ne pas copier la limitation 800x600 fixe -- prevoir le scaling des le depart
- Ne pas hardcoder les positions en pixels -- utiliser un systeme d'ancrage relatif
- Ne pas oublier le filtre de loot -- c'est le QoL #1 attendu par les joueurs modernes
- Ne pas rendre les allocations irr versibles sans option de respec
- Ne pas sous-estimer la taille du stash -- prevoir large des le debut

---

## 5. Recommandations techniques pour le MGE

### 5.1 Ecart entre l'existant et la cible

L'analyse du code existant dans `mge/crates/engine/mge-ui/src/` revele les ecarts suivants :

| Composant | Etat actuel | Cible D2 | Ecart |
|-----------|-------------|----------|-------|
| **theme.rs** | 16 couleurs D2, theme egui basique | Palette complete (40+ couleurs), polices Exocet, textures pierre | MAJEUR : manque textures, polices bitmap, ornements |
| **hud.rs** | Orbes rectangulaires, belt 4 slots verticaux (pas 4x4), skill hotbar 8 slots | Orbes ronds animes, belt 4 colonnes x 4 rangees, 2 slots skill (gauche/droite), boutons menu | MAJEUR : layout incorrect, pas d'animation, belt mauvaise structure |
| **inventory.rs** | Grille 10x4 OK, paperdoll basique (2 lignes horizontales) | Paperdoll anatomique, drag-drop, item swap, right-click equip | MODERE : la grille est correcte, le paperdoll doit etre revu |
| **character.rs** | Stats de base + resistances OK, layout correct | Layout D2 exact, boutons "+" fonctionnels, stats derivees completes | MODERE : fonctionnel mais pas fidele visuellement |
| **skill_tree.rs** | STUB -- placeholder vide | 3 onglets, 10 nodes par arbre, lignes de prerequis, tooltips, allocation | MAJEUR : tout est a faire |
| **tooltip.rs** | Structure basique fonctionnelle | Multicolore, structure D2 exacte, set bonuses, requirements colores | MODERE : enrichir le contenu |
| **minimap.rs** | STUB -- rectangle vide | Rendu automap isometrique, entites, toggle overlay | MAJEUR : tout est a faire |
| **dialog.rs** | Fenetre basique avec bouton Fermer | Portrait NPC, options multiples, lore/trade/quest | MODERE : ajouter portrait et options |
| **menus/** | Main menu fonctionnel, char select stub | Background artistique, animations, creation de personnage | MODERE : enrichissement visuel |
| **stash** | NON IMPLEMENTE | Grille multi-onglets, transfert or | MAJEUR : a creer |
| **cube** | NON IMPLEMENTE | Grille 3x4, bouton Transmute | MODERE : a creer |
| **trade** | NON IMPLEMENTE | Grille 5x5 x2, acceptation mutuelle | MODERE : a creer |
| **quest_log** | NON IMPLEMENTE | 5 onglets, 6 quetes par acte, etats | MODERE : a creer |
| **waypoint** | NON IMPLEMENTE | 5 onglets, liste waypoints, teleportation | MODERE : a creer |
| **party** | NON IMPLEMENTE | Liste joueurs, hostile, loot settings | FAIBLE : Sprint 4+ |
| **mercenary** | NON IMPLEMENTE | 3 equip slots, stats | FAIBLE : Sprint 3+ |
| **belt full** | 4 slots simples | 4 colonnes x 4 rangees avec distribution auto | MAJEUR : refonte complete |

### 5.2 Priorites d'implementation suggerees

**Sprint 1 (critique pour boucle de jeu)** :
1. Refonte HUD : orbes rondes, belt 4x4, 2 skill slots, barre XP correcte
2. Enrichir le theme : polices, palette complete, textures de base
3. Ameliorer l'inventaire : paperdoll anatomique, drag-drop basique
4. Implementer le tooltip complet

**Sprint 2 (progression et profondeur)** :
5. Implementer le Skill Tree complet (3 onglets, nodes, prerequis, allocation)
6. Ameliorer le Character Sheet (layout D2 exact, stats derivees)
7. Implementer le Stash (grille multi-onglets)
8. Implementer le Cube (grille 3x4, transmutation)
9. Implementer le Quest Log

**Sprint 3 (acte complet)** :
10. Implementer le Waypoint Map
11. Implementer le NPC Dialog complet (portrait, options)
12. Refaire les menus (backgrounds, creation de personnage)
13. Implementer l'Automap/Minimap fonctionnelle

**Sprint 4+ (multijoueur)** :
14. Trade Window
15. Party Panel
16. Chat system
17. Mercenary Panel

### 5.3 Decisions d'architecture pour Denis

1. **Polices** : Prevoir le chargement de polices TTF (Exocet-like) ET bitmap (BMFont) dans egui. La crate `egui` supporte les deux via `FontDefinitions`. Privilegier les polices bitmap pour le rendu pixel-perfect en mode 800x600.

2. **Textures de fond** : Les panneaux D2 utilisent des textures de pierre pre-rendues, pas de la couleur unie. Prevoir un systeme de "9-patch" (ou "9-slice") pour les cadres de panneaux qui s'adaptent a differentes tailles.

3. **Drag-and-Drop** : egui a un systeme de drag-drop basique. Il faudra l'etendre pour supporter le "ramassage" d'item au clic, le suivi du curseur, et le swap/drop. C'est un systeme complexe a bien faire.

4. **Animations d'orbes** : L'animation de "bouillonnement" du liquide dans les orbes est un shader ou une texture animee. En egui, on peut utiliser un `TextureHandle` anime (spritesheet de l'orbe a differents niveaux de remplissage).

5. **Systeme de layout relatif** : Remplacer les positions absolues actuelles par un systeme d'ancrage (top-left, bottom-center, etc.) avec offsets relatifs a la resolution. C'est crucial pour le support dual-res.

6. **Theme extensible** : Le theme actuel `D2Colors` est un struct avec des `const`. C'est correct pour un theme unique. Si on veut supporter des variantes (mode daltonien, mode contraste eleve), il faudra un systeme de theme runtime (via `miyuki-ui-tokens`).

---

## 6. Comparaison avec les concurrents (ARPGs modernes)

### 6.1 Path of Exile (Grinding Gear Games)

| Aspect UI | PoE | D2 | Notre approche |
|-----------|-----|-----|----------------|
| Filtre de loot | Excellent (systeme de filtres textuels communautaires) | Inexistant | Implementer un systeme de filtre configurable |
| Stash | 4 onglets gratuits + onglets achetables (monetisation) | 1 stash minuscule | Multi-onglets genereux |
| Skill tree | Enorme (1000+ nodes) | 3x10 nodes par classe | Rester fidelement D2 |
| Tooltips | Tres detailles, parfois trop | Equilibres | Suivre le style D2 |
| Trade | Systeme externe (site web) | En jeu P2P | En jeu P2P comme D2 |

### 6.2 Last Epoch (Eleventh Hour Games)

| Aspect UI | Last Epoch | D2 | Notre approche |
|-----------|-----------|-----|----------------|
| Inventaire | Grille uniforme (tous items 1x1) | Tetris (tailles variables) | Tetris D2 fidele |
| Crafting | Interface dediee elaboree | Cube basique | Cube D2 + QoL |
| Stash | Tabs categories avec filtres | Basique | Multi-onglets avec recherche |
| Loot filter | Basique integre | Inexistant | Configurable |

### 6.3 Grim Dawn (Crate Entertainment)

| Aspect UI | Grim Dawn | D2 | Notre approche |
|-----------|----------|-----|----------------|
| UI Style | Moderne flat | Gothique textures | Gothique textures D2 |
| Inventaire | Tetris-like | Tetris | Tetris D2 |
| Stats | Panel detaille | 4 stats base | D2 style + advanced panel |

---

## 7. Assets existants dans le projet MGE

Le repertoire `mge/assets/` contient des packs potentiellement utiles pour le theming UI :

| Pack | Localisation | Usage potentiel |
|------|-------------|-----------------|
| RP_MMO_Sliced | `mge/assets/RP_MMO_Sliced/` | Textures de fenetres (Guild Window, etc.), boutons, cadres -- pourrait servir de base pour les cadres de panneaux |
| Fantasy Icons Mega Pack | `mge/assets/icons/fantasyiconsmegapack/` | Icones pour items, potions, gemmes -- placeholders avant les assets finaux |
| Dev Assets | `mge/assets/Dev_assets/` | Sprites de test (tiles, joueur, NPC) -- deja utilises |
| Fonts | `mge/assets/fonts/` | Polices disponibles -- verifier si une police de style Exocet est presente |

---

## Annexe A — Arbres de competences du Necromancer (reference pour implementation)

### Summoning Spells
```
Rangee 1 (Lvl 1)  : [Raise Skeleton] ---- [Skeleton Mastery]
                          |
Rangee 2 (Lvl 6)  :  [Clay Golem]
                          |
Rangee 3 (Lvl 12) : [Golem Mastery] ---- [Raise Skeletal Mage]
                          |
Rangee 4 (Lvl 18) :  [Blood Golem]
                          |
Rangee 5 (Lvl 24) : [Summon Resist] ---- [Iron Golem]
                          |
Rangee 6 (Lvl 30) :  [Fire Golem] ------ [Revive]
```

### Poison and Bone Spells
```
Rangee 1 (Lvl 1)  : [Teeth] ----------- [Bone Armor]
                       |                      |
Rangee 2 (Lvl 6)  : [Poison Dagger] -- [Corpse Explosion]
                       |                      |
Rangee 3 (Lvl 12) :     [Bone Wall]
                       |       |
Rangee 4 (Lvl 18) : [Poison Explosion] [Bone Spear]
                       |       |
Rangee 5 (Lvl 24) :     [Bone Prison]
                       |       |
Rangee 6 (Lvl 30) : [Poison Nova] ---- [Bone Spirit]
```

### Curses
```
Rangee 1 (Lvl 1)  : [Amplify Damage]
                       |
Rangee 2 (Lvl 6)  : [Dim Vision] ----- [Weaken]
                       |                    |
Rangee 3 (Lvl 12) : [Iron Maiden] ---- [Terror]
                       |                    |
Rangee 4 (Lvl 18) : [Confuse] -------- [Life Tap]
                       |                    |
Rangee 5 (Lvl 24) : [Attract] -------- [Decrepify]
                                            |
Rangee 6 (Lvl 30) :                   [Lower Resist]
```

---

## Annexe B — Sources

### Wikis et references
- [DiabloWiki.net - Interface](https://www.diablowiki.net/Interface)
- [Diablo Wiki (Fandom) - Character Screen](https://diablo.fandom.com/wiki/Character_Screen)
- [Diablo Wiki (Fandom) - Inventory](https://diablo.fandom.com/wiki/Inventory)
- [Diablo Wiki (Fandom) - Skill Trees](https://diablo.fandom.com/wiki/Skill_Trees)
- [Diablo Wiki (Fandom) - Character Attributes](https://diablo.fandom.com/wiki/Character_Attributes)
- [Diablo 2 Wiki - Inventory Size](https://diablo2.diablowiki.net/Inventory_size)
- [Diablo 2 Wiki - Health Globe](https://diablo2.diablowiki.net/Health_Globe)
- [Diablo 2 Wiki - Belts](https://diablo2.diablowiki.net/Belts)
- [Diablo Archive (Fandom) - Belts D2](https://diablo-archive.fandom.com/wiki/Belts_(Diablo_II))
- [Diablo Archive (Fandom) - Stash D2](https://diablo-archive.fandom.com/wiki/Stash_(Diablo_II))
- [Diablo Archive (Fandom) - Horadric Cube D2](https://diablo-archive.fandom.com/wiki/Horadric_Cube_(Diablo_II))
- [Fextralife - Necromancer Skills](https://diablo2.wiki.fextralife.com/Necromancer+Skills)
- [Arreat Summit - Character Information](https://classic.battle.net/diablo2exp/basics/characters.shtml)

### Bases de donnees UI
- [Game UI Database - Diablo II](https://www.gameuidatabase.com/gameData.php?id=804)
- [Interface In Game - D2R Technical Alpha](https://interfaceingame.com/games/diablo-ii-resurrected-technical-alpha/)

### Typographie
- [Exocet - Diablo Wiki Fandom](https://diablo.fandom.com/wiki/Exocet)
- [Diablo II logo and menu - Fonts In Use](https://fontsinuse.com/uses/60790/diablo-ii-logo-and-menu)
- [Exocet (typeface) - Wikipedia](https://en.wikipedia.org/wiki/Exocet_(typeface))

### Couleurs et modding
- [D2R String Color Codes - Phrozen Keep](https://d2mods.info/forum/viewtopic.php?t=67420)
- [D2R Rarity Colors - VHPG](https://www.vhpg.com/d2r-rarity-colors/)
- [D2R Colored Text - VHPG](https://www.vhpg.com/d2r-colored-text/)
- [Diablo II Color Codes - Brand Palettes](https://brandpalettes.com/diablo-ii-color-codes/)

### D2 Resurrected QoL
- [D2R UI Changes - diablo2.io](https://diablo2.io/forums/how-has-the-user-interface-in-diablo-2-resurrected-changed-t8799.html)
- [D2R QoL Changes - Blizzard Watch](https://blizzardwatch.com/2021/09/22/diablo-2-resurrected-quality-of-life-changes/)
- [D2R Biggest Changes - Gamerant](https://gamerant.com/diablo-2-resurrected-biggest-update-changes/)
- [D2R Shared Stash - diablo2.io](https://diablo2.io/forums/how-does-the-shared-stash-in-diablo-2-resurrected-work-t8783.html)

### Art et design
- [D2R UI Art - Miguel Duran (ArtStation)](https://www.artstation.com/artwork/Ge1lNd)
- [D2R Act 3 Loading Screen - Rachel Relyea](https://rachelrelyea.com/projects/g01DyL)

### Modding technique (panel dimensions)
- [Phrozen Keep - D2 Panels](https://d2mods.info/forum/viewtopic.php?t=58281)
- [Phrozen Keep - Additional UI Panels](https://d2mods.info/forum/viewtopic.php?t=67334)
- [Phrozen Keep - Font Guide](https://d2mods.info/forum/viewtopic.php?t=67470)
- [D2 Fonts - GitLab (Vosa Thomas)](https://gitlab.com/Wasps/diablo-2-fonts)

### Skill tree calculators (reference visuelle)
- [Wowhead D2 Necromancer Skill Calculator](https://www.wowhead.com/diablo-2/skill-calc/necromancer)
- [Icy Veins D2 Necromancer Skill Calculator](https://www.icy-veins.com/d2/necromancer-skill-calculator)
- [diablo2.io Skill Tree Calculator](https://diablo2.io/skilltree.php)

---

*Rapport redige par Fabrice -- Analyste PR, Miyukini AI Studio*
*A transmettre a Maria pour validation, puis Denis pour exploitation technique (P1 Spec)*
