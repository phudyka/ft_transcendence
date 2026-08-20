# UX Spec: Home / Landing

> **Status**: In Design
> **Author**: phudyka + ux-designer
> **Last Updated**: 2026-08-20
> **Platform Target**: Web — ordinateur (clavier + souris) d'abord, téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-AUTH-6, UI-NAV-1, UI-NAV-5
> **Journey Phase(s)**: Parcours A — Phase 1 (Atterrissage) et Phase 2 (Première preuve) ; le prolongement en Phase 3 (Essai) se joue dans le document imbriqué `/game.html`, documenté à part. Parcours B ne traverse pas normalement cet écran (`design/player-journey.md` marque `/` « — » pour ce parcours) — voir Player Context on Arrival pour le cas résiduel où il l'atteint quand même.
> **Template**: UX Spec

---

## Purpose & Player Need

La personne arrive en voulant vérifier, en quelques secondes et sans engagement, si ce Pong en 3D tient ce qu'il promet — voir la scène tourner et, si elle le décide, y jouer un point tout de suite, sans franchir un formulaire d'abord.

---

## Player Context on Arrival

**Parcours A (visiteur de portfolio).** Elle arrive froide, depuis un lien partagé (CV, message), sur ordinateur, pour quelques minutes, sans compte et sans intention de revenir. `sessionStorage` est vide. Le jugement technique a déjà commencé avant le premier clic — c'est la phase 1 de `design/player-journey.md`. Ce qu'elle porte n'est pas un état applicatif, c'est une attente : voir quelque chose, tout de suite, pas lire une page de présentation.

**Parcours B (joueur).** `design/player-journey.md` marque explicitement `/` d'un tiret pour ce parcours : le joueur qui revient va directement à `/login`, pas ici. Le cas résiduel existe quand même — une session expirée, un lien partagé sans le chemin `/login`, ou un simple oubli fait atterrir un joueur déconnecté sur `/` — mais l'application ne peut pas le distinguer d'un visiteur de portfolio : `sessionStorage` vide se lit de la même façon dans les deux cas (`frontend/src/app.js:123-125`). Cet écran ne lui propose donc rien de différent.

**Ce qu'elle ne porte jamais.** Une personne déjà connectée n'atteint jamais cet écran : le routeur la redirige vers `/dashboard` avant tout rendu (`frontend/src/app.js:57-59`). Tout ce qui suit décrit donc exclusivement l'expérience d'une personne sans session active.

**Autres arrivées, plus rares.** Une personne qui a commencé un formulaire de connexion ou d'inscription puis a cliqué le lien de retour revient ici avec une intention interrompue, pas abandonnée par indifférence (`frontend/src/views/login.js:121`, `frontend/src/views/register.js:251`). Une personne qui vient de tomber sur une route inconnue revient ici « égarée », au sens du tableau des états émotionnels de `design/player-journey.md` (`frontend/src/views/notfound.js:13-14`).

---

## Navigation Position

```
/                         ← cet écran, racine du branchement public
├── /login
├── /register
├── /dashboard             (protégé — redirige vers /login si déconnecté)
├── /settings              (protégé)
├── /profile               (protégé)
├── /profile/:name         (protégé)
└── route inconnue → 404

/game.html                 entrée Vite séparée, hors routeur SPA — montée ici
                            en <iframe id="demo-game">, et autonome si ouverte
                            directement
```

`/` est la seule route publique qui n'a pas de contrepartie protégée à retenir : c'est l'écran zéro, celui que toute personne sans session touche en premier, que ce soit par choix (lien direct) ou par redirection implicite (aucune route ne renvoie explicitement vers `/`, hormis les sorties listées ci-dessous). Aucune route n'est imbriquée sous `/` — c'est une feuille de l'arbre, pas un embranchement.

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
| --- | --- | --- |
| URL tapée directement, ou lien externe (CV, portfolio) | Chargement de `/`, personne non connectée | `sessionStorage` vide ; jugement déjà commencé (`design/player-journey.md`, Parcours A, phase 1) |
| Retour du navigateur (`popstate`) depuis `/login` ou `/register` | Bouton « Précédent » | Un formulaire abandonné en cours de saisie — les champs ne sont pas restaurés, la vue est reconstruite de zéro (`frontend/src/app.js:90`, `104-113`) |
| Bouton « Back to the demo » de l'écran 404 | Clic, personne non connectée | Vient d'une route inconnue ; égarement (`frontend/src/views/notfound.js:13-14`) |
| Lien de retour en pied de `/login` ou `/register` | Clic, `navigateTo("/")` | Intention de connexion ou d'inscription interrompue avant soumission (`frontend/src/views/login.js:121`, `frontend/src/views/register.js:251`) |
| `/` tapée par une session déjà connectée | Chargement de `/` | N'atteint jamais cet écran : redirection immédiate vers `/dashboard`, avant tout rendu (`frontend/src/app.js:57-59`) — listé ici pour mémoire, ce n'est pas une entrée réelle |

**Sur la redirection d'une route protégée.** `UI-AUTH-8` (tentative d'accès à `/dashboard`, `/settings` ou `/profile` sans session) ne débouche jamais sur cet écran : `frontend/src/app.js:34-37` envoie systématiquement vers `/login`, pas vers `/`. Ce n'est donc pas une entrée de cette spec — elle appartient à celle de `/login`.

| Exit Destination | Trigger | Notes |
| --- | --- | --- |
| `/login` | Clic sur « Log in » | `#home-login`, `frontend/src/views/home.js:54-57` — navigation immédiate, sans confirmation |
| `/register` | Clic sur « Create account » | `#home-register`, `frontend/src/views/home.js:58-61` — navigation immédiate, sans confirmation |
| Hors du site | Fermeture de l'onglet, ou clic sur un lien externe | Fin du Parcours A, phase 4 (`design/player-journey.md`) |

**Ce qui est perdu en changeant d'écran.** `navigateTo()` remplace tout `#ft_transcendence` par un nouveau `innerHTML` (`frontend/src/app.js:104-113`) : l'iframe `#demo-game` est démontée dans le même geste. Si une partie solo est en cours à ce moment, son contexte 3D (scène three.js, connexion socket.io invitée, audio en cours) est détruit sans avertissement ni confirmation — il n'existe pas de motif de confirmation dans le projet pour une action de ce genre (`design/ux/interaction-patterns.md`, catalogue « Boîte de dialogue », Absent). Passer de la démo à l'inscription coûte donc la partie en cours, pas un compte ni une progression : rien n'est enregistré côté serveur pour un invité (`src/realtime/app/auth.mjs:48-56`).

---

## Layout Specification

### Information Hierarchy

1. **Identité** — logo et nom du produit : confirme en un coup d'œil qu'on est au bon endroit.
2. **Preuve immédiate** — la démo elle-même, pas une capture d'écran : c'est elle qui porte l'argument produit, occupant toute la hauteur restante.
3. **Conversion, en retrait** — « Log in » et « Create account » vivent dans la barre du haut, à la taille d'un bouton de navigation, pas d'un appel à l'action géant : rien ne doit voler la vedette à la scène (`docs/PRODUCT.md`, principe n° 1).
4. **Rappel, en dernier mot** — le pied de page dit ce que le compte débloque, après que la démo a eu la parole, pas avant.

### Layout Zones

- **`.home-bar`** — bandeau fixe en tête, fumée à 0,9 (`--panel-smoke-strong`), ombre portée vers le bas (`--shadow-panel`). Contient `.home-identity` (logo + titre), `.home-tagline` (accroche, `flex: 1`) et `.home-actions` (les deux boutons, poussés à droite par `margin-inline-start: auto`).
- **`.home-stage`** — occupe tout l'espace restant (`flex: 1; min-height: 0`), fond `--panel-smoke` en attente du contenu de l'iframe. Contient uniquement `#demo-game`.
- **`.home-footer`** — bandeau bas, même fumée que l'en-tête (`--panel-smoke-strong`), une seule ligne de texte centrée.

**Desktop (≥ 769 px).** Trois bandes horizontales : en-tête sur une ligne, scène en plein centre, pied de page fin. C'est la Règle des Deux Rives dans sa forme la plus nette (`docs/DESIGN.md`) : orange en haut et en bas, bleu et or au milieu, la couture est le bord de l'iframe.

**Mobile (≤ 768 px, `frontend/src/css/home.css:84-90`).** `.home-tagline` passe en `order: 3; flex-basis: 100%` : l'en-tête s'étale sur deux lignes (identité + actions sur la première, accroche sur la seconde). La scène ne reçoit aucun `aspect-ratio` imposé — elle garde toute la hauteur disponible, parce que le HUD du jeu se redimensionne sur la largeur de l'iframe, pas sur celle de la fenêtre (`docs/DESIGN.md`, section Dependencies).

### Component Inventory

| Composant | Motif de référence | Sélecteur | État par défaut |
| --- | --- | --- | --- |
| Logo produit | image décorative, hors catalogue | `.home-identity img` | `alt=""`, non focalisable, 40×40 px fixes |
| Titre « ft_transcendence » | texte, hors catalogue | `.home-title` (`h1`) | statique ; cible de focus programmatique à l'entrée sur la route (`announceRoute`, `frontend/src/app.js:18-24`) |
| Accroche | texte, hors catalogue | `.home-tagline` | statique |
| Bouton « Log in » | [Bouton](interaction-patterns.md#bouton), variante contour | `#home-login`, `.btn.btn-outline-light` | Default |
| Bouton « Create account » | [Bouton](interaction-patterns.md#bouton), variante primaire | `#home-register`, `.btn.btn-primary` | Default |
| Démo jouable | Motif non catalogué — l'iframe est un choix d'architecture (`UI-NAV-5`), pas un motif d'interaction ; ce qu'elle contient (Bouton START, Barre de progression, Menu de jeu, Zones tactiles) est catalogué séparément dans `interaction-patterns.md` | `#demo-game` (`iframe`) | `src="/game.html"`, chargement démarré au montage ; premier contenu utile = [Bouton START](interaction-patterns.md#bouton-start) |
| Texte de pied de page | texte, hors catalogue | `.home-footer p` | statique |

### ASCII Wireframe

**Desktop, 1440 × 900**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [logo] ft_transcendence     Pong in 3D. Play the demo   [Log in] [Create  │
│                             right now — no account…       account]       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                                                                            │
│                                                                            │
│                        #demo-game  (iframe → game.html)                  │
│                                                                            │
│                                                                            │
│                                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│         Online matches, tournaments, friends and chat come with          │
│                              an account.                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile, 390 × 844**

```
┌───────────────────────────────┐
│ [logo] ft_transcendence        │
│                [Log in][Create]│
├─────────────────────────────── │  ← .home-tagline, order: 3
│ Pong in 3D. Play the demo      │
│ right now — no account needed. │
├───────────────────────────────┤
│                                 │
│                                 │
│   #demo-game (iframe, prend     │
│   toute la hauteur restante)    │
│                                 │
│                                 │
├───────────────────────────────┤
│ Online matches, tournaments,   │
│ friends and chat come with     │
│ an account.                    │
└───────────────────────────────┘
```

---

## States & Variants

| State / Variant | Trigger | What Changes |
| --- | --- | --- |
| Default | `/` chargée, personne non connectée | Bandeau (logo, titre, accroche, « Log in »/« Create account »), zone de démo (fond `--panel-smoke`) et pied de page peints en un seul rendu synchrone (`frontend/src/views/home.js:17-52`) — **aucun appel `/api/…`**, contrairement à ce que le palier Comprehensive fait présumer par défaut pour un état « Loading » |
| Chargement — document imbriqué | Insertion de `<iframe src="/game.html">` dans le DOM, dans le même passage que Default | La zone `#demo-game` est vide (fond de la page hôte, pas encore celui de `game.html`) le temps que l'hébergeur statique serve `game.html`, `game.css` et `main.mjs` — requête distincte de l'API Django endormie, donc non concernée par son réveil d'une minute. **Peint (le cadre `#demo-game`) avant de répondre** (aucun contrôle actionnable tant que le document n'a pas fini de charger) : état visible mais inerte, non chronométré par `make check`. |
| Scène en attente | Document `game.html` chargé | Bouton START visible et actionnable immédiatement, sans classe `hidden` (`frontend/game.html:22`), sur fond nuit (`frontend/src/css/game.css:5-9`). En parallèle, `connectGame()` ouvre une connexion socket.io invitée dès l'évaluation du module (`frontend/src/game/main.mjs:16`), sans aucune UI qui le montre tant qu'elle réussit. |
| Menu invité | Clic sur START, puis 4000 ms fixes (fondu du logo 2000 ms + fondu des nuages 2000 ms, `frontend/src/game/animation.mjs:4-21`) | Panneau `#menu` affiché, focus posé sur « Solo » (`focusFirst`, `frontend/src/game/panels.mjs:24-28`) ; « Multiplayer » déjà masqué et la note invité déjà affichée — décidé en synchrone dès l'évaluation du module, avant même le clic sur START (`frontend/src/game/main.mjs:27-32`). Peint et répond dans le même geste : pas d'état inerte pour ce contrôle précis. |
| Chargement de la scène 3D | En parallèle du minuteur ci-dessus, dès le clic sur START (`initGame()`) | Barre de progression interne (voir `interaction-patterns.md#barre-de-progression`) suivant le chargement du GLB (~8,7 Mo). Peut finir après les 4000 ms du fondu : le menu devient alors cliquable pendant que l'île continue de se construire sous les raquettes — voir Open Questions. |
| Erreur — service temps réel injoignable | `connect_error` (jusqu'à 20000 ms, délai de connexion par défaut de socket.io, non modifié dans `frontend/src/config.js`) | `#notReady` s'affiche en coin haut-droit : « Cannot reach the game server. Try reloading the page. », `role="status"`, `aria-live="polite"` (`frontend/src/game/main.mjs:238-244`). Le bouton START reste affiché et cliquable — voir Open Questions. |
| Empty | Sans objet | Cet écran ne rend aucune collection issue d'un appel serveur (pas de liste, pas de profil) : rien à représenter vide. |

---

## Interaction Map

**Clavier — ordre de `Tab` dans le document `/` :**

1. `#home-login` (« Log in »)
2. `#home-register` (« Create account »)
3. `<iframe id="demo-game">` — le focus entre dans le document imbriqué ; le premier contrôle qu'il y trouve (typiquement `#start-game-button`, ou le premier bouton non masqué du panneau ouvert si la démo a déjà progressé) devient le nouvel arrêt de tabulation, dans le contexte de focus propre à `game.html`.

Aucun autre élément de `/` n'est focalisable (le logo est décoratif, le titre et l'accroche sont du texte, le pied de page ne porte aucun contrôle). `Shift+Tab` depuis le tout premier contrôle focalisable à l'intérieur de l'iframe rend le focus à `#home-register`. `Enter` et `Espace` activent nativement les deux boutons — rien à coder. Aucune interaction de cet écran n'exige de précision de pointeur.

**`Escape`.** Sans effet sur `/` lui-même (pas de modale, pas de menu déroulant ici). À l'intérieur de l'iframe, le comportement est celui déjà documenté — et non redécrit ici — par `design/ux/interaction-patterns.md` (Gaps #1) : les panneaux du jeu ne ferment pas sur `Escape`.

**Pointeur.** Survol des deux boutons : assombrissement de l'aplat/de la bordure et agrandissement à 1,05, `--ease-color` (0,3 s) et `--ease-transform` (0,2 s) — voir [Bouton](interaction-patterns.md#bouton). Clic : navigation immédiate.

**Tactile.** Sous `(pointer: coarse)`, les deux boutons de la barre restent ≥ 44 px de hauteur — le plancher `--tap-min` de `.btn` (`frontend/src/css/tokens.css:139`) n'est pas réduit par les surcharges locales de `.home-actions .btn`, qui ne touchent que le remplissage et la taille de police (`frontend/src/css/home.css:49-52`). À l'intérieur de l'iframe, les zones tactiles suivent le motif [Zones tactiles](interaction-patterns.md#zones-tactiles), non redécrit ici.

---

## Events Fired

| Player Action | Event Fired | Payload / Data |
| --- | --- | --- |
| Ouverture de `/`, personne non connectée | Aucun | `home.js` n'effectue aucune requête `/api/…` à l'ouverture (`frontend/src/views/home.js:17-52`) |
| Clic sur « Log in » | Navigation SPA | `navigateTo("/login")` — changement de route, pas un appel réseau (`frontend/src/views/home.js:54-57`) |
| Clic sur « Create account » | Navigation SPA | `navigateTo("/register")` (`frontend/src/views/home.js:58-61`) |
| Montage de `#demo-game` | Requête HTTP statique | `GET /game.html` puis ses bundles JS/CSS, servis par l'hébergeur statique du frontend — jamais par l'API Django |
| Évaluation du module `main.mjs` dans l'iframe | Connexion socket.io | `connectGame()` ouvre le namespace `/game` en invité (`allowGuest`, `src/realtime/app/auth.mjs:57-72`) dès le chargement du script, avant tout clic sur START |
| Clic sur START | Événement socket, hors périmètre de cette spec | Déclenche `initGame()` côté client (chargement du GLB, ouverture du menu) — comportement détaillé dans `design/ux/interaction-patterns.md` et la future spec du HUD de jeu, pas ici |

---

## Transitions & Animations

- **Entrée sur `/`.** Aucune transition dédiée : le routeur remplace `#ft_transcendence.innerHTML` en un seul geste synchrone (`frontend/src/app.js:104-113`), sans fondu ni décalage.
- **Sortie vers `/login` ou `/register`.** Même mécanisme, même absence de transition.
- **Survol des boutons « Log in »/« Create account ».** `--ease-color` (couleur de fond/bordure, 300 ms) et `--ease-transform` (agrandissement à 1,05, 200 ms) — voir [Bouton](interaction-patterns.md#bouton). Sous `prefers-reduced-motion: reduce`, la transformation est neutralisée (`*:hover { transform: none !important; }`, `frontend/src/css/tokens.css:123-125`), la transition de couleur reste.
- **Contenu de l'iframe.** Ses propres transitions (START, barre de progression, fondu logo/nuages) sont documentées dans `design/ux/interaction-patterns.md` — non redécrites ici pour éviter la duplication que ce catalogue est censé prévenir.

---

## Data Requirements

| Data | Source System | Read / Write | Update trigger | Null handling |
| --- | --- | --- | --- | --- |
| Statut de session (`sessionStorage.username`) | Client (`sessionStorage`, écrit par `/login` ou `/register`) | Read | Vérifié à chaque exécution du routeur (`frontend/src/app.js:58`) | Absent → `home()` s'affiche ; présent → redirection immédiate vers `/dashboard`, `home()` ne s'exécute jamais |
| État de la démo (scène 3D, score, panneau ouvert) | `src/realtime`, namespace `/game`, session invité | Read/Write (socket.io) | Événements nommés émis par `frontend/src/game/main.mjs` et `socketEvent.mjs`, à l'intérieur du document `game.html` | Hors propriété de cet écran : `home.js` ne lit ni n'écrit cet état, il monte seulement l'iframe qui le porte — l'UI de `/` n'est jamais propriétaire de cette donnée |
| Logo produit | Fichier statique (`frontend/public/brand/logo2.png`) | Read | Chargement de page | Manquant → `alt=""` laisse un espace vide de taille fixe (40×40 px), sans rupture de mise en page |

---

## Accessibility

**Ordre de focus.** Voir Interaction Map : 1) « Log in », 2) « Create account », 3) premier contrôle focalisable du document imbriqué.

**Contrastes chiffrés.** Calculés selon la formule de luminance relative WCAG, à partir des couleurs de `frontend/src/css/tokens.css`. Le fond effectif de l'en-tête et du pied de page est `--panel-smoke-strong` (`rgba(34, 34, 34, 0.9)`) posé sur le fond de page `--night` (`#121212`, hérité de la règle non scopée `body { background-color: var(--night) }` de `dashboard.css`, qui s'applique aussi à `/` — voir `CLAUDE.md`) : la couleur perçue est environ `#202020`.

| Paire | Ratio calculé | Seuil applicable |
| --- | --- | --- |
| Titre `--sunset-orange` (#ff8c00) sur `--panel-smoke-strong` (≈ #202020) | 6,99:1 | 3:1 (grand texte, Bebas Neue clamp ≥ 1,75rem) — large marge |
| Accroche `--paper` (#e0e0e0) sur `--panel-smoke-strong` | 12,34:1 | 4,5:1 (texte courant) — large marge |
| Pied de page `--muted-sand` (#888888) sur `--panel-smoke-strong` | 4,60:1 | 4,5:1 (texte courant, 0,85rem — sous le seuil de grand texte) — marge étroite, à surveiller si le jeton change |
| Texte et bordure du bouton « Log in », `--lava-orange` (#ff5722) sur `--panel-smoke-strong` | 5,15:1 | 4,5:1 (texte) et 3:1 (bordure d'élément interactif) — les deux tiennent |
| Texte `--on-accent` (#121212) sur l'aplat `--lava-orange` du bouton « Create account » | 5,92:1 | 4,5:1 — tient. `docs/DESIGN.md` cite 8,03:1 pour « nos oranges » sur `--on-accent », mais cette valeur précise est calculée pour `--sunset-orange` (#ff8c00) ; recalculée ici pour `--lava-orange`, la règle (jamais de `--chalk` sur un aplat clair) tient pour les deux, le chiffre diffère selon la nuance. |

**Alternative non colorée.** Rien sur cet écran ne communique par la couleur seule : le titre orange porte aussi le mot « ft_transcendence », les boutons portent leur libellé en toutes lettres. Le seul élément purement décoratif est le logo (`alt=""`).

**Annonces lecteur d'écran.** `announceRoute("Play")` change `document.title` en « Play — ft_transcendence » et déplace le focus sur le `<h1>` (`.home-title`, texte « ft_transcendence ») sans `aria-live` (`frontend/src/app.js:18-24`, appelé par `frontend/src/views/home.js:63`). C'est un déplacement de focus, pas une région vive : un lecteur d'écran annonce le rôle et le texte de l'élément focalisé (« ft_transcendence », titre de niveau 1), pas littéralement « Play ». Voir Open Questions — ce comportement contredit la ligne « absent — écart connu » de `design/accessibility-requirements.md:57`. À l'intérieur de l'iframe, si le service temps réel est injoignable, `#notReady` porte `role="status"` et `aria-live="polite"` (`frontend/game.html:86-93`).

**Cibles.** « Log in » et « Create account » tiennent 44 px de hauteur minimale via `.btn { min-height: var(--tap-min) }` (`frontend/src/css/tokens.css:139`), non réduit par les surcharges locales de `.home-actions .btn`.

**Focus à l'ouverture et à la fermeture.** À l'ouverture de `/`, le focus est déplacé sur le `<h1>` par `announceRoute`, pas sur le premier bouton — une personne au clavier tabule donc une fois de plus qu'attendu pour atteindre « Log in ». Aucune fermeture propre à cet écran (pas de modale, pas de tiroir) : quitter se fait par navigation complète, qui remonte le focus au sommet du nouveau document via le même mécanisme.

---

## Localization Considerations

**Langue.** L'interface de cet écran est entièrement en anglais (« Log in », « Create account », l'accroche, le texte de pied de page), conformément au reste de la SPA ; cette documentation reste en français, comme le reste de `design/ux/` — pas de mélange à l'écran lui-même, seulement entre le produit et sa documentation.

**Longueurs.** L'accroche (« Pong in 3D. Play the demo right now — no account needed. », ≈ 59 caractères) tient sur une ligne dans `.home-tagline` (`flex: 1; min-width: 12rem`) à 1440 px, et passe en pleine largeur sur une ligne dédiée sous 768 px (`order: 3; flex-basis: 100%`). À +40 % (≈ 83 caractères), elle continue de tenir dans les deux cas — aucune rupture attendue. Le texte de pied de page (« Online matches, tournaments, friends and chat come with an account. », ≈ 70 caractères) est centré sans contrainte de largeur, même constat. Les libellés de bouton (« Log in », « Create account ») n'ont ni `white-space: nowrap` ni troncature : un libellé plus long agrandirait simplement le bouton, sans casse identifiée. Le titre « ft_transcendence » est un nom de marque, non traduit.

---

## Acceptance Criteria

1. Une personne non connectée qui ouvre `/` voit le bandeau complet (logo, titre, accroche, « Log in », « Create account ») et le cadre de la zone de démo peints en moins de 200 ms après le premier rendu du DOM — réveil de l'API exclu et sans objet ici, puisque `home.js` n'appelle aucune route `/api/…` à l'ouverture (`frontend/src/views/home.js:17-52`).
2. À 1440 × 900 et à 390 × 844, les trois zones (bandeau, démo, pied de page) restent visibles sans défilement horizontal et sans chevauchement (`frontend/src/css/home.css`).
3. Aucun élément interactif n'est visible avant d'être actionnable : « Log in » et « Create account » sont peints et déjà pourvus de leur gestionnaire de clic dans le même appel de fonction (`frontend/src/views/home.js:17-61`) ; à l'intérieur de l'iframe, aucun contrôle simulé n'apparaît tant que le document `game.html` n'a pas fini de charger.
4. Une personne connectée qui ouvre `/` ne voit jamais cet écran : elle est redirigée vers `/dashboard` avant tout rendu (`frontend/src/app.js:57-59`).
5. Le menu de la démo n'offre jamais « Multiplayer » à une personne sans compte : `#multi-button` est masqué et la note invité affichée avant le premier affichage du menu, dans le passage synchrone qui détecte l'invité (`frontend/src/game/main.mjs:27-32`).
6. Si le service temps réel est injoignable au chargement de l'iframe, `#notReady` affiche « Cannot reach the game server. Try reloading the page. » en coin haut-droit, annoncé poliment (`role="status"`, `aria-live="polite"`), sans que le bouton START ne disparaisse (`frontend/src/game/main.mjs:238-244`).
7. Quitter la démo via « Log in » ou « Create account » ne demande aucune confirmation, y compris pendant une partie en cours : la navigation est immédiate (`frontend/src/app.js:104-113`).

---

## Open Questions

- **`design/accessibility-requirements.md:57` affirme que l'annonce du titre au changement de route est « absent — écart connu », mais le code le fait, autrement.** `announceRoute` déplace le focus sur le `<h1>` et change `document.title` (`frontend/src/app.js:18-24`, appelé par `frontend/src/views/home.js:63`) — ce n'est pas une région `aria-live`, et le texte annoncé est « ft_transcendence » (le `h1`), pas le titre de route « Play ». À trancher : soit le tableau reconnaît ce mécanisme comme suffisant, soit il reste jugé insuffisant pour une raison à documenter. Ne m'appartient pas.

- **Le focus à l'ouverture de `/` se pose sur le `<h1>`, pas sur le premier bouton.** Conséquence directe du point précédent : une personne au clavier tabule une fois de plus qu'elle ne le ferait si le focus restait sur `<body>` ou se posait directement sur « Log in ». Comportement voulu par cohérence avec les autres vues, ou frein à corriger ici spécifiquement ? Décision produit.

- **Le bouton START reste actionnable après un échec de connexion au service temps réel, sans que rien n'indique que cliquer ne mènera nulle part.** `connect_error` (`frontend/src/game/main.mjs:238-244`) affiche `#notReady` mais ne désactive ni ne masque `#start-game-button`. Cliquer lance quand même le chargement du GLB (asset statique, indépendant du socket) et fait apparaître le menu au bout de 4000 ms fixes (`frontend/src/game/animation.mjs:11-21`) : « Solo » reste cliquable, émet un événement socket qui ne partira jamais tant que le service reste injoignable, sans nouvel avertissement après le premier — état visible mais inerte. Corriger demande de toucher `game/main.mjs`, partagé avec le tableau de bord ; hors décision UX seule.

- **Le menu de démo peut devenir interactif avant que la scène 3D ait fini de charger, sur une connexion lente.** `showPanel("menu")` se déclenche sur un minuteur fixe de 4000 ms (`frontend/src/game/animation.mjs:11-21`), indépendant de `loadModel()` qui charge le GLB de ~8,7 Mo (`frontend/src/game/main.mjs:225-233`). Rien n'empêche fonctionnellement de lancer une partie avant la fin du chargement de l'île, mais l'incohérence visuelle (raquettes sans île dessous) n'est tranchée nulle part : faut-il que le menu attende la fin du chargement, ou est-ce acceptable ?

- **`#demo-game` reste sans contenu visible tant que le document `game.html` n'a pas fini de peindre**, ce qui touche au principe produit n° 1 (« rien ne doit retarder l'affichage de la scène ») au sens strict : le bandeau et le pied de page de `/` peignent en un seul geste synchrone (`frontend/src/views/home.js:17-52`), mais la zone qui porte la démo dépend d'une requête HTTP séparée pour `game.html` et ses bundles. Le délai réel est faible (hébergement statique, pas l'API Django qui dort — `docs/HANDOFF.md:234-241`), mais il existe et n'est mesuré par aucun script de `make check`. À chiffrer si une preuve de performance est requise pour ce principe.
