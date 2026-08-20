---
name: ft_transcendence
description: Un Pong d'été en 3D — HUD tropical façon PS1–GameCube posé sur une île au couchant
colors:
  sunset-orange: "#ff8c00"
  sunset-orange-bright: "#ffa500"
  lava-orange: "#ff5722"
  lava-orange-deep: "#ff3d00"
  lava-orange-soft: "#ff7043"
  sun-gold: "#ffcc00"
  lagoon-blue: "#00a2ff"
  deep-sea-blue: "#0066ff"
  menu-blue: "#0091e6"
  menu-blue-deep: "#0055cc"
  pad-orange: "#ff6600"
  pad-blue: "#00a9ff"
  night: "#121212"
  night-raised: "#1e1e1e"
  panel-smoke: "rgba(34, 34, 34, 0.8)"
  panel-smoke-soft: "rgba(34, 34, 34, 0.7)"
  panel-smoke-strong: "rgba(34, 34, 34, 0.9)"
  field-slate: "#2a2a2a"
  field-border: "#3e3e3e"
  border-subtle: "#555555"
  paper: "#e0e0e0"
  chalk: "#ffffff"
  muted-sand: "#888888"
  on-accent: "#121212"
  reef-green: "#28a745"
  reef-green-win: "#4caf50"
  coral-red: "#dc3545"
  coral-red-loss: "#f44336"
typography:
  display:
    fontFamily: "Bebas Neue, Impact, sans-serif"
    fontSize: "50px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "4px"
  headline:
    fontFamily: "Poppins, Helvetica, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Poppins, Helvetica, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "Poppins, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "0.02em"
  field:
    fontFamily: "Poppins, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  xs: "4px"
  sm: "5px"
  md: "8px"
  lg: "10px"
  game: "16px"
  pill: "25px"
spacing:
  xs: "5px"
  sm: "10px"
  md: "15px"
  lg: "20px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.lava-orange}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.lava-orange-deep}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "{colors.field-slate}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.field-border}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.lava-orange}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.lava-orange}"
    textColor: "{colors.on-accent}"
  button-menu:
    backgroundColor: "{colors.menu-blue}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.game}"
    padding: "18px 36px"
  button-menu-hover:
    backgroundColor: "{colors.menu-blue-deep}"
    textColor: "{colors.on-accent}"
  button-icon:
    backgroundColor: "{colors.sunset-orange}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    size: "36px"
  button-icon-hover:
    backgroundColor: "{colors.sunset-orange-bright}"
    textColor: "{colors.on-accent}"
  input-field:
    backgroundColor: "{colors.field-slate}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "12px"
    typography: "{typography.field}"
  input-field-hover:
    backgroundColor: "{colors.field-slate}"
    textColor: "{colors.chalk}"
  list-item:
    backgroundColor: "{colors.panel-smoke-soft}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "10px"
  tab-active:
    backgroundColor: "{colors.sunset-orange}"
    textColor: "{colors.on-accent}"
    rounded: "8px 8px 0 0"
    padding: "8px 12px"
  panel-card:
    backgroundColor: "{colors.panel-smoke}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: ft_transcendence

## Overview

**Périmètre.** Ce document gouverne les jetons visuels et les composants : la
couleur, la typographie, la forme, l'élévation et le rythme d'espacement. Il ne
gouverne **pas** l'interaction — les états d'erreur, de chargement, de vide et
de déconnexion, les machines à états des menus et le comportement clavier n'y
figurent pas et ne s'en déduisent pas. Ce qui n'est pas ici n'est pas pour
autant décidé ailleurs : c'est une lacune connue, pas un renvoi.

Ce qui est mécaniquement vérifié l'est par `scripts/check-design.mjs`, dans
`make check`. Le reste est tenu à la relecture, et vieillit donc en silence.

**Creative North Star : « Le Pong d'Été »**

La référence de départ est littérale : _Super Mario Sunshine_ (GameCube, 2002).
Un été tropical de l'ère PS1–GameCube, saturé, franc, sans ironie — soleil bas,
eau turquoise, palmiers, et des couleurs qui ne s'excusent pas. La scène 3D
porte déjà ce monde : un ciel de Preetham dont le dégradé pose le couchant, un
soleil chaud (`0xfff4e0`) qui porte seul les ombres, eau turquoise (`0x20b8c5`),
et deux raquettes qui s'opposent en orange et en bleu. Tout le reste est un HUD
posé par-dessus.

Ce HUD est sombre pour laisser l'île respirer. Le fond est un noir tiède
(#121212), les panneaux sont des fumées translucides posées dessus, et la
couleur ne sert jamais de décor : elle nomme une équipe, un état, ou une action.
Le jeu, lui, hausse la voix — cadres d'or épais, halos, gros boutons ronds,
chiffres criés en Bebas Neue. C'est la partie borne d'arcade du projet, et elle
a le droit d'être bruyante parce qu'elle ne dure que le temps d'un match.

Le produit vit en deux registres voisins et assumés : l'application (comptes,
amis, chat, statistiques) parle orange et ambre sur nuit ; le jeu parle bleu et
or. La frontière entre les deux est le lancement d'une partie, pas un dégradé.

**Key Characteristics :**

- Couchant tropical saturé, hérité de la 3D, jamais d'une palette d'interface.
- Fond nuit + panneaux de fumée translucide : l'île reste le sujet.
- Deux registres : orange/ambre côté application, bleu/or côté jeu.
- L'or encadre, il ne remplit pas.
- Le jeu crie (Bebas Neue, halos, rayons doublés), l'application parle bas.
- Le focus se voit toujours : un anneau d'or de 3 px, sur les deux rives.

## Colors

Les valeurs ci-dessus vivent dans `frontend/src/css/tokens.css` en propriétés
personnalisées ; les cinq feuilles de vue et celle du jeu y lisent —
`css/game.css` les importe par `@import "./tokens.css"`, résolu au build. Aucune
couleur du système ne s'écrit plus en dur.

Palette de couchant : des oranges chauds et un or franc contre un bleu lagon,
posés sur une nuit tiède. Rien de pastel, rien de désaturé.

### Primary

- **Orange Couchant** (#ff8c00) : l'accent de l'application. Titres de colonnes,
  bordures actives, onglet sélectionné, bouton d'envoi du chat, ascenseurs,
  pastille d'avatar. C'est la couleur qui dit « ici, c'est cliquable ou c'est à
  vous ».
- **Orange Vif** (#ffa500) : l'état survolé du précédent, jamais un état de
  repos.
- **Orange Lave** (#ff5722) : l'accent des écrans de compte — connexion,
  inscription, paramètres, profil. Boutons primaires, titres, libellés de
  champs.
- **Lave Profonde** (#ff3d00) et **Lave Douce** (#ff7043) : survols des boutons
  lave, respectivement pleins et secondaires. La Lave Douce sert aussi de
  bordure survolée aux champs de formulaire et de couleur au nom de
  l'utilisateur courant dans le chat.

### Secondary

- **Or Solaire** (#ffcc00) : la couleur d'encadrement du jeu. Bordures de
  panneaux (2 à 5 px) et d'elles seules, compte à rebours, arbre de tournoi,
  texte du vainqueur, et l'anneau de focus de tout le projet. Aucun bouton ne la
  porte.
- **Bleu Lagon** (#00a2ff) : fonds de boutons de tournoi, texte de fin de
  partie.
- **Bleu Profond** (#0066ff) : bandeau d'information de match, joueur 2 de
  l'arbre, amorce du chargeur.
- **Bleu Menu** (#0091e6) : fond des boutons de menu du jeu au repos.
- **Bleu Menu Profond** (#0055cc) : leur survol, et l'appui maintenu des zones
  tactiles.

### Tertiary

- **Orange Raquette** (#ff6600) et **Bleu Raquette** (#00a9ff) : couleurs
  d'équipe. Elles n'appartiennent qu'aux joueurs — raquette 3D, moitié de score,
  nom dans l'arbre de tournoi. Le jaune (`0xffff00`) est réservé à l'éclair
  d'impact de la balle.

### Neutral

- **Nuit** (#121212) : fond de l'application entière.
- **Nuit Relevée** (#1e1e1e) : surfaces posées dessus — tiroir de chat privé,
  menus déroulants, carte d'inscription.
- **Fumée** (rgba(34, 34, 34, 0.8)) : les panneaux du tableau de bord. Trois
  paliers tokenisés : `panel-smoke-soft` (0.7) pour ce qui est posé,
  `panel-smoke` (0.8) pour ce qui contient, `panel-smoke-strong` (0.9) pour ce
  qui encadre l'écran — en-tête, pied, sections d'onglets.
- **Ardoise** (#2a2a2a) : fond des champs de formulaire.
- **Bordure de Champ** (#3e3e3e) : leur contour au repos, et le fond du bouton
  secondaire survolé.
- **Bordure Discrète** (#555555) : la seule ligne pointillée du projet, autour
  de la zone de saisie du chat.
- **Papier** (#e0e0e0) : couleur de texte par défaut sur nuit.
- **Craie** (#ffffff) : texte sur les rares aplats sombres colorés.
- **Sable Éteint** (#888888) : texte de pied de page, textes indicatifs des
  champs.
- **Sur Accent** (`--on-accent`, aliasé sur Nuit) : la couleur de texte de tout
  aplat clair du système. C'est un jeton à part entière, pas un synonyme de Nuit
  : il se lit comme un rôle, et c'est lui qu'on écrit sur un bouton.

### Semantic

- **Vert Récif** (#28a745) : présence en ligne, acceptation d'une demande.
- **Vert Victoire** (#4caf50) : match gagné — part gagnante du donut, liséré de
  ligne d'historique, bouton d'acceptation d'invitation.
- **Rouge Corail** (#dc3545) : hors ligne, refus, blocage.
- **Rouge Défaite** (#f44336) : match perdu, alertes de profil.

### Named Rules

**La Règle des Deux Rives.** L'application est orange sur nuit ; le jeu est bleu
et or. La frontière est **spatiale, pas temporelle** : le jeu est une `<iframe>`
montée en permanence au centre du tableau de bord, donc les deux registres
coexistent en continu sur le même écran — orange aux deux bords, bleu et or au
milieu. Une zone appartient à une rive ou à l'autre, jamais aux deux, et rien ne
les mélange à l'intérieur d'une même zone. La couture entre elles n'est pas une
transition : c'est le bord de l'iframe, tenu par le fond et l'ombre de chaque
colonne. L'anneau de focus est la seule couleur qui traverse.

**La Règle du Cadre d'Or.** Dans le jeu, l'or (#ffcc00) encadre **les panneaux
et eux seuls** : bordures de 2 à 5 px sur les surfaces flottantes — menus,
attente, détails de tournoi, fin de partie, compte à rebours, chargeur — jamais
un fond, jamais un aplat de texte long, et jamais un bouton. Les boutons portent
le filet blanc (voir la Règle du Filet). Une seule exception, et le contrôle G
de `check-design.mjs` la nomme : la jauge de chargement, qui est un trait de
progression et non une surface — l'or y lit comme une mesure et ne porte aucun
texte. Sa rareté en surface est ce qui le rend précieux, et cette rareté n'est
vraie que parce que les boutons ne l'empruntent pas : l'or bordait autrefois
tout élément interactif du jeu, et ne signalait alors plus rien.

**La Règle du Filet.** Ce qui se clique dans le jeu se borde d'un filet blanc
translucide — `2px rgba(255, 255, 255, 0.3)`. C'est le liseré du bandeau de
score et du bandeau de match, étendu aux boutons : il tient aussi bien sur le
sable clair que sur l'eau sombre, il ne concurrence pas l'or, et il n'ajoute
aucune valeur au système.

**La Règle du Texte sur Aplat.** Sur un aplat clair du système — les deux
oranges, l'or, les deux verts, le bleu menu — le texte est `--on-accent`, jamais
craie : le blanc y plafonnait entre 1,5:1 et 3,6:1, sous le minimum lisible. La
craie ne reste que sur les deux rouges et le bleu profond, où elle est le
meilleur des deux.

**La Règle des Couleurs d'Équipe.** #ff6600 et #00a9ff n'ont qu'un seul métier :
désigner un joueur. Les employer pour décorer un bouton ou un cadre casse la
lecture d'un match en cours.

## Typography

**Display :** Bebas Neue (repli Impact, sans-serif) **Body :** Poppins (repli
Helvetica, sans-serif)

**Caractère :** Bebas Neue est une capitale condensée, haute, sans bas-de-casse
: elle crie des chiffres et des verdicts, pas des phrases. Poppins est une
géométrique aux rondeurs pleines, dont les points ronds et le `o` parfaitement
circulaire tiennent le côté jouet solaire du North Star sans tomber dans la
fonte de dessin animé.

### Hierarchy

- **Display** (Bebas Neue, 400, 50 px, interlettrage 4 px, capitales) : score,
  message de vainqueur, arbre de tournoi. Dans le jeu, le score est dimensionné
  en unités de vue (4,5 vw de part et d'autre, 2,8 vw pour le mot SCORE) pour
  tenir à toute taille d'écran ; c'est le seul endroit où la typographie suit la
  fenêtre plutôt qu'une échelle.
- **Headline** (Poppins, 700, 2.5rem) : titres de colonne du tableau de bord —
  Amis, Chat, titre du tiroir privé. Toujours en Orange Couchant. Les titres qui
  portent un nom d'utilisateur passent en `clamp(1.5rem, 4vw, 2.5rem)` avec
  troncature par points de suspension : un pseudo long ne doit pas pousser
  l'avatar hors de l'en-tête.
- **Title** (Poppins, 500, 1.2rem) : en-têtes de sections repliables, noms de
  section d'amis, titres de cartes de statistiques.
- **Body** (Poppins, 400, 1rem, interligne 1.5) : messages de chat, texte
  courant, contenu des listes. 14 px dans les zones denses (éléments de liste) —
  jamais dans un champ de saisie, voir la Règle du Plancher de Seize.
- **Label** (Poppins, 500, 14 px) : libellés de formulaire, onglets, boutons,
  méta-données.
- **Field** (Poppins, 400, 16 px) : le texte saisi dans un champ, et rien
  d'autre. Voir la Règle du Plancher de Seize.

### Named Rules

**La Règle de la Voix Criée.** Bebas Neue ne compose jamais une phrase. Elle est
réservée aux nombres et aux verdicts d'un mot ou deux — un score, un « WINNER »,
un nom de joueur dans l'arbre. Dès qu'il faut lire, c'est Poppins.

**La Règle des Deux Familles.** Le système n'a que deux familles, et le code
n'en charge plus que deux. Roboto et Inter ont été retirés — Inter était chargé
sans être utilisé nulle part — et les quatre `@import` répartis dans les
feuilles ont été repliés sur un seul `<link>` par page, précédé de ses deux
`preconnect`.

**La Règle du Plancher de Seize.** Un champ de saisie ne descend jamais sous 16
px. Sous cette taille, Safari iOS zoome de force sur le champ au focus et casse
la mise en page du formulaire — le reste de l'interface peut être dense, pas la
saisie.

## Layout

**Application.** Colonne pleine hauteur : en-tête fixe (~60 px, fumée à 0.9,
ombre portée vers le bas), contenu en `calc(100dvh - 60px)`, pied de page.
L'unité est `dvh` et non `vh` : sur mobile, la barre d'adresse rétractable
faisait dépasser le pied de page d'une centaine de pixels. Le contenu est un
triptyque horizontal : amis à 15 % (minimum 150 px), jeu au centre à 70 %, chat
à 15 % (minimum 150 px). Chaque colonne porte son propre fond de fumée et son
ombre latérale, ce qui sépare les trois zones sans une seule ligne de
séparation.

Le rythme d'espacement est court et régulier : 5 px entre éléments de liste, 10
px de respiration interne, 15 px entre blocs, 20 px pour les marges de carte, 40
px pour les panneaux flottants du jeu.

**Jeu.** Pas de flux : la toile 3D occupe la fenêtre (`100dvh`) et tous les
éléments d'interface sont des surcouches positionnées en absolu. Les menus sont
centrés (`top: 50%; left: 50%; translate(-50%, -50%)`), le bandeau de match est
à 90 % de la hauteur, le score est ancré en bas (8 dvh du bord, 40 vw de large).

**Responsive.** Deux points de rupture et deux requêtes de capacité, chacun avec
son métier :

- **768 px (application).** Le triptyque du tableau de bord s'empile, le jeu en
  premier : les deux colonnes latérales à `min-width: 150px` ne laissaient
  autrement que 75 px au centre sur un téléphone. Les onglets et titres
  rétrécissent, les colonnes latérales sont plafonnées à `60dvh`, la zone de jeu
  prend un `aspect-ratio: 4 / 3`.
- **768 px (jeu).** Le score passe de 40 vw à 80 vw et sa typographie de 4,5 vw
  à 6 vw. C'est le seul composant qui grandit en rétrécissant l'écran.
- **600 px (jeu).** Les menus, dimensionnés en pixels fixes, débordaient sous
  480 px : ils passent en `min(90vw, 26rem)` et leurs boutons en pleine largeur.
- **`(pointer: coarse)`.** Toute cible ronde ou dense monte à `--tap-min` (44
  px) : boutons d'acceptation, envoi de chat, onglets, éléments de liste,
  entrées de menu déroulant.
- **`(hover: none) and (pointer: coarse)`.** Les deux zones tactiles du jeu
  apparaissent, et seulement du côté réellement piloté.

### Named Rules

**La Règle du Triptyque.** Les trois colonnes du tableau de bord se distinguent
par leur fond et leur ombre, jamais par un trait. Ajouter une bordure entre deux
colonnes serait redondant avec l'ombre qui l'exprime déjà.

**La Règle du Pouce.** Sous `(pointer: coarse)`, aucune cible interactive ne
descend sous 44 px. Une media query de largeur qui rétrécit un bouton doit être
relue à ce filtre : c'est exactement ainsi que les boutons ronds de la liste
d'amis étaient tombés à 20 px.

## Elevation & Depth

Le système empile des fumées translucides sur une nuit unique. La profondeur
vient de trois choses, dans cet ordre : l'opacité du panneau (0.7 pour ce qui
est posé, 0.8 pour ce qui contient, 0.9 pour ce qui encadre l'écran), une ombre
portée noire et franche, et — seulement dans le jeu — un halo coloré.

Les ombres de l'application sont noires et jamais teintées : c'est ce qui les
distingue des halos du jeu, qui sont toujours colorés et toujours liés à un
événement. Deux ombres seulement sont tokenisées (`--shadow-panel`,
`--shadow-card`) ; les autres sont locales à leur composant parce qu'elles ne
servent qu'une fois.

### Shadow Vocabulary

- **Ombre de panneau** (`--shadow-panel`, `0 4px 8px rgba(0, 0, 0, 0.6)`) :
  en-tête, cartes de profil, conteneurs. L'ombre de base du système.
- **Ombre latérale** (`4px 0 8px rgba(0, 0, 0, 0.6)`, inversée à droite) : les
  colonnes du triptyque.
- **Ombre de carte** (`--shadow-card`, `0 8px 16px rgba(0, 0, 0, 0.3)`) : cartes
  de paramètres, carte d'inscription et panneaux flottants du jeu.
- **Ombre de dialogue** (`0 5px 15px rgba(0, 0, 0, 0.3)`) : boutons de menu du
  jeu.
- **Halo de victoire**
  (`0 0 20px rgba(0, 102, 255, 0.8), 0 0 40px rgba(0, 162, 255, 0.6)`) : message
  de vainqueur, en respiration continue de 3 s.
- **Halo de départ**
  (`0 0 10px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.3)`) : pulsation
  d'une seconde sur le bouton START.
- **Halo de sélection**
  (`0 0 0 3px var(--lava-orange), 0 0 18px rgba(255, 87, 34, 0.7)`) : l'avatar
  choisi dans la rangée d'inscription. Le seul halo coloré de la rive
  application, et il désigne un choix, pas un ornement.
- **Lueur interne** (`inset 0 0 6px rgba(255, 255, 255, 0.4)`) : les deux
  moitiés du score.

Un seul flou d'arrière-plan existe dans tout le projet :
`backdrop-filter: blur(8px)` sur le bandeau de score, qui doit rester lisible
par-dessus n'importe quelle partie de l'île.

### Named Rules

**La Règle du Halo Mérité.** Un halo coloré signale un événement — départ,
victoire, attente, sélection — et disparaît avec lui. Une surface au repos n'a
droit qu'à une ombre noire.

## Shapes

Deux échelles de rayon coexistent, et l'écart entre elles est le signal du
passage d'une rive à l'autre. L'application arrondit peu : 4 à 10 px, assez pour
adoucir, jamais assez pour amollir. Le jeu double : 15 à 20 px sur les panneaux,
16 px sur les boutons de menu, et 50 px sur le bouton START, qui devient une
gélule.

Le cercle parfait est réservé à quatre usages : les avatars, les boutons
d'action d'une seule icône (envoi, accepter, refuser, démasquer le mot de
passe), les pastilles d'état, et les deux touches tactiles du jeu. Un cercle
veut dire « une seule chose, immédiate ».

Les bordures sont un langage à part entière : 1 px transparente sur un élément
de liste au repos — la place est réservée, seule la couleur change au survol,
sans que rien ne bouge —, 1 px orange plein au survol, 2 px orange sur un
avatar, 2 à 5 px d'or sur un panneau de jeu, 1 px pointillé #555 sur la zone de
saisie du chat, qui dit « écrivez ici ».

### Named Rules

**La Règle du Rayon Doublé.** Le jeu arrondit deux fois plus que l'application.
Un panneau à 8 px dans le jeu, ou à 20 px dans le tableau de bord, se lit
immédiatement comme importé de la mauvaise rive.

**La Règle de l'Anneau d'Or.** Le focus clavier est un contour d'or de 3 px posé
à 2 px de l'élément (`:focus-visible`, `outline-offset: 2px`, coins à 4 px),
déclaré une fois dans `tokens.css` pour tout le projet. Rien n'a le droit
d'écrire `outline: none` : le bouton START le faisait, et le projet n'avait
alors aucune règle de focus. Quand la cible réelle est masquée — le bouton radio
d'un avatar —, c'est son image qui porte l'anneau, par
`input:focus-visible + img`.

## Components

### Buttons

- **Forme :** angles franchement adoucis (8 px) côté application, généreux (16
  px) côté jeu. Hauteur minimale de 44 px sur la classe `.btn` partagée.
- **Primaire :** aplat Orange Lave (#ff5722) sur texte `--on-accent`, 12 px de
  hauteur de remplissage, pleine largeur dans les formulaires. Survol : Lave
  Profonde (#ff3d00) et agrandissement à 1,05.
- **Secondaire :** aplat Ardoise (#2a2a2a) sur texte papier ; survol Bordure de
  Champ (#3e3e3e). C'est le bouton qui ne demande rien.
- **Contour :** fond transparent, bordure 2 px et texte en Orange Lave ; au
  survol la bordure devient l'aplat et le texte passe en `--on-accent`.
- **Menu de jeu :** aplat Bleu Menu (#0091e6), filet blanc 2 px à 30 %, texte
  `--on-accent`, 18 px sur 36 px, rayon 16 px. Survol : #0055cc et
  agrandissement à 1,05. Sous 600 px : pleine largeur, 14 px sur 16 px.
- **Bouton icône :** cercle de `clamp(32px, 3vw, 36px)`, aplat Orange Couchant,
  icône `--on-accent` centrée, SVG inline de 16 px. Survol : Orange Vif. Au
  pointeur grossier : 44 px.
- **Transitions :** `--ease-color` (0,3 s) sur la couleur de fond,
  `--ease-transform` (0,2 s) sur la transformation. C'est la cadence par défaut
  de tout le système, et les deux valeurs sont des jetons.
- **Focus :** l'anneau d'or global. Aucun bouton ne redéfinit son focus.

### Cards / Containers

- **Rayon :** 10 px.
- **Fond :** fumée à 0.8 ; les sections internes descendent à 0.7 pour se
  creuser.
- **Ombre :** ombre de panneau (`--shadow-panel`).
- **Bordure :** aucune par défaut. Une bordure translucide orange n'apparaît que
  pour signaler un état (en attente, sélectionné) ; une translucide rouge pour
  un utilisateur bloqué.
- **Remplissage interne :** 10 px en zone dense, 20 px sur une carte autonome.

### Inputs / Fields

- **Style :** fond Ardoise (#2a2a2a), bordure 1 px Bordure de Champ (#3e3e3e),
  rayon 5 px, texte craie, remplissage 12 px, taille de texte 16 px.
- **Survol :** la bordure passe en Lave Douce sur 0,3 s.
- **Focus :** l'anneau d'or global, par-dessus la bordure.
- **Champ de mot de passe :** le bouton de démasquage est un cercle de 44 px
  posé dans le champ, en logique logique (`inset-inline-end`) ; le champ réserve
  sa place par `padding-inline-end: calc(44px + 5px)` plutôt que de laisser le
  bouton chevaucher le texte.
- **Saisie de chat :** l'exception assumée — une gélule de 25 px de rayon,
  bordure pointillée #555, contenant un champ transparent sans bordure et un
  bouton rond orange.
- **Texte indicatif :** Sable Éteint (#888888).

### Navigation

- **En-tête :** fumée à 0.9, logo à gauche, avatar cerclé d'orange à droite,
  ombre portée vers le bas. Le logo s'éclaircit de 20 % et grandit de 5 % au
  survol. L'avatar est un vrai `<button>` dépouillé (`background: none`,
  `border: none`, `line-height: 0`) : le focus a une cible, et le rond reste
  rond.
- **Onglets d'amis :** rayon supérieur seulement (8 px 8 px 0 0), collés en haut
  du panneau, portés par un `role="tablist"`. Au repos, fumée à 0.7 sur texte
  papier ; au survol, orange à 10 % et texte orange ; actif, aplat Orange
  Couchant plein sur `--on-accent`, doublé d'un trait de 3 px sous l'onglet.
  Hauteur minimale 32 px, 44 px au pointeur grossier.
- **Menus déroulants :** nuit relevée, bordure 1 px orange, rayon 5 px, pilotés
  par l'attribut `hidden` et non par un style en ligne ; l'entrée survolée prend
  un fond orange à 20 % et un texte orange.
- **Lignes de liste :** la ligne entière est un `<button>` transparent qui
  hérite de la police et de la couleur — c'est lui qui prend le focus, pas un
  `<div>` cliquable.

### Zones tactiles (jeu)

Deux colonnes de cercles de 4,5 rem, bleu menu à 55 % d'opacité, filet blanc 2
px à 30 %, ancrées aux bords de la fenêtre avec `env(safe-area-inset-*)`. Elles
n'existent que sous `(hover: none) and (pointer: coarse)`, le conteneur est en
`pointer-events: none` pour ne pas voler les gestes destinés à la scène, et
chaque touche porte `touch-action: none` — sans quoi le navigateur interprète
l'appui maintenu comme un défilement. Appui : bleu menu profond à 85 %.

### Rangée d'avatars (inscription)

Sept boutons radio natifs en défilement horizontal avec accrochage
(`scroll-snap-type: x mandatory`), images rondes de 100 px. Au repos, opacité
0,45 ; sélectionné, opacité pleine, agrandissement à 1,12 et halo de sélection.
Le radio est masqué mais focalisable, et c'est l'image qui affiche l'anneau.
Remplace un carrousel en JavaScript qui traduisait la bande de 195 px à chaque
flèche, sans focus clavier ni annonce d'état.

### Signature: le bandeau de score

Le composant qui résume le système entier. Une barre ancrée en bas de l'île, en
dégradé de noir 0.8 à 0.6, floutée derrière (8 px), bordée d'un filet blanc à 20
%, où deux chiffres en Bebas Neue s'affrontent : le gauche en Orange Raquette,
incliné de -1°, le droit en Bleu Raquette, incliné de +1°. Le mot SCORE respire
entre eux en halo blanc. Chaque point marqué déclenche une bascule d'échelle à
1,3 en 0,3 s. Il ne se réduit pas sur mobile : il s'élargit à 80 vw pour rester
lisible.

### Signature: le bouton START

Gélule de 50 px de rayon en dégradé or-vers-rouge, capitales en
`clamp(2rem, 9vw, 60px)`, pulsation rouge d'une seconde en boucle, reflet
oblique qui balaie la surface au survol, et un enfoncement à 0,95 au clic. C'est
la seule pièce du projet autorisée à bouger sans qu'on la sollicite.

### Signature: le donut de ratio

Le graphique victoires/défaites du profil est un `conic-gradient` percé au
masque radial : 130 px, Vert Victoire jusqu'à `calc(var(--win-share) * 1turn)`,
Rouge Défaite ensuite, trou à 49 % du rayon. Sa légende est une liste de deux
pastilles carrées de 12 px à coins de 3 px. Aucun canevas, aucune bibliothèque —
celle qui dessinait ce donut pesait plus lourd que toute la vue. Sans partie
jouée, le donut cède la place à une ligne en Sable Éteint.

### Named Rules

**La Règle de la Boucle Décorative.** Sous `prefers-reduced-motion: reduce`, les
boucles qui n'informent de rien s'arrêtent sur leur état de repos — pulsation du
START, halo de victoire, balayage de lumière — mais le retour d'information
reste : le compteur d'attente continue de tourner et le score garde sa bascule
de 0,3 s, sans quoi on ne saurait plus qu'un point vient d'être marqué. Couper
toute animation d'un bloc est aussi faux que n'en couper aucune.

## Dependencies

- **Le jeu vit dans une `<iframe>`.** `game.html` est une entrée Vite distincte,
  montée en permanence dans la colonne centrale du tableau de bord. Elle a son
  propre document : son `body` doit peindre son fond lui-même, sinon il reste
  blanc jusqu'à ce que la toile WebGL soit ajoutée, au clic sur START.
- **Les media queries du jeu mesurent l'iframe, pas la fenêtre.** C'est correct
  — le HUD s'adapte à la largeur qu'il a réellement — mais cela veut dire que
  les seuils de `css/game.css` et ceux de `dashboard.css` **ne se déclenchent
  jamais ensemble**. Le HUD passe en disposition étroite bien avant que le
  tableau de bord n'empile ses colonnes. Toute modification du partage des trois
  colonnes déplace les seuils du jeu sans les toucher.
- **La frontière iframe ne transporte qu'un message**, dans un seul sens :
  l'invitation de partie, par `postMessage` du tableau de bord vers le jeu. La
  session, elle, ne traverse pas — les deux documents lisent le même
  `sessionStorage` en same-origin.
- **`tokens.css` est importé deux fois** : par la SPA et par `css/game.css`,
  résolu au build. Un jeton ajouté est disponible des deux côtés sans rien
  câbler.

## Do's and Don'ts

### Do:

- **Do** garder l'île visible : les panneaux du jeu sont translucides et
  centrés, jamais des écrans pleins qui masquent la scène.
- **Do** utiliser #ff6600 et #00a9ff exclusivement pour désigner un joueur.
- **Do** encadrer d'or les panneaux du jeu (2 à 5 px), border les boutons du
  filet blanc, et laisser leur fond sombre.
- **Do** écrire `--on-accent` sur tout aplat clair du système, et lire la
  couleur depuis `tokens.css` plutôt que d'écrire l'hexadécimal.
- **Do** tenir la cadence de transition du système : `--ease-color` sur la
  couleur, `--ease-transform` sur la transformation, agrandissement à 1,05 au
  survol.
- **Do** vérifier chaque nouvelle cible sous `(pointer: coarse)` : 44 px
  minimum.
- **Do** ramener tout écran retouché sur le duo Bebas Neue + Poppins.
- **Do** distinguer l'état par la bordure et l'opacité avant de le distinguer
  par la couleur.

### Don't:

- **Don't** mélanger les deux rives : pas de bleu-or dans le tableau de bord,
  pas d'orange d'interface dans les menus du jeu. L'anneau de focus est la seule
  traversée.
- **Don't** écrire `outline: none`, ni redéfinir le focus localement.
- **Don't** composer une phrase en Bebas Neue.
- **Don't** descendre un champ de saisie sous 16 px.
- **Don't** poser un halo coloré sur une surface au repos — le halo est un
  événement.
- **Don't** teinter une ombre de l'application : elles sont noires.
- **Don't** ajouter des séparateurs entre les colonnes du tableau de bord ;
  l'ombre et le fond font déjà le travail.
- **Don't** mesurer une hauteur d'écran en `vh` : c'est `dvh`, la barre
  d'adresse mobile se rétracte.
- **Don't** désaturer un **accent** pour le rendre « sobre » : le North Star est
  un été GameCube, la saturation est le sujet. Les neutres, eux, sont
  délibérément achromatiques — la nuit et les fumées sont la chrome qui laisse
  l'île respirer, pas une palette désaturée.
