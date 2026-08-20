# HUD Design

> **Status**: In Design **Author**: phudyka + ux-designer **Last Updated**:
> 2026-08-20 **Platform Target**: Web — ordinateur (clavier) d'abord, téléphone
> utilisable (zones tactiles sur pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-GAME-1 … UI-GAME-11, UI-TOUR-1 … UI-TOUR-5 **Journey
> Phase(s)**: A3 (essai du visiteur), B5 (partie), B7 (tournoi) **Template**:
> HUD Design

---

## HUD Philosophy

Principe produit n° 1 de `docs/PRODUCT.md` : « La 3D porte le produit ;
l'interface la sert. Rien dans la SPA ne doit voler la vedette à la scène ni
retarder son affichage. » Appliqué au HUD du jeu, cela interdit précisément
quatre choses :

1. **Aucun élément d'interface ne s'installe en permanence au centre du
   terrain.** Le centre est où la balle voyage ; un panneau posé là, sans
   condition de disparition, gagnerait contre la partie elle-même. Voir
   `## Layout Zones` pour la vérification ligne par ligne.
2. **Aucun panneau plein écran.** `docs/DESIGN.md` le nomme : « les panneaux du
   jeu sont translucides et centrés, jamais des écrans pleins qui masquent la
   scène. » Chaque surcouche du jeu est un panneau flottant borné en largeur
   (`min(…vw, …rem)`), jamais `width:100%`.
3. **Aucune information persistante que le jeu ne produit pas déjà.** Le HUD
   n'invente rien — il relaie le score, l'état de connexion et les décomptes que
   le service temps réel calcule. Il ne porte ni classement, ni statistiques, ni
   options graphiques : voir `## Tuning Knobs`, qui constate qu'il n'y en a
   aucune.
4. **Le silence est un état valide.** Pendant une manche en cours (pas de point
   venant d'être marqué, pas d'interruption sociale), le seul HUD visible est le
   bandeau de score ancré en bas et, sur pointeur grossier, les deux zones
   tactiles. Tout le reste — menus, décomptes, invitations — apparaît sur
   événement et repart avec lui.

Ce document décrit le HUD **livré**, tel qu'il existe dans `frontend/game.html`,
`frontend/src/css/game.css` et `frontend/src/game/`. Les écarts entre ce que le
palier Comprehensive exige et ce que le code fait réellement sont dans
`## Open Questions`, pas lissés dans le corps du texte.

---

## Information Architecture

### Full Information Inventory

Chaque ligne est une information que le jeu produit ou pourrait produire, avec
sa source réelle dans le code.

| #  | Information                                         | Source réelle                                                                                                                                                                                  |
| -- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Score du camp orange (gauche)                       | Autoritatif serveur, `pad1.score` — `src/realtime/app/game/game.mjs:118-122`, émis par `updateScores` (`scores.score1`)                                                                        |
| 2  | Score du camp bleu (droite)                         | Idem, `scores.score2`                                                                                                                                                                          |
| 3  | Score cible (`WIN_SCORE`, 11 par défaut)            | `src/realtime/app/game/game.mjs:8`, variable d'environnement (`src/.env.example:25`) — jamais transmise au client                                                                              |
| 4  | Couleur/identité d'équipe des raquettes             | Constantes client `TEAM_ORANGE` / `TEAM_BLUE` — `frontend/src/game/main.mjs:57-58` ; jetons `--pad-orange` / `--pad-blue` sur les moitiés du score                                             |
| 5  | Quelle raquette est « la mienne »                   | `padState.controlledPad` / `controlledPads`, calculé dans le gestionnaire `start-game` — `main.mjs:292-304`, à partir du tableau `rooms` envoyé par le serveur                                 |
| 6  | Mode de jeu en cours                                | Table serveur `roomsTypes` — `src/realtime/app/game/sockets.mjs:8` ; le client ne garde que `lastMode` pour la revanche (`main.mjs:397-416`), jamais affiché comme étiquette                   |
| 7  | Nom(s) de l'adversaire                              | Table `clients` côté serveur (`sockets.mjs:22-30`) ; n'atteint le client que dans des phrases composées : `match-info` (« X vs Y », `tournament.mjs:159,201`), `gameOver` (`main.mjs:438-461`) |
| 8  | Progression du chargement de la scène               | `loadModel`'s `onProgress`, fraction d'octets — `frontend/src/game/loadIsland.mjs:16-20`, posée sur `--loaded` et `aria-valuenow` (`main.mjs:227-229`)                                         |
| 9  | Durée d'attente d'un adversaire                     | Purement client, `setInterval` sans signal serveur — `frontend/src/game/socketEvent.mjs:119-137`                                                                                               |
| 10 | Invitation entrante (de qui)                        | Événement serveur `invite` — `sockets.mjs:188-199`, relayé depuis le tableau de bord par `postMessage` (`frontend/src/views/dashboard.js:730-737`)                                             |
| 11 | Invitation refusée                                  | Événement `refuse-invit` — `sockets.mjs:224`, `socketEvent.mjs:192-194`                                                                                                                        |
| 12 | Personne invitée indisponible                       | Événement `not-ready` — `sockets.mjs:196-198`, `socketEvent.mjs:196-198`                                                                                                                       |
| 13 | Composition du tournoi (4 places)                   | Événement `tournament-updated` — `src/realtime/app/game/tournament.mjs:61,78,101`                                                                                                              |
| 14 | Vainqueurs de demi-finale                           | Événement `update tournament` (tableau de longueur 2) — `tournament.mjs:24,29`                                                                                                                 |
| 15 | Finaliste / champion                                | Idem, tableau de longueur 1 — `tournament.mjs:29`, rendu `socketEvent.mjs:314-347`                                                                                                             |
| 16 | Décompte avant match (« Match starts in N »)        | Événement `match-info` — `tournament.mjs:208-209` (5 s en dur)                                                                                                                                 |
| 17 | Légende générique des commandes (pré-match)         | Balisage statique du menu et du sous-menu — `frontend/game.html:48-51,61-64`, recopie manuelle de `controls.mjs`                                                                               |
| 18 | Rappel spécifique (camp + touches, au coup d'envoi) | Calculé côté client via `padForSide()` — `main.mjs:318-352`, `frontend/src/game/controls.mjs:19-25`                                                                                            |
| 19 | Issue du match (gagné/perdu, contre qui)            | Événement `gameOver` — `src/realtime/app/game/game.mjs:44-72`, texte composé `main.mjs:424-461`                                                                                                |
| 20 | Disponibilité du bouton « Play again »              | État purement client, `lastMode` — `main.mjs:397-467`                                                                                                                                          |
| 21 | Affordance tactile (quel côté, si un seul)          | `updateTouchControls()` via `padForSide()` — `main.mjs:154-160`                                                                                                                                |
| 22 | Latence réseau                                      | Non calculée, non transmise — absente du client et du service temps réel                                                                                                                       |
| 23 | Images par seconde                                  | Non mesurées, non affichées                                                                                                                                                                    |
| 24 | Avis « invité » (fonctions limitées)                | `isGuest` — `main.mjs:27-32`, `#guest-note`                                                                                                                                                    |
| 25 | Échec de connexion au serveur de jeu                | `connect_error` — `main.mjs:238-244`, réutilise `#notReady`                                                                                                                                    |

### Categorization

Chaque information de l'inventaire est classée. Un constat s'impose en le
faisant : **la catégorie « On Demand » est vide.** Le HUD n'offre aucune surface
que la personne ouvre volontairement pendant la partie — pas de menu pause, pas
de panneau de statistiques, pas d'option graphique. C'est cohérent avec le
principe n° 1 (l'interface sert, elle ne s'ajoute pas), mais c'est un choix à
confirmer, pas une omission de cette spec.

| Catégorie                                                   | Informations (par n° de l'inventaire)                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Must Show** (visible en continu pendant la manche)        | 1, 2 (score des deux camps), 4 (couleur/identité d'équipe, portée en continu par les raquettes 3D et les moitiés du bandeau)                                                                                                                                                                     |
| **Contextual** (apparaît sur événement, disparaît avec lui) | 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25                                                                                                                                                                                                                               |
| **On Demand** (ouverte volontairement par la personne)      | _(aucune)_                                                                                                                                                                                                                                                                                       |
| **Hidden** (jamais montrée)                                 | 3 — le score cible n'est révélé nulle part, la personne l'apprend en gagnant ou en perdant ; 6 — le mode de jeu n'est jamais affiché comme étiquette persistante, seulement déductible du nombre de raquettes visibles ; 22 — latence, jamais mesurée ; 23 — images par seconde, jamais mesurées |

---

## Layout Zones

Le jeu n'a pas de flux : `body` est en `position: relative`, toute la toile 3D
occupe `100dvh`, et chaque élément d'interface est une surcouche en position
absolue ou fixe (`docs/DESIGN.md` § Layout, « Jeu »). Neuf zones concentrent
tous les éléments listés dans `## HUD Elements`.

| Zone                        | Règle de position (`frontend/src/css/game.css`)                                                                                                                                      | 1440 × 900                                    | 390 × 844                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------------------------------------------- |
| **Z1 — Centre verrouillé**  | `top:50%; left:50%; transform:translate(-50%,-50%)` (`.menu, .waiting, .multi, .tournament` L297-318 ; `#tournament-details` L490-494 ; `#game-over` L157-162 ; `#loading` L739-753) | pivot (720, 450)                              | pivot (195, 422)                             |
| **Z2 — Amorce de flux**     | centré par le flex du `body` (L5-18), pas de position absolue                                                                                                                        | centré, avant tout autre HUD                  | idem                                         |
| **Z3 — Haut, bord**         | `#space` : `top: var(--space-lg)` = 20 px (L100-118)                                                                                                                                 | y = 20 px                                     | y = 20 px                                    |
| **Z4 — Haut, 12 %**         | `.controls-brief` : `top:12%` (L830-846)                                                                                                                                             | y ≈ 108 px                                    | y ≈ 101 px                                   |
| **Z5 — Coin haut-droit**    | `.cl_invite` : `top/right: var(--space-lg)` (L609-621) ; `#notReady` décalé de `+6rem` (L625-627)                                                                                    | invite ancré (1420, 20) ; notReady y = 116 px | invite ancré (370, 20) ; notReady y = 116 px |
| **Z6 — Bas, 90 %**          | `#match-info` : `top:90%` (L120-136)                                                                                                                                                 | y = 810 px                                    | y ≈ 759,6 px                                 |
| **Z7 — Ancrage bas**        | `.score-container` : `bottom: 8dvh` (L377-397)                                                                                                                                       | bande verticale ≈ 729–828 px                  | bande ≈ 683,7–776,5 px                       |
| **Z8 — Bords gauche/droit** | `#touch-controls` : `position: fixed; inset:0`, colonnes en `justify-content: space-between` (L673-692) — actif seulement sous `(hover: none) and (pointer: coarse)`                 | inactif (pointeur fin)                        | actif si tactile                             |
| **Z9 — Hors écran**         | `#score-announce` : `.visually-hidden` (`tokens.css:331-341`)                                                                                                                        | hors rendu visuel                             | idem                                         |

**Contrainte dure — vérifiée** : aucun élément ne couvre le centre du terrain
sans règle de disparition.

Tous les éléments de Z1 (menu, sous-menu multi, liste de tournois, attente,
détails de tournoi, fin de partie, chargement) sont explicitement masqués par le
gestionnaire `start-game` avant que la balle ne bouge :
`document.getElementById("menu").classList.add("hidden")`, `.add("hidden")` sur
`multi`, `tournament-details` (avec retrait de `flex`), `waiting`, `space` —
`frontend/src/game/main.mjs:281-286`. `#game-over` et `#loading` ne sont montrés
qu'après la fin d'une manche ou avant que les objets 3D existent : aucun des
deux ne coexiste avec une balle en mouvement. La contrainte tient donc **par
construction de la machine à états**, pas par une règle CSS dédiée — ce qui la
rend fragile à un futur appel de `showPanel()` mal placé, puisque rien ne
l'empêcherait mécaniquement. Aucune violation actuelle n'a été trouvée dans le
code lu.

Les zones Z3–Z7 sont toutes hors du centre visuel (bord haut, coin, bande basse
à 90 % ou ancrage à 8 dvh du bas) : aucune ne recouvre la portion centrale de
l'écran où la caméra de match cadre la table (`flyCamera(0, 8, 6.2, 3, 1000)`,
`main.mjs:277`).

**Collision latente entre Z6 et Z7.** À 1440 × 900, la bande verticale de
`#match-info` (Z6, centrée à y = 810 px) et celle de `.score-container` (Z7,
729–828 px) se recouvrent, et les deux éléments partagent le même centrage
horizontal (`left:50%`). Ils ne sont jamais visibles simultanément dans le flux
normal — `#match-info` se ferme au même instant que `start-game` révèle le score
— mais le couplage n'est pas structurel : voir `## Dynamic Behaviors` et
`## Open Questions`.

---

## HUD Elements

| Élément                                      | Zone        | Déclencheur d'apparition                                                                                                                                   | Déclencheur de disparition                                                                                  | Source de donnée                                        | Priorité                                                                                                                    |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `#start-game-button`                         | Z2          | Chargement de la page (visible par défaut, pas de classe `hidden`)                                                                                         | Clic — `main.mjs:218-219`                                                                                   | Statique                                                | Seul élément visible à l'ouverture ; pas de `z-index` (flux normal)                                                         |
| `#loading` / `#loading-bar`                  | Z1          | Clic sur START — `main.mjs:220-223`                                                                                                                        | `loadModel().finally()` — `main.mjs:230-233`                                                                | `loadIsland.mjs` `onProgress`                           | `z-index:40`, le plus haut des panneaux Z1                                                                                  |
| `#menu`                                      | Z1          | Fin du vol d'entrée de caméra — `fadeOutLogoAndStartAnimation` → `showPanel("menu")` (`animation.mjs:18`) ; ou retour depuis `#game-over` / fin de tournoi | Clic sur un mode, ou `multi-button` (ouvre `#multi`)                                                        | Statique + `isGuest` (`main.mjs:27-32`)                 | `z-index:10`                                                                                                                |
| `#multi`                                     | Z1          | Clic `multi-button`                                                                                                                                        | Clic `multi-back-button`, ou tout mode                                                                      | Statique                                                | `z-index:10`                                                                                                                |
| `#tournament` (liste)                        | Z1          | Clic `multi-tournament`                                                                                                                                    | Clic `tournament-back-button`, ou `create-tournament`                                                       | Événement `tournament-list` — `socketEvent.mjs:200-224` | `z-index:10`                                                                                                                |
| `#tournament-details` (arbre)                | Z1          | `tournament-created` / `tournament-updated` / `matchOver` — `socketEvent.mjs:226-232`, `main.mjs:374-375`                                                  | `start-game` (masqué avant chaque match) — `main.mjs:283-284`                                               | Événements `tournament-updated`, `update tournament`    | `z-index:20`, au-dessus des autres panneaux Z1                                                                              |
| `#invite`                                    | Z5          | Événement `invite` — `socketEvent.mjs:149-156`                                                                                                             | Clic `accept`/`cancel` — pas d'expiration automatique                                                       | Événement `invite`                                      | `z-index:60`, le plus haut du HUD entier ; `role="alert"` (assertif)                                                        |
| `#notReady`                                  | Z5 (décalé) | Événement `refuse-invit` ou `not-ready`, ou `connect_error`                                                                                                | 3000 ms (`flashNotReady`, `socketEvent.mjs:182-190`)                                                        | Événements `refuse-invit`, `not-ready`                  | `z-index:60`, partage le sélecteur `.cl_invite` avec `#invite` mais un décalage vertical de 6 rem l'empêche de le recouvrir |
| `#match-info` / `#countdown`                 | Z6          | Événement `match-info`, ou fin de tournoi (`update tournament` de longueur 1)                                                                              | Fin du décompte client (`startCountdown`, `socketEvent.mjs:357-368`)                                        | Événements `match-info`, `update tournament`            | `z-index:30`                                                                                                                |
| `.controls-brief`                            | Z4          | `start-game`, via `briefControls()` — `main.mjs:315,323-352`                                                                                               | 4000 ms (`briefTimer`)                                                                                      | `padState` local, calculé via `controls.mjs`            | `z-index:30`                                                                                                                |
| `#space`                                     | Z3          | Événement `tournament-full` (**jamais émis par le serveur livré** — voir Open Questions)                                                                   | Clic, barre d'espace, ou `start-game`                                                                       | —                                                       | `z-index:30` ; en pratique jamais peint                                                                                     |
| `#waiting` / `#spinner` / `#waiting-elapsed` | Z1          | Clic `multi-2-online` ou `multi-four`                                                                                                                      | `start-game`, ou clic `back` (émet `cancel`)                                                                | Compteur client (`socketEvent.mjs:119-137`)             | `z-index:10`                                                                                                                |
| `.score-container` (`#score`)                | Z7          | `start-game` — `main.mjs:287-288`                                                                                                                          | `matchOver` ou `gameOver` — `main.mjs:370-371,470-471`                                                      | Événement `updateScores`                                | Pas de `z-index` explicite (empile sous tout élément qui en porte un)                                                       |
| `#score-announce`                            | Z9          | Chaque `updateScores`                                                                                                                                      | Remplacé au point suivant, jamais masqué                                                                    | Événement `updateScores`                                | Invisible, sans conflit de zone                                                                                             |
| `#game-over`                                 | Z1          | Événement `gameOver` — `main.mjs:424,468`                                                                                                                  | Clic `play-again-button` ou `back-to-menu-button`                                                           | Événement `gameOver`                                    | `z-index:10`                                                                                                                |
| `#touch-controls`                            | Z8          | `start-game`, via `updateTouchControls()` — `main.mjs:314` ; affichage CSS conditionné à `(hover:none) and (pointer:coarse)`                               | `matchOver`/`gameOver` (implicite : les côtés redeviennent `hidden` quand `padForSide` ne rend plus de pad) | `padState` local                                        | `z-index:20` ; conteneur en `pointer-events:none`, seules les colonnes actives captent le doigt                             |

---

## HUD States by Gameplay Context

| Contexte                                             | Éléments visibles                                                                                                                                                           | Éléments qui disparaissent en l'atteignant                                                                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Menu principal**                                   | `#menu` (Z1) ; `#invite`/`#notReady` (Z5) si un événement arrive                                                                                                            | `#loading`, `#start-game-button`                                                                                                                           |
| **Sélection de mode** (`#multi`)                     | `#multi` (Z1) ; `#invite`/`#notReady` possible                                                                                                                              | `#menu`                                                                                                                                                    |
| **Salle de tournoi** (liste ou arbre)                | `#tournament` **ou** `#tournament-details` (jamais les deux — mutuellement exclusifs par `MENU_NAV`)                                                                        | l'autre des deux, `#multi`                                                                                                                                 |
| **Attente d'adversaire**                             | `#waiting` + `#spinner` + `#waiting-elapsed` (Z1)                                                                                                                           | `#multi`                                                                                                                                                   |
| **Chargement de la scène**                           | `#loading` (Z1) seul — aucun autre panneau ne peut apparaître : `client.initGame` est encore `false`, le serveur refuse toute invitation vers ce socket (`sockets.mjs:192`) | `#start-game-button`                                                                                                                                       |
| **Partie en cours (rally)**                          | `.score-container` (Z7) ; `#touch-controls` (Z8) si pointeur grossier ; `.controls-brief` (Z4) pendant les 4 premières secondes                                             | `#menu`, `#multi`, `#tournament-details`, `#waiting`, `#space` (tous masqués par `start-game`)                                                             |
| **Point marqué**                                     | Idem « partie en cours » + bascule `.pop-animation` sur `#scoreLeft`/`#scoreRight` (300 ms) + `#score-announce` réécrit                                                     | rien de nouveau ne disparaît                                                                                                                               |
| **Fin de match (intermédiaire, tournoi)**            | `#tournament-details` (Z1) + `#match-info`/`#countdown` (Z6)                                                                                                                | `.score-container`, `.controls-brief`, `#touch-controls`                                                                                                   |
| **Fin de partie (terminale)**                        | `#game-over` (Z1)                                                                                                                                                           | `.score-container`, `#tournament` (`classList.remove("active")` — `main.mjs:474`, note : cette classe n'existe dans aucune règle CSS, voir Open Questions) |
| **Invitation entrante**                              | `#invite` (Z5), par-dessus tout panneau déjà ouvert — le serveur ne la délivre que si `to.room === null` (`sockets.mjs:191-199`), donc jamais pendant une manche            | rien                                                                                                                                                       |
| **Partie quittée (mid-tournoi, `#quit-tournament`)** | `#tournament-details` reste affiché — aucun gestionnaire ne le masque ni ne rouvre `#menu` après l'émission de `quit-tournament` (voir Open Questions)                      | rien, ce qui est précisément le défaut                                                                                                                     |

---

## Dynamic Behaviors

**Invitation pendant une manche.** Le serveur, pas le client, arbitre ce cas :
le gestionnaire `invite` refuse de relayer une invitation si `to.room !== null`
(`src/realtime/app/game/sockets.mjs:191-199`) — c'est-à-dire dès qu'une personne
est dans une salle, du lancement d'un match jusqu'à sa fin, tournoi compris. La
personne à l'origine de l'invitation reçoit `not-ready` à la place. **Conclusion
vérifiée : une invitation ne peut jamais recouvrir une manche en cours**, ce
n'est pas un HUD qui l'empêche mais l'arbitrage serveur.

**Deux invitations coup sur coup — non arbitré, défaut réel.** `pendingInvite`
(`frontend/src/game/socketEvent.mjs:147`) ne retient qu'une seule invitation. Si
une seconde arrive avant réponse à la première, `pendingInvite = data`
(`socketEvent.mjs:150`) écrase silencieusement la première : son texte disparaît
du panneau, remplacé par la seconde, sans file d'attente ni indication qu'une
invitation a été perdue. Cliquer « Accept » à ce moment répond à la seconde
personne, jamais à la première — qui ne reçoit ni acceptation ni refus. Pointeur
: `frontend/src/game/socketEvent.mjs:147-166`.

**Deux avis « pas prêt » coup sur coup.** Même schéma sur `flashNotReady`
(`socketEvent.mjs:182-190`) : le second écrase le texte du premier et relance le
minuteur de 3000 ms. Moins critique que le cas des invitations — ce sont des
avis informatifs, pas une décision à prendre — mais toujours sans file
d'attente.

**Durées de disparition automatique, en millisecondes :**

| Élément                                    | Durée                                                                              | Source                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `.controls-brief`                          | 4000 ms                                                                            | `main.mjs:351`                                                        |
| `#notReady`                                | 3000 ms                                                                            | `socketEvent.mjs:186-189`                                             |
| Bascule `.pop-animation` du score          | 300 ms                                                                             | `socketEvent.mjs:62-65`, CSS `pop 0.3s ease-out` (`game.css:465-479`) |
| `#match-info` / décompte de match          | 5 × 1000 ms = 5000 ms, `countdown` vient de `data.countdown` (serveur, en dur à 5) | `tournament.mjs:208-209`, `socketEvent.mjs:357-368`                   |
| `#match-info` / décompte de fin de tournoi | 5 × 1000 ms, `countdown` local codé en dur                                         | `socketEvent.mjs:320-328`                                             |
| `#invite`                                  | **aucune** — reste jusqu'à réponse explicite                                       | `socketEvent.mjs:149-176`                                             |
| `#waiting-elapsed`                         | pas de disparition, texte change de forme après 30 s                               | `socketEvent.mjs:126-131`                                             |

**Couplage temporel non structurel (Z6/Z7).** Le décompte avant un match de
tournoi tient sur deux horloges indépendantes qui ne se synchronisent pas
explicitement : le serveur programme `start-game` par `setTimeout(…, 5000)`
(`tournament.mjs:211-223`) pendant que le client fait défiler `#countdown` par
cinq ticks de 1000 ms (`socketEvent.mjs:357-368`). Les deux durent 5000 ms sur
le papier, mais rien ne garantit que le client masque `#match-info` exactement
quand le serveur émet `start-game` — un ralentissement du timer client (onglet
en arrière-plan, `setInterval` retardé) laisserait `#match-info` (Z6) visible
pendant que `.score-container` (Z7) apparaît déjà, les deux se recouvrant à
l'écran (voir `## Layout Zones`). Le risque est faible en pratique mais réel, et
non couvert par un test de `make check`.

---

## Visual Budget

**Budget fixé : 3 groupes d'éléments HUD simultanés au maximum** (le bandeau de
score compte pour un groupe malgré ses trois nœuds ; `#touch-controls` et
`#score-announce` ne comptent pas, l'un étant structurel et transparent aux
gestes, l'autre invisible). **Couverture d'écran maximale : environ 20 % de la
surface à 1440 × 900**, panneaux translucides cumulés, hors toile 3D.

Vérification état par état :

| État                                 | Groupes simultanés                                                                   | Estimation de couverture (1440 × 900)                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu principal                       | 1 (`#menu`)                                                                          | `#menu` non contraint en largeur au-delà de 600 px, dimensionné par son contenu (`padding: var(--space-xl)` = 40 px) ; largeur typique ≈ 380 px, hauteur ≈ 420 px ≈ 12 %                                                              |
| Attente d'adversaire                 | 1 (`#waiting`)                                                                       | ≈ 10 %                                                                                                                                                                                                                                |
| Salle de tournoi (arbre)             | 1 (`#tournament-details`, `max-width: min(600px, 92vw)` = 600 px, `max-height: 90%`) | jusqu'à ≈ 28 % dans le pire cas (arbre complet) — **dépasse le budget de 20 %**, à noter, tient néanmoins hors du centre du terrain puisque c'est un état hors-manche                                                                 |
| Partie en cours, sans interruption   | 1 (`.score-container`, 40 vw × 11 dvh)                                               | ≈ 4,4 %                                                                                                                                                                                                                               |
| Point marqué                         | 1 (idem, transitoire)                                                                | ≈ 4,4 %                                                                                                                                                                                                                               |
| Fin de match intermédiaire (tournoi) | 2 (`#tournament-details` + `#match-info`)                                            | ≈ 28 % + ≈ 20 % (`#match-info`, `width: min(90vw, 32rem)` = 512 px) sur des zones non chevauchantes (Z1 vs Z6) ≈ 48 % cumulés — au-delà du budget cumulé, mais réparti sur deux zones disjointes, aucune des deux en collision réelle |
| Fin de partie                        | 1 (`#game-over`)                                                                     | contenu-dépendant, ≈ 15–18 %                                                                                                                                                                                                          |
| Invitation reçue, menu ouvert        | 2 (`#menu` + `#invite`)                                                              | ≈ 12 % + petit panneau coin (`#invite`, non contraint, contenu court) ≈ 5 %                                                                                                                                                           |

Le seul état qui dépasse franchement le budget de couverture est **la salle de
tournoi avec un arbre complet** (`#tournament-details`), et il ne s'agit jamais
d'un moment de jeu actif. Le compte de 3 groupes simultanés n'est jamais dépassé
dans le code lu.

---

## Platform Adaptation

**Ordinateur (clavier + souris).** Le HUD ne réserve aucune zone au pointeur :
tous les panneaux sont cliquables à la souris, mais la traversée complète est
possible au clavier seul (`## Accessibility`). `#touch-controls` reste
`display:none` sous `(hover:none)` absent — c'est-à-dire sur toute machine à
souris, même si elle possède un écran tactile secondaire (`hover:none` seul ne
suffit pas, la règle exige `(hover: none) and (pointer: coarse)`,
`game.css:673`).

**Téléphone (pointeur grossier).** Les zones tactiles n'apparaissent que sous
`@media (hover: none) and (pointer: coarse)` (`game.css:673-710`) : un téléphone
à stylet capacitif fin, ou une tablette avec souris Bluetooth active, ne les
recevrait pas — comportement voulu (`docs/DESIGN.md` § Zones tactiles), pas un
défaut. Sur un téléphone conforme :

- Chaque touche tactile mesure 4,5 rem (72 px) de diamètre, largement au-dessus
  du plancher `--tap-min` (44 px).
- `#touch-controls` porte `pointer-events:none` sur le conteneur : les gestes
  destinés à faire pivoter la caméra ou à interagir avec le reste de la scène ne
  sont pas volés en dehors des deux colonnes de boutons.
- **Défaut trouvé — marges de sécurité inversées.** Le remplissage du conteneur
  associe la marge de sécurité du côté gauche à la marge droite et inversement :
  `padding: 0 max(12px, env(safe-area-inset-left)) 0 max(12px, env(safe-area-inset-right));`
  (`frontend/src/css/game.css:680-682`) — en CSS, l'ordre est
  haut/droite/bas/gauche, donc le remplissage **droit** lit
  `safe-area-inset-left` et le remplissage **gauche** lit
  `safe-area-inset-right`. Sans effet sur un téléphone en portrait (les deux
  valent 0 dans ce cas, ce qui explique que `make check` et l'essai du 20 août
  2026 ne l'aient pas révélé), mais un Pong joué en paysage sur un téléphone à
  encoche placerait la colonne de boutons du mauvais côté sous la zone protégée.
- `#space` (Z3) n'a pas d'équivalent `env(safe-area-inset-top)` alors qu'il est
  ancré à 20 px fixes du bord haut (`game.css:100-105`) : sur un téléphone à
  encoche centrale en haut, rien ne le pousse sous elle.

**Machine à double entrée (souris + tactile).** Le principe produit n° 2 («
ordinateur d'abord, téléphone utilisable ») n'exclut pas les écrans tactiles de
grande taille avec souris branchée : dans ce cas, `(hover:none)` est faux (une
souris est présente) et les zones tactiles restent masquées même si l'écran
répond au doigt — la personne devrait alors utiliser le clavier ou la souris
pour jouer. C'est cohérent avec la hiérarchie déclarée dans
`.claude/docs/technical-preferences.md` (clavier principal, tactile secondaire
uniquement sous pointeur grossier sans survol).

---

## Tuning Knobs

**Constat : le HUD du jeu n'expose aucun réglage.** Recherche exhaustive dans
`frontend/src/game/` et `frontend/game.html` : aucun curseur de volume, aucun
bouton plein écran, aucune option graphique, aucune sensibilité de commande.
`frontend/src/game/sounds.mjs` fixe un volume par piste en dur
(`EAGER`/`STREAMED`, ex. `ambient: 0.2`, `pong: 0.2`) sans qu'aucune interface
ne l'expose à la personne ; ce n'est pas un réglage caché, c'est un niveau
d'équilibrage sonore.

Ce que la personne peut ajuster :

- **Rien dans le HUD lui-même.** Le plein écran natif du navigateur (F11, geste
  de zoom) reste disponible mais n'est ni déclenché ni exposé par une commande
  du jeu.

Ce que la personne ne peut pas ajuster, et pourquoi ce n'est pas un oubli :

- **Le remappage des touches.** Limite assumée, déjà nommée dans
  `docs/PRODUCT.md` § Accessibility & Inclusion et dans
  `design/accessibility-requirements.md` § Écarts connus : « Pas de remappage
  des touches. Limite assumée, pas un oubli à combler en douce. » Les
  affectations de `frontend/src/game/controls.mjs` (`w`/`s` → gauche, `↑`/`↓` →
  droite) sont fixes et partagées par le clavier et les zones tactiles
  (`padForSide`). Une personne qui ne peut pas atteindre W/S ou les flèches n'a
  aucune substitution disponible dans le jeu.
- **Le volume par piste.** Non exposé, cohérent avec
  `design/accessibility-requirements.md` : aucune information de jeu n'est
  portée par le son seul (le score, la fin de manche et les invitations ont
  toutes un canal visuel et textuel), donc l'absence de réglage sonore n'est pas
  un blocage fonctionnel — seulement un confort manquant.

---

## Accessibility

**Annonces par région live**, en repartant des quatre régions déjà câblées dans
`frontend/game.html` :

| Région                                                                        | Rôle / politesse                                                                        | Ce qu'elle annonce                                                                                                                                                                                                                                                                        | Règle d'écriture respectée                                                                                              |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `#score-announce` (`role="status"`, `aria-live="polite"`, `.visually-hidden`) | polie                                                                                   | Phrase complète « Orange N, blue M » à chaque point (`socketEvent.mjs:55-56`)                                                                                                                                                                                                             | Un seul nœud texte, réécrit en entier — pas les trois nœuds visuels séparés de `#score`, qui reste `aria-hidden="true"` |
| `#match-info` (`role="status"`, `aria-live="polite"`)                         | polie                                                                                   | Message d'ouverture de phrase (adversaires, ou vainqueur du tournoi) ; le `<span id="countdown">` est lui-même `aria-hidden="true"` (`socketEvent.mjs:17`) pour que le compte à rebours seconde par seconde ne produise pas cinq annonces distinctes                                      | Conforme à la règle « une région live encadre un seul nœud… » de `design/accessibility-requirements.md`                 |
| `#waiting-elapsed` (`role="status"`)                                          | implicitement polie (`role="status"` seul, pas d'`aria-live` explicite mais équivalent) | Le texte change chaque seconde (`socketEvent.mjs:126-131`) — un lecteur d'écran fidèle à `role="status"` annonce chaque changement, soit une annonce par seconde tant que le panneau est ouvert ; à surveiller si une personne utilise cet écran plus de quelques dizaines de secondes    |                                                                                                                         |
| `#invite` (`role="alert"`)                                                    | assertive (implicite au rôle)                                                           | Texte d'invitation complet, une fois — mais une seconde invitation avant réponse à la première réécrit silencieusement le même nœud (voir `## Dynamic Behaviors`) : le contenu change et sera réannoncé, mais rien ne dit explicitement « une autre invitation a remplacé la précédente » |                                                                                                                         |

`#notReady` (`role="status"`, `aria-live="polite"`) suit la même construction à
un seul nœud pour `refuse-invit`, `not-ready` et `connect_error`.

**Focus à l'ouverture et à la fermeture.** `showPanel()`
(`frontend/src/game/panels.mjs:10-16`) retire `hidden` puis appelle
`focusFirst()`, qui pose le focus sur le premier `<button>` non masqué et non
désactivé du panneau (`panels.mjs:24-28`). C'est la même construction que le
tableau de bord. Aucune annonce ne déplace le focus de son propre chef —
conforme à la « Règle de focus » de `design/accessibility-requirements.md`.

**Ordre de focus par panneau** (ordre DOM, celui que `Tab` suit) :

1. `#menu` : `Solo` → `Multiplayer` (absent pour un invité, `main.mjs:30`) — pas
   d'autre cible focalisable dans le panneau (`.guest-note` et
   `.controls-legend` sont du texte).
2. `#multi` : `2 Players Local` → `2 Players Online` → `4 Players Online` →
   `Tournaments` → `Back`.
3. `#tournament` : chaque entrée de `#tournament-list` (boutons
   `.tournament-item`, ajoutés dynamiquement) → `Create tournament` → `Back`.
   Note : au premier affichage, la liste peut être encore vide au moment où
   `focusFirst()` s'exécute — la réponse serveur à `return-list` arrive après
   l'ouverture du panneau — auquel cas le focus initial tombe sur
   `Create tournament`, sans re-focalisation quand la liste se peuple ensuite.
4. `#invite` : `Accept` → `Refuse`.
5. `#waiting` : `Cancel` (seul bouton).
6. `#tournament-details` : `Quit Tournament` (seul bouton du panneau — les cases
   `player-1…4` et `Gagnant-*` sont des `<span>`, non focalisables).
7. `#game-over` : `Play again` (masqué si `lastMode` est `null`) → `Back`.

**`Escape` et bouton de retour.** Aucun gestionnaire `keydown` n'écoute `Escape`
dans `frontend/src/game/` (vérifié par recherche exhaustive) : ni `main.mjs`, ni
`socketEvent.mjs` ne le traitent. La fermeture d'un panneau passe uniquement par
son propre bouton de sortie — `Back`, `Cancel`, `Refuse`, `Quit Tournament` —
atteint par `Tab` ou déjà focalisé si c'est la première cible du panneau. Aucun
de ces panneaux ne porte `role="dialog"` ni ne piège le focus, donc l'absence
d'`Escape` n'est pas une violation des pratiques ARIA pour une boîte de dialogue
modale — mais c'est un choix qui mérite d'être confirmé, pas une évidence : voir
`## Open Questions`.

**Alternative non colorée à l'attribution des raquettes (UI-GAME-10).** Vérifiée
dans le code, pas supposée :

- `.controls-brief` nomme explicitement le camp par un mot, pas seulement par
  une teinte : « You are the orange paddle, on the left. Move with W and S. »
  (`main.mjs:332-334`) — une personne daltonienne ou un lecteur d'écran reçoit
  la même information qu'une personne voyante.
- `#score-announce` fait de même à chaque point : « Orange 3, blue 2 » (texte,
  pas une pastille de couleur).
- Les boutons tactiles portent un `aria-label` directionnel (« Left paddle up »,
  etc., `frontend/game.html:171,186,203,218`), indépendant de toute couleur.
- **Limite non couverte** : dans `#tournament-details`, les quatre places
  (`#player-1…4`) et les gagnants (`#Gagnant-1/2`) sont colorés en
  `--pad-orange`/`--pad-blue` (`game.css:521-543`) sans mot « orange »/« blue »
  à proximité — seule la position dans la colonne (haut/bas de chaque paire)
  porte un second signal spatial. Ce n'est pas la même exigence que UI-GAME-10
  (qui vise les raquettes, pas l'arbre), et l'arbre ne conditionne aucune action
  de jeu, mais la cohérence du système en pâtit légèrement.

**Cibles et tailles.** Tous les boutons du HUD portent
`min-height: var(--tap-min)` sur `#space` (`game.css:117`) ou dépassent 44 px
par construction (`.menu-button`: 18 px + 36 px de remplissage ≈ 54 px de
hauteur ; `.button-tournament`: 12 px + 24 px ≈ 48 px ; boutons tactiles : 72
px). `.invite-button` (`accept`/`cancel`) est en revanche `padding: 8px 12px`
sans plancher explicite (`game.css:641-649`) — à vérifier au pointeur grossier,
où `docs/DESIGN.md` § Règle du Pouce exige 44 px et ne semble pas couvrir ce
composant nommément.

---

## Open Questions

1. **`#space` et le flux « tournament-full » sont du code mort.** Le client
   écoute `socket.on("tournament-full", …)` et pose un gestionnaire
   `player_ready` (`frontend/src/game/socketEvent.mjs:237-255`), mais aucun
   fichier de `src/realtime/app/game/` n'émet `tournament-full` ni n'écoute
   `player_ready` (recherche exhaustive sur les deux chaînes dans
   `src/realtime/`). Les quatre matchs de tournoi démarrent automatiquement dès
   que les places sont prises (`createQuarterRooms`,
   `src/realtime/app/game/tournament.mjs:64-66,81-83`) — `#space` n'est donc
   jamais peint dans le jeu tel que livré. UI-GAME-3 reste satisfaite par
   ailleurs (`#start-game-button` seul suffit à la preuve), mais l'entrée
   `#space` citée par cette même exigence documente une fonctionnalité qui
   n'existe plus côté serveur. Pointeurs : `frontend/game.html:132-134`,
   `frontend/src/game/socketEvent.mjs:237-255`, absence confirmée dans
   `src/realtime/app/game/sockets.mjs` et `tournament.mjs`.

2. **Quitter un tournoi ne ramène pas au menu — `#tournament-details` reste
   affiché.** Le clic sur `#quit-tournament` émet
   `socket.emit("quit-tournament")` (table `MENU_EMITS`,
   `frontend/src/game/socketEvent.mjs:78`) mais cet identifiant n'apparaît dans
   aucune entrée de `MENU_NAV` (`socketEvent.mjs:91-101`), et aucun gestionnaire
   ne masque `#tournament-details` ni ne rouvre `#menu` après l'émission.
   UI-TOUR-4 (« Abandon possible à tout moment ») est vraie côté serveur (la
   personne sort effectivement de la salle,
   `src/realtime/app/game/tournament.mjs:86-112`) mais fausse côté HUD : la
   personne reste face à un arbre de tournoi obsolète sans chemin de retour
   visible. Pointeurs : `frontend/src/game/socketEvent.mjs:78,91-101`.

3. **`socket.emit("quit-tournament", gagnantFinale)` envoie un nœud DOM comme
   charge utile.** À la fin d'un tournoi, `updateFinal()` émet l'événement avec
   `gagnantFinale`, qui est `document.getElementById("Gagnant-Finale")`
   (`frontend/src/game/socketEvent.mjs:345`) — un élément DOM, pas une donnée
   sérialisable. Le serveur ne lit que la véracité de `data` (`if (!data && …)`,
   `tournament.mjs:100`), donc l'effet pratique est probablement bénin, mais
   c'est un signe que ce chemin de code n'a jamais été exercé avec des données
   propres. Pointeur : `frontend/src/game/socketEvent.mjs:345`.

4. **`document.getElementById("tournament").classList.remove("active")` cible
   une classe qui n'existe dans aucune règle CSS.** `main.mjs:474`, dans le
   gestionnaire `gameOver`. `frontend/src/css/game.css` ne définit pas
   `.tournament.active` ni `.active` seule pour ce sélecteur — l'appel est sans
   effet visuel, probablement un reliquat. Pointeur :
   `frontend/src/game/main.mjs:474`.

5. **UI-TOUR-3 est mal évidencée.** L'exigence (« État "pas prêt" signalé tant
   que les quatre places ne sont pas tenues », `design/ui-requirements.md:53`)
   cite `#notReady`/`#not-ready-text` comme preuve, mais ces nœuds ne sont
   déclenchés que par les événements `refuse-invit`, `not-ready` (issus du flux
   d'invitation directe, `src/realtime/app/game/sockets.mjs:196-198`) et
   `connect_error` — jamais par un compte de places de tournoi. Le seul signal
   réel du nombre de places tenues est l'état vide des `<span>` `#player-1…4`
   tant qu'elles n'ont pas reçu de nom (`socketEvent.mjs:262-266`), sans texte
   ni annonce dédiés. Pointeurs : `design/ui-requirements.md:53`,
   `frontend/src/game/socketEvent.mjs:257-266,192-198`.

6. **Marges de sécurité tactiles inversées gauche/droite.**
   `padding: 0 max(12px, env(safe-area-inset-left)) 0 max(12px, env(safe-area-inset-right));`
   associe le remplissage droit à l'encoche gauche et inversement. Sans
   conséquence visible en portrait (les deux valent 0 sur la résolution de
   référence 390 × 844), potentiellement gênant en paysage sur un téléphone à
   encoche. Pointeur : `frontend/src/css/game.css:680-682`.

7. **`#space` n'a pas de marge de sécurité haute.** Ancré à
   `top: var(--space-lg)` = 20 px fixes, sans `env(safe-area-inset-top)`,
   contrairement à `#touch-controls` qui protège les côtés. Peu d'impact tant
   que `#space` reste du code mort (point 1), mais le défaut resterait si le
   flux de tournoi était un jour rebranché. Pointeur :
   `frontend/src/css/game.css:100-118`.

8. **Deux invitations coup sur coup ne sont pas arbitrées.** Voir
   `## Dynamic Behaviors` — `pendingInvite` n'a pas de file d'attente, la
   seconde invitation écrase silencieusement la première. Décision qui
   n'appartient pas à cette spec : faut-il refuser la seconde tant que la
   première n'a pas de réponse (avec un avis à l'émetteur), ou l'empiler
   visuellement ? Pointeur : `frontend/src/game/socketEvent.mjs:147-166`.

9. **Absence d'`Escape` pour fermer un panneau — à confirmer, pas un défaut en
   soi.** Aucun panneau ne porte `role="dialog"`, donc aucune norme ARIA ne
   l'exige, mais c'est un raccourci que beaucoup de personnes attendent d'un
   panneau flottant superposé à une scène de jeu. Décision produit, pas une
   correction technique.

10. **`.invite-button` (`accept`/`cancel`) sans plancher `--tap-min`
    explicite.** `padding: 8px 12px` (`frontend/src/css/game.css:641-649`) ; à
    mesurer au rendu sous `(pointer: coarse)` pour confirmer si la hauteur
    totale atteint 44 px, la Règle du Pouce ne le nommant pas explicitement dans
    `docs/DESIGN.md`.
