# UX Spec: Login

> **Status**: In Design
> **Author**: phudyka + ux-designer
> **Last Updated**: 2026-08-20
> **Platform Target**: Web — ordinateur (clavier + souris) d'abord, téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-AUTH-2, UI-AUTH-3, UI-AUTH-4, UI-AUTH-5, UI-AUTH-8
> **Journey Phase(s)**: Parcours B, phase 1 (Retour) — état émotionnel « impatience : la partie est le but, pas l'écran ». Également atteint, sans phase nommée séparément dans `design/player-journey.md`, par la garde de route protégée qui couvre les phases 3 à 7 (`/dashboard`, `/settings`, `/profile`). Absent du Parcours A (`design/player-journey.md`, tableau « États émotionnels par écran », ligne `/login` : « — »).
> **Template**: UX Spec

---

## Purpose & Player Need

La personne arrive en voulant rejouer tout de suite : elle a déjà un compte,
elle connaît déjà le jeu, et ce formulaire est le seul obstacle entre elle et
la partie qu'elle est venue chercher. Personne ne vient sur `/login` pour lui-
même — c'est un péage, pas une destination.

---

## Player Context on Arrival

Deux provenances mènent ici, et l'écran ne les distingue jamais.

**Parcours B, arrivée volontaire (phase 1, « Retour »).** Ami ou camarade de
promo qui a déjà un compte, tape l'URL ou clique « Log in » depuis l'accueil.
Elle sait précisément pourquoi elle est là et ce qu'elle veut : entrer ses
identifiants et retrouver le tableau de bord le plus vite possible. C'est
l'unique état que `design/player-journey.md` nomme pour cet écran :
« impatience ».

**Arrivée involontaire, par garde de route (UI-AUTH-8).** Une personne qui
tapait `/dashboard`, `/settings` ou `/profile` sans session active est
redirigée ici sans préavis (`frontend/src/app.js:34-37`). Elle ne sait pas
nécessairement qu'elle a été redirigée — rien à l'écran ne le lui dit, aucun
message, aucune bannière, aucun paramètre d'URL. Sa session a pu simplement
expirer, ou avoir été coupée par la règle « une seule session par nom »
(`design/player-journey.md`, point de friction n° 2) sans qu'elle ait rien
fait de son côté. Cette personne peut donc arriver perplexe plutôt
qu'impatiente, et le formulaire qu'elle voit est strictement identique à celui
de l'arrivée volontaire — même titre, même tagline, aucun indice contextuel.

**Parcours A.** Le visiteur de portfolio n'atteint jamais cet écran dans son
parcours documenté : sa preuve technique se joue sur `/` et `/game.html`, sans
compte (`design/player-journey.md`, phases A2-A3). Il reste mécaniquement
possible qu'il clique « Log in » depuis l'accueil par curiosité — le bouton
est public — mais ce sous-cas n'est pas un point du parcours A tracé par le
document de référence, et cette spec ne lui invente pas d'état émotionnel
propre.

---

## Navigation Position

Route `/login`, entrée à plat dans le routeur, sans imbrication
(`frontend/src/app.js:64-70`). Elle n'est jamais accessible avec une session
active : la même garde que sur `/` et `/register` la court-circuite vers
`/dashboard` avant même de peindre le formulaire. C'est aussi l'unique cible
de repli de toute route protégée sans session (`PROTECTED_ROUTES`,
`frontend/src/app.js:13,34-37`) — `/login` a donc deux familles de provenance
qui aboutissent au même écran sans jamais s'y distinguer (voir Player Context
on Arrival).

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| `/` (accueil, démo jouable) | clic sur « Log in » (`#home-login`, `frontend/src/views/home.js:28-30,54-57`) | Vient de voir ou jouer la démo solo sans compte ; aucune session, aucun champ pré-rempli. |
| `/dashboard`, `/settings` ou `/profile` sans session, tapée ou atteinte par un lien | garde de route (`frontend/src/app.js:34-37` à l'ouverture, `:105-108` via `navigateTo`) | Croyait accéder à une page protégée ; rien ne le lui confirme (voir Player Context on Arrival). |
| `/login` tapée directement dans la barre d'adresse | navigation navigateur | Session absente → écran normal ; session présente → redirection immédiate vers `/dashboard`, l'écran ne se peint jamais (`app.js:64-70`). |
| Retour navigateur (`popstate`) depuis `/register` ou `/` | bouton précédent | Champs vides — chaque appel de `login()` reconstruit le DOM à neuf (`frontend/src/views/login.js:20-86`), rien n'est restauré d'un passage à l'autre. |
| Retour du flux OAuth 42, `?auth_success=true&access=…&refresh=…&username=…` dans l'URL | redirection serveur depuis `/api/auth/42/callback/` (`src/django/app/pong/views.py:496-…`) | Chemin jamais exercé (clé d'intra périmée). Si les paramètres attendus sont présents, l'écran ne s'affiche jamais : bascule immédiate vers `/dashboard` avant tout rendu (`login.js:188-217`). |

| Exit Destination | Trigger | Notes |
|---|---|---|
| `/dashboard` | soumission réussie (`data.success === true`) | Toujours cette destination, jamais celle d'où venait une redirection protégée (voir Open Questions). |
| `/register` | clic sur « Create account » (`#create_account`) | Changement de route côté client, aucun appel réseau. |
| `/` (accueil, démo) | clic sur « Back to the demo » (`#back_to_demo`) | Changement de route côté client, aucun appel réseau. |
| domaine externe `api.intra.42.fr` | clic sur « Login with 42 » (`#login_with_42`) | Quitte entièrement la SPA (`window.location.href`). Chemin jamais exercé, comportement réel non vérifié (voir Open Questions). |
| reste sur `/login` | soumission échouée (identifiants incorrects, timeout, réseau injoignable) | `#loginError` porte le message ; les champs conservent ce qui a été saisi, rien ne les vide. |

---

## Layout Specification

### Information Hierarchy

Logo décoratif, puis titre de marque (Bebas Neue, Orange Couchant), puis
tagline d'une ligne, puis le panneau de formulaire — les deux champs d'abord,
l'action principale (« Login ») juste après, les trois actions secondaires
empilées dessous dans un ordre fixe (42, créer un compte, retour à la démo) —
puis le pied de page. Rien ne hiérarchise « Login » au-dessus des trois autres
boutons au-delà de sa position et de sa variante visuelle (`.btn-primary`) :
les quatre partagent la même largeur et la même hauteur minimale.

Aucun `autofocus` n'est posé sur `#username`
(`frontend/src/views/login.js:36-44`) : une personne au clavier qui arrive en
état d'impatience (le mot exact du parcours B) doit d'abord cliquer ou tabuler
dans le champ avant de taper — un geste de plus que ce que l'état émotionnel
documenté laisserait attendre.

Cet écran ne porte pas l'en-tête applicatif persistant que `docs/DESIGN.md`
décrit pour la coquille authentifiée (colonne pleine hauteur, en-tête fixe
~60 px) : `/login`, comme `/register`, est une page hors-coquille, sans nav ;
seul le pied de page ferme la mise en page.

### Layout Zones

- **Zone Marque** — logo (`#logo_pong_login`), titre (`.login-title`), tagline
  (`.login-tagline`) : centrés, en haut du flux, directement sur le fond nuit
  de `.login-container`.
- **Zone Formulaire** — panneau `#loginForm`, fond fumée
  (`--panel-smoke`), rayon `--radius-lg` : les deux champs, la ligne d'erreur
  conditionnelle, puis les quatre boutons empilés pleine largeur (`max-width:
  450px`).
- **Zone Pied de page** — une ligne de texte (`--muted-sand`), hors du
  panneau.

Aucune media query ne régit `frontend/src/css/login.css` (fichier entier lu,
zéro `@media`) : la mise en page est fluide par construction — `clamp()` sur
la taille du titre, `max-width` en pourcentage sur le formulaire — pas par
rupture de palier comme `dashboard.css` ou `game.css`.

### Component Inventory

| Composant | Motif (`design/ux/interaction-patterns.md`) | Sélecteur | État par défaut |
|---|---|---|---|
| Logo | — (image statique, décorative) | `#logo_pong_login` | affiché, `alt=""` |
| Titre | — (texte statique) | `.login-title` | affiché |
| Tagline | — (texte statique) | `.login-tagline` | affiché |
| Champ nom de compte | [Champ de saisie](interaction-patterns.md#champ-de-saisie) | `#username` | Default, vide, `required` |
| Champ mot de passe | [Champ de saisie](interaction-patterns.md#champ-de-saisie) | `#password` | Default, vide, `type="password"`, `required` |
| Bouton de démasquage | [Champ de saisie](interaction-patterns.md#champ-de-saisie) (bouton icône intégré) | `.unmask` | `aria-pressed="false"`, `LOCK_ICON` |
| Ligne d'erreur | [Champ de saisie](interaction-patterns.md#champ-de-saisie) (erreur associée) | `#loginError` | `hidden`, vide |
| Bouton Login | [Bouton](interaction-patterns.md#bouton) — primaire | `#login_button` | Default, `type="submit"` |
| Bouton Login with 42 | [Bouton](interaction-patterns.md#bouton) — primaire (fond recouvert par `#login_with_42`) | `#login_with_42` | Default |
| Bouton Create account | [Bouton](interaction-patterns.md#bouton) — contour | `#create_account` | Default |
| Bouton Back to the demo | [Bouton](interaction-patterns.md#bouton) — secondaire | `#back_to_demo` | Default |
| Pied de page | — (texte statique) | `footer` | affiché |

### ASCII Wireframe

Bureau (1440 × 900) — mise en page identique, seule la proportion change :

```
+----------------------------------------------------------------------+
|                                                                        |
|                          [ logo 150x150 ]                             |
|                        FT_TRANSCENDENCE                                |
|                                                                         |
|        Pong in 3D — solo against the AI, two or four online,           |
|                        or a tournament.                                |
|                                                                         |
|            +--------------------------------------------+             |
|            |  Account name                               |             |
|            |  [ Enter Account name__________________ ]   |             |
|            |                                              |             |
|            |  Password                                    |             |
|            |  [ Enter Password____________________ (o) ]  |  (o) = démasquage, 44px |
|            |                                              |             |
|            |  ( #loginError — masqué par défaut )         |             |
|            |                                              |             |
|            |  [               Login                   ]  |  primaire   |
|            |  [           Login with 42                ]  |  primaire (fond recouvert) |
|            |  [           Create account                ]  |  contour    |
|            |  [          Back to the demo                ]  |  secondaire |
|            +--------------------------------------------+             |
|                                                                         |
|                 ft_transcendence — a 3D Pong by phudyka                 |
+----------------------------------------------------------------------+
```

Téléphone (390 × 844) — même empilement, panneau pleine largeur sous
padding `--space-lg` :

```
+------------------------------------+
|                                     |
|          [ logo 150x150 ]          |
|         FT_TRANSCENDENCE            |
|                                      |
|  Pong in 3D — solo against the AI,  |
|    two or four online, or a         |
|          tournament.                |
|                                      |
| +----------------------------------+ |
| | Account name                     | |
| | [Enter Account name___________]  | |
| |                                   | |
| | Password                         | |
| | [Enter Password________ (o)]     | |
| |                                   | |
| | ( #loginError — masqué )         | |
| |                                   | |
| | [           Login             ]  | |
| | [       Login with 42          ]  | |
| | [       Create account         ]  | |
| | [      Back to the demo        ]  | |
| +----------------------------------+ |
|                                      |
|   ft_transcendence — a 3D Pong       |
|            by phudyka                |
+------------------------------------+
```

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| Default | ouverture de `/login` sans session | Formulaire vide, `#loginError` `hidden`, boutons au repos. |
| Focus initial | rendu terminé | `announceRoute("Log in")` pose le focus sur `<h1>` (`tabIndex=-1`, `login.js:91`, `app.js:18-24`) — voir Accessibility pour la limite de cette annonce. |
| Champ requis vide à la soumission | clic sur « Login » ou `Entrée` alors qu'un champ `required` est vide | Validation HTML5 **native** du navigateur : la soumission est bloquée avant même que `handleLogin` ne s'exécute, une bulle stylée par le navigateur (pas par le système de design) désigne le champ. C'est l'état « vide » de cet écran : il n'y a pas de collection à afficher vide, seulement des champs non remplis. |
| Loading (réveil possible de l'API) | soumission valide envoyée | `setBusy(#login_button, true, "Signing in… (waking the server)")` — opacité 0,65, curseur `progress`, `aria-busy="true"`, libellé remplacé, bouton `disabled`. Dure jusqu'à la réponse du serveur ou jusqu'à `WAKE_UP_MS` = **60 000 ms** (`login.js:12,139`). Aucun compteur, aucune barre de progression pendant cette attente : le libellé reste identique de la première à la dernière milliseconde — à la différence de l'[Écran d'attente d'adversaire](interaction-patterns.md#écran-dattente-dadversaire) du jeu, qui affiche un compteur de secondes vivant. Ce que le code fait réellement pendant ce temps (attendre une réponse HTTP à `/api/login/`) n'est jamais dit à la personne au-delà du mot « waking » — voir Open Questions. |
| Error — identifiants incorrects | `data.success === false` (HTTP 401 ou 500, `src/django/app/pong/views.py:73,78`) | `#loginError` affiché, texte = `data.message` du serveur (« Account name or password incorrect » ou « An error occurred ») ou repli « Wrong account name or password. » (`login.js:169`). Aucune distinction entre compte inconnu et mot de passe erroné — `authenticate()` répond de façon générique dans les deux cas. |
| Error — timeout (60 s) | `AbortSignal.timeout(60000)` déclenché | `#loginError` : « The server did not answer within a minute. It is hosted on a free tier and may still be starting — try again. » (`login.js:174-176`). |
| Error — réseau injoignable | `fetch` rejette pour une raison autre qu'un timeout (hors ligne, DNS, CSRF non obtenu) | `#loginError` : « Could not reach the server. Check your connection and try again. » (`login.js:176-177`). Couvre aussi l'échec de `getCsrfToken()` (`utils/token.js:5-15`), qui lève avant même d'atteindre `/api/login/`. |
| Password masqué (défaut) | repos | `type="password"`, `LOCK_ICON`, `aria-pressed="false"`, `aria-label="Show password"`. |
| Password visible | clic sur `.unmask` | `type="text"`, `LOCK_OPEN_ICON`, `aria-pressed="true"`, `aria-label="Hide password"` (`utils/unmask.js:6-16`). Bascule locale, aucun appel réseau. |
| Session déjà active | `sessionStorage.getItem("username")` non nul à l'ouverture de `/login` | L'écran ne se peint jamais : redirection immédiate vers `/dashboard` (`app.js:64-70`). Il n'existe donc pas de variante « déjà connecté » visible — c'est une absence totale de rendu. |
| Retour d'un `postMessage`/callback 42 valide | `?auth_success=true` avec `access`, `refresh`, `username` présents | Idem : aucun rendu du formulaire, bascule immédiate vers `/dashboard` (`login.js:188-217`). |

**Peint vs. répond, par contrôle.** `login()` construit le DOM par `innerHTML`
puis appelle `attachEventLoginPage()` de façon strictement synchrone, dans le
même appel de fonction (`login.js:88-90`, commentaire du code lui-même sur la
suppression d'un `setTimeout(0)` devenu inutile) : les deux champs, le bouton
de démasquage et les quatre boutons sont peints et actionnables à la même
milliseconde — aucun état « visible mais inerte » sur cet écran à l'ouverture.
Le passage en état `Loading` suit la même règle : `setBusy()` est appelé
**avant** l'`await fetch(...)` (`login.js:139-141`), donc le bouton est
visuellement occupé et fonctionnellement désactivé au même instant.

---

## Interaction Map

**Ordre de focus (`Tab`), numéroté :**

1. `#username`
2. `#password`
3. `.unmask` (bouton de démasquage)
4. `#login_button` (« Login », `type="submit"`)
5. `#login_with_42` (« Login with 42 »)
6. `#create_account` (« Create account »)
7. `#back_to_demo` (« Back to the demo »)

`#loginError` n'est jamais focalisable (c'est un `<p role="alert">`, pas un
élément interactif) et n'entre donc jamais dans cet ordre. `Shift+Tab`
parcourt la même liste à l'envers ; c'est le comportement natif du navigateur,
rien n'est reconstruit en JavaScript.

**Clavier**

- `Entrée` dans `#username` ou `#password` déclenche la soumission native du
  formulaire — un seul bouton du formulaire porte `type="submit"`
  (`#login_button`), donc aucune ambiguïté sur quel bouton répond à `Entrée`.
- `Espace`/`Entrée` sur `.unmask`, `#login_with_42`, `#create_account`,
  `#back_to_demo` activent nativement le bouton ciblé.
- `Escape` : sans effet sur cet écran — aucun menu déroulant, aucune modale,
  aucun panneau flottant n'y existe à fermer.
- Anneau de focus : `outline: 3px solid var(--sun-gold)`, décalé de 2 px,
  jamais redéfini par `login.css` (fichier lu en entier, aucune règle
  `outline`) — hérité tel quel de `tokens.css:83-87`.

**Pointeur**

- Survol des boutons : assombrissement de l'aplat et agrandissement à 1,05
  (`--ease-color`, `--ease-transform`), motif [Bouton](interaction-patterns.md#bouton)
  standard, aucune variante propre à cet écran.
- Survol des champs : bordure `--lava-orange-soft` (`tokens.css:189-191`).

**Tactile**

Aucune cible de cet écran n'exige de précision de pointeur. Toutes les cibles
mesurent au moins 44 px : `.btn` via `min-height: var(--tap-min)`
(`tokens.css:139`), `.unmask` via `width/height: var(--tap-min)`
(`tokens.css:216-217`). Les champs de saisie n'ont pas de hauteur minimale
posée explicitement sur le jeton `--tap-min`, mais leur remplissage
(`padding: 12px`, taille de texte 16 px) produit une hauteur rendue d'environ
48 px — au-dessus du plancher, sans que la règle ne le garantisse par
construction. Aucune zone tactile de jeu (`#touch-controls`) n'existe sur cet
écran : elles sont propres à `/game.html`.

---

## Events Fired

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Frappe dans `#username` / `#password` | aucun | Validation cliente native (`required`) seulement ; aucun appel avant soumission. |
| Clic sur le bouton de démasquage | aucun | Bascule locale du DOM (`type`, icône, `aria-pressed`/`aria-label`) ; aucun appel réseau. |
| Soumission du formulaire (submit natif ou clic sur « Login ») | `POST /api/login/` | `{ username, password }` en JSON ; en-têtes `Content-Type: application/json`, `X-CSRFToken` (obtenu par un appel préalable `GET /api/set-csrf-token/`) ; `credentials: "include"` ; `AbortSignal.timeout(60000)`. |
| Réponse `data.success === true` | `POST /api/update-online-status/` | `Authorization: Bearer {access}` ; déclenché **après** `navigateTo("/dashboard")`, pas avant — voir Open Questions. |
| Clic sur « Login with 42 » | aucun `fetch` — navigation de document complète | `window.location.href = "/api/auth/42/login/"` (`login.js:184-185`), qui redirige (302, côté serveur) vers `https://api.intra.42.fr/oauth/authorize?client_id=…&redirect_uri=…&response_type=code&scope=public` (`src/django/app/pong/views.py:485-494`). Chemin jamais exercé (clé d'intra périmée) ; comportement réel non vérifié. |
| Clic sur « Create account » | aucun | `navigateTo("/register")`, changement de route côté client. |
| Clic sur « Back to the demo » | aucun | `navigateTo("/")`, changement de route côté client. |
| Arrivée avec `?auth_success=true&access=…&refresh=…&username=…` | aucun appel réseau côté client | Lecture de `URLSearchParams`, écriture directe en `sessionStorage`, puis `navigateTo("/dashboard")` et nettoyage de l'URL par `history.replaceState` (`login.js:188-217`). |

---

## Transitions & Animations

- **Entrée sur l'écran.** Aucune transition dédiée : `innerHTML` remplace le
  contenu de `#ft_transcendence` de façon instantanée. `login.css` ne déclare
  aucun `@keyframes` (fichier lu en entier).
- **Sortie de l'écran.** Identique — remplacement instantané par la vue
  suivante, aucune transition de sortie déclarée.
- **Survol des boutons.** Fondu de couleur `--ease-color` (300 ms) et
  agrandissement `--ease-transform` (200 ms) — motif
  [Bouton](interaction-patterns.md#bouton) standard, hérité de `tokens.css`.
- **`prefers-reduced-motion: reduce`.** Rien à neutraliser en propre à cet
  écran : aucune boucle décorative n'y existe (pas de pulsation, pas de
  halo). L'agrandissement au survol des boutons est neutralisé globalement
  (`*:hover { transform: none !important; }`, `tokens.css:123-125`) ; le
  fondu de couleur reste, sans règle spécifique à `login.css`.
- **Transition déclarée sans effet.** `#logo_pong_login` porte `transition:
  transform var(--ease-color);` (`login.css:37`), mais aucune règle de la
  feuille (lue en entier) ne change sa valeur de `transform` — au survol, au
  focus ou ailleurs. La transition ne s'exécute jamais ; comparable au Gap n°4
  déjà consigné dans `design/ux/interaction-patterns.md` pour
  `score-appear`.

---

## Data Requirements

| Data | Source System | Read / Write | Update trigger | Null handling |
|---|---|---|---|---|
| Nom de compte saisi | saisie locale (aucun système) | Write (`#username.value`) | frappe clavier | `required` : soumission native bloquée si vide, `handleLogin` n'est jamais invoqué. |
| Mot de passe saisi | saisie locale | Write (`#password.value`) | frappe clavier | idem, `required`. |
| Jeton CSRF | Django, `GET /api/set-csrf-token/` | Read, refait à chaque tentative (jamais mis en cache) | chaque soumission | échec → `getCsrfToken()` lève, capté par le `catch` de `handleLogin`, message générique « Could not reach the server… ». |
| Jetons JWT (`access`, `refresh`) | Django, `POST /api/login/` | Write (`sessionStorage`) | `data.success === true` | aucune vérification que `data.access`/`data.refresh` sont non vides avant l'écriture (`login.js:154-155`). |
| `username`, `display_name`, `avatar_url` | idem | Write (`sessionStorage`) | idem | aucun repli si le champ est absent de la réponse serveur (`login.js:156-158`). |
| Message d'erreur affiché | `data.message` (Django) ou message client fixe | Read puis Write dans `#loginError` | échec de connexion, timeout, réseau | `data.message` absent → repli sur « Wrong account name or password. » (`login.js:169`). |
| Session existante | `sessionStorage.getItem("username")` | Read | à chaque appel du routeur | absente → l'écran s'affiche ; présente → redirection vers `/dashboard`, écran jamais peint (`app.js:64-70`). |
| Paramètres de retour OAuth 42 | query string posée par la redirection Django depuis `/api/auth/42/callback/` | Read | à l'ouverture de `/login` | `auth_success` absent/faux, ou `access`/`refresh`/`username` manquants → `check42AuthParams()` retourne silencieusement `false`, le formulaire normal s'affiche sans aucune indication qu'une tentative 42 a précédé (`login.js:188-217`). |

---

## Accessibility

**Ordre de focus.** Voir Interaction Map — sept arrêts, `#loginError` exclu
car non focalisable.

**Ratios de contraste chiffrés** (valeurs des jetons de `frontend/src/css/tokens.css`,
calculées selon la formule de luminance relative WCAG) :

| Paire | Valeurs | Ratio | Seuil requis | Conforme |
|---|---|---|---|---|
| `--sunset-orange` sur `--night` (titre) | #ff8c00 / #121212 | 8,04:1 | 3:1 (texte large) | oui |
| `--paper` sur `--night` (tagline) | #e0e0e0 / #121212 | 14,2:1 | 4,5:1 | oui |
| `--lava-orange` sur la fumée du formulaire (labels) | #ff5722 / `--panel-smoke` composé sur `--night` (≈#1f1f1f) | 5,20:1 | 4,5:1 | oui |
| `--chalk` sur `--field-slate` (texte saisi) | #ffffff / #2a2a2a | 14,35:1 | 4,5:1 | oui |
| `--muted-sand` sur `--field-slate` (placeholder) | #888888 / #2a2a2a | 4,05:1 | 4,5:1 | limite — sous le seuil du texte courant, mais le `<label>` associé porte déjà l'information, non bloquant |
| `--on-accent` sur `--lava-orange` (bouton Login) | #121212 / #ff5722 | 5,93:1 | 4,5:1 | oui |
| `--on-accent` sur `--sunset-orange` (bouton Login with 42) | #121212 / #ff8c00 | 8,04:1 | 4,5:1 | oui |
| `--lava-orange` sur la fumée (bouton Create account, contour) | #ff5722 / ≈#1f1f1f | 5,20:1 | 4,5:1 | oui |
| `--paper` sur `--field-slate` (bouton Back to the demo) | #e0e0e0 / #2a2a2a | 10,87:1 | 4,5:1 | oui |
| `--coral-red-text` sur la fumée (`#loginError`) | #ff7a70 / ≈#1f1f1f | 6,48:1 | 4,5:1 | oui |
| Anneau de focus `--sun-gold` sur `--night` | #ffcc00 / #121212 | 12,4:1 | 3:1 (indicateur non textuel) | oui |
| Bordure `--field-border` sur `--field-slate` (champ au repos, sans survol ni focus) | #3e3e3e / #2a2a2a | ≈1,34:1 | 3:1 (bordure d'élément interactif, socle Standard) | **non** |
| `--field-slate` sur la fumée du panneau (silhouette du champ au repos) | #2a2a2a / ≈#1f1f1f | ≈1,15:1 | 3:1 | **non** |

Les deux dernières lignes concernent la limite visuelle du champ, pas son
texte : tout le texte de l'écran passe le seuil. Un champ n'est distingué de
son panneau, au repos, ni par sa bordure ni par son fond — seuls le `<label>`
et le texte indicatif au-dessus/dedans le signalent. Une personne qui perçoit
mal les contours plutôt que le texte n'a donc pas de repère visuel avant de
survoler ou de focaliser le champ. C'est une valeur de jeton
(`--field-slate`, `--field-border`, `--panel-smoke`), pas un choix
d'interaction : hors du périmètre de cette spec, à signaler à
`art-director`.

**Annonces lecteur d'écran, propres à cet écran :**

| Changement d'état | Annonce | Politesse | Statut réel |
|---|---|---|---|
| Arrivée sur `/login` | titre d'onglet mis à jour + focus posé sur `<h1>` | — | le texte du `<h1>` reste « ft_transcendence » (la marque), jamais « Log in » — l'annonce au focus ne nomme pas l'écran. Écart avec la ligne « Changement de route SPA » de `design/accessibility-requirements.md:57`. |
| Échec de connexion (identifiants, timeout, réseau) | texte de `#loginError` | `assertive` (`role="alert"` implicite) | conforme au motif [Champ de saisie](interaction-patterns.md#champ-de-saisie). |
| Bascule de visibilité du mot de passe | `aria-pressed` + `aria-label` du bouton | aucune région live dédiée, portée par le bouton focalisé au moment de l'action | conforme au motif du catalogue. |
| Début de l'attente de connexion (réveil possible de l'API) | libellé de `#login_button` remplacé, `aria-busy="true"` | aucune région live dédiée | non couvert par la table de `design/accessibility-requirements.md` ; l'annonce dépend du focus resté sur le bouton, comportement natif non garanti identique entre lecteurs d'écran. |

**Alternative non colorée.** Aucun signal de cet écran ne repose sur la
couleur seule : l'erreur est un texte, la bascule mot de passe change une
icône et un `aria-label`, l'état occupé change un libellé de bouton. Rien à
corriger ici — à la différence d'autres écrans du projet (présence en ligne,
issue de match), ce formulaire n'a pas de signal purement coloré à
doubler.

**Taille des cibles.** Voir Interaction Map : tous les boutons et le bouton
de démasquage atteignent 44 × 44 px via `--tap-min` ; les champs de saisie
l'atteignent par leur remplissage sans que la règle ne le garantisse
explicitement.

**Focus à l'ouverture.** Posé sur `<h1>` (`tabIndex=-1`, `focus({preventScroll:
true})`) par `announceRoute("Log in")` — voir la limite d'annonce ci-dessus.

**Focus à la fermeture.** Aucune gestion explicite : le remplacement
d'`innerHTML` lors de la navigation retire les éléments focalisés du DOM ; le
focus retombe sur `<body>` jusqu'à ce que la vue suivante pose le sien via sa
propre `announceRoute`. Comportement générique du routeur, partagé par tous
les écrans — pas une particularité de `/login`.

---

## Localization Considerations

L'interface de cet écran est entièrement en **anglais** — titre, tagline,
libellés, boutons, et les trois messages d'erreur générés côté client
(`login.js:169,174-177`) comme celui renvoyé par Django (`success: false`).
Cette documentation, elle, est en français : les deux langues coexistent par
construction du projet (interface anglaise, docs françaises), pas par
mélange dans l'écran lui-même.

| Élément | Texte actuel | Longueur | Risque de casse à +40 % |
|---|---|---|---|
| Titre `<h1>` | « ft_transcendence » | 16 | Nom de marque, non traduit — sans objet. |
| Tagline | « Pong in 3D — solo against the AI, two or four online, or a tournament. » | ≈70 | Contrainte `max-width: 34ch` déjà posée (`login.css:29`) ; le texte enveloppe sur plusieurs lignes, aucune hauteur fixe ne le coupe. |
| Label « Account name » / « Password » | 12 / 8 | Flux normal, aucun risque. |
| Bouton « Login » | 5 | `.btn` n'a pas de `white-space: nowrap` — enveloppe si besoin plutôt que de tronquer. |
| Bouton « Login with 42 » | 13 | idem. |
| Bouton « Create account » | 14 | idem. |
| Bouton « Back to the demo » | 17 | idem. |
| Erreur — identifiants incorrects | « Account name or password incorrect » | 34 | `.field-error` (`tokens.css:240-244`) n'a pas de `max-width` propre ; hérite de la largeur de `#loginForm` (≈560 px en bureau, ≈310 px sur 390 px de large) — enveloppe. |
| Erreur — timeout | « The server did not answer within a minute. It is hosted on a free tier and may still be starting — try again. » | ≈109, la plus longue de l'écran | À +40 % (~153 caractères), tiendrait sur 3-4 lignes dans la largeur disponible, sans troncature (`white-space` non contraint) ni chevauchement. |
| Erreur — réseau injoignable | « Could not reach the server. Check your connection and try again. » | ≈64 | Idem, sans risque. |
| `aria-label` démasquage | « Show password » / « Hide password » | texte non visible, aucun risque de mise en page | — |

---

## Acceptance Criteria

1. Sur un compte valide et un serveur déjà réveillé, les deux champs et les
   quatre boutons sont peints et actionnables en moins de **100 ms** après
   l'arrivée sur `/login` — hors réveil de l'API, délai serveur nommé
   séparément (jusqu'à `WAKE_UP_MS` = 60 000 ms, `login.js:12`), pas une
   lenteur d'affichage de l'écran.
2. À **1440 × 900** et à **390 × 844**, le logo, le titre, la tagline, les
   deux champs et les quatre boutons restent visibles sans chevauchement ni
   débordement horizontal, le formulaire ne dépassant jamais 600 px de large
   (`login.css:49`).
3. **Aucun élément interactif n'est visible avant d'être actionnable** : le
   marquage et les écouteurs d'événements sont posés dans le même appel
   synchrone (`login.js:88-90`), sans état intermédiaire où un bouton serait
   affiché sans gestionnaire.
4. Toute la traversée — nom de compte, mot de passe, démasquage, soumission,
   « Login with 42 », « Create account », « Back to the demo » — est
   atteignable au clavier seul, dans l'ordre documenté en Interaction Map,
   avec l'anneau de focus visible sur chaque élément.
5. Une tentative de connexion avec des identifiants incorrects affiche le
   message d'erreur dans `#loginError` dès la réponse du serveur reçue, sans
   jamais utiliser `alert()` (UI-AUTH-4).
6. La bascule de visibilité du mot de passe change le `type` du champ,
   l'icône et l'`aria-label` (« Show password » ↔ « Hide password ») dans le
   même geste, sans perte de focus (UI-AUTH-3).
7. Une session déjà active empêche toute présentation de ce formulaire :
   `/login` redirige immédiatement vers `/dashboard` (`app.js:64-70`).
8. Une tentative d'accès à `/dashboard`, `/settings` ou `/profile` sans
   session redirige vers `/login` (UI-AUTH-8), et le formulaire obtenu y est
   strictement identique, pixel pour pixel et texte pour texte, à celui
   atteint depuis l'accueil.
9. Chaque paire texte/fond de l'écran atteint au moins 4,5:1 pour le texte
   courant, et l'anneau de focus atteint au moins 3:1 sur chaque fond où il
   apparaît, conformément aux valeurs chiffrées de la section Accessibility.

---

## Open Questions

1. **Le contexte de redirection n'est jamais communiqué.**
   `frontend/src/app.js:34-37` bascule silencieusement vers `/login` sans
   mémoriser la destination visée, et `frontend/src/views/login.js:159`
   renvoie toujours vers `/dashboard` après succès — une personne redirigée
   depuis `/settings` n'y revient jamais après connexion, sans qu'aucun
   message ne l'explique avant ou après. Décision de produit (faut-il porter
   l'intention de destination, par exemple via un paramètre de requête ou
   `sessionStorage` ?) — ne m'appartient pas.
2. **`aria-invalid` n'est jamais posé sur `#username` ni `#password`.**
   `frontend/src/views/login.js:125-181` (fonction `fail()`) ne marque aucun
   champ, alors que `design/accessibility-requirements.md:56` liste
   `#loginError` comme « Existant » pour la ligne « Erreur de formulaire ».
   `design/ux/interaction-patterns.md` (Gaps n° 2) note déjà le même écart
   pour `register.js` ; cette spec confirme qu'il s'étend à la connexion.
   Décision de contenu (quel champ blâmer pour une erreur serveur générique
   qui ne vient d'aucun champ précis) déjà signalée comme non tranchée par le
   catalogue de motifs — ne m'appartient pas non plus.
3. **Le message d'échec ne distingue jamais compte inconnu et mot de passe
   incorrect.** `authenticate()` (`src/django/app/pong/views.py:57-73`)
   répond de façon générique dans les deux cas — un choix de sécurité
   défendable (ne pas révéler l'existence d'un compte), mais qui n'est écrit
   nulle part comme une décision assumée plutôt qu'un oubli. À confirmer côté
   produit.
4. **L'état Loading n'a pas de mesure de progression.** Le bouton affiche un
   seul libellé fixe (« Signing in… (waking the server) ») pour toute la
   durée de l'attente, jusqu'à 60 000 ms (`login.js:12,139`), sans compteur ni
   barre — à la différence du motif [Écran d'attente d'adversaire](interaction-patterns.md#écran-dattente-dadversaire)
   qui affiche un compteur de secondes vivant en `role="status"`.
   `design/ux/interaction-patterns.md` pose déjà cette question dans ses
   propres Open Questions (transposer la barre de progression du chargement à
   cette attente) ; je ne la tranche pas ici, je note en plus qu'aucune
   région `aria-live` dédiée n'accompagne le changement de libellé du bouton
   — aucune ligne de `design/accessibility-requirements.md` ne couvre cet
   état précis.
5. **Suite silencieuse après une connexion réussie.**
   `frontend/src/views/login.js:159-167` appelle `navigateTo("/dashboard")`
   puis, seulement après, `await fetch("/api/update-online-status/", …)` sans
   l'attendre avant de naviguer. Si cet appel échoue, l'erreur retombe dans
   le même `catch` que l'échec de connexion (`login.js:171-177`) et appelle
   `fail()` sur un `#loginError` déjà détaché du DOM — le tableau de bord a
   déjà remplacé `#ft_transcendence`. Rien ne s'affiche, la personne est déjà
   sur `/dashboard`, et `console.error("Login failed:", error)` journalise un
   message trompeur pour un échec qui n'a rien à voir avec la connexion
   elle-même.
6. **Le focus posé à l'ouverture ne nomme pas l'écran.**
   `announceRoute("Log in")` (`login.js:91`) met à jour `document.title` mais
   pose le focus sur `<h1>`, dont le texte reste « ft_transcendence »
   (`login.js:29`) — le nom du site, pas « Log in ». Une personne au lecteur
   d'écran qui arrive ici entend le nom de la marque, pas qu'elle est sur le
   formulaire de connexion. Confirme, pour cet écran précisément, l'écart
   « Changement de route SPA » déjà noté au niveau du projet dans
   `design/accessibility-requirements.md:57`.
7. **Bordure et fond du champ de saisie, sous le seuil de contraste au
   repos.** `--field-border` sur `--field-slate` (≈1,34:1) et `--field-slate`
   sur la fumée du panneau (≈1,15:1) sont tous deux sous le 3:1 exigé par le
   socle Standard pour une bordure d'élément interactif
   (`design/accessibility-requirements.md:36`). Valeur de jeton, pas de
   comportement — à signaler à `art-director`, hors de mon périmètre.
8. **« Login with 42 » : chemin jamais exercé, comportement réel non
   vérifié.** Le clic quitte entièrement la SPA
   (`window.location.href`, `login.js:184-185`) vers
   `/api/auth/42/login/`, qui redirige (302) vers
   `https://api.intra.42.fr/oauth/authorize` avec la clé d'intra périmée
   (`src/django/app/pong/views.py:485-494`). Ce qui s'affiche ensuite dépend
   du service 42 lui-même, hors du contrôle de ce projet et jamais observé en
   conditions réelles (`CLAUDE.md`) — aucun état d'erreur récupérable ne peut
   donc être documenté côté client pour ce chemin : il n'en existe aucun, par
   construction.
9. **Transition CSS déclarée sans effet.** `#logo_pong_login` porte
   `transition: transform var(--ease-color);` (`login.css:37`) mais aucune
   règle de la feuille ne change sa valeur de `transform` — la transition ne
   s'exécute jamais. Comparable au Gap n° 4 déjà consigné dans
   `design/ux/interaction-patterns.md` pour `score-appear`.
