# UX Spec: Écran d'inscription

> **Status**: In Design
> **Author**: phudyka + ux-designer
> **Last Updated**: 2026-08-20
> **Platform Target**: Web — ordinateur (clavier + souris) d'abord, téléphone utilisable (tactile, pointeur grossier). Pas de manette.
> **Accessibility Tier**: Comprehensive (`design/accessibility-requirements.md`)
> **UI Requirements**: UI-AUTH-1, UI-AUTH-3, UI-AUTH-4 (de `design/ui-requirements.md`)
> **Journey Phase(s)**: Parcours A — phase 4 « Sortie ou bascule » ; Parcours B — phase 2 « Première fois » (`design/player-journey.md`)
> **Template**: UX Spec

---

## Purpose & Player Need

La personne arrive en voulant ouvrir un compte au prix le plus court possible,
pour la raison la plus courte qui vaille son temps — voir la suite du jeu
au-delà de la démo (parcours A) ou rejoindre des amis qui jouent déjà
(parcours B) — sans que le formulaire ne lui fasse sentir le coût de cette
décision.

---

## Player Context on Arrival

Elle n'a pas de session ouverte : si elle en avait une, `app.js` la renvoie
immédiatement vers `/dashboard` sans jamais peindre ce formulaire
(`frontend/src/app.js:74-80`). Elle n'apporte donc aucune donnée déjà
saisie d'un écran précédent — le nom qu'elle a pu taper sur `/login` avant de
changer d'avis n'est jamais repris ici ; les deux formulaires ne partagent
aucun état.

**Parcours A — visiteur de portfolio (phase 4).** Elle vient de jouer la
démo solo sur `/`, intention faible : elle teste si le produit vaut la peine
d'un compte, pas l'inverse. Un formulaire qui ressemble à une déclaration
administrative — quatre champs, un choix d'avatar, deux boutons secondaires
— est déjà un coût qu'elle n'avait pas anticipé en cliquant sur « Create
account ».

**Parcours B — joueur qui s'installe (phase 2).** Elle a accepté ce coût
d'entrée avant même d'arriver : un ami lui a parlé du jeu, ou elle vient de
`/login` où elle a découvert qu'elle n'avait pas encore de compte.
Contrairement à ce que résume `design/player-journey.md` (« réveil de
l'API… frappe la phase B1, jamais A2 »), pour cette personne précise
`/register` est souvent le tout premier appel réseau de la session — elle
n'est jamais passée par `/login` avant, donc rien n'a encore réveillé l'API.
Le code le prévoit : `register.js` porte le même délai de 60 000 ms et le
même message de réveil que `login.js`
(`frontend/src/views/register.js:6-7,236`).

---

## Navigation Position

`/register` est une route de premier niveau, au même rang que `/`, `/login`,
`/dashboard`, `/settings`, `/profile` (`frontend/src/app.js:54-86`) — pas de
sous-route, pas de paramètre. Elle n'est protégée dans aucun sens :
`PROTECTED_ROUTES` ne la contient pas (`app.js:13`), et son propre handler
redirige vers `/dashboard` si une session existe déjà (`app.js:74-80`) —
une personne connectée ne peut jamais la voir. Elle est accessible en un
clic depuis `/` et `/login`, jamais depuis une redirection de route
protégée : celles-ci pointent toutes vers `/login`, jamais vers `/register`
(`app.js:34-37`).

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| `/` (accueil, démo jouable) | Clic sur « Create account » (`#home-register`, `views/home.js:31-33,58-61`) | Vient de voir ou d'essayer la démo 3D en solo ; aucune session, aucune donnée de formulaire déjà saisie |
| `/login` | Clic sur « Create account » (`#create_account`, `views/login.js:75-77,100-106`) | Tapait déjà un nom de compte pour se connecter ; ce texte n'est pas repris automatiquement — les deux formulaires ne partagent aucun état |
| URL tapée directement (lien partagé, favori, rafraîchissement) | Navigation directe | Aucune session présumée ; si une session existe (`sessionStorage.username`), `app.js` redirige vers `/dashboard` avant même de peindre ce formulaire (`app.js:74-80`) |
| Redirection depuis une route protégée | — | N'arrive jamais : `PROTECTED_ROUTES` ne redirige que vers `/login` (`app.js:13,34-37`), jamais vers `/register` |

| Exit Destination | Trigger | Notes |
|---|---|---|
| `/dashboard` | Inscription réussie (`data.success === true`) | Connexion automatique : jetons et identité écrits dans `sessionStorage` avant la navigation, aucune étape de login séparée (`register.js:210-228`) |
| reste sur `/register` | Échec — mots de passe différents, refus serveur, timeout réseau | Le formulaire n'est pas réinitialisé ; seul le message d'erreur change (`register.js:175-179,229-238`) |
| `/api/auth/42/login/` (hors SPA) | Clic sur « Register with 42 » | Navigation plein document (`window.location.href`), quitte le routeur ; chemin jamais exercé, clé d'intra 42 périmée (`CLAUDE.md`, `register.js:255-260`) |
| `/` (démo) | Clic sur « Back » | Ne revient jamais vers `/login`, même si c'est de là que la personne vient (`register.js:245-253`) — voir Open Questions |

---

## Layout Specification

### Information Hierarchy

La hiérarchie visuelle est plate, en une seule colonne, sans étapes ni
sections repliables : titre (`h1`, seul élément en Poppins 700 /
`clamp(1.75rem, 6vw, 35px)`), puis quatre groupes de champs traités de façon
identique (label 14 px Orange Lave au-dessus, champ 16 px en dessous), puis
la rangée d'avatars — présentée avec le même poids visuel qu'un champ de
plus, pas comme un moment à part — puis le bloc d'actions. Rien ne
distingue « ce qui est obligatoire pour créer un compte » de « ce qui est un
choix d'expression » : le seul signal que l'avatar diffère des champs texte
est sémantique (`<fieldset>`/`<legend>`), pas visuel. C'est exactement le
risque que nomme `design/player-journey.md` pour la phase A4 (« Formulaire
long alors que l'intention est faible ») : rien dans la mise en page ne
raccourcit perceptivement le formulaire pour une personne à faible
intention — chaque champ pèse le même poids que le suivant.

### Layout Zones

- **Carte** (`.container.register-container`) : colonne centrée, largeur
  100 % plafonnée à 600 px, fond `--night-raised`, remplissage
  `--space-lg`, rayon `--radius-lg`, ombre `--shadow-card`, marge
  `--space-lg auto` (`register.css:7-15`).
- **Zone titre** : `h1.register-title`, centré, Orange Lave.
- **Zone formulaire** : quatre `.form-group` séquentiels (Account name,
  Email, Password + indices, Confirm Password), séparés de `--space-md`.
- **Zone avatar** : `fieldset.choose-avatar` — rangée de sept boutons radio
  en défilement horizontal avec accrochage (motif référencé, voir
  Component Inventory).
- **Zone actions** : `.form-actions`, colonne, `gap: --space-sm`,
  `margin-top: --space-lg` — ligne d'erreur, puis trois boutons pleine
  largeur (Register, Register with 42, Back).
- **Pied de page** : hors de `.register-container`, pleine largeur, centré,
  `--muted-sand`.

Aucune règle `@media` n'existe dans `register.css` : la mise en page est
fluide (pourcentages, `clamp()`, défilement pour la rangée d'avatars) plutôt
que définie par des paliers de rupture — elle ne change pas de structure
entre 1440 px et 390 px, seulement de proportions.

### Component Inventory

| Composant | Motif de référence | Sélecteur réel | État par défaut |
|---|---|---|---|
| Titre d'écran | Nouveau motif (pas de motif « titre d'écran » catalogué) | `h1.register-title` | Statique, reçoit le focus programmatique à l'ouverture |
| Champ « Account name » | [Champ de saisie](../ux/interaction-patterns.md#champ-de-saisie) | `#username.field-input` | Vide, requis, aucun `pattern`/`maxlength` |
| Champ « Email » | [Champ de saisie](../ux/interaction-patterns.md#champ-de-saisie) | `#email.field-input` (`type=email`) | Vide, requis |
| Champ « Password » + bascule | [Champ de saisie](../ux/interaction-patterns.md#champ-de-saisie) (variante Password) | `#password.field-input` + `.unmask` | Vide, masqué, requis |
| Indices de mot de passe | Nouveau motif (liste statique) | `#password-hints.field-hints` | Toujours visible, non lié à une validation réelle (voir Open Questions) |
| Champ « Confirm Password » + bascule | [Champ de saisie](../ux/interaction-patterns.md#champ-de-saisie) | `#confirmPassword.field-input` + `.unmask` | Vide, masqué, requis |
| Rangée d'avatars | [Rangée d'avatars](../ux/interaction-patterns.md#rangée-davatars) | `.avatars` dans `fieldset.choose-avatar` | Avatar 4 sur 7 présélectionné (`i === 3`, `register.js:115`) |
| Ligne d'erreur | [Champ de saisie](../ux/interaction-patterns.md#champ-de-saisie) (état « Erreur associée ») | `#registerError.field-error[role=alert]` | Masquée (`hidden`) |
| Bouton « Register » | [Bouton](../ux/interaction-patterns.md#bouton) (primaire) | `#registerbutton.btn.btn-primary` | Actif |
| Bouton « Register with 42 » | [Bouton](../ux/interaction-patterns.md#bouton) (primaire, variante `.btn-42`) | `#registerbutton42` | Actif, chemin jamais exercé en usage réel |
| Bouton « Back » | [Bouton](../ux/interaction-patterns.md#bouton) (contour, variante locale `.btn-back`) | `#arrowbackregister` | Actif |
| Pied de page | Nouveau motif (texte statique) | `footer.footer` | Statique |

### ASCII Wireframe

```
1440×900 — bureau. register.css ne déclare aucune règle @media : pas de
rupture dédiée, la carte reste à 600px et flotte au centre.

+------------------------------------------------------------------------+
|                                                                          |
|                    +--------------------------------+                   |
|                    |       Create Your Account        |  <- h1, centré  |
|                    |                                   |                |
|                    | Account name                      |                |
|                    | [______________________________]  |                |
|                    |                                   |                |
|                    | Email                              |                |
|                    | [______________________________]  |                |
|                    |                                   |                |
|                    | Password                           |                |
|                    | [__________________________] (o)   |  <- démasquer |
|                    |  - At least 8 characters           |     44x44     |
|                    |  - Not only digits, not common     |                |
|                    |                                   |                |
|                    | Confirm Password                   |                |
|                    | [__________________________] (o)   |                |
|                    |                                   |                |
|                    | Choose your Avatar                 |                |
|                    | (1)(2)(3)[4](5)(6)(7)···→ scroll   |  <- 4 coché   |
|                    |                                   |                |
|                    | [        Register        ]         |                |
|                    | [    Register with 42    ]         |                |
|                    | [          Back          ]         |                |
|                    +--------------------------------+                   |
|                                                                          |
|              ft_transcendence — a 3D Pong by phudyka                    |
+------------------------------------------------------------------------+


390×844 — téléphone. Même structure, pas de réarrangement : la carte prend
la largeur utile (moins les marges --space-lg), les avatars défilent avec
accrochage, environ 3 sur 7 visibles à la fois au lieu de 7 partiellement
visibles sur bureau.

+------------------------------+
| +----------------------------+
| |    Create Your Account     |
| |                            |
| | Account name               |
| | [______________________]  |
| |                            |
| | Email                      |
| | [______________________]  |
| |                            |
| | Password                   |
| | [__________________](o)   |
| |  - At least 8 characters   |
| |  - Not only digits...      |
| |                            |
| | Confirm Password           |
| | [__________________](o)   |
| |                            |
| | Choose your Avatar         |
| | (2)(3)[4] ···→ scroll      |
| |                            |
| | [       Register        ]  |
| | [   Register with 42    ]  |
| | [         Back          ]  |
| +----------------------------+
|                                |
|   ft_transcendence — a 3D      |
|      Pong by phudyka           |
+--------------------------------+
```

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| Default | Ouverture de `/register` sans session | Formulaire vide, avatar 4/7 présélectionné, aucune erreur visible, focus posé sur `h1` (`announceRoute`, `app.js:18-24`) |
| Loading (soumission) | Clic sur « Register » avec le formulaire valide côté client | `#registerbutton` passe `aria-busy="true"`, `disabled`, texte « Creating your account… », jusqu'à 60 000 ms avant timeout (`register.js:6-7,189,206,240`, `feedback.js:64-75`). **Question du timing** : `setBusy()` pose le texte et l'état occupé dans le même appel — rien n'est peint avant d'être exact. Il n'existe en revanche aucune mesure de progression pendant cette attente indéfinie (contrairement à la barre de chargement du jeu) : c'est un état « occupé » pur, pas une jauge |
| Empty | — | Sans objet pour cet écran : `register()` ne fait aucun appel réseau au montage (`register.js:26-153`), il n'y a rien à charger ni de collection pouvant être vide — les sept avatars sont toujours tous là |
| Error — mots de passe différents | Soumission, `password !== confirmPassword` | Bloquée avant tout appel réseau ; `#registerError` affiche « The two passwords do not match. », `aria-invalid="true"` posé sur `#confirmPassword`, focus déplacé dessus (`register.js:175-179`) |
| Error — refus serveur (nom pris / email pris / erreur générique) | Réponse `{success:false}` | `#registerError` affiche le message du serveur ; **`aria-invalid="true"` est posé sur `#confirmPassword` quelle que soit la nature réelle de l'erreur**, et le focus n'est déplacé nulle part (`register.js:229-231`, défini par `fail()` à `:167-171`) — défaut, voir Open Questions |
| Error — timeout / réseau indisponible | 60 000 ms écoulées ou `fetch` en échec | Message distinct selon la cause (« may still be starting » vs « check your connection »), même défaut d'attribution `aria-invalid` que ci-dessus (`register.js:232-238`) |
| Variante — démasquage du mot de passe | Clic sur `.unmask` (password ou confirm) | Voir [Champ de saisie](../ux/interaction-patterns.md#champ-de-saisie) — non repris ici |
| Variante — sélection d'un autre avatar | Clic ou flèche dans le groupe de radios | Voir [Rangée d'avatars](../ux/interaction-patterns.md#rangée-davatars) — non repris ici |
| Variante — « Register with 42 » | Clic sur `#registerbutton42` | Redirection plein document hors SPA ; jamais exercée en usage réel, comportement au-delà du clic non observable (`CLAUDE.md`) |

---

## Interaction Map

**Clavier — ordre de `Tab` numéroté.**

0. À l'arrivée, le focus est posé par programmation sur `<h1 tabindex="-1">`
   (`announceRoute`, `app.js:18-24`). Ce nœud ne fait pas partie de la
   séquence de tabulation : un `Shift+Tab` depuis l'arrêt 1 n'y repasse pas.
1. `#username` (Account name)
2. `#email` (Email)
3. `#password`
4. bouton de démasquage du mot de passe (`.unmask` du champ 3)
5. `#confirmPassword`
6. bouton de démasquage de la confirmation
7. groupe de radios `name="avatar"` — **un seul arrêt de tabulation pour
   les sept** : `Tab` pose le focus sur le radio actuellement coché
   (avatar 4/7 par défaut). `ArrowRight`/`ArrowDown` et
   `ArrowLeft`/`ArrowUp` déplacent le focus **et** la sélection au sein du
   groupe, sans `Enter` — sémantique native du radio, comportement complet
   dans [Rangée d'avatars](../ux/interaction-patterns.md#rangée-davatars),
   non repris ici.
8. `#registerbutton` (« Register »)
9. `#registerbutton42` (« Register with 42 »)
10. `#arrowbackregister` (« Back »)

`#registerError` n'est jamais un arrêt de tabulation, visible ou non : c'est
un `<p role="alert">`, annoncé par sa mise à jour, jamais atteint au
clavier. `Enter` dans n'importe quel champ texte soumet le formulaire
(comportement natif d'un `<form>` à bouton `submit` unique — rien à coder).
`Escape` n'a aucun effet dédié sur cet écran : aucun panneau, menu ou tiroir
ne s'y ouvre.

**Pointeur.** Clic sur un champ le focalise ; clic sur un avatar (le label
englobe l'image, cible réelle 100 × 100 px) le sélectionne ; clic sur un
bouton de démasquage bascule `type=password`/`text` ; clic sur « Register »
soumet ; clic sur « Register with 42 » quitte la SPA ; clic sur « Back »
renvoie à `/`.

**Tactile.** L'écran s'affiche identiquement sous pointeur grossier :
`register.css` ne déclare aucune règle `@media (pointer: coarse)` ni
`(hover: none)`. Toutes les cibles sont déjà ≥ 44 px sans ajustement
dédié — avatars 100 × 100 px, boutons `.btn` à 44 px de hauteur minimale
via le jeton global `--tap-min`, boutons de démasquage fixes à 44 × 44 px
(`tokens.css:211-217`). Aucune interaction n'exige de précision de
pointeur, y compris à 390 × 844.

---

## Events Fired

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Ouverture de `/register` | Aucun — `register()` ne fait aucun appel réseau au montage | — (`register.js:26-153`) |
| Saisie dans un champ texte | Aucun événement applicatif — état DOM natif du champ | — |
| Clic sur une bascule de mot de passe | Aucun appel réseau ; bascule locale du `type` et de `aria-pressed` | `handleUnmaskPassword` (`utils/unmask.js:6-16`) |
| Sélection d'un autre avatar | Aucun appel réseau ; changement natif de `input:checked` | — |
| Soumission, mots de passe différents | Aucun appel réseau ; validation bloquée avant tout `fetch` | `fail("The two passwords do not match.")` (`register.js:175-179`) |
| Soumission valide côté client | `GET /api/set-csrf-token/` puis `POST /api/register/` | `{ username, email, password, avatar_url }` (`register.js:192-207`) |
| Réponse serveur : succès | Aucun événement socket — navigation SPA | `navigateTo("/dashboard")`, jetons et identité écrits dans `sessionStorage` (`register.js:216-228`) |
| Réponse serveur : refus (nom pris / email pris / autre) | Aucun appel supplémentaire | `fail(data.error ?? "Could not create the account.")` (`register.js:229-231`) |
| Délai dépassé (60 000 ms) ou réseau indisponible | Aucun appel supplémentaire | `fail(...)`, message selon `error.name === "TimeoutError"` (`register.js:232-238`) |
| Clic sur « Register with 42 » | Navigation plein document, hors SPA | `window.location.href = "/api/auth/42/login/"` (`register.js:255-260`) |
| Clic sur « Back » | Navigation SPA | `navigateTo("/")` (`register.js:245-253`) |

---

## Transitions & Animations

**Entrée / sortie de l'écran.** Aucune transition dédiée : le remplacement
du contenu se fait par `innerHTML`, synchrone (`register.js:149-150`) — la
carte apparaît et disparaît d'un bloc, sans fondu ni glissement, dans les
deux sens (arrivée depuis `/` ou `/login`, départ vers `/dashboard` ou
`/`).

**Sélection d'avatar.** Triple transition (opacité, `transform: scale`,
`box-shadow`), 200 ms, implicite (`register.css:95`) — détail complet dans
[Rangée d'avatars](../ux/interaction-patterns.md#rangée-davatars). Sous
`prefers-reduced-motion: reduce`, la transition est coupée localement
(`register.css:110-114`) : le changement d'avatar reste instantané mais
reste visible (opacité, échelle et halo changent quand même, sans
animation).

**Survol des boutons.** Agrandissement à 1,05 en 200 ms
(`--ease-transform`), neutralisé globalement sous
`prefers-reduced-motion: reduce` (`tokens.css:107-125`) ; la couleur de
fond continue de transitionner en 300 ms (`--ease-color`), jamais coupée.

**Bordure des champs au survol.** 300 ms, `--ease-color`
(`tokens.css:186`) — conservée sous mouvement réduit, c'est un fondu de
couleur, pas un mouvement.

---

## Data Requirements

| Data | Source System | Read / Write | Update trigger | Null handling |
|---|---|---|---|---|
| Compte (username / display_name / mot de passe haché / email / avatar_url) | Django, `pong.CustomUser` (table `users`) | Write (création) | Soumission `POST /api/register/` réussie (`views.py:109-118`) | Champ vide ou invalide → `clean_display_name` lève `ValueError`, 400, aucune ligne créée |
| Unicité du nom de compte | Django, `User.objects.filter(username=…).exists()` | Read avant Write | À chaque soumission | Nom déjà pris → 400 « This username is already taken. » (`views.py:104-105`) |
| Unicité de l'email | Django, requête équivalente | Read avant Write | À chaque soumission | Email déjà utilisé → 400 « This email is already in use. » (`views.py:106-107`) |
| Jeton JWT (access / refresh) | Django, `pong.tokens.tokens_for_user` | Write vers `sessionStorage` côté client | Émis une seule fois, à l'inscription réussie | Jamais nul dans une réponse `success:true` — émis dans le même appel qui crée le compte (`views.py:120-129`) |
| Identité de session (`username`, `display_name`, `avatar_url` en `sessionStorage`) | Client uniquement — l'UI n'en est jamais propriétaire, elle reflète la réponse serveur | Write | À la réception de la réponse de succès | Si le serveur omettait un champ, repli sur la valeur locale saisie (`data.username ?? username`, etc., `register.js:218-226`) |
| Sept avatars proposés | Fichiers statiques, `frontend/public/avatars/` | Read seul | Au chargement du module (`AVATARS`, `register.js:16-24`) | Un fichier manquant casserait l'`<img>` sans repli visible — aucun `onerror` observé |
| Jeton CSRF | Django, `GET /api/set-csrf-token/`, cookie `csrftoken` | Read | Juste avant la soumission (`getCsrfToken()`, `register.js:192`) | Échec → remonte dans le `catch`, traité comme une erreur réseau générique (`register.js:232-238`) |

Aucun événement `socket.io` n'intervient sur cet écran : contrairement au
tableau de bord ou au jeu, `/register` n'ouvre aucune connexion temps réel.

---

## Accessibility

**Ordre de focus.** Détaillé et numéroté dans Interaction Map ci-dessus (10
arrêts de tabulation, plus le focus programmatique initial sur `h1`).

**Contrastes chiffrés**, calculés pour les paires réellement utilisées sur
cet écran (fond de carte `--night-raised` #1e1e1e, sauf mention contraire) :

| Paire | Ratio | Seuil applicable | Conforme |
|---|---|---|---|
| `--lava-orange` (titre, 35 px/700) sur `--night-raised` | 5,27:1 | 3:1 (grand texte) | Oui |
| `--lava-orange` (labels, 14 px/500) sur `--night-raised` | 5,27:1 | 4,5:1 (texte courant) | Oui |
| `--chalk` (texte saisi) sur `--field-slate` | 14,35:1 | 4,5:1 | Oui |
| `--muted-sand` (placeholder) sur `--field-slate` | 4,05:1 | 4,5:1 | **Non** |
| `--muted-sand` (indices mot de passe, 14 px) sur `--night-raised` | 4,71:1 | 4,5:1 | Oui, de justesse |
| `--on-accent` sur `--lava-orange` (Register, Back:hover) | 5,92:1 | 4,5:1 | Oui |
| `--on-accent` sur `--sunset-orange` (Register with 42) | 8,03:1 | 4,5:1 | Oui |
| `--lava-orange` (texte/bordure du bouton Back au repos) sur `--night-raised` | 5,27:1 | 3:1 (bordure) / 4,5:1 (texte) | Oui |
| `--coral-red-text` (`#registerError`) sur `--night-raised` | 6,56:1 | 4,5:1 | Oui |
| `--field-border` (bordure de champ au repos) sur `--night-raised` | 1,56:1 | 3:1 (bordure d'élément interactif) | **Non** |
| `--lava-orange-soft` (bordure de champ au survol) sur `--night-raised` | 6,08:1 | 3:1 | Oui |
| `--sun-gold` (anneau de focus) sur `--night-raised` | 11,02:1 | 3:1 | Oui |

Les deux échecs (placeholder, bordure de champ au repos) sont repris en
Open Questions avec leurs pointeurs.

**Annonces lecteur d'écran.**

| Changement d'état | Annonce | Politesse | Où |
|---|---|---|---|
| Erreur de formulaire (toute cause) | Texte du message | `assertive` (`role="alert"`) | `#registerError` (`register.js:127`) |
| Bouton en soumission | `aria-busy="true"` + nom accessible changé (« Creating your account… ») | Non enveloppé dans une région live dédiée — annonce dépendante de la technologie d'assistance, non garantie | `#registerbutton` (`feedback.js:64-75`) — voir Open Questions |
| Sélection d'un avatar | « Avatar 4 sur 7, sélectionné » (natif au groupe radio) | Native, non `aria-live` | Groupe `name="avatar"` |
| Bascule de visibilité d'un mot de passe | `aria-label` change (« Show password » ↔ « Hide password ») | Native au changement d'attribut, pas de région live | `.unmask` (`utils/unmask.js:13-14`) |
| Changement de route (arrivée sur cet écran) | Titre de document + focus déplacé sur `h1` | — | `announceRoute` (`app.js:18-24`) — pas d'annonce `aria-live` dédiée, écart déjà connu (`design/accessibility-requirements.md:57`) |

**Alternative non colorée à tout signal coloré.** L'erreur porte son texte
en plus de la teinte rouge (`role="alert"`, pas seulement `--coral-red-text`).
La sélection d'un avatar porte opacité, agrandissement et halo, pas
seulement une teinte (voir le motif référencé). Aucun point de présence en
ligne ni couleur d'équipe n'apparaît sur cet écran.

**Taille des cibles.** Tous les boutons `.btn` ≥ 44 px de hauteur ; boutons
de démasquage fixes à 44 × 44 px ; avatars 100 × 100 px (largement
au-dessus du plancher) ; aucune cible < 44 px identifiée.

**Focus à l'ouverture et à la fermeture.** À l'ouverture, le focus quitte
l'élément qui a déclenché la navigation (bouton « Create account » sur `/`
ou `/login`, désormais retiré du DOM) et se pose sur `h1.register-title`
(`tabindex="-1"`, `preventScroll: true`, `app.js:18-24`). À la fermeture —
vers `/dashboard`, `/` ou hors SPA vers `/api/auth/42/login/` — le
remplacement de l'écran est total (`innerHTML`) : rien n'est laissé
focalisable sur un nœud retiré du DOM, aucun piège de focus possible.

---

## Localization Considerations

L'interface de cet écran est intégralement en anglais (labels, textes
indicatifs, messages d'erreur, boutons) ; cette spécification est en
français, conformément à la convention du dépôt — l'interface elle-même ne
mélange pas les deux langues.

**Textes fixes, longueur non variable** : titre, labels, indices de mot de
passe, textes de bouton — pas de risque de rupture de mise en page, ils ne
dépendent d'aucune donnée utilisateur.

**Message d'erreur le plus long connu** : « The server did not answer
within a minute. It is hosted on a free tier and may still be starting —
try again. » (~118 caractères, `register.js:236`). `.field-error` n'a ni
`max-width` ni `white-space: nowrap` (`tokens.css:240-244`) : le texte
s'enroule sur plusieurs lignes dans une carte plafonnée à 600 px. À +40 %
(~165 caractères), le paragraphe grandirait seulement en hauteur, jamais en
largeur — pas de rupture de mise en page attendue.

**Longueur maximale du nom de compte / nom d'affichage.** Le serveur les
confond : `register_view` crée le compte avec `display_name=username`
(`views.py:114`) — ce que la personne tape ici devient à la fois son
identifiant de connexion et son nom montré partout ailleurs, alors que le
libellé du champ dit « Account name », jamais « Display name ». Règle
serveur : 3 à 50 caractères Unicode, lettres/chiffres/espaces/points/
tirets/soulignés (`clean_display_name`, `DISPLAY_NAME_RE`, `views.py:35`).
**Rien côté client ne porte cette limite** : `#username` n'a ni `maxlength`
ni `pattern`, et aucune liste d'indices n'apparaît sous ce champ
(contrairement au mot de passe) — voir Open Questions.

Une fois enregistré, un nom long n'est pas traité de façon homogène par le
reste du produit :

- En-tête du tableau de bord (`.header-name`) : tronqué par ellipsis à
  `max-width: 12rem` (`frontend/src/css/dashboard.css:626-633`).
- Arbre de tournoi (`#tournament-details span`) : tronqué par ellipsis à
  `max-width: 150px` (`frontend/src/css/game.css:580-588`).
- Liste d'amis (`.friend-row`, `.list-group-item`) et auteur d'un message
  de chat (`.username-link`) : **aucune règle de troncature déclarée**
  (`frontend/src/css/dashboard.css:76-123,221-229`) — un nom de 50
  caractères s'y enroule ou déborde selon la largeur réelle de la colonne
  (15 %, minimum 150 px, `docs/DESIGN.md` § Layout). Voir Open Questions.

---

## Acceptance Criteria

1. Le formulaire (titre, quatre champs, rangée d'avatars, trois boutons)
   est visible et utilisable en moins de 200 ms après la navigation vers
   `/register` : `register()` ne déclenche aucun appel réseau à
   l'ouverture — le réveil de l'API (jusqu'à 60 000 ms) n'intervient qu'à
   la soumission, jamais à l'affichage.
2. À 1440 × 900, la carte d'inscription est centrée horizontalement,
   plafonnée à 600 px de large, avec une marge visible de chaque côté.
3. À 390 × 844, la carte occupe la largeur utile de l'écran (moins les
   marges `--space-lg`), les sept avatars restent atteignables par
   défilement horizontal avec accrochage, et aucun bouton ne descend sous
   44 px de hauteur.
4. Aucun élément interactif n'est visible avant d'être actionnable : les
   sept radios d'avatar, les deux boutons de démasquage et les trois
   boutons d'action répondent dès leur premier rendu, sans délai
   d'hydratation ni état intermédiaire.
5. Un parcours clavier seul, de l'ouverture de la page au clic sur
   « Register », est possible sans jamais toucher la souris : dix arrêts de
   tabulation (voir Interaction Map), `Enter` soumet depuis n'importe quel
   champ texte.
6. En cas de mots de passe différents, le focus se déplace sur
   `#confirmPassword`, marqué `aria-invalid="true"`, et le message
   apparaît dans `#registerError` sans recharger la page.
7. Une inscription réussie ne demande jamais une seconde saisie des
   identifiants : la personne se retrouve sur `/dashboard`, connectée,
   dans le même geste que la création du compte.
8. Sous `prefers-reduced-motion: reduce`, la sélection d'un avatar reste
   instantanée (pas de transition d'opacité/échelle/halo) et
   l'agrandissement au survol des boutons est neutralisé, sans qu'aucune
   information ne disparaisse.

---

## Open Questions

- **`aria-invalid` mal attribué pour toute erreur serveur.**
  `register.js:167-171` (`fail()`) pose
  `confirmField.setAttribute("aria-invalid", "true")` sans condition sur la
  nature de l'erreur, et cette fonction est réutilisée telle quelle en
  `:230` pour « nom déjà pris », « email déjà utilisé », toute
  `IntegrityError` ou exception serveur, puis en `:232-238` pour un
  timeout ou un réseau indisponible. Un refus qui n'a rien à voir avec la
  confirmation du mot de passe marque quand même ce champ comme invalide.
  Défaut déjà nommé au catalogue (`design/ux/interaction-patterns.md`, Gap
  n° 2), qui y pose aussi la décision de contenu correspondante (« quel
  champ blâmer pour une erreur serveur générique ») — je la relaie, elle
  ne m'appartient pas.
- **Les règles de mot de passe affichées ne sont vérifiées nulle part.**
  Les deux indices (`register.js:78-80` : « At least 8 characters », « Not
  only digits, and not a common password ») ne sont liés à aucune
  validation JS avant soumission. Côté serveur, `register_view`
  (`src/django/app/pong/views.py:109-118`) appelle
  `User.objects.create_user`, dont le gestionnaire
  (`src/django/app/pong/models.py:7-13`) ne fait que `set_password()` —
  `django.contrib.auth.password_validation.validate_password()` n'est
  jamais appelé sur ce chemin. `AUTH_PASSWORD_VALIDATORS` est bien déclaré
  (longueur minimale, mot de passe courant, similarité au compte, mot de
  passe uniquement numérique — `src/django/app/ft_trans/settings.py:135-148`)
  mais n'est utilisé par aucune vue d'inscription. Un mot de passe d'un
  seul caractère est aujourd'hui accepté. Décision produit — faut-il
  appeler `validate_password` dans la vue, et vers quel champ remonter ses
  erreurs — pas une décision d'interaction.
- **Bordure de champ au repos sous le seuil de contraste.**
  `--field-border` (#3e3e3e, `tokens.css:33`) sur le fond de carte
  `--night-raised` (`register.css:8`) mesure 1,56:1, sous le minimum de
  3:1 que ce palier exige pour les bordures d'éléments interactifs. Le
  survol (6,08:1) et le focus (11,02:1) sont conformes ; c'est l'état de
  repos, seul visible avant toute interaction, qui ne l'est pas.
- **Placeholder sous le seuil de contraste.** `--muted-sand` sur
  `--field-slate` mesure 4,05:1, sous les 4,5:1 du texte courant
  (`tokens.css:32,193-195`). Impact réel limité — chaque champ a un
  `<label>` — mais le chiffre est sous le seuil déclaré par le palier
  Comprehensive.
- **Aucune limite ni indice visible sur le nom de compte avant
  soumission.** `#username` n'a ni `maxlength`, ni `pattern`, ni liste
  d'indices comparable à `#password-hints` ; la règle réelle (3 à 50
  caractères, `views.py:35-46`) n'apparaît nulle part avant l'échec.
  Combiné au premier point, un nom refusé pour sa forme revient marqué sur
  le mauvais champ.
- **Pas de retour direct vers `/login` depuis `/register`.** Une personne
  venue de `/login` qui change d'avis ne peut revenir qu'en deux étapes :
  « Back » (`register.js:247-253`) renvoie à `/`, jamais à `/login` —
  contrairement à `/login`, qui offre un aller direct vers `/register`
  (`login.js:100-106`). Choix de flux, pas un bug technique.
- **Le champ « Account name » fixe aussi le nom d'affichage, sans le
  dire.** Le serveur crée le compte avec `display_name=username`
  (`views.py:114`) : ce qui est saisi ici sert à la fois d'identifiant de
  connexion et de nom montré dans le chat, la liste d'amis et l'arbre de
  tournoi. L'écran ne le mentionne pas ; la personne ne découvre l'un des
  deux usages qu'en le changeant plus tard dans les Paramètres
  (`UI-SET-1`).
- **Troncature d'un nom long incohérente selon l'écran de destination.**
  Tronqué par ellipsis dans l'en-tête du tableau de bord
  (`dashboard.css:626-633`) et l'arbre de tournoi (`game.css:580-588`),
  mais pas du tout dans la liste d'amis ni sur l'auteur d'un message de
  chat (`dashboard.css:76-123,221-229`, aucune règle `overflow`/
  `text-overflow` déclarée). Ce que devient un nom long dépend de l'écran
  où il apparaît ; cette spec ne peut pas garantir ce que le code ne
  garantit pas lui-même.
- **État « occupé » du bouton non porté par une région live dédiée.**
  `setBusy()` (`feedback.js:64-75`) change `aria-busy` et le texte du
  bouton dans le même appel — rien n'est « visible mais inerte » — mais ce
  changement n'est enveloppé par aucun `aria-live`. Son annonce dépend de
  la technologie d'assistance et de la position du focus au moment du
  clic ; non vérifiable sans test en conditions réelles, non couvert par
  `scripts/check-design.mjs`.
