# UX Spec: Profile

> **Status**: In Design
> **Author**: phudyka + ux-designer
> **Last Updated**: 2026-08-20
> **Platform Target**: Web — ordinateur (clavier + souris) d'abord, téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-PROF-1, UI-PROF-2, UI-PROF-3, UI-PROF-4, UI-PROF-5, UI-PROF-6, UI-PROF-7
> **Journey Phase(s)**: Parcours B, phase 6 (« Après » — fin de match, vérification) pour le profil personnel. Le profil d'un ami n'a pas de phase dédiée dans `design/player-journey.md` ; il est rattaché en pratique aux phases 3–4 (Base, Engagement), quand on regarde un ami avant de l'inviter. Parcours A n'atteint jamais cet écran : `/profile` et `/profile/:displayName` sont des routes protégées (UI-AUTH-8), et le visiteur sans compte n'en a pas.
> **Template**: UX Spec

---

## Purpose & Player Need

La personne arrive en voulant savoir si ce qu'elle vient de faire a compté —
sur son propre profil, si la partie jouée a été comptabilisée ; sur celui
d'un ami, si ça vaut la peine de l'inviter ou de le suivre.

---

## Player Context on Arrival

**Parcours B, profil personnel (phase 6).** La personne sort d'un match —
le jeu tourne dans l'`<iframe>` centrale du tableau de bord, toujours monté,
jamais fermé (`docs/DESIGN.md`, Règle des Deux Rives). Elle ouvre le menu de
compte dans l'en-tête et clique « My Profile » sans quitter la session en
cours. Son attente est étroite et rapide : un chiffre a-t-il bougé.

**Parcours B, profil d'un ami.** Elle vient de la liste d'amis ou d'un
tiroir de chat privé, où elle a cliqué « View Profile » depuis le menu
contextuel d'une ligne précise. Elle porte le nom de cet ami comme seul
contexte ; elle ne sait pas encore s'il a beaucoup joué, ni s'il est
réellement en ligne au moment où le profil s'affiche (voir Data
Requirements — le statut n'est lu qu'une fois, à l'ouverture).

**Troisième chemin, sans intention portée : l'URL tapée ou un signet.**
`/profile/:displayName` accepte n'importe quel nom d'affichage encodé dans
l'URL (`app.js:47`, `decodeURIComponent`). Rien ne garantit que ce nom
existe encore sous cette forme — un signet ancien après un changement de nom
d'affichage (UI-SET-1) atterrit sur l'état « introuvable », pas sur le
compte visé.

---

## Navigation Position

Route protégée, sœur de `/dashboard` et `/settings` dans la hiérarchie
(`PROTECTED_ROUTES`, `app.js:13`) — pas une sous-route imbriquée. Deux
chemins pour la même vue :

- `/profile` — le sien, résolu depuis `sessionStorage.getItem("username")`
  (`app.js:49-52`).
- `/profile/:displayName` — le sien ou celui d'un ami, résolu depuis le
  segment d'URL (`app.js:42-48`).

Aucun lien de navigation permanent n'y mène : ni barre de tête, ni élément
du triptyque du tableau de bord ne porte de lien direct. On y entre
uniquement par le menu de compte, par le menu contextuel d'un ami, ou par
une URL tenue en dehors de l'application (voir Entry & Exit Points).

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| Menu de compte du tableau de bord, « My Profile » (`#viewmyProfile`) | clic | `display_name` propre, lu depuis `sessionStorage` (`dashboard.js:437-443`) — navigue vers `/profile/:displayName}`, jamais vers `/profile` nu |
| Menu contextuel d'un ami en ligne, « View Profile » (`#friendDropdown .view-profile`) | clic | nom de l'ami porté par `data-friend` du menu ouvert (`dashboard.js:1030-1039`) |
| Menu contextuel d'un ami depuis le chat, « View Profile » (`#friendDropdown_chat .view-profile`) | clic | idem, depuis un tiroir de conversation privée |
| URL tapée ou signet `/profile/:displayName` | navigation directe | seulement le nom porté par l'URL — peut être périmé (renommage depuis) |
| URL tapée ou signet `/profile` (nu) | navigation directe | rien d'explicite ; résolu contre `sessionStorage.getItem("username")`, voir Open Questions #1 pour la divergence possible avec le nom d'affichage actuel |
| Session absente à l'arrivée sur l'une ou l'autre route | `PROTECTED_ROUTES`/`startsWith("/profile/")` (`app.js:34-46`) | aucune — redirection immédiate vers `/login`, cet écran ne s'affiche jamais |

| Exit Destination | Trigger | Notes |
|---|---|---|
| `/dashboard` | clic « Back to Dashboard » (`#backToDashboard`) | seule sortie explicite, depuis l'état réussi comme depuis l'état d'erreur |
| `/login` | session absente à l'arrivée | avant tout affichage de cet écran |
| reste sur la même route | clic « Try again » (`#retryProfile`, état d'erreur uniquement) | rejoue les mêmes appels réseau, ne change pas d'URL |

---

## Layout Specification

### Information Hierarchy

1. Titre — « {display\_name}'s Profile »
2. Avatar et indicateur de présence (point + mot)
3. Bouton d'action d'ami (soi : désactivé ; ami : contextuel)
4. Trois cartes à poids égal, côte à côte sur bureau : Statistiques, Ratio,
   Historique récent
5. Bouton de retour
6. Pied de page

### Layout Zones

Toute la vue remplace `#ft_transcendence` en pleine largeur — ce n'est pas
un panneau posé dans le triptyque du tableau de bord, contrairement au jeu :
la colonne amis et le chat disparaissent entièrement pendant qu'on est sur
`/profile`. Racine `.profile-view.dashboard-container` (`profile.js:124`,
`profile.css:12-16` — hauteur automatique et défilement vertical, la classe
`.dashboard-container` de base est taillée pour un écran fixe et masquerait
le pied de page sans ce correctif).

- **En-tête** — `#header-dashboard` (titre), `#profile-picture` (avatar),
  `.status-indicator` (présence), `#friendButton`.
- **Corps** — `.row.mt-4` : trois `.col-md-4` > `.card` > `.card-body`, à
  poids visuel égal (`docs/DESIGN.md` § Cards, rayon `--radius-lg`, fond
  `--panel-smoke`).
- **Pied** — `#backToDashboard`, puis `<footer>`.

### Component Inventory

| Component | Motif de référence | Sélecteur réel | État par défaut |
|---|---|---|---|
| Avatar | nouveau motif (aucune entrée dédiée dans `interaction-patterns.md`) | `#profile-picture img` | `src` nettoyé de l'enveloppe `url(...)` si présente (`profile.js:66-71`), 150×150, cerclé Orange Couchant |
| Point + texte de présence | apparenté à UI-SOC-9, non catalogué comme motif à part | `.status-dot` / `.status-text` | vert/« Online » ou rouge/« Offline » selon `is_online` (soi : toujours forcé vert/« Online », `profile.js:121`) |
| Bouton d'ami | [Bouton](interaction-patterns.md#bouton), variante primaire | `#friendButton` | `disabled`, texte « Checking… » au premier paint |
| Carte Statistiques | pas de motif dédié, `docs/DESIGN.md` § Cards | `.row .col-md-4:nth-child(1) .card` | rempli au premier paint, aucune donnée différée |
| Anneau de ratio | [Anneau de ratio](interaction-patterns.md#anneau-de-ratio) | `.ratio-donut` + `.ratio-legend` | donut si `totalGames > 0`, sinon `<p class="no-games">` |
| Historique de matchs | [Liste](interaction-patterns.md#liste), variante lecture seule (les lignes ne sont pas des `<button>` — pas d'action par ligne, cas prévu par le « When NOT to Use » du motif) | `.list-group-item` / `.empty-state` | rempli ou « No match played yet » |
| Bouton « Back to Dashboard » (succès) | [Bouton](interaction-patterns.md#bouton), variante primaire | `#backToDashboard.btn-primary` | actionnable dès le paint |
| Panneau d'erreur / introuvable | nouveau motif — ni [Toast](interaction-patterns.md#toast) (persistant, pas auto-masqué) ni [Boîte de dialogue](interaction-patterns.md#boîte-de-dialogue) (pas de confirmation, pas de focus piégé) ; un état plein écran non catalogué | `.profile-error .alert[role="alert"]` | remplace tout le contenu de la vue |
| Bouton « Try again » | [Bouton](interaction-patterns.md#bouton), variante primaire | `#retryProfile` | présent seulement si l'échec n'est pas un 404 |
| Bouton « Back to Dashboard » (erreur) | [Bouton](interaction-patterns.md#bouton), variante **secondaire** — poids visuel différent du même bouton en état de succès, voir Open Questions #9 | `#backToDashboard.btn-secondary` | actionnable dès le paint |

### ASCII Wireframe

Bureau (1440×900) :

```
┌──────────────────────────────────────────────────────────────┐
│                    {display_name}'s Profile                   │
│                         ( avatar 150px )                       │
│                        ● Online / ○ Offline                    │
│                    [ Add friend / This is you ]                 │
│ ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│ │ Player Stats  │  │  Win/Loss     │  │ Recent Match  │        │
│ │ Wins: N       │  │   Ratio       │  │  History      │        │
│ │ Losses: N     │  │   (donut)     │  │ [Win  vs X]   │        │
│ │ Total: N      │  │  ■ Wins: N    │  │ [Loss vs Y]   │        │
│ │ Win Rate: N%  │  │  ■ Losses: N  │  │  …            │        │
│ │ Streak: …     │  │               │  │               │        │
│ │ VS AI: …      │  │               │  │               │        │
│ └───────────────┘  └───────────────┘  └───────────────┘        │
│                    [ Back to Dashboard ]                        │
│              ft_transcendence — a 3D Pong by phudyka           │
└──────────────────────────────────────────────────────────────┘
```

Téléphone (390×844) — les trois cartes s'empilent en pleine largeur
(`profile.css:270-284`, seuil 768 px) :

```
┌─────────────────────┐
│ {name}'s Profile     │  ← tronqué par ellipsis si trop long
│   ( avatar 150px )   │
│  ● Online             │
│ [ Add friend ]        │
│ ┌───────────────────┐ │
│ │ Player Statistics │ │
│ └───────────────────┘ │
│ ┌───────────────────┐ │
│ │ Win/Loss Ratio    │ │
│ └───────────────────┘ │
│ ┌───────────────────┐ │
│ │ Recent Matches    │ │
│ └───────────────────┘ │
│ [ Back to Dashboard ] │
│ ft_transcendence — …  │
└─────────────────────┘
```

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| Default — profil personnel | `isCurrentUser === true` (`display_name` de l'URL égale le `username` de session, `profile.js:120`) | statut forcé « Online » quel que soit `is_online` réel en base ; bouton « This is you », désactivé en permanence ; aucune action d'ami possible sur cet écran |
| Default — profil d'un ami | `isCurrentUser === false` | statut réel (`userProfile.is_online`) ; bouton reflète la relation (« Add friend » actionnable, ou « Already friends »/« Request sent » désactivés) |
| Loading | à l'ouverture, deux appels réseau enchaînés (`GET /api/user/:name/` puis `GET /api/get-recent-matches/:username/`, `profile.js:47-74`) avant tout rendu | **absent du code** — rien n'est peint pendant l'attente ; si l'écran est atteint depuis le tableau de bord, celui-ci reste visible, listeners déjà retirés (`removeDashboardEventListeners`, `profile.js:45`) : visible mais inerte. Voir Open Questions #3 |
| Vérification de l'amitié en cours | après le premier rendu, `GET /api/check-friend-request/:username/` en vol (`profile.js:250-254`) | le bouton est peint `disabled`/« Checking… » **dans le même geste** que le reste de la page (`profile.js:145-147`) — pas d'état « visible mais inerte » ici, le libellé annonce honnêtement qu'il ne fait encore rien |
| Empty — compte neuf (0 partie) | `totalGames === 0` (`wins + losses`) | l'anneau entier cède la place à `<p class="no-games">No games played</p>` (`--muted-sand`) avant même d'atteindre le CSS — pas de `conic-gradient` à `--win-share` indéfini ; toutes les statistiques affichent 0 ou « No games yet » (streak) ; l'historique affiche « No match played yet » |
| Empty — historique vide malgré un ratio non nul | `recentMatches.length === 0` alors que `wins + losses > 0` (les deux comptes sont indépendants : le ratio lit `userProfile.wins/losses`, l'historique lit `MatchHistory` limité aux 10 dernières lignes) | état contradictoire en apparence mais réel dans le code : l'anneau et les totaux s'affichent normalement, l'historique affiche « No match played yet » à côté |
| Error — échec réseau ou 5xx | `catch`, message d'erreur sans « 404 » (`profile.js:269-284`) | toute la vue remplacée par `.profile-error` : « Could not load this profile. The server is hosted on a free tier and may still be starting. », boutons « Try again » et « Back to Dashboard » |
| Not Found (UI-PROF-6) | `catch`, message d'erreur contenant « 404 » | « No account with that name. », **pas** de bouton « Try again » (rejouer le même nom ne changerait rien) — seul « Back to Dashboard » |
| Nom d'affichage long | `display_name` dépasse la largeur du titre | ellipsis CSS sur une seule ligne (`profile.css:20-26`) ; texte DOM intact (lu en entier par un lecteur d'écran) mais aucun moyen visuel de récupérer le nom complet — voir Open Questions #4 |
| Avatar manquant ou cassé | `avatar_url` vide/nul, ou URL inatteignable | l'enveloppe `url("…")` est retirée si présente, mais une valeur vide reste vide (`profile.js:66-71` ne traite que le cas `url(...)`) — l'`<img>` affiche l'icône de rupture par défaut du navigateur, seul `alt="{display_name}'s avatar"` reste lisible |
| Match gagné / perdu (historique) | chaque ligne de `recentMatches` | mot « Win »/« Loss » en `--reef-green-text`/`--coral-red-text`, doublé d'un liséré de bordure `color-mix` — jamais la couleur seule (UI-PROF-5, `profile.css:230-236`) |

---

## Interaction Map

**Clavier.** Ordre de tabulation, état réussi :

1. `<h1>` — focus programmatique posé par `announceRoute()` à l'arrivée
   (`app.js:18-24`), `tabIndex="-1"` : reçoit le focus une fois au chargement,
   n'est pas un arrêt normal de `Tab` ensuite.
2. `#friendButton` — `Enter`/`Espace` envoie la demande d'ami quand le
   libellé est « Add friend » ; sans effet sinon (`disabled`).
3. `#backToDashboard` — `Enter`/`Espace` retourne au tableau de bord.

État d'erreur : 1) `<h1>` (masqué visuellement, `visually-hidden`, mais
reçoit quand même le focus programmatique) → 2) `#retryProfile` (si présent)
→ 3) `#backToDashboard`.

C'est un écran presque entièrement en lecture : les trois cartes (stats,
ratio, historique) ne contiennent aucun élément focalisable — pas de bouton
par ligne dans l'historique, à la différence de la liste d'amis, parce
qu'aucune action n'est rattachée à une ligne de match.

**Pointeur.** Mêmes cibles, aucune ne descend sous 44 px
(`.btn { min-height: var(--tap-min) }`, `tokens.css:139`).

**Tactile.** Identique au pointeur fin — rien de spécifique à
`(pointer: coarse)` sur cet écran, pas de zone tactile dédiée.

**`Escape`.** Sans effet : aucun menu, tiroir ou panneau flottant ouvert sur
cette vue.

---

## Events Fired

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Ouverture de l'écran | `GET /api/user/:displayName/` | — |
| (suite, automatique) | `GET /api/get-recent-matches/:username/` | 10 derniers matchs de `userProfile.username` |
| (suite, automatique, après le premier rendu) | `GET /api/check-friend-request/:username/` | `{ is_friend, request_sent }` |
| Clic « Add friend » | `POST /api/send-friend-request/` (`sendFriendRequest`, `utils/friendManager.js`) | `{ to_username: friendName }` |
| Clic « Back to Dashboard » | aucun — `navigateTo('/dashboard')` | raison : changement de route pur, rien à envoyer au serveur |
| Clic « Try again » (état d'erreur) | rejoue `profile(displayName)` — mêmes deux appels que l'ouverture | — |
| Survol ou clic sur une ligne d'historique, sur l'anneau | aucun | raison : aucune action n'est rattachée à ces éléments dans le code livré |

---

## Transitions & Animations

**Entrée.** Aucune transition dédiée : `innerHTML` de `#ft_transcendence`
est remplacé de façon synchrone, sans fondu (`profile.js:123-248`). Le
changement est instantané, qu'on arrive du tableau de bord ou d'une
navigation directe.

**Sortie.** Identique — `navigateTo('/dashboard')` déclenche le routeur, qui
remplace `innerHTML` sans transition.

**Animations locales.** Les seules propriétés qui bougent sur cet écran sont
héritées des composants partagés : agrandissement à 1,05 au survol des
boutons (`--ease-transform`, 200 ms) et fondu de couleur de bordure au
survol d'une ligne d'historique (`--ease-color`, 300 ms,
`profile.css:217-223`).

**`prefers-reduced-motion: reduce`.** Les agrandissements au survol
disparaissent (`*:hover { transform: none !important; }`,
`tokens.css:123-125`) ; les fondus de couleur restent, conformément à la
règle globale (`tokens.css:110-121`). Rien de spécifique à cet écran à
neutraliser au-delà du socle déjà posé dans `tokens.css`.

---

## Data Requirements

| Data | Source System | Read / Write | Update trigger | Null handling |
|---|---|---|---|---|
| `display_name` | Django `CustomUser.display_name`, via `GET /api/user/:name/` | Read | à l'ouverture de l'écran | absent seulement si le compte n'existe pas → état Not Found |
| `avatar_url` | Django `CustomUser.avatar_url`, incohérent en base (`https://…` ou `url("…")` selon inscription/OAuth 42/envoi, non validé côté serveur) | Read | à l'ouverture | le client retire l'enveloppe `url(...)` si présente (`profile.js:66-71`) ; une valeur vide ou nulle reste vide — l'image affiche l'icône de rupture du navigateur, `alt` reste le seul texte lisible |
| `is_online` | Django `CustomUser.is_online`, écrit par `POST /api/update-online-status/` (autre écran) | Read | à l'ouverture uniquement — aucun événement ne le rafraîchit ensuite sur cet écran, pas de socket ici | pour soi : toujours affiché comme « Online », indépendamment de la valeur réelle (`profile.js:121`) ; pour un ami : valeur brute, un changement de statut pendant que le profil reste ouvert n'est jamais reflété |
| `wins` / `losses` | Django `CustomUser.wins`/`losses`, incrémentés par `F()` dans `POST /api/save-match-result/` | Read | à l'ouverture | `0`/`0` pour un compte neuf, jamais nul |
| Historique (`result`, `opponent`, `date`) | Django `MatchHistory`, via `GET /api/get-recent-matches/:username/`, 10 dernières lignes | Read | à l'ouverture | liste vide → « No match played yet » |
| Relation d'amitié (`isFriend`, `requestSent`) | Django `Friendship` / `FriendRequest`, via `GET /api/check-friend-request/:username/` | Read | à l'ouverture, après le premier rendu | échec réseau → `{ isFriend: false, requestSent: false }` (`checkFriendshipStatus` catch, `profile.js:21-24`) : le bouton affiche alors « Add friend » actionnable même si la relation réelle est inconnue — pas un état d'erreur visible |

---

## Accessibility

**Ordre de focus.** Voir Interaction Map — deux arrêts réels en état de
succès (`#friendButton`, `#backToDashboard`), trois en état d'erreur
(`#retryProfile` s'ajoute avant `#backToDashboard`). Le focus initial est
posé sur le `<h1>` par `announceRoute()`, sans faire défiler la page
(`preventScroll: true`, `app.js:23`).

**Contrastes chiffrés** (composites calculés sur les fonds réellement
empilés — `--panel-smoke` (rgba(34,34,34,0.8)) posé sur `--night` (#121212)
donne un fond effectif ≈ #1f1f1f, méthode identique à celle du commentaire
de `tokens.css:45-48`) :

| Paire | Ratio | Seuil |
|---|---|---|
| `--on-accent` (#121212) sur `--coral-red-loss` (alerte d'erreur) | 5,09:1 (chiffré dans `profile.css:258-260`) | ≥ 4,5:1 ✓ |
| `--paper` (#e0e0e0) texte de carte sur `--panel-smoke`/`--night` | ≈ 12,5:1 | ≥ 4,5:1 ✓ |
| `--lava-orange` (#ff5722) titres de carte sur `--panel-smoke`/`--night` | ≈ 5,2:1 | ≥ 4,5:1 ✓ |
| `--reef-green-text` (#66bb6a) mot « Win » sur `--panel-smoke`/`--night` | ≈ 6,9:1 | ≥ 4,5:1 ✓ |
| `--coral-red-text` (#ff7a70) mot « Loss » sur `--panel-smoke`/`--night` | ≈ 6,5:1 | ≥ 4,5:1 ✓ |
| `--muted-sand` (#888888) « No games played » sur `--panel-smoke-soft` empilé sur la carte | ≈ 4,65:1 | ≥ 4,5:1 ✓, marge étroite — à revérifier si un panneau s'assombrit encore |
| `--muted-sand` pied de page sur `--night` pur | ≈ 5,29:1 | ≥ 4,5:1 ✓ |

**Alternative non colorée à tout signal coloré.**

- Issue de match : le mot « Win »/« Loss » porte le verdict, la bordure
  `color-mix` n'est qu'un renfort (UI-PROF-5, tenu — `profile.css:226-236`).
- Présence en ligne : le mot « Online »/« Offline » accompagne le point
  (`profile.js:141-144`).
- Ratio victoires/défaites : voir ci-dessous.

**Anneau de ratio et lecteur d'écran.** Le donut porte `role="img"` et
`aria-label="${wins} wins and ${losses} losses"` (`profile.js:179-181`) —
la valeur exacte est donc lisible sans dépendre de la couleur, pour
quiconque n'utilise pas de souris. `aria-valuenow`/`aria-valuemin`/
`aria-valuemax` ne sont **pas** posés, et c'est cohérent : ce n'est pas un
`role="progressbar"` (contrairement à la barre de chargement du jeu, seule
à porter ces trois attributs dans le projet, `interaction-patterns.md` §
Barre de progression) mais une image statique dotée de son texte de
remplacement complet. Le pourcentage exact n'apparaît pas sur l'anneau
lui-même, mais juste à côté, dans « Win Rate: {N}% » de la carte
Statistiques — l'information n'est donc jamais perdue, seulement répartie.

**Cas limite du ratio 0/0.** Quand `totalGames === 0`, le donut n'est même
pas construit : `#chartContainer` affiche `<p class="no-games">No games
played</p>` à la place (`profile.js:172-175`). Aucun `--win-share`
indéfini, aucun anneau à moitié dessiné qui laisserait croire à un résultat.

**Cibles.** `#friendButton` et les boutons de navigation/retry tiennent
`--tap-min` (44 px) via la classe `.btn` partagée (`tokens.css:133-143`) —
aucun ajustement `(pointer: coarse)` supplémentaire n'est nécessaire sur
cet écran, rien n'y descend sous ce plancher.

**Aucun flash.** Aucune animation répétitive sur cet écran (pas de
pulsation, pas de halo) : rien à couvrir au-delà du socle
`prefers-reduced-motion` déjà dans `tokens.css`.

**Écart connu — changement de libellé sans annonce.** `#friendButton` passe
de « Checking… » à son état final sans région `aria-live`
(`attachEventHandlers2`, `profile.js:318-332`) : une personne au clavier qui
a déjà quitté le bouton avant la résolution de
`GET /api/check-friend-request/` n'est jamais informée du changement — à la
différence du reste du système, où un changement d'état significatif est
censé s'annoncer (`design/accessibility-requirements.md` § 3).

---

## Localization Considerations

**Mélange de langues, assumé.** L'interface est en anglais (« Player
Statistics », « Win/Loss Ratio », « No account with that name. ») ; cette
documentation est en français, comme le reste de `design/ux/`.

**`display_name`.** Longueur non plafonnée côté client sur cet écran — le
titre `<h1>` se tronque par ellipsis CSS (`clamp(1.5rem, 4vw, 2.5rem)`,
`profile.css:20-26`) quel que soit le nombre de caractères, sans casser la
disposition (UI-PROF-7 tenu pour la mise en page). Aucun texte alternatif
visuel ne permet cependant de lire le nom complet une fois tronqué — voir
Open Questions #4.

**Nom d'adversaire (`opponent`, historique).** Contenu utilisateur au même
titre que `display_name`, mais sans garde de troncature : `.badge` dans
`profile.css` ne définit ni `text-overflow` ni `max-width`. Un pseudo
d'adversaire long peut élargir la ligne d'historique ou la faire déborder,
à la différence du titre principal qui, lui, est protégé.

**Textes statiques les plus longs.** « Could not load this profile. The
server is hosted on a free tier and may still be starting. » (~95
caractères) : au-delà de +40 % (traduction ou nom long combiné), ce texte
reste dans un conteneur `max-width: 32rem` (`profile.css:267`) qui absorbe
le débordement en s'enroulant sur plusieurs lignes plutôt qu'en débordant
horizontalement — pas de risque de rupture de mise en page identifié ici.

---

## Acceptance Criteria

1. Hors réveil de l'API Django (nommé et exclu, jusqu'à une minute au
   premier appel après 15 min d'inactivité), l'écran affiche l'avatar, le
   nom, les statistiques et l'historique en moins de 300 ms après la
   réponse des deux appels réseau d'ouverture.
2. À 1440 × 900, les trois cartes (Statistiques, Ratio, Historique)
   s'affichent côte à côte, à poids égal, sans chevauchement ni défilement
   horizontal.
3. À 390 × 844, les trois cartes s'empilent en pleine largeur ; le bouton
   de retour et le pied de page restent atteignables par défilement
   vertical, jamais coupés hors cadre.
4. Aucun élément interactif n'est visible avant d'être actionnable.
5. Un nom d'affichage de 40 caractères ou plus ne pousse ni l'avatar ni les
   cartes hors de l'écran ; il se tronque sur une seule ligne.
6. Le ratio victoires/défaites est lisible sans la couleur : la légende
   textuelle et l'`aria-label` de l'anneau portent les mêmes nombres.
7. Un compte sans aucune partie jouée affiche « No games played » à la
   place de l'anneau et « No match played yet » dans l'historique, jamais
   un anneau à valeur indéfinie.
8. Une personne au clavier seul atteint chaque contrôle interactif
   (bouton d'ami, réessayer si présent, retour) par `Tab`, dans l'ordre
   documenté en Interaction Map, sans piège de focus.
9. Un `display_name` introuvable affiche « No account with that name. »
   avec un seul bouton « Back to Dashboard », jamais un écran vide ni une
   exception JavaScript visible.

---

## Open Questions

1. **`/profile` nu peut afficher « introuvable » sur son propre profil.**
   `app.js:49-52` résout la route nue avec
   `sessionStorage.getItem("username")` (l'identifiant de connexion,
   immuable) et le passe à `profile()`, qui l'utilise contre
   `GET /api/user/:display_name/` — une recherche par **nom d'affichage**
   (`get_user_by_display_name`, `src/django/app/pong/views.py:158-160`).
   `username` et `display_name` sont égaux à l'inscription
   (`views.py:114`) mais divergent dès qu'une personne renomme son compte
   dans Paramètres (`update_user_settings`, `views.py:272-276`, qui ne
   touche jamais `username`). Résultat : visiter `/profile` nu après un
   renommage affiche « No account with that name. » sur son propre profil.
   Aucun lien de l'interface n'emprunte cette route nue aujourd'hui (« My
   Profile » utilise toujours `/profile/:displayName}`, `dashboard.js:437-443`),
   mais elle reste une route réelle et protégée (UI-AUTH-8). Corriger
   `app.js` pour lire `display_name` plutôt que `username`, ou documenter
   `/profile` nu comme un raccourci non garanti : décision produit, ne
   m'appartient pas.
2. **Aucun état « Loading » n'est peint à l'ouverture.** Les deux premiers
   appels réseau (`profile.js:47-74`) sont enchaînés sans aucun retour
   visuel. Quand l'écran est atteint depuis le tableau de bord,
   `removeDashboardEventListeners()` (`profile.js:45`,
   `dashboard.js:1342-1372`) retire les écouteurs de clic, de clavier et
   déconnecte le socket **avant** que le nouveau HTML ne remplace
   l'ancien : le tableau de bord précédent reste visible à l'écran,
   visuellement intact, strictement inerte, le temps de la résolution —
   l'état que le palier Comprehensive demande explicitement de nommer.
3. **Le nom complet n'est récupérable qu'au clavier/lecteur d'écran, pas à
   la souris.** Le `<h1>` tronqué par ellipsis (`profile.css:20-26`) ne
   porte ni `title`, ni aucun autre mécanisme de récupération pour une
   personne voyante au pointeur — seuls le texte DOM intact (lu en entier
   par un lecteur d'écran, l'ellipsis étant purement visuel) et le titre
   d'onglet complet (`announceRoute`, `app.js:18-24`) portent le nom en
   entier.
4. **Changement de libellé du bouton d'ami sans annonce.**
   `attachEventHandlers2` (`profile.js:318-332`) fait passer le texte de
   « Checking… » à son état final sans région `aria-live` : une personne
   qui a déjà quitté le bouton au clavier n'apprend jamais le résultat.
5. **« Compte bloqué » ne mène pas à l'état « profil introuvable » dans le
   code livré**, contrairement à ce qu'on pourrait attendre :
   `get_user_by_display_name` (`views.py:158-176`) ne filtre jamais sur
   `BlockedUser`, et `block_user` (`views.py:416-444`) ne supprime ni la
   `Friendship` ni l'accès au profil. Un compte bloqué reste pleinement
   visible par URL directe. Couper cet accès est une décision produit hors
   périmètre de cette spec.
6. **« Ami supprimé » n'est pas une cause réelle non plus** : aucune route
   de suppression de compte n'existe dans `urls.py`. Les seules causes
   réelles de l'état Not Found aujourd'hui sont un nom mal tapé ou périmé
   dans une URL/un signet, et le point 1 ci-dessus.
7. **Le badge d'adversaire n'a pas de garde de troncature.**
   `profile.css` ne définit ni `text-overflow` ni `max-width` pour
   `.badge`, à la différence du titre principal — un pseudo d'adversaire
   long (contenu utilisateur, non plafonné) peut élargir ou casser une
   ligne d'historique.
8. **Texte de l'état vide du ratio.** `design/ux/interaction-patterns.md` §
   Anneau de ratio proposait « No games played yet » « à confirmer par la
   spec de l'écran Profil ». Le code livré affiche « No games played »
   (sans « yet », `profile.js:174`) — cette spec retient le texte du code ;
   le catalogue de motifs devrait être aligné en conséquence, hors
   périmètre de ce fichier.
9. **Le bouton « Back to Dashboard » change de poids visuel selon
   l'état.** Primaire en état de succès (`profile.js:236`), secondaire en
   état d'erreur (`profile.js:297`) — même action, deux traitements. Mineur,
   signalé pour cohérence plutôt que pour blocage.
