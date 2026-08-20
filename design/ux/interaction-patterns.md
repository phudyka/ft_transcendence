# Interaction Pattern Library

> **Status**: In Design **Author**: phudyka + ux-designer **Last Updated**:
> 2026-08-20 **Platform Target**: Web — ordinateur (clavier + souris) d'abord,
> téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **Template**: Interaction Pattern Library

---

## Overview

`docs/DESIGN.md` dit à quoi ressemble ft_transcendence — couleur, typographie,
forme, élévation. Ce document dit comment ça se comporte : ce qui se passe quand
on survole, on active, on tabule, on ferme, on attend. Les deux documents
décrivent le même système sous deux angles différents et ne se recopient pas
l'un l'autre — une spec d'écran qui a besoin d'un bouton renvoie ici pour son
comportement et vers `docs/DESIGN.md` pour son habillage, elle ne redéfinit ni
l'un ni l'autre.

**Règle de non-duplication.** Une spec d'écran (`design/ux/*.md` autre que ce
fichier) référence un motif par son nom et son ancre (`#bouton`, `#toast`,
`#invitation-entrante`…) ; elle ne réécrit jamais ses états, son clavier ou son
accessibilité. Si un écran a besoin d'un comportement que ce catalogue ne couvre
pas, c'est ce catalogue qu'on complète, pas la spec de l'écran qui invente une
variante locale — sans quoi deux écrans finissent par dire deux choses
différentes du même bouton, ce que la section « Gaps » ci- dessous documente
déjà en train d'arriver.

Chaque motif ici porte son statut réel dans le code livré : `Implémenté`
(présent et conforme à ce que ce document exige), `Partiel` (présent mais
incomplet — l'écart est nommé), ou `Absent` (jamais construit — la contrainte à
respecter le jour où il apparaît est donnée, pas une spécification fantôme). Ce
n'est pas une liste de souhaits : c'est l'inventaire de `frontend/src/`, daté du
20 août 2026, et il vieillira comme `docs/DESIGN.md` vieillit — à la relecture,
pas à l'exécution d'un script.

---

## Pattern Catalog

| Motif                                                       | Description                                                     | Implémenté dans                                                        | Statut     |
| ----------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| [Bouton](#bouton)                                           | Primaire, secondaire, contour, menu de jeu, icône               | `tokens.css` `.btn*`, `game.css` `.menu-button`                        | Implémenté |
| [Bascule / Toggle](#bascule--toggle)                        | Bouton à deux états, annoncé par `aria-pressed`                 | `dashboard.css` `.focus-toggle`                                        | Partiel    |
| [Curseur / Slider](#curseur--slider)                        | Réglage continu par glissement                                  | —                                                                      | Absent     |
| [Menu déroulant](#menu-déroulant)                           | Menu ancré à un déclencheur, piloté par `hidden`                | `dashboard.js` / `dashboard.css` `.dropdown-menu`                      | Implémenté |
| [Liste](#liste)                                             | Rangées focalisables, une par entité                            | `dashboard.css` `.list-group-item`, `.friend-row`                      | Implémenté |
| [Grille](#grille)                                           | Disposition en lignes et colonnes d'éléments égaux              | —                                                                      | Absent     |
| [Modale](#modale)                                           | Panneau bloquant qui capture le focus et le rend à sa fermeture | —                                                                      | Absent     |
| [Boîte de dialogue](#boîte-de-dialogue)                     | Confirmation d'une action destructrice                          | —                                                                      | Absent     |
| [Toast](#toast)                                             | Notification transitoire, non bloquante                         | `utils/feedback.js`, `tokens.css` `.toast-body-*`                      | Implémenté |
| [Infobulle](#infobulle)                                     | Information contextuelle au survol/focus                        | —                                                                      | Absent     |
| [Barre de progression](#barre-de-progression)               | Mesure numérique d'une attente                                  | `game.html` `#loading`, `game.css` `#loading-bar`                      | Implémenté |
| [Champ de saisie](#champ-de-saisie)                         | Texte, mot de passe, email, fichier                             | `tokens.css` `.field-input`                                            | Implémenté |
| [Barre d'onglets](#barre-donglets)                          | Sélection exclusive parmi des panneaux                          | `dashboard.js` / `dashboard.css` `.friends-tabs`                       | Implémenté |
| [Défilement](#défilement)                                   | Contenu qui dépasse son conteneur                               | `dashboard.css` `.tab-content`, `.chat-log`, `register.css` `.avatars` | Implémenté |
| [Bandeau de score](#bandeau-de-score)                       | Le score en cours, ancré en bas de l'île                        | `game.css` `.score-container`                                          | Implémenté |
| [Bouton START](#bouton-start)                               | Lancement du jeu depuis la page vide                            | `game.css` `#start-game-button`                                        | Implémenté |
| [Zones tactiles](#zones-tactiles)                           | Commandes de raquette sur pointeur grossier                     | `game.css` `#touch-controls`                                           | Implémenté |
| [Anneau de ratio](#anneau-de-ratio)                         | Donut victoires/défaites du profil                              | `profile.css` `.ratio-donut`                                           | Implémenté |
| [Rangée d'avatars](#rangée-davatars)                        | Sélection d'avatar à l'inscription                              | `register.css` `.avatars`                                              | Implémenté |
| [Panneau latéral de chat](#panneau-latéral-de-chat)         | Conversation privée en tiroir                                   | `dashboard.js` `#chatbox` (Offcanvas Bootstrap)                        | Implémenté |
| [Menu contextuel d'ami](#menu-contextuel-dami)              | Actions sur un ami depuis sa ligne                              | `dashboard.js` `#friendDropdown`, `#friendDropdown_chat`               | Implémenté |
| [Carte de tournoi](#carte-de-tournoi)                       | Entrée pour rejoindre un tournoi en attente                     | `game.css` `.tournament-item`                                          | Partiel    |
| [Écran d'attente d'adversaire](#écran-dattente-dadversaire) | Salle d'attente avant un match en ligne                         | `game.html` `#waiting`                                                 | Implémenté |
| [Invitation entrante](#invitation-entrante)                 | Défi reçu d'un ami, à accepter ou refuser                       | `game.html` `#invite`                                                  | Implémenté |

---

## Patterns

### Bouton

**When to Use.** Toute action déclenchée immédiatement au clic ou à l'activation
clavier : soumission de formulaire, navigation, changement de mode de jeu, envoi
d'un message. Cinq variantes existent, chacune avec un rôle fixe : primaire
(action principale d'un formulaire), secondaire (action qui ne demande rien —
annuler, revenir), contour (action alternative de poids égal), menu de jeu
(navigation dans les panneaux du jeu), icône (une seule action, un seul glyphe —
envoyer, démasquer, accepter, refuser).

**When NOT to Use.** Pas pour une navigation qui change l'URL sans action
associée (c'est un lien, `data-link`) ; pas pour un état à deux positions qui
persiste (c'est une [Bascule](#bascule--toggle)) ; pas pour une action qui
détruit des données sans confirmation (voir
[Boîte de dialogue](#boîte-de-dialogue), Absent — la contrainte s'applique quand
même).

**States**

| State                 | Trigger                                                              | Visual change                                                                            | Jeton concerné                                                     |
| --------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Default               | repos                                                                | aplat de couleur, texte `--on-accent` (ou `--paper`/`--lava-orange` selon variante)      | `--lava-orange`, `--field-slate`, `--menu-blue`                    |
| Hover                 | pointeur fin au-dessus                                               | assombrissement de l'aplat + agrandissement à 1,05 (`--ease-color`, `--ease-transform`)  | `--lava-orange-deep`, `--menu-blue-deep`, `--sunset-orange-bright` |
| Focus-visible         | `Tab` ou navigation clavier                                          | anneau d'or 3 px, décalé de 2 px, jamais redéfini localement                             | `--sun-gold` (anneau global, `tokens.css:83-87`)                   |
| Active                | `mousedown`/`Enter` maintenu                                         | tassement à 0,95 (bouton START uniquement — les autres n'ont pas d'état actif dédié)     | — (`game.css:79-82`)                                               |
| Disabled              | `disabled` posé par JS (ex. « Start a Game » pour un ami hors ligne) | opacité 0,65, curseur `not-allowed`, pas de transformation au survol                     | `tokens.css:371-374`                                               |
| Loading (`aria-busy`) | soumission en cours (login, register, settings, add-friend)          | opacité 0,65, curseur `progress`, libellé remplacé (« Signing in… (waking the server) ») | `tokens.css:365-369`, `utils/feedback.js:64-75`                    |

**Accessibility.** Rôle natif `button` (ou `submit`) — aucun `<div>` cliquable
dans le projet. Nom accessible : le texte visible, ou `aria-label` quand le
bouton ne porte qu'une icône (`aria-label="Send message"`,
`aria-label="Show password"`). Clavier : `Enter` et `Espace` l'activent
nativement, rien à coder. Cible ≥ 44 px via `min-height: var(--tap-min)` sur
`.btn` ; les boutons hors `.btn` (icône d'envoi, accepter/refuser) montent à 44
px sous `(pointer: coarse)` (`dashboard.css:567-574`). Contraste : `--on-accent`
(nuit, #121212) sur les aplats clairs du système tient 8,03:1
(`tokens.css:50-52`) — c'est pourquoi aucun bouton n'écrit `--chalk` sur un
aplat orange, or ou bleu menu.

**Implementation.** `frontend/src/css/tokens.css:133-173` (`.btn`,
`.btn-primary`, `.btn-secondary`, `.btn-outline-light`),
`frontend/src/css/game.css:342-365` (`.menu-button`), `:200-236` (`.unmask`,
bouton icône dans le champ mot de passe),
`frontend/src/css/dashboard.css:196-218` (`#send-button`).

---

### Bascule / Toggle

**When to Use.** Un état binaire qui persiste après l'action et que la personne
peut inverser au même endroit — ici, un seul cas réel : « Focus the game », qui
masque les colonnes amis/chat pour donner toute la largeur au jeu.

**When NOT to Use.** Pas pour un choix parmi un groupe de radios (la
[Rangée d'avatars](#rangée-davatars) reste des `<input type="radio">` natifs) ;
pas pour une action ponctuelle (c'est un [Bouton](#bouton)).

**States**

| State         | Trigger                          | Visual change                                                              | Jeton concerné                   |
| ------------- | -------------------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| Off (défaut)  | repos, `aria-pressed="false"`    | contour orange, fond transparent, texte orange, libellé « Focus the game » | `--sunset-orange`                |
| Hover / On    | survol, ou `aria-pressed="true"` | aplat orange plein, texte `--on-accent`                                    | `--sunset-orange`, `--on-accent` |
| Focus-visible | `Tab`                            | anneau d'or global                                                         | `--sun-gold`                     |

**Accessibility.** Rôle natif `button` avec `aria-pressed`, pas de rôle ARIA
`switch` — le libellé change avec l'état (« Focus the game » ↔ « Show friends
and chat »), ce qui porte l'information sans dépendre de `aria-pressed` seul
pour un lecteur d'écran qui ne l'annoncerait pas. Clavier : `Enter`/`Espace`.
Cible : 44 px (`min-height: var(--tap-min)`, `dashboard.css:643-654`). C'est un
motif à un seul exemplaire dans tout le projet : la classe `.focus-toggle` n'est
pas un composant partagé dans `tokens.css`, elle est locale à `dashboard.css` —
d'où le statut Partiel, à généraliser si un deuxième réglage binaire apparaît.

**Implementation.** `frontend/src/css/dashboard.css:643-660` (`.focus-toggle`),
`frontend/src/views/dashboard.js:775-783` (`toggleGameFocus`).

---

### Curseur / Slider

Absent. Aucun `<input type="range">` ni curseur personnalisé dans le projet —
pas de volume, pas de réglage de difficulté, pas de filtre à plage continue. Le
jour où un réglage continu apparaît (volume du jeu, par exemple), il doit :
utiliser `<input type="range">` natif plutôt qu'un widget maison (affordances
clavier — flèches, `Home`/`End` — et lecteur d'écran gratuites), porter l'anneau
de focus global sans le redéfinir, et exposer sa valeur en texte à côté du
curseur — un curseur sans lecture numérique échoue au socle « pas d'information
par la position seule ».

---

### Menu déroulant

**When to Use.** Un ensemble d'actions rattachées à un déclencheur unique et
masquées jusqu'à l'activation — le menu de compte (avatar → Mon profil,
Paramètres, Déconnexion). C'est le même mécanisme sous-jacent que le
[Menu contextuel d'ami](#menu-contextuel-dami) ; documenté séparément parce que
le second porte des données par ligne (quel ami) alors que celui-ci est fixe.

**When NOT to Use.** Pas pour un choix de valeur dans un formulaire — aucun
`<select>` natif n'existe dans le projet ; le jour où un choix fermé apparaît
dans un formulaire, `<select>` natif prime sur un dropdown maison (clavier et
lecteur d'écran gratuits, cf. l'échelle de l'agent).

**States**

| State                 | Trigger                                          | Visual change                                                                                                                                             | Jeton concerné                              |
| --------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Fermé (défaut)        | repos                                            | `hidden`, `aria-expanded="false"` sur le déclencheur                                                                                                      | —                                           |
| Ouvert                | clic/`Enter` sur le déclencheur                  | `hidden` retiré, position calculée (`fixed`, ancrée sous le déclencheur, recalée si elle déborderait l'écran), premier item non désactivé reçoit le focus | `--night-raised`, bordure `--sunset-orange` |
| Item survolé/focalisé | survol ou `ArrowUp`/`ArrowDown`                  | fond orange à 20 %, texte orange                                                                                                                          | `--sunset-orange`                           |
| Fermeture             | `Escape`, clic hors du menu, ou action d'un item | `hidden` reposé, focus rendu au déclencheur, `aria-expanded="false"`                                                                                      | —                                           |

**Question du timing.** Le menu est peint et interactif dans le même geste —
`showDropdownAt` retire `hidden` et pose le focus dans le même appel
(`dashboard.js:495-514`), rien n'est « visible mais inerte ».

**Accessibility.** Conteneur `role="menu"`, items `role="menuitem"`, déclencheur
`aria-haspopup="menu"` + `aria-expanded`. Clavier : `ArrowDown`/ `ArrowUp` cycle
dans les items (boucle aux extrémités), `Escape` referme et rend le focus au
déclencheur (`dashboard.js:530-547`). Cible : items à 44 px sous
`(pointer: coarse)`. **Écart connu** : `Tab` n'est pas intercepté par
`handleDropdownKeydown` — tabuler hors du dernier item laisse le menu ouvert à
l'écran pendant que le focus est ailleurs. Voir « Gaps ».

**Implementation.** `frontend/src/views/dashboard.js:262-277` (markup
`#profileDropdown`), `:495-547` (`showDropdownAt`, `handleDropdownKeydown`,
`hideDropdowns`), `frontend/src/css/dashboard.css:307-325` (`.dropdown-menu`).

---

### Liste

**When to Use.** Une collection d'entités du même type, chacune avec ses propres
actions — amis (en ligne / en attente / bloqués), historique de matchs, messages
de chat, tournois disponibles. Le motif canonique est la ligne-bouton : toute la
rangée est un `<button>` transparent qui hérite de la police du texte, pas un
`<div>` avec un gestionnaire de clic posé dessus.

**When NOT to Use.** Pas pour un flux de messages en lecture seule qui s'ajoute
par lui-même sans action par ligne — le journal de chat (`role="log"`) est une
variante non interactive du même motif visuel, pas une Liste au sens de ce
catalogue.

**States**

| State              | Trigger                                         | Visual change                                                                            | Jeton concerné                                               |
| ------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Default            | repos                                           | fond fumée à 0,7 (`panel-smoke-soft`), bordure transparente 1 px (la place est réservée) | `--panel-smoke-soft`                                         |
| Hover              | pointeur au-dessus                              | fond relevé, translation -2 px, bordure orange pleine                                    | `--panel-smoke-hover`, `--sunset-orange`, `--ease-transform` |
| Focus-visible      | `Tab`                                           | anneau d'or global                                                                       | `--sun-gold`                                                 |
| Variante « gagné » | issue victorieuse (historique)                  | liséré `color-mix` vert à 45 %                                                           | `--reef-green-win`                                           |
| Variante « perdu » | issue perdue (historique)                       | liséré `color-mix` rouge à 45 %                                                          | `--coral-red-loss`                                           |
| Empty              | la collection est vide (aucun ami, aucun match) | ligne de texte centrée, `--muted-sand`, pas d'icône                                      | `tokens.css:343-354` `.empty-state`                          |
| Error              | la requête qui remplit la liste a échoué        | ligne de texte centrée, `--coral-red-text` (contraste relevé à 4,49:1 sur fumée)         | `tokens.css:356-360` `.error-state`                          |

**Accessibility.** Chaque ligne est un vrai bouton (rôle natif), le texte du
verdict (« Win »/« Loss ») porte l'issue en mot, la bordure colorée n'est qu'un
renfort — socle « pas d'information par la couleur seule » tenu. Cible 44 px
sous pointeur grossier (`dashboard.css:567-583`).

**Implementation.** `frontend/src/css/dashboard.css:76-123` (`.list-group-item`,
`.friend-row`), `frontend/src/css/profile.css:217-256` (variantes win/loss de
l'historique), `frontend/src/css/tokens.css:343-360` (états vide et d'erreur).

---

### Grille

Absent. Aucune disposition en grille de cartes égales (CSS `grid` ou équivalent)
: la rangée d'avatars est un défilement horizontal à une seule ligne, la liste
d'amis est verticale. Le jour où une grille apparaît (sélecteur de mode de jeu
en vignettes, par exemple), la contrainte est : un ordre de tabulation qui suit
l'ordre visuel ligne par ligne, et des flèches directionnelles
(`ArrowRight`/`ArrowLeft`/`ArrowUp`/`ArrowDown`) qui suivent la grille plutôt
que l'ordre du DOM si la grille n'est pas un simple flux — le motif du même
problème est déjà résolu pour la [Barre d'onglets](#barre-donglets) (`ARROWS`
dans `dashboard.js:1395`) et peut s'y référer.

---

### Modale

Absent. Aucun panneau ne capture le focus avec retour garanti à la fermeture et
fond assourdi — recherché explicitement dans le code (`modal`, `dialog`), aucune
occurrence. Les panneaux qui s'en approchent le plus (menus du jeu, détails de
tournoi) sont positionnés en superposition mais ne piègent pas le focus et ne
bloquent pas l'interaction derrière eux : ce sont des panneaux flottants, pas
des modales. Le [Panneau latéral de chat](#panneau-latéral-de-chat) utilise
l'Offcanvas de Bootstrap, qui a son propre comportement de focus — documenté à
part parce qu'il ne vient pas du code du projet. Le jour où une vraie modale
apparaît : focus posé sur le premier élément focalisable à l'ouverture,
`Tab`/`Shift+Tab` piégés à l'intérieur, `Escape` ferme, focus rendu au
déclencheur — exactement le contrat déjà tenu par le
[Menu déroulant](#menu-déroulant) à l'échelle d'un panneau plutôt que d'un menu.

---

### Boîte de dialogue

Absent. Aucune confirmation avant une action destructrice : « Logout », « Block
User » et « Quit Tournament » s'exécutent au premier clic
(`dashboard.js:969-988` pour `blockUser`, `:1376-1389` pour `handleLogout`,
`socketEvent.mjs` pour `quit-tournament`), sans `window.confirm` ni panneau de
confirmation, seulement un toast après coup. C'est une lacune de protection
contre l'erreur, pas seulement d'UX : bloquer un ami ou quitter un tournoi n'a
pas de « annuler ». Le jour où une confirmation est ajoutée, elle doit suivre le
contrat de [Modale](#modale) (focus piégé, `Escape` annule), jamais
`window.confirm` — non stylable, hors système visuel, et bloquant pour le fil
d'exécution du reste de la page.

---

### Toast

**When to Use.** Confirmation ou échec d'une action qui ne change pas d'écran et
n'a pas de champ associé à côté duquel poser l'erreur — invitation envoyée, ami
ajouté, paramètres enregistrés, connexion perdue.

**When NOT to Use.** Pas pour une erreur de champ de formulaire (voir
[Champ de saisie](#champ-de-saisie) — un toast disparaît en ~5 s, plus vite que
l'attente de l'API qui a pu provoquer l'erreur) ; **cette règle est violée par
`settings.js`**, voir « Gaps ».

**States**

| State        | Trigger                                                      | Visual change                                                              | Jeton concerné    |
| ------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------- |
| Success      | action réussie (ami ajouté, paramètres enregistrés)          | corps vert, `role="status"`, `aria-live="polite"`                          | `--reef-green`    |
| Error        | action échouée                                               | corps rouge, `role="alert"`, `aria-live="assertive"`                       | `--coral-red`     |
| Warning      | avertissement non bloquant                                   | corps Orange Lave (`--lava-orange`) — pas l'or, qui n'appartient qu'au jeu | `--lava-orange`   |
| Info         | confirmation neutre                                          | corps Orange Couchant (`--sunset-orange`)                                  | `--sunset-orange` |
| Auto-dismiss | 5000 ms par défaut (`bootstrap.Toast`, aucune option passée) | disparition, le conteneur DOM est retiré à `hidden.bs.toast`               | —                 |

**Accessibility.** `role` et `aria-live` dépendent du type — succès/info sont
`polite` (n'interrompent pas), erreur/warning sont `assertive` (interrompent),
exactement la distinction que porte `design/accessibility-requirements.md`. Le
focus ne se déplace jamais vers le toast — il continue d'annoncer sans voler
l'attention de ce que la personne faisait. Bouton de fermeture avec
`aria-label="Close"`.

**Implementation.** `frontend/src/utils/feedback.js:18-60` (`showToast`),
`frontend/src/css/tokens.css:286-324` (classes `.toast-body-*`,
`.toast-header`).

---

### Infobulle

Absent. Recherché explicitement (`title=`, `tooltip`) : les deux seules
occurrences de `title` dans le projet sont des noms accessibles d'`<iframe>`
(`frontend/src/views/dashboard.js:234`, `frontend/src/views/home.js:41`), pas
des infobulles. Rien n'explique un contrôle au survol — les touches du jeu sont
données une fois, en clair, dans un panneau (`.controls-legend`,
`.controls-brief`), pas en infobulle. Le jour où une infobulle apparaît :
visible au survol **et** au focus clavier (pas au survol seul), fermée par
`Escape`, et jamais porteuse d'une information qui n'existe nulle part ailleurs
dans l'interface — une infobulle est un rappel, pas un chemin obligé.

---

### Barre de progression

**When to Use.** Une attente mesurable en pourcentage connu à l'avance — le
chargement de la scène 3D et de l'audio (~8,7 Mo). C'est le seul cas dans le
projet ; l'attente d'adversaire (durée inconnue) utilise un
[écran d'attente](#écran-dattente-dadversaire) avec compteur de secondes, pas
une barre de progression.

**When NOT to Use.** Pas pour une attente de durée inconnue (spinner ou compteur
écoulé à la place) ; pas pour une progression binaire (chargé / pas chargé) — ce
serait un état de [Bouton](#bouton) (`aria-busy`).

**States**

| State         | Trigger                              | Visual change                                               | Jeton concerné               |
| ------------- | ------------------------------------ | ----------------------------------------------------------- | ---------------------------- |
| Default (0 %) | ouverture de la page du jeu          | trait à largeur nulle (`transform: scaleX(0)`)              | `--sun-gold`                 |
| En cours      | progression du chargement des assets | `--loaded` mis à jour, `aria-valuenow` suit en entier       | `--sun-gold`, `--ease-color` |
| Complet       | tous les assets chargés              | panneau masqué (`hidden`), bouton START devient actionnable | —                            |

**Question du timing.** Le trait de la barre (`::before`, `transform:
scaleX`)
et l'`aria-valuenow` sont mis à jour dans le même appel (`main.mjs:221-229`) :
peint et exact au même instant, rien de « visible mais inerte ».

**Accessibility.** `role="progressbar"`, `aria-valuemin="0"`,
`aria-valuemax="100"`, `aria-valuenow` tenu à jour en JS, nom accessible par
`aria-label="Loading the island"`. C'est la seule exception documentée à « la
Règle du Cadre d'Or » : l'or y est un trait de mesure, pas une surface
(`scripts/check-design.mjs` contrôle G, ligne 221-226).

**Implementation.** `frontend/game.html:24-35` (`#loading`, `#loading-bar`),
`frontend/src/game/main.mjs:220-230`, `frontend/src/css/game.css:759-777`.

---

### Champ de saisie

**When to Use.** Toute entrée de texte, mot de passe, email ou fichier —
formulaires de connexion, inscription, paramètres, ajout d'ami, chat général et
privé.

**When NOT to Use.** Pas pour un choix fermé parmi peu d'options (radio natif,
voir [Rangée d'avatars](#rangée-davatars)) ; pas en dessous de 16 px de corps —
la Règle du Plancher de Seize, contrôlée par `scripts/check-design.mjs`
(contrôle D).

**States**

| State                 | Trigger                                       | Visual change                                                                                              | Jeton concerné                                         |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Default               | repos                                         | fond Ardoise, bordure 1 px `--field-border`, texte craie                                                   | `--field-slate`, `--field-border`                      |
| Hover                 | pointeur au-dessus                            | bordure Lave Douce                                                                                         | `--lava-orange-soft`                                   |
| Focus-visible         | `Tab` ou clic                                 | anneau d'or global par-dessus la bordure                                                                   | `--sun-gold`                                           |
| Invalid               | `aria-invalid="true"` posé par JS après échec | **aucun changement visuel dédié** — voir « Gaps », l'attribut est posé sans styliser `[aria-invalid]`      | —                                                      |
| Erreur associée       | soumission refusée                            | `<p class="field-error" role="alert">` affiché juste sous le champ concerné, jamais masqué automatiquement | `--coral-red-text`                                     |
| Password (démasquage) | clic sur l'icône cadenas                      | type bascule `password`/`text`, icône et `aria-pressed` suivent                                            | `--lava-orange` (bouton), `LOCK_ICON`/`LOCK_OPEN_ICON` |

**Accessibility.** Chaque champ a un `<label for>` réel — y compris les champs
visuellement sans libellé (ajout d'ami, chat), qui portent un
`<label class="visually-hidden">`. Erreur : `role="alert"` sur la ligne de
texte, annoncée dès qu'elle apparaît (`aria-live` implicite du rôle `alert`).
Cible du bouton de démasquage : 44 px fixes, posé en `inset-inline-end` pour ne
jamais chevaucher le texte saisi (`padding-inline-end: calc(44px + 5px)`,
`tokens.css:207-209`). **Écart connu** : `aria-invalid` n'est posé de façon
cohérente sur aucun champ précis en cas d'échec — voir « Gaps ».

**Implementation.** `frontend/src/css/tokens.css:177-251` (`.field-input`,
`.password-wrapper`, `.unmask`, `.field-error`, `.field-hints`),
`frontend/src/utils/unmask.js` (bascule), `frontend/src/views/login.js:125-181`
et `frontend/src/views/register.js:155-243` (validation et affichage d'erreur).

---

### Barre d'onglets

**When to Use.** Sélection exclusive parmi un petit nombre de vues persistantes
dans le même espace — les trois listes d'amis (En ligne, En attente, Bloqués).

**When NOT to Use.** Pas pour une navigation entre écrans (c'est une route,
`navigateTo`) ; pas pour plus d'une poignée d'options — au-delà, une liste ou un
menu déroulant scalent mieux.

**States**

| State            | Trigger         | Visual change                                                        | Jeton concerné                   |
| ---------------- | --------------- | -------------------------------------------------------------------- | -------------------------------- |
| Inactif (défaut) | repos           | fumée à 0,7, texte papier                                            | `--panel-smoke-soft`, `--paper`  |
| Hover            | survol          | fond orange à 10 %, texte orange                                     | `--sunset-orange`                |
| Actif            | sélectionné     | aplat orange plein, texte `--on-accent`, trait de 3 px sous l'onglet | `--sunset-orange`, `--on-accent` |
| Focus-visible    | `Tab` ou flèche | anneau d'or global                                                   | `--sun-gold`                     |

**Accessibility.** `role="tablist"` sur le conteneur, `role="tab"` +
`aria-controls` + `aria-selected` sur chaque bouton, `role="tabpanel"` sur
chaque contenu. Clavier : `ArrowRight`/`ArrowLeft` déplacent la sélection d'un
cran, `Home`/`End` sautent aux extrémités (roving `tabindex`, un seul onglet est
dans l'ordre de tabulation à la fois — `dashboard.js:1391-1408`). Hauteur
minimale 32 px, 44 px sous pointeur grossier.

**Implementation.** `frontend/src/views/dashboard.js:112-172` (markup),
`:1391-1430` (`setupTabSystem`), `frontend/src/css/dashboard.css:417-460`
(`.friends-tabs`, `.tab-button`).

---

### Défilement

**When to Use.** Tout contenu dont la longueur dépasse son conteneur — journal
de chat, contenu d'onglet, rangée d'avatars, colonnes latérales sur petit écran.

**When NOT to Use.** Pas comme substitut à la pagination d'une liste qui
grossirait sans limite (aucun cas de ce genre dans le projet aujourd'hui).

**States**

| State                                           | Trigger                     | Visual change                                                                        | Jeton concerné                                          |
| ----------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Défilement vertical (chat, onglets)             | contenu > hauteur           | `overflow-y: auto`, ascenseur fin orange sur fumée                                   | `--sunset-orange` (pouce), `--panel-smoke-soft` (piste) |
| Défilement horizontal avec accrochage (avatars) | 7 avatars > largeur visible | `scroll-snap-type: x mandatory`, chaque avatar s'aligne au centre                    | —                                                       |
| Colonnes latérales, mobile                      | écran < 768 px              | `max-height: 60dvh`, colonne défile plutôt que de pousser le pied de page hors cadre | `--space-*` (repli, pas de jeton dédié)                 |

**Accessibility.** Le défilement au clavier suit le comportement natif du
navigateur sur un conteneur `overflow: auto` (flèches une fois le focus dans le
conteneur ou sur un enfant focalisable) — rien n'est reconstruit en JS. La
rangée d'avatars reste navigable par `Tab` entre les radios même si elle défile
(`register.css:64-108`) : le défilement suit le focus, jamais l'inverse.

**Implementation.** `frontend/src/css/dashboard.css:471-498` (`.tab-content`,
ascenseur), `:160-165` (`.chat-log`), `frontend/src/css/register.css:64-74`
(`.avatars`).

---

### Bandeau de score

**When to Use.** Affichage permanent du score pendant un match — c'est la seule
surface du jeu qui reste à l'écran en continu une fois la partie lancée.

**When NOT to Use.** N'affiche jamais un total agrégé (victoires cumulées, stats
de session) — c'est le rôle du profil et de son
[anneau de ratio](#anneau-de-ratio), pas du bandeau.

**States**

| State        | Trigger                       | Visual change                                                                 | Jeton concerné                         |
| ------------ | ----------------------------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| Masqué       | avant le lancement d'un match | `hidden`, `aria-hidden="true"`                                                | —                                      |
| Affiché      | `start-game` reçu             | dégradé fumé, flou d'arrière-plan 8 px, filet blanc 20 %                      | `--night` (dégradé), filet             |
| Point marqué | `updateScores` reçu           | bascule d'échelle à 1,3 sur 300 ms sur le chiffre concerné (`.pop-animation`) | dur, `game.css:465-479` — non tokenisé |
| —            | —                             | annonce vocale « Orange 3, blue 2 » dans `#score-announce`                    | —                                      |

**Question du timing.** Le texte du chiffre, l'annonce `aria-live` et
l'animation de bascule sont posés dans le même gestionnaire
(`socketEvent.mjs:47-65`) : synchrones, rien en retard.

**Accessibility.** `#score` porte `aria-hidden="true"` — les deux chiffres
visuels ne sont **pas** lus directement par un lecteur d'écran, à dessein :
`#score-announce` (`role="status"`, `aria-live="polite"`, `.visually-hidden`)
porte la phrase complète à chaque but, une seule fois, plutôt que d'annoncer
trois nœuds frères séparément — c'est la correction documentée dans
`frontend/game.html:146-148`. Le nom du camp (Orange/Bleu) porte l'information
de couleur en mot, jamais en couleur seule.

**Implementation.** `frontend/game.html:149-154`,
`frontend/src/css/game.css:377-463`, `frontend/src/game/socketEvent.mjs:47-66`.

---

### Bouton START

**When to Use.** Un seul emploi : le premier geste sur `game.html`, avant
qu'aucune scène 3D ne soit chargée. C'est la seule pièce du système autorisée à
bouger sans sollicitation (pulsation continue) — voir `docs/DESIGN.md`, section
Signature.

**When NOT to Use.** Ne se réutilise jamais ailleurs comme simple bouton « Play
» — les reprises de partie passent par « Play again » (un `.menu-button`
ordinaire) dans le [panneau de fin de partie](#écran-dattente-dadversaire), pas
par une copie de ce composant.

**States**

| State          | Trigger                          | Visual change                                                                                         | Jeton concerné                                   |
| -------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Default        | repos                            | dégradé or→rouge, pulsation rouge 1 s en boucle                                                       | `--sun-gold`, `--flame-red` — dur, non tokenisés |
| Hover          | pointeur au-dessus               | reflet oblique qui balaie la surface, halo agrandi, translation -10 px                                | `color-mix(--sun-gold …)`                        |
| Active         | `mousedown`                      | tassement à 0,95                                                                                      | —                                                |
| Focus-visible  | `Tab`                            | anneau d'or global (aucune redéfinition — c'était le seul `outline: none` du projet avant correction) | `--sun-gold`                                     |
| reduced-motion | `prefers-reduced-motion: reduce` | pulsation arrêtée sur son état de repos ; le clic reste fonctionnel                                   | `tokens.css:94-101`                              |

**Accessibility.** `<button>` natif, texte visible « START » comme nom
accessible. Cible largement > 44 px (`clamp(20px,5vw,40px)` de remplissage).
Contraste : `--on-accent` sur l'extrémité or du dégradé — le blanc y plafonnait
à 1,5:1 avant correction (`game.css:27`).

**Implementation.** `frontend/game.html:22`, `frontend/src/css/game.css:20-95`.

---

### Zones tactiles

**When to Use.** Piloter une raquette sur un appareil sans clavier —
apparaissent uniquement sous `(hover: none) and (pointer: coarse)`, et seulement
du côté réellement contrôlé par la personne (jamais les deux côtés en solo, où
le second est piloté par l'IA ou le second joueur local).

**When NOT to Use.** Ne remplace jamais le clavier sur desktop — la media query
les garde à `display: none` tant que `hover` est disponible, même sur un écran
tactile hybride avec souris branchée.

**States**

| State  | Trigger                                        | Visual change                                              | Jeton concerné     |
| ------ | ---------------------------------------------- | ---------------------------------------------------------- | ------------------ |
| Repos  | affiché, non pressé                            | cercle bleu menu à 55 % d'opacité, filet blanc 2 px à 30 % | `--menu-blue`      |
| Pressé | `pointerdown`/`touchstart` maintenu            | bleu menu profond à 85 %                                   | `--menu-blue-deep` |
| Absent | souris/trackpad disponible, ou côté non piloté | `display: none`                                            | —                  |

**Accessibility.** Chaque bouton porte un `aria-label` directionnel (« Left
paddle up »), une icône SVG `aria-hidden="true"`. `touch-action:
none` empêche
le navigateur d'interpréter l'appui maintenu comme un défilement de page
(`game.css:701-704`). Le conteneur est en `pointer-events: none` pour ne pas
intercepter les gestes destinés à la scène 3D ; seul `.touch-side` visible
repasse en `pointer-events: auto`. Cible : 4,5 rem (72 px), largement au-dessus
du minimum de 44 px.

**Implementation.** `frontend/game.html:164-231`,
`frontend/src/css/game.css:665-710`, `frontend/src/game/controls.mjs:10-15`
(table des touches, partagée avec le clavier).

---

### Anneau de ratio

**When to Use.** Résumer visuellement le ratio victoires/défaites sur la page de
profil — un seul emploi, jamais réutilisé ailleurs.

**When NOT to Use.** Pas pour une répartition à plus de deux catégories (le
masque radial et le `conic-gradient` à deux teintes ne scalent pas au-delà) ; un
futur besoin à trois parts ou plus doit repartir d'un composant, pas étendre
celui-ci.

**States**

| State           | Trigger                | Visual change                                                                                                                   | Jeton concerné                         |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Avec historique | au moins un match joué | `conic-gradient` percé, part verte jusqu'à `--win-share`, rouge ensuite                                                         | `--reef-green-win`, `--coral-red-loss` |
| Empty           | aucun match joué       | le donut cède la place à une ligne de texte `--muted-sand` (« No games played yet », à confirmer par la spec de l'écran Profil) | `--muted-sand`                         |

**Accessibility.** Le donut est un pur arrière-plan CSS (`conic-gradient` +
masque radial), sans rôle graphique — la légende porte l'information en texte :
deux pastilles carrées de 12 px accompagnées du mot (« Wins »/ « Losses »),
jamais la couleur seule. Aucun `<canvas>`, donc rien à décrire en `alt` ; le
nombre de victoires/défaites doit être lisible en texte à côté (propriété de la
spec d'écran Profil, pas de ce catalogue).

**Implementation.** `frontend/src/css/profile.css:150-213`.

---

### Rangée d'avatars

**When to Use.** Sélection d'un avatar de départ à l'inscription — sept options
fixes, une seule sélectionnée à la fois.

**When NOT to Use.** Ne se réutilise pas pour changer d'avatar depuis les
Paramètres, qui utilisent un champ de fichier (`input[type=file]`) — deux
mécanismes différents pour deux moments différents (choisir vs remplacer).

**States**

| State                    | Trigger                                                       | Visual change                                                   | Jeton concerné                                                                             |
| ------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Non sélectionné (défaut) | repos                                                         | opacité 0,45                                                    | —                                                                                          |
| Sélectionné              | `input:checked`                                               | opacité pleine, agrandissement à 1,12, halo de sélection orange | `--lava-orange` (`box-shadow: 0 0 0 3px var(--lava-orange), 0 0 18px rgba(255,87,34,0.7)`) |
| Focus-visible            | `Tab` (le radio est masqué, c'est l'image qui porte l'anneau) | anneau d'or posé sur l'image via `input:focus-visible + img`    | `--sun-gold`                                                                               |
| reduced-motion           | `prefers-reduced-motion: reduce`                              | transition désactivée, le changement reste instantané           | `register.css:110-114`                                                                     |

**Accessibility.** Sept `<input type="radio">` natifs dans un `<fieldset>` avec
`<legend>« Choose your Avatar »` — sélection, navigation clavier (flèches entre
radios d'un même groupe, comportement natif du navigateur) et annonce lecteur
d'écran (« Avatar 4 sur 7, sélectionné ») sont gratuites. Chaque image porte un
`alt="Avatar {n}"`. Remplace un ancien carrousel JavaScript sans focus clavier
ni annonce d'état (`register.css:1-6`).

**Implementation.** `frontend/src/views/register.js:104-124` (markup),
`frontend/src/css/register.css:64-114`.

---

### Panneau latéral de chat

**When to Use.** Conversation privée avec un ami, ouverte depuis le
[menu contextuel d'ami](#menu-contextuel-dami) (« Send Private Message »). Un
seul panneau à la fois — changer d'ami redessine le contenu plutôt que d'empiler
des tiroirs.

**When NOT to Use.** Le chat général reste dans la colonne fixe
(`.chat-container`), jamais dans ce tiroir — les deux sont deux surfaces
différentes avec des `id` différents (`#message-input` vs
`#message-input-{friendName}`).

**States**

| State          | Trigger                                                                                    | Visual change                                                | Jeton concerné   |
| -------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ---------------- |
| Fermé (défaut) | repos                                                                                      | hors écran (translation Bootstrap standard)                  | —                |
| Ouvert         | « Send Private Message » ou clic sur un onglet du tiroir                                   | glisse depuis la droite, contenu redessiné pour l'ami choisi | `--night-raised` |
| Fermeture      | bouton de fermeture, ou comportement par défaut de Bootstrap (`Escape`, clic hors panneau) | glisse hors écran                                            | —                |

**Accessibility.** `aria-labelledby="chatboxLabel"` sur le conteneur, en-tête
porte le nom de l'ami en titre. Journal de messages en `role="log"`,
`aria-live="polite"`, `aria-relevant="additions"` — chaque message ajouté est
annoncé sans déplacer le focus. Bouton de fermeture `aria-label="Close"`. **Ce
panneau est le composant Offcanvas de Bootstrap 5, non ré-implémenté** : la
capture de focus à l'ouverture et son retour à la fermeture suivent le
comportement documenté de Bootstrap plutôt que du code du projet — non vérifié
par `scripts/check-design.mjs`, qui ne lit que du CSS et du HTML/JS maison.

**Implementation.** `frontend/src/views/dashboard.js:278-297` (markup),
`:577-650` (`showChatbox`, `setupPrivateChat`, `displayPrivateMessage`),
`frontend/src/css/dashboard.css:255-301` (`#chatbox`).

---

### Menu contextuel d'ami

**When to Use.** Actions rattachées à un ami précis, depuis sa ligne dans la
liste — envoyer un message privé, démarrer une partie, voir le profil (liste «
En ligne »), ou ajouter en ami / bloquer (chat général et privé). Deux menus
séparés (`#friendDropdown`, `#friendDropdown_chat`) partagent exactement le même
mécanisme d'ouverture/fermeture que le [Menu déroulant](#menu-déroulant)
générique.

**When NOT to Use.** Pas pour les actions sur le compte propre (« My Profile »,
« Settings », « Logout ») — celles-là vivent dans `#profileDropdown`, un menu
déroulant sans donnée par ligne.

**States**

| State                  | Trigger                               | Visual change                                                                                       | Jeton concerné                                            |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Ouvert, ami en ligne   | clic sur la ligne d'un ami en ligne   | « Start a Game » actif, texte « Start a Game »                                                      | —                                                         |
| Ouvert, ami hors ligne | clic sur la ligne d'un ami hors ligne | « Start a Game » désactivé (`disabled`, `aria-disabled="true"`), libellé « Start a Game (offline) » | `tokens.css:371-374` (état désactivé partagé avec Bouton) |

**Accessibility.** Identique au [Menu déroulant](#menu-déroulant) générique :
`role="menu"`/`role="menuitem"`, `Escape` referme et rend le focus,
`ArrowUp`/`ArrowDown` cycle. Le nom de l'ami associé au menu ouvert est porté
par `dropdown.dataset.friend`, jamais recalculé depuis le texte affiché — la
donnée et l'affichage restent synchronisés même si le libellé change (ami qui
passe hors ligne pendant que le menu est ouvert, par exemple).

**Implementation.** `frontend/src/views/dashboard.js:175-229` (markup des deux
menus), `:549-564` (`handleFriendClick`), `:721-745` (`startGame`, envoi
d'invitation par `postMessage` vers l'iframe du jeu).

---

### Carte de tournoi

**When to Use.** Représenter un tournoi en attente de joueurs dans la liste
`#tournament-list`, avec une action unique : le rejoindre.

**When NOT to Use.** Ne porte pas l'état d'avancement d'un tournoi rejoint —
c'est le rôle du panneau `#tournament-details` (l'arbre, avec les noms aux
bonnes branches), une surface différente ouverte une fois le tournoi commencé.

**States**

| State       | Trigger                                  | Visual change                                                     | Jeton concerné            |
| ----------- | ---------------------------------------- | ----------------------------------------------------------------- | ------------------------- |
| Disponible  | `tournament-list` reçoit un nom de salle | bouton pleine largeur, bordure filet blanc 30 %, fond transparent | filet, `game.css:268-276` |
| Hover/focus | survol ou `Tab`                          | fond `color-mix(--chalk 18%)` ; focus : anneau d'or global        | `--chalk`, `--sun-gold`   |
| Empty       | aucun tournoi ouvert                     | ligne `.tournament-empty`, `--muted-sand`, invite à en créer un   | `--muted-sand`            |

**Accessibility.** Chaque carte est un `<button>` dans un `<li>`, texte = nom de
la salle = nom accessible. Cible ≥ 44 px (`min-height:
var(--tap-min)`).

**Statut Partiel — pourquoi.** La charge utile de l'événement `tournament-list`
(`socketEvent.mjs:200-223`) ne porte que le nom de la salle : aucune information
de nombre de joueurs déjà inscrits ni d'état « prêt à démarrer ». La carte ne
peut donc afficher qu'un nom, jamais une progression — une personne qui rejoint
un tournoi presque complet et un tournoi qui vient d'être créé voient exactement
la même carte. Ce n'est pas un défaut d'accessibilité (rien n'est caché derrière
la couleur puisqu'il n'y a rien à montrer), c'est un manque d'information à la
source, hors du périmètre de ce catalogue — à signaler côté `game-designer`.

**Implementation.** `frontend/game.html:67-73` (`#tournament-list`),
`frontend/src/game/socketEvent.mjs:200-224` (rendu),
`frontend/src/css/game.css:261-282` (`.tournament-item`, `.tournament-empty`).

---

### Écran d'attente d'adversaire

**When to Use.** Après avoir choisi un mode en ligne (2 ou 4 joueurs), le temps
que le serveur trouve d'autres joueurs.

**When NOT to Use.** Pas pour l'attente du réveil de l'API au premier login —
celle-là se lit sur l'état `aria-busy` du [Bouton](#bouton) de soumission, pas
sur ce panneau, qui est propre au jeu.

**States**

| State           | Trigger                              | Visual change                                                                                                 | Jeton concerné                         |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Attente, < 30 s | entrée dans la file                  | spinner en rotation continue (1 s, `linear infinite`), compteur « Waiting for {n} s »                         | `--deep-sea-blue` (bordure du spinner) |
| Attente, ≥ 30 s | 30 secondes écoulées sans adversaire | le texte du compteur s'étend : « … — nobody else is online right now. Solo against the AI is one menu away. » | `--muted-sand`                         |
| Annulée         | clic sur « Cancel »                  | timer arrêté, `cancel` émis au serveur, retour au panneau `multi`                                             | —                                      |

**Question du timing.** Le compteur est peint et actif dans le même appel
(`startWaitingTimer`, `socketEvent.mjs:121-131`) ; sous
`prefers-reduced-motion: reduce`, le spinner décoratif s'arrête mais **le
compteur continue** — c'est nommément l'exemple que donne `docs/DESIGN.md` (« La
Règle de la Boucle Décorative ») pour distinguer décor et information.

**Accessibility.** `#waiting-elapsed` porte `role="status"` — chaque mise à jour
du compteur est potentiellement annoncée par un lecteur d'écran ; à vérifier en
usage réel que la fréquence (1/s) ne produit pas un flux d'annonces épuisant
plutôt qu'une information utile (non couvert par `scripts/check-design.mjs`, qui
ne mesure pas la fréquence des mises à jour `aria-live`). Bouton « Cancel » :
`.menu-button` standard, 44 px.

**Implementation.** `frontend/game.html:136-144`,
`frontend/src/game/socketEvent.mjs:110-140`, `frontend/src/css/game.css:367-375`
(`#spinner`), `:852-860` (`.waiting-elapsed`).

---

### Invitation entrante

**When to Use.** Un ami vous défie via « Start a Game » depuis le
[menu contextuel d'ami](#menu-contextuel-dami) — l'invitation arrive côté jeu
par `postMessage` puis socket, sous forme d'un panneau flottant qui interrompt.

**When NOT to Use.** Ne se confond pas avec `#notReady` (déclin ou
indisponibilité d'un ami invité par vous) : deux panneaux séparés, à des
positions verticales différentes, pour ne pas se masquer l'un l'autre s'ils
apparaissent l'un après l'autre.

**States**

| State                                                        | Trigger                       | Visual change                                                                                                             | Jeton concerné                                                        |
| ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Masqué (défaut)                                              | pas d'invitation en cours     | `hidden`                                                                                                                  | —                                                                     |
| Reçue                                                        | événement d'invitation socket | panneau ancré en haut à droite, cadre d'or 2 px, deux boutons (Accept vert, Refuse rouge)                                 | `--sun-gold` (cadre), `--reef-green-win`/`--coral-red-loss` (boutons) |
| Refus reçu (`refuse-invit`) / ami indisponible (`not-ready`) | réponse du serveur            | panneau `#notReady` affiché à une position décalée (`top: calc(var(--space-lg) + 6rem)`) pour ne pas chevaucher `#invite` | —                                                                     |

**Accessibility.** `#invite` porte `role="alert"` — une invitation interrompt,
au même titre qu'une erreur, ce qui est justifié : c'est le seul chemin pour
rejoindre la partie d'un ami, une invitation manquée est une opportunité perdue.
`#notReady` porte `role="status"`/`aria-live="polite"` — un déclin n'a pas la
même urgence. Boutons Accept/Refuse : 44 px min via `.invite-button`, texte du
bouton porte le verdict, jamais la couleur seule.

**Implementation.** `frontend/game.html:75-93` (markup `#invite`, `#notReady`),
`frontend/src/game/socketEvent.mjs:150-198` (réception, `flashNotReady`),
`frontend/src/css/game.css:609-663` (`.cl_invite`, `.invite-button`, `.accept`,
`.cancel`).

---

## Animation Standards

| Mouvement                                                                            | Durée                 | Courbe                                   | Jeton                                                                                            | Sous `prefers-reduced-motion: reduce`                                                                                                 |
| ------------------------------------------------------------------------------------ | --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Couleur de fond/bordure (survol, focus, boutons, champs, onglets, listes)            | 300 ms                | ease                                     | `--ease-color`                                                                                   | Conservé — c'est un fondu de couleur, la liste d'exceptions à `transition-property` le garde explicitement (`tokens.css:110-121`)     |
| Transformation au survol (agrandissement 1,05, translations)                         | 200 ms                | ease                                     | `--ease-transform`                                                                               | Neutralisé — `*:hover { transform: none !important; }` (`tokens.css:123-125`)                                                         |
| Bascule du score au point marqué (`.pop-animation`)                                  | 300 ms                | ease-out                                 | Aucun — dur (`game.css:465-479`), valeur identique à `--ease-color` mais pas lue depuis le jeton | Conservé — `.pop-animation` n'est pas dans la liste d'arrêt de `tokens.css:96-99`, l'info du point marqué doit rester visible         |
| Pulsation du bouton START                                                            | 1 s, boucle infinie   | implicite (`ease`, keyframes en paliers) | Aucun — dur (`game.css:21`, `:84-94`)                                                            | Arrêtée — `#start-game-button` listé dans `tokens.css:96`                                                                             |
| Halo de victoire (`winner-glow`)                                                     | 3 s, boucle infinie   | ease-in-out                              | Aucun — dur (`game.css:202`, `:213-230`)                                                         | Arrêtée — `#winner-message` listé, `winner-message.is-win` seulement (la défaite n'a jamais eu ce halo depuis la correction)          |
| Balayage de lumière (`light-sweep`)                                                  | 3 s, boucle infinie   | ease-in-out                              | Aucun — dur (`game.css:245`, `:249-259`)                                                         | Arrêtée — `#winner-message::before { display: none }` (`tokens.css:103-105`)                                                          |
| Respiration du mot SCORE (`glow`)                                                    | 1,5 s, boucle infinie | ease-in-out                              | Aucun — dur (`game.css:437`, `:440-447`)                                                         | Arrêtée — `#scoreTitle` listé (`tokens.css:98`)                                                                                       |
| Spinner d'attente                                                                    | 1 s, boucle infinie   | linear                                   | Aucun — dur (`game.css:374`, `:481-488`)                                                         | Arrêtée — `#spinner` listé (`tokens.css:99`)                                                                                          |
| Apparition du bandeau de score (`score-appear`)                                      | 1 s                   | ease forwards                            | Aucun — dur (`game.css:396`)                                                                     | Sans objet : `@keyframes score-appear` n'existe nulle part dans `game.css` — l'animation déclarée ne s'exécute jamais (voir « Gaps ») |
| Sélection d'un avatar (opacité, échelle, halo)                                       | 200 ms ×3 propriétés  | implicite                                | Aucun — dur (`register.css:95`)                                                                  | Désactivée explicitement (`transition: none`, `register.css:110-114`)                                                                 |
| Ouverture/fermeture des détails de tournoi (opacité, échelle)                        | 400 ms                | ease                                     | Aucun — dur (`game.css:508`)                                                                     | **Non listé** dans le bloc `prefers-reduced-motion` de `tokens.css` — continue de bouger, voir « Gaps »                               |
| Boutons de menu / tournoi (`.menu-button`, `.button-tournament`, `#quit-tournament`) | 300 ms                | ease-in-out                              | Aucun — dur, répété à trois endroits (`game.css:332`, `:356-358`, `:558-561`)                    | Le survol-transformation est neutralisé globalement ; la couleur continue de transitionner                                            |
| Boutons accepter/refuser une demande d'ami                                           | 200 ms                | ease                                     | Aucun — dur (`dashboard.css:372`)                                                                | Idem — transform neutralisé, couleur conservée                                                                                        |
| Barre de chargement (`#loading-bar::before`)                                         | 300 ms                | ease                                     | `--ease-color`                                                                                   | Conservé — c'est une mesure de progression, pas un décor                                                                              |

---

## Sound Standards

Quatorze pistes au total (`frontend/src/game/sounds.mjs:5-33`), ce qui
correspond au chiffre que cite `design/accessibility-requirements.md` pour
justifier l'absence de sous-titrage. **Vérifié plutôt que recopié** : pour
chacune, l'information qu'elle porte existe déjà ailleurs à l'écran au même
instant — aucune ne porte seule un fait dont dépend la suite du jeu.

| Événement                                      | Piste(s)                                                                    | Volume relatif | Informatif ou ambiance                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| Écran titre / hors match                       | `ambient` (boucle, décodée)                                                 | 0,2            | Ambiance                                                                                                   |
| Attente en salle / lobby                       | `lobby` (boucle, streamée) + `woosh` (transition, une fois)                 | 0,1 / 1,0      | Ambiance (`lobby`) ; `woosh` renforce une transition déjà visible (panneau qui change), pas seule porteuse |
| Contact raquette/balle                         | `pong`                                                                      | 0,2            | Renforce un contact déjà rendu dans la scène 3D (rebond visible)                                           |
| But marqué                                     | `goal`                                                                      | 0,3            | Renforce le score déjà mis à jour à l'écran **et** annoncé par `#score-announce` (`aria-live="polite"`)    |
| Match gagné                                    | `win`                                                                       | 0,1            | Renforce le panneau « YOU WIN » (`#winner-message.is-win`, `aria-live="assertive"`)                        |
| Match perdu                                    | `loose`                                                                     | 0,1            | Renforce le panneau « YOU LOSE » (`#winner-message.is-loss`, `aria-live="assertive"`)                      |
| Fin de tournoi                                 | `endTournament`                                                             | 0,3            | Renforce l'écran de résultat final déjà affiché (`#match-info`)                                            |
| Pendant un match                               | `inGame` (boucle, streamée) — remplacée en pratique par la musique mélangée | 0,1            | Ambiance                                                                                                   |
| Musique de fond pendant un match (`playMusic`) | `song1`…`song5`, ordre mélangé, streamées                                   | 0,2            | Ambiance                                                                                                   |

**Déclencheurs vérifiés dans le code** : `ambient` et `playMusic()` démarrent
tous deux sur l'événement socket `start-game` (`main.mjs:272-276`), au moment où
la partie commence réellement — pas au chargement de la page. `lobby` reprend à
la fin d'un tournoi (`socketEvent.mjs:340-343`), quand on revient au menu. Aucun
son n'est déclenché par un événement qui n'a pas aussi un changement visuel ou
une annonce `aria-live` associée dans le même gestionnaire.

---

## Gaps & Patterns Needed

**1. `Escape` ferme les menus contextuels et le tiroir de chat, mais ne fait
rien dans les panneaux du jeu.** `handleDropdownKeydown`
(`frontend/src/views/dashboard.js:530-547`) intercepte `Escape` pour les menus
déroulants, et le tiroir de chat privé hérite du comportement par défaut de
l'Offcanvas Bootstrap. Mais aucun `keydown` n'écoute `Escape` dans
`frontend/src/game/` — recherché explicitement, aucune occurrence entre
`main.mjs`, `socketEvent.mjs` et `panels.mjs`. Les panneaux `menu`, `multi`,
`tournament`, `waiting`, `invite` sont pourtant le même genre d'interruption
flottante, et portent chacun un bouton « Back »/« Cancel »/« Refuse »
(`frontend/game.html:60,72,143,82`) qu'`Escape` pourrait déclencher sans qu'il
le fasse. Deux conventions de fermeture coexistent selon le côté de l'iframe où
l'on se trouve, pour des panneaux visuellement identiques (cadre d'or,
superposition centrée) — c'est la divergence que ce catalogue est censé
prévenir.

**2. Trois façons différentes de dire « ce formulaire a échoué ».**
`login.js:130-137` affiche l'échec dans `#loginError` (`field-error`,
`role="alert"`) sans jamais poser `aria-invalid` sur un champ précis.
`register.js:165-179` pose `aria-invalid="true"` sur `#confirmPassword`, mais
**le même appel à `fail()` est réutilisé à la ligne 230** pour n'importe quelle
erreur renvoyée par le serveur (nom déjà pris, email invalide…) — un échec qui
n'a rien à voir avec la confirmation du mot de passe marque quand même ce champ
comme invalide. `settings.js:190-196` abandonne le motif `field-error` et
affiche la même catégorie d'échec (sauvegarde refusée) dans un toast qui
disparaît après 5 secondes — exactement ce que `tokens.css:238-239` dit vouloir
éviter (« Un refus de champ tenu à côté du champ, pas dans un toast qui part au
bout de cinq secondes »). Une même famille d'événement (soumission de formulaire
refusée) a donc trois comportements observables selon l'écran.

**3. Tabuler hors d'un menu ouvert ne le referme pas.** `handleDropdownKeydown`
(`frontend/src/views/dashboard.js:530-547`) n'intercepte que `Escape`,
`ArrowDown` et `ArrowUp` — pas `Tab`. Une personne au clavier qui tabule au-delà
du dernier item d'un menu contextuel (ami ou compte) déplace son focus vers
l'élément suivant du DOM (l'iframe du jeu, ou le pied de page) pendant que le
menu reste affiché, cadré d'orange, à l'écran. C'est exactement l'état que
`design/accessibility-requirements.md` demande de nommer : « visible mais inerte
».

**4. L'animation d'apparition du bandeau de score ne s'exécute jamais.**
`.score-container` déclare `animation: score-appear 1s ease forwards;`
(`frontend/src/css/game.css:396`), mais aucun `@keyframes score-appear` n'existe
dans `game.css` ni dans `tokens.css`. Un nom d'animation sans `@keyframes`
correspondant est silencieusement ignoré par le navigateur : le bandeau apparaît
instantanément, sans l'entrée en fondu que le code prétend avoir. Écart entre le
comportement déclaré et le comportement réel, sans erreur pour le signaler.

**5. Un motif réinventé plutôt que réutilisé : deux catégories de transitions de
panneau, jamais tokenisées.** `#tournament-details` transite en 400 ms
(`game.css:508`), les boutons de menu et de tournoi en 300 ms
(`game.css:332,356-358,558-561`), les boutons de demande d'ami en 200 ms
(`dashboard.css:372`) — trois durées voisines de
`--ease-color`/`--ease-transform` mais aucune ne les référence par `var()`. Le
système a déjà les deux jetons qu'il faudrait ; chaque composant du jeu a
réécrit sa propre valeur au lieu de les lire.

**6. Une classe utilitaire nue qui fuit d'une feuille non portée.**
`dashboard.css` déclare `.flex { display: flex; }` (`game.css:293-295` —
également présente dans `game.css`, portée par son entrée Vite propre) et
`.hidden { display: none !important; }` sans les scoper à un composant :
`dashboard.css` n'est, par construction (voir `CLAUDE.md`), pas une feuille
portée — toute route qui la charge hérite de ces deux classes génériques. Aucune
collision observée aujourd'hui, mais rien n'empêche un futur `.hidden` plus
spécifique ailleurs de perdre contre le `!important` déjà posé ici.

---

## Open Questions

- **Faut-il qu'`Escape` ferme les panneaux du jeu (menu, attente, invitation,
  tournoi) au même titre que les menus déroulants de la SPA ?** C'est un choix
  de portée (le jeu vit dans sa propre entrée Vite, avec son propre état) autant
  que d'UX — ne m'appartient pas. Voir Gaps #1.
- **Le motif `.focus-toggle` doit-il devenir un composant partagé de
  `tokens.css` avant qu'un deuxième réglage binaire n'apparaisse, ou attendre ce
  deuxième cas ?** Un seul exemplaire aujourd'hui ; généraliser maintenant est
  un pari sur une forme future.
- **`aria-invalid` doit-il être posé sur le champ précis en cause pour chaque
  erreur de formulaire (login, register), ou seulement sur les erreurs de
  validation côté client (mots de passe qui ne correspondent pas) ?** Trancher
  ceci trancherait aussi Gaps #2 : décision de contenu produit (quel champ
  blâmer pour une erreur serveur générique), pas de motif d'interaction.
- **Les erreurs de `settings.js` doivent-elles rejoindre le motif `field-error`
  de login/register, ou le toast reste-t-il volontairement différent parce que
  le formulaire de paramètres a plusieurs champs simultanément modifiables ?**
  Les deux lectures sont défendables ; ce catalogue ne choisit pas à la place de
  l'écran.
- **La barre de progression du chargement (`#loading-bar`) est-elle transposable
  à l'attente de réveil de l'API (login/register, jusqu'à 60 s) ?** Aujourd'hui
  cette attente n'a qu'un libellé de bouton occupé (`aria-busy`), pas de mesure
  — decision de `game-designer`/`ui-programmer` sur si la durée est mesurable à
  l'avance ou seulement bornée par un délai d'expiration.
