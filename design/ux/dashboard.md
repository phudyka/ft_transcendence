# UX Spec: Dashboard

> **Status**: In Design
> **Author**: phudyka + ux-designer
> **Last Updated**: 2026-08-20
> **Platform Target**: Web — ordinateur (clavier + souris) d'abord, téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-SOC-1, UI-SOC-2, UI-SOC-3, UI-SOC-4, UI-SOC-5, UI-SOC-6, UI-SOC-7, UI-SOC-8, UI-SOC-9, UI-SOC-10, UI-AUTH-7, UI-NAV-5, UI-PROF-1
> **Journey Phase(s)**: B3 « Base » (recherche de qui est en ligne), B4 « Engagement » (invitation, choix de mode), B6 « Après » (retour de partie) — `design/player-journey.md`
> **Template**: UX Spec

---

## Purpose & Player Need

La personne arrive en voulant savoir qui d'autre est disponible, et rejoindre une partie sans quitter la conversation en cours. Elle ne vient jamais consulter cet écran pour lui-même : elle vient s'en servir comme carrefour, entre une invitation à envoyer, un message à lire et une manche à commencer — et elle y revient plusieurs fois dans la même session, pas une seule (`design/player-journey.md`, « les phases 4 à 7 sont un cycle »).

Trois besoins coexistent selon le moment où elle atterrit ici :

- **Phase B3, premier passage de la session.** Elle veut savoir qui est en ligne, tout de suite, avant même de penser à un mode de jeu.
- **Phase B4, en plein milieu d'une conversation.** Elle veut défier quelqu'un ou lui répondre sans perdre le fil de ce qu'elle était en train de faire ailleurs sur l'écran.
- **Phase B6, retour d'une manche.** Elle veut confirmer que la partie a compté (score, ami toujours là) et enchaîner — pas réapprendre l'écran.

## Player Context on Arrival

**Parcours B, seul parcours qui atteint cet écran** — la route est protégée (`UI-AUTH-8`), aucun visiteur du parcours A n'y accède jamais, y compris depuis la démonstration jouable sans compte.

- **Après une connexion réussie** (`/login` → soumission), la personne porte une session toute neuve : `sessionStorage` vient d'être rempli (`accessToken`, `refreshToken`, `display_name`, `avatar_url`), l'API vient d'être sollicitée une première fois et est donc déjà réveillée. Impatience : la partie est le but, l'écran n'est qu'un passage (`player-journey.md`, phase B1).
- **Après une inscription** (`/register` → soumission), même chose, avec en plus l'avatar tout juste choisi et aucun ami — c'est la toute première fois que l'onglet « Friends » sera vu, et il sera vide.
- **URL tapée ou onglet rouvert**, session déjà en `sessionStorage` mais jamais revérifiée côté serveur. C'est le seul chemin où l'API peut être froide : si le tier gratuit s'est endormi (15 min d'inactivité, `docs/PRODUCT.md`), le premier appel de cet écran (`/api/verify-token/`) porte le risque de réveil d'une minute — voir `## States & Variants`.
- **Retour d'une partie** (`/game.html` chargé dans l'`<iframe>` ramène au menu du jeu, pas à une autre route SPA) : le tableau de bord lui-même n'est jamais quitté pendant une partie en ligne — l'`<iframe>` change d'état intérieurement (`UI-NAV-5`), la colonne amis et le chat restent visibles et inchangés tout du long, sauf si « Focus the game » a été activé.
- **Retour de `/profile/:name`** (bouton « Back to Dashboard », `profile.js:256-261,310-312`) ou de `/settings` (bouton logo `#pongonlineLink`, `aria-label="Back to dashboard"`, `settings.js:22-27`) : la personne revient avec une intention déjà formée (elle vient de vérifier une statistique ou de changer un réglage), pas en découverte.

## Navigation Position

Route `/dashboard`, protégée (`UI-AUTH-8` : redirection vers `/login` sans session, `app.js:34-37,105-108`). C'est le nœud central de la SPA après connexion — la seule route dont on peut atteindre en un clic `/profile/:name` (soi-même ou un ami), `/settings`, et le jeu (embarqué, jamais une navigation SPA). Il n'existe pas de sous-route : `/dashboard` est un écran plat qui change d'état, pas une hiérarchie de vues.

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| `/login` | Soumission réussie du formulaire (`navigateTo("/dashboard")`) | Session neuve, API déjà réveillée par l'appel de connexion |
| `/register` | Soumission réussie du formulaire | Session neuve, avatar tout juste choisi, zéro ami |
| `/` (accueil) | Router : session déjà valide détectée à l'atterrissage sur `/` (`app.js:57-63`) | Rebond automatique, sans geste explicite de la personne |
| `/login` ou `/register` visités en étant déjà connecté | Router : mêmes rebonds automatiques (`app.js:64-70,74-80`) | Idem |
| URL tapée directement (`/dashboard`) | Chargement de page, `sessionStorage.username` présent | Session non revérifiée côté serveur — seul chemin qui expose le réveil de l'API à cet écran |
| Route protégée sans session (`/dashboard`, `/settings`, `/profile`) | Redirection automatique — mais **vers `/login`**, jamais vers `/dashboard` lui-même | N/A — ceci est un point d'entrée vers `/login`, cité ici pour mémoire de `UI-AUTH-8` |
| `/profile/:name` | Bouton « Back to Dashboard » (`#backToDashboard`), y compris depuis l'état d'erreur « profil introuvable » | Vient de consulter un profil ; aucune donnée du profil ne traverse vers le tableau de bord |
| `/settings` | Bouton logo (`#pongonlineLink`, `aria-label="Back to dashboard"`) ou après enregistrement réussi | Si le nom d'affichage ou l'avatar viennent de changer, `sessionStorage` est mis à jour par `/settings` avant le retour — l'en-tête du tableau de bord doit donc refléter la nouvelle valeur au prochain rendu, pas l'ancienne |
| Bouton retour du navigateur (`popstate`) | Depuis `/profile/:name` ou `/settings` | `UI-NAV-2` ; retrouve l'écran tel qu'il était sauf les données qui se sont rafraîchies entre-temps (amis, chat) |

| Exit Destination | Trigger | Notes |
|---|---|---|
| `/profile/{displayName}` (soi-même) | Clic sur l'avatar → « My Profile » (`#viewmyProfile`) | `UI-PROF-1` |
| `/profile/{friendName}` | « View Profile » depuis `#friendDropdown` ou `#friendDropdown_chat` (`viewProfile`, `dashboard.js:1030-1039`) | Même vue que ci-dessus, variante « profil d'un ami » |
| `/settings` | Clic sur l'avatar → « Settings » (`#settings`, `goTosettings`) | — |
| `/login` | Clic sur l'avatar → « Logout » (`#logoutLink`, `handleLogout`) | `UI-AUTH-7` ; voir `## States & Variants` pour ce qui se passe visuellement pendant l'appel réseau qui précède la redirection |
| `/login` | `force_disconnect` reçu (session ouverte ailleurs) suivi d'un `logout()` automatique | Non déclenché par la personne — voir `## States & Variants`, « La socket tombe » |
| Le jeu, `<iframe>` interne | Aucune navigation SPA — le focus clavier peut entrer dans `#pong` (`Tab`, ou `iframe.focus()` explicite après l'envoi d'une invitation, `dashboard.js:741-742`) | `UI-NAV-5` : `/game.html` est une entrée Vite séparée, montée en permanence, jamais une route du routeur `app.js` |

---

## Layout Specification

### Information Hierarchy

1. **Qui d'autre est là** (colonne amis, à gauche) — c'est la première question de la phase B3, donc la première colonne dans l'ordre de lecture et dans l'ordre de tabulation.
2. **Le jeu** (centre, 70 % de la largeur) — occupe le plus d'espace parce que c'est la raison d'être du produit, mais n'est ni la première ni la dernière chose atteinte au clavier : il est structurellement au milieu, cohérent avec la Règle des Deux Rives (`docs/DESIGN.md`) qui le pose comme une zone à part, encadrée par l'application des deux côtés.
3. **Ce qui se dit** (colonne chat, à droite) — troisième priorité : utile pendant et entre les parties, jamais bloquant pour y jouer.
4. **Compte et session** (en-tête) — toujours visible, jamais au centre de l'attention : nom, avatar, bascule de concentration.
5. **Rien** (pied de page) — une ligne de texte, aucune action.

### Layout Zones

Triptyque horizontal fixe, `docs/DESIGN.md` § Layout : en-tête fixe (~60 px), contenu en `calc(100dvh - 60px)`, trois colonnes — amis 15 % (min 150 px), jeu 70 % (`flex: 1`), chat 15 % (min 150 px) — chacune séparée par son propre fond de fumée et son ombre latérale, jamais par une bordure (`dashboard.css:76-151`).

| Zone | Contenu | Règle de position |
|---|---|---|
| **En-tête** (`.header`) | Logo décoratif, titre du produit, bascule « Focus the game », nom, avatar (menu de compte) | `panel-smoke-strong` (0,9), ombre portée vers le bas — `dashboard.css:49-56` |
| **Colonne amis** (`.sidebar`, `<nav aria-label="Friends">`) | Formulaire d'ajout, trois onglets, trois listes, deux menus contextuels (masqués) | `panel-smoke` (0,8), ombre latérale droite — `dashboard.css:76-84` |
| **Colonne jeu** (`.game-container`) | `<iframe id="pong">` seule | `panel-smoke` (0,8), centré — `dashboard.css:126-141` |
| **Colonne chat** (`.chat-container`, `<aside>`) | Journal du chat général, champ de saisie, bouton d'envoi | `panel-smoke` (0,8), ombre latérale gauche — `dashboard.css:144-151` |
| **Hors flux** | Menu de compte (`#profileDropdown`), tiroir de conversation privée (`#chatbox`, Offcanvas) | Positionnés `fixed`/hors écran par défaut, n'occupent aucune zone tant qu'ils ne sont pas ouverts |
| **Pied de page** (`#footer-dashboard`) | Une phrase | `panel-smoke-strong` (0,9) |

Sous 768 px, le triptyque s'empile — le jeu en premier (`order: -1`), amis et chat plafonnés à `60dvh` chacun, défilement interne (`dashboard.css:512-547`). C'est la Règle du Triptyque + le repli mobile déjà documentés dans `docs/DESIGN.md` ; rien de spécifique à cet écran ne s'y ajoute au-delà de l'ordre des trois blocs.

### Component Inventory

| Composant | Motif de référence (`design/ux/interaction-patterns.md`) | Sélecteur réel | État par défaut |
|---|---|---|---|
| Bascule « Focus the game » | [Bascule / Toggle](interaction-patterns.md#bascule--toggle) | `#focus-game` | Off, `aria-pressed="false"` |
| Menu de compte | [Menu déroulant](interaction-patterns.md#menu-déroulant) | `#profileDropdown`, déclenché par `#img_profile_pic_button` | Fermé, `hidden` |
| Formulaire d'ajout d'ami | [Champ de saisie](interaction-patterns.md#champ-de-saisie) + [Bouton](interaction-patterns.md#bouton) (primaire) | `#addFriendForm`, `#addFriendInput`, `#addFriendButton` | Vide, bouton actif |
| Barre d'onglets de relation | [Barre d'onglets](interaction-patterns.md#barre-donglets) | `.friends-tabs`, `#tab-online` / `#tab-pending` / `#tab-blocked` | `#tab-online` actif (libellé visible « Friends ») |
| Liste « Friends » (tous les amis, en ligne ou non) | [Liste](interaction-patterns.md#liste) | `#online-friends` | Vide au premier rendu, peuplée ou état vide/erreur après la première requête |
| Liste des demandes en attente | [Liste](interaction-patterns.md#liste) | `#pending-friends` | Idem |
| Liste des utilisateurs bloqués | [Liste](interaction-patterns.md#liste) | `#blocked-friends` | Idem |
| Menu contextuel d'ami (liste « Friends ») | [Menu contextuel d'ami](interaction-patterns.md#menu-contextuel-dami) | `#friendDropdown` | Fermé, `hidden` |
| Menu contextuel d'ami (depuis un pseudo cliqué en chat) | [Menu contextuel d'ami](interaction-patterns.md#menu-contextuel-dami) | `#friendDropdown_chat` | Fermé, `hidden` |
| Jeu embarqué | Aucun motif du catalogue — nouveau motif (hôte d'`<iframe>` permanent, voir `docs/DESIGN.md` § Dependencies) | `<iframe id="pong">` | Chargé en continu, indépendant de l'état du reste de l'écran |
| Journal du chat général | [Liste](interaction-patterns.md#liste) — variante non interactive explicitement nommée dans le catalogue (« When NOT to Use ») | `#chat-log` (`role="log"`) | Vide, ou repeuplé depuis `sessionStorage` |
| Champ + envoi, chat général | [Champ de saisie](interaction-patterns.md#champ-de-saisie) + [Bouton](interaction-patterns.md#bouton) (icône) | `#message-input`, `#send-button` | Vide, actif |
| Tiroir de conversation privée | [Panneau latéral de chat](interaction-patterns.md#panneau-latéral-de-chat) | `#chatbox` (Offcanvas Bootstrap), `#private-chats-container` | Fermé |
| Journal + champ, chat privé | [Liste](interaction-patterns.md#liste) (variante) + [Champ de saisie](interaction-patterns.md#champ-de-saisie) | `#chat-log-{friendName}`, `#message-input-{friendName}`, `#send-button-{friendName}` | Recréé à chaque ouverture, une seule conversation affichée à la fois |
| Accepter/refuser une demande | [Bouton](interaction-patterns.md#bouton) (icône) | `.accept-btn`, `.reject-btn` par ligne de `#pending-friends` | Actif |
| Débloquer | [Bouton](interaction-patterns.md#bouton) (secondaire, texte) | `.unblock-btn` par ligne de `#blocked-friends` | Actif |
| Toasts (ami ajouté, invitation envoyée, erreur, déconnexion…) | [Toast](interaction-patterns.md#toast) | conteneur créé par `utils/feedback.js` | Absent, apparaît sur événement |
| Pied de page | Aucun motif nécessaire — texte statique | `#footer-dashboard` | Toujours visible, aucune interaction |

### ASCII Wireframe

**Bureau (1440 × 900) :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [logo]  ft_transcendence      [Focus the game]  DisplayName  [avatar ▾]  │ ~60px, panel-smoke-strong
├───────────────┬────────────────────────────────────────────┬────────────┤
│ SIDEBAR (15%, │              GAME (flex:1, ~70%)            │ CHAT (15%, │
│ min 150px)    │  ┌────────────────────────────────────┐    │ min 150px) │
│[Add a friend..│  │                                      │    │   Chat     │
│         ][Add]│  │      <iframe id="pong">              │    │ ┌────────┐ │
│┌──────┬────┬─┐│  │      title="Pong game"               │    │ │chat-log│ │
││Friend│Pend│Bl││  │                                      │    │ │(role=  │ │
│└──────┴────┴─┘│  │                                      │    │ │ log)   │ │
│ ● Alice       │  │                                      │    │ └────────┘ │
│ ○ Bob         │  │                                      │    │[msg....][➤]│
│ ● Carole      │  │                                      │    │            │
│ …             │  └────────────────────────────────────┘    │            │
├───────────────┴────────────────────────────────────────────┴────────────┤
│                   footer — ft_transcendence, a 3D Pong by phudyka        │
└──────────────────────────────────────────────────────────────────────────┘
  (hors flux : #profileDropdown sous l'avatar quand ouvert ;
   #chatbox glisse depuis la droite, par-dessus tout, quand une conversation
   privée est ouverte)
```

**Téléphone (390 × 844), triptyque empilé, jeu en tête :**

```
┌────────────────────────────────┐
│ [logo] ft_trans. [Focus] [av▾] │ ~60px
├────────────────────────────────┤
│      GAME (order:-1)           │
│  aspect-ratio 4/3, largeur 100%│
│     <iframe id="pong">         │
├────────────────────────────────┤
│  SIDEBAR (max-height 60dvh,    │
│  défile si besoin)             │
│ [Add a friend...        ][Add] │
│ [Friend][Pending][Blocked]     │
│  ● Alice   ○ Bob   ● Carole    │
├────────────────────────────────┤
│  CHAT (max-height 60dvh)       │
│  chat-log (défile)             │
│ [message.................][➤] │
├────────────────────────────────┤
│  footer                        │
└────────────────────────────────┘
```

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| **Loading — porte d'entrée** | `dashboard()` attend `checkAuthentication()` (`POST /api/verify-token/`) avant de peindre quoi que ce soit (`dashboard.js:23-28,54`) | **Rien n'est peint.** `#ft_transcendence` reste dans l'état où l'écran précédent l'a laissé (ou vide, sur un chargement direct de `/dashboard`, `index.html:24`). Aucun spinner, aucun texte, aucun `aria-busy`. Si l'API dort (tier gratuit, 15 min d'inactivité), cet appel peut prendre jusqu'à une minute — c'est exactement le point de friction B1 nommé par `player-journey.md`, mais rien à cet écran ne le signale. **Peint et répond au même instant, l'un après l'autre : rien n'est visible avant la réponse — voir « Open Questions » #1, c'est l'inverse du défaut habituel (rien n'est « visible mais inerte », c'est l'écran entier qui est absent).** |
| **Default** | `checkAuthentication()` a répondu vrai | Coquille complète peinte en un seul `innerHTML` (`dashboard.js:54-303`) : en-tête, colonnes, listes encore vides, chat vide ou repeuplé depuis `sessionStorage`. `announceRoute("Dashboard")` déplace le focus sur le `<h1>` masqué visuellement (titre de route) — `app.js:18-24`. |
| **Loading — listes d'amis** | `fetchAndDisplayFriends()` part en tâche de fond, non attendue par `dashboard()` (`dashboard.js:309`) ; trois requêtes en parallèle (`Promise.all`, `dashboard.js:1124-1129`) | Les trois `<ul>` restent des conteneurs vides — **exactement la même apparence que l'état Empty**, aucun spinner ni texte « Loading… » ne les distingue. **Peint (coquille vide) avant de répondre (contenu réel) : c'est un état « visible mais inerte » au sens strict — un compte neuf sans ami et un compte qui attend sa réponse réseau sont visuellement identiques** jusqu'à ce que l'un des deux textes de repli apparaisse. Aucun `aria-live` n'entoure les trois `<ul>` ni leurs `tabpanel` parents (`dashboard.js:146-174`) : un lecteur d'écran déjà positionné dans l'onglet au moment où le contenu arrive n'est pas informé du changement. |
| **Empty — « Friends »** | `friendsData.friends` vide après résolution | `<li class="empty-state">No friend yet — add one by name above.</li>` (`dashboard.js:1167-1172`) — seul des trois états vides à porter une action explicite, cohérent avec le fait que c'est la seule des trois listes où l'absence de contenu est vraiment la phase B3 « liste d'amis vide sans indication de quoi faire » que `player-journey.md` nomme comme risque de fin de session. |
| **Empty — « Pending Requests »** | `pending_requests` vide | `<li class="empty-state">No pending request.</li>` (`dashboard.js:1186-1188`) — texte purement informatif, à dessein : il n'y a rien à faire quand personne n'attend de réponse. |
| **Empty — « Blocked Users »** | `blocked_users` vide | `<li class="empty-state">Nobody blocked.</li>` (`dashboard.js:1215-1217`) — idem, informatif. |
| **Error — listes d'amis** | Un des trois appels réseau échoue (rejet de `Promise.all`) | Les **trois** listes sont vidées et recouvertes de `Could not load this list.` (`error-state`, `dashboard.js:1218-1231`), même si un seul des trois appels a réellement échoué — la personne ne peut pas savoir laquelle des trois informations manque vraiment. |
| **Rafraîchissement silencieux** | Toutes les 15 s si l'onglet est visible (`fetchFriendsInterval`, `dashboard.js:488-490`), ou immédiatement sur `friend_request_received` / `friend_request_updated` (événements socket réels) | Les listes ne sont redessinées que si leur contenu a changé (`lastFriendsSignature`, `dashboard.js:1148-1154`) — le focus, la sélection et le défilement ne sont jamais perdus par ce rafraîchissement. `friend_status_change` est **écouté mais jamais émis** par aucun service du dépôt (`dashboard.js:398-403` ; recherche exhaustive dans `src/realtime/` et `src/django/` sans résultat) : la présence en ligne d'un ami ne se met donc à jour, en pratique, que par ce cycle de 15 s. |
| **Chat général — Default** | `loadGeneralChatMessages()` relit `sessionStorage.general_chat_messages` (15 messages max, `dashboard.js:1041-1080`) | Historique redessiné en gras (`bold-username`) pour le distinguer visuellement des messages reçus en direct pendant la session |
| **Chat général — Empty** | Aucun historique en session | `<p class="empty-state" id="chat-placeholder">No message yet. Say hello.</p>` (`dashboard.js:1099-1108`), retiré au premier message reçu ou envoyé |
| **Chat — socket non connectée à l'ouverture** | `getSocket()` renvoie `null` ou une socket déconnectée | `initializeSocket(displayName)` est appelée immédiatement (`dashboard.js:38-43`) ; si le token est absent, la fonction retourne `null` sans le signaler à l'écran (`socketManager.js:15-22`, uniquement un `console.error`) — voir « Open Questions » |
| **Socket — déconnexion par inactivité (10 min)** | Aucune activité `pointerdown`/`keydown`/`visibilitychange` sur le **document du tableau de bord** pendant 10 min (`IDLE_MS`, `socketManager.js:68-89`) | Toast `warning` (assertif) « Disconnected after 10 minutes idle. », `updateOnlineStatus(false)`, `disconnectSocket()` — **sans `logout()`** : la session SPA reste ouverte, seule la conversation en temps réel s'arrête. Aucun bandeau permanent ne signale cet état après coup ; la personne ne le découvre qu'en essayant de parler à nouveau (voir ligne suivante). Reconnexion : **aucune automatique** (`connectChat({ reconnection: false })`, `socketManager.js:26`) — envoyer un message général relance `initializeSocket()` (`dashboard.js:797-804`), mais la connexion n'est pas encore établie au moment où le message est vérifié, donc le **premier** message tapé après une reconnexion silencieuse déclenche seulement le toast « Connection lost. Trying to reconnect... » sans partir ; il faut retaper et renvoyer. Le chat privé, lui, le dit explicitement dans la conversation elle-même : « Message not sent — you are disconnected from the chat. » (`dashboard.js:677-684`). |
| **Socket — coupure invisible pendant une partie** | La personne joue une manche, focus clavier dans `<iframe id="pong">` | `pointerdown`/`keydown` à l'intérieur de l'`<iframe>` ciblent le document de `game.html`, pas celui du tableau de bord — ils ne réarment jamais le minuteur d'inactivité du chat (`socketManager.js:86-88` n'écoute que `document`, celui de la SPA). Une personne activement en train de jouer, raquette tenue au clavier depuis 10 minutes, peut donc perdre sa connexion de chat en silence, alors que « l'activité » au sens produit n'a jamais cessé. |
| **Socket — `force_disconnect` (session ouverte ailleurs)** | Reconnexion du même compte depuis un autre onglet/appareil (`UI-SOC-8`) ; le serveur déconnecte l'ancienne socket (`src/realtime/app/chat/index.mjs:23-37`) | Toast `warning` (assertif) portant le message serveur « Your account has been connected from another location » (`socketManager.js:53-57`), puis `disconnectSocket()` **et** `logout()` — cette fois la session entière se termine, `sessionStorage.clear()`, redirection vers `/login`. Plus sévère que la coupure d'inactivité, sans que le toast seul ne le distingue : les deux sont des toasts `warning` de forme identique, l'un ramène à `/login` quelques centaines de millisecondes plus tard, l'autre laisse l'écran intact. |
| **Socket — erreur de connexion** | `connect_error` (ex. jeton expiré au handshake) | Toast `error` (assertif) « Chat disconnected. Reload the page to reconnect. » (`socketManager.js:40-43`) — seul des trois cas de coupure à dire explicitement quoi faire (recharger la page) ; les deux autres n'offrent aucune consigne de reprise. |
| **Menu contextuel ouvert** (compte ou ami) | Clic/`Enter`/`Espace` sur le déclencheur | Voir [Menu déroulant](interaction-patterns.md#menu-déroulant) — peint et interactif dans le même geste, rien de « visible mais inerte » à l'ouverture. À la **fermeture par `Tab`** en revanche (non interceptée), le menu reste peint pendant que le focus a déjà quitté la zone — c'est un état « visible mais inerte » documenté au niveau du catalogue (`interaction-patterns.md`, Gap #3) ; sur cet écran précisément, tabuler hors de `#friendDropdown`/`#friendDropdown_chat` (dernier enfant de `<nav class="sidebar">`, DOM juste avant `<main class="game-container">`) envoie le focus **droit dans l'`<iframe>` du jeu**, tandis que le menu reste affiché, bordé d'orange, dans la colonne de gauche. |
| **Tiroir de chat privé ouvert** | « Send Private Message » depuis `#friendDropdown` | Voir [Panneau latéral de chat](interaction-patterns.md#panneau-latéral-de-chat) — comportement de focus délégué à l'Offcanvas Bootstrap, non réimplémenté ici. |
| **Focus the game (activé)** | Clic sur `#focus-game` | Colonnes amis et chat masquées (`display: none`), le jeu prend 100 % de la largeur ; sous 768 px, la zone de jeu abandonne son `aspect-ratio: 4/3` fixe pour occuper toute la hauteur restante (`dashboard.css:686-745`) — seule variante de layout propre à cet écran en dehors du repli mobile standard. |
| **Logout en cours** | Clic sur « Logout » | Aucun état visuel dédié : ni le bouton ni le menu ne passent en `aria-busy`, alors que `logout()` attend un appel réseau (`POST /api/update-online-status/`) avant de vider `sessionStorage` et de naviguer (`utils/token.js:17-33`). Le menu reste affiché, inerte, pendant cette attente — invisible en pratique tant que l'API est déjà chaude (post-connexion), mais sans garde si elle ne l'est pas. |

---

## Interaction Map

**Ordre de tabulation, bureau, tous menus fermés :**

1. `#focus-game` (bascule « Focus the game »)
2. `#img_profile_pic_button` (déclenche `#profileDropdown`)
3. `#addFriendInput`
4. `#addFriendButton`
5. `#tab-online` (seul onglet dans l'ordre de tabulation — `roving tabindex`, `ArrowLeft`/`ArrowRight`/`Home`/`End` déplacent la sélection parmi les trois, voir [Barre d'onglets](interaction-patterns.md#barre-donglets))
6. Chaque ligne-bouton de la liste active (`.friend-row`, ou boutons `.accept-btn`/`.reject-btn`/`.unblock-btn` selon l'onglet), dans l'ordre du DOM
7. `#message-input`
8. `#send-button`
9. `<iframe id="pong">` — puis l'ordre de focus interne documenté dans `design/ux/hud.md` § Accessibility, non repris ici

Le logo d'en-tête (`.logo`) **n'est pas focalisable** : contrairement à `/settings`, qui enveloppe son logo dans `#pongonlineLink` (bouton, retour au tableau de bord), le logo du tableau de bord est une simple image décorative (`alt=""`, aucun `<button>`/`<a>` autour, `dashboard.js:57-63`) — aucune action ne lui est associée sur cet écran, ce qui est cohérent puisque le tableau de bord est déjà la destination que ce logo viserait ailleurs.

**Clavier — menus** (`#profileDropdown`, `#friendDropdown`, `#friendDropdown_chat`) : `Enter`/`Espace` ouvre et pose le focus sur le premier item actionnable ; `ArrowDown`/`ArrowUp` cycle en boucle ; `Escape` referme et rend le focus au déclencheur — voir [Menu déroulant](interaction-patterns.md#menu-déroulant) et [Menu contextuel d'ami](interaction-patterns.md#menu-contextuel-dami), non respécifiés ici. **`Tab` n'est pas intercepté** (écart déjà nommé par le catalogue) : sur cet écran, tabuler hors de `#friendDropdown`/`#friendDropdown_chat` mène dans `<iframe id="pong">` (voisin suivant dans le DOM) ; tabuler hors de `#profileDropdown` (positionné juste après `.content`, avant l'Offcanvas fermé et le pied de page sans élément focalisable) sort de tout contenu interactif de la page.

**Clavier — chat général.** `Enter` dans `#message-input` envoie le message (`handleEnterKey`, `dashboard.js:894-923`) sans provoquer de saut de ligne (`preventDefault`). Le même gestionnaire distingue le tiroir privé ouvert du salon général en cherchant `.offcanvas.offcanvas-end.show` dans le DOM — si le tiroir est ouvert, `Enter` cible son propre champ, jamais les deux à la fois.

**Clavier — l'`<iframe>` du jeu.** Le cadre est un élément focalisable natif, atteint par `Tab` depuis `#send-button` ; une fois le focus posé dessus, les frappes suivantes (`W`/`S`/flèches/`Espace`) sont interprétées par le document de `game.html`, qui a son propre écouteur de clavier (`frontend/src/game/controls.mjs`) — **isolation par construction du navigateur**, pas par un garde explicite du code : un clic ou une frappe dans `#message-input`/`#message-input-{friendName}` ne peut jamais faire bouger une raquette, et inversement, jouer ne peut jamais taper dans le chat, parce que les deux documents ne partagent pas la même cible d'événements clavier. Le seul geste du tableau de bord qui déplace explicitement le focus dans le jeu est `startGame()`, après l'envoi d'une invitation (`iframe.focus()`, `dashboard.js:741-742`) — conforme à la « Règle de focus » (`design/accessibility-requirements.md`) : le focus ne bouge que sur action explicite, jamais au hasard d'une annonce.

**Pointeur.** Chaque ligne de liste, chaque item de menu et le bouton d'envoi sont de vrais `<button>` — aucune précision de pointeur requise, cible ≥ 44 px sous `(pointer: coarse)` (`dashboard.css:567-588`). Les menus contextuels se positionnent sous leur déclencheur et se replient dans la fenêtre s'ils déborderaient (`showDropdownAt`, `dashboard.js:496-516`).

**Tactile.** Aucune commande tactile propre à cet écran (les zones tactiles du jeu vivent dans l'`<iframe>`, hors périmètre de cette spec — voir `design/ux/hud.md`). Sous pointeur grossier, les cibles rondes (accepter/refuser, envoi de message) montent à 44 px, les onglets et lignes de liste aussi (`dashboard.css:567-588`).

---

## Events Fired

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Ouverture de l'écran | `POST /api/verify-token/` | — (jeton dans l'en-tête `Authorization`) |
| Ouverture de l'écran | Connexion socket.io namespace `/chat` | `auth: { token }` (handshake), suivi de l'émission `register` |
| Ouverture de l'écran | `GET /api/friends/`, `GET /api/get-friend-requests/`, `GET /api/blocked-users/` (en parallèle) | — |
| Ajouter un ami par nom (`#addFriendForm`) | `POST /api/send-friend-request/` puis émission socket `friend_request` | `{ to_username }` ; socket : `{ from, to, requestId }` |
| Accepter une demande | `POST /api/accept-friend-request/` puis émission socket `friend_request_response` | `{ request_id }` ; socket : `{ from: to_user, to: from_user, response: "accepted", requestId }` |
| Refuser une demande | `POST /api/reject-friend-request/` puis émission socket `friend_request_response` | Idem, `response: "rejected"` |
| « Start a Game » sur un ami en ligne | `postMessage` vers `<iframe id="pong">` (pas d'appel serveur direct depuis cet écran) | `{ to, from, type: "gameInvitation" }` |
| « Send Private Message » | Aucun appel réseau à l'ouverture — le tiroir s'ouvre localement, les messages passeront par l'émission socket `private message` au premier envoi | `{ to, from, message }` |
| Envoyer un message (salon général) | Émission socket `chat message` | `{ name, message }` — le serveur réécrit `name` depuis le jeton, `src/realtime/app/chat/index.mjs:39-43` |
| Envoyer un message (privé) | Émission socket `private message` | `{ to, from, message }` |
| « Add To Friend » depuis un pseudo du chat | `GET /api/check-friend-request/{username}/` puis, si nécessaire, `POST /api/send-friend-request/` | — |
| « Block User » | `POST /api/block-user/` | `{ display_name }` |
| Débloquer | `POST /api/unblock-user/` | `{ display_name }` |
| « View Profile » | Navigation SPA (`navigateTo`), aucun appel réseau depuis cet écran | — |
| Bascule « Focus the game » | Aucun — purement local (classe CSS + `aria-pressed`) | — |
| « Logout » | `socket.disconnect()`, puis `POST /api/update-online-status/` (`is_online: false`), puis `navigateTo("/login")` | `{ is_online: false }` |
| Rafraîchissement périodique des listes | `GET /api/friends/`, `GET /api/get-friend-requests/`, `GET /api/blocked-users/` | Toutes les 15 s si l'onglet est visible, ou immédiatement sur `friend_request_received`/`friend_request_updated` |
| Connexion socket établie | `POST /api/update-online-status/` | `{ is_online: true, display_name }` |
| Déconnexion (toute cause) | `POST /api/update-online-status/` | `{ is_online: false, display_name }` |

---

## Transitions & Animations

**Entrée sur l'écran.** Aucune transition dédiée : `innerHTML` remplace le contenu de `#ft_transcendence` en un seul geste synchrone (`dashboard.js:54-303`), sans fondu ni décalage. Le focus se pose sur le `<h1>` masqué visuellement au même instant (`announceRoute`, `app.js:18-24`). Sous `prefers-reduced-motion: reduce`, cela ne change rien puisqu'il n'y avait déjà aucune animation d'entrée à neutraliser.

**Sortie de l'écran.** Idem : la navigation vers `/profile`, `/settings` ou `/login` remplace `innerHTML` sans transition de sortie. `removeDashboardEventListeners()` (`dashboard.js:1342-1375`) nettoie les écouteurs et arrête l'intervalle de rafraîchissement avant que le nouveau contenu ne soit peint — pas de fuite d'écouteurs visible pour la personne, mais aucune animation à observer non plus.

**Survol/transformation** des lignes de liste (translation -2 px), onglets, boutons d'accepter/refuser : `--ease-color` (300 ms) et `--ease-transform` (200 ms), les jetons globaux du système — voir `docs/DESIGN.md` § Named Rules et `design/ux/interaction-patterns.md` § Animation Standards, non redéfini ici. Sous `prefers-reduced-motion: reduce`, les transformations de survol sont neutralisées globalement (`*:hover { transform: none !important; }`, `tokens.css:123-125`) ; les fondus de couleur restent.

**Ouverture/fermeture d'un menu déroulant.** Aucune transition : `hidden` bascule sans fondu (`dashboard.css:311-313`) — comportement identique avec ou sans `prefers-reduced-motion`.

**Tiroir de chat privé.** Glissement standard de l'Offcanvas Bootstrap 5, non réimplémenté (voir [Panneau latéral de chat](interaction-patterns.md#panneau-latéral-de-chat)) — sa durée et son comportement sous `prefers-reduced-motion` suivent Bootstrap, non vérifiés par `scripts/check-design.mjs`.

**Toasts.** Apparition/disparition standard de `bootstrap.Toast`, auto-dismiss à 5000 ms (`utils/feedback.js:59`) — voir [Toast](interaction-patterns.md#toast).

---

## Data Requirements

| Data | Source System | Read / Write | Update trigger | Null handling |
|---|---|---|---|---|
| `display_name`, `avatar_url` (en-tête) | `sessionStorage`, posé par `/login`, `/register` ou `/settings` | Lecture seule sur cet écran | Au rendu initial uniquement — un changement fait depuis `/settings` n'est visible qu'au prochain rendu complet de `/dashboard`, pas en direct | `display_name` absent → redirection vers `/login` avant tout rendu (`dashboard.js:45-48`). `avatar_url` absent → **aucun repli** : le gabarit interpole `${avatarUrl}` tel quel, ce qui pose `src="null"` (chaîne littérale) sur l'image de 50 px, une image cassée sans avatar de secours (`dashboard.js:33-34,83-90`) |
| Session authentifiée | API Django, `/api/verify-token/` | Lecture (vérification), jamais écrite depuis cet écran | À chaque ouverture de `/dashboard` | Réponse non `ok` → `sessionStorage.accessToken` retiré, redirection `/login` (`utils/auth.js:13-18`) |
| Listes d'amis / demandes / bloqués | API Django (`/api/friends/`, `/api/get-friend-requests/`, `/api/blocked-users/`) — **l'UI n'est jamais propriétaire de cette donnée** | Lecture ; écriture indirecte via accepter/refuser/ajouter/bloquer/débloquer, qui déclenchent chacun leur propre route | Ouverture de l'écran, poll de 15 s (onglet visible), ou événements socket `friend_request_received`/`friend_request_updated` | Liste vide → texte de repli propre à chaque onglet (voir `## States & Variants`) ; échec réseau → texte d'erreur générique sur les trois listes à la fois, même si une seule requête a échoué |
| Présence en ligne (`is_online` par ami) | API Django, champ renvoyé par `/api/friends/` | Lecture sur cet écran ; l'écriture (`/api/update-online-status/`) part de la connexion/déconnexion socket, pas d'une action de cet écran | **Pas un flux temps réel malgré l'apparence** : l'événement socket censé le porter (`friend_status_change`) n'est émis par aucun service livré — la mise à jour réelle vient du poll de 15 s | Champ absent traité comme hors ligne par la classe CSS (`friend.is_online ? "online" : "offline"`, `dashboard.js:1305`) |
| Messages du chat général | socket.io namespace `/chat`, événement `chat message` — pas de persistance serveur | Écriture (émission) et lecture (réception) ; aucune requête REST | À chaque message émis par quiconque dans le salon | Aucun historique serveur : `sessionStorage.general_chat_messages` ne garde que les 15 derniers messages **côté client**, perdus à la fermeture de l'onglet |
| Messages privés | socket.io `/chat`, événement `private message` — pas de persistance serveur, pas de mise en cache `sessionStorage` | Idem, mais **rien ne survit à un rechargement complet de la page** : `privateMessages` est une simple `Map` en mémoire (`dashboard.js:19`), contrairement au chat général qui conserve 15 messages | À chaque message | Conversation vide au premier envoi/réception avec chaque ami — pas de texte de repli dédié dans le tiroir (le journal est simplement vide) |
| Utilisateurs bloqués (filtrage du chat) | Recalculé côté client à partir de `/api/blocked-users/` (`blockedUsers`, un `Set`) | Lecture seule pour le filtrage d'affichage | À chaque `fetchAndDisplayFriends()` | Un message reçu d'un compte bloqué est supprimé silencieusement (`receiveMessage`, `dashboard.js:884-892`) — aucune trace visible que quelque chose a été filtré |
| Invitation à jouer | `postMessage` vers l'`<iframe>`, puis relais interne au jeu — **aucune donnée persistée**, l'UI du tableau de bord ne fait que transmettre | Écriture unique au clic sur « Start a Game » | Sur action explicite seulement | Échec si `iframe.contentWindow` est indisponible → toast d'erreur, aucune retentative automatique (`dashboard.js:737-745`) |

---

## Accessibility

**Ordre de focus.** Voir `## Interaction Map` — séquence numérotée 1 à 9, aucun piège de focus en dehors des menus contextuels non bouclés par `Tab` (déjà nommé, voir « Open Questions »).

**Contrastes chiffrés** (calculés depuis les valeurs hexadécimales de `frontend/src/css/tokens.css`, méthode WCAG relative luminance ; seuils : 4,5:1 texte courant, 3:1 texte large ≥ 24 px ou ≥ 19 px gras, 3:1 composants non textuels) :

| Paire | Usage sur cet écran | Ratio | Seuil applicable | Verdict |
|---|---|---|---|---|
| `--paper` sur `--night` | Fond de page par défaut | ≈ 14,2:1 | 4,5:1 | Large marge |
| `--lava-orange-soft` sur `--panel-smoke-strong` | `.header-title`, `.header-name` | ≈ 5,7:1 | 4,5:1 (le nom n'est pas en texte large) | Conforme |
| `--sunset-orange` sur `--panel-smoke` | `.title-chat` (2,5rem, texte large) | ≈ 7,1:1 | 3:1 | Large marge |
| `--sunset-orange` sur `--panel-smoke-soft` | `.username-link` (chat général), onglet actif au repos avant sélection | ≈ 7,2:1 | 4,5:1 | Conforme |
| `--lava-orange-soft` sur `--panel-smoke-soft` | `.username-link.is-me` | ≈ 5,9:1 | 4,5:1 | Conforme |
| `--chalk`/hérité sur `--panel-smoke-soft` | Texte des lignes de liste (`.list-group-item`, `.friend-row`) | ≈ 16,9:1 | 4,5:1 | Large marge |
| `--on-accent` sur `--sunset-orange` | Onglet actif, `#send-button` | 8,03:1 (documenté, `tokens.css:50-52`) | 4,5:1 | Large marge |
| `--on-accent` sur `--reef-green` | `.accept-btn` | ≈ 6,0:1 | 3:1 (icône, pas de texte) | Conforme |
| `--chalk` sur `--coral-red` | `.reject-btn` | ≈ 4,5:1 | 3:1 (icône, pas de texte) | Conforme, marge faible |
| `--coral-red-text` sur `--panel-smoke*` | `.error-state` | ≥ 4,5:1 (« éclairci au seuil », commentaire `tokens.css:45-46`) | 4,5:1 | Conforme, à la limite par construction |
| `--muted-sand` sur `--panel-smoke-soft`/`-strong` | `.empty-state`, texte indicatif, pied de page | ≈ 4,6–4,8:1 | 4,5:1 (texte courant, 0,9rem/14,4 px — pas « large ») | **Conforme mais de justesse — à revérifier au rendu réel, aucune marge de sécurité** |
| `--reef-green`/`--coral-red` (pastille) sur `--panel-smoke-soft` | `.status-dot` | ≈ 5,4:1 (en ligne) / ≈ 3,7:1 (hors ligne) | 3:1 (composant non textuel) | Conforme, marge faible côté rouge |
| `--sun-gold` (anneau de focus) sur `--night` | `:focus-visible` global | ≈ 12,4:1 | 3:1 | Large marge |

**Alternative non colorée à la présence en ligne (`UI-SOC-9`) — écart trouvé.** La pastille de statut porte un `role="img"` et un `aria-label` (« Online »/« Offline », `dashboard.js:1304-1309`) : une technologie d'assistance reçoit bien un second signal. Mais **rien de visible à l'écran ne distingue les deux états pour une personne voyante daltonienne** — même taille, même forme, seule la teinte (vert/rouge) change (`dashboard.css:238-252`) ; aucun texte visible « Online »/« Offline » n'accompagne le nom dans la ligne. Le socle Basic de `design/accessibility-requirements.md` § 1 nomme explicitement « le point de présence en ligne » parmi les cas couverts — l'exigence est remplie pour les lecteurs d'écran, pas pour la vision des couleurs.

**Annonces lecteur d'écran, changements d'état significatifs de cet écran :**

| Changement | Région | Politesse | Statut vérifié |
|---|---|---|---|
| Message de chat général reçu | `#chat-log` (`role="log"`, `aria-live="polite"`, `aria-relevant="additions"`) | polie | Conforme — chaque ligne (bouton pseudo + texte) est ajoutée en un seul geste DOM, une seule annonce par message. **Nuance** : le pseudo porte `aria-label="Actions for {name}"` sur le bouton, ce qui prime sur son texte visible `[{name}]` pour le nom accessible — l'annonce réelle ressemble à « Actions for Alice, button : hello », pas au plus naturel « Alice : hello » |
| Message privé reçu | `#chat-log-{friendName}` (mêmes attributs) | polie | Conforme, même construction |
| Demande d'ami reçue / acceptée | **Aucune** — `design/accessibility-requirements.md:55` laissait ce cas « à vérifier par spec » | polie (attendue) | **Non implémenté.** `friend_request_received` (`dashboard.js:385-396`) ajoute une ligne à `#pending-friends` et bascule l'onglet visuellement (`.click()` programmatique), mais aucun conteneur autour de `#pending-friends` ni de `#online-friends` ne porte `aria-live` — une personne qui n'a pas l'écran sous les yeux ne sait pas qu'une demande vient d'arriver |
| Toasts (ami ajouté, invitation envoyée, erreur, avertissement, déconnexion) | Conteneur du toast (`role="status"`/`role="alert"` selon type) | polie (succès/info) ou assertive (erreur/avertissement) | Conforme, voir [Toast](interaction-patterns.md#toast) |
| Ouverture du tiroir de chat privé | Offcanvas Bootstrap | — | Délégué, non vérifié par cette spec (voir le motif référencé) |

**Focus à l'ouverture/fermeture.** Menus contextuels : focus posé sur le premier item actionnable à l'ouverture, rendu au déclencheur à la fermeture par `Escape` ou clic extérieur — jamais à la fermeture par `Tab`, qui ne referme rien (voir `## States & Variants`). L'entrée dans l'`<iframe>` du jeu ne déplace jamais le focus d'elle-même, sauf sur l'action explicite « Start a Game ».

**Cibles.** Toutes les cibles interactives listées dans `## Component Inventory` respectent `--tap-min` (44 px) sous `(pointer: coarse)` (`dashboard.css:567-588`) — vérifié pour cet écran, pas seulement supposé du système.

## Localization Considerations

L'interface est en anglais (tous les libellés du gabarit : « Add a friend by name », « Friends », « Pending Requests », « Blocked Users », « Send Private Message », « Start a Game », « My Profile », « Settings », « Logout »…), la documentation de cette spec est en français — l'écran ne mélange pas les deux langues, seul ce document le fait, comme l'exige le brief commun.

**Longueurs et casse.**

- `.header-name` (nom courant, en-tête) : tronqué à `max-width: 12rem` avec ellipsis (`dashboard.css:626-633`) — aucun nombre de caractères garanti, dépend de la police ; un nom de compte particulièrement long (nom d'affichage n'a pas de plafond visible dans cette vue) reste lisible sans casser la mise en page.
- `.header-title` : `clamp(1.5rem, 4vw, 2.5rem)` avec troncature — « ft_transcendence » ne varie jamais, ce champ n'est pas un risque de traduction.
- Placeholders de champ (« Add a friend by name », « Type your message… ») : pas de contrainte de largeur dédiée au-delà du champ lui-même ; un texte 40 % plus long resterait dans un champ pleine largeur sans casser la mise en page, mais tronquerait visuellement dans le champ d'ajout d'ami en colonne étroite (15 %, min 150 px) — à vérifier si une traduction plus longue que l'anglais est un jour introduite, ce que le produit ne fait pas aujourd'hui (`docs/PRODUCT.md` ne mentionne aucune internationalisation).
- Libellés de menu contextuel (« Start a Game (offline) », « Send Private Message ») : les plus longs du système sur cet écran ; le menu déroulant a une largeur minimale de 150 px mais pas de largeur maximale (`dashboard.css:315-325`) — un libellé 40 % plus long s'étendrait sans troncature, au prix d'un menu plus large que ses voisins.
- Messages système (toasts, textes vides) : pas de contrainte de caractères observée dans le code — les toasts s'élargissent avec leur contenu (`position-fixed`, pas de `max-width` dédiée dans `feedback.js`), risque de recouvrement de l'en-tête sur un message long, non testé par cette spec.

## Acceptance Criteria

1. La coquille du tableau de bord (en-tête, trois colonnes, formulaire, onglets) est peinte en moins de 500 ms après que `/api/verify-token/` a répondu — le réveil de l'API elle-même est exclu de cette mesure et peut prendre jusqu'à 60 s sur le tier gratuit endormi.
2. À 1440 × 900, les trois colonnes du triptyque sont visibles simultanément sans défilement horizontal, avec leurs largeurs respectives de 15 %/70 %/15 % et leurs minimums de 150 px tenus.
3. À 390 × 844, les trois blocs (jeu, amis, chat) sont empilés dans cet ordre, le jeu en premier, chacun accessible par défilement vertical sans dépasser `60dvh` pour les blocs amis et chat.
4. Aucun élément interactif de cet écran n'est visible avant d'être actionnable : les menus contextuels et le menu de compte sont peints et dotés de leur focus dans le même geste (`showDropdownAt`), jamais affichés puis rendus utilisables un instant plus tard.
5. Les trois listes de la colonne amis affichent chacune un texte distinct et correctement ciblé quand elles sont vides : « No friend yet — add one by name above. », « No pending request. », « Nobody blocked. » — jamais le même texte pour les trois, jamais un état visuellement indiscernable d'un chargement en cours sans qu'aucun des deux ne soit vérifiable par une personne qui regarde l'écran.
6. La totalité de l'écran — formulaire d'ajout, onglets, listes, menus, chat général et privé, bascule de concentration, menu de compte — est traversable et actionnable au clavier seul, sans piège de focus permanent (le cas `Tab` hors menu ouvert laisse le menu affiché mais ne bloque le focus nulle part : `Tab` continue d'avancer dans le document).
7. Un ami ajouté, une demande acceptée/refusée ou un utilisateur bloqué/débloqué se reflète dans les listes concernées sans rechargement de la page, dans un délai maximal de 15 secondes (le pire des deux chemins de mise à jour, poll périodique compris).
8. Le focus clavier posé sur `<iframe id="pong">` n'affecte jamais le contenu de `#message-input`/`#message-input-{friendName}`, et réciproquement — vérifiable en tapant dans le chat pendant qu'une partie est en cours sans qu'aucune touche ne déplace une raquette.
9. Sous `prefers-reduced-motion: reduce`, aucune transformation de survol ne subsiste sur les lignes de liste, onglets ou boutons de cet écran ; les fondus de couleur (`--ease-color`) restent perceptibles.

## Open Questions

- **Aucun indicateur de chargement entre le clic de connexion (ou le chargement direct de l'URL) et le premier rendu du tableau de bord**, alors que l'appel qui bloque ce rendu (`POST /api/verify-token/`, `dashboard.js:23-28`) peut prendre jusqu'à une minute sur le tier gratuit endormi — c'est exactement le point de friction que `player-journey.md` nomme pour la phase B1, jamais couvert pour cet écran précis (`login.js` traite sa propre attente avec `WAKE_UP_MS`/`setBusy`, `dashboard.js` n'a rien d'équivalent). Décision de `ui-programmer` : où poser un état de chargement quand l'écran entier — pas un seul bouton — dépend d'un appel réseau avant de pouvoir peindre quoi que ce soit.
- **Les trois listes d'amis n'ont pas d'état « Loading » distinct de l'état « Empty ».** `dashboard.js:146-174` (markup, trois `<ul>` vides au premier rendu) et `:1117-1234` (`fetchAndDisplayFriends`, non attendue par `dashboard()`). Le compte neuf de la phase B3 et un compte qui attend une réponse réseau lente voient exactement le même écran pendant l'attente.
- **`friend_status_change` est écouté (`dashboard.js:398-403`) mais n'est émis par aucun service du dépôt** — recherche exhaustive dans `src/realtime/` et `src/django/` sans occurrence en dehors du fichier client. La présence en ligne n'est donc mise à jour, dans les faits, que par le poll de 15 s (`dashboard.js:488-490`), jamais poussée en temps réel — à corriger côté service temps réel, ou à documenter comme une limite assumée si le poll est jugé suffisant.
- **`session_expired` figure dans `CLAUDE.md` (« Le client écoute aussi `session_expired`, qu'aucun serveur n'émet ») mais n'existe nulle part dans `frontend/`** (recherche exhaustive, zéro occurrence hors `CLAUDE.md`). Le comportement réel de coupure est porté par deux chemins distincts et déjà nommés : le minuteur d'inactivité local (`socketManager.js:68-100`) et `force_disconnect` (`socketManager.js:53-57`, `src/realtime/app/chat/index.mjs:23-37`) — la documentation du dépôt décrit un troisième mécanisme qui n'a jamais existé côté client. À corriger dans `CLAUDE.md`, pas dans le code.
- **Le minuteur d'inactivité de 10 minutes EST réarmé par l'activité (`socketManager.js:71-89`, `pointerdown`/`keydown`/`visibilitychange`), contrairement à ce qu'affirment `CLAUDE.md` (« nothing rearms it ») et `design/ui-requirements.md` UI-NAV-6 (« non réarmée, écart connu »)** — mais seulement pour l'activité sur le document du tableau de bord. Comme le jeu vit dans un `<iframe>` avec son propre document (`UI-NAV-5`), les frappes et pointeurs pendant une manche active ne réarment jamais ce minuteur, et une session de jeu prolongée peut donc perdre sa connexion de chat en silence malgré une activité continue au sens du produit. Deux constats à trancher séparément : corriger la documentation obsolète, et décider si l'activité dans l'`<iframe>` doit réarmer le minuteur du parent (`postMessage` depuis `game.html`, symétrique à celui déjà utilisé pour les invitations) — décision qui n'appartient pas à cette spec.
- **La présence en ligne n'a pas d'alternative visible à la couleur pour une personne voyante daltonienne.** `dashboard.js:1304-1309` (le second signal existe, mais seulement en `aria-label`, donc uniquement pour les technologies d'assistance) et `dashboard.css:238-252` (même forme, même taille, seule la teinte change). `UI-SOC-9` et `design/accessibility-requirements.md` § 1 exigent nommément ce second signal pour la présence en ligne — à ajouter (texte visible, ou forme distincte de la pastille), décision de contenu/visuel qui n'appartient pas à cette spec seule.
- **`avatar_url` absent de `sessionStorage` ne produit aucun repli visuel** : `dashboard.js:33-34,83-90` interpole la valeur telle quelle dans `src="${avatarUrl}"`, ce qui pose `src="null"` (chaîne littérale) sur une image cassée dans le rond d'avatar de 50 px de l'en-tête — jamais un avatar par défaut, jamais une initiale. `avatar_url` est documenté par `CLAUDE.md` comme « inconsistent in DB » selon le chemin d'inscription : un compte concerné verrait cette image cassée à chaque ouverture du tableau de bord.
- **Un échec sur un seul des trois appels réseau (`/api/friends/`, `/api/get-friend-requests/`, `/api/blocked-users/`) affiche le même message d'erreur générique sur les trois listes** (`Promise.all`, `dashboard.js:1124-1135,1218-1231`) — la personne ne peut pas savoir laquelle des trois informations a réellement échoué à charger. Décision technique (séparer les trois requêtes en échecs indépendants) qui n'appartient pas à cette spec.
- **Le libellé visible du premier onglet (« Friends ») et son identifiant technique (`#tab-online`, `id="online-friends"`, `UI-SOC-2` : « en ligne ») ne décrivent pas la même chose que ce que la liste contient réellement.** `dashboard.js:1162-1166` affiche délibérément *tous* les amis, en ligne ou non (commentaire du code : « Display ALL friends (not just online ones) »), distingués seulement par la pastille de statut sur chaque ligne. L'exigence `UI-SOC-2` nomme cet onglet « en ligne » ; le produit livré est plus large (« tous mes amis »), ce qui est probablement le bon choix produit — mais le nom de l'exigence, l'identifiant du sélecteur et le libellé visible racontent trois choses légèrement différentes. À clarifier dans `design/ui-requirements.md`, pas dans le code.
